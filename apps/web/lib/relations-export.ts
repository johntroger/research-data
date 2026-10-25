/**
 * Excel export of a Relationship Search result (step 3a.4): one row per test in the list, in the order the page shows
 * them, plus a notes sheet with the question, the filters, the counts and the disclaimer. `exportTable` builds the
 * cells (pure, tested); `buildWorkbook` writes them as .xlsx.
 */
import ExcelJS from "exceljs";
import { makeT, type MessageKey, type Translate } from "./i18n";
import { countryLabel, label, tk } from "./labels";
import {
  formatEstimate,
  formatP,
  formatCi,
  formatSe,
  sampleSize,
  isVerified,
  paperLabel,
  type PathRow,
  type RelationQuery,
  type RelationResult,
  signGroup,
} from "./relations";

const COLUMN_KEYS = [
  "xl.col.citation", "xl.col.year", "xl.col.journal", "xl.col.study", "xl.col.iv", "xl.col.dv", "xl.col.role", "xl.col.hypothesis", "xl.col.estimate",
  "xl.col.p", "xl.col.se", "xl.col.ci", "xl.col.n", "xl.col.result", "xl.col.direction", "xl.col.badge", "xl.col.table", "xl.col.printed", "xl.col.pdfPage", "xl.col.open",
] as const satisfies readonly MessageKey[];

/** The column headings in the language of the page. */
export const columns = (t: Translate): string[] => COLUMN_KEYS.map((k) => t(k));

/** The responsibility statement in the language of the page. */
export const disclaimer = (t: Translate): string => t("xl.disclaimer");

const vi = makeT("vi");
/** Vietnamese headings and statement, for callers and tests that do not choose a language. */
export const COLUMNS = columns(vi);
export const DISCLAIMER = disclaimer(vi);

/** Column names of the CSV file: English and without spaces, so R, Python and Stata read them as variable names. */
export const CSV_COLUMNS = [
  "data_release", "paper_id", "citation", "year", "journal", "doi", "study", "iv", "dv", "role", "mediators", "moderators", "hypothesis",
  "estimate_type", "estimate", "se", "ci_low", "ci_high", "p_value", "p_reported", "n", "result", "effect_direction", "badge",
  "table", "printed_page", "pdf_page", "url",
] as const;

/** One row per test, in the order of the page, with the raw values (not the APA text) so the file can be analysed. */
export function csvRows(result: RelationResult, opts: { release: string; openUrl: (r: PathRow) => string }): (string | number | null)[][] {
  return result.groups
    .flatMap((g) => g.rows)
    .map((r) => [
      opts.release,
      r.paper_id,
      r.papers?.apa_citation ?? paperLabel(r.papers),
      r.papers?.year ?? null,
      r.papers?.journal ?? null,
      r.papers?.doi ?? null,
      r.studies?.study_label ?? null,
      r.iv_label_original,
      r.dv_label_original,
      r.effect_type,
      r.mediator_labels.join("; ") || null,
      r.moderator_labels.join("; ") || null,
      r.hypothesis_code,
      r.estimate_type,
      r.estimate,
      r.se ?? null,
      r.ci_low ?? null,
      r.ci_high ?? null,
      r.p_value,
      r.p_reported_as,
      sampleSize(r),
      r.status,
      signGroup(r),
      r.badge,
      r.evidence?.table_or_figure ?? null,
      r.evidence ? (r.evidence.printed_page ?? null) : null,
      r.evidence ? r.evidence.pdf_page_index + 1 : null,
      opts.openUrl(r),
    ]);
}

export interface ExportTable {
  /** Names the workbook needs in its language: the two sheets and the text of the "open" link. */
  names?: { results: string; notes: string; open: string };
  columns: readonly string[];
  rows: (string | number | null)[][];
  /** [label, value] lines of the notes sheet. */
  notes: [string, string][];
}

function rowCells(r: PathRow, openUrl: (r: PathRow) => string, t: Translate): (string | number | null)[] {
  const roleExtra = [
    r.mediator_labels.length ? t("xl.via", { list: r.mediator_labels.join(", ") }) : "",
    r.moderator_labels.length ? t("xl.moderatedBy", { list: r.moderator_labels.join(", ") }) : "",
  ].filter(Boolean);
  return [
    r.papers?.apa_citation ?? paperLabel(r.papers),
    r.papers?.year ?? null,
    r.papers?.journal ?? null,
    r.studies?.study_label ?? null,
    r.iv_label_original,
    r.dv_label_original,
    [label(t, "effect", r.effect_type), ...roleExtra].join(" · "),
    r.hypothesis_code,
    formatEstimate(r) || null,
    formatP(r) || null,
    formatSe(r).replace(/^SE = /, "") || null,
    formatCi(r).replace(/^CI /, "") || null,
    sampleSize(r),
    label(t, "status", r.status),
    tk(t, `xl.sign.${signGroup(r)}`),
    label(t, "badge", r.badge),
    r.evidence?.table_or_figure ?? null,
    r.evidence ? (r.evidence.printed_page ?? null) : null,
    r.evidence ? r.evidence.pdf_page_index + 1 : null,
    openUrl(r),
  ];
}

