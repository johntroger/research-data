/**
 * Recomputes the reported statistics (step 1.5, statcheck-style, Nuijten et al. 2016; Mục 6.3):
 *   p from t / F / z and df;  t from estimate and SE;  SE from a normal CI.
 * A reported p is consistent when the recomputed p, over the rounding of the printed test
 * statistic, can round to it (or satisfy its "<" / ">"). A mismatch that flips the conclusion at
 * α = .05 is a decision error. When the values were found in the PDF and still disagree, the paper
 * itself may be wrong ("có thể là lỗi của bài gốc").
 * Like statcheck, a p that only matches as one-tailed counts as consistent when the paper says it uses one-tailed tests
 * (common in PLS-SEM with directional hypotheses); otherwise a correct paper would be marked ⚠.
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
  /**
   * For t only: the smallest df the test may have when the number of predictors is unknown (df = n − k − 1). The p is then
   * checked over [dfMin, df]: a smaller df gives a larger p.
   */
  dfMin?: number;
}

export interface PCheckOptions {
  /** The paper says it uses one-tailed (one-sided, directional) tests. */
  oneTailed?: boolean;
}

/** Does the paper say its tests are one-tailed? ("one-tailed", "one-sided", "directional test"). */
export function mentionsOneTailed(text: string): boolean {
  return /\bone[\s-]?(tailed|sided)\b|\bdirectional\s+(tests?|hypothes[ei]s\s+tests?)\b/i.test(text);
}

const ALPHA = 0.05;

/** Decimals as printed; a JS number lost its trailing zeros, so at least two are assumed. */
function halfUnit(value: number): number {
  const text = String(Math.abs(value));
  const decimals = Math.max(2, text.includes(".") ? text.split(".")[1]!.length : 0);
  return 0.5 * 10 ** -decimals;
}

function pOf(stat: TestStat, value: number, df = stat.df[0]): number | null {
  const v = Math.abs(value);
  switch (stat.type) {
    case "t":
      return stat.df.length === 1 && df !== undefined && df > 0 ? tTwoTailedP(v, df) : null;
    case "F":
      return stat.df.length === 2 && stat.df[0]! > 0 && stat.df[1]! > 0 ? fUpperTailP(v, stat.df[0]!, stat.df[1]!) : null;
    case "z":
      return zTwoTailedP(v);
  }
}

/** p over the rounding interval of the printed statistic (and over [dfMin, df] for t): [lowest, highest]. */
export function pRange(stat: TestStat): { point: number; low: number; high: number } | null {
  const point = pOf(stat, stat.value);
  const low = pOf(stat, Math.abs(stat.value) + halfUnit(stat.value));
  const dfLow = stat.type === "t" && stat.dfMin !== undefined ? Math.max(1, Math.min(stat.dfMin, stat.df[0] ?? 1)) : stat.df[0];
  const high = pOf(stat, Math.max(0, Math.abs(stat.value) - halfUnit(stat.value)), dfLow);
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

type ReportedP = NonNullable<ReturnType<typeof parseReportedP>>;

function fits(range: { low: number; high: number }, p: ReportedP): boolean {
  const half = 0.5 * 10 ** -p.decimals;
  const eps = 1e-12;
  return {
    "=": range.high >= p.value - half - eps && range.low <= p.value + half + eps,
    "<": range.low < p.value + eps,
    "≤": range.low <= p.value + eps,
    ">": range.high > p.value - eps,
    "≥": range.high >= p.value - eps,
  }[p.operator];
}

/** Is the reported p consistent with the printed test statistic? */
export function checkReportedP(stat: TestStat, reported: string, options: PCheckOptions = {}): PCheck {
  const p = parseReportedP(reported);
  const range = pRange(stat);
  if (!p || !range) return { status: "not_checked", recomputed: range?.point ?? null, detail: "Không đủ dữ liệu để tính lại p" };

  const label = `${stat.type}${stat.df.length ? `(${stat.df.join(", ")})` : ""} = ${stat.value}`;
  if (fits(range, p)) return { status: "consistent", recomputed: range.point, detail: `${label} cho p ≈ ${fmt(range.point)}, khớp "${reported}"` };
  // F is one-sided already; t and z may be halved when the paper says its tests are one-tailed.
  if (options.oneTailed && stat.type !== "F" && fits({ low: range.low / 2, high: range.high / 2 }, p)) {
    return { status: "consistent", recomputed: range.point / 2, detail: `${label} cho p một phía ≈ ${fmt(range.point / 2)}, khớp "${reported}" (bài nói dùng kiểm định một phía)` };
  }

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

const Z_OF_LEVEL: Record<number, number> = { 90: 1.645, 95: 1.96, 99: 2.576 };

/**
 * Levels of confidence interval other than 95% that the paper names ("90% CI", "99% confidence interval"). The schema does not
 * record the level of a CI, so a 90% or 99% one is only tried when the paper says it uses one: trying them always would let a
 * wrongly extracted interval pass by chance.
 */
export function mentionedCiLevels(text: string): number[] {
  const found = new Set<number>();
  for (const m of text.matchAll(/\b(90|99)\s?%\s*(?:CIs?\b|confidence\s+intervals?)/gi)) {
    // The 90% CI of RMSEA (a fit index of SEM papers) says nothing about the CIs of the coefficients.
    if (/RMSEA/i.test(text.slice(Math.max(0, m.index - 60), m.index + m[0].length + 40))) continue;
    found.add(Number(m[1]));
  }
  return [...found].sort();
}

/** SE implied by a symmetric normal CI against the printed SE, at 95% or another level the paper names (10% slack for rounding and small-sample t). */
export function checkSeFromCi(low: number, high: number, se: number, otherLevels: number[] = []): { ok: boolean; implied: number; detail: string } {
  const close = (implied: number) => Math.abs(implied - se) <= Math.max(0.1 * se, 0.005);
  const levels = [95, ...otherLevels.filter((l) => l !== 95 && Z_OF_LEVEL[l])].map((level) => ({ level, z: Z_OF_LEVEL[level]! }));
  const match = levels.find(({ z }) => close((high - low) / (2 * z)));
  const { level, z } = match ?? levels[0]!;
  const implied = (high - low) / (2 * z);
  return { ok: match !== undefined, implied, detail: `SE từ khoảng tin cậy ${level}% = (${high} − ${low}) / ${(2 * z).toFixed(2)} = ${implied.toFixed(3)}, bài in SE = ${se}` };
}
