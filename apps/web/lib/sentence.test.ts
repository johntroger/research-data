import { describe, expect, it } from "vitest";
import { type PathRow } from "./relations";
import { academicSentence, inTextCitation } from "./sentence";

const base: PathRow = {
  id: "r1", paper_id: "p1", study_id: "s1", natural_key: "k", hypothesis_code: "H1", iv_label_original: "perceived ease of use", dv_label_original: "intention to use",
  iv_construct_id: null, dv_construct_id: null, mediator_labels: [], moderator_labels: [], effect_type: "direct", estimate_type: "std_beta", estimate: 0.35,
  p_value: null, p_reported_as: "< .001", status: "supported", observed_sign: "positive", significant: true, badge: "auto_verified",
  studies: { study_label: "Study 1", research_design: "survey" },
  papers: { title: "T", authors: [{ family: "Nguyen" }, { family: "Le" }, { family: "Pham" }], year: 2023, journal: null, citekey: null, apa_citation: null },
  evidence: { printed_page: "1252", pdf_page_index: 5 },
};

describe("academicSentence", () => {
  it("writes a survey result as a relation, with the statistic and the citation", () => {
    expect(academicSentence(base)).toBe("Perceived ease of use positively relates to intention to use (β = .35, p < .001; Nguyen et al., 2023, p. 1252).");
  });
  it("says 'affects' only for an experiment", () => {
    const exp = { ...base, studies: { study_label: "Study 1", research_design: "online_experiment" } };
    expect(academicSentence(exp)).toContain("positively affects intention to use");
  });
  it("states a non-significant and a negative result", () => {
    expect(academicSentence({ ...base, significant: false, observed_sign: null, p_reported_as: "= .42", estimate: 0.05 })).toContain("is not significantly related to intention to use (β = .05, p = .42;");
    expect(academicSentence({ ...base, observed_sign: "negative", estimate: -0.2 })).toContain("negatively relates to");
  });
  it("words an indirect and a moderated effect", () => {
    expect(academicSentence({ ...base, effect_type: "indirect", mediator_labels: ["trust"] })).toContain("The indirect effect of perceived ease of use on intention to use through trust was significant");
    expect(academicSentence({ ...base, effect_type: "interaction", moderator_labels: ["age"], significant: false })).toContain("was not moderated by age");
  });
  it("never writes a sentence for a ⚠ or ◇ test, a control or a total effect", () => {
    expect(academicSentence({ ...base, badge: "needs_attention" })).toBeNull();
    expect(academicSentence({ ...base, badge: "ai_interpreted" })).toBeNull();
    expect(academicSentence({ ...base, effect_type: "control" })).toBeNull();
    expect(academicSentence({ ...base, effect_type: "total" })).toBeNull();
    expect(academicSentence({ ...base, significant: null })).toBeNull();
  });
  it("writes 'estimate' when the estimate type is unknown", () => {
    expect(academicSentence({ ...base, estimate_type: null })).toContain("(estimate = .35, p < .001;");
  });
  it("accepts a hand-reviewed test and omits the page when unknown", () => {
    expect(academicSentence({ ...base, badge: "human_reviewed", evidence: null })).toContain("(β = .35, p < .001; Nguyen et al., 2023).");
  });
});

describe("inTextCitation", () => {
  it("handles one, two and many authors and a missing year", () => {
    const p = (n: number, year: number | null) => ({ title: null, authors: Array.from({ length: n }, (_, i) => ({ family: ["Ao", "Be", "Ce"][i]! })), year, journal: null, citekey: null, apa_citation: null });
    expect(inTextCitation(p(1, 2020))).toBe("Ao, 2020");
    expect(inTextCitation(p(2, 2020))).toBe("Ao & Be, 2020");
    expect(inTextCitation(p(3, null))).toBe("Ao et al.");
    expect(inTextCitation(null)).toBe("");
  });
});
