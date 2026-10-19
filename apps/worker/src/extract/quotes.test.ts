import { MAX_QUOTE_CHARS } from "@research-data/schema";
import { beforeAll, describe, expect, it } from "vitest";
import { answerKeyGenerator } from "../synthetic/answer-generator.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { extractFull } from "./extract-full.js";
import { shortenQuote, shortenQuotes } from "./quotes.js";

const WORD = "participants";
const sentence = (words: number) => Array.from({ length: words }, (_, i) => `${WORD}${i}`).join(" ");

describe("shortenQuote", () => {
  it("leaves a quote within the limit alone", () => {
    expect(shortenQuote("A short quote.")).toBe("A short quote.");
    expect(shortenQuote("x".repeat(MAX_QUOTE_CHARS))).toHaveLength(MAX_QUOTE_CHARS);
  });

  it("cuts at a word boundary and keeps the beginning word for word", () => {
    const long = sentence(70); // about 800 characters
    const cut = shortenQuote(long);
    expect(cut.length).toBeLessThanOrEqual(MAX_QUOTE_CHARS);
    expect(cut.length).toBeGreaterThan(MAX_QUOTE_CHARS - 20);
    expect(long.startsWith(cut)).toBe(true);
    expect(long.charAt(cut.length)).toBe(" "); // not in the middle of a word
    expect(cut.endsWith(" ")).toBe(false);
  });

  it("cuts a single huge word hard rather than returning nothing", () => {
    expect(shortenQuote("x".repeat(900))).toHaveLength(MAX_QUOTE_CHARS);
  });
});

describe("shortenQuotes", () => {
  it("shortens every over-long quote anywhere in the answer and says where", () => {
    const answer = {
      design: { evidence: { pdf_page: 1, quote: "ok" } },
      sample: { n_evidence: { pdf_page: 2, quote: sentence(60) } },
      list: [{ quote: sentence(10) }, { quote: sentence(90) }],
      other: sentence(90), // not a quote: untouched
    };
    const changed = shortenQuotes(answer);
    expect(changed.map((c) => c.path)).toEqual([".sample.n_evidence", ".list[1]"]);
    expect(changed[0]!.originalChars).toBe(sentence(60).length);
    expect(answer.sample.n_evidence.quote.length).toBeLessThanOrEqual(MAX_QUOTE_CHARS);
    expect(answer.list[1]!.quote.length).toBeLessThanOrEqual(MAX_QUOTE_CHARS);
    expect(answer.list[0]!.quote).toBe(sentence(10));
    expect(answer.other).toBe(sentence(90));
  });
});

describe("extractFull with over-long quotes (the jtaer failure)", () => {
  const paper = SYNTHETIC_PAPERS[0]!;
  let pdf: Uint8Array;
  beforeAll(async () => (pdf = await renderPdf(paper.render)));

  /** The model repeats a real passage and runs on past the limit, as Gemini did. */
  const runOn = (quote: string) => `${quote} ${sentence(50)}`;

  it("completes, keeps the original start of the quote and records what was shortened", async () => {
    const original = paper.answer.studies[0]!.sample.n_evidence!.quote;
    const { generate } = answerKeyGenerator(paper, {
      tamper: (pass, answer) => {
        if (pass !== "study_design_sample_bias") return null;
        const copy = structuredClone(answer) as { sample: { n_evidence: { quote: string } }; bias_control: { evidence: { quote: string } } };
        copy.sample.n_evidence.quote = runOn(original);
        copy.bias_control.evidence.quote = runOn(copy.bias_control.evidence.quote);
        return JSON.stringify(copy);
      },
    });
    const result = await extractFull(pdf, { model: "gemini-4-argon", generate });
    const study = result.studies[0]!;
    expect(study.sample.n_evidence!.quote.length).toBeLessThanOrEqual(MAX_QUOTE_CHARS);
    expect(study.sample.n_evidence!.quote.startsWith(original)).toBe(true);
    const call = result.calls.find((c) => c.pass === "study_design_sample_bias")!;
    expect(call.shortenedQuotes?.map((s) => s.path)).toEqual([".sample.n_evidence", ".bias_control.evidence"]);
    // The raw response is kept as the model sent it.
    expect(call.rawText.length).toBeGreaterThan(call.shortenedQuotes![0]!.originalChars);
    expect(result.calls.filter((c) => c.shortenedQuotes).length).toBe(1);
  });

  it("still rejects other schema violations", async () => {
    const { generate } = answerKeyGenerator(paper, {
      tamper: (pass) => (pass === "study_paths" ? '{"paths": [{"estimate": "high"}]}' : null),
    });
    await expect(extractFull(pdf, { model: "gemini-4-argon", generate })).rejects.toThrow(/does not match the schema/);
  });
});
