import { describe, expect, it } from "vitest";
import {
  apaNumber,
  type Concept,
  countsLine,
  DEFAULT_QUERY,
  findRows,
  formatEstimate,
  estimateGroup,
  formatStats,
  sampleSize,
  formatP,
  normalise,
  paperLabel,
  parseQuery,
  type PathRow,
  queryTitle,
  relationKey,
  queryToSearch,
  rolesInTest,
  type RelationQuery,
  searchRelations,
  similarNames,
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
      est: [],
      from: null,
      to: null,
      design: [],
      sample: [],
      country: [],
      sort: "year",
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
    expect(findRows(rows, [], q({}))).toHaveLength(4); // the page does not search without a question (hasQuestion)
  });

  it("with one concept only, lists every relationship of it: either direction, any role, any case", () => {
    const data = [
      row("Brand Trust", "Loyalty"),
      row("Satisfaction", "BRAND TRUST"),
      row("Price", "Loyalty", { effect_type: "indirect", mediator_labels: ["brand trust"] }),
      row("Price", "Loyalty", { effect_type: "interaction", moderator_labels: ["Brand Trust"] }),
      row("Price", "Loyalty", { effect_type: "control" }),
      row("Price", "Quality"),
    ];
    for (const typed of ["brand trust", "BRAND TRUST", "Brand trust"]) {
      expect(findRows(data, [], q({ a: typed }))).toHaveLength(4);
      expect(findRows(data, [], q({ b: typed }))).toHaveLength(4); // the box does not matter
    }
    expect(rolesInTest(data[2]!, [], q({ a: "brand trust" }))).toEqual(["trung gian"]);
    expect(rolesInTest(data[0]!, [], q({ a: "brand trust" }))).toEqual(["biến độc lập"]);
    expect(rolesInTest(data[0]!, [], q({ a: "brand trust", b: "loyalty" }))).toEqual([]); // two concepts: no roles
    expect(findRows(data, [], q({ a: "brand trust", status: ["not_supported"] }))).toHaveLength(0); // other filters still apply
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

  it("reports the full size of the evidence found (counted or not) and of the corpus", () => {
    const { summary } = searchRelations(data, [], q({ a: "a", b: "b" }));
    expect(summary).toMatchObject({ matchedTests: 5, matchedPapers: 3, corpusPapers: 3 });
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

describe("formatStats: everything the paper gave, in APA order", () => {
  it("adds SE, CI and N when known, and nothing invented when not", () => {
    const full = row("A", "B", { estimate: -0.31, se: 0.05, ci_low: -0.42, ci_high: -0.2, studies: { study_label: "Study 1", research_design: "survey", samples: [{ n: 1312 }] } });
    expect(formatStats(full)).toBe("β = −.31, SE = .05, CI [−.42, −.20], p < .001, N = 1,312");
    const bare = row("A", "B", { estimate: 0.3, studies: { study_label: "Study 1", research_design: "survey", samples: [{ n: null }] } });
    expect(formatStats(bare)).toBe("β = .3, p < .001");
    expect(sampleSize(bare)).toBeNull();
    expect(sampleSize({ studies: { study_label: "S", research_design: null, samples: { n: 261 } } })).toBe(261); // a one-to-one embed is an object
    expect(sampleSize({ studies: null })).toBeNull();
  });
});

describe("the words of a result: one main number and the page title", () => {
  it("names the ✓ rule behind the count, and says when ⚠ and ◇ were switched on", () => {
    expect(countsLine({ papers: 1, studies: 2, tests: 2 }, false)).toBe("2 kiểm định đã kiểm chứng ✓ · 1 bài · 2 study");
    expect(countsLine({ papers: 2, studies: 3, tests: 3 }, true)).toBe("3 kiểm định (tính cả ⚠ và ◇) · 2 bài · 3 study");
  });

  it("titles the page with the question: both boxes in the chosen direction, or the one concept", () => {
    expect(queryTitle(q({ a: "ethicality", b: "trust" }))).toBe("ethicality → trust");
    expect(queryTitle(q({ a: "ethicality", b: "trust", dir: "ba" }))).toBe("trust → ethicality");
    expect(queryTitle(q({ a: "ethicality", b: "trust", dir: "both" }))).toBe("ethicality ⇄ trust");
    expect(queryTitle(q({ a: "", b: "trust" }))).toBe("trust");
    expect(queryTitle(q({}))).toBe("");
  });
});

describe("the same relationship reported more than once", () => {
  const key = (suffix: string) => ({ natural_key: `study_3::perceived->trust:direct${suffix}` });
  const data = [
    row("perceived", "trust", key("")),
    row("perceived", "trust", key("#2")),
    row("perceived", "trust", key("#3")),
    row("authentic", "trust", { natural_key: "study_3::authentic->trust:direct" }),
    row("perceived", "trust", { ...key("#2"), study_id: "s2" }),
  ];

  it("counts a relationship once however many models or tables report it, within its paper and study", () => {
    expect(new Set(data.map(relationKey)).size).toBe(3);
    expect(relationKey(data[1]!)).toBe(relationKey(data[0]!));
    expect(relationKey(data[4]!)).not.toBe(relationKey(data[0]!));
  });

  it("puts the distinct relationships beside the tests in the summary", () => {
    const { summary } = searchRelations(data, [], q({ a: "perceived", b: "trust", dir: "both" }));
    expect(summary).toMatchObject({ tests: 4, relations: 2 });
  });
});

describe("names the reader may have meant", () => {
  const names = ["Brand Trust", "ethicality", "Brand Loyalty", "Purchase Intention", "customer satisfaction", "trust"];

  it("forgives a typo, a plural and a part of a name", () => {
    expect(similarNames("ethicalty", names)).toEqual(["ethicality"]);
    expect(similarNames("loyal", names)).toEqual(["Brand Loyalty"]);
    expect(similarNames("satisfactions", names)).toEqual(["customer satisfaction"]);
    expect(similarNames("intention", names)).toEqual(["Purchase Intention"]);
  });

  it("ranks the whole-name match first and the nearest, shortest name before a longer one", () => {
    expect(similarNames("brand", names)).toEqual(["Brand Trust", "Brand Loyalty"]);
  });

  it("suggests nothing for a name that exists (the question is empty, not misspelt), for nothing typed, or for something unrelated", () => {
    expect(similarNames("Brand trust", names)).toEqual([]);
    expect(similarNames("  ", names)).toEqual([]);
    expect(similarNames("zebra quokka", names)).toEqual([]);
  });

  it("respects the limit", () => {
    expect(similarNames("brand", names, 1)).toHaveLength(1);
  });
});

describe("kinds of effect size", () => {
  const data = [
    row("A", "B", { estimate_type: "std_beta" }),
    row("A", "B", { estimate_type: "r" }),
    row("A", "B", { estimate_type: "odds_ratio" }),
    row("A", "B", { estimate_type: "none", estimate: null }),
    row("A", "B", { estimate_type: "path_coefficient" }),
  ];

  it("groups the estimate types the way they can be compared", () => {
    expect(data.map(estimateGroup)).toEqual(["std_beta", "r", "other", "none", "path_coefficient"]);
  });

  it("counts the counted tests by kind, and filters by kind (also with one concept)", () => {
    const { summary } = searchRelations(data, [], q({ a: "a", b: "b" }));
    expect(summary.estimates).toEqual({ std_beta: 1, path_coefficient: 1, r: 1, other: 1, none: 1 });
    expect(findRows(data, [], q({ a: "a", b: "b", est: ["r", "std_beta"] }))).toHaveLength(2);
    expect(findRows(data, [], q({ a: "a", est: ["none"] }))).toHaveLength(1);
  });

  it("keeps the kinds in the URL", () => {
    const query = parseQuery({ a: "a", est: ["r", "bogus", "none"] });
    expect(query.est).toEqual(["r", "none"]);
    expect(queryToSearch(query)).toBe("a=a&est=r&est=none");
  });
});

describe("filters on the paper and the sample", () => {
  const paper = (year: number | null) => ({ title: "P", authors: [], year, journal: null, citekey: null, apa_citation: null });
  const study = (design: string, sample_type: string, country: string[]) => ({ study_label: "S", research_design: design, samples: { n: 100, sample_type, country_iso: country } });
  const data = [
    row("A", "B", { papers: paper(2010), studies: study("survey", "students", ["US"]) }),
    row("A", "B", { papers: paper(2021), studies: study("online_experiment", "mturk", ["US", "VN"]) }),
    row("A", "B", { papers: paper(2024), studies: study("survey", "consumer_panel", ["VN"]) }),
    row("A", "B", { papers: paper(null), studies: study("survey", "students", []) }),
  ];
  const ids = (extra: Partial<RelationQuery>) => findRows(data, [], q({ a: "a", b: "b", ...extra })).map((r) => data.indexOf(r));

  it("filters by year range (a paper without a year never passes a year filter)", () => {
    expect(ids({ from: 2020 })).toEqual([1, 2]);
    expect(ids({ to: 2015 })).toEqual([0]);
    expect(ids({ from: 2011, to: 2022 })).toEqual([1]);
  });

  it("filters by design, sample type and country, and combines them", () => {
    expect(ids({ design: ["survey"] })).toEqual([0, 2, 3]);
    expect(ids({ sample: ["students"] })).toEqual([0, 3]);
    expect(ids({ country: ["VN"] })).toEqual([1, 2]);
    expect(ids({ design: ["survey"], from: 2020, country: ["VN"] })).toEqual([2]);
  });

  it("keeps them in the URL, ignoring nonsense", () => {
    const query = parseQuery({ a: "a", from: "2020", to: "abc", design: ["survey", "DROP TABLE"], country: ["vn", "xxxx"] });
    expect(query).toMatchObject({ from: 2020, to: null, design: ["survey"], country: ["VN"] });
    expect(queryToSearch(query)).toBe("a=a&from=2020&design=survey&country=VN");
  });
});

describe("sorting the papers of a result", () => {
  const paper = (name: string, year: number) => ({ title: name, authors: [{ family: name }], year, journal: null, citekey: null, apa_citation: null });
  const withN = (n: number) => ({ study_label: "S", research_design: "survey", samples: { n } });
  const data = [
    row("A", "B", { paper_id: "p1", papers: paper("Bui", 2015), estimate: 0.2, studies: withN(900) }),
    row("A", "B", { paper_id: "p2", papers: paper("An", 2022), estimate: -0.6, studies: withN(100) }),
    row("A", "B", { paper_id: "p3", papers: paper("Cao", 2018), estimate: 0.4, studies: withN(300) }),
  ];
  const order = (sort: RelationQuery["sort"]) => searchRelations(data, [], q({ a: "a", b: "b", sort })).groups.map((g) => g.paper?.authors[0]?.family);

  it("orders by year (newest first, the default), sample size, effect size or author name", () => {
    expect(order("year")).toEqual(["An", "Cao", "Bui"]);
    expect(order("n")).toEqual(["Bui", "Cao", "An"]);
    expect(order("effect")).toEqual(["An", "Cao", "Bui"]);
    expect(order("name")).toEqual(["An", "Bui", "Cao"]);
  });

  it("falls back to the default for an unknown sort and keeps a chosen one in the URL", () => {
    expect(parseQuery({ a: "a", sort: "bogus" }).sort).toBe("year");
    expect(queryToSearch(parseQuery({ a: "a", sort: "n" }))).toBe("a=a&sort=n");
  });
});
