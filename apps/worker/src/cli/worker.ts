/**
 * Worker CLI (Giai đoạn 1).
 *   pnpm worker extract [--limit N]   run the pipeline on the Zotero inbox (step 1.2: S1–S3)
 *   pnpm worker status                count pipeline_runs by step and status
 *   pnpm worker spend                 money spent and left of the cap (GEMINI_BUDGET_LIMIT)
 *   pnpm worker estimate              cost of the queue before anything is sent (step 1.7)
 *   pnpm worker run [--limit N] [--paper X] [--yes]   extract, verify and publish queued papers under the cap (step 1.9)
 *   pnpm worker report                cost per paper, unit price and projection
 *   pnpm worker batch submit [--limit N] [--paper X] [--compare] [--yes] | poll [--wait [minutes]] | status   (step 1.7)
 *   pnpm worker manual export --paper X [--code NAME] [--force]   work packet for an external extractor such as Codex (step 1b.8a)
 *   pnpm worker manual check <packet> [--no-feedback]   validate the answers in a packet's out/ (no database, no keys; step 1b.8b)
 *   pnpm worker manual import <packet>|--all --tool codex --model <name> [--yes] [--no-backup]   publish a packet's answers, replacing the paper's data (step 1b.8c; preview without --yes)
 *   pnpm worker quality [--top N] [--source TEXT]     ✓ / ⚠ / ◇ / ẩn by study design, field and failed check (step 1b.1)
 *   pnpm worker compare --paper X     Batch result vs synchronous result, field by field (step 1.9c)
 * Uses a READ-ONLY Zotero key (Mục 3.3) and the local Supabase database.
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { geminiConfig, loadEnv, packetsDir, REPO_ROOT, zoteroConfig } from "../config.js";
import { checkPacket, formatCheck } from "../manual/check.js";
import { checkCode, exportPacket } from "../manual/export.js";
import { backupFile, importPacket, once, pgDumpViaDocker } from "../manual/import.js";
import { connect } from "../db/client.js";
import { refreshHighlights } from "../db/highlights.js";
import { geminiBatchClient } from "../extract/batch-client.js";
import { type BatchDeps, listBatches, pollOnce, submitPaper } from "../extract/batch.js";
import { Budget, BudgetExceeded, budgetConfigFromEnv, PgLedger } from "../extract/budget.js";
import { estimatePaper } from "../extract/estimate.js";
import { geminiGenerator } from "../extract/gemini.js";
import { guardedGenerator } from "../extract/guarded.js";
import { RateLimiter, rateLimitsFromEnv, realClock } from "../extract/limits.js";
import { fetchCrossref } from "../metadata/crossref.js";
import { ingestInbox, type PaperOutcome } from "../pipeline/ingest.js";
import { batchResultFile, loadExtracted, loadQueue, resultFile } from "../pipeline/queue.js";
import { type PaperReport, runPaper, summariseCost } from "../pipeline/run.js";
import { readTextLayer } from "../pdf/text-layer.js";
import type { SavedExtraction } from "../pipeline/extracted.js";
import { analysePaper } from "../verify/analyse.js";
import { type BadgeCounts, compareExtractions } from "../verify/compare.js";
import { formatQuality, loadQualityFields, summariseQuality } from "../report/quality.js";
import { readOnlyKeyProblems, ZoteroClient } from "../zotero/client.js";
import { findCollection, inboxPath, listInbox } from "../zotero/inbox.js";

const PDF_DIR = path.join(REPO_ROOT, "raw_papers", "zotero");
const EXTRACTED_DIR = path.join(REPO_ROOT, "extracted_data");

type Db = Awaited<ReturnType<typeof connect>>;

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

/** Papers of the queue picked with --paper (a part of the title, or the start of the file hash); all when absent. */
function pick<T extends { title: string | null; fileHash: string }>(queue: T[], args: string[]): T[] {
  const only = option(args, "--paper")?.toLowerCase();
  return only ? queue.filter((p) => p.fileHash.startsWith(only) || (p.title ?? "").toLowerCase().includes(only)) : queue;
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

/** pnpm worker run [--limit N] [--yes]: extract, verify and publish queued papers under the budget cap (step 1.9). */
async function run(args: string[]): Promise<number> {
  const limit = Number(option(args, "--limit") ?? 1);
  if (!(limit > 0)) {
    console.error("--limit must be a positive number");
    return 1;
  }
  const gemini = geminiConfig();
  const db = await connect();
  try {
    const budget = newBudget(db);
    const queue = pick(await loadQueue(db, EXTRACTED_DIR), args).slice(0, limit);
    const planned = queue.map((p) => ({ p, est: estimatePaper(gemini.strongModel, p.pages, 1) }));
    const total = planned.reduce((n, x) => n + (x.est.costUsd ?? 0), 0);
    console.log(`${queue.length} paper(s), about ${usd(total)} (one study assumed per paper; more studies cost more); remaining budget ${usd(await budget.remainingUsd())}`);
    for (const { p, est } of planned) console.log(`  ${String(p.pages).padStart(3)} pages  ${usd(est.costUsd).padStart(6)}  ${(p.title ?? p.fileHash.slice(0, 12)).slice(0, 70)}`);
    if (!args.includes("--yes")) {
      console.log("\nNothing sent. Add --yes to run.");
      return 0;
    }
    const limiter = new RateLimiter(rateLimitsFromEnv());
    const reports: PaperReport[] = [];
    for (const { p } of planned) {
      const outcome = await runPaper(
        {
          db,
          model: gemini.strongModel,
          repoRoot: REPO_ROOT,
          extractedDir: EXTRACTED_DIR,
          generate: geminiGenerator(gemini.apiKey),
          guard: (generate, fileHash) =>
            guardedGenerator(generate, {
              budget,
              limiter,
              fileHash,
              retry: { onRetry: ({ attempt, delayMs }) => console.log(`  … retry ${attempt} in ${(delayMs / 1000).toFixed(0)}s`) },
            }),
          log: console.log,
        },
        p,
      );
      if (outcome.status === "budget_stop") {
        console.error(`\n${outcome.message}\nStopped before sending anything more.`);
        break;
      }
      if (outcome.status === "busy") {
        console.error(`  … skipped: another run is already working on this paper`);
        continue;
      }
      if (outcome.status === "extraction_failed") {
        console.error(`  ✗ ${outcome.message} (spent ${usd(outcome.costUsd)}; raw answers kept in extracted_data/)`);
        continue;
      }
      const r = outcome.report;
      reports.push(r);
      console.log(
        `  ✓ ${r.studies} study, ${r.calls} calls, ${usd(r.costUsd)}, ${r.seconds}s · ✓ ${r.verified} ⚠ ${r.attention} ◇ ${r.interpreted} ẩn ${r.hidden} · ${r.completeness}${r.missing.length ? ` (${r.missing.join("; ")})` : ""}`,
      );
    }
    const s = summariseCost(reports);
    if (s.papers) console.log(`\nThis run: ${s.papers} paper(s), ${usd(s.totalUsd)}, mean ${usd(s.meanUsd)} per paper.`);
    console.log(`Budget: ${usd(await budget.spentUsd())} spent of ${usd(budget.config.limitUsd)}, ${usd(await budget.remainingUsd())} left.`);
    return 0;
  } finally {
    await db.end();
  }
}

/** pnpm worker report: cost per paper of every saved full extraction, the unit price and a projection. */
async function report(): Promise<number> {
  const db = await connect();
  try {
    const files = (await readdir(EXTRACTED_DIR)).filter((f) => f.endsWith(".full.json"));
    const rows: { file: string; pages: number; source: string; studies: number; calls: number; costUsd: number | null; input: number; output: number }[] = [];
    for (const f of files) {
      const d = JSON.parse(await readFile(path.join(EXTRACTED_DIR, f), "utf8")) as { status: string; model: string; file: string; file_hash: string; batch?: boolean; studies: unknown[]; calls: { costUsd: number | null; usage: { inputTokens: number; outputTokens: number } }[]; top_ups?: { calls: { costUsd: number | null; usage: { inputTokens: number; outputTokens: number } }[] }[] };
      if (d.status !== "done") continue;
      const calls = [...d.calls, ...(d.top_ups ?? []).flatMap((t) => t.calls)];
      const pages = (await db.query<{ page_count: number | null }>("select page_count from papers where file_hash = $1", [d.file_hash])).rows[0]?.page_count ?? 0;
      const costs = calls.map((c) => c.costUsd);
      rows.push({
        file: d.file,
        pages,
        source: d.batch ? "batch" : d.model.startsWith("manual:") ? "manual" : "sync",
        studies: d.studies.length,
        calls: calls.length,
        costUsd: costs.includes(null) ? null : costs.reduce<number>((n, c) => n + c!, 0),
        input: calls.reduce((n, c) => n + c.usage.inputTokens, 0),
        output: calls.reduce((n, c) => n + c.usage.outputTokens, 0),
      });
    }
    // Synthetic fixtures are test papers (4 pages): they say nothing about the price of real papers.
    const real = rows.filter((r) => !r.file.startsWith("synthetic-"));
    for (const r of real) console.log(`${r.file.slice(0, 44).padEnd(44)} ${String(r.pages).padStart(3)}p ${r.source.padEnd(5)} ${r.studies} study ${String(r.calls).padStart(2)} calls  ${usd(r.costUsd).padStart(6)}  ${(r.costUsd && r.pages ? `$${(r.costUsd / r.pages).toFixed(3)}/page` : "").padEnd(12)} in ${r.input} out ${r.output}`);
    for (const source of ["sync", "batch", "manual"]) {
      const s = summariseCost(real.filter((r) => r.source === source));
      if (s.papers) console.log(`\n${source}: ${s.papers} paper(s), mean ${usd(s.meanUsd)}, median ${usd(s.medianUsd)}, $${s.usdPerPage.toFixed(3)} per page`);
    }
    const sync = summariseCost(real.filter((r) => r.source === "sync"));
    if (sync.papers) {
      console.log(`\nProjection at the synchronous price (mean ${usd(sync.meanUsd)}): 100 papers ${usd(sync.projectUsd(100))} · 300 papers ${usd(sync.projectUsd(300))}`);
      console.log(`At the Batch price (half): 100 papers ${usd(sync.projectUsd(100) / 2)} · 300 papers ${usd(sync.projectUsd(300) / 2)}`);
    }
    const budget = newBudget(db);
    console.log(`Budget: ${usd(await budget.spentUsd())} spent of ${usd(budget.config.limitUsd)}, ${usd(await budget.remainingUsd())} left.`);
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
    saveResult: async (fileHash, result, purpose) => {
      await mkdir(EXTRACTED_DIR, { recursive: true });
      // A comparison result never replaces the real extraction.
      const file = purpose === "compare" ? batchResultFile(EXTRACTED_DIR, fileHash) : resultFile(EXTRACTED_DIR, fileHash);
      await writeFile(file, JSON.stringify(result, null, 2));
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
          `${r.submitted_at.toISOString().slice(0, 16)}  ${r.purpose.padEnd(7)} ${r.phase.padEnd(11)} ${r.state.padEnd(9)} ${(r.gemini_state ?? "-").padEnd(20)} ${r.file_hash.slice(0, 12)}  ` +
            `${r.cost_usd ? usd(Number(r.cost_usd)) : ""}${r.error ? `  ${r.error.slice(0, 80)}` : ""}`,
        );
      }
      return 0;
    }

    if (sub === "submit") {
      // One paper by default: nothing is sent in bulk unless asked for with --limit.
      const limit = Number(option(rest, "--limit") ?? 1);
      const compare = rest.includes("--compare");
      const purpose = compare ? "compare" : "extract";
      // --compare picks papers already extracted synchronously, and needs --paper so nothing is sent in bulk by mistake.
      if (compare && !option(rest, "--paper")) {
        console.error("--compare needs --paper X (a part of the title or the start of the file hash)");
        return 1;
      }
      const queue = pick(compare ? await loadExtracted(db, EXTRACTED_DIR) : await loadQueue(db, EXTRACTED_DIR), rest).slice(0, limit);
      const planned = queue.map((p) => ({ p, est: estimatePaper(gemini.strongModel, p.pages, 1, { batch: true }) }));
      const total = planned.reduce((n, x) => n + (x.est.costUsd ?? 0), 0);
      console.log(`${compare ? "COMPARE mode (result kept apart, not published) · " : ""}${queue.length} paper(s), about ${usd(total)} at Batch price (one study assumed per paper); remaining budget ${usd(await budget.remainingUsd())}`);
      for (const { p, est } of planned) console.log(`  ${p.pages} pages  ${usd(est.costUsd)}  ${(p.title ?? p.fileHash.slice(0, 12)).slice(0, 70)}`);
      if (!rest.includes("--yes")) {
        console.log("\nNothing sent. Add --yes to submit.");
        return 0;
      }
      for (const { p } of planned) {
        try {
          const r = await submitPaper(deps, { fileHash: p.fileHash, pdfPath: p.pdfPath, purpose });
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
    console.error("Usage: pnpm worker batch submit [--limit N] [--paper X] [--compare] [--yes] | poll [--wait [minutes]] | status");
    return 1;
  } finally {
    await db.end();
  }
}

/** pnpm worker compare --paper X: Batch result vs synchronous result of one paper, field by field, against the criteria of step 1.9c. */
async function compare(args: string[]): Promise<number> {
  const db = await connect();
  try {
    const papers = pick(await loadExtracted(db, EXTRACTED_DIR), args);
    if (!option(args, "--paper") || papers.length !== 1) {
      console.error(`Give --paper X matching exactly one extracted paper (matched ${papers.length}).`);
      return 1;
    }
    const p = papers[0]!;
    const batchFile = batchResultFile(EXTRACTED_DIR, p.fileHash);
    if (!existsSync(batchFile)) {
      console.error(`No Batch result for this paper yet (${path.basename(batchFile)}). Run: pnpm worker batch submit --compare --paper X --yes`);
      return 1;
    }
    const layer = await readTextLayer(new Uint8Array(await readFile(path.join(REPO_ROOT, p.pdfPath))));
    const load = async (file: string) => {
      const data = JSON.parse(await readFile(file, "utf8")) as SavedExtraction;
      return { data, analysis: analysePaper(layer, data) };
    };
    const c = compareExtractions(await load(resultFile(EXTRACTED_DIR, p.fileHash)), await load(batchFile));
    console.log(`${(p.title ?? p.fileHash.slice(0, 12)).slice(0, 80)}
`);
    const line = (name: string, b: BadgeCounts) => `  ${name.padEnd(6)} ✓ ${b.verified}  ⚠ ${b.attention}  ◇ ${b.interpreted}  ẩn ${b.hidden}`;
    console.log(line("sync", c.sync));
    console.log(line("batch", c.batch));
    console.log(`  keys: ${c.keys.shared} shared, ${c.keys.equal} equal, ${c.keys.different.length} different, ${c.keys.onlySync.length} only in sync, ${c.keys.onlyBatch.length} only in Batch`);
    const part = (a: { shared: number; equal: number }) => `${a.equal}/${a.shared}`;
    console.log(`  structured values ${part(c.agreement.structured)} equal; free text ${part(c.agreement.freeText)} equal; paired by content: ${c.paired.constructs} construct(s), ${c.paired.theories} theor(ies), ${c.paired.paths} path(s)
`);
    for (const d of c.keys.different.slice(0, 40)) console.log(`  ≠ ${d.key}: sync ${JSON.stringify(d.sync)} | batch ${JSON.stringify(d.batch)}`);
    if (c.keys.different.length > 40) console.log(`  … and ${c.keys.different.length - 40} more`);
    console.log("");
    for (const k of c.criteria) console.log(`  ${k.pass ? "PASS" : "FAIL"}  ${k.name}  (${k.detail})`);
    console.log(`
${c.pass ? "PASS" : "FAIL"}: ${p.fileHash.slice(0, 12)}`);
    return c.pass ? 0 : 2;
  } finally {
    await db.end();
  }
}

/** pnpm worker quality [--top N]: where the machine checks disagree with the extraction, from what is published. */
async function quality(args: string[]): Promise<number> {
  const top = Number(option(args, "--top") ?? 15);
  if (!(top > 0)) {
    console.error("--top must be a positive number");
    return 1;
  }
  const db = await connect();
  try {
    const source = option(args, "--source");
    console.log(formatQuality(summariseQuality(await loadQualityFields(db, source ? { source } : {})), top));
    return 0;
  } finally {
    await db.end();
  }
}

/** pnpm worker highlights [--paper X]: recompute where each quote sits on its PDF page (step 3a.3). No API call. */
async function highlights(args: string[]): Promise<number> {
  const only = option(args, "--paper");
  const db = await connect();
  try {
    const { rows } = await db.query<{ id: string; title: string | null; pdf_path: string }>(
      "select id, title, pdf_path from papers where pdf_path is not null and ($1::text is null or id::text like $1 || '%' or file_hash like $1 || '%') order by title",
      [only ?? null],
    );
    let withQuote = 0;
    let located = 0;
    for (const paper of rows) {
      const file = path.resolve(REPO_ROOT, paper.pdf_path);
      let pdf: Uint8Array;
      try {
        pdf = new Uint8Array(await readFile(file));
      } catch {
        console.log(`${(paper.title ?? paper.id).slice(0, 60).padEnd(60)} bỏ qua: không thấy file ${paper.pdf_path}`);
        continue;
      }
      const s = await refreshHighlights(db, paper.id, pdf);
      withQuote += s.withQuote;
      located += s.located;
      console.log(`${(paper.title ?? paper.id).slice(0, 60).padEnd(60)} ${String(s.located).padStart(4)}/${String(s.withQuote).padEnd(4)} (trang bên cạnh ${s.onNeighbour})`);
      for (const m of s.notLocated.slice(0, 3)) console.log(`    không định vị: ${m.naturalKey} · trang ${m.page} · “${m.quote.slice(0, 70)}”`);
    }
    console.log(`\nTổng: ${located}/${withQuote} câu trích được định vị (${withQuote ? Math.round((located / withQuote) * 1000) / 10 : 0}%).`);
    return 0;
  } finally {
    await db.end();
  }
}

/** pnpm worker manual import <packet>|--all --tool T --model M [--yes] [--no-backup] (step 1b.8c). Preview unless --yes. */
async function manualImport(args: string[]): Promise<number> {
  const tool = option(args, "--tool");
  const model = option(args, "--model");
  if (!tool || !model) {
    console.error("--tool (for example codex) and --model (for example gpt-6.1-sol-medium) are required: they are recorded as the source of the data");
    return 1;
  }
  const root = packetsDir();
  const flagValues = new Set([tool, model]);
  const named = args.filter((a) => !a.startsWith("--") && !flagValues.has(a));
  let packets = named.map((n) => (/[\\/:]/.test(n) ? path.resolve(n) : path.join(root, checkCode(n))));
  if (args.includes("--all")) {
    const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
    packets = entries.filter((e) => e.isDirectory() && existsSync(path.join(root, e.name, "packet.json"))).map((e) => path.join(root, e.name));
  }
  if (!packets.length) {
    console.error("Name a packet, or use --all");
    return 1;
  }
  const yes = args.includes("--yes");
  const container = process.env.SUPABASE_DB_CONTAINER?.trim() || "supabase_db_research-data";
  const backup = once(async () => {
    const file = backupFile(EXTRACTED_DIR);
    console.log(`Backing up the database to ${file} …`);
    await pgDumpViaDocker(container, file);
  });
  const db = await connect();
  let failed = 0;
  try {
    for (const dir of packets) {
      const name = path.basename(dir);
      const deps = { repoRoot: REPO_ROOT, extractedDir: EXTRACTED_DIR, log: console.log, ...(args.includes("--no-backup") ? {} : { backup }) };
      const outcome = await importPacket(db, deps, dir, { tool, model }, { yes });
      if (outcome.status === "invalid") {
        failed++;
        console.log(`${name}: NOT VALID, not imported:`);
        for (const e of outcome.errors) console.log(`    ${e.file}: ${e.message.slice(0, 200)}`);
      } else if (outcome.status === "unknown_paper") {
        failed++;
        console.log(`${name}: the paper (${outcome.fileHash.slice(0, 12)}) is not in the database; run "pnpm worker extract" first`);
      } else if (outcome.status === "already_imported") {
        console.log(`${name}: already imported (same answers), skipped`);
      } else {
        const s = outcome.summary;
        const r = s.replaces;
        console.log(
          `${name}: ${outcome.status === "preview" ? "PREVIEW" : "IMPORTED"} ${s.studies} stud${s.studies === 1 ? "y" : "ies"}, ${s.fields} fields: ✓ ${s.badges.verified} ⚠ ${s.badges.attention} ◇ ${s.badges.interpreted} ẩn ${s.badges.hidden}, ${s.completeness}\n    replaces what is published: ${r.studies} studies, ${r.paths} paths, ${r.measurements} measurements (models: ${r.models.join(", ") || "none"})`,
        );
      }
    }
    if (!yes) console.log("\nNothing written. Add --yes to import (the database is backed up first).");
    return failed ? 1 : 0;
  } catch (error) {
    console.error((error as Error).message);
    return 1;
  } finally {
    await db.end();
  }
}

/** pnpm worker manual export --paper X [--code NAME] [--force]: the work packet of one paper for an external extractor (D16). */
async function manual(args: string[]): Promise<number> {
  const [sub, ...rest] = args;
  if (sub === "check") {
    // No database, no keys: an agent working inside a packet can run this.
    const target = rest.find((a) => !a.startsWith("--"));
    if (!target) {
      console.error("Usage: pnpm worker manual check <packet name or folder> [--no-feedback]");
      return 1;
    }
    const dir = /[\\/:]/.test(target) ? path.resolve(target) : path.join(packetsDir(), checkCode(target));
    const result = await checkPacket(dir, { writeFeedback: !rest.includes("--no-feedback") });
    console.log(formatCheck(result));
    return result.ok ? 0 : 2;
  }
  if (sub === "import") return manualImport(rest);
  if (sub !== "export") {
    console.error("Usage: pnpm worker manual export --paper X [--code NAME] [--force] | manual check <packet> | manual import <packet>|--all --tool T --model M [--yes] [--no-backup]");
    return 1;
  }
  const paper = option(rest, "--paper");
  if (!paper) {
    console.error("--paper X is required (a part of the title, or the start of the file hash)");
    return 1;
  }
  const db = await connect();
  try {
    const code = option(rest, "--code");
    const result = await exportPacket(db, { repoRoot: REPO_ROOT, packetsRoot: packetsDir(), paper, ...(code ? { code } : {}), force: rest.includes("--force") });
    console.log(`Packet "${result.code}" for: ${result.paper.title ?? result.paper.fileHash.slice(0, 12)}
  folder: ${result.dir}
  Open ONLY this folder in the extractor (Codex…), not the repository, so it cannot see .env.`);
    return 0;
  } catch (error) {
    console.error((error as Error).message);
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
  if (command === "run") return run(args);
  if (command === "report") return report();
  if (command === "batch") return batch(args);
  if (command === "compare") return compare(args);
  if (command === "quality") return quality(args);
  if (command === "manual") return manual(args);
  if (command === "highlights") return highlights(args);
  console.error("Usage: pnpm worker extract [--limit N] | status | spend | estimate | run [--limit N] [--yes] | report | batch submit|poll|status | compare --paper X | quality [--top N] | highlights [--paper X] | manual export --paper X");
  return 1;
}

process.exitCode = await main();
