import { describe, expect, it } from "vitest";
import { formatQuality, problemRate, type BadgeName, type QualityField, summariseQuality } from "./quality.js";

const f = (paperId: string, design: string | null, fieldName: string, badge: BadgeName, failedChecks: string[] = []): QualityField => ({ paperId, paperTitle: `Paper ${paperId}`, design, fieldName, badge, failedChecks });

const fields: QualityField[] = [
  f("a", "survey", "estimate", "auto_verified"),
  f("a", "survey", "estimate", "auto_verified"),
  f("a", "survey", "r", "hidden", ["quote_in_pdf", "number_in_pdf"]),
  f("a", null, "limitation", "ai_interpreted"),
  f("b", "online_experiment", "estimate", "needs_attention", ["stat_consistency"]),
  f("b", "online_experiment", "r", "hidden", ["quote_in_pdf"]),
  f("b", "online_experiment", "r", "auto_verified"),
  f("b", null, "future_direction", "ai_interpreted"),
];

describe("summariseQuality", () => {
  const s = summariseQuality(fields);

  it("counts the badges overall and the problem rate over checkable fields only (◇ is not checkable)", () => {
    expect(s.papers).toBe(2);
    expect(s.fields).toBe(8);
    expect(s.total).toMatchObject({ verified: 3, attention: 1, interpreted: 2, hidden: 2 });
    expect(s.total.problemRate).toBeCloseTo(3 / 6, 10);
  });

  it("groups by study design, with paper-level fields apart", () => {
    const by = Object.fromEntries(s.byDesign.map((r) => [r.name, r]));
    expect(by.survey).toMatchObject({ verified: 2, hidden: 1, papers: 1 });
    expect(by.survey!.problemRate).toBeCloseTo(1 / 3, 10);
    expect(by.online_experiment).toMatchObject({ attention: 1, hidden: 1, verified: 1 });
    expect(by["(paper-level)"]).toMatchObject({ interpreted: 2, papers: 2, problemRate: 0 });
  });

  it("puts the field with most ⚠ + hidden first, and counts the papers it affects", () => {
    expect(s.byField.map((r) => r.name)).toEqual(["r", "estimate", "future_direction", "limitation"]);
    expect(s.byField[0]).toMatchObject({ name: "r", hidden: 2, verified: 1, papers: 2 });
  });

  it("lists failed checks of ⚠ and hidden fields only, with fields and papers", () => {
    expect(s.byCheck).toEqual([
      { name: "r / quote_in_pdf", fields: 2, papers: 2 },
      { name: "estimate / stat_consistency", fields: 1, papers: 1 },
      { name: "r / number_in_pdf", fields: 1, papers: 1 },
    ]);
  });

  it("ignores failed checks on a field that ended ✓ or ◇", () => {
    const x = summariseQuality([f("a", null, "estimate", "auto_verified", ["note"]), f("a", null, "x", "ai_interpreted", ["note"])]);
    expect(x.byCheck).toEqual([]);
  });

  it("handles no fields", () => {
    const x = summariseQuality([]);
    expect(x).toMatchObject({ fields: 0, papers: 0, byField: [], byCheck: [] });
    expect(problemRate(x.total)).toBe(0);
    expect(formatQuality(x)).toContain("0 paper(s), 0 field(s)");
  });

  it("formats a readable report", () => {
    const text = formatQuality(s);
    expect(text).toContain("2 paper(s), 8 field(s): ✓ 3  ⚠ 1  ◇ 2  ẩn 2");
    expect(text).toContain("By study design");
    expect(text).toContain("r / quote_in_pdf");
  });
});
