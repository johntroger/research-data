import { describe, expect, it } from "vitest";
import { authorLine, paperFacts, readableKey, sourceLine } from "./paper-header";

describe("authorLine", () => {
  it("joins names with commas and an ampersand", () => {
    expect(authorLine([{ given: "Arjun", family: "Chaudhuri" }, { given: "Morris B.", family: "Holbrook" }])).toBe("Arjun Chaudhuri & Morris B. Holbrook");
    expect(authorLine([{ family: "A" }, { family: "B" }, { family: "C" }])).toBe("A, B & C");
    expect(authorLine([])).toBe("");
  });
});

describe("sourceLine", () => {
  it("shows journal, volume(issue), pages and year, whatever is known", () => {
    expect(sourceLine({ journal: "Journal of Marketing", volume: "65", issue: "2", pages: "81-93", year: 2001 })).toBe("Journal of Marketing, 65(2), 81–93 (2001)");
    expect(sourceLine({ journal: null, year: 2026 })).toBe("(2026)");
    expect(sourceLine({ journal: "X", year: null })).toBe("X");
  });
});

describe("paperFacts", () => {
  const f = (natural_key: string, field_name: string, value: unknown, badge = "auto_verified") => ({ natural_key, field_name, value, badge });
  it("reads type, designs, sample sizes and the number of tests from the fields", () => {
    const facts = paperFacts([
      f("paper_type", "paper_type", "empirical_quant"),
      f("study_1:research_design", "research_design", "survey"),
      f("study_2:research_design", "research_design", "survey"),
      f("study_1:sample_size", "sample_size", 312),
      f("study_1:h1:a->b:direct:estimate", "estimate", -0.31),
      f("study_1:h1:a->b:direct:status", "status", "supported", "needs_attention"),
    ]);
    expect(facts).toMatchObject({ type: "empirical_quant", designs: ["survey"], sampleSizes: [312], tests: 1, fields: 6, verified: 5 });
  });

  it("counts a path that reports no estimate, and an indirect effect, as tests", () => {
    const facts = paperFacts([
      f("study_1:h2:a->c:direct:p_reported_as", "p_reported_as", "< .05"),
      f("study_1:h2:a->c:direct:status", "status", "supported"),
      f("study_1::a->c:indirect:indirect_effect", "indirect_effect", 0.12),
      f("study_1:corr:table_2:r:1,0", "r", 0.4),
    ]);
    expect(facts.tests).toBe(2);
  });

  it("finds a study's sample as the full extraction stores it, not a matrix's or a cell's n", () => {
    const facts = paperFacts([
      f("study_1:n", "n", 107),
      f("study_2:n", "n", 1250),
      f("study_1:corr:table_2:n", "n", 107),
      f("study_1:cell:brand_2:cpe:n", "n", 40),
    ]);
    expect(facts.sampleSizes).toEqual([107, 1250]);
  });
});

describe("readableKey", () => {
  it("says which study, hypothesis and path a field belongs to", () => {
    expect(readableKey("study_1:h1:a->b:direct")).toBe("Study 1 · H1 · a → b · direct");
    expect(readableKey("table:table_1")).toBe("Bảng 1");
    expect(readableKey("paper_type")).toBe("paper type");
  });
});
