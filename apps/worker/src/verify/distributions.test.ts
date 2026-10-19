import { describe, expect, it } from "vitest";
import { fUpperTailP, tTwoTailedP, zTwoTailedP } from "./distributions.js";

// Reference values from standard tables / R: 2 * pt(-2, 10), pf(4.10, 1, 416, lower = FALSE), 2 * pnorm(-1.96)…
describe("p-values from test statistics", () => {
  it("t (two-tailed)", () => {
    expect(tTwoTailedP(2, 10)).toBeCloseTo(0.07339, 4);
    expect(tTwoTailedP(2.228, 10)).toBeCloseTo(0.05, 3);
    expect(tTwoTailedP(0, 20)).toBeCloseTo(1, 10);
    expect(tTwoTailedP(-1.21, 411)).toBeCloseTo(0.2269, 3);
    expect(tTwoTailedP(8.4, 411)).toBeLessThan(1e-14);
  });

  it("F (upper tail)", () => {
    // F(1, df) = t(df)², so both functions must agree (two independent code paths of the same beta function).
    expect(fUpperTailP(4.1, 1, 416)).toBeCloseTo(tTwoTailedP(Math.sqrt(4.1), 416), 10);
    expect(fUpperTailP(4.1, 1, 416)).toBeGreaterThan(0.0434);
    expect(fUpperTailP(4.1, 1, 416)).toBeLessThan(0.0436);
    expect(fUpperTailP(18.2, 1, 416)).toBeGreaterThan(2.4e-5);
    expect(fUpperTailP(18.2, 1, 416)).toBeLessThan(2.5e-5);
    // With df1 = 2 the tail has a closed form: p = (1 + 2F / df2) ** (-df2 / 2).
    expect(fUpperTailP(3.0, 2, 30)).toBeCloseTo((1 + (2 * 3.0) / 30) ** -15, 10);
  });

  it("z (two-tailed)", () => {
    expect(zTwoTailedP(1.96)).toBeCloseTo(0.05, 3);
    expect(zTwoTailedP(-2.576)).toBeCloseTo(0.01, 3);
    expect(zTwoTailedP(0)).toBeCloseTo(1, 6);
  });
});
