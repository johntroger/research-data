/**
 * Word export in APA 7 table style (step 3b.3, Mục 8.4): table number in bold, title in italics, three horizontal rules
 * (above the header, under it, under the last row), a "Note." paragraph, Times New Roman. Every file also carries the
 * responsibility statement. `apaDocument` is generic; `relationsWordSpec` and `matrixWordSpec` turn a search result and the
 * summary matrix into table specs (pure, tested).
 */
import {
  AlignmentType, BorderStyle, Document, Packer, PageOrientation, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} from "docx";
import { makeT, makeTn, type Translate, type TranslatePlural } from "./i18n";
import { countryLabel, label, tk } from "./labels";
import { sampleSummary, type MatrixRow } from "./matrix";
import { DISCLAIMER, describeQuery } from "./relations-export";
import { formatCi, formatEstimate, formatP, formatSe, sampleSize, isVerified, paperLabel, type PathRow, type RelationResult } from "./relations";

type Lang = "vi" | "en";
const tools = (lang: Lang): { t: Translate; tn: TranslatePlural } => ({ t: makeT(lang), tn: makeTn(lang) });

export interface WordTable {
  title: string;
  columns: string[];
  rows: string[][];
  /** Text after "Note." */
  note: string;
  /** Relative column widths. */
  widths?: number[];
}
export interface WordSpec {
  tables: WordTable[];
  landscape?: boolean;
  /** The responsibility statement at the end, in the language of the file (Vietnamese when not given). */
  disclaimer?: string;
}

const FONT = "Times New Roman";
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;
const RULE = { style: BorderStyle.SINGLE, size: 6, color: "000000" } as const;

function cell(text: string, o: { width: number; top?: boolean; bottom?: boolean; bold?: boolean }): TableCell {
  return new TableCell({
    width: { size: o.width, type: WidthType.PERCENTAGE },
    borders: { top: o.top ? RULE : NONE, bottom: o.bottom ? RULE : NONE, left: NONE, right: NONE },
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: text.split("\n").map((line) => new Paragraph({ children: [new TextRun({ text: line, font: FONT, size: 20, bold: o.bold })] })),
  });
}

function apaTable(t: WordTable): Table {
  const total = t.widths?.reduce((a, b) => a + b, 0) ?? t.columns.length;
  const width = (i: number) => Math.round(((t.widths?.[i] ?? 1) / total) * 100);
  const header = new TableRow({ tableHeader: true, children: t.columns.map((c, i) => cell(c, { width: width(i), top: true, bottom: true, bold: false })) });
  const body = t.rows.map((r, ri) => new TableRow({ children: r.map((c, i) => cell(c, { width: width(i), bottom: ri === t.rows.length - 1 })) }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE },
    rows: [header, ...body],
  });
}

export async function apaDocument(spec: WordSpec): Promise<Uint8Array<ArrayBuffer>> {
  const children: (Paragraph | Table)[] = [];
  spec.tables.forEach((t, i) => {
    children.push(
      new Paragraph({ children: [new TextRun({ text: `Table ${i + 1}`, bold: true, font: FONT, size: 24 })], spacing: { before: i === 0 ? 0 : 360 } }),
      new Paragraph({ children: [new TextRun({ text: t.title, italics: true, font: FONT, size: 24 })], spacing: { after: 120 } }),
      apaTable(t),
      new Paragraph({
        children: [new TextRun({ text: "Note. ", italics: true, font: FONT, size: 20 }), new TextRun({ text: t.note, font: FONT, size: 20 })],
        spacing: { before: 80 },
      }),
    );
  });
  children.push(new Paragraph({ children: [new TextRun({ text: spec.disclaimer ?? DISCLAIMER, font: FONT, size: 18, italics: true })], spacing: { before: 360 }, alignment: AlignmentType.LEFT }));
  const doc = new Document({
    creator: "Research Data",
    styles: { default: { document: { run: { font: FONT, size: 24 } } } },
    sections: [{ properties: { page: { size: { orientation: spec.landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT } } }, children }],
  });
  return new Uint8Array(await Packer.toArrayBuffer(doc));
}

