/**
 * A Gemini generator wrapped with everything step 1.7 adds around one call, in this order:
 *   1. estimate the cost and stop if it would pass the budget cap (nothing is sent);
 *   2. wait for the rate limit (requests and tokens per minute);
 *   3. call, retrying rate-limit and server errors with backoff;
 *   4. book the real cost in the spend ledger.
 */
import { getDocumentProxy } from "unpdf";
import type { Budget } from "./budget.js";
import { OUTPUT_TOKENS, PROMPT_OVERHEAD_TOKENS, TOKENS_PER_PAGE } from "./estimate.js";
import type { GeneratePdfJson } from "./gemini.js";
import { RateLimiter, type RetryOptions, withRetry } from "./limits.js";
import { passOfSchema } from "./passes.js";
import { callCostUsd } from "./pricing.js";

const pageCounts = new WeakMap<Uint8Array, number>();

export async function pdfPageCount(pdf: Uint8Array): Promise<number> {
  const known = pageCounts.get(pdf);
  if (known !== undefined) return known;
  const doc = await getDocumentProxy(new Uint8Array(pdf));
  const pages = doc.numPages;
  await doc.cleanup();
  pageCounts.set(pdf, pages);
  return pages;
}

/** The most output a single call is assumed to need (the paths pass, which grows with the hypotheses). */
const WORST_CASE_OUTPUT = Math.max(...Object.values(OUTPUT_TOKENS));

export interface GuardOptions {
  budget: Budget;
  limiter?: RateLimiter;
  retry?: RetryOptions;
  /** Identifies the paper in the ledger. */
  fileHash?: string;
  now?: () => Date;
}

export function guardedGenerator(generate: GeneratePdfJson, options: GuardOptions): GeneratePdfJson {
  return async (request) => {
    const inputTokens = (await pdfPageCount(request.pdf)) * TOKENS_PER_PAGE + PROMPT_OVERHEAD_TOKENS;
    const worstCase = callCostUsd(request.model, { inputTokens, outputTokens: WORST_CASE_OUTPUT }, options.now?.());
    // A model without a price cannot be capped, so it is not allowed to run at all.
    if (worstCase === null) throw new Error(`No price known for model "${request.model}": add it to extract/pricing.ts before using it`);

    await options.budget.assertCanSpend(worstCase);
    const booked = inputTokens + WORST_CASE_OUTPUT / 2;
    await options.limiter?.acquire(booked);

    const response = await withRetry(() => generate(request), options.retry);
    options.limiter?.adjust(booked, response.usage.inputTokens + response.usage.outputTokens);

    await options.budget.record({
      model: request.model,
      pass: passOfSchema(request.jsonSchema),
      fileHash: options.fileHash ?? null,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      costUsd: callCostUsd(request.model, response.usage, options.now?.()) ?? 0,
    });
    return response;
  };
}
