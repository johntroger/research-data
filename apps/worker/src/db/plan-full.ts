/**
 * Turns a verified full extraction into the rows of the business tables (step 1.8). Pure: no database.
 *
 * Rules:
 *  - one row per Study / sample / construct / tested path / matrix / experimental cell / theory / statement,
 *    keyed by the stable natural key of the verified fields (Mục 6.7);
 *  - a typed column that holds a verified field takes the field's value; when that field is hidden
 *    (not found in the PDF) and the row stays visible, the column is NULL: a visitor must not see a
 *    value that failed the check. The value stays in extracted_fields (hidden) and raw_extraction
 *    (not readable by visitors, see the migration of step 1.8);
 *  - the row badge is the most severe badge among the fields still shown; when every key field of the
 *    row is hidden, or the row has no verified field, the row is hidden / needs attention;
 *  - `fieldColumns` links each column to its field, so a re-extraction does not overwrite a column
 *    whose field the owner edited and locked.
 */
import type { Badge, PathResult } from "@research-data/schema";
import { canonicalKey } from "@research-data/schema";
import type { ExtractionMapping } from "../mapping/extraction.js";
import type { PaperAnalysis } from "../verify/analyse.js";
import { type FieldVerification, slug } from "../verify/checks.js";
import type { StatResult } from "../verify/crosscheck.js";
import type { FullData } from "../verify/verify-full.js";

export interface EvidenceLike {
  pdf_page: number;
  quote: string;
  section?: string | null;
  table_or_figure?: string | null;
  table_cell?: { row: string; column: string } | null;
}

export type RowTable = "studies" | "samples" | "measurements" | "path_results" | "correlation_matrices" | "condition_cells" | "paper_theories" | "paper_statements";

export interface PlannedRow {
  table: RowTable;
  naturalKey: string;
  /** Natural key of the study this row belongs to (samples, measurements, paths, matrices, cells). */
  studyKey: string | null;
  columns: Record<string, unknown>;
  /** Column → natural key of the extracted_fields row that owns its value. */
  fieldColumns: Record<string, string>;
  /** Column → evidence of the value (resolved to an evidence row id when written). */
  evidence: Record<string, EvidenceLike | null>;
  badge: Badge;
  /** The extraction call whose answer this row comes from. */
  source: { pass: string; studyLabel: string | null };
  raw: unknown;
  /** Lower-triangle cells and per-variable statistics of a correlation matrix. */
  cells?: { i: number; j: number; r: number }[];
  descriptives?: { variable_index: number; variable: string; mean: number | null; sd: number | null; alpha: number | null; cr: number | null; ave: number | null }[];
}

export interface PaperColumns {
  paper_type: string | null;
  hypothesis_codes: string[];
  contribution_originality: string | null;
  contribution_utility: string | null;
  gap_type: string | null;
  problematization_hint: string | null;
  completeness_status: "complete" | "incomplete";
  missing_items: string[];
}

export interface PublishPlan {
  paper: PaperColumns;
  paperEvidence: { paper_type_evidence_id: EvidenceLike | null; gap_evidence_id: EvidenceLike | null };
  tables: { table_label: string; pdf_page_index: number; kind: string; study_label: string | null }[];
  rows: PlannedRow[];
}

const SEVERITY: Record<string, number> = { hidden: 3, needs_attention: 2, human_reviewed: 1, disputed: 2, auto_verified: 0, ai_interpreted: 0 };

/** Badge of a row from the fields that own its columns. */
export function rowBadge(fields: FieldVerification[], primary: string[]): Badge {
  if (fields.length === 0) return "needs_attention";
  const key = fields.filter((f) => primary.includes(f.naturalKey));
  if (key.length > 0 && key.every((f) => f.badge === "hidden")) return "hidden";
  const shown = fields.filter((f) => f.badge !== "hidden");
  if (shown.length === 0) return "hidden";
  const worst = shown.reduce((a, f) => (SEVERITY[f.badge]! > SEVERITY[a]! ? f.badge : a), "auto_verified" as Badge);
  if (worst === "auto_verified" && shown.every((f) => f.badge === "ai_interpreted")) return "ai_interpreted";
  return worst;
}

