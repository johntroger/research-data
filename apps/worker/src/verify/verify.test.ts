import { beforeAll, describe, expect, it } from "vitest";
import type { SkeletonExtraction } from "../extract/skeleton-schema.js";
import { buildPdf } from "../pdf/test-fixtures.js";
import { readTextLayer, type PdfTextLayer } from "../pdf/text-layer.js";
import { normaliseForMatch } from "./normalize.js";
import { numberForms, parsePValue, verifyNumber, verifyPValue } from "./number.js";
import { textCheck } from "./checks.js";
import { verifyQuote } from "./quote.js";
import { verifySkeleton } from "./verify-skeleton.js";

// Self-written paper text (no copyrighted content).
const PAGE_1 = [
  "Brand trust and purchase intention online",
  "We surveyed online shoppers to examine how perceived risk shapes purchase",
  "intention. Data were collected through an online survey of Vietnamese consumers.",
].join("\n");
const PAGE_2 = [
  "The final sample comprised 412 respondents after attention checks.",
  "Perceived risk had a significant negative effect on purchase inten-",
  "tion (beta = -.31, p < .001), supporting H2. The model explained 4120 cases.",
].join("\n");
const PAGE_3 = "Table 3 reports all coefficients. Brand trust increased loyalty (beta = .28, p = .03).";

let layer: PdfTextLayer;

beforeAll(async () => {
  layer = await readTextLayer(await buildPdf({ pages: [{ body: PAGE_1 }, { body: PAGE_2 }, { body: PAGE_3 }] }));
});

describe("normaliseForMatch", () => {
  it("joins hyphenated line breaks and unifies quotes, dashes and spacing", () => {
    expect(normaliseForMatch("subjectively per-\nceive as “ right ” or “ wrong ”")).toBe(
      'subjectively perceive as "right" or "wrong"',
    );
    expect(normaliseForMatch("morality ’ s influence")).toBe("morality's influence");
    // Greek letters are folded to the Latin letter a symbol font stores them as (step 1.9b).
    expect(normaliseForMatch("β = −.31")).toBe("b = -.31");
    expect(normaliseForMatch("ﬁrst ﬂow")).toBe("first flow");
  });

  it("keeps real hyphenated compounds", () => {
    expect(normaliseForMatch("long-term\nloyalty and self-\nReport")).toBe("long-term loyalty and self- report");
  });
});

describe("verifyQuote", () => {
  it("finds an exact quote on the cited page, even across a hyphenated line break", () => {
    const check = verifyQuote(layer, "Perceived risk had a significant negative effect on purchase intention", 2);
    expect(check).toMatchObject({ match: "exact", foundOnPage: 2, score: 1 });
  });

  it("accepts a quote with a small copying difference as fuzzy", () => {
    const check = verifyQuote(
      layer,
      "We surveyed online shoppers to examine how perceived risk shape purchase intention. Data were collected through an online survey",
      1,
    );
    expect(check.match).toBe("fuzzy");
    expect(check.score).toBeGreaterThanOrEqual(0.9);
  });

  it("finds a quote on the neighbouring page when the AI cites the wrong page", () => {
    expect(verifyQuote(layer, "The final sample comprised 412 respondents", 1)).toMatchObject({
      match: "neighbour_page",
      foundOnPage: 2,
    });
  });

  it("reports meaning-changing words in a fuzzy match", () => {
    const check = verifyQuote(layer, "Perceived risk had a significant positive effect on purchase intention", 2);
    expect(check.match).toBe("fuzzy");
    expect(check.criticalDifferences).toEqual(expect.arrayContaining(["positive", "negative"]));
  });

  it("rejects a fabricated quote", () => {
    const check = verifyQuote(layer, "Brand love fully mediated the effect of influencer credibility on loyalty", 2);
    expect(check.match).toBe("not_found");
    expect(check.foundOnPage).toBeNull();
  });

  it("does not search beyond the neighbouring pages", () => {
    expect(verifyQuote(layer, "Table 3 reports all coefficients", 1).match).toBe("not_found");
  });
});

