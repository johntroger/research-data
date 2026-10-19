/**
 * Prompts of the full extraction (step 1.3). The system instruction carries the general rules of
 * docs/codebook.md (Phần A.2–A.6, N); field-level rules live in the schema descriptions
 * (packages/schema), which Gemini receives with every call. Bump FULL_PROMPT_VERSION on any change.
 */
import { CODEBOOK_VERSION, type ExtractionSchemaName } from "@research-data/schema";

export const FULL_PROMPT_VERSION = "full-1.4.0";

export const FULL_INSTRUCTIONS = `You extract structured data from one academic paper (attached PDF) for a research database.
Codebook ${CODEBOOK_VERSION}. Follow these rules for every field:

EVIDENCE
1. Every value you extract comes with evidence: pdf_page and quote.
2. pdf_page counts pages inside the PDF file (first page of the file = 1). It is NOT the printed journal page.
3. quote is ONE continuous passage copied word for word from that page, at most 50 words. Do not paraphrase,
   translate or correct it. Never join separate passages with "..." or "…"; two passages are two evidence items.
4. For values in a table, copy the table row as printed (row label, then the numbers), not a sentence you write.
5. Prefer evidence from the Results section or results tables over the abstract.

DO NOT GUESS
6. When the paper does not report a value, return null (or an empty array). Do not estimate or derive it.
7. Do not convert: never turn beta into r, F into d, or percentages into counts.
8. Use only the attached paper: no outside knowledge about the authors, journal or other studies.

NUMBERS
9. Copy numbers as printed and keep the sign: "−.31" → -0.31, ".31" → 0.31, "4,120" → 4120, "0,31" → 0.31.
10. Keep p exactly as printed in p_reported_as ("< .001", "= .03", "n.s."). Fill p_value only for an exact p
    ("= .03" → 0.03; "< .001" → null). For significance stars, read the table note for the threshold.

STUDIES AND NAMES
11. A study is one data collection with its own sample that is used to test the hypotheses or to validate the
    measures with reported statistics. A qualitative preliminary step (focus group, interviews, expert panel, item
    generation) is NOT a study, even when its sample size is reported: do not list it. A quantitative pilot or
    pre-test with its own sample and reported statistics IS a study. Use the authors' study labels ("Study 1",
    "Study 2a", "Pilot study"); a paper with a single study has "Study 1". Two waves on the same sample are one study.
12. Write construct and variable names exactly as the authors do (full names, not abbreviations).`;

const STRUCTURE = `Pass 1 — structure. Identify the paper type, every study with its own sample, every hypothesis code,
every table, and every named theory the paper uses, with evidence.`;

const DISCUSSION = `Pass 1b — discussion. Extract the contribution type, the theoretical contributions, practical
implications, limitations and future research directions as stated by the authors (each one verbatim with its
location), and the research gap the paper says it addresses.`;

const STUDY_PARTS: Record<Exclude<ExtractionSchemaName, "paper_structure" | "paper_discussion">, string> = {
  study_design_sample_bias: "the research design, the final sample and its context, and the control of common method bias and endogeneity",
  study_measurements: "every construct measured, with its definition, scale source, items and reliability (alpha, CR, AVE, HTMT)",
  study_paths: "every tested relationship (hypothesised or not, including controls), with its estimate, test statistics, p, and mediation or moderation results",
  study_tables: "every correlation matrix (lower triangle, diagonal type, descriptives) and every experimental condition cell (M, SD, n, test)",
};

/** Studies of the paper as found in Pass 1, so each study call knows which study to extract. */
export function studyPrompt(part: keyof typeof STUDY_PARTS, studyLabel: string, allStudies: string[]): string {
  const others = allStudies.filter((s) => s !== studyLabel);
  return [
    `Pass 2 — study labelled "${studyLabel}".`,
    `Extract ${STUDY_PARTS[part]}.`,
    `Report ONLY "${studyLabel}".${others.length ? ` Ignore ${others.map((s) => `"${s}"`).join(", ")}.` : ""}`,
  ].join(" ");
}

export const PASS_PROMPTS = { paper_structure: STRUCTURE, paper_discussion: DISCUSSION } as const;
export const STUDY_PART_NAMES = Object.keys(STUDY_PARTS) as (keyof typeof STUDY_PARTS)[];
export type StudyPartName = keyof typeof STUDY_PARTS;
