/**
 * Cost estimates before any call is made (step 1.7, Mục 4.3). Token counts per page and per
 * pass were measured on real papers in step 1.3 (Chen 2012, 19 pages; Yıldırım & Dursun, 24 pages):
 * input 1,513–1,557 tokens per page, output (thinking included) from 600 to 5,300 per call.
 * The numbers lean to the high side so that the budget guard stops early rather than late.
 * Do NOT replace the page-based input estimate by Gemini's countTokens: for these PDFs it counts about
 * 560 tokens per page while the bill is about 1,500 (checked on both papers, step 1.7), i.e. 2.7 times too low.
 */
import type { ExtractionSchemaName } from "@research-data/schema";
import { callCostUsd } from "./pricing.js";

export const TOKENS_PER_PAGE = 1_560;
/** System instruction, schema and prompt sent with every call. */
export const PROMPT_OVERHEAD_TOKENS = 1_000;

/** Output tokens per pass, about 20% above the largest value measured. */
export const OUTPUT_TOKENS: Record<ExtractionSchemaName, number> = {
  paper_structure: 800,
  paper_discussion: 2_300,
  study_design_sample_bias: 900,
  study_measurements: 2_300,
  study_paths: 6_400,
  study_tables: 950,
};

export const STUDY_PASSES: ExtractionSchemaName[] = ["study_design_sample_bias", "study_measurements", "study_paths", "study_tables"];

export interface CallEstimate {
  pass: ExtractionSchemaName;
  inputTokens: number;
  outputTokens: number;
  /** null when the model is not in the price table. */
  costUsd: number | null;
}

export function estimateCall(
  model: string,
  pass: ExtractionSchemaName,
  pdfTokens: number,
  options: { batch?: boolean; at?: Date } = {},
): CallEstimate {
  const usage = { inputTokens: pdfTokens + PROMPT_OVERHEAD_TOKENS, outputTokens: OUTPUT_TOKENS[pass] };
  return { pass, ...usage, costUsd: callCostUsd(model, usage, options.at, { batch: options.batch }) };
}

export interface PaperEstimate {
  pages: number;
  studies: number;
  calls: CallEstimate[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number | null;
}

/** All calls of one paper: Pass 1, Pass 1b and four calls per study. */
export function estimatePaper(
  model: string,
  pages: number,
  studies = 1,
  options: { batch?: boolean; at?: Date; pdfTokens?: number } = {},
): PaperEstimate {
  const pdfTokens = options.pdfTokens ?? pages * TOKENS_PER_PAGE;
  const passes: ExtractionSchemaName[] = ["paper_structure", "paper_discussion", ...Array.from({ length: studies }, () => STUDY_PASSES).flat()];
  const calls = passes.map((pass) => estimateCall(model, pass, pdfTokens, options));
  const costs = calls.map((c) => c.costUsd);
  return {
    pages,
    studies,
    calls,
    inputTokens: calls.reduce((n, c) => n + c.inputTokens, 0),
    outputTokens: calls.reduce((n, c) => n + c.outputTokens, 0),
    costUsd: costs.includes(null) ? null : costs.reduce<number>((n, c) => n + c!, 0),
  };
}
