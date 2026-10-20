import { describe, expect, it } from "vitest";
import {
  apaNumber,
  type Concept,
  DEFAULT_QUERY,
  findRows,
  formatEstimate,
  formatP,
  normalise,
  paperLabel,
  parseQuery,
  type PathRow,
  queryToSearch,
  type RelationQuery,
  searchRelations,
  suggestions,
} from "./relations.js";

let n = 0;
/** A visible, verified, direct path from IV to DV; each test changes what it needs. */
function row(iv: string, dv: string, extra: Partial<PathRow> = {}): PathRow {
  n++;
  return {
    id: `r${n}`,
    paper_id: "p1",
    study_id: "s1",
    natural_key: `study_1:h${n}:${iv}->${dv}:direct`,
    hypothesis_code: `H${n}`,
    iv_label_original: iv,
    dv_label_original: dv,
    iv_construct_id: null,
    dv_construct_id: null,
    mediator_labels: [],
    moderator_labels: [],
    effect_type: "direct",
    estimate_type: "std_beta",
    estimate: 0.3,
    p_value: null,
    p_reported_as: "< .001",
    status: "supported",
    observed_sign: "positive",
    significant: true,
    badge: "auto_verified",
    studies: { study_label: "Study 1", research_design: "survey" },
    papers: { title: "A paper", authors: [{ family: "Nguyen" }, { family: "Tran" }, { family: "Le" }], year: 2023, journal: "J", citekey: null, apa_citation: null },
    evidence: { printed_page: "12", pdf_page_index: 11 },
    ...extra,
  };
}
const q = (extra: Partial<RelationQuery>): RelationQuery => ({ ...DEFAULT_QUERY, ...extra });
const labels = (rows: PathRow[]) => rows.map((r) => `${r.iv_label_original} -> ${r.dv_label_original}`);

describe("the query in the URL", () => {
  it("has defaults: A to B, direct, equivalent names on, only ✓ / ★ counted", () => {
    expect(parseQuery({})).toEqual(DEFAULT_QUERY);
  });

  it("reads what is typed, and ignores values it does not know", () => {
    expect(parseQuery({ a: " Perceived Risk ", b: "Intention", dir: "sideways", role: "mediated", status: ["supported", "bogus"], sign: "negative" })).toEqual({
      a: "Perceived Risk",
      b: "Intention",
      dir: "ab",
      role: "mediated",
      equiv: true,
      includeWarn: false,
      status: ["supported"],
      sign: ["negative"],
    });
  });

  it("tells a ticked checkbox from an unticked one: the form sends a hidden 0, and 1 when ticked", () => {
    expect(parseQuery({ equiv: "0" }).equiv).toBe(false);
    expect(parseQuery({ equiv: ["0", "1"] }).equiv).toBe(true);
    expect(parseQuery({ warn: "1" }).includeWarn).toBe(true);
    expect(parseQuery({}).includeWarn).toBe(false);
  });

  it("makes a shareable URL that reads back as the same query", () => {
    const query = q({ a: "risk", b: "trust", dir: "both", role: "all", equiv: false, includeWarn: true, status: ["supported", "mixed"], sign: ["none"] });
    const search = queryToSearch(query);
    expect(search).toBe("a=risk&b=trust&dir=both&role=all&equiv=0&warn=1&status=supported&status=mixed&sign=none");
    const params: Record<string, string[]> = {};
    for (const [k, v] of new URLSearchParams(search)) params[k] = [...(params[k] ?? []), v];
    expect(parseQuery(params)).toEqual(query);
    expect(queryToSearch(q({ a: "x" }))).toBe("a=x"); // defaults are left out
  });
});

