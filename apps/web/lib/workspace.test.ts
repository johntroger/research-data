import { describe, expect, it } from "vitest";
import {
  clampSplit,
  defaultTab,
  firstTabWithFields,
  keyContext,
  parseStoredSplit,
  SPLIT_DEFAULT,
  SPLIT_MAX,
  SPLIT_MIN,
  sectionBadge,
  splitFromPointer,
  summariseSections,
  tabOf,
} from "./workspace.js";

import { makeT, type MessageKey } from "./i18n";

const say = (key: string, vars?: Record<string, string | number>) => makeT("vi")(key as MessageKey, vars);
const f = (natural_key: string, field_name: string, badge = "auto_verified") => ({ natural_key, field_name, badge });

describe("tabOf: where each kind of field is shown", () => {
  it("puts every kind of natural key of the pipeline in its tab", () => {
    const cases: [string, string, string][] = [
      ["paper_type", "paper_type", "overview"],
      ["table:table_2", "table", "overview"],
      ["theory:privacy_calculus_theory", "theory_name_original", "theory"],
      ["theory:privacy_calculus_theory:role", "application_role", "theory"],
      ["study_1:research_design", "research_design", "study"],
      ["study_2a:sample_size", "sample_size", "study"],
      ["study_1:m:trust:alpha", "alpha", "measures"],
      ["study_1:h2:risk->intention:direct:estimate", "estimate", "results"],
      ["study_1::a->b:indirect:indirect_effect", "indirect_effect", "results"],
      ["study_1:corr:table_2:r:1,0", "r", "tables"],
      ["study_1:cell:brand_2:cpe:mean", "mean", "tables"],
      ["limitation:3", "limitation", "contribution"],
      ["future_direction:12", "future_direction", "contribution"],
      ["theoretical_contribution:1", "theoretical_contribution", "contribution"],
      ["practical_implication:2", "practical_implication", "contribution"],
      ["contribution_type", "contribution_type", "contribution"],
      ["gap_type", "gap_type", "contribution"],
    ];
    for (const [key, name, tab] of cases) expect(tabOf(f(key, name)), key).toBe(tab);
  });

  it("is not fooled by a variable called like a field or a study called 'theory'", () => {
    expect(tabOf(f("study_1:m:limitation_perception:alpha", "alpha"))).toBe("measures");
    expect(tabOf(f("study_1:h1:theory->trust:direct:estimate", "estimate"))).toBe("results");
  });
});

describe("section summaries", () => {
  const fields = [
    f("study_1:h1:a->b:direct:estimate", "estimate"),
    f("study_1:h1:a->b:direct:p_reported_as", "p_reported_as", "human_reviewed"),
    f("study_1:h1:a->b:direct:status", "status", "needs_attention"),
    f("study_1:h1:a->b:direct:effect_type", "effect_type", "disputed"),
    f("limitation:1", "limitation", "ai_interpreted"),
    f("limitation:2", "limitation", "ai_interpreted"),
    f("paper_type", "paper_type"),
  ];
  const summary = summariseSections(fields);

  it("counts ✓ and ★ as verified, ⚠ and ⚑ as needing attention, ◇ apart", () => {
    expect(summary.results).toEqual({ total: 4, verified: 2, attention: 2, interpreted: 0 });
    expect(summary.contribution).toEqual({ total: 2, verified: 0, attention: 0, interpreted: 2 });
    expect(summary.overview).toEqual({ total: 1, verified: 1, attention: 0, interpreted: 0 });
    expect(summary.theory.total).toBe(0);
  });

  it("words the badge of a section: x/y checked, only the ◇ count for interpretations, or that nothing is shown", () => {
    expect(sectionBadge("Kết quả", summary.results, say)).toBe("Kết quả: 2/4 đã kiểm chứng");
    expect(sectionBadge("Đóng góp & Khoảng trống", summary.contribution, say)).toBe("Đóng góp & Khoảng trống: ◇ 2 mục AI diễn giải");
    expect(sectionBadge("Lý thuyết", summary.theory, say)).toBe("Lý thuyết: chưa có trường nào hiển thị được");
    expect(sectionBadge("X", { total: 5, verified: 3, attention: 0, interpreted: 2 }, say)).toBe("X: 3/3 đã kiểm chứng · ◇ 2 mục AI diễn giải");
  });

  it("opens on the first tab that has fields, never an empty one", () => {
    expect(firstTabWithFields(summary)).toBe("overview");
    expect(firstTabWithFields(summariseSections([f("limitation:1", "limitation", "ai_interpreted")]))).toBe("contribution");
    expect(firstTabWithFields(summariseSections([]))).toBe("overview");
  });

  it("opens a paper on its results when it has any, else on the first tab with fields", () => {
    expect(defaultTab(summary)).toBe("results");
    expect(defaultTab(summariseSections([f("limitation:1", "limitation", "ai_interpreted")]))).toBe("contribution");
  });
});

describe("keyContext", () => {
  it("drops the field name, which says which path / construct / study the field is of", () => {
    expect(keyContext("study_1:h1:a->b:direct:estimate", "estimate")).toBe("study_1:h1:a->b:direct");
    expect(keyContext("paper_type", "paper_type")).toBe("paper_type");
    expect(keyContext("limitation:3", "limitation")).toBe("limitation:3");
  });
});

describe("the divider", () => {
  it("stays between the minimum and the maximum, and a nonsense value gives the default", () => {
    expect(clampSplit(10)).toBe(SPLIT_MIN);
    expect(clampSplit(95)).toBe(SPLIT_MAX);
    expect(clampSplit(50.4)).toBe(50);
    expect(clampSplit(Number.NaN)).toBe(SPLIT_DEFAULT);
  });

  it("follows the pointer inside the container", () => {
    expect(splitFromPointer(500, 100, 1000)).toBe(40);
    expect(splitFromPointer(0, 100, 1000)).toBe(SPLIT_MIN);
    expect(splitFromPointer(5000, 100, 1000)).toBe(SPLIT_MAX);
    expect(splitFromPointer(300, 0, 0)).toBe(SPLIT_DEFAULT);
  });

  it("remembers the choice but never trusts what it reads back", () => {
    expect(parseStoredSplit("60")).toBe(60);
    expect(parseStoredSplit("99")).toBe(SPLIT_MAX);
    expect(parseStoredSplit(null)).toBe(SPLIT_DEFAULT);
    expect(parseStoredSplit("")).toBe(SPLIT_DEFAULT);
    expect(parseStoredSplit("abc")).toBe(SPLIT_DEFAULT);
  });
});
