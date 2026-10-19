/**
 * S4–S8 and S10 for an extraction that is already saved (steps 1.3–1.8): records each step in
 * `pipeline_runs` under the processing key (file hash + schema + codebook + prompt version), runs the
 * machine checks, maps the concepts and publishes. The AI call itself (S4) happened earlier, with its
 * cost in the spend ledger; here it is recorded with the versions it ran under.
 * A paper already published under the same processing key is skipped unless `force` is set
 * (use it after improving a check, which does not change the key).
 */
import type pg from "pg";
import { withTransaction } from "../db/client.js";
import { publishFull, type PublishFullSummary, type RunInput } from "../db/publish-full.js";
import type { CallRecord } from "../extract/extract-full.js";
import { mapExtraction, type ExtractionMapping } from "../mapping/extraction.js";
import { resolvePrintedPages } from "../pdf/printed-page.js";
import { readTextLayer } from "../pdf/text-layer.js";
import { analysePaper, type PaperAnalysis } from "../verify/analyse.js";
import type { FullData } from "../verify/verify-full.js";
import { attachPaper, processingKey, runStep, type StepOutcome } from "./runs.js";

/** The file written by `extract:full` or by the Batch flow. */
export interface SavedExtraction extends FullData {
  status: string;
  model: string;
  prompt_version: string;
  batch?: boolean;
  calls: CallRecord[];
  top_ups?: { added: string[]; calls: CallRecord[] }[];
}

export interface PublishStepsResult {
  steps: Partial<Record<"S4" | "S5" | "S6" | "S7" | "S8" | "S10", StepOutcome<Record<string, unknown>>["status"]>>;
  published: PublishFullSummary | null;
  analysis: PaperAnalysis;
  mapping: ExtractionMapping;
}

export function runInputs(saved: SavedExtraction): RunInput[] {
  const toRun = (c: CallRecord): RunInput => ({
    pass: c.pass,
    studyLabel: c.studyLabel,
    usage: c.usage,
    costUsd: c.costUsd,
    rawText: c.rawText,
    batch: saved.batch ?? false,
  });
  return [...saved.calls, ...(saved.top_ups ?? []).flatMap((t) => t.calls)].map(toRun);
}

export async function publishExtracted(
  db: pg.Client,
  input: { pdf: Uint8Array; pdfPath: string; saved: SavedExtraction; force?: boolean },
): Promise<PublishStepsResult> {
  const { saved } = input;
  if (saved.status !== "done") throw new Error(`The saved extraction did not finish (${saved.status})`);

  const layer = await readTextLayer(input.pdf);
  const printed = resolvePrintedPages(layer);
  const ctx = { processingKey: processingKey(layer.fileHash), paperId: null as string | null, fileHash: layer.fileHash, zoteroItemKey: null };
  const steps: PublishStepsResult["steps"] = {};

  const analysis = analysePaper(layer, saved);
  const mapping = mapExtraction(saved);
  const count = (badge: string) => analysis.fields.filter((f) => f.badge === badge).length;

  const s4 = await runStep(db, "S4", ctx, async () => ({
    model: saved.model,
    prompt_version: saved.prompt_version,
    batch: saved.batch ?? false,
    calls: runInputs(saved).length,
    input_tokens: runInputs(saved).reduce((n, r) => n + r.usage.inputTokens, 0),
    output_tokens: runInputs(saved).reduce((n, r) => n + r.usage.outputTokens, 0),
    cost_usd: runInputs(saved).reduce((n, r) => n + (r.costUsd ?? 0), 0),
  }));
  steps.S4 = s4.status;
  const s5 = await runStep(db, "S5", ctx, async () => ({ fields: analysis.fields.length, hidden: count("hidden"), needs_attention: count("needs_attention"), verified: count("auto_verified"), ai_interpreted: count("ai_interpreted") }));
  steps.S5 = s5.status;
  const s6 = await runStep(db, "S6", ctx, async () => ({
    stats_checked: analysis.stats.filter((s) => s.status !== "not_checked").length,
    stats_inconsistent: analysis.stats.filter((s) => s.status === "inconsistent" || s.status === "decision_error").length,
    completeness: analysis.completeness,
    missing: analysis.missing.map((m) => m.note),
  }));
  steps.S6 = s6.status;
  const s7 = await runStep(db, "S7", ctx, async () => ({ auto_verified: count("auto_verified"), needs_attention: count("needs_attention"), ai_interpreted: count("ai_interpreted"), hidden: count("hidden") }));
  steps.S7 = s7.status;
  const s8 = await runStep(db, "S8", ctx, async () => ({ ...mapping.summary }));
  steps.S8 = s8.status;

  let published: PublishFullSummary | null = null;
  if (input.force) await db.query("delete from pipeline_runs where processing_key = $1 and step = 'S10'", [ctx.processingKey]);
  const s10 = await runStep(db, "S10", ctx, async () => {
    published = await withTransaction(db, () =>
      publishFull(db, {
        layer,
        printedPages: printed.printedPages,
        printedPageMethod: printed.method,
        pdfPath: input.pdfPath,
        data: saved,
        analysis,
        mapping,
        model: saved.model,
        promptVersion: saved.prompt_version,
        runs: runInputs(saved),
      }),
    );
    return { paper_id: published.paperId, runs_stored: published.runs.stored, runs_reused: published.runs.reused, evidence: published.evidence, fields: published.fields.inserted + published.fields.updated };
  });
  steps.S10 = s10.status;
  if (s10.status === "failed") throw new Error(`publish failed: ${s10.error}`);

  const paperId = (published as PublishFullSummary | null)?.paperId ?? (s10.status === "skipped" ? ((s10.details as { paper_id?: string }).paper_id ?? null) : null);
  if (paperId) await attachPaper(db, ctx.processingKey, paperId);
  return { steps, published, analysis, mapping };
}
