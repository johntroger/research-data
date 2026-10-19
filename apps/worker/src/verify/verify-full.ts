/**
 * Layer B (Mục 6.3) for the full extraction (step 1.4): every T1/T2 value is checked against the PDF
 * and gets a badge (Mục 6.5); T3 values get ◇ once their quote is found. One row per field, keyed by
 * a stable natural key (Mục 6.7), ready for `extracted_fields`.
 *
 * Rules, by kind of value:
 *   quote             found on the cited page (or ±1, exact / fuzzy ≥ 0.90), else hidden
 *   number            printed on the evidence page (or ±1), else hidden
 *   text as printed   (software, labels, period) word for word near the evidence, else ⚠
 *   category (T2)     its evidence quote must be found
 *   logic             p ∈ [0, 1], CI holds the estimate, sign matches, SD > 0…, else ⚠
 * Cross-checks between fields (Mục 6.4), recomputed statistics and completeness come in step 1.5.
 */
import type { PaperDiscussion, PaperStructure, PathResult, StudyDetail } from "@research-data/schema";
import type { PdfTextLayer } from "../pdf/text-layer.js";
import {
  type CheckResult,
  type EvidenceIn,
  field,
  type FieldVerification,
  logicCheck,
  numberCheck,
  pChecks,
  scannedPdf,
  slug,
  textCheck,
  withoutEvidence,
} from "./checks.js";

export interface FullData {
  structure: PaperStructure;
  discussion: PaperDiscussion;
  studies: StudyDetail[];
}

type Tier = FieldVerification["tier"];

const present = (v: unknown) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0);

/** Which group (natural-key prefix) each extracted object got, for the cross-checks of step 1.5. */
export type GroupRefs = Map<object, string>;

