import { describe, expect, it } from "vitest";
import { buildMatrix, outcomeOf, pathLine, theoryChips, type MatrixPath, type SampleRow } from "./matrix";

const path = (o: Partial<MatrixPath>): MatrixPath => ({
  id: "p", paper_id: "A", study_id: "s1", natural_key: "study_1:path:h1", hypothesis_code: "H1", iv_label_original: "Trust", dv_label_original: "Loyalty",
  iv_construct_id: null, dv_construct_id: null, mediator_labels: [], moderator_labels: [], effect_type: "direct", estimate_type: "std_beta", estimate: 0.35,
  p_value: 0.001, p_reported_as: "< .001", status: "supported", observed_sign: "positive", significant: true, badge: "auto_verified", studies: { study_label: "Study 1", research_design: "survey" },
  papers: null, evidence: { printed_page: "1252", pdf_page_index: 3 }, ...o,
});

describe("outcomeOf", () => {
  it("counts only verified hypothesis tests and shows the rest as unchecked", () => {
    const o = outcomeOf([
      path({}),
      path({ id: "2", status: "not_supported" }),
      path({ id: "3", status: "partially_supported" }),
      path({ id: "4", badge: "needs_attention" }),
      path({ id: "5", status: "not_hypothesized" }),
      path({ id: "6", effect_type: "control" }),
    ]);
    expect(o).toEqual({ supported: 1, notSupported: 1, mixed: 1, unchecked: 1 });
  });
});

describe("theoryChips", () => {
  it("puts theories the paper leans on first, drops duplicates, capitalises plain names", () => {
    const chips = theoryChips([
      { paper_id: "A", theory_name_original: "signaling theory", application_role: "mentioned" },
      { paper_id: "A", theory_name_original: "Social Exchange Theory", application_role: "tested" },
      { paper_id: "A", theory_name_original: "Signaling Theory", application_role: "framing" },
      { paper_id: "A", theory_name_original: "attribution theory", application_role: "framing" },
      { paper_id: "A", theory_name_original: "TPB", application_role: "extended" },
    ]);
    expect(chips.map((c) => c.name)).toEqual(["Social Exchange Theory", "TPB", "Signaling Theory"]);
  });
});

describe("pathLine", () => {
  it("writes the statistic in APA style with the confidence interval", () => {
    const l = pathLine(path({ ci_low: 0.2, ci_high: 0.5, r2_dv: 0.41 }));
    expect(l.statistic).toBe("β = .35, 95% CI [.20, .50], p < .001");
    expect(l.r2).toBe("R² = .41");
    expect(l.relation).toBe("Trust → Loyalty");
  });
  it("names the mediators and moderators", () => {
    expect(pathLine(path({ mediator_labels: ["Gratitude"] })).relation).toBe("Trust → Gratitude → Loyalty");
    expect(pathLine(path({ moderator_labels: ["Age"] })).relation).toBe("Trust (điều tiết: Age) → Loyalty");
  });
});

describe("buildMatrix", () => {
  const sample = (o: Partial<SampleRow>): SampleRow => ({ paper_id: "A", study_id: "s1", n: 412, country_iso: ["US"], sample_type: "mturk", studies: { study_label: "Study 1", position: 1, research_design: "survey" }, ...o });
  it("groups paths under their study, in study order, without control paths", () => {
    const m = buildMatrix(["A", "B"], [], [sample({}), sample({ study_id: "s2", n: 120, studies: { study_label: "Study 2", position: 2, research_design: "online_experiment" } })], [
      path({ study_id: "s2", id: "x", studies: { study_label: "Study 2", research_design: "online_experiment" } }),
      path({ id: "y" }),
      path({ id: "z", effect_type: "control" }),
    ]);
    const a = m.get("A")!;
    expect(a.studies.map((s) => [s.label, s.n, s.lines.length])).toEqual([["Study 1", 412, 1], ["Study 2", 120, 1]]);
    expect(m.get("B")).toMatchObject({ studies: [], theories: [] });
  });
});
