/**
 * Worker CLI (Giai đoạn 1).
 *   pnpm worker extract [--limit N]   run the pipeline on the Zotero inbox (step 1.2: S1–S3)
 *   pnpm worker status                count pipeline_runs by step and status
 *   pnpm worker spend                 money spent and left of the cap (GEMINI_BUDGET_LIMIT)
 *   pnpm worker estimate              cost of the queue before anything is sent (step 1.7)
 *   pnpm worker batch submit [--limit N] [--yes] | poll [--wait [minutes]] | status   (step 1.7)
 * Uses a READ-ONLY Zotero key (Mục 3.3) and the local Supabase database.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { geminiConfig, loadEnv, REPO_ROOT, zoteroConfig } from "../config.js";
import { connect } from "../db/client.js";
import { geminiBatchClient } from "../extract/batch-client.js";
import { type BatchDeps, listBatches, pollOnce, submitPaper } from "../extract/batch.js";
import { Budget, BudgetExceeded, budgetConfigFromEnv, PgLedger } from "../extract/budget.js";
import { estimatePaper } from "../extract/estimate.js";
import { realClock } from "../extract/limits.js";
import { fetchCrossref } from "../metadata/crossref.js";
import { ingestInbox, type PaperOutcome } from "../pipeline/ingest.js";
import { loadQueue, resultFile } from "../pipeline/queue.js";
import { readOnlyKeyProblems, ZoteroClient } from "../zotero/client.js";
import { findCollection, inboxPath, listInbox } from "../zotero/inbox.js";

const PDF_DIR = path.join(REPO_ROOT, "raw_papers", "zotero");
const EXTRACTED_DIR = path.join(REPO_ROOT, "extracted_data");

type Db = Awaited<ReturnType<typeof connect>>;

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const usd = (n: number | null) => (n === null ? "?" : `$${n.toFixed(2)}`);

async function extract(args: string[]): Promise<number> {
  const limit = option(args, "--limit") ? Number(option(args, "--limit")) : Infinity;
  if (!(limit > 0)) {
    console.error("--limit must be a positive number");
    return 1;
  }
  const config = zoteroConfig();
  const zotero = new ZoteroClient(config);
  const problems = readOnlyKeyProblems(await zotero.keyInfo(), config.userId);
  if (problems.length) {
    console.error(`Zotero key not suitable for this phase:\n  - ${problems.join("\n  - ")}`);
    return 1;
  }
  const inbox = inboxPath(process.env.ZOTERO_INBOX_PATH);
  const collectionKey = await findCollection(zotero, inbox);
  if (!collectionKey) {
    console.error(`Collection "${inbox.join(" › ")}" not found (see pnpm zotero:inbox).`);
    return 1;
  }
  const papers = (await listInbox(zotero, collectionKey)).slice(0, limit);
  console.log(`Inbox "${inbox.join(" › ")}": ${papers.length} item(s)\n`);

  const db = await connect();
  try {
    const results = await ingestInbox(
      { db, zotero, crossref: (doi) => fetchCrossref(doi), pdfDir: PDF_DIR, repoRoot: REPO_ROOT, log: console.log },
      papers,
    );
    const count = (o: PaperOutcome) => results.filter((r) => r.outcome === o).length;
    console.log(
      `\nSummary: ${count("processed")} processed, ${count("up_to_date")} up to date, ${count("duplicate")} duplicate, ` +
        `${count("no_pdf")} without PDF, ${count("failed")} failed; ${results.filter((r) => r.downloaded).length} PDF downloaded.`,
    );
    return count("failed") ? 1 : 0;
  } finally {
    await db.end();
  }
}

async function status(): Promise<number> {
  const db = await connect();
  try {
    const res = await db.query<{ step: string; status: string; n: string }>(
      `select step, status, count(*) as n from pipeline_runs
       group by step, status order by length(step), step, status`,
    );
    if (!res.rows.length) console.log("pipeline_runs is empty.");
    for (const r of res.rows) console.log(`${r.step.padEnd(4)} ${r.status.padEnd(8)} ${r.n}`);
    return 0;
  } finally {
    await db.end();
  }
}

function newBudget(db: Db): Budget {
  loadEnv();
  return new Budget(new PgLedger(db), budgetConfigFromEnv());
}

/** pnpm worker spend: what has been spent and what is left of the cap. */
async function spend(): Promise<number> {
  const db = await connect();
  try {
    const budget = newBudget(db);
    const batchSpent = await db.query<{ total: string }>("select coalesce(sum(cost_usd), 0) as total from api_spend where batch");
    const offset = budget.config.offsetUsd ?? 0;
    const spent = await budget.spentUsd();
    console.log(`Spent    : ${usd(spent)}  (ledger ${usd(spent - offset)} + earlier ${usd(offset)} from GEMINI_SPENT_OFFSET_USD; Batch ${usd(Number(batchSpent.rows[0]!.total))})`);
    console.log(`Cap      : ${usd(budget.config.limitUsd)}  (GEMINI_BUDGET_LIMIT)`);
    console.log(`Remaining: ${usd(await budget.remainingUsd())}`);
    return 0;
  } finally {
    await db.end();
  }
}

