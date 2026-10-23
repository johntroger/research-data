import { describe, expect, it } from "vitest";
import { problemRate, toReport, type RawReport } from "./quality";

const raw: RawReport = {
  total: { verified: 6, attention: 2, interpreted: 3, hidden: 2, fields: 13, papers: 2 },
  bySource: [{ name: "m", verified: 6, attention: 2, interpreted: 3, hidden: 2, papers: 2 }],
  byDesign: [],
  byField: [{ name: "n", verified: 0, attention: 0, interpreted: 1, hidden: 0, papers: 1 }],
  byCheck: [{ name: "n / number_in_pdf", fields: 2, papers: 1 }],
  attention: [{ id: "p1", title: "A paper", verified: 1, attention: 1, interpreted: 0, hidden: 1 }],
};

describe("problemRate", () => {
  it("is (⚠ + hidden) / (✓ + ⚠ + hidden); ◇ cannot be checked, so it does not count", () => {
    expect(problemRate({ verified: 6, attention: 2, interpreted: 3, hidden: 2 })).toBeCloseTo(0.4);
    expect(problemRate({ verified: 0, attention: 0, interpreted: 5, hidden: 0 })).toBe(0);
  });
});

describe("toReport", () => {
  it("adds the problem rate to every row of the database's answer", () => {
    const r = toReport(raw);
    expect(r).toMatchObject({ fields: 13, papers: 2 });
    expect(r.total.problemRate).toBeCloseTo(0.4);
    expect(r.bySource[0]!.problemRate).toBeCloseTo(0.4);
    expect(r.byField[0]!.problemRate).toBe(0);
    expect(r.attention[0]).toMatchObject({ id: "p1", title: "A paper" });
    expect(r.attention[0]!.problemRate).toBeCloseTo(2 / 3);
    expect(r.byCheck).toEqual(raw.byCheck);
  });
});