export function verifyFull(layer: PdfTextLayer, data: FullData, refs: GroupRefs = new Map()): FieldVerification[] {
  const out: FieldVerification[] = [];
  let group = "";
  const used = new Map<string, number>();
  /** Natural keys are unique: a repeated key (the same path in two models) gets "#2", "#3"… */
  const key = (k: string) => {
    const n = (used.get(k) ?? 0) + 1;
    used.set(k, n);
    return n === 1 ? k : `${k}#${n}`;
  };

  /** One field with its evidence; skipped when the value is null / empty. */
  const add = (
    naturalKey: string,
    fieldName: string,
    tier: Tier,
    value: unknown,
    evidence: EvidenceIn | null,
    checks: (page: number) => CheckResult[] = () => [],
  ) => {
    if (!present(value)) return;
    const row = evidence ? field(naturalKey, fieldName, tier, value, evidence, layer, checks) : withoutEvidence(naturalKey, fieldName, tier, value);
    out.push({ ...row, group });
  };
  const num = (name: string, v: number | null, severity: CheckResult["severity"] = "hide") => (page: number) =>
    v === null ? [] : [numberCheck(layer, name, v, page, severity)];
  const text = (name: string, v: string | null) => (page: number) => (v ? [textCheck(layer, name, v, page)] : []);

  // ── Paper: type, tables, theories, discussion ──────────────────────────────
  const s = data.structure;
  add("paper_type", "paper_type", "T2", s.paper_type, s.paper_type_evidence);
  for (const t of s.tables) {
    // The table label must be printed on its page ("Table 3" / "TABLE 3").
    add(key(`table:${slug(t.table_label)}`), "table", "T1", t, { pdf_page: t.pdf_page, quote: t.table_label });
  }
  for (const t of s.theories) {
    const k = key(`theory:${slug(t.theory_name_original)}`);
    add(k, "theory_name_original", "T1", t.theory_name_original, t.evidence, text("name_in_quote", t.theory_name_original));
    add(`${k}:role`, "application_role", "T3", t.application_role, t.evidence);
  }
  const d = data.discussion;
  const firstStatement = [...d.theoretical_contributions, ...d.practical_implications][0] ?? null;
  add("contribution_type", "contribution_type", "T3", d.contribution_type, firstStatement);
  for (const [kind, list] of [
    ["theoretical_contribution", d.theoretical_contributions],
    ["practical_implication", d.practical_implications],
    ["limitation", d.limitations],
    ["future_direction", d.future_directions],
  ] as const) {
    list.forEach((statement, i) => add(`${kind}:${i + 1}`, kind, "T3", statement.quote, statement));
  }
  if (d.gap_type) add("gap_type", "gap_type", "T3", d.gap_type, d.gap_evidence);

  // ── Studies ────────────────────────────────────────────────────────────────
  for (const study of data.studies) {
    const st = slug(study.study_label);
    group = st;
    refs.set(study, st);
    const outline = s.studies.find((o) => o.study_label === study.study_label);
    if (outline) add(`${st}:research_design`, "research_design", "T2", outline.research_design, outline.design_evidence);

    const de = study.design;
    const dEv = de.evidence;
    add(`${st}:time_design`, "time_design", "T2", de.time_design, dEv);
    add(`${st}:experimental_design`, "experimental_design", "T1", de.experimental_design, dEv);
    add(`${st}:manipulation_check`, "manipulation_check", "T2", de.manipulation_check, dEv);
    add(`${st}:attention_check`, "attention_check", "T2", de.attention_check, dEv);
    add(`${st}:exclusion_rate`, "exclusion_rate", "T1", de.exclusion_rate, dEv, () => [
      // Often computed from two printed counts rather than printed itself (codebook E).
      logicCheck("in_range", de.exclusion_rate! >= 0 && de.exclusion_rate! <= 1, "Tỷ lệ loại mẫu trong [0, 1]", "Tỷ lệ loại mẫu ngoài [0, 1]"),
      numberCheck(layer, "number_in_pdf", de.exclusion_rate!, dEv.pdf_page, "attention"),
    ]);
    add(`${st}:preregistered`, "preregistered", "T2", de.preregistered, dEv);
    add(`${st}:open_data`, "open_data", "T2", de.open_data, dEv);
    add(`${st}:analysis_method`, "analysis_method", "T2", de.analysis_method, dEv);
    add(`${st}:software`, "software", "T1", de.software, dEv, text("text_in_pdf", de.software));

    const sa = study.sample;
    add(`${st}:n`, "n", "T1", sa.n, sa.n_evidence, num("number_in_pdf", sa.n));
    add(`${st}:unit_of_analysis`, "unit_of_analysis", "T2", sa.unit_of_analysis, sa.evidence);
    add(`${st}:sample_type`, "sample_type", "T2", sa.sample_type, sa.evidence);
    add(`${st}:country_iso`, "country_iso", "T1", sa.country_iso, sa.evidence, () => [countryCheck(layer, sa.country_iso)]);
    add(`${st}:industry_code`, "industry_code", "T2", sa.industry_code, sa.evidence);
    add(`${st}:market_type`, "market_type", "T2", sa.market_type, sa.evidence);
    add(`${st}:data_collection_period`, "data_collection_period", "T1", sa.data_collection_period, sa.evidence, text("text_in_pdf", sa.data_collection_period));

    const b = study.bias_control;
    add(`${st}:cmb_procedural`, "cmb_procedural", "T2", b.cmb_procedural, b.evidence);
    add(`${st}:cmb_statistical`, "cmb_statistical", "T2", b.cmb_statistical, b.evidence);
    if (b.cmb_statistical.length) add(`${st}:cmb_weak_only`, "cmb_weak_only", "T2", b.cmb_weak_only, b.evidence);
    // "none_reported" states an absence: there is nothing in the paper to check it against.
    const endogeneity = b.endogeneity_method.filter((m) => m !== "none_reported");
    add(`${st}:endogeneity_method`, "endogeneity_method", "T2", endogeneity, b.evidence);

    for (const m of study.measurements) {
      const k = key(`${st}:m:${slug(m.construct_label_original)}`);
      group = k;
      refs.set(m, k);
      const rEv = m.reliability_evidence;
      add(`${k}:label`, "construct_label_original", "T1", m.construct_label_original, rEv ?? m.definition_evidence, text("text_in_pdf", m.construct_label_original));
      add(`${k}:definition`, "definition", "T1", m.definition, m.definition_evidence);
      add(`${k}:scale_source`, "scale_source", "T1", m.scale_source, rEv ?? m.definition_evidence);
      add(`${k}:n_items`, "n_items", "T1", m.n_items, rEv, num("number_in_pdf", m.n_items, "attention"));
      add(`${k}:scale_type`, "scale_type", "T2", m.scale_type, rEv ?? m.definition_evidence);
      add(`${k}:order`, "order", "T2", m.order, rEv ?? m.definition_evidence);
      for (const [name, v] of [["alpha", m.alpha], ["CR", m.CR], ["AVE", m.AVE], ["HTMT_max", m.HTMT_max]] as const) {
        add(`${k}:${name}`, name, "T1", v, rEv, (page) => [
          numberCheck(layer, "number_in_pdf", v!, page),
          ...(name === "HTMT_max" ? [] : [logicCheck("in_range", v! >= 0 && v! <= 1, `${name} trong [0, 1]`, `${name} = ${v} ngoài [0, 1]`)]),
        ]);
      }
    }

    for (const p of study.paths) addPath(p, st);

    for (const mx of study.correlation_matrices) {
      const k = key(`${st}:corr:${slug(mx.source_table)}`);
      group = k;
      refs.set(mx, k);
      const ev = mx.evidence;
      add(`${k}:n`, "n", "T1", mx.n, ev, num("number_in_pdf", mx.n));
      add(`${k}:diagonal_type`, "diagonal_type", "T2", mx.diagonal_type, ev);
      add(`${k}:correlation_type`, "correlation_type", "T2", mx.correlation_type, ev);
      for (const c of mx.cells) {
        const valid = c.i > c.j && c.i < mx.variables.length;
        add(`${k}:r:${c.i},${c.j}`, "r", "T1", c.r, ev, (page) => [
          numberCheck(layer, "number_in_pdf", c.r, page),
          logicCheck("in_range", c.r >= -1 && c.r <= 1, "r trong [−1, 1]", `r = ${c.r} ngoài [−1, 1]`),
          logicCheck("cell_index", valid, "Ô thuộc tam giác dưới của ma trận", `Ô (${c.i}, ${c.j}) không thuộc tam giác dưới của ${mx.variables.length} biến`),
        ]);
      }
      for (const dsc of mx.descriptives) {
        const dk = `${k}:desc:${slug(dsc.variable)}`;
        for (const [name, v] of [["mean", dsc.mean], ["sd", dsc.sd], ["alpha", dsc.alpha], ["cr", dsc.cr], ["ave", dsc.ave]] as const) {
          add(`${dk}:${name}`, name, "T1", v, ev, (page) => [
            numberCheck(layer, "number_in_pdf", v!, page),
            ...(name === "sd" ? [logicCheck("positive", v! > 0, "SD > 0", `SD = ${v} không dương`)] : []),
          ]);
        }
      }
    }

    for (const c of study.condition_cells) {
      const k = key(`${st}:cell:${slug(c.condition_label)}:${slug(c.dv_label_original)}`);
      group = k;
      refs.set(c, k);
      const ev = c.evidence;
      add(`${k}:mean`, "mean", "T1", c.mean, ev, num("number_in_pdf", c.mean));
      add(`${k}:sd`, "sd", "T1", c.sd, ev, (page) => [
        numberCheck(layer, "number_in_pdf", c.sd!, page),
        logicCheck("positive", c.sd! > 0, "SD > 0", `SD = ${c.sd} không dương`),
      ]);
      add(`${k}:se`, "se", "T1", c.se, ev, num("number_in_pdf", c.se));
      add(`${k}:n`, "n", "T1", c.n, ev, num("number_in_pdf", c.n));
      // The test and effect size are usually reported once in the text, not in the cell's row.
      add(`${k}:test_stat`, "test_stat", "T1", c.test_stat, ev, num("number_in_pdf", c.test_stat?.value ?? null, "attention"));
      add(`${k}:effect_size_reported`, "effect_size_reported", "T1", c.effect_size_reported, ev, num("number_in_pdf", c.effect_size_reported, "attention"));
      add(`${k}:effect_size_type`, "effect_size_type", "T2", c.effect_size_type, ev);
    }
  }

  function addPath(p: PathResult, st: string) {
    const k = key(`${st}:${slug(p.hypothesis_code ?? "-")}:${slug(p.iv_label_original)}->${slug(p.dv_label_original)}:${p.effect_type}`);
    group = k;
    refs.set(p, k);
    const ev = p.evidence;
    const numbers: [string, number | null][] = [
      ["estimate", p.estimate],
      ["se", p.se],
      ["ci_low", p.ci_low],
      ["ci_high", p.ci_high],
      ["t_or_z", p.t_or_z],
      ["r2_dv", p.r2_dv],
      ["f2", p.f2],
      ["indirect_effect", p.indirect_effect],
      ["index_moderated_mediation", p.index_moderated_mediation],
    ];
    for (const [name, v] of numbers) {
      const checkName = name === "estimate" || name === "indirect_effect" ? "estimate_in_pdf" : "number_in_pdf";
      add(`${k}:${name}`, name, "T1", v, ev, (page) => [
        numberCheck(layer, checkName, v!, page),
        ...(name === "estimate" ? pathLogic(p) : []),
        // When the paper prints p, it belongs with the estimate it qualifies.
        ...(name === "estimate" && p.p_reported_as ? [numberCheck(layer, "p_in_pdf", p.p_reported_as, page)] : []),
      ]);
    }
    if (p.boot_ci) {
      const [low, high] = p.boot_ci;
      add(`${k}:boot_ci`, "boot_ci", "T1", p.boot_ci, ev, (page) => [
        numberCheck(layer, "number_in_pdf", low, page),
        numberCheck(layer, "number_in_pdf", high, page),
        logicCheck("ci_order", low <= high, "Cận dưới ≤ cận trên", `Khoảng [${low}, ${high}] bị đảo`),
        ...(p.indirect_effect !== null
          ? [logicCheck("ci_contains", low <= p.indirect_effect && p.indirect_effect <= high, "Khoảng tin cậy chứa hiệu ứng gián tiếp", `Hiệu ứng gián tiếp ${p.indirect_effect} nằm ngoài [${low}, ${high}]`)]
          : []),
      ]);
    }
    p.simple_slopes.forEach((slope) =>
      // "+1 SD" and "−1 SD" must not share a key, so the sign is spelled out before slugging.
      add(key(`${k}:slope:${slug(slope.level.replace(/^\s*\+/, "plus ").replace(/^\s*[-−]/, "minus "))}`), "simple_slope", "T1", slope, ev, (page) => [
        numberCheck(layer, "estimate_in_pdf", slope.estimate, page),
        ...(slope.p_reported_as ? [numberCheck(layer, "p_in_pdf", slope.p_reported_as, page)] : []),
      ]),
    );
    // p alone (no estimate printed, e.g. an interaction reported as F and p).
    if (p.estimate === null && p.p_reported_as) {
      add(`${k}:p`, "p_reported_as", "T1", p.p_reported_as, ev, (page) => [numberCheck(layer, "p_in_pdf", p.p_reported_as!, page), ...pChecks(p.p_reported_as, p.status)]);
    }
    add(`${k}:hypothesis_code`, "hypothesis_code", "T1", p.hypothesis_code, ev, text("text_in_pdf", p.hypothesis_code));
    add(`${k}:status`, "status", "T2", p.status === "not_hypothesized" ? null : p.status, ev, () => pChecks(p.p_reported_as, p.status));
    add(`${k}:effect_type`, "effect_type", "T2", p.effect_type, ev);
    add(`${k}:estimate_type`, "estimate_type", "T2", p.estimate_type, ev);
    add(`${k}:mediation_type`, "mediation_type", "T2", p.mediation_type, ev);
    add(`${k}:interaction_type`, "interaction_type", "T2", p.interaction_type, ev);
  }

  return layer.needsOcr ? scannedPdf(out) : out;
}

