import { describe, expect, it } from "vitest";
import { summariseConcepts } from "./concepts";
import { DEFAULT_QUERY, matchedConcepts, suggestions, type Concept } from "./relations";

const concepts = [
  { id: "brand_trust", canonical_name: "Brand Trust", aliases: ["Customer Trust"], definition: "d", source: "s (2000)" },
  { id: "loyalty", canonical_name: "Loyalty", aliases: [], definition: "d", source: "s (2000)" },
  { id: "unused", canonical_name: "Unused Concept", aliases: [], definition: "d", source: "s (2000)" },
];
const row = (paper: string, iv: string, ivId: string | null, dv: string, dvId: string | null) => ({
  paper_id: paper, iv_label_original: iv, iv_construct_id: ivId, dv_label_original: dv, dv_construct_id: dvId,
});

describe("summariseConcepts", () => {
  const rows = [
    row("p1", "Brand trust", "brand_trust", "Loyalty", "loyalty"),
    row("p2", "Customer trust", "brand_trust", "Loyalty", "loyalty"),
    row("p2", "customer trust", "brand_trust", "Something", null),
    row("p3", "Price", null, "Quality", null),
  ];

  it("counts tests and papers per concept and lists the names the authors used, most used first (case folded)", () => {
    const list = summariseConcepts(concepts, rows);
    const trust = list.find((c) => c.id === "brand_trust")!;
    expect(trust).toMatchObject({ tests: 3, papers: 2 });
    expect(trust.usedNames).toEqual([{ label: "customer trust", n: 2 }, { label: "brand trust", n: 1 }]);
    expect(list.find((c) => c.id === "unused")).toMatchObject({ tests: 0, papers: 0, usedNames: [] });
  });

  it("orders by number of tests, then name", () => {
    expect(summariseConcepts(concepts, rows).map((c) => c.id)).toEqual(["brand_trust", "loyalty", "unused"]);
  });

  it("counts a test once for a concept that is both of its ends", () => {
    const list = summariseConcepts(concepts, [row("p1", "Trust", "brand_trust", "Customer trust", "brand_trust")]);
    expect(list.find((c) => c.id === "brand_trust")!.tests).toBe(1);
  });
});

describe("matchedConcepts and suggestions", () => {
  const list: Concept[] = concepts;
  it("says which canonical concepts the typed names stand for, only when equivalent names are on", () => {
    const found = matchedConcepts({ ...DEFAULT_QUERY, a: "customer trust" }, list);
    expect(found).toEqual([{ term: "customer trust", concepts: [list[0]] }]);
    expect(matchedConcepts({ ...DEFAULT_QUERY, a: "customer trust", equiv: false }, list)).toEqual([]);
    expect(matchedConcepts({ ...DEFAULT_QUERY, a: "price" }, list)).toEqual([]);
  });

  it("suggests canonical names first and then the other names", () => {
    const names = suggestions([], list);
    expect(names.slice(0, 3)).toEqual(["Brand Trust", "Loyalty", "Unused Concept"]);
    expect(names).toContain("Customer Trust");
  });
});