describe("numbers", () => {
  it("generates the written forms of a number", () => {
    expect(numberForms(-0.31)).toEqual(expect.arrayContaining(["-0.31", "-.31", "-0,31", "- .31"]));
    expect(numberForms(1234)).toEqual(expect.arrayContaining(["1234", "1,234"]));
  });

  it("finds -0.31 printed as -.31 and p < .001 printed with spaces", () => {
    expect(verifyNumber(layer, -0.31, 2)).toMatchObject({ found: true, foundOnPage: 2, matchedForm: "-.31" });
    expect(verifyPValue(layer, "< .001", 2)).toMatchObject({ found: true, foundOnPage: 2 });
    expect(verifyPValue(layer, "p<0.001", 2).found).toBe(true);
  });

  it("does not match a number inside a longer number", () => {
    expect(verifyNumber(layer, 412, 2).found).toBe(true);
    expect(verifyNumber(layer, 120, 2).found).toBe(false); // only appears inside 4120
    expect(verifyNumber(layer, 0.3, 2).found).toBe(false); // only appears inside .31
  });

  it("rejects a number that is not on the cited or neighbouring pages", () => {
    expect(verifyNumber(layer, -0.42, 2).found).toBe(false);
  });

  it("parses reported p-values", () => {
    expect(parsePValue("< .001")).toEqual({ operator: "<", value: 0.001 });
    expect(parsePValue("p = .03")).toEqual({ operator: "=", value: 0.03 });
    expect(parsePValue("n.s.")).toBeNull();
  });
});

