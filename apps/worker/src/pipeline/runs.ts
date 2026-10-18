/**
 * Step bookkeeping in `pipeline_runs` (Mục 2): every step S1–S11 is idempotent.
 * A step that is already `done` for a processing key is skipped; a failed step is tried again
 * on the next run. The processing key changes when the PDF or any version changes, which makes
 * every step run again for that paper.
 */
import { CODEBOOK_VERSION, SCHEMA_VERSION } from "@research-data/schema";
import type pg from "pg";
import { SKELETON_PROMPT_VERSION } from "../extract/skeleton-schema.js";

export type StepName = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8" | "S9" | "S10" | "S11";

/** Prompt version of the extraction (S4). Until step 1.3 this is the skeleton prompt. */
export const PIPELINE_PROMPT_VERSION = SKELETON_PROMPT_VERSION;

export interface Versions {
  schema: string;
  codebook: string;
  prompt: string;
}

export const CURRENT_VERSIONS: Versions = {
  schema: SCHEMA_VERSION,
  codebook: CODEBOOK_VERSION,
  prompt: PIPELINE_PROMPT_VERSION,
};

/** `file_hash + schema_version + codebook_version + prompt_version` (Mục 2). */
export function processingKey(fileHash: string, versions: Versions = CURRENT_VERSIONS): string {
  return `${fileHash}|schema@${versions.schema}|codebook@${versions.codebook}|prompt@${versions.prompt}`;
}

export interface StepContext {
  processingKey: string;
  paperId: string | null;
  fileHash: string | null;
  zoteroItemKey: string | null;
}

export type StepOutcome<T> =
  | { status: "done"; details: T }
  /** Already done in an earlier run; `details` are the stored ones. */
  | { status: "skipped"; details: T }
  | { status: "failed"; error: string };

export type Details = Record<string, unknown>;

/**
 * Runs `fn` as step `step` unless it is already done for this processing key.
 * The function's result is stored as the step's details (and returned on later skips).
 */
export async function runStep<T extends Details>(
  db: pg.Client,
  step: StepName,
  ctx: StepContext,
  fn: () => Promise<T>,
): Promise<StepOutcome<T>> {
  const existing = await db.query<{ status: string; details: T }>(
    "select status, details from pipeline_runs where processing_key = $1 and step = $2",
    [ctx.processingKey, step],
  );
  if (existing.rows[0]?.status === "done") return { status: "skipped", details: existing.rows[0].details };

  await db.query(
    `insert into pipeline_runs (processing_key, step, status, paper_id, file_hash, zotero_item_key, attempts, started_at)
     values ($1, $2, 'running', $3, $4, $5, 1, now())
     on conflict (processing_key, step) do update set
       status = 'running', attempts = pipeline_runs.attempts + 1, started_at = now(), finished_at = null, error = null,
       paper_id = coalesce(excluded.paper_id, pipeline_runs.paper_id), updated_at = now()`,
    [ctx.processingKey, step, ctx.paperId, ctx.fileHash, ctx.zoteroItemKey],
  );

  try {
    const details = await fn();
    await db.query(
      `update pipeline_runs set status = 'done', details = $3, finished_at = now(), updated_at = now()
       where processing_key = $1 and step = $2`,
      [ctx.processingKey, step, JSON.stringify(details)],
    );
    return { status: "done", details };
  } catch (error) {
    const message = (error as Error).message ?? String(error);
    await db.query(
      `update pipeline_runs set status = 'failed', error = $3, finished_at = now(), updated_at = now()
       where processing_key = $1 and step = $2`,
      [ctx.processingKey, step, message.slice(0, 2000)],
    );
    return { status: "failed", error: message };
  }
}

/** Links earlier step rows (written before the paper row existed) to the paper. */
export async function attachPaper(db: pg.Client, key: string, paperId: string): Promise<void> {
  await db.query("update pipeline_runs set paper_id = $2 where processing_key = $1 and paper_id is null", [key, paperId]);
}
