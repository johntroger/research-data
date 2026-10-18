/**
 * Gemini API paid-tier prices, USD per 1M tokens (Standard, not Batch).
 * Sources (checked 2026-10-18):
 *   https://ai.google.dev/gemini-api/docs/pricing          (last updated 2026-10-16)
 *   https://ai.google.dev/gemini-api/docs/models            (last updated 2026-10-13)
 *   https://ai.google.dev/gemini-api/docs/deprecations      (last updated 2026-10-12)
 * PDF input is billed as document/image tokens, which for these models costs the same as text input.
 * Some prices change on a known date, so each model has a list of price periods.
 * Update this table when Google changes prices.
 */

interface PricePeriod {
  /** First day (UTC, YYYY-MM-DD) this price applies; omitted for the earliest period. */
  from?: string;
  /** Price per 1M input tokens, and the higher price for prompts above `tierThreshold` tokens. */
  input: number;
  inputHigh?: number;
  /** Price per 1M output tokens (thinking tokens included). */
  output: number;
  outputHigh?: number;
  tierThreshold?: number;
}

export const PRICES_LAST_UPDATED = "2026-10-16";

const PRICES: Record<string, PricePeriod[]> = {
  // Stable flagship (released Oct 2026). Price doubles on 2026-12-01.
  "gemini-4-argon": [
    { input: 2.0, output: 10.0 },
    { from: "2026-12-01", input: 4.0, output: 20.0 },
  ],
  // Preview; no shutdown date announced as of 2026-10-12.
  "gemini-3.1-pro-preview": [{ input: 2.0, inputHigh: 4.0, output: 12.0, outputHigh: 18.0, tierThreshold: 200_000 }],
  // Access limited to accounts that used 2.5 models before.
  "gemini-2.5-pro": [{ input: 1.25, inputHigh: 2.5, output: 10.0, outputHigh: 15.0, tierThreshold: 200_000 }],
  // Flash prices double on 2027-01-01.
  "gemini-3.8-flash": [
    { input: 0.75, output: 3.75 },
    { from: "2027-01-01", input: 1.5, output: 7.5 },
  ],
  "gemini-3.6-flash": [
    { input: 0.75, output: 3.75 },
    { from: "2027-01-01", input: 1.5, output: 7.5 },
  ],
  "gemini-3-flash-preview": [{ input: 0.5, output: 3.0 }],
  "gemini-2.5-flash": [{ input: 0.3, output: 2.5 }],
};

export interface TokenUsage {
  inputTokens: number;
  /** Visible output tokens plus thinking tokens. */
  outputTokens: number;
}

function periodFor(periods: PricePeriod[], day: string): PricePeriod {
  let current = periods[0]!;
  for (const period of periods) {
    if (!period.from || period.from <= day) current = period;
  }
  return current;
}

/** Cost of one call in USD, or null when the model is not in the price table. */
export function callCostUsd(model: string, usage: TokenUsage, at: Date = new Date()): number | null {
  const periods = PRICES[model];
  if (!periods) return null;
  const price = periodFor(periods, at.toISOString().slice(0, 10));
  const high = price.tierThreshold !== undefined && usage.inputTokens > price.tierThreshold;
  const inputRate = high ? (price.inputHigh ?? price.input) : price.input;
  const outputRate = high ? (price.outputHigh ?? price.output) : price.output;
  return (usage.inputTokens * inputRate + usage.outputTokens * outputRate) / 1_000_000;
}

export function knownModels(): string[] {
  return Object.keys(PRICES);
}