/** The question and filters in words, as typed. */
export function describeQuery(q: RelationQuery, t: Translate = vi, lang: "vi" | "en" = "vi"): string {
  const any = t("xl.q.any");
  const parts = [
    t("xl.q.a", { v: q.a || any }),
    t("xl.q.b", { v: q.b || any }),
    t("xl.q.dir", { v: tk(t, `xl.dir.${q.dir}`) }),
    t("xl.q.role", { v: tk(t, `xl.role.${q.role}`) }),
    t("xl.q.equiv", { v: q.equiv ? t("xl.q.on") : t("xl.q.off") }),
  ];
  if (q.status.length) parts.push(t("xl.q.status", { v: q.status.map((s) => label(t, "status", s)).join(", ") }));
  if (q.sign.length) parts.push(t("xl.q.sign", { v: q.sign.map((s) => tk(t, `xl.sign.${s}`)).join(", ") }));
  if (q.est.length) parts.push(t("xl.q.est", { v: q.est.map((e) => label(t, "estimate", e)).join(", ") }));
  if (q.from !== null || q.to !== null) parts.push(t("xl.q.years", { v: `${q.from ?? "…"}–${q.to ?? "…"}` }));
  if (q.design.length) parts.push(t("xl.q.design", { v: q.design.map((d) => label(t, "design", d)).join(", ") }));
  if (q.sample.length) parts.push(t("xl.q.sample", { v: q.sample.map((d) => label(t, "sample", d)).join(", ") }));
  if (q.country.length) parts.push(t("xl.q.country", { v: q.country.map((c) => countryLabel(c, lang)).join(", ") }));
  if (q.sort !== "year") parts.push(t("xl.q.sort", { v: label(t, "sort", q.sort) }));
  return parts.join(" · ");
}

export function exportTable(result: RelationResult, opts: { exportedAt: Date; openUrl: (r: PathRow) => string; provenance?: string; lang?: "vi" | "en" }): ExportTable {
  const lang = opts.lang ?? "vi";
  const t = makeT(lang);
  const rows = result.groups.flatMap((g) => g.rows);
  const verified = rows.filter(isVerified).length;
  return {
    names: { results: t("xl.sheet.results"), notes: t("xl.sheet.notes"), open: t("xl.col.open") },
    columns: columns(t),
    rows: rows.map((r) => rowCells(r, opts.openUrl, t)),
    notes: [
      [t("xl.note.question"), describeQuery(result.query, t, lang)],
      [t("xl.note.date"), opts.exportedAt.toISOString().slice(0, 10)],
      [t("xl.note.tests"), String(rows.length)],
      [t("xl.note.verified"), String(verified)],
      [t("xl.note.unverified"), String(rows.length - verified)],
      [t("xl.note.papers"), String(new Set(rows.map((r) => r.paper_id)).size)],
      [t("xl.note.badgeHelp"), t("xl.note.badgeHelp.text")],
      ...(opts.provenance ? ([[t("xl.note.provenance"), opts.provenance]] as [string, string][]) : []),
      [t("xl.note.disclaimerLabel"), disclaimer(t)],
    ],
  };
}

export async function buildWorkbook(table: ExportTable): Promise<Uint8Array<ArrayBuffer>> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Research Data";
  const sheet = wb.addWorksheet(table.names?.results ?? "Kết quả", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.addRow([...table.columns]);
  for (const row of table.rows) sheet.addRow(row);
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF2FF" } };
  const widths = [34, 7, 26, 9, 28, 28, 24, 12, 22, 12, 18, 18, 18, 9, 9, 40];
  widths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: table.columns.length } };
  // Open links: the last column holds the address; make it clickable.
  const linkColumn = table.columns.length;
  for (let i = 0; i < table.rows.length; i++) {
    const cell = sheet.getCell(i + 2, linkColumn);
    if (typeof cell.value === "string" && cell.value) cell.value = { text: table.names?.open ?? "Mở bài", hyperlink: cell.value };
  }
  // Wrap the long text columns.
  for (const c of [1, 5, 6, 7]) sheet.getColumn(c).alignment = { vertical: "top", wrapText: true };

  const notes = wb.addWorksheet(table.names?.notes ?? "Ghi chú");
  notes.getColumn(1).width = 38;
  notes.getColumn(2).width = 110;
  for (const [label, value] of table.notes) {
    const row = notes.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.alignment = { vertical: "top", wrapText: true };
  }
  return new Uint8Array((await wb.xlsx.writeBuffer()) as ArrayBuffer);
}
