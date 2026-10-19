/**
 * Layer C (Mục 6.4, step 1.5): checks between values of the same paper, without AI. A violation
 * adds a ⚠ check (never hides) to the fields involved, with the reason.
 *   - n of the method = n of its correlation matrices;
 *   - n of the experimental cells add up to n of the study;
 *   - a standardised beta with one predictor ≈ the correlation of the two variables;
 *   - alpha / CR / AVE of the measurement table = those of the descriptives (same construct);
 *   - the same cell (i, j) of a correlation matrix is not given twice;
 *   - statcheck: p from t / F / z, t from estimate / SE, SE from the CI (statcheck.ts).
 */
import type { PathResult, StudyDetail } from "@research-data/schema";
import { badgeFor, type CheckResult, type FieldVerification } from "./checks.js";
import { checkReportedP, checkSeFromCi, checkTFromEstimate, type StatStatus, type TestStat } from "./statcheck.js";
import type { FullData, GroupRefs } from "./verify-full.js";

/** A check to attach to the fields of `group` (all of them, or only those named in `fieldNames`). */
export interface Finding {
  group: string;
  fieldNames?: string[];
  check: CheckResult;
}

/** Result of a recomputed statistic, one per tested p (stored in path_results / condition_cells). */
export interface StatResult {
  group: string;
  stat: string;
  reported: string;
  status: StatStatus;
  recomputed: number | null;
  /** original_paper when the printed numbers were found in the PDF and still disagree. */
  errorSource: "extraction" | "original_paper" | null;
  detail: string;
}

const attention = (name: string, passed: boolean, detail: string): CheckResult => ({ name, passed, severity: "attention", detail });

/** Variable names compare equal ignoring case, spacing and punctuation. */
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export interface CrossCheckResult {
  findings: Finding[];
  stats: StatResult[];
}

export function crossCheck(data: FullData, refs: GroupRefs, rows: FieldVerification[]): CrossCheckResult {
  const findings: Finding[] = [];
  const stats: StatResult[] = [];
  const group = (o: object) => refs.get(o) ?? "";

  /** Were the printed numbers of this group found in the PDF? (decides who is wrong when a check fails) */
  const numbersFound = (g: string, names: string[]) => {
    const own = rows.filter((r) => r.group === g && names.includes(r.fieldName));
    return own.length > 0 && own.every((r) => r.badge !== "hidden" && r.checks.filter((c) => c.name.endsWith("_in_pdf")).every((c) => c.passed));
  };

  for (const study of data.studies) {
    const sg = group(study);
    const n = study.sample.n;

    // n of the method vs n of each correlation matrix.
    for (const m of study.correlation_matrices) {
      if (n !== null && m.n !== null && m.n !== n) {
        const detail = `Cỡ mẫu của ${m.source_table} (${m.n}) khác cỡ mẫu của ${study.study_label} (${n})`;
        findings.push({ group: group(m), fieldNames: ["n"], check: attention("n_consistent", false, detail) });
        findings.push({ group: sg, fieldNames: ["n"], check: attention("n_consistent", false, detail) });
      }
      const seen = new Set<string>();
      for (const c of m.cells) {
        const id = `${c.i},${c.j}`;
        if (seen.has(id)) findings.push({ group: group(m), fieldNames: ["r"], check: attention("cell_duplicate", false, `Ô (${c.i}, ${c.j}) của ${m.source_table} xuất hiện nhiều lần`) });
        seen.add(id);
      }
    }

    // Experimental cells add up to the study n (per dependent variable).
    const byDv = new Map<string, StudyDetail["condition_cells"]>();
    for (const c of study.condition_cells) byDv.set(c.dv_label_original, [...(byDv.get(c.dv_label_original) ?? []), c]);
    for (const [dv, cells] of byDv) {
      if (n === null || cells.some((c) => c.n === null)) continue;
      const total = cells.reduce((sum, c) => sum + c.n!, 0);
      if (total !== n) {
        const detail = `Tổng n các ô điều kiện của "${dv}" là ${total}, khác cỡ mẫu ${n} của ${study.study_label}`;
        for (const c of cells) findings.push({ group: group(c), fieldNames: ["n"], check: attention("cells_sum_to_n", false, detail) });
        findings.push({ group: sg, fieldNames: ["n"], check: attention("cells_sum_to_n", false, detail) });
      }
    }

    // Standardised beta of a DV with a single predictor ≈ its correlation with that predictor.
    for (const p of study.paths) {
      if (p.effect_type !== "direct" || p.estimate_type !== "std_beta" || p.estimate === null) continue;
      const incoming = study.paths.filter((o) => o.effect_type === "direct" && norm(o.dv_label_original) === norm(p.dv_label_original));
      if (incoming.length !== 1) continue;
      for (const m of study.correlation_matrices) {
        const i = m.variables.findIndex((v) => norm(v) === norm(p.iv_label_original));
        const j = m.variables.findIndex((v) => norm(v) === norm(p.dv_label_original));
        const cell = m.cells.find((c) => (c.i === i && c.j === j) || (c.i === j && c.j === i));
        if (i < 0 || j < 0 || !cell) continue;
        const ok = Math.abs(p.estimate - cell.r) <= 0.05;
        const detail = ok
          ? `β = ${p.estimate} khớp r = ${cell.r} (${m.source_table}; ${p.dv_label_original} chỉ có một biến dự báo)`
          : `β = ${p.estimate} lệch r = ${cell.r} trong ${m.source_table} dù ${p.dv_label_original} chỉ có một biến dự báo`;
        findings.push({ group: group(p), fieldNames: ["estimate"], check: attention("beta_matches_r", ok, detail) });
        if (!ok) findings.push({ group: group(m), fieldNames: ["r"], check: attention("beta_matches_r", false, detail) });
        break;
      }
    }

    // Reliability of the measurement table vs the descriptives of the correlation table.
    for (const meas of study.measurements) {
      for (const m of study.correlation_matrices) {
        const d = m.descriptives.find((x) => norm(x.variable) === norm(meas.construct_label_original));
        if (!d) continue;
        for (const [name, a, b] of [["alpha", meas.alpha, d.alpha], ["cr", meas.CR, d.cr], ["ave", meas.AVE, d.ave]] as const) {
          if (a === null || b === null || Math.abs(a - b) <= 0.005) continue;
          const detail = `${name.toUpperCase()} của "${meas.construct_label_original}" là ${a} ở bảng đo lường nhưng ${b} ở ${m.source_table}`;
          findings.push({ group: group(meas), fieldNames: [name === "alpha" ? "alpha" : name === "cr" ? "CR" : "AVE"], check: attention("reliability_consistent", false, detail) });
          findings.push({ group: group(m), fieldNames: [name], check: attention("reliability_consistent", false, detail) });
        }
      }
    }

    // Statcheck on paths (t / z with the study n as df, estimate / SE, SE from CI).
    for (const p of study.paths) stats.push(...pathStats(p, group(p), n, findings, numbersFound));

    // Statcheck on experimental cells: the same test is repeated on every cell of an experiment.
    const done = new Set<string>();
    for (const c of study.condition_cells) {
      if (!c.test_stat || !c.p_reported_as) continue;
      const stat: TestStat = { type: c.test_stat.type, value: c.test_stat.value, df: c.df };
      const id = `${stat.type}|${stat.value}|${stat.df.join(",")}|${c.p_reported_as}`;
      if (done.has(id)) continue;
      done.add(id);
      const g = group(c);
      const r = checkReportedP(stat, c.p_reported_as);
      const errorSource = r.status === "consistent" || r.status === "not_checked" ? null : numbersFound(g, ["test_stat"]) ? "original_paper" : "extraction";
      stats.push({ group: g, stat: `${stat.type}(${stat.df.join(", ")}) = ${stat.value}`, reported: c.p_reported_as, status: r.status, recomputed: r.recomputed, errorSource, detail: r.detail });
      if (r.status !== "not_checked") findings.push({ group: g, fieldNames: ["test_stat"], check: statCheck(r.status, r.detail, errorSource) });
    }
  }
  return { findings, stats };
}

