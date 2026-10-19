import { describe, expect, it } from "vitest";
import { checkReportedP, checkSeFromCi, checkTFromEstimate } from "./statcheck.js";

const F = (value: number, df: [number, number]) => ({ type: "F" as const, value, df });
const t = (value: number, df: number) => ({ type: "t" as const, value, df: [df] });

describe("checkReportedP", () => {
  it("accepts exact and bounded p-values that match", () => {
    expect(checkReportedP(F(18.2, [1, 416]), "< .001").status).toBe("consistent");
    expect(checkReportedP(F(4.1, [1, 416]), "= .043").status).toBe("consistent"); // 0.0435, F rounded to 2 decimals
    expect(checkReportedP(t(2.0, 10), "= .07").status).toBe("consistent");
    expect(checkReportedP(t(1.21, 411), "n.s.").status).toBe("consistent");
    expect(checkReportedP({ type: "z", value: 2.58, df: [] }, "< .01").status).toBe("consistent");
    expect(checkReportedP(t(8.4, 411), "* p < 0.05").status).toBe("consistent");
  });

  it("flags a wrong p, and a conclusion that flips at .05 as a decision error", () => {
    const wrong = checkReportedP(t(2.0, 10), "= .09"); // really .073: wrong number, same conclusion
    expect(wrong.status).toBe("inconsistent");
    expect(checkReportedP(t(2.0, 10), "= .03").status).toBe("decision_error");
    expect(wrong.recomputed).toBeCloseTo(0.0734, 3);
    expect(checkReportedP(t(2.0, 10), "< .05").status).toBe("decision_error"); // really .073
    expect(checkReportedP(t(2.5, 30), "n.s.").status).toBe("decision_error"); // really .018
    expect(checkReportedP(F(4.1, [1, 416]), "< .001").status).toBe("inconsistent"); // really .043: both significant
  });

  it("does not check what it cannot recompute", () => {
    expect(checkReportedP(t(2.0, 0), "= .05").status).toBe("not_checked");
    expect(checkReportedP(F(3, [2, 30]), "***").status).toBe("not_checked");
  });
});

describe("derived checks", () => {
  it("t from estimate and SE", () => {
    expect(checkTFromEstimate(0.42, 0.05, 8.4).ok).toBe(true);
    expect(checkTFromEstimate(0.42, 0.05, 6.0).ok).toBe(false);
  });

  it("SE from a normal CI", () => {
    expect(checkSeFromCi(0.32, 0.52, 0.051).ok).toBe(true);
    expect(checkSeFromCi(0.32, 0.52, 0.12).ok).toBe(false);
  });
});
