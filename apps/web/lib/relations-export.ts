/**
 * Excel export of a Relationship Search result (step 3a.4): one row per test in the list, in the order the page shows
 * them, plus a notes sheet with the question, the filters, the counts and the disclaimer. `exportTable` builds the
 * cells (pure, tested); `buildWorkbook` writes them as .xlsx.
 */
import ExcelJS from "exceljs";
import {
  EFFECT_LABEL,
  formatEstimate,
  formatP,
  isVerified,
  paperLabel,
  type PathRow,
  type RelationQuery,
  type RelationResult,
  signGroup,
  STATUS_LABEL,
} from "./relations";

export const BADGE_LABEL: Record<string, string> = {
  auto_verified: "✓ đã kiểm chứng",
  needs_attention: "⚠ nên xem kỹ",
  ai_interpreted: "◇ AI diễn giải",
  human_reviewed: "★ đã sửa",
  disputed: "⚑ có báo lỗi",
};

const SIGN_LABEL = { positive: "Dương", negative: "Âm", none: "Không có ý nghĩa", unknown: "Không rõ" } as const;
const ROLE_LABEL = { direct: "Trực tiếp", mediated: "Qua trung gian", moderated: "Có điều tiết", all: "Tất cả" } as const;
const DIR_LABEL = { ab: "A → B", ba: "B → A", both: "Cả hai chiều" } as const;

export const DISCLAIMER =
  "Công cụ tham khảo: dữ liệu do AI trích xuất từ bài báo và được máy đối chiếu với PDF; không ai đọc bài, mã hóa hay duyệt. " +
  "Hãy tự đối chiếu với bài gốc trước khi dùng (cột Trang in và Mở bài chỉ đúng chỗ). " +
  "Con số chỉ mô tả các bài trong kho, không phải kết luận của cả lĩnh vực và không thay cho meta-analysis. " +
  "Không có ý nghĩa thống kê không có nghĩa là không có tác động.";

export const COLUMNS = [
  "Trích dẫn",
  "Năm",
  "Tạp chí",
  "Study",
  "Biến A (độc lập)",
  "Biến B (phụ thuộc)",
  "Vai trò",
  "Mã giả thuyết",
  "Ước lượng",
  "p",
  "Kết quả giả thuyết",
  "Chiều tác động",
  "Huy hiệu",
  "Trang in",
  "Trang PDF",
  "Mở bài",
] as const;

export interface ExportTable {
  columns: readonly string[];
  rows: (string | number | null)[][];
  /** [label, value] lines of the notes sheet. */
  notes: [string, string][];
}

function rowCells(r: PathRow, openUrl: (r: PathRow) => string): (string | number | null)[] {
  const roleExtra = [
    r.mediator_labels.length ? `qua ${r.mediator_labels.join(", ")}` : "",
    r.moderator_labels.length ? `điều tiết bởi ${r.moderator_labels.join(", ")}` : "",
  ].filter(Boolean);
  return [
    r.papers?.apa_citation ?? paperLabel(r.papers),
    r.papers?.year ?? null,
    r.papers?.journal ?? null,
    r.studies?.study_label ?? null,
    r.iv_label_original,
    r.dv_label_original,
    [EFFECT_LABEL[r.effect_type], ...roleExtra].join(" · "),
    r.hypothesis_code,
    formatEstimate(r) || null,
    formatP(r) || null,
    STATUS_LABEL[r.status],
    SIGN_LABEL[signGroup(r)],
    BADGE_LABEL[r.badge] ?? r.badge,
    r.evidence ? (r.evidence.printed_page ?? null) : null,
    r.evidence ? r.evidence.pdf_page_index + 1 : null,
    openUrl(r),
  ];
}

/** The question and filters in words, as typed. */
export function describeQuery(q: RelationQuery): string {
  const parts = [
    `Biến A: ${q.a || "(bất kỳ)"}`,
    `Biến B: ${q.b || "(bất kỳ)"}`,
    `Chiều: ${DIR_LABEL[q.dir]}`,
    `Vai trò: ${ROLE_LABEL[q.role]}`,
    `Tên gọi tương đương: ${q.equiv ? "bật" : "tắt"}`,
  ];
  if (q.status.length) parts.push(`Kết quả giả thuyết: ${q.status.map((s) => STATUS_LABEL[s]).join(", ")}`);
  if (q.sign.length) parts.push(`Chiều tác động: ${q.sign.map((s) => SIGN_LABEL[s]).join(", ")}`);
  return parts.join(" · ");
}

export function exportTable(result: RelationResult, opts: { exportedAt: Date; openUrl: (r: PathRow) => string }): ExportTable {
  const rows = result.groups.flatMap((g) => g.rows);
  const verified = rows.filter(isVerified).length;
  return {
    columns: COLUMNS,
    rows: rows.map((r) => rowCells(r, opts.openUrl)),
    notes: [
      ["Câu hỏi tìm kiếm", describeQuery(result.query)],
      ["Ngày xuất", opts.exportedAt.toISOString().slice(0, 10)],
      ["Số kiểm định trong file", String(rows.length)],
      ["Trong đó đã kiểm chứng (✓ hoặc ★)", String(verified)],
      ["Trong đó chưa kiểm chứng (⚠ hoặc ◇)", String(rows.length - verified)],
      ["Số bài", String(new Set(rows.map((r) => r.paper_id)).size)],
      ["Cách đọc cột Huy hiệu", "✓ máy đã đối chiếu giá trị với PDF · ⚠ có kiểm tra chưa qua, nên xem kỹ · ◇ AI diễn giải, máy không kiểm được · ★ đã sửa tay"],
      ["Tuyên bố trách nhiệm", DISCLAIMER],
    ],
  };
}

export async function buildWorkbook(table: ExportTable): Promise<Uint8Array<ArrayBuffer>> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Research Data";
  const sheet = wb.addWorksheet("Kết quả", { views: [{ state: "frozen", ySplit: 1 }] });
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
    if (typeof cell.value === "string" && cell.value) cell.value = { text: "Mở bài", hyperlink: cell.value };
  }
  // Wrap the long text columns.
  for (const c of [1, 5, 6, 7]) sheet.getColumn(c).alignment = { vertical: "top", wrapText: true };

  const notes = wb.addWorksheet("Ghi chú");
  notes.getColumn(1).width = 38;
  notes.getColumn(2).width = 110;
  for (const [label, value] of table.notes) {
    const row = notes.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.alignment = { vertical: "top", wrapText: true };
  }
  return new Uint8Array((await wb.xlsx.writeBuffer()) as ArrayBuffer);
}
