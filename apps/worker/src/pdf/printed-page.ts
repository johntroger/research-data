import type { PdfTextLayer } from "./text-layer.js";

/**
 * How the printed (journal) page numbers were determined, in order of preference:
 * - page_labels:     the PDF declares /PageLabels
 * - header_footer:   a consistent page-number sequence found in page headers/footers
 * - crossref_offset: first page from Crossref metadata + PDF page index
 * - pdf_index:       fallback, PDF page index + 1 (not a journal page number)
 *
 * The Gemini header/footer reading planned in Mục 6.3 is added later, after the
 * deterministic methods, because it costs an API call.
 */
export type PrintedPageMethod = "page_labels" | "header_footer" | "crossref_offset" | "pdf_index";

export interface PrintedPageResult {
  /** Printed page for each PDF page, indexed by pdfPageIndex. */
  printedPages: string[];
  method: PrintedPageMethod;
}

export interface PrintedPageOptions {
  /** First page of the article according to Crossref (e.g. 1245), when known. */
  crossrefFirstPage?: number;
}

/** Share of pages that must agree on the same offset for header/footer detection to be trusted. */
const MIN_AGREEMENT = 0.6;

/** Standalone page-number-like tokens: 1–5 digits not part of a longer number. */
const PAGE_NUMBER_TOKEN = /(?<![\d.,/-])\d{1,5}(?![\d.,/-])/g;

function isTrivialSequence(labels: string[]): boolean {
  return labels.every((label, i) => label === String(i + 1));
}

/**
 * Finds the offset (printed page - pdf index) supported by the most pages.
 * Constant numbers such as a year or volume in the header give a different offset
 * on every page, so they cannot win the vote.
 */
function detectHeaderFooterOffset(layer: PdfTextLayer): number | null {
  if (layer.pageCount < 2) return null;

  const votes = new Map<number, number>();
  for (const page of layer.pages) {
    const offsets = new Set<number>();
    for (const line of [...page.headerLines, ...page.footerLines]) {
      for (const match of line.matchAll(PAGE_NUMBER_TOKEN)) {
        const value = Number(match[0]);
        if (value > 0) offsets.add(value - page.pdfPageIndex);
      }
    }
    for (const offset of offsets) votes.set(offset, (votes.get(offset) ?? 0) + 1);
  }

  let best: { offset: number; count: number } | null = null;
  for (const [offset, count] of votes) {
    if (!best || count > best.count) best = { offset, count };
  }
  if (!best || best.count < 2 || best.count / layer.pageCount < MIN_AGREEMENT) return null;
  return best.offset;
}

export function resolvePrintedPages(
  layer: PdfTextLayer,
  options: PrintedPageOptions = {},
): PrintedPageResult {
  const indices = layer.pages.map((p) => p.pdfPageIndex);

  if (layer.pageLabels && !isTrivialSequence(layer.pageLabels)) {
    return { printedPages: [...layer.pageLabels], method: "page_labels" };
  }

  const offset = detectHeaderFooterOffset(layer);
  if (offset !== null) {
    return { printedPages: indices.map((i) => String(i + offset)), method: "header_footer" };
  }

  if (options.crossrefFirstPage !== undefined && options.crossrefFirstPage > 0) {
    const first = options.crossrefFirstPage;
    return { printedPages: indices.map((i) => String(first + i)), method: "crossref_offset" };
  }

  // Trivial labels ("1", "2", …) are still better than nothing, and match pdf_index anyway.
  return { printedPages: indices.map((i) => String(i + 1)), method: "pdf_index" };
}
