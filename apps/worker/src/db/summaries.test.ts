import { describe, expect, it } from "vitest";
import type { PdfTextLayer } from "../pdf/text-layer.js";
import { checkSummary, parseSummaryAnswer, shown } from "./summaries.js";

const layer = (pages: string[]): PdfTextLayer => ({
  fileHash: "x",
  pageCount: pages.length,
  pages: pages.map((text, i) => ({ index: i, text, rowText: text, charCount: text.length })) as unknown as PdfTextLayer["pages"],
  pageLabels: null,
  needsOcr: false,
});

const PAGES = [
  "Abstract. We show that transparent disclosure raises brand trust among young consumers in two experiments.",
  "Introduction. This paper asks whether consumers reward brands that are open about their sourcing practices.",
];

describe("parseSummaryAnswer", () => {
  it("reads a well-formed answer and caps the findings", () => {
    const a = parseSummaryAnswer(
      JSON.stringify({
        research_question: "Do consumers reward openness?",
        question_quote: "asks whether consumers reward brands",
        question_page: 2,
        findings: [1, 2, 3, 4].map((n) => ({ text: `Finding ${n}`, quote: "q", page: 1 })),
      }),
    );
    expect(a.findings).toHaveLength(3);
    expect(a.question_page).toBe(2);
  });

  it("rejects bad JSON, an empty question and a finding without text", () => {
    expect(() => parseSummaryAnswer("{")).toThrow(/JSON/);
    expect(() => parseSummaryAnswer(JSON.stringify({ research_question: " " }))).toThrow(/research_question/);
    expect(() => parseSummaryAnswer(JSON.stringify({ research_question: "Q", findings: [{ quote: "q", page: 1 }] }))).toThrow(/no text/);
  });
});

describe("checkSummary", () => {
  it("accepts quotes found on their page and marks the others", () => {
    const answer = parseSummaryAnswer(
      JSON.stringify({
        research_question: "Do consumers reward openness?",
        question_quote: "asks whether consumers reward brands that are open",
        question_page: 2,
        findings: [
          { text: "Disclosure raises trust.", quote: "transparent disclosure raises brand trust among young consumers", page: 1 },
          { text: "Invented.", quote: "disclosure always doubles sales in every market", page: 1 },
        ],
      }),
    );
    const checked = checkSummary(layer(PAGES), answer);
    expect(checked.questionMatch).toBe("exact");
    expect(checked.questionPageIndex).toBe(1);
    expect(checked.findings.map((f) => f.match)).toEqual(["exact", "not_found"]);
    expect(checked.findings.map((f) => shown(f.match))).toEqual([true, false]);
  });

  it("keeps the page where a quote on the neighbouring page was found", () => {
    const answer = parseSummaryAnswer(JSON.stringify({ research_question: "Q", question_quote: "asks whether consumers reward brands that are open about their sourcing", question_page: 1, findings: [] }));
    const checked = checkSummary(layer(PAGES), answer);
    expect(checked.questionMatch).toBe("neighbour_page");
    expect(checked.questionPageIndex).toBe(1);
  });

  it("treats a missing quote as not found", () => {
    const checked = checkSummary(layer(PAGES), parseSummaryAnswer(JSON.stringify({ research_question: "Q", findings: [] })));
    expect(checked.questionMatch).toBe("not_found");
    expect(shown(checked.questionMatch)).toBe(false);
  });
});