const EXTRACTION: SkeletonExtraction = {
  paper_type: "empirical_quant",
  paper_type_evidence: { pdf_page: 1, quote: "Data were collected through an online survey of Vietnamese consumers." },
  studies: [
    {
      study_label: "Study 1",
      research_design: "survey",
      design_evidence: { pdf_page: 1, quote: "Data were collected through an online survey" },
      sample_size: 412,
      sample_size_evidence: { pdf_page: 1, quote: "The final sample comprised 412 respondents after attention checks." },
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
    evidence: { pdf_page: 2, quote: "Perceived risk had a significant negative effect on purchase intention (beta = -.31, p < .001)" },
  },
};

describe("fixes from the real-paper trial (step 0.8b)", () => {
  let trial: PdfTextLayer;

  beforeAll(async () => {
    trial = await readTextLayer(
      await buildPdf({
        pages: [
          {
            body: "Perceived brand transparency positively relates to the expertise (beta = 0.70, p < 0.001) dimension.",
            inline: {
              y: 300,
              parts: [
                { text: "or indicated low brand familiarity (M", size: 11 },
                { text: "brand familiarity", size: 7, dy: -3 },
                { text: " <= 2) were removed, resulting in a final sample of 288 participants.", size: 11 },
              ],
            },
          },
          {}, // a table embedded as an image: no text layer
          {
            body: [
              "Table IV. Results",
              "Hypothesis",
              "Path coefficient",
              "H1",
              "0.294",
              "H1 is supported",
            ].join("\n"),
          },
        ],
      }),
    );
  });

  it("matches 0.7 against 0.70 but still not 412 against 4120", () => {
    expect(verifyNumber(trial, 0.7, 1)).toMatchObject({ found: true });
    expect(verifyNumber(layer, 120, 2).found).toBe(false);
  });

  it("normalises the APL alpha used by some typesetters (and folds it like any alpha)", () => {
    expect(normaliseForMatch("⍺ = 0.84")).toBe("a = 0.84");
    expect(normaliseForMatch("α = 0.84")).toBe(normaliseForMatch("⍺ = 0.84"));
  });

  it("matches a quote whose Greek letters the PDF stores as Latin letters (Cronbach's a for α)", () => {
    const pdfText = "created ( M = 2.99, SD = 1.48), which proved both reliable (Cronbach’s a = 0.95) and valid (eigenvalue = 3.48, R 2 = 0.87).";
    const quote = "created (M = 2.99, SD = 1.48), which proved both reliable (Cronbach’s α = 0.95) and valid (eigenvalue = 3.48, R2 = 0.87).";
    expect(normaliseForMatch(pdfText).replace(/ /g, "")).toBe(normaliseForMatch(quote).replace(/ /g, ""));
  });

  it("matches a quote written without the subscript space ('Mbrand familiarity')", () => {
    const check = verifyQuote(trial, "indicated low brand familiarity (Mbrand familiarity <= 2) were removed", 1);
    expect(check.match).toBe("exact");
  });

  it("gives ⚠ instead of hiding a value whose evidence page has no text layer", () => {
    const data: SkeletonExtraction = {
      paper_type: "empirical_quant",
      paper_type_evidence: { pdf_page: 1, quote: "resulting in a final sample of 288 participants" },
      studies: [
        {
          study_label: "Study 1",
          research_design: "survey",
          design_evidence: { pdf_page: 2, quote: "Study 1 (survey): n = 20 experts" },
          sample_size: 20,
          sample_size_evidence: { pdf_page: 2, quote: "Study 1 (survey): n = 20 experts" },
        },
      ],
      example_hypothesis: null,
    };
    const fields = verifySkeleton(trial, data);
    expect(fields.find((f) => f.naturalKey === "study_1:research_design")?.badge).toBe("needs_attention");
    expect(fields.find((f) => f.naturalKey === "study_1:sample_size")?.badge).toBe("needs_attention");
    expect(fields.find((f) => f.naturalKey === "study_1:research_design")?.checks[0]?.detail).toContain("không có text");
  });

  it("gives ⚠ to a table result whose numbers are on the page even if the quote is not", () => {
    const data: SkeletonExtraction = {
      paper_type: "empirical_quant",
      paper_type_evidence: { pdf_page: 1, quote: "resulting in a final sample of 288 participants" },
      studies: [],
      example_hypothesis: {
        study_label: "Study 1",
        hypothesis_code: "H1",
        iv: "Green perceived value",
        dv: "Green trust",
        estimate: 0.294,
        estimate_type: "other",
        p_reported: "< 0.05",
        status: "supported",
        evidence: { pdf_page: 3, quote: "Hypothesis Proposed effect Path coefficient Results H1 + 0.294 * H1 is supported" },
      },
    };
    const result = verifySkeleton(trial, data).at(-1)!;
    expect(result.badge).toBe("needs_attention");
    expect(result.checks.find((c) => c.name === "estimate_in_pdf")?.passed).toBe(true);
    expect(result.checks.find((c) => c.name === "p_in_pdf")?.severity).toBe("attention");
  });

  it("still hides a table result whose coefficient is not on the page", () => {
    const data: SkeletonExtraction = {
      paper_type: "empirical_quant",
      paper_type_evidence: { pdf_page: 1, quote: "resulting in a final sample of 288 participants" },
      studies: [],
      example_hypothesis: {
        study_label: "Study 1",
        hypothesis_code: "H1",
        iv: "Green perceived value",
        dv: "Green trust",
        estimate: 0.394,
        estimate_type: "other",
        p_reported: null,
        status: "supported",
        evidence: { pdf_page: 3, quote: "H1 + 0.394 * H1 is supported" },
      },
    };
    expect(verifySkeleton(trial, data).at(-1)!.badge).toBe("hidden");
  });
});

describe("verifySkeleton", () => {
  it("marks every field verified when quotes and numbers are in the PDF, correcting the page", () => {
    const fields = verifySkeleton(layer, EXTRACTION);
    expect(fields.map((f) => [f.naturalKey, f.badge])).toEqual([
      ["paper_type", "auto_verified"],
      ["study_1:research_design", "auto_verified"],
      ["study_1:sample_size", "auto_verified"],
      ["study_1:h2:perceived_risk->purchase_intention", "auto_verified"],
    ]);
    // The AI cited page 1 for the sample size; the quote is on page 2.
    expect(fields[2]!.evidence.pdfPage).toBe(2);
  });

  it("hides a hypothesis whose coefficient is not in the PDF (hallucinated number)", () => {
    const wrong = structuredClone(EXTRACTION);
    wrong.example_hypothesis!.estimate = -0.42;
    const result = verifySkeleton(layer, wrong).at(-1)!;
    expect(result.badge).toBe("hidden");
    expect(result.checks.find((c) => c.name === "estimate_in_pdf")?.passed).toBe(false);
  });

  it("hides a field whose quote is fabricated", () => {
    const wrong = structuredClone(EXTRACTION);
    wrong.paper_type_evidence.quote = "This meta-analysis synthesises 120 studies.";
    expect(verifySkeleton(layer, wrong)[0]!.badge).toBe("hidden");
  });

  it("flags 'supported' with a non-significant p for attention instead of hiding it", () => {
    const odd = structuredClone(EXTRACTION);
    odd.example_hypothesis = {
      ...odd.example_hypothesis!,
      hypothesis_code: "H3",
      iv: "Brand trust",
      dv: "Loyalty",
      estimate: 0.28,
      p_reported: "= .03",
      evidence: { pdf_page: 3, quote: "Brand trust increased loyalty (beta = .28, p = .03)" },
    };
    expect(verifySkeleton(layer, odd).at(-1)!.badge).toBe("auto_verified");

    odd.example_hypothesis.p_reported = "= .30";
    odd.example_hypothesis.evidence.quote = "Brand trust increased loyalty";
    const flagged = verifySkeleton(layer, odd).at(-1)!;
    // .30 is not in the PDF either, so the field is hidden; the consistency check is still reported.
    expect(flagged.checks.find((c) => c.name === "status_consistent")?.passed).toBe(false);
  });

  it("returns only paper_type for a review with no studies", () => {
    const review: SkeletonExtraction = { ...EXTRACTION, paper_type: "conceptual", studies: [], example_hypothesis: null };
    expect(verifySkeleton(layer, review).map((f) => f.naturalKey)).toEqual(["paper_type"]);
  });
});

describe("a word split over two lines (step 1b.8d)", () => {
  const PAGE = [
    "Future work should also ask questions related to uses and gratifica - tions in the context of advertising.",
    "All data was ano - nymized and is presented in aggregate; the four- component model by Rest ( 1986 ) guided us.",
  ].join("\n");
  let hyphenLayer: PdfTextLayer;
  beforeAll(async () => {
    hyphenLayer = await readTextLayer(await buildPdf({ pages: [{ body: PAGE }] }));
  });

  it("joins the word in every spelling the PDF and the AI use", () => {
    expect(normaliseForMatch("gratifica - tions")).toBe("gratifications");
    expect(normaliseForMatch("experi- ence")).toBe("experience");
    expect(normaliseForMatch("per-\nceive")).toBe("perceive");
    expect(normaliseForMatch("long-term loyalty")).toBe("long-term loyalty"); // a real compound keeps its hyphen
    expect(normaliseForMatch("Self- Disclosure")).toBe("self- disclosure"); // only a lower-case rest of the word is joined
  });

  it("finds a quote written without the hyphen (the AI joined the word) as an exact match", () => {
    const check = verifyQuote(hyphenLayer, "Future work should also ask questions related to uses and gratifications in the context of advertising", 1);
    expect(check).toMatchObject({ match: "exact", score: 1 });
  });

  it("finds a quote that kept the hyphen tight where the PDF has it spaced", () => {
    expect(verifyQuote(hyphenLayer, "All data was ano-nymized and is presented in aggregate", 1)).toMatchObject({ match: "exact" });
  });

  it("still rejects a quote that differs in a real word", () => {
    expect(verifyQuote(hyphenLayer, "Future work should also ask questions related to uses and gratifications in the context of marketing", 1).match).not.toBe("exact");
  });

  it("finds a name whose compound hyphen is spaced in the PDF", () => {
    expect(textCheck(hyphenLayer, "name_in_quote", "four-component model by Rest (1986)", 1)).toMatchObject({ passed: true });
  });
});
