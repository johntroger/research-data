/**
 * Recomputes where each published field's quote sits on its PDF page (step 3a.3) without publishing the paper again.
 * The position is derived from the PDF and the quote, so it is refreshed even for fields edited by hand.
 */
import type pg from "pg";
import { type Highlight, locateQuote, readPageItems } from "../pdf/locate.js";

export interface HighlightSummary {
  /** Fields that have a quote on a page. */
  withQuote: number;
  located: number;
  /** Located on the page next to the cited one. */
  onNeighbour: number;
  notLocated: { naturalKey: string; page: number; quote: string }[];
}

export async function refreshHighlights(db: pg.Client, paperId: string, pdf: Uint8Array): Promise<HighlightSummary> {
  const pages = await readPageItems(pdf);
  const { rows } = await db.query<{ id: string; natural_key: string; evidence_quote: string | null; pdf_page_index: number | null; badge: string }>(
    "select id, natural_key, evidence_quote, pdf_page_index, badge from extracted_fields where paper_id = $1",
    [paperId],
  );
  const summary: HighlightSummary = { withQuote: 0, located: 0, onNeighbour: 0, notLocated: [] };
  for (const row of rows) {
    let highlight: Highlight | null = null;
    if (row.badge !== "hidden" && row.evidence_quote && row.pdf_page_index !== null) {
      const cited = row.pdf_page_index + 1;
      summary.withQuote++;
      highlight = locateQuote(pages, row.evidence_quote, cited);
      if (highlight) {
        summary.located++;
        if (highlight.page !== cited) summary.onNeighbour++;
      } else summary.notLocated.push({ naturalKey: row.natural_key, page: cited, quote: row.evidence_quote });
    }
    await db.query("update extracted_fields set highlight = $2 where id = $1", [row.id, highlight ? JSON.stringify(highlight) : null]);
  }
  return summary;
}
