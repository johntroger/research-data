import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { DEFAULT_QUERY, type PathRow, searchRelations } from "./relations";
import { buildWorkbook, COLUMNS, describeQuery, DISCLAIMER, exportTable } from "./relations-export";

const base: PathRow = {
  id: "r1",
  paper_id: "p1",
  study_id: "s1",
  natural_key: "study_1:h1:a->b:direct",
  hypothesis_code: "H1",
  iv_label_original: "Trust",
  dv_label_original: "Loyalty",
  iv_construct_id: null,
  dv_construct_id: null,
  mediator_labels: [],
  moderator_labels: [],
  effect_type: "direct",
  estimate_type: "std_beta",
  estimate: -0.31,
  p_value: null,
  p_reported_as: "< .001",
  status: "supported",
  observed_sign: "negative",
  significant: true,
  badge: "auto_verified",
  studies: { study_label: "Study 1", research_design: "survey" },
  papers: { title: "A paper", authors: [{ family: "Tran" }], year: 2023, journal: "J Brand", citekey: null, apa_citation: "Tran (2023). A paper. J Brand." },
  evidence: { printed_page: "412", pdf_page_index: 11 },
};
const rows: PathRow[] = [
  base,
  { ...base, id: "r2", natural_key: "study_2:h1:a->b:direct", studies: { study_label: "Study 2", research_design: "survey" }, status: "not_supported", significant: false, badge: "needs_attention", evidence: null, p_reported_as: "= .42", estimate: 0.05 },
];
const open = (r: PathRow) => `http://localhost:3000/papers/${r.paper_id}?focus=${r.natural_key}`;
const result = (q = {}) => searchRelations(rows, [], { ...DEFAULT_QUERY, a: "trust", b: "loyalty", ...q });

describe("Excel export of a search result", () => {
  it("has one row per listed test, ⚠ included, in the page's order, with the badge and the printed page", () => {
    const t = exportTable(result(), { exportedAt: new Date("2026-10-20T10:00:00Z"), openUrl: open });
    expect(t.columns).toEqual(COLUMNS);
    expect(t.rows).toHaveLength(2);
    const [first, second] = t.rows;
    const at = (name: (typeof COLUMNS)[number]) => COLUMNS.indexOf(name);
    expect(first![at("Trích dẫn")]).toBe("Tran (2023). A paper. J Brand.");
    expect(first![at("Study")]).toBe("Study 1");
    expect(first![at("Ước lượng")]).toBe("β = −.31");
    expect(first![at("p")]).toBe("p < .001");
    expect(first![at("Huy hiệu")]).toBe("✓ đã kiểm chứng");
    expect(first![at("Trang in")]).toBe("412");
    expect(first![at("Trang PDF")]).toBe(12);
    expect(first![at("Chiều tác động")]).toBe("Âm");
    expect(second![at("Huy hiệu")]).toBe("⚠ nên xem kỹ");
    expect(second![at("Trang in")]).toBeNull();
    expect(second![at("Chiều tác động")]).toBe("Không có ý nghĩa");
  });

  it("exports exactly the filtered set", () => {
    expect(exportTable(result({ status: ["not_supported"] }), { exportedAt: new Date(), openUrl: open }).rows).toHaveLength(1);
    expect(exportTable(result({ a: "nothing" }), { exportedAt: new Date(), openUrl: open }).rows).toHaveLength(0);
  });

  it("puts the question, the counts and the disclaimer on the notes sheet", () => {
    const t = exportTable(result({ status: ["supported", "not_supported"] }), { exportedAt: new Date("2026-10-20T10:00:00Z"), openUrl: open });
    const notes = Object.fromEntries(t.notes);
    expect(notes["Câu hỏi tìm kiếm"]).toBe(describeQuery({ ...DEFAULT_QUERY, a: "trust", b: "loyalty", status: ["supported", "not_supported"] }));
    expect(notes["Câu hỏi tìm kiếm"]).toContain("Biến A: trust");
    expect(notes["Ngày xuất"]).toBe("2026-10-20");
    expect(notes["Số kiểm định trong file"]).toBe("2");
    expect(notes["Trong đó đã kiểm chứng (✓ hoặc ★)"]).toBe("1");
    expect(notes["Trong đó chưa kiểm chứng (⚠ hoặc ◇)"]).toBe("1");
    expect(notes["Tuyên bố trách nhiệm"]).toBe(DISCLAIMER);
    expect(DISCLAIMER).toContain("tự đối chiếu với bài gốc");
  });

  it("writes a real .xlsx with the two sheets, a frozen header row and a clickable link", async () => {
    const bytes = await buildWorkbook(exportTable(result(), { exportedAt: new Date(), openUrl: open }));
    expect(Buffer.from(bytes.subarray(0, 2)).toString()).toBe("PK"); // a zip file
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(bytes.buffer);
    expect(wb.worksheets.map((s) => s.name)).toEqual(["Kết quả", "Ghi chú"]);
    const sheet = wb.getWorksheet("Kết quả")!;
    expect(sheet.rowCount).toBe(3);
    expect(sheet.getRow(1).values).toContain("Huy hiệu");
    expect(sheet.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
    const link = sheet.getCell(2, COLUMNS.length).value as { hyperlink?: string };
    expect(link.hyperlink).toBe("http://localhost:3000/papers/p1?focus=study_1:h1:a->b:direct");
    expect(wb.getWorksheet("Ghi chú")!.getCell(8, 2).value).toBe(DISCLAIMER);
  });
});
