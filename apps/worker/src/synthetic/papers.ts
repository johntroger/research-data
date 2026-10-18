/**
 * Synthetic papers with known answers (step 0.13, Mục 6.6). All text is self-written and fictional.
 * Each paper exercises layouts seen in real PDFs during the step 0.8 trial:
 *   01 — single column, running-head page numbers, tables with significance stars, √AVE diagonal
 *   02 — two columns, /PageLabels, rotated download watermark, 2×2 experiment with cell means
 *   03 — two studies, side-margin page numbers (Emerald style), subscript, mediation, moderation,
 *        and a table page without a text layer
 */
import type { PaperDiscussion, PaperStructure, PathResult, StudyDetail } from "@research-data/schema";
import type { RenderSpec } from "./render.js";

export interface SyntheticPaper {
  id: string;
  description: string;
  render: RenderSpec;
  answer: {
    structure: PaperStructure;
    discussion: PaperDiscussion;
    studies: StudyDetail[];
  };
  expected: {
    printedPages: string[];
    printedPageMethod: "page_labels" | "header_footer";
    /** Columns detected on each PDF page. */
    columns: (1 | 2)[];
    /** 1-based PDF pages that have no text layer (evidence there cannot be checked by the machine). */
    pagesWithoutText: number[];
  };
  /**
   * Known gaps the set exposed in the worker, kept visible until fixed: a test marked with one of
   * these keys is expected to FAIL, and turns red once the gap is fixed so the note gets removed.
   */
  knownIssues?: { columns?: string };
}

type Ev = PaperStructure["paper_type_evidence"];

const ev = (pdf_page: number, quote: string, table: string | null = null, section: Ev["section"] = null): Ev => ({
  pdf_page,
  quote,
  section: section ?? (table ? "results" : "method"),
  table_or_figure: table,
  table_cell: null,
});

const path = (p: Partial<PathResult> & Pick<PathResult, "iv_label_original" | "dv_label_original" | "evidence">): PathResult => ({
  hypothesis_code: null,
  mediator_labels: [],
  moderator_labels: [],
  effect_type: "direct",
  estimate_type: null,
  estimate: null,
  se: null,
  ci_low: null,
  ci_high: null,
  ci_method: null,
  p_value: null,
  p_reported_as: null,
  t_or_z: null,
  r2_dv: null,
  f2: null,
  status: "not_hypothesized",
  hypothesized_direction: null,
  observed_sign: null,
  significant: null,
  model_covariates: [],
  indirect_effect: null,
  boot_ci: null,
  mediation_type: null,
  interaction_type: null,
  simple_slopes: [],
  index_moderated_mediation: null,
  ...p,
});

