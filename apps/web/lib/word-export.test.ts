import { describe, expect, it } from "vitest";
import { buildMatrix, type MatrixPath } from "./matrix";
import { DEFAULT_QUERY, type PathRow, searchRelations } from "./relations";
import { DISCLAIMER } from "./relations-export";
import { apaDocument, matrixWordSpec, relationsWordSpec } from "./word-export";

const base: MatrixPath = {
  id: "r1", paper_id: "p1", study_id: "s1", natural_key: "study_1:h1", hypothesis_code: "H1", iv_label_original: "Trust", dv_label_original: "Loyalty",
  iv_construct_id: null, dv_construct_id: null, mediator_labels: [], moderator_labels: [], effect_type: "direct", estimate_type: "std_beta", estimate: -0.31,
  p_value: null, p_reported_as: "< .001", status: "supported", observed_sign: "negative", significant: true, badge: "auto_verified",
  studies: { study_label: "Study 1", research_design: "survey" },
  papers: { title: "A paper", authors: [{ family: "Tran" }], year: 2023, journal: "J Brand", citekey: null, apa_citation: null },
  evidence: { printed_page: "412", pdf_page_index: 11 },
};
const rows: PathRow[] = [base, { ...base, id: "r2", natural_key: "study_2:h1", status: "not_supported", significant: false, badge: "needs_attention", evidence: null, p_reported_as: "= .42", estimate: 0.05 }];
const when = new Date("2026-10-23T10:00:00Z");

describe("relationsWordSpec", () => {
  const spec = relationsWordSpec(searchRelations(rows, [], { ...DEFAULT_QUERY, a: "trust", b: "loyalty" }), when);
  it("has one table with a row per listed test, badge and printed page included", () => {
    expect(spec.tables).toHaveLength(1);
    const t = spec.tables[0]!;
    expect(t.rows).toHaveLength(2);
    expect(t.columns).toContain("Huy hiệu");
    expect(t.columns).toContain("Trang");
    expect(t.rows[0]).toEqual(expect.arrayContaining(["Tran (2023)", "Study 1", "H1", "β = −.31", "p < .001", "✓ đã kiểm chứng", "412"]));
    expect(t.rows[1]).toContain("⚠ nên xem kỹ");
  });
  it("says in the note how many tests are verified and the date", () => {
    expect(spec.tables[0]!.note).toContain("2026-10-23");
    expect(spec.tables[0]!.note).toContain("1 đã kiểm chứng");
    expect(spec.tables[0]!.note).toContain("1 chưa");
  });
});

describe("matrixWordSpec", () => {
  const m = buildMatrix(["p1"], [{ paper_id: "p1", theory_name_original: "signaling theory", application_role: "tested" }], [], rows as MatrixPath[]);
  const spec = matrixWordSpec([{ citation: "Tran (2023)", title: "A paper", row: m.get("p1")! }], when, "q=trust");
  it("has a summary table and a detail table with every test", () => {
    expect(spec.tables).toHaveLength(2);
    expect(spec.tables[0]!.rows[0]![1]).toBe("Signaling theory (được kiểm định)");
    expect(spec.tables[0]!.rows[0]![3]).toBe("1 ủng hộ, 0 không ủng hộ\n1 chưa kiểm chứng (không đếm)");
    expect(spec.tables[1]!.rows).toHaveLength(2);
    expect(spec.tables[1]!.rows[1]).toContain("⚠ chưa kiểm chứng");
    expect(spec.tables[1]!.note).toContain("bộ lọc: q=trust");
  });
});

describe("apaDocument", () => {
  it("writes a zip (.docx) that carries the table titles, the notes and the disclaimer", async () => {
    const bytes = await apaDocument({ landscape: true, tables: [{ title: "T", columns: ["A", "B"], rows: [["1", "2"]], note: "n" }] });
    expect(String.fromCharCode(bytes[0]!, bytes[1]!)).toBe("PK");
    expect(bytes.length).toBeGreaterThan(2000);
    expect(DISCLAIMER.length).toBeGreaterThan(50);
  });
});
