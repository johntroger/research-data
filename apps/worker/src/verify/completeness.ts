/**
 * Completeness (step 1.5, Mục 6.3): the PDF text is scanned for every hypothesis code ("H3") and
 * every table caption ("Table 2."), and compared with what the AI listed in Pass 1 and extracted in
 * Pass 2. Anything missing is named, so the reader knows ("bài có H5 nhưng chưa trích được") and the
 * worker can extract just that item with one small extra call (extract/topup.ts).
 */
import type { PdfTextLayer } from "../pdf/text-layer.js";
import type { FullData } from "./verify-full.js";

export type MissingKind =
  /** Code found in the text but not in the Pass 1 list. */
  | "hypothesis_not_listed"
  /** Code listed in Pass 1 but no tested path carries it. */
  | "hypothesis_without_path"
  /** Table caption found in the text but not in the Pass 1 list. */
  | "table_not_listed"
  /** Correlation table listed in Pass 1 but no matrix extracted from it. */
  | "matrix_missing"
  /** Condition-means table listed in Pass 1 but no cell extracted from it. */
  | "cells_missing";

export interface MissingItem {
  kind: MissingKind;
  /** "H5" or "Table 3". */
  item: string;
  /** Study the item belongs to, when Pass 1 says (tables). */
  studyLabel: string | null;
  /** Plain-language note for the reader. */
  note: string;
}

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50 };

/** "Table IV", "TABLE 4.", "Tab. 4" → "table 4"; appendix tables ("Table A1") keep their letter. */
export function tableKey(label: string): string | null {
  const m = /^\s*(?:table|tab\.?)\s*([A-Za-z]?\d+|[IVXLivxl]+)\b/i.exec(label);
  if (!m) return null;
  const id = m[1]!;
  if (/^[IVXLivxl]+$/.test(id)) {
    const upper = id.toUpperCase();
    let total = 0;
    for (let i = 0; i < upper.length; i++) {
      const v = ROMAN[upper[i]!]!;
      total += v < (ROMAN[upper[i + 1] ?? ""] ?? 0) ? -v : v;
    }
    return `table ${total}`;
  }
  return `table ${id.toLowerCase()}`;
}

const hypothesisKey = (code: string) => code.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Hypothesis codes printed at least twice (one mention can be a typo or a formula). H0 is the null hypothesis. */
export function hypothesisCodesInText(layer: PdfTextLayer): string[] {
  const counts = new Map<string, { code: string; n: number; first: number }>();
  layer.pages.forEach((page, p) => {
    for (const m of page.text.matchAll(/\bH(\d{1,2}[a-z]?)\b/g)) {
      if (m[1] === "0") continue;
      const code = `H${m[1]}`;
      const entry = counts.get(hypothesisKey(code)) ?? { code, n: 0, first: p * 1e6 + (m.index ?? 0) };
      entry.n++;
      counts.set(hypothesisKey(code), entry);
    }
  });
  return [...counts.values()].filter((e) => e.n >= 2).sort((a, b) => a.first - b.first).map((e) => e.code);
}

/**
 * Captions found in the text: a line starting with "Table N" followed by ".", ":", a dash or the end
 * of the line ("Table 3 shows…" in running text is not a caption).
 */
export function tableCaptionsInText(layer: PdfTextLayer): { label: string; key: string }[] {
  const found = new Map<string, string>();
  for (const page of layer.pages) {
    for (const line of [...page.text.split("\n"), ...(page.rowText ?? "").split("\n")]) {
      const m = /^\s*((?:table|tab\.)\s*(?:[A-Za-z]?\d+|[IVXLivxl]+))\s*(?:[.:–—-]|$)/i.exec(line);
      const key = m ? tableKey(m[1]!) : null;
      if (m && key && !found.has(key)) found.set(key, m[1]!.replace(/\s+/g, " ").trim());
    }
  }
  return [...found].map(([key, label]) => ({ key, label }));
}

/**
 * A table the AI called a correlation table that holds squared correlations (a Φ-matrix with shared variances below the
 * diagonal, AVE on it and intervals above): there is no r in it to extract, and r is never derived from anything else,
 * so a missing matrix is not an omission. Recognised by the words of the table's own caption and note.
 */
