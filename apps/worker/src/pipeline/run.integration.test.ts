/**
 * Integration tests for the end-to-end run (step 1.9) on a synthetic paper with a fake Gemini.
 * Requires Supabase local: `pnpm db:reset`, then `pnpm test:db`.
 */
import { appendFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connect } from "../db/client.js";
import { Budget, MemoryLedger } from "../extract/budget.js";
import { CheckpointStore } from "../extract/checkpoint.js";
import type { GeneratePdfJson } from "../extract/gemini.js";
import { guardedGenerator } from "../extract/guarded.js";
import { sha256 } from "../pdf/text-layer.js";
import { answerKeyGenerator } from "../synthetic/answer-generator.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { hasFinishedExtraction } from "./queue.js";
import { runPaper, summariseCost } from "./run.js";

const paper = SYNTHETIC_PAPERS[0]!;
let db: pg.Client;
let dir: string;
let pdf: Uint8Array;
let fileHash: string;

beforeAll(async () => {
  db = await connect();
  dir = await mkdtemp(path.join(tmpdir(), "rd-run-"));
  pdf = await renderPdf(paper.render);
  fileHash = sha256(pdf);
  await mkdir(path.join(dir, "pdf"), { recursive: true });
  await writeFile(path.join(dir, "pdf", "paper.pdf"), pdf);
});
afterAll(async () => {
  await db.query("delete from papers where file_hash = $1", [fileHash]);
  await db.query("delete from pipeline_runs where file_hash = $1", [fileHash]);
  await rm(dir, { recursive: true, force: true });
  await db.end();
});

const queued = () => ({ fileHash, pdfPath: "pdf/paper.pdf", title: "Synthetic", pages: 4 });
const callsFile = () => path.join(dir, "extracted", fileHash.slice(0, 16) + ".calls.jsonl");

function deps(limitUsd = 10) {
  const { generate, requests } = answerKeyGenerator(paper);
  const ledger = new MemoryLedger();
  const budget = new Budget(ledger, { limitUsd });
  return {
    requests,
    ledger,
    value: {
      db,
      model: "gemini-4-argon",
      repoRoot: dir,
      extractedDir: path.join(dir, "extracted"),
      generate,
      guard: (g: GeneratePdfJson, hash: string) => guardedGenerator(g, { budget, fileHash: hash, now: () => new Date("2026-10-19") }),
    },
  };
}

describe("runPaper", () => {
  it("extracts, checks and publishes a queued paper, and reports what it cost", async () => {
    const d = deps();
    const outcome = await runPaper(d.value, queued());
    expect(outcome.status).toBe("done");
    if (outcome.status !== "done") return;
    const r = outcome.report;
    expect(r).toMatchObject({ source: "sync", studies: 1, calls: 6, pages: 4, completeness: "complete", hidden: 0, attention: 0 });
    expect(r.verified).toBeGreaterThan(50);
    expect(r.costUsd).toBeGreaterThan(0);
    expect(d.requests).toHaveLength(6);
    const row = await db.query("select p.paper_type, (select count(*) from path_results x where x.paper_id = p.id) as paths from papers p where p.file_hash = $1", [fileHash]);
    expect(row.rows[0]).toMatchObject({ paper_type: "empirical_quant", paths: "3" });
  });

  it("does not ask the AI again for a paper whose extraction is saved (resume after a stop)", async () => {
    const d = deps();
    const outcome = await runPaper(d.value, queued());
    expect(d.requests).toHaveLength(0);
    expect(outcome).toMatchObject({ status: "done", report: { source: "saved", calls: 6 } });
  });

  it("stops before the call that would pass the cap, sending nothing", async () => {
    await rm(path.join(dir, "extracted"), { recursive: true, force: true });
    const d = deps(0.001);
    const outcome = await runPaper(d.value, queued());
    expect(outcome.status).toBe("budget_stop");
    expect(d.requests).toHaveLength(0);
  });

  it("reports an extraction that fails with what it cost, and keeps going", async () => {
    await rm(path.join(dir, "extracted"), { recursive: true, force: true });
    const { generate } = answerKeyGenerator(paper, { tamper: (pass) => (pass === "study_paths" ? '{"paths": [{"estimate": "high"}]}' : null) });
    const outcome = await runPaper({ ...deps().value, generate }, queued());
    expect(outcome).toMatchObject({ status: "extraction_failed" });
    if (outcome.status === "extraction_failed") {
      expect(outcome.message).toMatch(/study_paths/);
      expect(outcome.costUsd).toBeGreaterThan(0);
    }
    // A failed extraction is not a finished one: the next run asks again.
    expect(await hasFinishedExtraction(path.join(dir, "extracted"), fileHash)).toBe(false);
  });
});

