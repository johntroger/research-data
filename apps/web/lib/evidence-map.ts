/**
 * The evidence map (step P5.4): which pairs of canonical concepts the repository has tests for, how many, and how they came out.
 * Rows are the concepts used as an independent variable, columns the ones used as a dependent variable; a cell is a pair with at least one
 * direct test. Only tests whose two ends map to a canonical concept can be placed (about half of all, see docs/concept-mapping-p3.md).
 * Pure, no I/O.
 */
import { statusGroup, isVerified, type Concept, type PathRow } from "./relations";

export interface MapCell {
  iv: string;
  dv: string;
  /** Every direct test of the pair, counted or not. */
  tests: number;
  papers: number;
  /** Of the counted ones (✓ or ★) that put a hypothesis to the test: how they came out. */
  supported: number;
  notSupported: number;
  mixed: number;
  /** Counted tests that did not state a hypothesis, and tests not yet checked (⚠ or ◇). */
  noHypothesis: number;
  unchecked: number;
}

export interface EvidenceMap {
  rows: Concept[];
  cols: Concept[];
  cells: Map<string, MapCell>;
  /** Tests placed on the map, and tests left off because an end has no canonical concept. */
  placed: number;
  notPlaced: number;
  /** Cells with at least one test, out of rows × columns. */
  filled: number;
}

export const cellKey = (iv: string, dv: string) => `${iv}\u0000${dv}`;

type MapRow = Pick<PathRow, "paper_id" | "iv_construct_id" | "dv_construct_id" | "effect_type" | "status" | "badge">;

export function buildEvidenceMap(paths: MapRow[], concepts: Concept[]): EvidenceMap {
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const cells = new Map<string, MapCell & { paperSet: Set<string> }>();
  let placed = 0;
  let notPlaced = 0;
  for (const p of paths) {
    if (p.effect_type !== "direct") continue;
    if (!p.iv_construct_id || !p.dv_construct_id || !byId.has(p.iv_construct_id) || !byId.has(p.dv_construct_id)) {
      notPlaced++;
      continue;
    }
    placed++;
    const key = cellKey(p.iv_construct_id, p.dv_construct_id);
    const cell = cells.get(key) ?? { iv: p.iv_construct_id, dv: p.dv_construct_id, tests: 0, papers: 0, supported: 0, notSupported: 0, mixed: 0, noHypothesis: 0, unchecked: 0, paperSet: new Set<string>() };
    cell.tests++;
    cell.paperSet.add(p.paper_id);
    if (!isVerified(p as PathRow)) cell.unchecked++;
    else {
      const g = statusGroup(p as PathRow);
      if (g === "supported") cell.supported++;
      else if (g === "not_supported") cell.notSupported++;
      else if (g === "mixed") cell.mixed++;
      else cell.noHypothesis++;
    }
    cells.set(key, cell);
  }
  const final = new Map<string, MapCell>();
  for (const [k, c] of cells) {
    const { paperSet, ...rest } = c;
    final.set(k, { ...rest, papers: paperSet.size });
  }
  const count = (side: "iv" | "dv") => {
    const n = new Map<string, number>();
    for (const c of final.values()) n.set(c[side], (n.get(c[side]) ?? 0) + c.tests);
    return [...n.entries()].sort((a, b) => b[1] - a[1] || byId.get(a[0])!.canonical_name.localeCompare(byId.get(b[0])!.canonical_name)).map(([id]) => byId.get(id)!);
  };
  const rows = count("iv");
  const cols = count("dv");
  return { rows, cols, cells: final, placed, notPlaced, filled: final.size };
}

/** Share of hypothesis tests that came out supported among the ones that came out supported or not (mixed counts half); null when none. */
export function supportShare(c: MapCell): number | null {
  const decided = c.supported + c.notSupported + c.mixed;
  return decided === 0 ? null : (c.supported + c.mixed / 2) / decided;
}
