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
  /** Different studies among the points (a study may give several tests of the question, each drawn as its own line). */
  studies: number;
}

/**
 * Kinds that can share one linear axis around zero. "other" mixes b, d, odds ratios and η² (an odds ratio centres on 1 and needs
 * a log scale, η² has no sign), so it is never drawn.
 */
const DRAWABLE: EstimateGroup[] = ["std_beta", "path_coefficient", "r"];

function interval(r: PathRow): { low: number; high: number; fromSe: boolean } | null {
  if (r.estimate === null) return null;
  if (r.ci_low != null && r.ci_high != null && r.ci_low <= r.ci_high) return { low: r.ci_low, high: r.ci_high, fromSe: false };
  if (r.se != null && r.se > 0) return { low: r.estimate - 1.96 * r.se, high: r.estimate + 1.96 * r.se, fromSe: true };
  return null;
}

/** The forest to draw for these tests, or null when no kind of estimate has enough studies with an interval. */
export function buildForest(rows: PathRow[]): Forest | null {
  // Every test with an interval, by kind. All tests of a study are kept: picking one would be arbitrary (the first in the list).
  const byKind = new Map<EstimateGroup, PathRow[]>();
  for (const r of rows) {
    const kind = estimateGroup(r);
    if (!DRAWABLE.includes(kind) || !interval(r)) continue;
    byKind.set(kind, [...(byKind.get(kind) ?? []), r]);
  }
  const studiesOf = (list: PathRow[]) => new Set(list.map((r) => r.study_id)).size;
  const best = [...byKind.entries()].sort((a, b) => studiesOf(b[1]) - studiesOf(a[1]))[0];
  if (!best || studiesOf(best[1]) < FOREST_MIN_STUDIES) return null;
  const perStudy = new Map<string, number>();
  for (const r of best[1]) perStudy.set(r.study_id, (perStudy.get(r.study_id) ?? 0) + 1);
  const points = best[1].map((r) => {
    const base = `${paperLabel(r.papers)}, ${r.studies?.study_label ?? "?"}`;
    // A study with several tests of the question: name the variables so the lines can be told apart.
    const label = (perStudy.get(r.study_id) ?? 0) > 1 ? `${base}: ${r.iv_label_original} → ${r.dv_label_original}` : base;
    return { id: r.id, label, estimate: r.estimate!, ...interval(r)! };
  });
  return { kind: best[0], points: points.sort((a, b) => a.estimate - b.estimate), studies: studiesOf(best[1]) };
}

/** The x range of the plot: symmetric around zero for correlations and coefficients, padded a little, never narrower than ±0.5. */
export function forestRange(points: ForestPoint[]): { min: number; max: number } {
  const extent = Math.max(0.5, ...points.flatMap((p) => [Math.abs(p.low), Math.abs(p.high)]));
  const pad = Math.ceil(extent * 10 * 1.05) / 10;
  return { min: -pad, max: pad };
}
