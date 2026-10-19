import { describe, expect, it } from "vitest";
import { type BadgeName, formatQuality, type QualityField, summariseQuality } from "./quality.js";

const f = (paperId: string, source: string | null, badge: BadgeName): QualityField => ({ paperId, paperTitle: `Paper ${paperId}`, design: null, fieldName: "estimate", badge, failedChecks: [], source });

describe("quality by source (step 1b.8e)", () => {
  const fields: QualityField[] = [
    f("a", "gemini-4-argon", "auto_verified"),
    f("a", "gemini-4-argon", "hidden"),
    f("b", "manual:codex:gpt-6.1-sol-medium", "auto_verified"),
    f("b", "manual:codex:gpt-6.1-sol-medium", "auto_verified"),
    f("b", "manual:codex:gpt-6.1-sol-medium", "needs_attention"),
    f("c", null, "ai_interpreted"),
  ];
  const s = summariseQuality(fields);

  it("groups by the model of the extraction run, so Gemini and an external extractor can be told apart", () => {
    const by = Object.fromEntries(s.bySource.map((r) => [r.name, r]));
    expect(by["gemini-4-argon"]).toMatchObject({ verified: 1, hidden: 1, papers: 1 });
    expect(by["gemini-4-argon"]!.problemRate).toBeCloseTo(0.5, 10);
    expect(by["manual:codex:gpt-6.1-sol-medium"]).toMatchObject({ verified: 2, attention: 1, papers: 1 });
    expect(by["manual:codex:gpt-6.1-sol-medium"]!.problemRate).toBeCloseTo(1 / 3, 10);
  });

  it("calls a field without a known run (unknown)", () => {
    expect(s.bySource.map((r) => r.name)).toContain("(unknown)");
  });

  it("prints the source table", () => {
    expect(formatQuality(s)).toContain("By source (model of the extraction run)");
    expect(formatQuality(s)).toContain("manual:codex:gpt-6.1-sol-medium");
  });
});