describe("finding the tests of a relationship", () => {
  const rows = [
    row("Perceived Risk", "Purchase Intention"),
    row("Purchase Intention", "Perceived Risk"),
    row("Brand Trust", "Purchase Intention"),
    row("Perceived Risk", "Brand Trust"),
  ];

  it("matches the names the authors used when every word typed is in the name, ignoring case and accents", () => {
    expect(labels(findRows(rows, [], q({ a: "perceived RISK", b: "intention" })))).toEqual(["Perceived Risk -> Purchase Intention"]);
    expect(labels(findRows([row("Trải nghiệm", "Lòng tin")], [], q({ a: "trai nghiem", b: "long tin" })))).toHaveLength(1);
  });

  it("reads the direction: A to B, B to A, or either", () => {
    expect(labels(findRows(rows, [], q({ a: "risk", b: "intention", dir: "ba" })))).toEqual(["Purchase Intention -> Perceived Risk"]);
    expect(findRows(rows, [], q({ a: "risk", b: "intention", dir: "both" }))).toHaveLength(2);
  });

  it("lets one side stay empty (anything) and shows nothing for no question at all only on the page", () => {
    expect(labels(findRows(rows, [], q({ b: "brand trust" })))).toEqual(["Perceived Risk -> Brand Trust"]);
    expect(findRows(rows, [], q({}))).toHaveLength(4); // the page does not search without a question (hasQuestion)
  });

  it("with equivalent names on, also finds the canonical concept's aliases and mapped paths", () => {
    const concepts: Concept[] = [{ id: "risk", canonical_name: "Perceived Risk", aliases: ["Risk Perception", "Consumer Perceived Risk"] }];
    const data = [row("Consumer risk perception", "Purchase Intention"), row("Something unrelated", "Purchase Intention", { iv_construct_id: "risk" })];
    expect(findRows(data, concepts, q({ a: "perceived risk", b: "intention" }))).toHaveLength(2);
    expect(findRows(data, concepts, q({ a: "perceived risk", b: "intention", equiv: false }))).toHaveLength(0);
  });

  it("reads the role: direct, through a mediator, moderated, or all but control variables", () => {
    const data = [
      row("A", "B"),
      row("A", "B", { effect_type: "indirect", mediator_labels: ["M"] }),
      row("A", "B", { effect_type: "interaction", moderator_labels: ["W"] }),
      row("A", "B", { effect_type: "total" }),
      row("A", "B", { effect_type: "control" }),
    ];
    const count = (role: RelationQuery["role"]) => findRows(data, [], q({ a: "a", b: "b", role })).length;
    expect([count("direct"), count("mediated"), count("moderated"), count("all")]).toEqual([1, 1, 1, 4]);
  });

  it("filters by the hypothesis result (partly supported counts as mixed) and by the direction of the effect", () => {
    const data = [
      row("A", "B", { status: "supported", observed_sign: "positive", significant: true }),
      row("A", "B", { status: "not_supported", observed_sign: "negative", significant: false }),
      row("A", "B", { status: "partially_supported", observed_sign: "negative", significant: true }),
      row("A", "B", { status: "supported", observed_sign: null, significant: null }),
    ];
    expect(findRows(data, [], q({ a: "a", status: ["mixed"] }))).toHaveLength(1);
    expect(findRows(data, [], q({ a: "a", status: ["supported", "not_supported"] }))).toHaveLength(3);
    expect(findRows(data, [], q({ a: "a", sign: ["negative"] }))).toHaveLength(1);
    expect(findRows(data, [], q({ a: "a", sign: ["none", "positive"] }))).toHaveLength(2);
  });
});

describe("the summary counts what is in the repository", () => {
  const data = [
    row("A", "B", { paper_id: "p1", study_id: "s1", status: "supported", observed_sign: "negative", significant: true }),
    row("A", "B", { paper_id: "p1", study_id: "s2", status: "not_supported", observed_sign: "positive", significant: false }),
    row("A", "B", { paper_id: "p2", study_id: "s3", status: "supported", observed_sign: "negative", significant: true, badge: "human_reviewed" }),
    row("A", "B", { paper_id: "p3", study_id: "s4", badge: "needs_attention", studies: { study_label: "Study 1", research_design: "online_experiment" } }),
    row("A", "B", { paper_id: "p3", study_id: "s5", badge: "ai_interpreted", studies: { study_label: "Study 2", research_design: "online_experiment" } }),
  ];

  it("counts papers, studies and tests that are ✓ or ★, by hypothesis result and direction of the effect", () => {
    const { summary } = searchRelations(data, [], q({ a: "a", b: "b" }));
    expect(summary).toMatchObject({ papers: 2, studies: 3, tests: 3 });
    expect(summary.outcome).toEqual({ supported: 2, not_supported: 1, mixed: 0, not_hypothesized: 0 });
    expect(summary.direction).toEqual({ positive: 0, negative: 2, none: 1, unknown: 0 });
  });

  it("always says how many matching tests were left out, by study design, and their share", () => {
    const { summary } = searchRelations(data, [], q({ a: "a", b: "b" }));
    expect(summary.notCounted).toBe(2);
    expect(summary.notCountedByDesign).toEqual({ online_experiment: 2 });
    expect(summary.shareNotCounted).toBeCloseTo(0.4, 10);
  });

  it("counts the ⚠ tests too when asked, and then leaves nothing out", () => {
    const { summary } = searchRelations(data, [], q({ a: "a", b: "b", includeWarn: true }));
    expect(summary).toMatchObject({ papers: 3, studies: 5, tests: 5, notCounted: 0, shareNotCounted: 0 });
  });

  it("lists every matching test in the groups, counted or not, newest paper first, and flags papers whose studies disagree", () => {
    const withMeta = [
      row("A", "B", { paper_id: "old", study_id: "o1", papers: { title: "Old", authors: [], year: 2010, journal: null, citekey: null, apa_citation: null } }),
      row("A", "B", { paper_id: "new", study_id: "n1", status: "supported" }),
      row("A", "B", { paper_id: "new", study_id: "n2", status: "not_supported", studies: { study_label: "Study 2", research_design: "survey" } }),
    ];
    const { groups, rows } = searchRelations(withMeta, [], q({ a: "a" }));
    expect(rows).toHaveLength(3);
    expect(groups.map((g) => g.paperId)).toEqual(["new", "old"]);
    expect(groups[0]).toMatchObject({ differs: true });
    expect(groups[1]).toMatchObject({ differs: false });
    expect(groups[0]!.rows.map((r) => r.studies?.study_label)).toEqual(["Study 1", "Study 2"]);
  });

  it("returns a summary of zeros when nothing matches", () => {
    const { summary, groups } = searchRelations(data, [], q({ a: "no such variable" }));
    expect(groups).toEqual([]);
    expect(summary).toMatchObject({ papers: 0, studies: 0, tests: 0, notCounted: 0, shareNotCounted: 0 });
  });
});

