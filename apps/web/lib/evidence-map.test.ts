import { describe, expect, it } from "vitest";
import { buildEvidenceMap, cellKey, supportShare } from "./evidence-map";
import type { Concept } from "./relations";

const concepts: Concept[] = [
  { id: "trust", canonical_name: "Brand Trust", aliases: [] },
  { id: "loyalty", canonical_name: "Loyalty", aliases: [] },
  { id: "quality", canonical_name: "Perceived Quality", aliases: [] },
];
const path = (paper: string, iv: string | null, dv: string | null, o: Record<string, string> = {}) => ({
  paper_id: paper, iv_construct_id: iv, dv_construct_id: dv, effect_type: "direct" as const, status: "supported" as const, badge: "auto_verified", ...o,
});

describe("buildEvidenceMap", () => {
  const map = buildEvidenceMap(
    [
      path("p1", "trust", "loyalty"),
      path("p2", "trust", "loyalty", { status: "not_supported" }),
      path("p2", "trust", "loyalty", { badge: "needs_attention" }),
      path("p3", "trust", "loyalty", { status: "not_hypothesized" }),
      path("p1", "quality", "trust"),
      path("p1", "trust", null),
      path("p1", "trust", "loyalty", { effect_type: "control" }),
    ] as never,
    concepts,
  );

  it("puts each pair with a direct test in one cell, with its papers and how the checked tests came out", () => {
    expect(map.cells.get(cellKey("trust", "loyalty"))).toMatchObject({ tests: 4, papers: 3, supported: 1, notSupported: 1, noHypothesis: 1, unchecked: 1 });
    expect(map.cells.get(cellKey("quality", "trust"))).toMatchObject({ tests: 1, papers: 1, supported: 1 });
    expect(map.filled).toBe(2);
  });

  it("leaves off tests with an end that has no canonical concept, and non-direct effects", () => {
    expect(map.placed).toBe(5);
    expect(map.notPlaced).toBe(1);
  });

  it("orders rows (independent variables) and columns (dependent variables) by number of tests", () => {
    expect(map.rows.map((c) => c.id)).toEqual(["trust", "quality"]);
    expect(map.cols.map((c) => c.id)).toEqual(["loyalty", "trust"]);
  });
});

describe("supportShare", () => {
  const cell = { iv: "a", dv: "b", tests: 0, papers: 0, supported: 0, notSupported: 0, mixed: 0, noHypothesis: 0, unchecked: 0 };
  it("is the share of supported among decided hypothesis tests, mixed counting half; null when none was decided", () => {
    expect(supportShare(cell)).toBeNull();
    expect(supportShare({ ...cell, supported: 3, notSupported: 1 })).toBe(0.75);
    expect(supportShare({ ...cell, supported: 1, mixed: 2 })).toBeCloseTo(2 / 3, 10);
    expect(supportShare({ ...cell, noHypothesis: 5, unchecked: 2 })).toBeNull();
  });
});