export interface PlanInput {
  data: FullData & { calls?: { pass: string; studyLabel: string | null }[] };
  analysis: PaperAnalysis;
  mapping: ExtractionMapping;
}

export function buildPlan({ data, analysis, mapping }: PlanInput): PublishPlan {
  const byKey = new Map(analysis.fields.map((f) => [f.naturalKey, f]));
  const mapped = new Map(mapping.constructs.filter((c) => c.status === "mapped").map((c) => [canonicalKey(c.label), c.id!]));
  const theoryMapped = new Map(mapping.theories.filter((t) => t.status === "mapped").map((t) => [canonicalKey(t.label), t.id!]));
  const constructId = (label: string) => mapped.get(canonicalKey(label.trim().replace(/\s+/g, " "))) ?? null;
  const group = (o: object) => analysis.refs.get(o) ?? "";
  const rows: PlannedRow[] = [];

  /** Builds one row; `cols` maps column → [field natural key | null, value]. */
  function row(spec: {
    table: RowTable;
    key: string;
    studyKey: string | null;
    primary: string[];
    cols: Record<string, [string | null, unknown]>;
    direct?: Record<string, unknown>;
    evidence?: Record<string, EvidenceLike | null>;
    required?: string[];
    source: PlannedRow["source"];
    raw: unknown;
  }): PlannedRow {
    const owned = [...new Set(Object.values(spec.cols).map(([k]) => k).filter((k): k is string => k !== null))].map((k) => byKey.get(k)).filter((f): f is FieldVerification => !!f);
    const badge = rowBadge(owned, spec.primary);
    const visible = badge !== "hidden";
    const columns: Record<string, unknown> = { ...spec.direct };
    const fieldColumns: Record<string, string> = {};
    for (const [column, [fieldKey, value]] of Object.entries(spec.cols)) {
      const field = fieldKey ? byKey.get(fieldKey) : undefined;
      if (fieldKey && field) fieldColumns[column] = fieldKey;
      const hiddenValue = visible && field?.badge === "hidden" && !spec.required?.includes(column);
      // List columns are `not null default '{}'`: a hidden list is empty, not NULL.
      columns[column] = hiddenValue ? (Array.isArray(value) ? [] : null) : value;
    }
    sanitize(columns);
    return { table: spec.table, naturalKey: spec.key, studyKey: spec.studyKey, columns, fieldColumns, evidence: spec.evidence ?? {}, badge, source: spec.source, raw: spec.raw };
  }

  // ── Theories and discussion statements ─────────────────────────────────────
  for (const t of data.structure.theories) {
    const k = group(t);
    rows.push(
      row({
        table: "paper_theories",
        key: k,
        studyKey: null,
        primary: [`${k}:role`],
        cols: { application_role: [`${k}:role`, t.application_role], theory_name_original: [k, t.theory_name_original] },
        direct: { theory_id: theoryMapped.get(canonicalKey(t.theory_name_original)) ?? null },
        required: ["theory_name_original", "application_role"],
        evidence: { evidence_id: t.evidence },
        source: { pass: "paper_structure", studyLabel: null },
        raw: t,
      }),
    );
  }
  const d = data.discussion;
  for (const [kind, list] of [
    ["theoretical_contribution", d.theoretical_contributions],
    ["practical_implication", d.practical_implications],
    ["limitation", d.limitations],
    ["future_direction", d.future_directions],
  ] as const) {
    list.forEach((statement, i) => {
      const k = group(statement);
      rows.push(
        row({
          table: "paper_statements",
          key: k,
          studyKey: null,
          primary: [k],
          cols: {},
          direct: { kind, position: i },
          evidence: { evidence_id: statement },
          source: { pass: "paper_discussion", studyLabel: null },
          raw: statement,
        }),
      );
      // A statement has one field (its quote): the row takes its badge directly.
      const field = byKey.get(k);
      if (field) rows[rows.length - 1]!.badge = field.badge;
    });
  }

  // ── Studies ────────────────────────────────────────────────────────────────
  data.studies.forEach((study, index) => {
    const st = group(study);
    const outline = data.structure.studies.find((o) => o.study_label === study.study_label);
    const f = (name: string): string => `${st}:${name}`;
    const de = study.design;
    const sa = study.sample;
    const bi = study.bias_control;
    rows.push(
      row({
        table: "studies",
        key: st,
        studyKey: null,
        primary: [f("research_design")],
        cols: {
          research_design: [f("research_design"), outline?.research_design ?? null],
          time_design: [f("time_design"), de.time_design],
          experimental_design: [f("experimental_design"), de.experimental_design],
          manipulation_check: [f("manipulation_check"), de.manipulation_check],
          attention_check: [f("attention_check"), de.attention_check],
          exclusion_rate: [f("exclusion_rate"), de.exclusion_rate],
          preregistered: [f("preregistered"), de.preregistered],
          open_data: [f("open_data"), de.open_data],
          analysis_method: [f("analysis_method"), de.analysis_method],
          software: [f("software"), de.software],
          cmb_procedural: [f("cmb_procedural"), bi.cmb_procedural],
          cmb_statistical: [f("cmb_statistical"), bi.cmb_statistical],
          cmb_weak_only: [f("cmb_weak_only"), bi.cmb_weak_only],
          endogeneity_method: [f("endogeneity_method"), bi.endogeneity_method],
        },
        direct: { study_label: study.study_label, position: index },
        required: ["study_label"],
        evidence: { design_evidence_id: outline?.design_evidence ?? null, method_evidence_id: de.evidence, bias_evidence_id: bi.evidence },
        source: { pass: "study_design_sample_bias", studyLabel: study.study_label },
        raw: { outline, design: de, bias_control: bi },
      }),
    );

    rows.push(
      row({
        table: "samples",
        key: `${st}:sample`,
        studyKey: st,
        primary: [f("n")],
        cols: {
          n: [f("n"), sa.n],
          unit_of_analysis: [f("unit_of_analysis"), sa.unit_of_analysis],
          sample_type: [f("sample_type"), sa.sample_type],
          country_iso: [f("country_iso"), sa.country_iso],
          industry_code: [f("industry_code"), sa.industry_code],
          market_type: [f("market_type"), sa.market_type],
          data_collection_period: [f("data_collection_period"), sa.data_collection_period],
        },
        evidence: { n_evidence_id: sa.n_evidence, evidence_id: sa.evidence },
        source: { pass: "study_design_sample_bias", studyLabel: study.study_label },
        raw: sa,
      }),
    );

    for (const m of study.measurements) {
      const k = group(m);
      rows.push(
        row({
          table: "measurements",
          key: k,
          studyKey: st,
          primary: [`${k}:label`],
          cols: {
            construct_label_original: [`${k}:label`, m.construct_label_original],
            definition: [`${k}:definition`, m.definition],
            scale_source: [`${k}:scale_source`, m.scale_source],
            n_items: [`${k}:n_items`, m.n_items],
            scale_type: [`${k}:scale_type`, m.scale_type],
            construct_order: [`${k}:order`, m.order],
            alpha: [`${k}:alpha`, m.alpha],
            cr: [`${k}:CR`, m.CR],
            ave: [`${k}:AVE`, m.AVE],
            htmt_max: [`${k}:HTMT_max`, m.HTMT_max],
          },
          direct: { adapted: m.adapted, items: m.items, parent_label_original: m.parent_label_original, canonical_construct_id: constructId(m.construct_label_original) },
          required: ["construct_label_original"],
          evidence: { definition_evidence_id: m.definition_evidence, reliability_evidence_id: m.reliability_evidence },
          source: { pass: "study_measurements", studyLabel: study.study_label },
          raw: m,
        }),
      );
    }

    for (const p of study.paths) rows.push(pathRow(p));

    for (const mx of study.correlation_matrices) {
      const k = group(mx);
      const fields = analysis.fields.filter((x) => x.group === k);
      const rField = (i: number, j: number) => byKey.get(`${k}:r:${i},${j}`);
      const planned = row({
        table: "correlation_matrices",
        key: k,
        studyKey: st,
        primary: mx.cells.map((c) => `${k}:r:${c.i},${c.j}`),
        cols: {
          n: [`${k}:n`, mx.n],
          diagonal_type: [`${k}:diagonal_type`, mx.diagonal_type],
          correlation_type: [`${k}:correlation_type`, mx.correlation_type],
        },
        direct: {
          source_table: mx.source_table,
          variables: mx.variables.map((name) => ({ name, construct_id: constructId(name) })),
          internal_check: {},
        },
        required: ["diagonal_type", "correlation_type"],
        evidence: { evidence_id: mx.evidence },
        source: { pass: "study_tables", studyLabel: study.study_label },
        raw: mx,
      });
      // The matrix row is judged by all of its fields, cells and statistics included.
      planned.badge = rowBadge(fields, mx.cells.map((c) => `${k}:r:${c.i},${c.j}`));
      planned.cells = mx.cells.filter((c) => c.i > c.j && c.r >= -1 && c.r <= 1 && rField(c.i, c.j)?.badge !== "hidden").map((c) => ({ i: c.i, j: c.j, r: c.r }));
      planned.descriptives = mx.descriptives.map((x, index) => {
        const v = (name: "mean" | "sd" | "alpha" | "cr" | "ave") => {
          const field = byKey.get(`${k}:desc:${slug(x.variable)}:${name}`);
          return field?.badge === "hidden" ? null : x[name];
        };
        const sd = v("sd");
        return { variable_index: index, variable: x.variable, mean: v("mean"), sd: sd !== null && sd < 0 ? null : sd, alpha: v("alpha"), cr: v("cr"), ave: v("ave") };
      });
      rows.push(planned);
    }

    for (const c of study.condition_cells) {
      const k = group(c);
      rows.push(
        row({
          table: "condition_cells",
          key: k,
          studyKey: st,
          primary: [`${k}:mean`, `${k}:sd`, `${k}:n`],
          cols: {
            mean: [`${k}:mean`, c.mean],
            sd: [`${k}:sd`, c.sd],
            se: [`${k}:se`, c.se],
            n: [`${k}:n`, c.n],
            test_stat_type: [`${k}:test_stat`, c.test_stat?.type ?? null],
            test_stat_value: [`${k}:test_stat`, c.test_stat?.value ?? null],
            effect_size_reported: [`${k}:effect_size_reported`, c.effect_size_reported],
            effect_size_type: [`${k}:effect_size_type`, c.effect_size_type],
          },
          direct: {
            factors: c.factors,
            condition_label: c.condition_label,
            dv_label_original: c.dv_label_original,
            dv_construct_id: constructId(c.dv_label_original),
            df: c.df,
            p_reported_as: c.p_reported_as,
            source_table: c.evidence.table_or_figure ?? null,
          },
          required: ["condition_label", "dv_label_original"],
          evidence: { evidence_id: c.evidence },
          source: { pass: "study_tables", studyLabel: study.study_label },
          raw: c,
        }),
      );
    }

    function pathRow(p: PathResult): PlannedRow {
      const k = group(p);
      const stat: StatResult | undefined = analysis.stats.find((s) => s.group === k);
      const slopes = p.simple_slopes.filter((s) => byKey.get(`${k}:slope:${slopeKey(s.level)}`)?.badge !== "hidden");
      const primary = [`${k}:estimate`, `${k}:indirect_effect`, `${k}:p`].filter((x) => byKey.has(x));
      const planned = row({
        table: "path_results",
        key: k,
        studyKey: st,
        primary,
        cols: {
          hypothesis_code: [`${k}:hypothesis_code`, p.hypothesis_code],
          effect_type: [`${k}:effect_type`, p.effect_type],
          estimate_type: [`${k}:estimate_type`, p.estimate_type],
          estimate: [`${k}:estimate`, p.estimate],
          se: [`${k}:se`, p.se],
          ci_low: [`${k}:ci_low`, p.ci_low],
          ci_high: [`${k}:ci_high`, p.ci_high],
          t_or_z: [`${k}:t_or_z`, p.t_or_z],
          r2_dv: [`${k}:r2_dv`, p.r2_dv],
          f2: [`${k}:f2`, p.f2],
          status: [`${k}:status`, p.status],
          indirect_effect: [`${k}:indirect_effect`, p.indirect_effect],
          boot_ci_low: [`${k}:boot_ci`, p.boot_ci?.[0] ?? null],
          boot_ci_high: [`${k}:boot_ci`, p.boot_ci?.[1] ?? null],
          mediation_type: [`${k}:mediation_type`, p.mediation_type],
          interaction_type: [`${k}:interaction_type`, p.interaction_type],
          index_moderated_mediation: [`${k}:index_moderated_mediation`, p.index_moderated_mediation],
        },
        direct: {
          iv_label_original: p.iv_label_original,
          dv_label_original: p.dv_label_original,
          iv_construct_id: constructId(p.iv_label_original),
          dv_construct_id: constructId(p.dv_label_original),
          mediator_labels: p.mediator_labels,
          moderator_labels: p.moderator_labels,
          mediator_ids: p.mediator_labels.map(constructId).filter((x): x is string => x !== null),
          moderator_ids: p.moderator_labels.map(constructId).filter((x): x is string => x !== null),
          ci_method: p.ci_method,
          p_value: p.p_value,
          p_reported_as: p.p_reported_as,
          hypothesized_direction: p.hypothesized_direction,
          observed_sign: p.observed_sign,
          significant: p.significant,
          model_covariates: p.model_covariates,
          simple_slopes: slopes,
          stat_consistency: stat?.status ?? "not_checked",
          recomputed_value: stat?.recomputed ?? null,
          error_source: stat?.errorSource ?? null,
        },
        required: ["effect_type", "status"],
        evidence: { evidence_id: p.evidence },
        source: { pass: "study_paths", studyLabel: study.study_label },
        raw: p,
      });
      if (primary.length === 0) planned.badge = "needs_attention";
      return planned;
    }
  });

  const completeness = analysis.completeness;
  return {
    paper: {
      paper_type: data.structure.paper_type,
      hypothesis_codes: data.structure.hypothesis_codes,
      contribution_originality: data.discussion.contribution_type.originality,
      contribution_utility: data.discussion.contribution_type.utility,
      gap_type: data.discussion.gap_type,
      problematization_hint: data.discussion.problematization_hint,
      completeness_status: completeness,
      missing_items: analysis.missing.map((m) => (m.kind === "hypothesis_not_listed" || m.kind === "hypothesis_without_path" ? `hypothesis:${m.item}` : `table:${m.item}`)),
    },
    paperEvidence: { paper_type_evidence_id: data.structure.paper_type_evidence, gap_evidence_id: data.discussion.gap_evidence },
    tables: data.structure.tables.map((t) => ({ table_label: t.table_label, pdf_page_index: t.pdf_page - 1, kind: t.kind, study_label: t.study_label })),
    rows,
  };
}

