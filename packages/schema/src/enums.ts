/**
 * Allowed values from docs/codebook.md (v1.0.0). Change the codebook first, then these lists.
 */

export const PAPER_TYPES = [
  "empirical_quant",
  "empirical_qual",
  "mixed",
  "conceptual",
  "narrative_review",
  "systematic_review",
  "meta_analysis",
  "other",
] as const;

export const APPLICATION_ROLES = ["mentioned", "framing", "hypothesis_derivation", "tested", "extended"] as const;

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

export const TIME_DESIGNS = ["cross_sectional", "time_lagged", "longitudinal"] as const;
export const MANIPULATION_CHECKS = ["passed", "failed", "not_reported"] as const;

export const ANALYSIS_METHODS = [
  "pls_sem",
  "cb_sem",
  "regression",
  "anova_ancova",
  "process_mediation",
  "t_test",
  "hlm_multilevel",
  "fsqca",
  "content_analysis",
  "other",
] as const;

export const UNITS_OF_ANALYSIS = ["individual", "firm", "dyad", "team", "brand", "post", "other"] as const;

export const SAMPLE_TYPES = [
  "students",
  "mturk",
  "prolific",
  "consumer_panel",
  "online_convenience",
  "employees",
  "managers",
  "social_media_users",
  "secondary",
  "other",
] as const;

export const MARKET_TYPES = ["b2c", "b2b", "c2c"] as const;

export const CMB_PROCEDURAL = [
  "anonymity",
  "separated_measurement",
  "counterbalancing",
  "reverse_items",
  "different_scale_formats",
  "other",
] as const;

export const CMB_STATISTICAL = ["harman", "marker_variable", "ulmc", "clf", "full_collinearity_vif", "other"] as const;

export const ENDOGENEITY_METHODS = [
  "instrumental_variable",
  "heckman",
  "gaussian_copula",
  "two_sls",
  "control_function",
  "none_reported",
] as const;

export const SCALE_TYPES = ["reflective", "formative"] as const;
export const CONSTRUCT_ORDERS = ["first", "higher"] as const;

export const EFFECT_TYPES = ["direct", "indirect", "interaction", "total", "control"] as const;

export const ESTIMATE_TYPES = [
  "std_beta",
  "unstd_b",
  "path_coefficient",
  "r",
  "d",
  "odds_ratio",
  "eta_squared",
  "other",
] as const;

export const CI_METHODS = ["bootstrap", "normal", "other"] as const;

export const HYPOTHESIS_STATUSES = [
  "supported",
  "not_supported",
  "partially_supported",
  "mixed",
  "not_hypothesized",
] as const;

export const DIRECTIONS = ["positive", "negative", "non_directional"] as const;
export const SIGNS = ["positive", "negative"] as const;

export const MEDIATION_TYPES = ["complementary", "competitive", "indirect_only", "direct_only", "no_effect"] as const;
export const INTERACTION_TYPES = ["two_way", "three_way", "moderated_mediation"] as const;

export const DIAGONAL_TYPES = ["one", "sqrt_ave", "alpha", "empty"] as const;
export const CORRELATION_TYPES = ["pearson", "latent", "polychoric", "unknown"] as const;

export const EFFECT_SIZE_TYPES = ["eta_squared", "partial_eta_squared", "omega_squared", "d", "other"] as const;

export const SECTIONS = ["abstract", "introduction", "theory", "method", "results", "discussion", "appendix", "other"] as const;

export const TABLE_KINDS = [
  "results",
  "correlation",
  "descriptives",
  "measurement",
  "condition_means",
  "hypotheses_summary",
  "other",
] as const;

export const ORIGINALITY = ["incremental", "revelatory"] as const;
export const UTILITY = ["scientific", "practical", "both"] as const;

export const GAP_TYPES = [
  "evidence",
  "knowledge",
  "practical_knowledge",
  "methodological",
  "empirical",
  "theoretical",
  "population",
] as const;
