/**
 * Runs the whole extraction of queued papers (step 1.9): AI extraction (S4) → machine checks
 * (S5–S7) → concept mapping (S8) → publish (S10), under the budget cap, and reports what each
 * paper cost. A paper whose extraction is already saved is not asked again (resume after a stop).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type pg from "pg";
import { BudgetExceeded } from "../extract/budget.js";
import { CheckpointStore, persisting, replaying } from "../extract/checkpoint.js";
import { extractFull, FullExtractionError } from "../extract/extract-full.js";
import { FULL_PROMPT_VERSION } from "../extract/full-prompt.js";
import type { GeneratePdfJson } from "../extract/gemini.js";
import { sha256 } from "../pdf/text-layer.js";
import { publishExtracted, type SavedExtraction } from "./extracted.js";
import { hasFinishedExtraction, type QueuedPaper, resultFile } from "./queue.js";

export interface PaperReport {
  fileHash: string;
  title: string | null;
  pages: number;
  /** Where the extraction came from: asked now, found saved, or a Batch result. */
  source: "sync" | "saved" | "batch";
  studies: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number | null;
  seconds: number;
  verified: number;
  attention: number;
  interpreted: number;
  hidden: number;
  completeness: string;
  missing: string[];
}

export type RunOutcome =
  | { status: "done"; report: PaperReport }
  | { status: "extraction_failed"; fileHash: string; title: string | null; message: string; costUsd: number }
  /** The cap would be passed by the next call: nothing more is sent. */
  | { status: "budget_stop"; fileHash: string; title: string | null; message: string }
  /** Another run is already working on this paper: this one does nothing (and spends nothing). */
  | { status: "busy"; fileHash: string; title: string | null };

export interface RunDeps {
  db: pg.Client;
  model: string;
  repoRoot: string;
  extractedDir: string;
  /** The real Gemini generator. */
  generate: GeneratePdfJson;
  /** Wraps a generator with the budget cap, the rate limit and the retries for one paper. */
  guard: (generate: GeneratePdfJson, fileHash: string) => GeneratePdfJson;
  log?: (line: string) => void;
}

/**
 * One paper is worked on by one run at a time. Two runs on the same paper (a forgotten background command, a
 * second terminal) used to ask Gemini for the same answers twice: about $3.5 of $9.7 was lost that way in the
 * first real run. The lock is a PostgreSQL advisory lock on the file hash, held for the life of the connection,
 * so a crashed run releases it by itself.
 */
export async function runPaper(deps: RunDeps, paper: QueuedPaper): Promise<RunOutcome> {
  const lock = await deps.db.query<{ ok: boolean }>("select pg_try_advisory_lock(hashtextextended($1, 0)) as ok", [paper.fileHash]);
  if (!lock.rows[0]!.ok) return { status: "busy", fileHash: paper.fileHash, title: paper.title };
  try {
    return await runLocked(deps, paper);
  } finally {
    await deps.db.query("select pg_advisory_unlock(hashtextextended($1, 0))", [paper.fileHash]).catch(() => {});
  }
}

