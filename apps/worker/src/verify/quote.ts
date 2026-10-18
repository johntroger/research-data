import type { PdfTextLayer } from "../pdf/text-layer.js";
import { normaliseForMatch, tokens } from "./normalize.js";

/** Minimum token similarity for a fuzzy match (Mục 6.3: ngưỡng ≥ 0,90). */
export const FUZZY_THRESHOLD = 0.9;

export type QuoteMatch =
  /** Found word for word (after normalisation) on the cited page. */
  | "exact"
  /** Found with small differences (≥ 90% token similarity) on the cited page. */
  | "fuzzy"
  /** Found (exact or fuzzy) on the page just before or after the cited page. */
  | "neighbour_page"
  | "not_found";

export interface QuoteCheck {
  match: QuoteMatch;
  /** Token similarity of the best window, 0–1. */
  score: number;
  /** 1-based PDF page where the quote was found, or null. */
  foundOnPage: number | null;
  /**
   * For non-exact matches: words that differ between the quote and the PDF and can change the
   * meaning (negations, direction words, numbers). Empty when the difference is harmless.
   */
  criticalDifferences: string[];
}

/** Words whose change flips or weakens a finding; a fuzzy match differing on these is not trusted. */
const CRITICAL_WORDS = new Set([
  "not", "no", "non", "never", "neither", "nor", "without", "insignificant", "nonsignificant",
  "significant", "significantly", "positive", "positively", "negative", "negatively",
  "increase", "increased", "increases", "decrease", "decreased", "decreases",
  "higher", "lower", "more", "less", "stronger", "weaker", "supported", "rejected", "unsupported",
  "mediated", "moderated", "fully", "partially",
]);

/** Tokens present in one list but not the other (multiset difference, both directions). */
function differingTokens(a: string[], b: string[]): string[] {
  const counts = new Map<string, number>();
  for (const t of a) counts.set(t, (counts.get(t) ?? 0) + 1);
  for (const t of b) counts.set(t, (counts.get(t) ?? 0) - 1);
  return [...counts.entries()].filter(([, n]) => n !== 0).map(([t]) => t);
}

function critical(diff: string[]): string[] {
  return diff.filter((t) => CRITICAL_WORDS.has(t) || /\d/.test(t));
}

/** Edit distance between two token arrays (insert, delete, substitute = 1). */
function tokenEditDistance(a: string[], b: string[]): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = prev[j]!;
      prev[j] = Math.min(above + 1, prev[j - 1]! + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return prev[b.length]!;
}

/** Best similarity between the quote and any window of the page with a similar length. */
function bestWindow(quote: string[], page: string[]): { score: number; window: string[] } {
  let best = { score: 0, window: [] as string[] };
  if (quote.length === 0 || page.length === 0) return best;
  const slack = Math.max(1, Math.ceil(quote.length * 0.1));
  for (let start = 0; start < page.length; start++) {
    for (let len = quote.length - slack; len <= quote.length + slack; len++) {
      if (len <= 0 || start + len > page.length) continue;
      const window = page.slice(start, start + len);
      const score = 1 - tokenEditDistance(quote, window) / Math.max(quote.length, len);
      if (score > best.score) best = { score, window };
      if (best.score === 1) return best;
    }
  }
  return best;
}

interface PageResult {
  exact: boolean;
  score: number;
  criticalDifferences: string[];
}

function checkOnPage(layer: PdfTextLayer, quote: string, quoteTokens: string[], pdfPage: number): PageResult {
  const page = layer.pages[pdfPage - 1];
  if (!page) return { exact: false, score: 0, criticalDifferences: [] };
  const text = normaliseForMatch(page.text);
  if (text.includes(quote)) return { exact: true, score: 1, criticalDifferences: [] };
  // Same characters, different spacing (e.g. "Mbrand familiarity" vs "M brand familiarity",
  // where the PDF typesets a subscript): still an exact match.
  const spaceless = (s: string) => s.replace(/\s+/g, "");
  if (spaceless(text).includes(spaceless(quote))) return { exact: true, score: 1, criticalDifferences: [] };
  const { score, window } = bestWindow(quoteTokens, tokens(text));
  return { exact: false, score, criticalDifferences: critical(differingTokens(quoteTokens, window)) };
}

/** Checks that a quote attributed to `pdfPage` (1-based) really appears in the PDF text layer. */
export function verifyQuote(layer: PdfTextLayer, quote: string, pdfPage: number): QuoteCheck {
  const normalised = normaliseForMatch(quote);
  const quoteTokens = tokens(normalised);
  if (quoteTokens.length === 0) return { match: "not_found", score: 0, foundOnPage: null, criticalDifferences: [] };

  const cited = checkOnPage(layer, normalised, quoteTokens, pdfPage);
  if (cited.exact) return { match: "exact", score: 1, foundOnPage: pdfPage, criticalDifferences: [] };
  if (cited.score >= FUZZY_THRESHOLD) {
    return { match: "fuzzy", score: cited.score, foundOnPage: pdfPage, criticalDifferences: cited.criticalDifferences };
  }

  let best: QuoteCheck = { match: "not_found", score: cited.score, foundOnPage: null, criticalDifferences: [] };
  for (const neighbour of [pdfPage - 1, pdfPage + 1]) {
    const result = checkOnPage(layer, normalised, quoteTokens, neighbour);
    const score = result.exact ? 1 : result.score;
    if (score >= FUZZY_THRESHOLD && score > (best.foundOnPage === null ? 0 : best.score)) {
      best = { match: "neighbour_page", score, foundOnPage: neighbour, criticalDifferences: result.criticalDifferences };
    } else if (best.foundOnPage === null && score > best.score) {
      best = { ...best, score };
    }
  }
  return best;
}
