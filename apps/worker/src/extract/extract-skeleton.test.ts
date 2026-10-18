import { describe, expect, it } from "vitest";
import { ExtractionError, extractSkeleton } from "./extract-skeleton.js";
import type { GeneratePdfJson, PdfJsonRequest } from "./gemini.js";
import { callCostUsd } from "./pricing.js";
import { skeletonJsonSchema } from "./skeleton-schema.js";

const PDF = new Uint8Array([37, 80, 68, 70]); // "%PDF", content is irrelevant for mocked calls

const VALID = {
  paper_type: "empirical_quant",
  paper_type_evidence: { pdf_page: 1, quote: "We conducted an online survey of 412 consumers." },
  studies: [
    {
      study_label: "Study 1",
      research_design: "survey",
      design_evidence: { pdf_page: 4, quote: "Data were collected through an online survey." },
      sample_size: 412,
      sample_size_evidence: { pdf_page: 4, quote: "The final sample comprised 412 respondents." },
    },
  ],
  example_hypothesis: {
    study_label: "Study 1",
    hypothesis_code: "H2",
    iv: "Perceived risk",
    dv: "Purchase intention",
    estimate: -0.31,
    estimate_type: "std_beta",
    p_reported: "< .001",
    status: "supported",
    evidence: { pdf_page: 7, quote: "Perceived risk negatively affected purchase intention (β = −.31, p < .001)." },
  },
};

function mockGenerator(text: string, usage = { inputTokens: 10_000, outputTokens: 2_000 }) {
  const calls: PdfJsonRequest[] = [];
  const generate: GeneratePdfJson = async (request) => {
    calls.push(request);
    return { text, usage };
  };
  return { generate, calls };
}

describe("extractSkeleton", () => {
  it("parses a valid response and computes the cost", async () => {
    const { generate, calls } = mockGenerator(JSON.stringify(VALID));
    const result = await extractSkeleton(PDF, { model: "gemini-3.1-pro-preview", generate });

    expect(result.data.example_hypothesis?.estimate).toBe(-0.31);
    expect(result.data.studies[0]?.sample_size).toBe(412);
    // 10k input × $2/1M + 2k output × $12/1M
    expect(result.costUsd).toBeCloseTo(0.044, 6);
    expect(result.promptVersion).toMatch(/^skeleton-/);
    expect(calls[0]!.model).toBe("gemini-3.1-pro-preview");
    expect(calls[0]!.pdf).toBe(PDF);
  });

  it("accepts reviews with no studies and no hypothesis", async () => {
    const review = {
      paper_type: "systematic_review",
      paper_type_evidence: { pdf_page: 1, quote: "In this review, we first identify" },
      studies: [],
      example_hypothesis: null,
    };
    const { generate } = mockGenerator(JSON.stringify(review));
    const result = await extractSkeleton(PDF, { model: "gemini-2.5-pro", generate });
    expect(result.data.studies).toEqual([]);
    expect(result.data.example_hypothesis).toBeNull();
  });

  it("rejects output that is not JSON and keeps the raw text", async () => {
    const { generate } = mockGenerator("Sorry, I cannot help with that.");
    const promise = extractSkeleton(PDF, { model: "gemini-2.5-pro", generate });
    await expect(promise).rejects.toBeInstanceOf(ExtractionError);
    await expect(promise).rejects.toMatchObject({ rawText: "Sorry, I cannot help with that." });
  });

  it("rejects output that breaks the schema (e.g. page 0, unknown design)", async () => {
    const broken = structuredClone(VALID) as Record<string, unknown>;
    (broken.paper_type_evidence as { pdf_page: number }).pdf_page = 0;
    (broken.studies as { research_design: string }[])[0]!.research_design = "vibes";
    const { generate } = mockGenerator(JSON.stringify(broken));
    await expect(extractSkeleton(PDF, { model: "gemini-2.5-pro", generate })).rejects.toThrow(
      /paper_type_evidence\.pdf_page.*studies\.0\.research_design/,
    );
  });

  it("returns a null cost for models missing from the price table", async () => {
    const { generate } = mockGenerator(JSON.stringify(VALID));
    const result = await extractSkeleton(PDF, { model: "some-future-model", generate });
    expect(result.costUsd).toBeNull();
  });
});

describe("skeletonJsonSchema", () => {
  it("is a plain JSON Schema object with the expected required fields", () => {
    const schema = skeletonJsonSchema();
    expect(schema.$schema).toBeUndefined();
    expect(schema.type).toBe("object");
    expect(schema.required).toEqual(
      expect.arrayContaining(["paper_type", "paper_type_evidence", "studies", "example_hypothesis"]),
    );
    expect(JSON.stringify(schema)).toContain("NOT the printed journal page");
  });
});

describe("callCostUsd", () => {
  it("uses the higher Pro price above 200k input tokens", () => {
    expect(callCostUsd("gemini-3.1-pro-preview", { inputTokens: 100_000, outputTokens: 0 })).toBeCloseTo(0.2, 6);
    expect(callCostUsd("gemini-3.1-pro-preview", { inputTokens: 250_000, outputTokens: 0 })).toBeCloseTo(1.0, 6);
  });

  it("prices Flash models without tiers, using the price in force on the given day", () => {
    const million = { inputTokens: 1_000_000, outputTokens: 1_000_000 };
    expect(callCostUsd("gemini-3.8-flash", million, new Date("2026-10-18"))).toBeCloseTo(4.5, 6);
    expect(callCostUsd("gemini-3.8-flash", million, new Date("2027-01-01"))).toBeCloseTo(9.0, 6);
  });

  it("applies the Gemini 4 Argon price change on 2026-12-01", () => {
    const usage = { inputTokens: 10_000, outputTokens: 2_000 };
    expect(callCostUsd("gemini-4-argon", usage, new Date("2026-11-30"))).toBeCloseTo(0.04, 6);
    expect(callCostUsd("gemini-4-argon", usage, new Date("2026-12-01"))).toBeCloseTo(0.08, 6);
  });
});