export function holdsSquaredCorrelations(layer: PdfTextLayer, tableLabel: string, pdfPage: number): boolean {
  const key = tableKey(tableLabel);
  if (!key) return false;
  const id = key.slice("table ".length).replace(/[^a-z0-9]/gi, "");
  const caption = new RegExp(`^\\s*(?:table|tab\\.)\\s*${id}\\b`, "im");
  const nextCaption = /^\s*(?:table|tab\.)\s*[a-z]?\d+\b/im;
  for (const p of [pdfPage, pdfPage - 1, pdfPage + 1]) {
    const page = layer.pages[p - 1];
    if (!page) continue;
    for (const reading of [page.rowText ?? "", page.text]) {
      const at = reading.search(caption);
      if (at < 0) continue;
      const after = reading.slice(at + 1);
      const end = after.slice(1).search(nextCaption);
      const block = after.slice(0, Math.min(end >= 0 ? end + 1 : 1800, 1800)).toLowerCase();
      if (/shared variances?|squared correlations?/.test(block)) return true;
    }
  }
  return false;
}

export function findMissing(layer: PdfTextLayer, data: FullData): MissingItem[] {
  const out: MissingItem[] = [];
  const s = data.structure;
  const listedCodes = new Set(s.hypothesis_codes.map(hypothesisKey));
  const pathCodes = new Set(data.studies.flatMap((st) => st.paths.map((p) => p.hypothesis_code)).filter((c): c is string => !!c).map(hypothesisKey));

  for (const code of hypothesisCodesInText(layer)) {
    if (!listedCodes.has(hypothesisKey(code))) {
      out.push({ kind: "hypothesis_not_listed", item: code, studyLabel: null, note: `Bài có ${code} nhưng danh sách giả thuyết của AI không có` });
    }
  }
  // A family code ("H1") has its result when a path carries the code of one of its parts ("H1a", "H1b"); "H10" is not a part of "H1".
  const hasResult = (code: string) => {
    const key = hypothesisKey(code);
    return pathCodes.has(key) || [...pathCodes].some((p) => p.startsWith(key) && /^[a-z]+$/.test(p.slice(key.length)));
  };
  for (const code of s.hypothesis_codes) {
    if (!hasResult(code)) {
      out.push({ kind: "hypothesis_without_path", item: code, studyLabel: null, note: `Bài có ${code} nhưng chưa trích được kết quả kiểm định` });
    }
  }

  const listedTables = new Set(s.tables.map((t) => tableKey(t.table_label)).filter((k): k is string => k !== null));
  for (const caption of tableCaptionsInText(layer)) {
    if (!listedTables.has(caption.key)) {
      out.push({ kind: "table_not_listed", item: caption.label, studyLabel: null, note: `Bài có ${caption.label} nhưng danh sách bảng của AI không có` });
    }
  }

  const matrixTables = new Set(data.studies.flatMap((st) => st.correlation_matrices.map((m) => tableKey(m.source_table))).filter((k): k is string => k !== null));
  const cellTables = new Set(
    data.studies.flatMap((st) => st.condition_cells.map((c) => c.evidence.table_or_figure && tableKey(c.evidence.table_or_figure))).filter((k): k is string => !!k),
  );
  for (const t of s.tables) {
    const key = tableKey(t.table_label);
    if (t.kind === "correlation" && key && !matrixTables.has(key) && !holdsSquaredCorrelations(layer, t.table_label, t.pdf_page)) {
      out.push({ kind: "matrix_missing", item: t.table_label, studyLabel: t.study_label, note: `${t.table_label} là bảng tương quan nhưng chưa trích được ma trận` });
    }
    if (t.kind === "condition_means" && key && !cellTables.has(key)) {
      out.push({ kind: "cells_missing", item: t.table_label, studyLabel: t.study_label, note: `${t.table_label} là bảng trung bình theo điều kiện nhưng chưa trích được ô nào` });
    }
  }
  return out;
}
