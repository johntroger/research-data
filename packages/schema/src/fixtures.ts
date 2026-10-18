/**
 * Self-written example extractions (no copyrighted content) used by tests and by the
 * Gemini acceptance check. They describe a fictional paper.
 */
import type { PaperDiscussion, PaperStructure } from "./paper.js";
import type { StudyDetail } from "./study.js";

const ev = (pdf_page: number, quote: string, table: string | null = null) => ({
  pdf_page,
  quote,
  section: table ? ("results" as const) : ("method" as const),
  table_or_figure: table,
  table_cell: null,
});

export const EXAMPLE_STRUCTURE: PaperStructure = {
  paper_type: "empirical_quant",
  paper_type_evidence: ev(1, "We tested the model with an online survey of 412 shoppers."),
  studies: [{ study_label: "Study 1", research_design: "survey", design_evidence: ev(5, "Data were collected through an online survey.") }],
  hypothesis_codes: ["H1", "H2", "H3a", "H3b"],
  tables: [
    { table_label: "Table 2", pdf_page: 7, kind: "correlation", study_label: "Study 1" },
    { table_label: "Table 3", pdf_page: 8, kind: "results", study_label: "Study 1" },
  ],
  theories: [
    {
      theory_name_original: "Stimulus–Organism–Response framework",
      application_role: "hypothesis_derivation",
      evidence: ev(3, "Drawing on the S-O-R framework, we expect influencer credibility to raise brand trust."),
    },
  ],
};

export const EXAMPLE_DISCUSSION: PaperDiscussion = {
  contribution_type: { originality: "incremental", utility: "both" },
  theoretical_contributions: [ev(11, "We extend the S-O-R framework to short-video commerce.")],
  practical_implications: [ev(12, "Brands should disclose sponsorships early in the video.")],
  limitations: [ev(12, "The cross-sectional design limits causal claims.")],
  future_directions: [ev(13, "Future studies could use longitudinal data.")],
  gap_type: "empirical",
  gap_evidence: ev(2, "No study has tested this mechanism in live-stream shopping."),
  problematization_hint: null,
};

export const EXAMPLE_STUDY: StudyDetail = {
  study_label: "Study 1",
  design: {
    time_design: "cross_sectional",
    experimental_design: null,
    manipulation_check: null,
    attention_check: true,
    exclusion_rate: 0.12,
    preregistered: false,
    open_data: false,
    analysis_method: ["pls_sem"],
    software: "SmartPLS 4",
    evidence: ev(5, "We analysed the data with PLS-SEM in SmartPLS 4."),
  },
  sample: {
    n: 412,
    n_evidence: ev(5, "The final sample comprised 412 respondents."),
    unit_of_analysis: "individual",
    sample_type: "online_convenience",
    country_iso: ["VN"],
    industry_code: "G",
    market_type: "b2c",
    data_collection_period: "March–April 2024",
    evidence: ev(5, "Respondents were Vietnamese online shoppers recruited via social media."),
  },
  bias_control: {
    cmb_procedural: ["anonymity"],
    cmb_statistical: ["harman"],
    cmb_weak_only: true,
    endogeneity_method: ["none_reported"],
    evidence: ev(6, "Harman's single-factor test showed no dominant factor."),
  },
  measurements: [
    {
      construct_label_original: "Influencer Credibility",
      definition: "the extent to which followers see the influencer as expert and trustworthy",
      definition_evidence: ev(3, "Influencer credibility is the extent to which followers see the influencer as expert and trustworthy."),
      scale_source: "Ohanian (1990)",
      adapted: true,
      n_items: 5,
      items: [],
      scale_type: "reflective",
      order: "first",
      parent_label_original: null,
      alpha: 0.89,
      CR: 0.91,
      AVE: 0.67,
      HTMT_max: 0.71,
      reliability_evidence: ev(7, "Influencer Credibility 0.89 0.91 0.67", "Table 1"),
    },
  ],
  paths: [
    {
      hypothesis_code: "H1",
      iv_label_original: "Influencer Credibility",
      dv_label_original: "Brand Trust",
      mediator_labels: [],
      moderator_labels: [],
      effect_type: "direct",
      estimate_type: "path_coefficient",
      estimate: 0.42,
      se: 0.05,
      ci_low: 0.32,
      ci_high: 0.51,
      ci_method: "bootstrap",
      p_value: null,
      p_reported_as: "< .001",
      t_or_z: 8.4,
      r2_dv: 0.31,
      f2: 0.21,
      status: "supported",
      hypothesized_direction: "positive",
      observed_sign: "positive",
      significant: true,
      model_covariates: ["Brand Familiarity"],
      indirect_effect: null,
      boot_ci: null,
      mediation_type: null,
      interaction_type: null,
      simple_slopes: [],
      index_moderated_mediation: null,
      evidence: ev(8, "H1 Influencer Credibility → Brand Trust 0.42 8.40 <0.001 Supported", "Table 3"),
    },
  ],
  correlation_matrices: [
    {
      source_table: "Table 2",
      n: 412,
      variables: ["Influencer Credibility", "Brand Trust"],
      cells: [{ i: 1, j: 0, r: 0.48 }],
      diagonal_type: "sqrt_ave",
      descriptives: [{ variable: "Influencer Credibility", mean: 5.1, sd: 1.2, alpha: 0.89, cr: 0.91, ave: 0.67 }],
      correlation_type: "latent",
      evidence: ev(7, "Brand Trust 0.48 0.84", "Table 2"),
    },
  ],
  condition_cells: [],
};
