import { describe, expect, it } from "vitest";
import { checkReportedP, checkSeFromCi, checkTFromEstimate, mentionedCiLevels, mentionsOneTailed } from "./statcheck.js";

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

  it("SE from a 90% or 99% CI only when the paper names that level", () => {
    expect(checkSeFromCi(0.336, 0.504, 0.051).ok).toBe(false); // a 90% interval read as 95%
    expect(checkSeFromCi(0.336, 0.504, 0.051, [90]).ok).toBe(true); // 0.168 / 3.29
    expect(checkSeFromCi(0.29, 0.55, 0.05, [99]).detail).toContain("99%"); // 0.26 / 5.15
    expect(mentionedCiLevels("bias-corrected 90% CI; 99 % confidence intervals; 95% CI")).toEqual([90, 99]);
    expect(mentionedCiLevels("90% of respondents")).toEqual([]);
    expect(mentionedCiLevels("RMSEA (90% CI) = .05; Abbreviations: 90% CI, 90% confidence intervals for RMSEA")).toEqual([]);
  });
});

describe("one-tailed tests and an unknown number of predictors", () => {
  it("accepts a one-tailed p only when the paper says it tests one-tailed", () => {
    // t(200) = 1.80: two-tailed p = .073, one-tailed .037.
    expect(checkReportedP(t(1.8, 200), "= .037").status).toBe("decision_error");
    const one = checkReportedP(t(1.8, 200), "= .037", { oneTailed: true });
    expect(one.status).toBe("consistent");
    expect(one.detail).toContain("một phía");
    expect(checkReportedP(t(1.8, 200), "< .05", { oneTailed: true }).status).toBe("consistent");
    expect(checkReportedP(t(1.8, 200), "= .20", { oneTailed: true }).status).toBe("inconsistent"); // fits neither
    expect(checkReportedP(F(3.24, [1, 200]), "= .037", { oneTailed: true }).status).not.toBe("consistent"); // F is never halved
  });

  it("finds the words of a one-tailed test in the paper", () => {
    expect(mentionsOneTailed("All hypotheses were tested with one-tailed tests.")).toBe(true);
    expect(mentionsOneTailed("p-values are one sided")).toBe(true);
    expect(mentionsOneTailed("we used directional tests")).toBe(true);
    expect(mentionsOneTailed("someone tailed the car; two-tailed tests")).toBe(false);
  });

  it("checks t over the df range of a regression with up to k predictors", () => {
    // n = 30: t = 2.04 gives p = .0505 with df 29 and .0532 with df 19.
    expect(checkReportedP(t(2.04, 29), "= .053").status).toBe("inconsistent");
    expect(checkReportedP({ ...t(2.04, 29), dfMin: 19 }, "= .053").status).toBe("consistent");
  });
});
