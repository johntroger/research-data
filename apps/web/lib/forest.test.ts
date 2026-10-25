import { describe, expect, it } from "vitest";
import { buildForest, forestRange, FOREST_MIN_STUDIES } from "./forest";
import type { PathRow } from "./relations";

let n = 0;
const row = (o: Partial<PathRow> = {}): PathRow => {
  n++;
  return {
    id: `r${n}`, paper_id: `p${n}`, study_id: `s${n}`, natural_key: "k", hypothesis_code: null, iv_label_original: "A", dv_label_original: "B", iv_construct_id: null, dv_construct_id: null,
    mediator_labels: [], moderator_labels: [], effect_type: "direct", estimate_type: "std_beta", estimate: 0.3, p_value: null, p_reported_as: null, status: "supported", observed_sign: "positive",
    significant: true, badge: "auto_verified", studies: { study_label: "Study 1", research_design: "survey" },
    papers: { title: "T", authors: [{ family: `Au${n}` }], year: 2020, journal: null, citekey: null, apa_citation: null }, evidence: null, ci_low: 0.1, ci_high: 0.5, ...o,
  };
};

describe("buildForest", () => {
  it("draws nothing below the minimum number of studies", () => {
    const few = Array.from({ length: FOREST_MIN_STUDIES - 1 }, () => row());
    expect(buildForest(few)).toBeNull();
  });

  it("draws the most common kind of estimate once there are enough studies, sorted by estimate", () => {
    const rows = [row({ estimate: 0.5 }), row({ estimate: 0.1 }), row({ estimate: 0.3 }), row({ estimate: 0.2 }), row({ estimate_type: "r", estimate: 0.4 })];
    const forest = buildForest(rows)!;
    expect(forest.kind).toBe("std_beta");
    expect(forest.points.map((p) => p.estimate)).toEqual([0.1, 0.2, 0.3, 0.5]);
  });

  it("needs an interval: a printed CI, or a standard error (estimate ± 1.96 SE, marked as computed); a point alone is not enough", () => {
    const rows = [row({ ci_low: null, ci_high: null, se: 0.1, estimate: 0.3 }), row({ ci_low: null, ci_high: null }), row(), row(), row()];
    const forest = buildForest(rows)!;
    expect(forest.points).toHaveLength(4);
    const fromSe = forest.points.find((p) => p.fromSe)!;
    expect(fromSe.low).toBeCloseTo(0.104, 3);
    expect(fromSe.high).toBeCloseTo(0.496, 3);
  });

  it("counts one test per study", () => {
    const same = { study_id: "s-same" };
    expect(buildForest([row(same), row(same), row(same), row(same), row(same)])).toBeNull();
  });
});

describe("forestRange", () => {
  it("is symmetric around zero and never narrower than ±0.5", () => {
    expect(forestRange([{ id: "a", label: "a", estimate: 0.2, low: 0.1, high: 0.3, fromSe: false }])).toEqual({ min: -0.6, max: 0.6 });
    const wide = forestRange([{ id: "a", label: "a", estimate: 1, low: -1.2, high: 2.4, fromSe: false }]);
    expect(wide.min).toBe(-wide.max);
    expect(wide.max).toBeGreaterThanOrEqual(2.4);
  });
});
