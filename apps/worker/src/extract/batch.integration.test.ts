/**
 * Integration tests for the Batch flow (step 1.7) with a fake Gemini Batch API, on the synthetic
 * papers. Requires Supabase local with migrations applied: `pnpm db:reset`, then `pnpm test:db`.
 * The flow uses its own transactions, so tests clean up the rows they create instead of rolling back.
 */
import type pg from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { connect } from "../db/client.js";
import { answerKeyGenerator } from "../synthetic/answer-generator.js";
import { SYNTHETIC_PAPERS, type SyntheticPaper } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { batchBytes } from "./batch-client.js";
import type { BatchAnswer, BatchClient, BatchItem, BatchStatus } from "./batch-client.js";
import { type BatchDeps, listBatches, pollOnce, submitPaper } from "./batch.js";
import { Budget, BudgetExceeded, MemoryLedger, PgLedger, type SpendLedger } from "./budget.js";
import { extractFull } from "./extract-full.js";

const MODEL = "gemini-4-argon";
const AT = () => new Date("2026-10-19");
const HASHES = ["test-batch-a", "test-batch-b", "test-batch-c"];

let db: pg.Client;
const pdfs = new Map<string, Uint8Array>();

beforeAll(async () => {
  db = await connect();
  for (const p of SYNTHETIC_PAPERS) pdfs.set(p.id, await renderPdf(p.render));
  await clean();
});
afterEach(clean);
afterAll(async () => {
  await clean();
  await db.end();
});

async function clean() {
  await db.query("delete from api_spend where file_hash = any($1)", [HASHES]);
  await db.query("delete from batch_jobs where file_hash = any($1)", [HASHES]);
}

/** A fake Batch API: a job runs for `runningPolls` polls, then returns what `respond` gives for each request. */
class FakeBatch implements BatchClient {
  readonly created: { name: string; items: BatchItem[] }[] = [];
  private polls = new Map<string, number>();
  failNext: string | null = null;

  constructor(
    private readonly respond: (item: BatchItem) => Promise<BatchAnswer>,
    private readonly runningPolls = 1,
  ) {}

  async create(_model: string, items: BatchItem[]) {
    const name = `batches/fake-${this.created.length + 1}`;
    this.created.push({ name, items });
    return { name };
  }

  async get(name: string): Promise<BatchStatus> {
    const n = (this.polls.get(name) ?? 0) + 1;
    this.polls.set(name, n);
    if (this.failNext) return { providerState: "JOB_STATE_FAILED", state: "failed", error: this.failNext };
    if (n <= this.runningPolls) return { providerState: "JOB_STATE_RUNNING", state: "running" };
    const items = this.created.find((c) => c.name === name)!.items;
    return { providerState: "JOB_STATE_SUCCEEDED", state: "succeeded", answers: await Promise.all(items.map((i) => this.respond(i))) };
  }
}

function answersFrom(paper: SyntheticPaper, tamper?: Parameters<typeof answerKeyGenerator>[1]) {
  const { generate } = answerKeyGenerator(paper, tamper);
  return async (item: BatchItem): Promise<BatchAnswer> => {
    const { text, usage } = await generate(item.request);
    return { key: item.key, text, usage };
  };
}

/** Tests that look at the `api_spend` table pass a PgLedger; the others use memory, so real spending in the table cannot change their outcome. */
function setup(paper: SyntheticPaper, client: FakeBatch, limitUsd = 10, offsetUsd = 0, ledger: SpendLedger = new MemoryLedger()) {
  const saved = new Map<string, Record<string, unknown>>();
  const hash = HASHES[0]!;
  const deps: BatchDeps = {
    db,
    client,
    budget: new Budget(ledger, { limitUsd, offsetUsd }),
    model: MODEL,
    loadPdf: async () => pdfs.get(paper.id)!,
    saveResult: async (fileHash, result) => void saved.set(fileHash, result),
    now: AT,
  };
  return { deps, saved, hash, paper: { fileHash: hash, pdfPath: `raw_papers/zotero/${paper.id}.pdf` } };
}