/** One table with a row per test of a Relationship Search result, in the order the page shows them. */
export function relationsWordSpec(result: RelationResult, exportedAt: Date, provenance = "", lang: Lang = "vi"): WordSpec {
  const { t, tn } = tools(lang);
  const rows: PathRow[] = result.groups.flatMap((g) => g.rows);
  const verified = rows.filter(isVerified).length;
  const modWord = t("role.mod");
  return {
    landscape: true,
    disclaimer: t("xl.disclaimer"),
    tables: [
      {
        title: t("wd.rel.title"),
        columns: [t("wd.rel.col.source"), t("wd.rel.col.study"), t("wd.rel.col.relationship"), t("wd.rel.col.hypothesis"), t("wd.rel.col.estimate"), t("wd.rel.col.p"), t("wd.rel.col.n"), t("wd.rel.col.result"), t("wd.rel.col.badge"), t("wd.rel.col.page")],
        widths: [3, 1.3, 4, 1.2, 2, 1.3, 0.9, 1.8, 1.8, 0.9],
        rows: rows.map((r) => [
          `${r.papers?.apa_citation ?? paperLabel(r.papers)}`,
          r.studies?.study_label ?? "",
          `${r.iv_label_original}${r.mediator_labels.length ? ` → ${r.mediator_labels.join(", ")}` : ""} → ${r.dv_label_original}${r.moderator_labels.length ? ` (${modWord}: ${r.moderator_labels.join(", ")})` : ""} [${label(t, "effect", r.effect_type)}]`,
          r.hypothesis_code ?? "",
          [formatEstimate(r), formatSe(r), formatCi(r)].filter(Boolean).join(", "),
          formatP(r),
          sampleSize(r)?.toLocaleString("en-US") ?? "",
          label(t, "status", r.status),
          label(t, "badge", r.badge),
          r.evidence?.printed_page ?? "",
        ]),
        note: `${t("wd.rel.note", {
          query: describeQuery(result.query, t, lang),
          date: exportedAt.toISOString().slice(0, 10),
          tests: tn("n.tests", rows.length),
          papers: tn("n.papers", new Set(rows.map((r) => r.paper_id)).size),
          verified,
          unverified: rows.length - verified,
        })}${t("wd.signNote")}${t("wd.badgeNote")}${provenance ? ` ${provenance}` : ""}`,
      },
    ],
  };
}

export interface MatrixPaper {
  citation: string;
  title: string;
  row: MatrixRow;
}

/** Table 1: one row per paper (as the matrix page). Table 2: every test with badge and printed page. */
export function matrixWordSpec(papers: MatrixPaper[], exportedAt: Date, filters: string, provenance = "", lang: Lang = "vi"): WordSpec {
  const { t, tn } = tools(lang);
  const outcome = (m: MatrixRow) => {
    const o = m.outcome;
    const counted = o.supported + o.notSupported + o.mixed;
    const parts = [
      counted > 0 ? `${t("wd.matrix.outcome", { s: o.supported, n: o.notSupported })}${o.mixed > 0 ? t("wd.matrix.outcomeMixed", { m: o.mixed }) : ""}` : "",
      o.unchecked > 0 ? t("wd.matrix.outcomeUnchecked", { n: o.unchecked }) : "",
    ].filter(Boolean);
    return parts.join("\n") || t("wd.matrix.noHypothesis");
  };
  const country = (c: string) => countryLabel(c, lang);
  const stamp = t("wd.matrix.stamp", { date: exportedAt.toISOString().slice(0, 10), papers: tn("n.papers", papers.length), filters: filters ? t("wd.matrix.filters", { filters }) : "" });
  return {
    landscape: true,
    disclaimer: t("xl.disclaimer"),
    tables: [
      {
        title: t("wd.matrix.title1"),
        columns: [t("wd.matrix.col.source"), t("wd.matrix.col.theory"), t("wd.matrix.col.design"), t("wd.matrix.col.outcome")],
        widths: [3, 3, 3, 2.5],
        rows: papers.map((p) => [
          `${p.citation}\n${p.title}`,
          p.row.theories.map((th) => `${th.name} (${tk(t, `theoryRole.${th.role}`)})`).join("\n") || "—",
          p.row.studies.map((s) => `${p.row.studies.length > 1 ? `${s.label}: ` : ""}${s.design ? label(t, "design", s.design) : "?"}${sampleSummary(s, country) ? `, ${sampleSummary(s, country)}` : ""}`).join("\n") || "—",
          outcome(p.row),
        ]),
        note: `${stamp}${t("wd.matrix.note1")}`,
      },
      {
        title: t("wd.matrix.title2"),
        columns: [t("wd.matrix.col2.source"), t("wd.matrix.col2.study"), t("wd.matrix.col2.hypothesis"), t("wd.matrix.col2.relationship"), t("wd.matrix.col2.statistic"), t("wd.matrix.col2.result"), t("wd.matrix.col2.badge"), t("wd.matrix.col2.page")],
        widths: [2.4, 1.2, 1.1, 4, 3, 1.8, 1.8, 0.9],
        rows: papers.flatMap((p) =>
          p.row.studies.flatMap((s) =>
            s.lines.map((l) => [p.citation, s.label, l.hypothesis ?? "", l.relation, [l.statistic, l.r2].filter(Boolean).join("; "), label(t, "status", l.status), l.verified ? t("wd.verified") : t("wd.unverified"), l.printedPage ?? ""]),
          ),
        ),
        note: `${stamp}${t("wd.signNote")}${t("wd.badgeNote")}${provenance ? ` ${provenance}` : ""}`,
      },
    ],
  };
}
