import { describe, expect, it } from "vitest";
import { fieldLabel, groupBadge, groupFields, testSummary, valueLabel } from "./field-labels.js";

const f = (natural_key: string, field_name: string, badge = "auto_verified", value: unknown = null) => ({ natural_key, field_name, badge, value });

describe("names and codes in words", () => {
  it("translates the field names and falls back to the code with spaces", () => {
    expect(fieldLabel("estimate_type")).toBe("Loại ước lượng");
    expect(fieldLabel("se")).toBe("Sai số chuẩn (SE)");
    expect(fieldLabel("some_new_field")).toBe("some new field");
  });

  it("translates the coded values of a field, and leaves any other value alone", () => {
    expect(valueLabel("effect_type", "direct")).toBe("Trực tiếp");
    expect(valueLabel("estimate_type", "odds_ratio")).toBe("Tỷ số chênh (OR)");
    expect(valueLabel("status", "supported")).toBe("✓ Ủng hộ");
    expect(valueLabel("effect_type", "something_new")).toBeNull();
    expect(valueLabel("estimate", "1.69")).toBeNull();
    expect(valueLabel("effect_type", 3)).toBeNull();
  });
});

describe("one group for the fields of one test", () => {
  const fields = [
    f("study_1:h1:a->b:direct:effect_type", "effect_type"),
    f("paper_type", "paper_type"),
    f("study_1:h1:a->b:direct:estimate", "estimate"),
    f("study_1:h1:a->c:direct:estimate", "estimate"),
    f("study_1:h1:a->b:direct:se", "se"),
  ];

  it("puts the fields that share a test together, where the first of them was, and leaves a lone field alone", () => {
    const groups = groupFields(fields);
    expect(groups.map((g) => [g.context, g.fields.map((x) => x.field_name)])).toEqual([
      ["study_1:h1:a->b:direct", ["effect_type", "estimate", "se"]],
      [null, ["paper_type"]],
      [null, ["estimate"]],
    ]);
  });

  it("loses and repeats no field", () => {
    expect(groupFields(fields).flatMap((g) => g.fields)).toHaveLength(fields.length);
    expect(groupFields([])).toEqual([]);
  });

  it("takes the weakest badge of the group", () => {
    expect(groupBadge([{ badge: "auto_verified" }, { badge: "auto_verified" }])).toBe("auto_verified");
    expect(groupBadge([{ badge: "auto_verified" }, { badge: "ai_interpreted" }])).toBe("ai_interpreted");
    expect(groupBadge([{ badge: "ai_interpreted" }, { badge: "needs_attention" }])).toBe("needs_attention");
    expect(groupBadge([{ badge: "human_reviewed" }, { badge: "human_reviewed" }])).toBe("human_reviewed");
  });
});

describe("the numbers of a test on one line", () => {
  it("joins the estimate (with its kind), SE, p and the result", () => {
    expect(
      testSummary([
        { field_name: "estimate", value: 1.69 },
        { field_name: "estimate_type", value: "unstd_b" },
        { field_name: "se", value: 0.18 },
        { field_name: "p_reported_as", value: "< .01" },
        { field_name: "status", value: "supported" },
      ]),
    ).toBe("b chưa chuẩn hóa 1.69 · SE 0.18 · p < .01 · ✓ Ủng hộ");
  });

  it("says 'Ước lượng' when the kind is 'other' or missing, skips what is absent, and is empty when nothing is there", () => {
    expect(testSummary([{ field_name: "estimate", value: 0.36 }, { field_name: "estimate_type", value: "other" }])).toBe("Ước lượng 0.36");
    expect(testSummary([{ field_name: "effect_type", value: "direct" }])).toBe("");
  });
});
