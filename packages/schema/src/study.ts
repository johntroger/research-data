/**
 * Study-level extraction schemas (codebook Phần D–J), Pass 2.
 * StudyDetail is the full schema for one study; its parts are exported separately so the
 * worker can request them in smaller calls for complex studies (Mục 4.2: keep each schema small).
 */
import { z } from "zod";
import {
  ANALYSIS_METHODS,
  CI_METHODS,
  CMB_PROCEDURAL,
  CMB_STATISTICAL,
  CONSTRUCT_ORDERS,
  CORRELATION_TYPES,
  DIAGONAL_TYPES,
  DIRECTIONS,
  EFFECT_SIZE_TYPES,
  EFFECT_TYPES,
  ENDOGENEITY_METHODS,
  ESTIMATE_TYPES,
  HYPOTHESIS_STATUSES,
  INTERACTION_TYPES,
  MANIPULATION_CHECKS,
  MARKET_TYPES,
  MEDIATION_TYPES,
  SAMPLE_TYPES,
  SCALE_TYPES,
  SIGNS,
  TIME_DESIGNS,
  UNITS_OF_ANALYSIS,
} from "./enums.js";
import { Evidence } from "./evidence.js";

const nullableNumber = (description?: string) =>
  description ? z.number().nullable().describe(description) : z.number().nullable();

// ── Phần E: design ───────────────────────────────────────────────────────────

export const StudyDesign = z.object({
  time_design: z.enum(TIME_DESIGNS).nullable(),
  experimental_design: z.string().nullable().describe("Design as printed, e.g. '2 (disclosure: yes vs. no) × 2 (source) between-subjects'; null when not an experiment."),
  manipulation_check: z.enum(MANIPULATION_CHECKS).nullable(),
  attention_check: z.boolean().nullable(),
  exclusion_rate: nullableNumber("Share of participants excluded (0–1), only when the paper prints it or prints both initial and final counts."),
  preregistered: z.boolean().nullable(),
  open_data: z.boolean().nullable().describe("true only with a link to the data; 'available upon request' is false."),
  analysis_method: z.array(z.enum(ANALYSIS_METHODS)).describe("Method used to test the hypotheses first."),
  software: z.string().nullable().describe("As printed, e.g. 'SmartPLS 4', 'PROCESS macro (Model 4)'."),
  evidence: Evidence,
});

// ── Phần F: sample & context ─────────────────────────────────────────────────

export const StudySample = z.object({
  n: z.number().int().positive().nullable().describe("FINAL sample size used in the analysis (valid responses after exclusions)."),
  n_evidence: Evidence.nullable().describe("Required when n is not null."),
  unit_of_analysis: z.enum(UNITS_OF_ANALYSIS).nullable(),
  sample_type: z.enum(SAMPLE_TYPES).nullable(),
  country_iso: z.array(z.string().length(2)).describe("ISO 3166-1 alpha-2 codes, e.g. ['VN']; [] when not stated."),
  industry_code: z.string().nullable().describe("ISIC section letter of the product / service context, e.g. 'G' retail."),
  market_type: z.enum(MARKET_TYPES).nullable(),
  data_collection_period: z.string().nullable().describe("As printed, e.g. 'March–April 2024'."),
  evidence: Evidence,
});

// ── Phần G: bias control ─────────────────────────────────────────────────────

export const BiasControl = z.object({
  cmb_procedural: z.array(z.enum(CMB_PROCEDURAL)),
  cmb_statistical: z.array(z.enum(CMB_STATISTICAL)),
  cmb_weak_only: z.boolean().describe("true when the only statistical test is Harman's single-factor test and nothing else is done."),
  endogeneity_method: z.array(z.enum(ENDOGENEITY_METHODS)),
  evidence: Evidence.nullable().describe("null when the paper does not discuss common method bias or endogeneity."),
});

// ── Phần D: constructs & measurement ─────────────────────────────────────────

export const Measurement = z.object({
  construct_label_original: z.string().describe("Construct name as the authors use it (full name, not the abbreviation)."),
  definition: z.string().nullable().describe("The authors' definition, copied verbatim; null when none."),
  definition_evidence: Evidence.nullable(),
  scale_source: z.string().nullable().describe("Citation(s) as printed, ';'-separated; 'self-developed' for new scales."),
  adapted: z.boolean().nullable().describe("'adapted / modified / based on' → true; 'adopted / used the scale of' → false."),
  n_items: z.number().int().positive().nullable().describe("Number of items retained after purification."),
  items: z.array(z.string()).describe("Item wording copied verbatim when the paper prints it; [] otherwise."),
  scale_type: z.enum(SCALE_TYPES).nullable(),
  order: z.enum(CONSTRUCT_ORDERS).nullable(),
  parent_label_original: z.string().nullable().describe("Higher-order construct this one is a dimension of, if any."),
  alpha: nullableNumber("Cronbach's alpha."),
  CR: nullableNumber("Composite reliability (rho_c)."),
  AVE: nullableNumber(),
  HTMT_max: nullableNumber("Largest HTMT value involving this construct."),
  reliability_evidence: Evidence.nullable().describe("Table row or sentence reporting alpha / CR / AVE."),
});

