import { GEMINI_SCHEMA_LIMITS } from "@research-data/schema";
import { beforeAll, describe, expect, it } from "vitest";
import { answerKeyGenerator, passOf } from "../synthetic/answer-generator.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { extractFull, FullExtractionError } from "./extract-full.js";
import { FULL_INSTRUCTIONS, FULL_PROMPT_VERSION } from "./full-prompt.js";

const MODEL = "gemini-4-argon";
const pdfs = new Map<string, Uint8Array>();

beforeAll(async () => {
  for (const p of SYNTHETIC_PAPERS) pdfs.set(p.id, await renderPdf(p.render));
});

describe.each(SYNTHETIC_PAPERS.map((p) => [p.id, p] as const))("extractFull on %s", (id, paper) => {
  it("returns exactly the answer key", async () => {
    const { generate } = answerKeyGenerator(paper);
    const result = await extractFull(pdfs.get(id)!, { model: MODEL, generate });
    expect(result.structure).toEqual(paper.answer.structure);
    expect(result.discussion).toEqual(paper.answer.discussion);
    expect(result.studies).toEqual(paper.answer.studies);
    expect(result.promptVersion).toBe(FULL_PROMPT_VERSION);
  });

  it("makes 2 paper calls plus 4 calls per study, in order, each with the PDF and the codebook rules", async () => {
    const { generate, requests } = answerKeyGenerator(paper);
    const result = await extractFull(pdfs.get(id)!, { model: MODEL, generate });
    const labels = paper.answer.studies.map((s) => s.study_label);
    const expected = [
      "paper_structure",
      "paper_discussion",
      ...labels.flatMap(() => ["study_design_sample_bias", "study_measurements", "study_paths", "study_tables"]),
    ];
    expect(requests.map(passOf)).toEqual(expected);
    expect(result.calls.map((c) => c.pass)).toEqual(expected);
    expect(result.calls.map((c) => c.studyLabel)).toEqual([null, null, ...labels.flatMap((l) => [l, l, l, l])]);
    for (const r of requests) {
      expect(r.model).toBe(MODEL);
      expect(r.pdf).toBe(pdfs.get(id));
      expect(r.instructions).toBe(FULL_INSTRUCTIONS);
      expect(JSON.stringify(r.jsonSchema).length).toBeLessThanOrEqual(GEMINI_SCHEMA_LIMITS.maxBytes);
    }
    // Each study call names its study and tells the model to ignore the others.
    for (const [i, label] of labels.entries()) {
      const prompt = requests[2 + i * 4]!.prompt;
      expect(prompt).toContain(`"${label}"`);
      for (const other of labels.filter((l) => l !== label)) expect(prompt).toContain(`Ignore "${other}"`);
    }
  });

  it("adds up tokens and cost over the calls", async () => {
    const { generate } = answerKeyGenerator(paper);
    const result = await extractFull(pdfs.get(id)!, { model: MODEL, generate });
    expect(result.usage.inputTokens).toBe(3000 * result.calls.length);
    expect(result.costUsd).toBeCloseTo(result.calls.reduce((n, c) => n + c.costUsd!, 0), 10);
    expect(result.costUsd).toBeGreaterThan(0);
  });
});

describe("extractFull failures", () => {
  const paper = SYNTHETIC_PAPERS[2]!; // two studies

  it("reports which call broke and keeps the calls already paid for", async () => {
    const { generate } = answerKeyGenerator(paper, {
      tamper: (pass) => (pass === "study_paths" ? '{"paths": [{"estimate": "high"}]}' : null),
    });
    const error = await extractFull(pdfs.get(paper.id)!, { model: MODEL, generate }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(FullExtractionError);
    const e = error as FullExtractionError;
    expect(e.pass).toBe("study_paths");
    expect(e.studyLabel).toBe("Study 1");
    expect(e.message).toMatch(/does not match the schema/);
    expect(e.calls.map((c) => c.pass)).toEqual([
      "paper_structure",
      "paper_discussion",
      "study_design_sample_bias",
      "study_measurements",
      "study_paths",
    ]);
    expect(e.rawText).toContain("high");
  });

  it("rejects text that is not JSON", async () => {
    const { generate } = answerKeyGenerator(paper, { tamper: (pass) => (pass === "paper_discussion" ? "Sorry, I cannot" : null) });
    await expect(extractFull(pdfs.get(paper.id)!, { model: MODEL, generate })).rejects.toThrow(/paper_discussion: Gemini did not return valid JSON/);
  });

  it("rejects duplicate study labels from Pass 1", async () => {
    const { generate } = answerKeyGenerator(paper, {
      tamper: (pass, answer) =>
        pass === "paper_structure"
          ? JSON.stringify({ ...(answer as object), studies: [paper.answer.structure.studies[0], paper.answer.structure.studies[0]] })
          : null,
    });
    await expect(extractFull(pdfs.get(paper.id)!, { model: MODEL, generate })).rejects.toThrow(/duplicate study labels Study 1/);
  });

  it("makes only the two paper calls for a paper without studies", async () => {
    const { generate, requests } = answerKeyGenerator(paper, {
      tamper: (pass, answer) =>
        pass === "paper_structure" ? JSON.stringify({ ...(answer as object), paper_type: "conceptual", studies: [] }) : null,
    });
    const result = await extractFull(pdfs.get(paper.id)!, { model: MODEL, generate });
    expect(requests.map(passOf)).toEqual(["paper_structure", "paper_discussion"]);
    expect(result.studies).toEqual([]);
  });
});