/** Polls until the paper is done (or `max` polls), returning every event. */
async function runToEnd(deps: BatchDeps, max = 10) {
  const events: Awaited<ReturnType<typeof pollOnce>> = [];
  for (let i = 0; i < max; i++) {
    const batch = await pollOnce(deps);
    events.push(...batch);
    if (batch.some((e) => e.event === "done" || e.event === "failed")) break;
  }
  return events;
}

describe("Batch flow: submit → poll → ingest", () => {
  const paper = SYNTHETIC_PAPERS[2]!; // two studies

  it("extracts a paper in two batches and saves exactly what the synchronous extraction gives, at half the price", async () => {
    const client = new FakeBatch(answersFrom(paper));
    const { deps, saved, hash, paper: input } = setup(paper, client, 10, 0, new PgLedger(db));

    const submitted = await submitPaper(deps, input);
    expect(submitted).toMatchObject({ status: "submitted", jobName: "batches/fake-1" });
    expect(client.created[0]!.items.map((i) => i.key)).toEqual(["paper_structure", "paper_discussion"]);

    const events = await runToEnd(deps);
    expect(events.map((e) => e.event)).toEqual(["running", "next_phase_submitted", "running", "done"]);
    // Second batch: 4 calls for each of the 2 studies, named by study index.
    expect(client.created[1]!.items.map((i) => i.key)).toEqual(
      [0, 1].flatMap((i) => ["study_design_sample_bias", "study_measurements", "study_paths", "study_tables"].map((p) => `${i}:${p}`)),
    );
    expect(client.created[1]!.items[0]!.request.prompt).toContain('study labelled "Study 1"');

    const result = saved.get(hash)!;
    const sync = await extractFull(pdfs.get(paper.id)!, { model: MODEL, generate: answerKeyGenerator(paper).generate });
    expect(result).toMatchObject({ status: "done", batch: true, model: MODEL, file: `${paper.id}.pdf` });
    expect(result.structure).toEqual(sync.structure);
    expect(result.discussion).toEqual(sync.discussion);
    expect(result.studies).toEqual(sync.studies);
    expect(result.costUsd as number).toBeCloseTo(sync.costUsd! / 2, 8);
    expect((result.calls as unknown[]).length).toBe(10);

    // Every call is in the spend ledger once, flagged as Batch.
    const spend = await db.query<{ pass: string; batch: boolean; cost_usd: string }>("select pass, batch, cost_usd from api_spend where file_hash = $1", [hash]);
    expect(spend.rows).toHaveLength(10);
    expect(spend.rows.every((r) => r.batch)).toBe(true);
    expect(spend.rows.reduce((n, r) => n + Number(r.cost_usd), 0)).toBeCloseTo(result.costUsd as number, 5);
    expect((await listBatches(db)).filter((b) => b.file_hash === hash).map((b) => `${b.phase}:${b.state}`).sort()).toEqual(["structure:ingested", "study_parts:ingested"]);
  });

  it("does not submit a paper twice, and polling again after the end does nothing", async () => {
    const client = new FakeBatch(answersFrom(paper), 0);
    const { deps, paper: input } = setup(paper, client);
    await submitPaper(deps, input);
    expect(await submitPaper(deps, input)).toMatchObject({ status: "already_submitted", jobName: "batches/fake-1" });
    expect(client.created).toHaveLength(1);
    await runToEnd(deps);
    expect(await submitPaper(deps, input)).toMatchObject({ status: "already_submitted", state: "ingested" });
    expect(await pollOnce(deps)).toEqual([]);
    expect(client.created).toHaveLength(2);
  });

  it("stops before submitting when the cap would be passed: nothing created, nothing stored", async () => {
    const client = new FakeBatch(answersFrom(paper));
    const { deps, hash, paper: input } = setup(paper, client, 10, 9.99);
    await expect(submitPaper(deps, input)).rejects.toBeInstanceOf(BudgetExceeded);
    expect(client.created).toHaveLength(0);
    expect((await listBatches(db)).filter((b) => b.file_hash === hash)).toEqual([]);
  });

  it("sets money aside for jobs still running, so papers submitted together cannot pass the cap", async () => {
    const client = new FakeBatch(answersFrom(paper));
    // Room for exactly one paper: a 5-page paper is set aside at about $0.12 at Batch price.
    const { deps, paper: input } = setup(paper, client, 0.15);
    await submitPaper(deps, input);
    await expect(submitPaper(deps, { ...input, fileHash: HASHES[1]! })).rejects.toBeInstanceOf(BudgetExceeded);
    expect(client.created).toHaveLength(1);
  });

  it("marks a failed provider job as failed and allows a new submission", async () => {
    const client = new FakeBatch(answersFrom(paper), 0);
    client.failNext = "quota exceeded";
    const { deps, hash, paper: input } = setup(paper, client);
    await submitPaper(deps, input);
    const events = await pollOnce(deps);
    expect(events).toMatchObject([{ event: "failed", detail: "quota exceeded" }]);
    expect((await listBatches(db)).find((b) => b.file_hash === hash)).toMatchObject({ state: "failed", error: "quota exceeded" });
    client.failNext = null;
    expect(await submitPaper(deps, input)).toMatchObject({ status: "submitted", jobName: "batches/fake-2" });
  });

  it("books the cost of a batch whose answer is unusable, keeps the raw text, and fails the job", async () => {
    const client = new FakeBatch(answersFrom(paper, { tamper: (pass) => (pass === "paper_discussion" ? "Sorry, I cannot" : null) }), 0);
    const { deps, hash, paper: input } = setup(paper, client, 10, 0, new PgLedger(db));
    await submitPaper(deps, input);
    const events = await pollOnce(deps);
    expect(events).toMatchObject([{ event: "failed", detail: expect.stringContaining("paper_discussion: Gemini did not return valid JSON") }]);
    const row = await db.query<{ state: string; payload: { failed_raw: Record<string, string> } }>("select state, payload from batch_jobs where file_hash = $1", [hash]);
    expect(row.rows[0]!.state).toBe("failed");
    expect(row.rows[0]!.payload.failed_raw.paper_discussion).toBe("Sorry, I cannot");
    const spend = await db.query("select 1 from api_spend where file_hash = $1", [hash]);
    expect(spend.rowCount).toBe(2); // both answers were paid for
  });

  it("keeps the first phase safe and waits when there is no budget left for the second", async () => {
    const client = new FakeBatch(answersFrom(paper), 0);
    // The first phase is allowed, then the cap is tightened before the second is submitted.
    const { deps, saved, hash, paper: input } = setup(paper, client, 10);
    await submitPaper(deps, input);
    const tight = { ...deps, budget: new Budget(new MemoryLedger(), { limitUsd: 10, offsetUsd: 9.99 }) };
    const first = await pollOnce(tight);
    expect(first).toMatchObject([{ event: "waiting_for_budget" }]);
    expect(client.created).toHaveLength(1);
    expect((await listBatches(db)).find((b) => b.file_hash === hash)).toMatchObject({ phase: "structure", state: "succeeded" });
    const second = await runToEnd(deps); // budget restored
    expect(second.at(-1)).toMatchObject({ event: "done" });
    expect(saved.has(hash)).toBe(true);
  });

  it("finishes at once for a paper without studies (a conceptual paper or a review)", async () => {
    const client = new FakeBatch(
      answersFrom(paper, {
        tamper: (pass, answer) => (pass === "paper_structure" ? JSON.stringify({ ...(answer as object), paper_type: "conceptual", studies: [] }) : null),
      }),
      0,
    );
    const { deps, saved, hash, paper: input } = setup(paper, client);
    await submitPaper(deps, input);
    expect(await pollOnce(deps)).toMatchObject([{ event: "done" }]);
    expect(client.created).toHaveLength(1);
    expect(saved.get(hash)).toMatchObject({ status: "done", studies: [] });
  });
});

describe("inline size", () => {
  it("counts base64 PDF bytes towards the 20 MB inline limit", () => {
    const item = { key: "k", request: { model: MODEL, pdf: new Uint8Array(3_000_000), instructions: "", prompt: "", jsonSchema: {} } };
    expect(batchBytes([item, item])).toBe(2 * 4_000_000);
  });
});
