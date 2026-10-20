/**
 * The line of a table that holds one value (step 2 of the evidence-quote fix, Mục 6.10).
 * The AI gives ONE quote for a whole matrix or table, so every cell pointed at the same line, usually the last one.
 * This finds, on the cited page (then the page before and after), the visual row that contains the value and, when
 * the caller knows it, the row's label (a variable name) or number. Never guesses: no row, no answer.
 */
import type { PdfTextLayer } from "../pdf/text-layer.js";
import { normaliseForMatch } from "./normalize.js";
import { containsNumber, numberForms, signCounts } from "./number.js";

export interface RowQuoteQuery {
  value: number;
  /** Names that label the row: the variable of a matrix row, or the two ends of a path. Abbreviations in print are accepted. */
  labels?: (string | null | undefined)[];
  /** 1-based number printed in front of the row ("11. Intentions", "(5) Brand trust"). */
  rowNumber?: number;
  /** The value is a share also printed as a percentage ("R2=68.7%"). */
  percent?: boolean;
}

export interface RowQuote {
  /** 1-based PDF page of the row. */
  page: number;
  quote: string;
}

const MIN_QUOTE = 4;
/** Longest table row, in words of three letters or more (a long row label plus a few headers). */
const MAX_WORDS = 12;
const wordCount = (line: string) => (line.match(/\p{L}{3,}/gu) ?? []).length;

/** How many of the label's words the line has, 0–1. A long word may be printed as its first four letters ("Effi"). */
function labelScore(line: string, labels: string[]): number {
  const hay = normaliseForMatch(line);
  const words = labels.flatMap((l) => normaliseForMatch(l).split(/[^\p{L}\p{N}]+/u)).filter((w) => w.length >= 3);
  if (words.length === 0) return 0;
  const has = (w: string) => hay.includes(w) || (w.length >= 5 && new RegExp(`(^|[^\\p{L}])${w.slice(0, 4)}`, "u").test(hay));
  return words.filter(has).length / words.length;
}

/** A row number printed in front of the line: "11.", "(5)", "5)", "5 ". */
function startsWithNumber(line: string, n: number): boolean {
  return new RegExp(`^\\s*[(\\[]?${n}[)\\].]?\\s`).test(line);
}

function formsOf(q: RowQuoteQuery): string[] {
  const forms = numberForms(q.value);
  // A correlation of zero is printed ".00" or "0.00": a bare "0" would not match those.
  if (q.value === 0) forms.push(".00", "0.00", ".0", "0.0");
  if (q.percent) {
    for (const digits of [1, 0]) forms.push(...numberForms(Number((q.value * 100).toFixed(digits))));
  }
  return forms;
}

/** The row of the matrix or table that holds the value, or null when no row does. */
export function findRowQuote(layer: PdfTextLayer, citedPage: number, q: RowQuoteQuery): RowQuote | null {
  const forms = formsOf(q);
  const labels = (q.labels ?? []).filter((l): l is string => Boolean(l && l.trim()));
  for (const page of [citedPage, citedPage - 1, citedPage + 1]) {
    const data = layer.pages[page - 1];
    if (!data) continue;
    // A table row is mostly numbers; a line of running text that mentions the number is not evidence for a cell.
    const lines = (data.rowText || data.text)
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length >= MIN_QUOTE && wordCount(l) <= MAX_WORDS);
    const hits = lines
      .map((line, order) => ({ line, order, sign: signCounts(line, q.value) }))
      .filter(({ line }) => containsNumber(line, forms) !== null)
      // A line that prints the number only with the opposite sign is another number (a share is never negative).
      .filter(({ sign }) => (q.value < 0 ? !(sign.pos > 0 && sign.neg === 0) : !(sign.neg > 0 && sign.pos === 0)));
    if (hits.length === 0) continue;
    const scored = hits.map((h) => ({
      ...h,
      label: labels.length ? labelScore(h.line, labels) : 0,
      numbered: q.rowNumber !== undefined && startsWithNumber(h.line, q.rowNumber) ? 1 : 0,
      // A negative value is only recognised with its minus; a positive one without a sign or with plus counts as agreeing.
      signed: (q.value < 0 ? h.sign.neg : h.sign.pos) > 0 ? 0.5 : 0,
    }));
    const best = [...scored].sort((a, b) => b.label + b.numbered + b.signed - (a.label + a.numbered + a.signed) || a.order - b.order)[0]!;
    // With labels or a row number the row must match them; without any hint the value must sit on exactly one line.
    const hinted = labels.length > 0 || q.rowNumber !== undefined;
    if (hinted ? best.label > 0 || best.numbered > 0 || scored.length === 1 : scored.length === 1) return { page, quote: best.line };
  }
  return null;
}
