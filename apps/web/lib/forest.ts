/**
 * Forest plot of the tests of one question (step P5.4), shown only when there is something honest to draw: at least FOREST_MIN_STUDIES
 * different studies that report the same kind of estimate with an interval (a confidence interval, or a standard error, from which
 * estimate ± 1.96 SE is drawn). With fewer, a plot of two or three points looks like a conclusion the data cannot support. No pooled
 * estimate is computed: this is a picture of what the studies report, not a meta-analysis. Pure, no I/O.
 */
import { estimateGroup, paperLabel, type EstimateGroup, type PathRow } from "./relations";

export const FOREST_MIN_STUDIES = 4;

export interface ForestPoint {
  id: string;
  label: string;
  estimate: number;
  low: number;
  high: number;
  /** The interval was computed from the standard error rather than printed. */
  fromSe: boolean;
}

export interface Forest {
  kind: EstimateGroup;
  points: ForestPoint[];
}

function interval(r: PathRow): { low: number; high: number; fromSe: boolean } | null {
  if (r.estimate === null) return null;
  if (r.ci_low != null && r.ci_high != null && r.ci_low <= r.ci_high) return { low: r.ci_low, high: r.ci_high, fromSe: false };
  if (r.se != null && r.se > 0) return { low: r.estimate - 1.96 * r.se, high: r.estimate + 1.96 * r.se, fromSe: true };
  return null;
}

/** The forest to draw for these tests, or null when no kind of estimate has enough studies with an interval. */
export function buildForest(rows: PathRow[]): Forest | null {
  const byKind = new Map<EstimateGroup, ForestPoint[]>();
  const seen = new Set<string>();
  for (const r of rows) {
    const kind = estimateGroup(r);
    const iv = interval(r);
    if (kind === "none" || !iv || r.estimate === null) continue;
    const key = `${kind}|${r.study_id}`;
    if (seen.has(key)) continue; // one test per study and kind
    seen.add(key);
    const label = `${paperLabel(r.papers)}, ${r.studies?.study_label ?? "?"}`;
    byKind.set(kind, [...(byKind.get(kind) ?? []), { id: r.id, label, estimate: r.estimate, ...iv }]);
  }
  const best = [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (!best || best[1].length < FOREST_MIN_STUDIES) return null;
  return { kind: best[0], points: best[1].sort((a, b) => a.estimate - b.estimate) };
}

/** The x range of the plot: symmetric around zero for correlations and coefficients, padded a little, never narrower than ±0.5. */
export function forestRange(points: ForestPoint[]): { min: number; max: number } {
  const extent = Math.max(0.5, ...points.flatMap((p) => [Math.abs(p.low), Math.abs(p.high)]));
  const pad = Math.ceil(extent * 10 * 1.05) / 10;
  return { min: -pad, max: pad };
}
