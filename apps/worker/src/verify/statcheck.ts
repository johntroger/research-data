/**
 * Recomputes the reported statistics (step 1.5, statcheck-style, Nuijten et al. 2016; Mục 6.3):
 *   p from t / F / z and df;  t from estimate and SE;  SE from a normal CI.
 * A reported p is consistent when the recomputed p, over the rounding of the printed test
 * statistic, can round to it (or satisfy its "<" / ">"). A mismatch that flips the conclusion at
 * α = .05 is a decision error. When the values were found in the PDF and still disagree, the paper
 * itself may be wrong ("có thể là lỗi của bài gốc").
 */
import { fUpperTailP, tTwoTailedP, zTwoTailedP } from "./distributions.js";
import { parsePValue } from "./number.js";

export type StatStatus = "consistent" | "inconsistent" | "decision_error" | "not_checked";

export interface PCheck {
  status: StatStatus;
  /** p recomputed from the printed statistic (null when not computable). */
  recomputed: number | null;
  detail: string;
}

export interface TestStat {
  type: "t" | "F" | "z";
  value: number;
  /** [df] for t, [df1, df2] for F, [] for z. */
  df: number[];
}

const ALPHA = 0.05;

/** Decimals as printed; a JS number lost its trailing zeros, so at least two are assumed. */
function halfUnit(value: number): number {
  const text = String(Math.abs(value));
  const decimals = Math.max(2, text.includes(".") ? text.split(".")[1]!.length : 0);
  return 0.5 * 10 ** -decimals;
}

function pOf(stat: TestStat, value: number): number | null {
  const v = Math.abs(value);
  switch (stat.type) {
    case "t":
      return stat.df.length === 1 && stat.df[0]! > 0 ? tTwoTailedP(v, stat.df[0]!) : null;
    case "F":
      return stat.df.length === 2 && stat.df[0]! > 0 && stat.df[1]! > 0 ? fUpperTailP(v, stat.df[0]!, stat.df[1]!) : null;
    case "z":
      return zTwoTailedP(v);
  }
}

/** p over the rounding interval of the printed statistic: [lowest, highest]. */
export function pRange(stat: TestStat): { point: number; low: number; high: number } | null {
  const point = pOf(stat, stat.value);
  const low = pOf(stat, Math.abs(stat.value) + halfUnit(stat.value));
  const high = pOf(stat, Math.max(0, Math.abs(stat.value) - halfUnit(stat.value)));
  return point === null || low === null || high === null ? null : { point, low, high };
}

const fmt = (p: number) => (p < 0.001 ? p.toExponential(1) : p.toFixed(4));

/** Parses what the paper printed for p; "n.s." counts as "> .05". */
function parseReportedP(reported: string): { operator: "<" | ">" | "=" | "≤" | "≥"; value: number; decimals: number } | null {
  if (/^\s*n\.?\s?s\.?\s*$/i.test(reported)) return { operator: ">", value: ALPHA, decimals: 2 };
  const parsed = parsePValue(reported);
  if (!parsed) return null;
  const digits = /\.(\d+)\s*$/.exec(reported)?.[1] ?? "";
  return { ...parsed, decimals: Math.max(digits.length, 1) };
}

/** Is the reported p consistent with the printed test statistic? */
export function checkReportedP(stat: TestStat, reported: string): PCheck {
  const p = parseReportedP(reported);
  const range = pRange(stat);
  if (!p || !range) return { status: "not_checked", recomputed: range?.point ?? null, detail: "Không đủ dữ liệu để tính lại p" };

  const half = 0.5 * 10 ** -p.decimals;
  const eps = 1e-12;
  const consistent = {
    "=": range.high >= p.value - half - eps && range.low <= p.value + half + eps,
    "<": range.low < p.value + eps,
    "≤": range.low <= p.value + eps,
    ">": range.high > p.value - eps,
    "≥": range.high >= p.value - eps,
  }[p.operator];

  const label = `${stat.type}${stat.df.length ? `(${stat.df.join(", ")})` : ""} = ${stat.value}`;
  if (consistent) return { status: "consistent", recomputed: range.point, detail: `${label} cho p ≈ ${fmt(range.point)}, khớp "${reported}"` };

  // Conclusion at α = .05 as printed vs as recomputed.
  const reportedSignificant = p.operator === "<" || p.operator === "≤" || p.operator === "=" ? p.value <= ALPHA : p.value >= ALPHA ? false : null;
  const computedSignificant = range.point < ALPHA;
  const flipped = reportedSignificant !== null && reportedSignificant !== computedSignificant;
  return {
    status: flipped ? "decision_error" : "inconsistent",
    recomputed: range.point,
    detail: `${label} cho p ≈ ${fmt(range.point)}, không khớp "${reported}"${flipped ? " và đảo kết luận ở mức .05" : ""}`,
  };
}

/** t implied by estimate / SE against the printed t: within rounding and a 5% slack for rounded inputs. */
export function checkTFromEstimate(estimate: number, se: number, t: number): { ok: boolean; implied: number; detail: string } {
  const implied = estimate / se;
  const ok = Math.abs(implied - t) <= Math.max(0.05 * Math.abs(t), 0.05);
  return { ok, implied, detail: `estimate / SE = ${estimate} / ${se} = ${implied.toFixed(2)}, bài in t = ${t}` };
}

/** SE implied by a symmetric 95% CI against the printed SE. */
export function checkSeFromCi(low: number, high: number, se: number): { ok: boolean; implied: number; detail: string } {
  const implied = (high - low) / (2 * 1.96);
  const ok = Math.abs(implied - se) <= Math.max(0.1 * se, 0.005);
  return { ok, implied, detail: `SE từ khoảng tin cậy = (${high} − ${low}) / 3.92 = ${implied.toFixed(3)}, bài in SE = ${se}` };
}