const noBias: StudyDetail["bias_control"] = {
  cmb_procedural: [],
  cmb_statistical: [],
  cmb_weak_only: false,
  endogeneity_method: [],
  evidence: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// 01 — single-column survey, PLS-SEM
// ─────────────────────────────────────────────────────────────────────────────

const HEAD_01 = (n: number) => `Journal of Synthetic Marketing 12 (2026)    ${n}`;

const paper01: SyntheticPaper = {
  id: "synthetic-01-survey-pls",
  description: "Single column, running-head page numbers, results table with stars, correlation table with sqrt(AVE) diagonal.",
  render: {
    title: "Influencer credibility and brand trust in short-video commerce",
    pages: [
      {
        header: HEAD_01(1201),
        blocks: [
          { kind: "text", size: 14, bold: true, lines: ["Influencer credibility and brand trust in short-video commerce"] },
          {
            kind: "text",
            lines: [
              "Abstract. We tested the model with an online survey of 412 Vietnamese shoppers.",
              "Drawing on the S-O-R framework, we expect influencer credibility to raise brand trust.",
              "H1: Influencer credibility positively affects brand trust.",
              "H2: Brand trust positively affects purchase intention.",
              "H3: Influencer credibility positively affects purchase intention.",
            ],
          },
        ],
      },
      {
        header: HEAD_01(1202),
        blocks: [
          {
            kind: "text",
            lines: [
              "Method. Data were collected through an online survey in March-April 2024.",
              "Respondents were recruited via social media groups of online shoppers.",
              "The final sample comprised 412 respondents after attention checks.",
              "We analysed the data with PLS-SEM in SmartPLS 4.",
              "Harman's single-factor test showed no dominant factor.",
            ],
          },
          {
            kind: "table",
            title: "Table 1. Measurement model",
            header: ["Construct", "Items", "Alpha", "CR", "AVE"],
            widths: [190, 60, 70, 70, 70],
            rows: [
              ["Influencer Credibility", "5", "0.89", "0.91", "0.67"],
              ["Brand Trust", "4", "0.86", "0.90", "0.70"],
              ["Purchase Intention", "3", "0.84", "0.88", "0.71"],
            ],
          },
        ],
      },
      {
        header: HEAD_01(1203),
        blocks: [
          {
            kind: "table",
            title: "Table 2. Correlations (square root of AVE on the diagonal), N = 412",
            header: ["", "1", "2", "3"],
            widths: [190, 70, 70, 70],
            rows: [
              ["1. Influencer Credibility", "0.82", "", ""],
              ["2. Brand Trust", "0.48", "0.84", ""],
              ["3. Purchase Intention", "0.39", "0.52", "0.84"],
            ],
          },
          {
            kind: "table",
            title: "Table 3. Structural model results",
            header: ["Hypothesis", "Path", "beta", "t", "Result"],
            widths: [70, 210, 60, 50, 80],
            rows: [
              ["H1", "Influencer Credibility -> Brand Trust", "0.42***", "8.40", "Supported"],
              ["H2", "Brand Trust -> Purchase Intention", "0.35***", "6.10", "Supported"],
              ["H3", "Influencer Credibility -> Purchase Intention", "0.08", "1.21", "Not supported"],
            ],
            note: "Note: *** p < .001.",
          },
        ],
      },
      {
        header: HEAD_01(1204),
        blocks: [
          {
            kind: "text",
            lines: [
              "Discussion. We extend the S-O-R framework to short-video commerce.",
              "Brands should disclose sponsorships early in the video.",
              "The cross-sectional design limits causal claims.",
              "Future studies could use longitudinal data.",
            ],
          },
        ],
      },
    ],
  },
  answer: {
    discussion: {
      contribution_type: { originality: "incremental", utility: "both" },
      theoretical_contributions: [ev(4, "We extend the S-O-R framework to short-video commerce.", null, "discussion")],
      practical_implications: [ev(4, "Brands should disclose sponsorships early in the video.", null, "discussion")],
      limitations: [ev(4, "The cross-sectional design limits causal claims.", null, "discussion")],
      future_directions: [ev(4, "Future studies could use longitudinal data.", null, "discussion")],
      gap_type: null,
      gap_evidence: null,
      problematization_hint: null,
    },
    structure: {
      paper_type: "empirical_quant",
      paper_type_evidence: ev(1, "We tested the model with an online survey of 412 Vietnamese shoppers.", null, "abstract"),
      studies: [{ study_label: "Study 1", research_design: "survey", design_evidence: ev(2, "Data were collected through an online survey in March-April 2024.") }],
      hypothesis_codes: ["H1", "H2", "H3"],
      tables: [
        { table_label: "Table 1", pdf_page: 2, kind: "measurement", study_label: "Study 1" },
        { table_label: "Table 2", pdf_page: 3, kind: "correlation", study_label: "Study 1" },
        { table_label: "Table 3", pdf_page: 3, kind: "results", study_label: "Study 1" },
      ],
      theories: [
        {
          theory_name_original: "S-O-R framework",
          application_role: "hypothesis_derivation",
          evidence: ev(1, "Drawing on the S-O-R framework, we expect influencer credibility to raise brand trust.", null, "theory"),
        },
      ],
    },
    studies: [
      {
        study_label: "Study 1",
        design: {
          time_design: "cross_sectional",
          experimental_design: null,
          manipulation_check: null,
          attention_check: true,
          exclusion_rate: null,
          preregistered: false,
          open_data: false,
          analysis_method: ["pls_sem"],
          software: "SmartPLS 4",
          evidence: ev(2, "We analysed the data with PLS-SEM in SmartPLS 4."),
        },
        sample: {
          n: 412,
          n_evidence: ev(2, "The final sample comprised 412 respondents after attention checks."),
          unit_of_analysis: "individual",
          sample_type: "online_convenience",
          country_iso: ["VN"],
          industry_code: "G",
          market_type: "b2c",
          data_collection_period: "March-April 2024",
          evidence: ev(2, "Respondents were recruited via social media groups of online shoppers."),
        },
        bias_control: {
          cmb_procedural: [],
          cmb_statistical: ["harman"],
          cmb_weak_only: true,
          endogeneity_method: [],
          evidence: ev(2, "Harman's single-factor test showed no dominant factor."),
        },
        measurements: [
          ["Influencer Credibility", 5, 0.89, 0.91, 0.67],
          ["Brand Trust", 4, 0.86, 0.9, 0.7],
          ["Purchase Intention", 3, 0.84, 0.88, 0.71],
        ].map(([label, items, alpha, cr, ave]) => ({
          construct_label_original: label as string,
          definition: null,
          definition_evidence: null,
          scale_source: null,
          adapted: null,
          n_items: items as number,
          items: [],
          scale_type: null,
          order: "first" as const,
          parent_label_original: null,
          alpha: alpha as number,
          CR: cr as number,
          AVE: ave as number,
          HTMT_max: null,
          reliability_evidence: ev(2, `${label} ${items} ${alpha} ${cr} ${ave}`, "Table 1"),
        })),
        paths: [
          path({
            hypothesis_code: "H1",
            iv_label_original: "Influencer Credibility",
            dv_label_original: "Brand Trust",
            estimate_type: "std_beta",
            estimate: 0.42,
            p_reported_as: "< .001",
            t_or_z: 8.4,
            status: "supported",
            hypothesized_direction: "positive",
            observed_sign: "positive",
            significant: true,
            evidence: ev(3, "H1 Influencer Credibility -> Brand Trust 0.42*** 8.40 Supported", "Table 3"),
          }),
          path({
            hypothesis_code: "H2",
            iv_label_original: "Brand Trust",
            dv_label_original: "Purchase Intention",
            estimate_type: "std_beta",
            estimate: 0.35,
            p_reported_as: "< .001",
            t_or_z: 6.1,
            status: "supported",
            hypothesized_direction: "positive",
            observed_sign: "positive",
            significant: true,
            evidence: ev(3, "H2 Brand Trust -> Purchase Intention 0.35*** 6.10 Supported", "Table 3"),
          }),
          path({
            hypothesis_code: "H3",
            iv_label_original: "Influencer Credibility",
            dv_label_original: "Purchase Intention",
            estimate_type: "std_beta",
            estimate: 0.08,
            t_or_z: 1.21,
            status: "not_supported",
            hypothesized_direction: "positive",
            observed_sign: "positive",
            significant: false,
            evidence: ev(3, "H3 Influencer Credibility -> Purchase Intention 0.08 1.21 Not supported", "Table 3"),
          }),
        ],
        correlation_matrices: [
          {
            source_table: "Table 2",
            n: 412,
            variables: ["Influencer Credibility", "Brand Trust", "Purchase Intention"],
            cells: [
              { i: 1, j: 0, r: 0.48 },
              { i: 2, j: 0, r: 0.39 },
              { i: 2, j: 1, r: 0.52 },
            ],
            diagonal_type: "sqrt_ave",
            descriptives: [],
            correlation_type: "latent",
            evidence: ev(3, "2. Brand Trust 0.48 0.84", "Table 2"),
          },
        ],
        condition_cells: [],
      },
    ],
  },
  expected: {
    printedPages: ["1201", "1202", "1203", "1204"],
    printedPageMethod: "header_footer",
    columns: [1, 1, 1, 1],
    pagesWithoutText: [],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 02 — two-column 2×2 experiment
// ─────────────────────────────────────────────────────────────────────────────

const WATERMARK = "Downloaded from https://synthetic-publisher.example on 01/01/2026. Synthetic fixture.";

const paper02: SyntheticPaper = {
  id: "synthetic-02-experiment-two-column",
  description: "Two columns, /PageLabels from 45, rotated watermark, 2x2 between-subjects experiment with cell means.",
  render: {
    title: "Sponsorship disclosure and consumer skepticism",
    pageLabelStart: 45,
    pages: [
      {
        watermark: WATERMARK,
        blocks: [
          { kind: "text", size: 14, bold: true, lines: ["Sponsorship disclosure and consumer skepticism"] },
          {
            kind: "columns",
            left: [
              "Abstract. A 2 (disclosure: yes vs. no) x 2",
              "(source: influencer vs. brand) between-",
              "subjects experiment tested how sponsorship",
              "disclosure shapes consumer skepticism.",
              "H1: Disclosure increases skepticism.",
              "H2: The effect is stronger for influencers.",
            ],
            right: [
              "Method. Participants were recruited on",
              "Prolific and randomly assigned to one of",
              "four conditions. Of 456 participants, 36",
              "failed the attention check, leaving 420.",
              "The manipulation check was successful.",
              "We analysed the data with two-way ANOVA.",
            ],
          },
        ],
      },
      {
        watermark: WATERMARK,
        blocks: [
          {
            kind: "table",
            title: "Table 1. Consumer skepticism by condition",
            header: ["Disclosure", "Source", "M", "SD", "n"],
            widths: [110, 110, 70, 70, 70],
            rows: [
              ["yes", "influencer", "5.12", "1.10", "106"],
              ["yes", "brand", "4.61", "1.21", "104"],
              ["no", "influencer", "4.02", "1.15", "105"],
              ["no", "brand", "3.95", "1.18", "105"],
            ],
          },
          {
            kind: "columns",
            left: [
              "Results. Disclosure increased skepticism,",
              "F(1, 416) = 18.20, p < .001, partial eta",
              "squared = .04, supporting H1.",
            ],
            right: [
              "The disclosure x source interaction was",
              "significant, F(1, 416) = 4.10, p = .043,",
              "supporting H2.",
            ],
          },
        ],
      },
      {
        watermark: WATERMARK,
        blocks: [
          {
            kind: "columns",
            left: ["Discussion. Disclosure raises skepticism,", "especially for influencers."],
            right: ["A limitation is the single product", "category used in the stimuli."],
          },
        ],
      },
    ],
  },
  answer: {
    discussion: {
      contribution_type: { originality: "incremental", utility: "scientific" },
      theoretical_contributions: [ev(3, "Disclosure raises skepticism, especially for influencers.", null, "discussion")],
      practical_implications: [],
      limitations: [ev(3, "A limitation is the single product category used in the stimuli.", null, "discussion")],
      future_directions: [],
      gap_type: null,
      gap_evidence: null,
      problematization_hint: null,
    },
    structure: {
      paper_type: "empirical_quant",
      paper_type_evidence: ev(1, "subjects experiment tested how sponsorship", null, "abstract"),
      studies: [
        {
          study_label: "Study 1",
          research_design: "online_experiment",
          design_evidence: ev(1, "Prolific and randomly assigned to one of"),
        },
      ],
      hypothesis_codes: ["H1", "H2"],
      tables: [{ table_label: "Table 1", pdf_page: 2, kind: "condition_means", study_label: "Study 1" }],
      theories: [],
    },
    studies: [
      {
        study_label: "Study 1",
        design: {
          time_design: "cross_sectional",
          experimental_design: "2 (disclosure: yes vs. no) x 2 (source: influencer vs. brand) between-subjects",
          manipulation_check: "passed",
          attention_check: true,
          exclusion_rate: 36 / 456,
          preregistered: false,
          open_data: false,
          analysis_method: ["anova_ancova"],
          software: null,
          evidence: ev(1, "We analysed the data with two-way ANOVA."),
        },
        sample: {
          n: 420,
          n_evidence: ev(1, "failed the attention check, leaving 420."),
          unit_of_analysis: "individual",
          sample_type: "prolific",
          country_iso: [],
          industry_code: null,
          market_type: "b2c",
          data_collection_period: null,
          evidence: ev(1, "Prolific and randomly assigned to one of"),
        },
        bias_control: noBias,
        measurements: [],
        paths: [
          path({
            hypothesis_code: "H2",
            iv_label_original: "Disclosure x Source",
            dv_label_original: "Consumer skepticism",
            moderator_labels: ["Source"],
            effect_type: "interaction",
            p_value: 0.043,
            p_reported_as: "= .043",
            status: "supported",
            hypothesized_direction: "positive",
            significant: true,
            interaction_type: "two_way",
            evidence: ev(2, "significant, F(1, 416) = 4.10, p = .043,", null, "results"),
          }),
        ],
        correlation_matrices: [],
        condition_cells: [
          ["yes", "influencer", 5.12, 1.1, 106],
          ["yes", "brand", 4.61, 1.21, 104],
          ["no", "influencer", 4.02, 1.15, 105],
          ["no", "brand", 3.95, 1.18, 105],
        ].map(([disclosure, source, mean, sd, n]) => ({
          factors: [
            { factor: "disclosure", level: disclosure as string },
            { factor: "source", level: source as string },
          ],
          condition_label: `${disclosure} / ${source}`,
          dv_label_original: "Consumer skepticism",
          mean: mean as number,
          sd: sd as number,
          se: null,
          n: n as number,
          test_stat: { type: "F" as const, value: 18.2 },
          df: [1, 416],
          p_reported_as: "< .001",
          effect_size_reported: 0.04,
          effect_size_type: "partial_eta_squared" as const,
          evidence: ev(2, `${disclosure} ${source} ${(mean as number).toFixed(2)} ${(sd as number).toFixed(2)} ${n}`, "Table 1"),
        })),
      },
    ],
  },
  expected: {
    printedPages: ["45", "46", "47"],
    printedPageMethod: "page_labels",
    columns: [2, 2, 2],
    pagesWithoutText: [],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 03 — two studies, Emerald-style side page numbers, subscript, image-only table page
// ─────────────────────────────────────────────────────────────────────────────

const paper03: SyntheticPaper = {
  id: "synthetic-03-multistudy-mediation-moderation",
  description: "Two studies, side-margin page numbers 501-505, subscript (M age), mediation and moderation, an image-only table page.",
  render: {
    title: "Brand transparency, trust and loyalty",
    pages: [
      {
        side: { text: "501", at: "right" },
        blocks: [
          { kind: "text", size: 14, bold: true, lines: ["Brand transparency, trust and loyalty"] },
          {
            kind: "text",
            lines: [
              "Abstract. Two studies test whether perceived transparency builds loyalty through brand trust.",
              "Study 1 is a survey of 300 consumers; Study 2 is an online experiment with 240 participants.",
              "H1: Brand trust mediates the effect of perceived transparency on loyalty.",
              "H2: Brand familiarity moderates the effect of transparency on brand trust.",
            ],
          },
        ],
      },
      {
        side: { text: "502", at: "left" },
        blocks: [
          {
            kind: "text",
            lines: [
              "Study 1. A consumer panel completed an online survey. The final sample comprised 300 respondents.",
            ],
          },
          {
            kind: "inline",
            parts: [
              { text: "Participants were 52% female (M", size: 10 },
              { text: "age", size: 6, dy: -2 },
              { text: " = 34.2 years).", size: 10 },
            ],
          },
          {
            kind: "text",
            lines: [
              "The indirect effect of perceived transparency on loyalty through brand trust was 0.12,",
              "95% bootstrap CI [0.06, 0.19]. The direct effect remained significant (beta = 0.20, p = .01).",
            ],
          },
        ],
      },
      {
        side: { text: "503", at: "right" },
        blocks: [
          {
            kind: "text",
            lines: [
              "Study 2. Participants were recruited on Prolific for an online experiment; 240 remained after checks.",
              "The effect of transparency on brand trust was weak at low familiarity (-1 SD: beta = 0.05, p = .41)",
              "and strong at high familiarity (+1 SD: beta = 0.31, p < .001), supporting H2.",
            ],
          },
        ],
      },
      {
        side: { text: "504", at: "left" },
        blocks: [
          { kind: "text", lines: ["Table 4. Summary of studies"] },
          { kind: "image", height: 300 },
        ],
      },
      {
        side: { text: "505", at: "right" },
        blocks: [
          {
            kind: "text",
            lines: ["Discussion. Transparency builds loyalty through trust, more so for familiar brands."],
          },
        ],
      },
    ],
  },
  answer: {
    discussion: {
      contribution_type: { originality: "incremental", utility: "scientific" },
      theoretical_contributions: [ev(5, "Transparency builds loyalty through trust, more so for familiar brands.", null, "discussion")],
      practical_implications: [],
      limitations: [],
      future_directions: [],
      gap_type: null,
      gap_evidence: null,
      problematization_hint: null,
    },
    structure: {
      paper_type: "empirical_quant",
      paper_type_evidence: ev(1, "Two studies test whether perceived transparency builds loyalty through brand trust.", null, "abstract"),
      studies: [
        { study_label: "Study 1", research_design: "survey", design_evidence: ev(2, "A consumer panel completed an online survey.") },
        {
          study_label: "Study 2",
          research_design: "online_experiment",
          design_evidence: ev(4, "Study 2 (online experiment): n = 240", "Table 4"),
        },
      ],
      hypothesis_codes: ["H1", "H2"],
      tables: [{ table_label: "Table 4", pdf_page: 4, kind: "hypotheses_summary", study_label: null }],
      theories: [],
    },
    studies: [
      {
        study_label: "Study 1",
        design: {
          time_design: "cross_sectional",
          experimental_design: null,
          manipulation_check: null,
          attention_check: null,
          exclusion_rate: null,
          preregistered: null,
          open_data: null,
          analysis_method: ["process_mediation"],
          software: null,
          evidence: ev(2, "A consumer panel completed an online survey."),
        },
        sample: {
          n: 300,
          n_evidence: ev(2, "The final sample comprised 300 respondents."),
          unit_of_analysis: "individual",
          sample_type: "consumer_panel",
          country_iso: [],
          industry_code: null,
          market_type: "b2c",
          data_collection_period: null,
          evidence: ev(2, "Participants were 52% female (Mage = 34.2 years)."),
        },
        bias_control: noBias,
        measurements: [],
        paths: [
          path({
            hypothesis_code: "H1",
            iv_label_original: "Perceived transparency",
            dv_label_original: "Loyalty",
            mediator_labels: ["Brand trust"],
            effect_type: "indirect",
            status: "supported",
            significant: true,
            indirect_effect: 0.12,
            boot_ci: [0.06, 0.19],
            ci_method: "bootstrap",
            mediation_type: "complementary",
            evidence: ev(2, "The indirect effect of perceived transparency on loyalty through brand trust was 0.12,", null, "results"),
          }),
          path({
            iv_label_original: "Perceived transparency",
            dv_label_original: "Loyalty",
            effect_type: "direct",
            estimate_type: "std_beta",
            estimate: 0.2,
            p_value: 0.01,
            p_reported_as: "= .01",
            observed_sign: "positive",
            significant: true,
            evidence: ev(2, "The direct effect remained significant (beta = 0.20, p = .01).", null, "results"),
          }),
        ],
        correlation_matrices: [],
        condition_cells: [],
      },
      {
        study_label: "Study 2",
        design: {
          time_design: "cross_sectional",
          experimental_design: null,
          manipulation_check: null,
          attention_check: true,
          exclusion_rate: null,
          preregistered: null,
          open_data: null,
          analysis_method: ["regression"],
          software: null,
          evidence: ev(3, "Participants were recruited on Prolific for an online experiment; 240 remained after checks."),
        },
        sample: {
          n: 240,
          n_evidence: ev(3, "Participants were recruited on Prolific for an online experiment; 240 remained after checks."),
          unit_of_analysis: "individual",
          sample_type: "prolific",
          country_iso: [],
          industry_code: null,
          market_type: "b2c",
          data_collection_period: null,
          evidence: ev(3, "Participants were recruited on Prolific for an online experiment; 240 remained after checks."),
        },
        bias_control: noBias,
        measurements: [],
        paths: [
          path({
            hypothesis_code: "H2",
            iv_label_original: "Perceived transparency x Brand familiarity",
            dv_label_original: "Brand trust",
            moderator_labels: ["Brand familiarity"],
            effect_type: "interaction",
            status: "supported",
            significant: true,
            interaction_type: "two_way",
            simple_slopes: [
              { level: "-1 SD", estimate: 0.05, p_reported_as: "= .41" },
              { level: "+1 SD", estimate: 0.31, p_reported_as: "< .001" },
            ],
            evidence: ev(3, "and strong at high familiarity (+1 SD: beta = 0.31, p < .001), supporting H2.", null, "results"),
          }),
        ],
        correlation_matrices: [],
        condition_cells: [],
      },
    ],
  },
  expected: {
    printedPages: ["501", "502", "503", "504", "505"],
    printedPageMethod: "header_footer",
    columns: [1, 1, 1, 1, 1],
    pagesWithoutText: [4],
  },
};

export const SYNTHETIC_PAPERS: SyntheticPaper[] = [paper01, paper02, paper03];