describe("display", () => {
  it("labels a paper by its authors and year", () => {
    expect(paperLabel({ title: "T", authors: [{ family: "Singh" }], year: 2012, journal: null, citekey: null, apa_citation: null })).toBe("Singh (2012)");
    expect(paperLabel({ title: "T", authors: [{ family: "Singh" }, { family: "Iglesias" }], year: 2012, journal: null, citekey: null, apa_citation: null })).toBe("Singh & Iglesias (2012)");
    expect(paperLabel({ title: "T", authors: [{ family: "A" }, { family: "B" }, { family: "C" }], year: null, journal: null, citekey: null, apa_citation: null })).toBe("A et al.");
    expect(paperLabel({ title: "Only a title", authors: [], year: null, journal: null, citekey: null, apa_citation: null })).toBe("Only a title");
    expect(paperLabel(null)).toBe("(bài không rõ)");
  });

  it("writes numbers the APA 7 way: no zero before a decimal that cannot exceed 1, a real minus", () => {
    expect(apaNumber(0.31)).toBe(".31");
    expect(apaNumber(-0.31)).toBe("−.31");
    expect(apaNumber(1.23)).toBe("1.23");
    expect(apaNumber(0)).toBe("0");
    expect(formatEstimate({ estimate: -0.31, estimate_type: "std_beta" })).toBe("β = −.31");
    expect(formatEstimate({ estimate: 0.5, estimate_type: "unstd_b" })).toBe("b = .5");
    expect(formatEstimate({ estimate: 2.1, estimate_type: "odds_ratio" })).toBe("OR = 2.1");
    expect(formatEstimate({ estimate: 0.2, estimate_type: null })).toBe("est. = .2");
    expect(formatEstimate({ estimate: null, estimate_type: "std_beta" })).toBe("");
  });

  it("shows p as the authors printed it, without the leading zero", () => {
    expect(formatP({ p_reported_as: "< 0.01", p_value: null })).toBe("p < .01");
    expect(formatP({ p_reported_as: "= 0.03", p_value: 0.03 })).toBe("p = .03");
    expect(formatP({ p_reported_as: "0. 221", p_value: null })).toBe("p = .221"); // a loose text layer put a space after the point
    expect(formatP({ p_reported_as: ".05", p_value: null })).toBe("p = .05");
    expect(formatP({ p_reported_as: "n.s.", p_value: null })).toBe("n.s.");
    expect(formatP({ p_reported_as: null, p_value: 0.045 })).toBe("p = .045");
    expect(formatP({ p_reported_as: null, p_value: null })).toBe("");
  });

  it("suggests canonical concepts first, then the authors' names by how often they occur, without duplicates", () => {
    const concepts: Concept[] = [{ id: "trust", canonical_name: "Brand Trust", aliases: [] }];
    const data = [row("brand  trust", "Loyalty"), row("Loyalty", "Satisfaction"), row("Satisfaction", "Loyalty")];
    expect(suggestions(data, concepts)).toEqual(["Brand Trust", "Loyalty", "Satisfaction"]);
    expect(normalise("  Brand—Trust! ")).toBe("brand trust");
  });
});