export const StudyMeasurements = z.object({
  measurements: z.array(Measurement).describe("Every construct measured in the study."),
});

// ── Phần H, I: tested paths, mediation, moderation ───────────────────────────

export const SimpleSlope = z.object({
  level: z.string().describe("Moderator level as printed, e.g. '−1 SD', 'disclosure = yes'."),
  estimate: z.number(),
  p_reported_as: z.string().nullable(),
});

export const PathResult = z.object({
  hypothesis_code: z.string().nullable().describe('As printed ("H2a"); null for untagged tests and controls.'),
  iv_label_original: z.string().describe("Predictor as named by the authors; for experiments the condition vs. its control."),
  dv_label_original: z.string(),
  mediator_labels: z.array(z.string()).describe("Mediators, only for effect_type = indirect."),
  moderator_labels: z.array(z.string()).describe("Moderators, only for effect_type = interaction."),
  effect_type: z.enum(EFFECT_TYPES),
  estimate_type: z.enum(ESTIMATE_TYPES).nullable(),
  estimate: nullableNumber("Coefficient as printed, keep the sign."),
  se: nullableNumber(),
  ci_low: nullableNumber(),
  ci_high: nullableNumber(),
  ci_method: z.enum(CI_METHODS).nullable(),
  p_value: nullableNumber("Only when an exact p is printed ('= .03' → 0.03); null for '< .001'."),
  p_reported_as: z.string().nullable().describe("p exactly as printed: '< .001', '= .03', 'n.s.', or the star with its threshold."),
  t_or_z: nullableNumber(),
  r2_dv: nullableNumber("R² of the dependent variable in this model."),
  f2: nullableNumber(),
  status: z.enum(HYPOTHESIS_STATUSES).describe("The authors' conclusion for the hypothesis."),
  hypothesized_direction: z.enum(DIRECTIONS).nullable(),
  observed_sign: z.enum(SIGNS).nullable(),
  significant: z.boolean().nullable().describe("Significant at the threshold the authors use."),
  model_covariates: z.array(z.string()).describe("Other predictors in the same model or equation; [] when unknown."),
  indirect_effect: nullableNumber("For effect_type = indirect."),
  boot_ci: z.tuple([z.number(), z.number()]).nullable().describe("Bootstrap CI of the indirect effect [low, high]."),
  mediation_type: z
    .enum(MEDIATION_TYPES)
    .nullable()
    .describe("Zhao, Lynch & Chen (2010). Do not copy 'full/partial mediation'; classify or leave null."),
  interaction_type: z.enum(INTERACTION_TYPES).nullable(),
  simple_slopes: z.array(SimpleSlope),
  index_moderated_mediation: nullableNumber(),
  evidence: Evidence.describe("Prefer the results table row reporting this test."),
});

export const StudyPaths = z.object({
  paths: z.array(PathResult).describe("Every tested relationship in the study, including untagged tests and controls."),
});

// ── Phần J: correlation matrices and experimental cells ──────────────────────

export const CorrelationCell = z.object({ i: z.number().int().min(0), j: z.number().int().min(0), r: z.number() });

export const Descriptive = z.object({
  variable: z.string(),
  mean: nullableNumber(),
  sd: nullableNumber(),
  alpha: nullableNumber(),
  cr: nullableNumber(),
  ave: nullableNumber(),
});

export const CorrelationMatrix = z.object({
  source_table: z.string().describe('e.g. "Table 3".'),
  n: z.number().int().positive().nullable(),
  variables: z.array(z.string()).describe("Variable names in the printed order."),
  cells: z.array(CorrelationCell).describe("Lower triangle only (i > j), indices into variables; diagonal excluded."),
  diagonal_type: z.enum(DIAGONAL_TYPES),
  descriptives: z.array(Descriptive),
  correlation_type: z.enum(CORRELATION_TYPES),
  evidence: Evidence,
});

export const ConditionCell = z.object({
  factors: z.array(z.object({ factor: z.string(), level: z.string() })),
  condition_label: z.string(),
  dv_label_original: z.string(),
  mean: nullableNumber(),
  sd: nullableNumber("null when only SE is printed."),
  se: nullableNumber(),
  n: z.number().int().positive().nullable(),
  test_stat: z.object({ type: z.enum(["F", "t"]), value: z.number() }).nullable(),
  df: z.array(z.number()).describe("Degrees of freedom as printed, e.g. [1, 418]; [] when not printed."),
  p_reported_as: z.string().nullable(),
  effect_size_reported: nullableNumber(),
  effect_size_type: z.enum(EFFECT_SIZE_TYPES).nullable(),
  evidence: Evidence,
});

export const StudyTables = z.object({
  correlation_matrices: z.array(CorrelationMatrix),
  condition_cells: z.array(ConditionCell),
});

// ── Full study ───────────────────────────────────────────────────────────────

export const StudyDetail = z.object({
  study_label: z.string(),
  design: StudyDesign,
  sample: StudySample,
  bias_control: BiasControl,
  ...StudyMeasurements.shape,
  ...StudyPaths.shape,
  ...StudyTables.shape,
});

export type StudyDetail = z.infer<typeof StudyDetail>;
export type PathResult = z.infer<typeof PathResult>;
export type Measurement = z.infer<typeof Measurement>;