/** pnpm worker estimate: cost of the whole queue before anything is sent. */
async function estimate(): Promise<number> {
  const gemini = geminiConfig();
  const db = await connect();
  try {
    const queue = await loadQueue(db, EXTRACTED_DIR);
    const budget = newBudget(db);
    console.log(
      `Model ${gemini.strongModel} · ${queue.length} paper(s) in the queue · one study assumed per paper · ` +
        `input tokens estimated from the page count (measured on billed calls)\n`,
    );
    let standard = 0;
    let batch = 0;
    for (const paper of queue) {
      const sync = estimatePaper(gemini.strongModel, paper.pages, 1);
      const half = estimatePaper(gemini.strongModel, paper.pages, 1, { batch: true });
      standard += sync.costUsd ?? 0;
      batch += half.costUsd ?? 0;
      console.log(`  ${String(paper.pages).padStart(3)} pages  ${usd(sync.costUsd).padStart(6)} standard  ${usd(half.costUsd).padStart(6)} Batch   ${(paper.title ?? paper.fileHash.slice(0, 12)).slice(0, 60)}`);
    }
    const remaining = await budget.remainingUsd();
    console.log(`\nTotal    : ${usd(standard)} standard · ${usd(batch)} Batch (half price, results within 24 h)`);
    console.log(`Remaining: ${usd(remaining)} of ${usd(budget.config.limitUsd)}`);
    if (standard > remaining) console.log("The standard cost passes the remaining budget: the worker would stop before the cap.");
    return 0;
  } finally {
    await db.end();
  }
}

function batchDeps(db: Db, budget: Budget, model: string, apiKey: string): BatchDeps {
  return {
    db,
    client: geminiBatchClient(apiKey),
    budget,
    model,
    loadPdf: async (pdfPath) => new Uint8Array(await readFile(path.join(REPO_ROOT, pdfPath))),
    saveResult: async (fileHash, result) => {
      await mkdir(EXTRACTED_DIR, { recursive: true });
      await writeFile(resultFile(EXTRACTED_DIR, fileHash), JSON.stringify(result, null, 2));
    },
    log: console.log,
  };
}

/** pnpm worker batch submit [--limit N] [--yes] | poll [--wait [minutes]] | status */
async function batch(args: string[]): Promise<number> {
  const [sub, ...rest] = args;
  const gemini = geminiConfig();
  const db = await connect();
  try {
    const budget = newBudget(db);
    const deps = batchDeps(db, budget, gemini.strongModel, gemini.apiKey);

    if (sub === "status") {
      const rows = await listBatches(db);
      if (!rows.length) console.log("No Batch jobs yet.");
      for (const r of rows) {
        console.log(
          `${r.submitted_at.toISOString().slice(0, 16)}  ${r.phase.padEnd(11)} ${r.state.padEnd(9)} ${(r.gemini_state ?? "-").padEnd(20)} ${r.file_hash.slice(0, 12)}  ` +
            `${r.cost_usd ? usd(Number(r.cost_usd)) : ""}${r.error ? `  ${r.error.slice(0, 80)}` : ""}`,
        );
      }
      return 0;
    }

    if (sub === "submit") {
      // One paper by default: nothing is sent in bulk unless asked for with --limit.
      const limit = Number(option(rest, "--limit") ?? 1);
      const queue = (await loadQueue(db, EXTRACTED_DIR)).slice(0, limit);
      const planned = queue.map((p) => ({ p, est: estimatePaper(gemini.strongModel, p.pages, 1, { batch: true }) }));
      const total = planned.reduce((n, x) => n + (x.est.costUsd ?? 0), 0);
      console.log(`${queue.length} paper(s), about ${usd(total)} at Batch price (one study assumed per paper); remaining budget ${usd(await budget.remainingUsd())}`);
      for (const { p, est } of planned) console.log(`  ${p.pages} pages  ${usd(est.costUsd)}  ${(p.title ?? p.fileHash.slice(0, 12)).slice(0, 70)}`);
      if (!rest.includes("--yes")) {
        console.log("\nNothing sent. Add --yes to submit.");
        return 0;
      }
      for (const { p } of planned) {
        try {
          const r = await submitPaper(deps, { fileHash: p.fileHash, pdfPath: p.pdfPath });
          console.log(r.status === "submitted" ? `submitted ${r.jobName}` : `already in a Batch (${r.jobName}, ${r.state})`);
        } catch (error) {
          if (error instanceof BudgetExceeded) {
            console.error(`\n${error.message}\nStopped before sending anything more.`);
            return 1;
          }
          throw error;
        }
      }
      return 0;
    }

    if (sub === "poll") {
      const wait = rest.includes("--wait");
      const minutes = Number(rest[rest.indexOf("--wait") + 1]) || 5;
      for (;;) {
        const events = await pollOnce(deps);
        for (const e of events) console.log(`${e.fileHash.slice(0, 12)} ${e.phase.padEnd(11)} ${e.event}: ${e.detail}`);
        if (!events.length) console.log("Nothing waiting.");
        const open = (await listBatches(db)).some((b) => b.state === "submitted" || b.state === "succeeded");
        if (!wait || !open) return events.some((e) => e.event === "failed") ? 1 : 0;
        await realClock.sleep(minutes * 60_000);
      }
    }
    console.error("Usage: pnpm worker batch submit [--limit N] [--yes] | poll [--wait [minutes]] | status");
    return 1;
  } finally {
    await db.end();
  }
}

async function main(): Promise<number> {
  const [command, ...args] = process.argv.slice(2);
  if (command === "extract") return extract(args);
  if (command === "status") return status();
  if (command === "spend") return spend();
  if (command === "estimate") return estimate();
  if (command === "batch") return batch(args);
  console.error("Usage: pnpm worker extract [--limit N] | status | spend | estimate | batch submit|poll|status");
  return 1;
}

process.exitCode = await main();
