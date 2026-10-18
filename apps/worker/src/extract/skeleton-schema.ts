/**
 * Skeleton extraction schema (step 0.5): only 4 fields, to prove the Gemini round trip.
 * The full schema from the codebook replaces this in step 0.11 (packages/schema).
 */
import { z } from "zod";

export const SKELETON_PROMPT_VERSION = "skeleton-0.5.0";

const Evidence = z
  .object({
    pdf_page: z
      .number()
      .int()
      .min(1)
      .describe("Page number counted inside the PDF file (first page of the file = 1), NOT the printed journal page."),
    quote: z
      .string()
      .min(1)
      .max(400)
      .describe("Exact words copied from the paper (at most 50 words) that support the value. Do not paraphrase."),
  })
  .describe("Where the value comes from in the PDF.");

export const PAPER_TYPES = [
  "empirical_quant",
  "empirical_qual",
  "mixed",
  "conceptual",
  "systematic_review",
  "meta_analysis",
  "other",
] as const;

export const RESEARCH_DESIGNS = [
  "survey",
  "lab_experiment",
  "online_experiment",
  "field_experiment",
  "secondary_data",
  "longitudinal_panel",
  "qualitative",
  "other",
] as const;

export const SkeletonStudy = z.object({
  study_label: z.string().describe('Label used by the authors, e.g. "Study 1", "Study 2a". Use "Study 1" when there is only one.'),
  research_design: z.enum(RESEARCH_DESIGNS),
  design_evidence: Evidence,
  sample_size: z
    .number()
    .int()
    .positive()
    .nullable()
    .describe("Final analysed sample size (N) of this study, or null if the paper does not report one."),
  sample_size_evidence: Evidence.nullable().describe("Required when sample_size is not null."),
});

export const SkeletonHypothesis = z.object({
  study_label: z.string(),
  hypothesis_code: z.string().nullable().describe('Code used by the authors, e.g. "H2", or null if not labelled.'),
  iv: z.string().describe("Independent variable (predictor), as named by the authors."),
  dv: z.string().describe("Dependent variable (outcome), as named by the authors."),
  estimate: z.number().nullable().describe("Reported coefficient / effect size exactly as printed, e.g. -0.31."),
  estimate_type: z.enum(["std_beta", "unstd_b", "r", "d", "odds_ratio", "other"]).nullable(),
  p_reported: z.string().nullable().describe('p-value exactly as printed, e.g. "< .001" or "= .03".'),
  status: z.enum(["supported", "not_supported", "partially_supported", "not_hypothesized"]),
  evidence: Evidence.describe("Prefer the results table row or the results sentence that reports this test."),
});

export const SkeletonExtraction = z.object({
  paper_type: z.enum(PAPER_TYPES),
  paper_type_evidence: Evidence,
  studies: z
    .array(SkeletonStudy)
    .describe("Every empirical study in the paper. Empty array for reviews, conceptual or theoretical papers."),
  example_hypothesis: SkeletonHypothesis.nullable().describe(
    "The FIRST hypothesis test reported in the results, or null when the paper reports no hypothesis tests.",
  ),
});

export type SkeletonExtraction = z.infer<typeof SkeletonExtraction>;

/** JSON Schema sent to Gemini (`responseJsonSchema`), generated from the Zod schema. */
export function skeletonJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(SkeletonExtraction) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
}

export const SKELETON_INSTRUCTIONS = `You extract structured data from one academic paper (behavioural science, marketing, management).

Rules:
- Use ONLY the attached PDF. Never use outside knowledge about the paper or its authors.
- If a value is not reported in the paper, return null. Never guess or estimate numbers.
- Every evidence.quote must be copied word for word from the PDF (at most 50 words). Do not paraphrase, translate or fix typos.
- evidence.pdf_page counts pages of the PDF file itself: the first page of the file is 1. Do NOT use the printed journal page number.
- Numbers must be copied exactly as printed (keep the sign; ".31" means 0.31).
- For reviews, conceptual or theoretical papers: studies = [] and example_hypothesis = null.`;
