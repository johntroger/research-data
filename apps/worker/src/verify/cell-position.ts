/**
 * Is a matrix cell's value in the RIGHT COLUMN of its row? (Mục 6.10.) `findRowQuote` finds the row of variable i that
 * holds the number; this asks where in that row it sits. A matrix is printed as a full square, as a lower triangle (with
 * or without the diagonal), and descriptive columns (M, SD, alpha…) come before the correlations, so the correlations are
 * read from the END of the row. The layout is chosen once per matrix, by the cells that fit it, and then each cell is "ok"
 * (the value is at column j), "off" (it is on the row but at another column: probably the neighbour's) or "unknown".
 */
import { normaliseChars, repairSymbolFont } from "./normalize.js";

export type CellPosition = "ok" | "off" | "unknown";

/** The numbers of a row after its label and the row number, in print order (signs kept; "NA", "-" and words skipped). */
export function rowNumbers(line: string, rowNumber?: number): number[] {
  let text = normaliseChars(repairSymbolFont(line) ?? line);
  if (rowNumber !== undefined) text = text.replace(new RegExp(`^\\s*[(\\[]?${rowNumber}[)\\].]?\\s+`), "");
  text = text.replace(/(-)\s+(?=\d|\.\d)/g, "$1").replace(/(\d)\s*,\s*(\d)/g, "$1.$2");
  const out: number[] = [];
  // A number is not part of a word or a code ("SDAc1", "H2", "R2"): it must start the token.
  for (const m of text.matchAll(/(?<![\p{L}\d_.])-?(?:\d+\.\d+|\.\d+|\d+)(?![\p{L}\d_])/gu)) out.push(Number(m[0]));
  return out;
}

const close = (a: number, b: number) => Math.abs(a - b) < 0.0051;

type Layout = "square" | "square-no-diagonal" | "lower" | "lower-no-diagonal";
const LAYOUTS: Layout[] = ["square", "square-no-diagonal", "lower", "lower-no-diagonal"];

/** Where the cell (i, j) of an n-variable matrix sits among the `len` numbers of its row in a layout (end-aligned), or null. */
function indexIn(layout: Layout, len: number, n: number, i: number, j: number): number | null {
  const k =
    layout === "square" ? (len >= n ? len - n + j : -1)
    : layout === "square-no-diagonal" ? (j !== i && len >= n - 1 ? len - (n - 1) + (j < i ? j : j - 1) : -1)
    : layout === "lower" ? (j <= i && len >= i + 1 ? len - (i + 1) + j : -1)
    : j < i && len >= i ? len - i + j : -1;
  return k >= 0 && k < len ? k : null;
}

export interface CellRow {
  /** The row of the table the cell was found on. */
  line: string;
  i: number;
  j: number;
  value: number;
  /** Number printed in front of the row (i + 1), when the table has one. */
  rowNumber?: number;
}

/**
 * One verdict per cell of ONE matrix. The layout is the one that fits most cells (at least 60% and 3 cells); a cell that
 * the layout puts elsewhere is "off". With no layout that fits, nothing is claimed ("unknown" for all): a matrix whose
 * every index is shifted is not a case of one cell being off.
 */
export function matrixPositions(cells: CellRow[], n: number): CellPosition[] {
  const parsed = cells.map((c) => ({ c, nums: rowNumbers(c.line, c.rowNumber) }));
  const score = (layout: Layout) => {
    let applicable = 0;
    let matching = 0;
    for (const { c, nums } of parsed) {
      if (!nums.some((x) => close(x, c.value))) continue;
      const k = indexIn(layout, nums.length, n, c.i, c.j);
      if (k === null) continue;
      applicable++;
      if (close(nums[k]!, c.value)) matching++;
    }
    return { applicable, matching };
  };
  let best: { layout: Layout; matching: number; ratio: number } | null = null;
  for (const layout of LAYOUTS) {
    const { applicable, matching } = score(layout);
    const ratio = applicable ? matching / applicable : 0;
    if (matching >= 3 && ratio >= 0.6 && (!best || ratio > best.ratio || (ratio === best.ratio && matching > best.matching))) best = { layout, matching, ratio };
  }
  return parsed.map(({ c, nums }): CellPosition => {
    if (!best || !nums.some((x) => close(x, c.value))) return "unknown";
    const k = indexIn(best.layout, nums.length, n, c.i, c.j);
    return k === null ? "unknown" : close(nums[k]!, c.value) ? "ok" : "off";
  });
}
