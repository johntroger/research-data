import { describe, expect, it } from "vitest";
import { estimateCall, estimatePaper, OUTPUT_TOKENS, TOKENS_PER_PAGE } from "./estimate.js";
import { callCostUsd } from "./pricing.js";

const MODEL = "gemini-4-argon";
const BEFORE_RISE = new Date("2026-10-19");

describe("estimates", () => {
  it("covers the real calls measured in step 1.3 (never lower, within 2.25 times)", () => {
    // [pages, pass, input tokens, output tokens] of real calls: Chen 2012 (19 pages), Yildirim and Dursun (24 pages).
    const real: [number, string, number, number][] = [
      [19, "paper_structure", 28_756, 638],
      [19, "study_measurements", 28_266, 1_906],
      [19, "study_paths", 28_730, 2_732],
      [24, "paper_structure", 37_366, 646],
      [24, "study_paths", 37_340, 5_302],
      [24, "study_tables", 37_440, 757],
    ];
    for (const [pages, pass, input, output] of real) {
      const est = estimateCall(MODEL, pass as never, pages * TOKENS_PER_PAGE, { at: BEFORE_RISE });
      const actual = callCostUsd(MODEL, { inputTokens: input, outputTokens: output }, BEFORE_RISE)!;
      expect(est.costUsd!, `${pass} ${pages}p`).toBeGreaterThanOrEqual(actual);
      expect(est.costUsd!, `${pass} ${pages}p`).toBeLessThan(actual * 2.25);
    }
  });

  it("prices a paper as Pass 1, Pass 1b and four calls per study", () => {
    const one = estimatePaper(MODEL, 20, 1, { at: BEFORE_RISE });
    expect(one.calls).toHaveLength(6);
    expect(one.calls.map((c) => c.pass).slice(0, 2)).toEqual(["paper_structure", "paper_discussion"]);
    expect(estimatePaper(MODEL, 20, 3, { at: BEFORE_RISE }).calls).toHaveLength(14);
    expect(one.costUsd!).toBeGreaterThan(0.3);
    expect(one.costUsd!).toBeLessThan(0.7);
    expect(one.outputTokens).toBe(Object.values(OUTPUT_TOKENS).reduce((a, b) => a + b, 0));
  });

  it("Batch costs half, and a longer paper costs more", () => {
    const standard = estimatePaper(MODEL, 20, 1, { at: BEFORE_RISE });
    const batch = estimatePaper(MODEL, 20, 1, { at: BEFORE_RISE, batch: true });
    expect(batch.costUsd!).toBeCloseTo(standard.costUsd! / 2, 10);
    expect(estimatePaper(MODEL, 40, 1, { at: BEFORE_RISE }).costUsd!).toBeGreaterThan(standard.costUsd!);
  });

  it("uses an exact token count when given, and follows the price rise of 2026-12-01", () => {
    const exact = estimatePaper(MODEL, 20, 1, { at: BEFORE_RISE, pdfTokens: 10_000 });
    expect(exact.calls[0]!.inputTokens).toBe(11_000);
    const after = estimatePaper(MODEL, 20, 1, { at: new Date("2026-12-02") });
    expect(after.costUsd!).toBeCloseTo(estimatePaper(MODEL, 20, 1, { at: BEFORE_RISE }).costUsd! * 2, 10);
  });

  it("has no estimate for a model without a price", () => {
    expect(estimatePaper("gemini-unknown", 20).costUsd).toBeNull();
  });
});