/** Logic rules for one tested path (Mục 6.3): CI holds the estimate, the sign matches, p is consistent. */
function pathLogic(p: PathResult): CheckResult[] {
  const checks: CheckResult[] = [];
  if (p.ci_low !== null && p.ci_high !== null && p.estimate !== null) {
    checks.push(logicCheck("ci_contains", p.ci_low <= p.estimate && p.estimate <= p.ci_high, "Khoảng tin cậy chứa hệ số", `Hệ số ${p.estimate} nằm ngoài [${p.ci_low}, ${p.ci_high}]`));
  }
  if (p.observed_sign && p.estimate !== null && p.estimate !== 0) {
    const sign = p.estimate > 0 ? "positive" : "negative";
    checks.push(logicCheck("sign_consistent", sign === p.observed_sign, "Dấu quan sát khớp dấu hệ số", `observed_sign = ${p.observed_sign} nhưng hệ số ${p.estimate}`));
  }
  if (p.p_value !== null) checks.push(logicCheck("p_valid", p.p_value >= 0 && p.p_value <= 1, "p trong [0, 1]", `p = ${p.p_value} ngoài [0, 1]`));
  checks.push(...pChecks(p.p_reported_as, p.status));
  return checks;
}

/** Each country code must name a country mentioned somewhere in the paper (English name, e.g. "Vietnam"). */
function countryCheck(layer: PdfTextLayer, codes: string[]): CheckResult {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const all = layer.pages.map((p) => p.text).join("\n").toLowerCase();
  const missing = codes.filter((c) => {
    const name = names.of(c);
    return !name || name === c || !all.includes(name.toLowerCase());
  });
  return logicCheck(
    "country_in_pdf",
    missing.length === 0,
    `Tên quốc gia (${codes.map((c) => names.of(c)).join(", ")}) có trong bài`,
    `Không thấy tên quốc gia của ${missing.join(", ")} trong bài`,
  );
}