async function runLocked(deps: RunDeps, paper: QueuedPaper): Promise<RunOutcome> {
  const started = Date.now();
  const pdf = new Uint8Array(await readFile(path.join(deps.repoRoot, paper.pdfPath)));
  const file = resultFile(deps.extractedDir, paper.fileHash);
  let source: PaperReport["source"] = "saved";

  if (!(await hasFinishedExtraction(deps.extractedDir, paper.fileHash))) {
    source = "sync";
    deps.log?.(`extracting ${paper.title?.slice(0, 60) ?? paper.fileHash.slice(0, 12)} (${paper.pages} pages)…`);
    const base = { file: path.basename(paper.pdfPath), file_hash: sha256(pdf), model: deps.model, prompt_version: FULL_PROMPT_VERSION };
    await mkdir(deps.extractedDir, { recursive: true });
    // Every paid answer goes to disk at once; a run that stops half-way resumes without paying again.
    const store = await CheckpointStore.open(path.join(deps.extractedDir, `${paper.fileHash.slice(0, 16)}.calls.jsonl`));
    let replayed = 0;
    if (store.size > 0) deps.log?.(`  ${store.size} paid answer(s) saved from an earlier run will be reused`);
    const generate = replaying(deps.guard(persisting(deps.generate, store), paper.fileHash), store, () => replayed++);
    try {
      const result = await extractFull(pdf, { model: deps.model, generate });
      if (replayed > 0) deps.log?.(`  reused ${replayed} saved answer(s), not paid for again`);
      await writeFile(file, JSON.stringify({ ...base, status: "done", ...result }, null, 2));
    } catch (error) {
      if (error instanceof BudgetExceeded) return { status: "budget_stop", fileHash: paper.fileHash, title: paper.title, message: error.message };
      if (!(error instanceof FullExtractionError)) throw error;
      await writeFile(file, JSON.stringify({ ...base, status: "failed", error: error.message, failed_raw: error.rawText, calls: error.calls }, null, 2));
      return {
        status: "extraction_failed",
        fileHash: paper.fileHash,
        title: paper.title,
        message: error.message.slice(0, 300),
        costUsd: error.calls.reduce((n, c) => n + (c.costUsd ?? 0), 0),
      };
    }
  }

  const saved = JSON.parse(await readFile(file, "utf8")) as SavedExtraction;
  if (saved.batch) source = "batch";
  const published = await publishExtracted(deps.db, { pdf, pdfPath: paper.pdfPath, saved });
  const count = (badge: string) => published.analysis.fields.filter((f) => f.badge === badge).length;
  const calls = [...saved.calls, ...(saved.top_ups ?? []).flatMap((t) => t.calls)];
  const costs = calls.map((c) => c.costUsd);
  return {
    status: "done",
    report: {
      fileHash: paper.fileHash,
      title: paper.title,
      pages: paper.pages,
      source,
      studies: saved.studies.length,
      calls: calls.length,
      inputTokens: calls.reduce((n, c) => n + c.usage.inputTokens, 0),
      outputTokens: calls.reduce((n, c) => n + c.usage.outputTokens, 0),
      costUsd: costs.includes(null) ? null : costs.reduce<number>((n, c) => n + c!, 0),
      seconds: Math.round((Date.now() - started) / 1000),
      verified: count("auto_verified"),
      attention: count("needs_attention"),
      interpreted: count("ai_interpreted"),
      hidden: count("hidden"),
      completeness: published.analysis.completeness,
      missing: published.analysis.missing.map((m) => m.note),
    },
  };
}

export interface CostSummary {
  papers: number;
  totalUsd: number;
  meanUsd: number;
  medianUsd: number;
  usdPerPage: number;
  /** Projection for `n` papers of the same mix, at the same price. */
  projectUsd: (n: number) => number;
}

/** Unit price of the papers extracted so far (papers without a known cost are left out). */
export function summariseCost(reports: Pick<PaperReport, "costUsd" | "pages">[]): CostSummary {
  const priced = reports.filter((r): r is { costUsd: number; pages: number } => r.costUsd !== null);
  const costs = priced.map((r) => r.costUsd).sort((a, b) => a - b);
  const total = costs.reduce((n, c) => n + c, 0);
  const mean = priced.length ? total / priced.length : 0;
  const median = costs.length ? (costs.length % 2 ? costs[(costs.length - 1) / 2]! : (costs[costs.length / 2 - 1]! + costs[costs.length / 2]!) / 2) : 0;
  const pages = priced.reduce((n, r) => n + r.pages, 0);
  return { papers: priced.length, totalUsd: total, meanUsd: mean, medianUsd: median, usdPerPage: pages ? total / pages : 0, projectUsd: (n) => n * mean };
}