function statCheck(status: StatStatus, detail: string, errorSource: StatResult["errorSource"]): CheckResult {
  const note = errorSource === "original_paper" ? " (số liệu khớp PDF, có thể là lỗi của bài gốc)" : errorSource === "extraction" ? " (kiểm tra lại giá trị đã trích)" : "";
  return attention("stat_recomputed", status === "consistent", `${detail}${note}`);
}

function pathStats(
  p: PathResult,
  g: string,
  n: number | null,
  findings: Finding[],
  numbersFound: (g: string, names: string[]) => boolean,
): StatResult[] {
  const out: StatResult[] = [];
  if (p.t_or_z !== null && p.p_reported_as) {
    // PLS and SEM print t from bootstrapping; with the study n as df it is the usual t distribution.
    const stat: TestStat = n && n > 2 ? { type: "t", value: p.t_or_z, df: [n - 1] } : { type: "z", value: p.t_or_z, df: [] };
    const r = checkReportedP(stat, p.p_reported_as);
    const errorSource = r.status === "consistent" || r.status === "not_checked" ? null : numbersFound(g, ["t_or_z"]) ? "original_paper" : "extraction";
    out.push({ group: g, stat: `${stat.type} = ${p.t_or_z}`, reported: p.p_reported_as, status: r.status, recomputed: r.recomputed, errorSource, detail: r.detail });
    if (r.status !== "not_checked") findings.push({ group: g, fieldNames: ["t_or_z"], check: statCheck(r.status, r.detail, errorSource) });
  }
  if (p.estimate !== null && p.se !== null && p.se > 0 && p.t_or_z !== null) {
    const r = checkTFromEstimate(p.estimate, p.se, p.t_or_z);
    findings.push({ group: g, fieldNames: ["t_or_z", "se"], check: attention("t_from_estimate_se", r.ok, r.detail) });
  }
  if (p.se !== null && p.ci_low !== null && p.ci_high !== null && p.ci_method !== "bootstrap") {
    const r = checkSeFromCi(p.ci_low, p.ci_high, p.se);
    findings.push({ group: g, fieldNames: ["se", "ci_low", "ci_high"], check: attention("se_from_ci", r.ok, r.detail) });
  }
  return out;
}

/** Adds the findings to the matching fields; a failed finding turns ✓ into ⚠ (hidden stays hidden). */
export function applyFindings(rows: FieldVerification[], findings: Finding[]): FieldVerification[] {
  return rows.map((row) => {
    const mine = findings.filter((f) => f.group === row.group && (!f.fieldNames || f.fieldNames.includes(row.fieldName)));
    if (mine.length === 0) return row;
    const checks = [...row.checks, ...mine.map((f) => f.check)];
    return { ...row, checks, badge: row.badge === "hidden" ? "hidden" : badgeFor(row.tier, checks) };
  });
}