/** Same key the verifier uses for a simple slope ("+1 SD" and "-1 SD" must differ). */
function slopeKey(level: string): string {
  return slug(level.replace(/^\s*\+/, "plus ").replace(/^\s*[-−]/, "minus "));
}

/**
 * Values the database refuses (a probability above 1, a negative SD, a reversed interval). They were
 * already flagged by the checks (⚠); the column stays empty rather than failing the whole publish.
 * The value remains in the raw answer and in extracted_fields.
 */
export function sanitize(columns: Record<string, unknown>): void {
  const num = (name: string) => (typeof columns[name] === "number" ? (columns[name] as number) : null);
  const clear = (...names: string[]) => names.forEach((n) => n in columns && (columns[n] = null));
  const inRange = (name: string, low: number, high: number) => {
    const v = num(name);
    if (v !== null && (v < low || v > high)) clear(name);
  };
  inRange("p_value", 0, 1);
  inRange("exclusion_rate", 0, 1);
  for (const name of ["sd", "se"]) {
    const v = num(name);
    if (v !== null && v < 0) clear(name);
  }
  for (const [low, high] of [["ci_low", "ci_high"], ["boot_ci_low", "boot_ci_high"]] as const) {
    const a = num(low);
    const b = num(high);
    if (a !== null && b !== null && a > b) clear(low, high);
  }
}