describe("two runs on the same paper (the first real run paid about $3.5 twice)", () => {
  it("lets only one run work on a paper, and the other one sends and spends nothing", async () => {
    await rm(path.join(dir, "extracted"), { recursive: true, force: true });
    const other = await connect(); // another process, with its own connection
    try {
      await other.query("select pg_advisory_lock(hashtextextended($1, 0))", [fileHash]); // it is working on the paper
      const d = deps();
      const outcome = await runPaper(d.value, queued());
      expect(outcome).toMatchObject({ status: "busy", fileHash });
      expect(d.requests).toHaveLength(0);
      expect(d.ledger.entries).toHaveLength(0);
    } finally {
      await other.end(); // a closed connection (or a crashed run) releases its lock
    }
    const d2 = deps();
    expect((await runPaper(d2.value, queued())).status).toBe("done");
    expect(d2.requests).toHaveLength(6);
  });

  it("releases the lock when a run ends, also after an error", async () => {
    await rm(path.join(dir, "extracted"), { recursive: true, force: true });
    const dies: GeneratePdfJson = async () => {
      throw new Error("boom");
    };
    await expect(runPaper({ ...deps().value, generate: dies }, queued())).rejects.toThrow("boom");
    const probe = await connect();
    try {
      const free = await probe.query<{ ok: boolean }>("select pg_try_advisory_lock(hashtextextended($1, 0)) as ok", [fileHash]);
      expect(free.rows[0]!.ok).toBe(true);
    } finally {
      await probe.end();
    }
  });
});

describe("a run that stops half-way (the first real run lost 10 paid calls, $1.49)", () => {
  it("keeps every paid answer on disk, and the next run reuses them without asking or paying again", async () => {
    await rm(path.join(dir, "extracted"), { recursive: true, force: true });
    // The database connection (or the whole machine) dies while the 4th call is being made.
    const { generate: real } = answerKeyGenerator(paper);
    let calls = 0;
    const dies: GeneratePdfJson = async (request) => {
      if (++calls === 4) throw new Error("terminating connection due to administrator command");
      return real(request);
    };
    const first = deps();
    await expect(runPaper({ ...first.value, generate: dies }, queued())).rejects.toThrow(/terminating connection/);
    expect(first.ledger.entries).toHaveLength(3);
    const saved = (await readFile(callsFile(), "utf8")).trim().split("\n");
    expect(saved).toHaveLength(3); // the three answers already paid for are on disk

    const second = deps();
    const logged: string[] = [];
    const outcome = await runPaper({ ...second.value, log: (l) => logged.push(l) }, queued());
    expect(outcome.status).toBe("done");
    expect(second.requests).toHaveLength(3); // only the 3 calls that were never made
    expect(second.ledger.entries).toHaveLength(3); // the 3 replayed ones are not booked again
    expect(logged.join("\n")).toMatch(/3 paid answer\(s\) saved from an earlier run will be reused/);
    if (outcome.status === "done") expect(outcome.report.calls).toBe(6);
  });

  it("asks again when the prompt changed, and ignores a half-written last line", async () => {
    await rm(path.join(dir, "extracted"), { recursive: true, force: true });
    const store = await CheckpointStore.open(callsFile());
    const request = { model: "m", pdf: new Uint8Array(1), instructions: "i", prompt: "p", jsonSchema: {} };
    await store.append(request, { text: "{}", usage: { inputTokens: 1, outputTokens: 1 } });
    await appendFile(callsFile(), '{"key":"abc","text":"cut sho');
    const reopened = await CheckpointStore.open(callsFile());
    expect(reopened.get(request)?.text).toBe("{}");
    expect(reopened.get({ ...request, prompt: "changed" })).toBeUndefined();
    expect(reopened.get({ ...request, jsonSchema: { type: "object" } })).toBeUndefined();
  });
});

describe("summariseCost", () => {
  it("gives the mean, the median, the price per page and a projection; papers without a price are left out", () => {
    const s = summariseCost([
      { costUsd: 0.4, pages: 20 },
      { costUsd: 0.6, pages: 20 },
      { costUsd: 1.1, pages: 40 },
      { costUsd: null, pages: 99 },
    ]);
    expect(s).toMatchObject({ papers: 3, totalUsd: 2.1, medianUsd: 0.6 });
    expect(s.meanUsd).toBeCloseTo(0.7, 10);
    expect(s.usdPerPage).toBeCloseTo(2.1 / 80, 10);
    expect(s.projectUsd(300)).toBeCloseTo(210, 6);
  });

  it("copes with no papers", () => {
    expect(summariseCost([])).toMatchObject({ papers: 0, totalUsd: 0, meanUsd: 0, medianUsd: 0, usdPerPage: 0 });
  });
});
