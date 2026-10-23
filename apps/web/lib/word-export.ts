/**
 * Word export in APA 7 table style (step 3b.3, Mục 8.4): table number in bold, title in italics, three horizontal rules
 * (above the header, under it, under the last row), a "Note." paragraph, Times New Roman. Every file also carries the
 * responsibility statement. `apaDocument` is generic; `relationsWordSpec` and `matrixWordSpec` turn a search result and the
 * summary matrix into table specs (pure, tested).
 */
import {
  AlignmentType, BorderStyle, Document, Packer, PageOrientation, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} from "docx";
import { countryName, DESIGN_LABELS } from "./library";
import { THEORY_ROLE_LABELS, sampleSummary, type MatrixRow } from "./matrix";
import { BADGE_LABEL, DISCLAIMER, describeQuery } from "./relations-export";
import { EFFECT_LABEL, formatEstimate, formatP, isVerified, paperLabel, STATUS_LABEL, type PathRow, type RelationResult } from "./relations";

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
  children.push(new Paragraph({ children: [new TextRun({ text: DISCLAIMER, font: FONT, size: 18, italics: true })], spacing: { before: 360 }, alignment: AlignmentType.LEFT }));
  const doc = new Document({
    creator: "Research Data",
    styles: { default: { document: { run: { font: FONT, size: 24 } } } },
    sections: [{ properties: { page: { size: { orientation: spec.landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT } } }, children }],
  });
  return new Uint8Array(await Packer.toArrayBuffer(doc));
}

const SIGN_NOTE = "Ước lượng β, b hoặc r theo bài gốc (không quy đổi); p theo cách tác giả in. ";
const BADGE_NOTE = "Huy hiệu: ✓ máy đã đối chiếu với PDF, ⚠ có kiểm tra chưa qua, ◇ AI diễn giải, ★ đã sửa tay. Trang là số trang in của bài gốc.";

/** One table with a row per test of a Relationship Search result, in the order the page shows them. */
export function relationsWordSpec(result: RelationResult, exportedAt: Date): WordSpec {
  const rows: PathRow[] = result.groups.flatMap((g) => g.rows);
  const verified = rows.filter(isVerified).length;
  return {
    landscape: true,
    tables: [
      {
        title: "Kết quả kiểm định của mối quan hệ trong kho bài báo",
        columns: ["Nguồn", "Study", "Quan hệ", "Giả thuyết", "Ước lượng", "p", "Kết quả", "Huy hiệu", "Trang"],
        widths: [3, 1.3, 4, 1.2, 1.6, 1.3, 1.8, 1.8, 0.9],
        rows: rows.map((r) => [
          `${r.papers?.apa_citation ?? paperLabel(r.papers)}`,
          r.studies?.study_label ?? "",
          `${r.iv_label_original}${r.mediator_labels.length ? ` → ${r.mediator_labels.join(", ")}` : ""} → ${r.dv_label_original}${r.moderator_labels.length ? ` (điều tiết: ${r.moderator_labels.join(", ")})` : ""} [${EFFECT_LABEL[r.effect_type]}]`,
          r.hypothesis_code ?? "",
          formatEstimate(r),
          formatP(r),
          STATUS_LABEL[r.status],
          BADGE_LABEL[r.badge] ?? r.badge,
          r.evidence?.printed_page ?? "",
        ]),
        note: `${describeQuery(result.query)}. Ngày xuất ${exportedAt.toISOString().slice(0, 10)}. ${rows.length} kiểm định từ ${new Set(rows.map((r) => r.paper_id)).size} bài, trong đó ${verified} đã kiểm chứng (✓ hoặc ★) và ${rows.length - verified} chưa. ${SIGN_NOTE}${BADGE_NOTE}`,
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
export function matrixWordSpec(papers: MatrixPaper[], exportedAt: Date, filters: string): WordSpec {
  const outcome = (m: MatrixRow) => {
    const o = m.outcome;
    const counted = o.supported + o.notSupported + o.mixed;
    const parts = [counted > 0 ? `${o.supported} ủng hộ, ${o.notSupported} không ủng hộ${o.mixed > 0 ? `, ${o.mixed} một phần` : ""}` : "", o.unchecked > 0 ? `${o.unchecked} chưa kiểm chứng (không đếm)` : ""].filter(Boolean);
    return parts.join("\n") || "Không có giả thuyết kiểm định";
  };
  const stamp = `Ngày xuất ${exportedAt.toISOString().slice(0, 10)}. ${papers.length} bài${filters ? `; bộ lọc: ${filters}` : ""}. `;
  return {
    landscape: true,
    tables: [
      {
        title: "Tổng hợp các nghiên cứu trong kho theo lý thuyết, thiết kế, mẫu và kết quả",
        columns: ["Nguồn", "Lý thuyết", "Thiết kế và mẫu", "Kết quả chính"],
        widths: [3, 3, 3, 2.5],
        rows: papers.map((p) => [
          `${p.citation}\n${p.title}`,
          p.row.theories.map((t) => `${t.name} (${THEORY_ROLE_LABELS[t.role] ?? t.role})`).join("\n") || "—",
          p.row.studies.map((s) => `${p.row.studies.length > 1 ? `${s.label}: ` : ""}${DESIGN_LABELS[s.design ?? ""] ?? s.design ?? "?"}${sampleSummary(s, countryName) ? `, ${sampleSummary(s, countryName)}` : ""}`).join("\n") || "—",
          outcome(p.row),
        ]),
        note: `${stamp}“Kết quả chính” chỉ đếm kiểm định giả thuyết đã kiểm chứng (✓ hoặc ★). Lý thuyết do AI diễn giải, máy không kiểm được.`,
      },
      {
        title: "Chi tiết từng kiểm định theo Study",
        columns: ["Nguồn", "Study", "Giả thuyết", "Quan hệ", "Thống kê", "Kết quả", "Huy hiệu", "Trang"],
        widths: [2.4, 1.2, 1.1, 4, 3, 1.8, 1.8, 0.9],
        rows: papers.flatMap((p) =>
          p.row.studies.flatMap((s) =>
            s.lines.map((l) => [p.citation, s.label, l.hypothesis ?? "", l.relation, [l.statistic, l.r2].filter(Boolean).join("; "), STATUS_LABEL[l.status], l.verified ? "✓ đã kiểm chứng" : "⚠ chưa kiểm chứng", l.printedPage ?? ""]),
          ),
        ),
        note: `${stamp}${SIGN_NOTE}${BADGE_NOTE}`,
      },
    ],
  };
}
