import { describe, expect, it } from "vitest";
import { buildSheet, cleanQuote } from "./paper-sheet";
import type { MatrixPath, SampleRow, TheoryRow } from "./matrix";

let n = 0;
const path = (o: Partial<MatrixPath> = {}): MatrixPath => {
  n++;
  return {
    id: `p${n}`, paper_id: "paper", study_id: "s1", natural_key: `study_1:h${n}:a->b:direct`, hypothesis_code: `H${n}`, iv_label_original: "A", dv_label_original: "B",
    iv_construct_id: null, dv_construct_id: null, mediator_labels: [], moderator_labels: [], effect_type: "direct", estimate_type: "std_beta", estimate: 0.3, p_value: null,
    p_reported_as: "< .001", status: "supported", observed_sign: "positive", significant: true, badge: "auto_verified",
    studies: { study_label: "Study 1", research_design: "survey" }, papers: null, evidence: { printed_page: "12", pdf_page_index: 11, table_or_figure: "Table 3" }, ...o,
  };
};
const sample = (id: string, label: string, position: number, design: string, count: number): SampleRow => ({
  paper_id: "paper", study_id: id, n: count, country_iso: ["US"], sample_type: "mturk", studies: { study_label: label, position, research_design: design },
});
const field = (natural_key: string, value: unknown) => ({ natural_key, field_name: natural_key.split(":").pop()!, value });

describe("cleanQuote", () => {
  it("turns ligatures into letters and joins words broken at the end of a line", () => {
    expect(cleanQuote("the brand eth- icality of our ﬁndings")).toBe("the brand ethicality of our findings");
    expect(cleanQuote("two  spaces\nand a break")).toBe("two spaces and a break");
  });
});

describe("buildSheet", () => {
  const paths = [
    path(),
    path({ natural_key: "study_1:h1:a->b:direct#2", hypothesis_code: "H1", estimate: 0.35 }), // the same hypothesis stated again
    path({ status: "not_hypothesized", hypothesis_code: null }),
    path({ effect_type: "control", status: "not_hypothesized" }),
    path({ status: "not_supported", badge: "needs_attention", study_id: "s2", studies: { study_label: "Study 2", research_design: "online_experiment" } }),
  ];
  // The "#2" row must share the main row's hypothesis code, variables and effect to fold under it.
  paths[1]!.hypothesis_code = paths[0]!.hypothesis_code;
  const samples = [sample("s2", "Study 2", 2, "online_experiment", 187), sample("s1", "Study 1", 1, "survey", 392)];
  const theories: TheoryRow[] = [
    { paper_id: "paper", theory_name_original: "Signalling theory", application_role: "mentioned" },
    { paper_id: "paper", theory_name_original: "Attribution theory", application_role: "tested" },
  ];
  const fields = [
    field("theoretical_contribution:2", "second  point"),
    field("theoretical_contribution:1", "first point"),
    field("limitation:1", "small sample"),
    field("gap_type", "theoretical"),
    field("contribution_type", { utility: "both", originality: "revelatory" }),
  ];
  const sheet = buildSheet(paths, samples, theories, fields);

  it("shows only the AI statements whose quote the machine found, with the 1-based PDF page", () => {
    const withSummary = buildSheet(paths, samples, theories, fields, "moderator", {
      summary: {
        research_question: "Does X raise Y?",
        question_quote: "q",
        question_page_index: 1,
        question_match: "exact",
        findings: [
          { text: "found", quote: "q", pdf_page_index: 0, match: "fuzzy" },
          { text: "invented", quote: "q", pdf_page_index: 0, match: "not_found" },
        ],
      },
      abstract: { text: "An abstract.", source: "Crossref" },
    });
    expect(withSummary.question).toEqual({ text: "Does X raise Y?", page: 2 });
    expect(withSummary.conclusions).toEqual([{ text: "found", page: 1 }]);
    expect(withSummary.abstract?.source).toBe("Crossref");
    const lost = buildSheet(paths, samples, theories, fields, "moderator", { summary: { research_question: "Q", question_quote: null, question_page_index: null, question_match: "not_found", findings: [] } });
    expect(lost.question).toBeNull();
    expect(buildSheet(paths, samples, theories, fields).question).toBeNull();
  });

  it("orders the studies and gives design and sample of each", () => {
    expect(sheet.studies.map((s) => [s.label, s.design, s.n])).toEqual([["Study 1", "survey", 392], ["Study 2", "online_experiment", 187]]);
  });

  it("lists hypothesis tests by study, folds a repeated statement under the first, and counts the other paths apart", () => {
    expect(sheet.hypotheses.map((s) => [s.label, s.rows.length])).toEqual([["Study 1", 1], ["Study 2", 1]]);
    const h1 = sheet.hypotheses[0]!.rows[0]!;
    expect(h1).toMatchObject({ code: expect.stringMatching(/^H/), table: "Table 3", printedPage: "12", repeats: 1, verified: true });
    expect(sheet.hypotheses[1]!.rows[0]).toMatchObject({ status: "not_supported", verified: false });
    expect(sheet.hypothesisCount).toBe(2);
    expect(sheet.otherPaths).toBe(1); // the path with no hypothesis; the control is not counted at all
  });

  it("puts the theory that is tested first, and reads the statements in order, cleaned", () => {
    expect(sheet.theories.map((t) => t.name)).toEqual(["Attribution theory", "Signalling theory"]);
    expect(sheet.statements.theoretical).toEqual(["first point", "second point"]);
    expect(sheet.statements.limitations).toEqual(["small sample"]);
    expect(sheet.gap).toBe("theoretical");
    expect(sheet.contribution).toEqual({ utility: "both", originality: "revelatory" });
  });

  it("copes with a paper that has nothing", () => {
    const empty = buildSheet([], [], [], []);
    expect(empty).toMatchObject({ studies: [], hypotheses: [], hypothesisCount: 0, otherPaths: 0, theories: [], contribution: null, gap: null });
  });
});
