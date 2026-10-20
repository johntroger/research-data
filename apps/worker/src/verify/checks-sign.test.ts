import { describe, expect, it } from "vitest";
import { signChecks } from "./checks.js";
import { signCounts } from "./number.js";

describe("sign of a number against its quote (Mục 6.10)", () => {
  it("counts a minus written as hyphen, minus sign or apart, and a plus without a sign", () => {
    expect(signCounts("β = −0.31, p < .001", -0.31)).toEqual({ pos: 0, neg: 1 });
    expect(signCounts("b = -.31", -0.31)).toEqual({ pos: 0, neg: 1 });
    expect(signCounts("b = - 0.31", -0.31)).toEqual({ pos: 0, neg: 1 });
    expect(signCounts("β = 0.31", 0.31)).toEqual({ pos: 1, neg: 0 });
    expect(signCounts("-0.380 and 0.38", 0.38)).toEqual({ pos: 1, neg: 1 });
  });

  it("does not take a range dash for a minus", () => {
    expect(signCounts("95% CI [0.29–0.41]", 0.41)).toEqual({ pos: 1, neg: 0 });
    expect(signCounts("between 0.29-0.41 and 0.5", 0.41)).toEqual({ pos: 1, neg: 0 });
    expect(signCounts("CI [−0.79 to −0.14]", -0.14)).toEqual({ pos: 0, neg: 1 });
  });

  it("restores a minus sign set in a symbol font before reading it", () => {
    expect(signCounts("Omission in discount 2 0.47 (0.11) [ 2 0.79 to 2 0.14]", -0.47)).toEqual({ pos: 0, neg: 1 });
  });

  it("says ⚠ only for a clear contradiction", () => {
    expect(signChecks("effect of 0.38 on ABE (− 0.380)", 0.38)).toEqual([]); // both ways: no verdict
    expect(signChecks("H2 Brand opportunism → ABE − 0.380", 0.38)).toMatchObject([{ name: "sign_in_quote", passed: false, severity: "attention" }]);
    expect(signChecks("H2 Brand opportunism → ABE 0.380", -0.38)).toMatchObject([{ name: "sign_in_quote", passed: false, severity: "attention" }]);
    expect(signChecks("6. Expectations .25 .38 .20 .10 -.27 1.00", 0.27)).toMatchObject([{ passed: false }]);
  });

  it("passes a negative value shown with its minus, and stays silent when nothing is decided", () => {
    expect(signChecks("β = −0.31", -0.31)).toMatchObject([{ name: "sign_in_quote", passed: true }]);
    expect(signChecks("β = 0.31", 0.31)).toEqual([]);
    expect(signChecks("the sample comprised 412 respondents", 0.31)).toEqual([]);
    expect(signChecks("anything", 0)).toEqual([]);
    expect(signChecks("anything -.5", "text")).toEqual([]);
  });
});
