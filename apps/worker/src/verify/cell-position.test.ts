import { describe, expect, it } from "vitest";
import { type CellRow, matrixPositions, rowNumbers } from "./cell-position.js";

describe("numbers of a matrix row", () => {
  it("skips the row number, words, codes and NA, and keeps signs written in any way", () => {
    expect(rowNumbers("6. Expectations .25 .38 .20 .10 −.27 1.00", 6)).toEqual([0.25, 0.38, 0.2, 0.1, -0.27, 1]);
    expect(rowNumbers("(11) Education_Graduate n = 56 NA NA .02 -.02 - .01 .01", 11)).toEqual([56, 0.02, -0.02, -0.01, 0.01]);
    expect(rowNumbers("SDAc1 0.86 H2 R2 0.5", undefined)).toEqual([0.86, 0.5]);
  });
});

// Rows of a matrix with their values at known columns; `cell` builds the CellRow of (i, j) from the row text.
const cell = (rows: string[], i: number, j: number, value: number, numbered = true): CellRow => ({ line: rows[i]!, i, j, value, ...(numbered ? { rowNumber: i + 1 } : {}) });

describe("is the value in the right column of its row (Mục 6.10)", () => {
  const patterson = ["1. Novelty 1.00", "2. Importance .20 1.00", "3. Complexity .12 .09 1.00", "4. Stakeholding -.28 .32 -.08 1.00", "5. Uncertainty .32 -.17 .01 -.38 1.00", "6. Expectations .25 .38 .20 .10 -.27 1.00"];

  it("lower triangle with the diagonal: cells at their own column are ok, a neighbour's value is off", () => {
    const cells = [cell(patterson, 1, 0, 0.2), cell(patterson, 2, 0, 0.12), cell(patterson, 2, 1, 0.09), cell(patterson, 3, 1, 0.32), cell(patterson, 5, 4, -0.27), cell(patterson, 5, 3, -0.27)];
    expect(matrixPositions(cells, 6)).toEqual(["ok", "ok", "ok", "ok", "ok", "off"]);
  });

  it("lower triangle without the diagonal, descriptive columns first, shared variances after (ABE)", () => {
    const abe = [
      "(1) ABE 3.13 .87 .97 .74 .72 .65 .57 .68 .35 .00 .06 .01 .00 .00 .01 .03",
      "(2) Perceived ethicality 3.40 .87 .91 .64 .85 .79 .52 .76 .35 .00 .02 .02 .01 .00 .01 .03",
      "(3) Brand authenticity 3.38 .79 NA .54 .81 .89 .55 .77 .40 .01 .01 .00 .00 .00 .00 .04",
      "(4) Customer referral 2.74 .99 .90 .74 .75 .72 .74 .65 .35 .00 .01 .01 .00 .00 .00 .05",
      "(5) Brand trust 3.48 .79 .89 .68 .82 .87 .88 .81 .42 .01 .02 .01 .00 .00 .00 .03",
    ];
    const ok = [cell(abe, 1, 0, 0.85), cell(abe, 2, 0, 0.81), cell(abe, 2, 1, 0.89), cell(abe, 3, 0, 0.75), cell(abe, 4, 2, 0.88), cell(abe, 4, 0, 0.82)];
    expect(matrixPositions(ok, 13)).toEqual(["ok", "ok", "ok", "ok", "ok", "ok"]);
    // the audit's case: the value of column 3 given as column 2
    expect(matrixPositions([...ok, cell(abe, 4, 1, 0.88)], 13).at(-1)).toBe("off");
  });

  it("claims nothing when every index is shifted (no layout fits), or the matrix is too small to tell", () => {
    const shifted = [cell(patterson, 2, 0, 0.2), cell(patterson, 3, 1, 0.12), cell(patterson, 3, 2, 0.09), cell(patterson, 4, 1, 0.32)];
    expect(matrixPositions(shifted, 6)).toEqual(["unknown", "unknown", "unknown", "unknown"]);
    expect(matrixPositions([cell(patterson, 2, 0, 0.12), cell(patterson, 2, 1, 0.09)], 6)).toEqual(["unknown", "unknown"]);
  });

  it("a full square matrix", () => {
    const sq = ["Intrinsic 1.00 0.75 0.84 0.84", "Extrinsic 0.75 1.00 0.95 0.81", "Self 0.84 0.95 1.00 0.73", "Other 0.84 0.81 0.73 1.00"];
    const cells = [cell(sq, 1, 0, 0.75, false), cell(sq, 2, 0, 0.84, false), cell(sq, 2, 1, 0.95, false), cell(sq, 3, 0, 0.84, false), cell(sq, 3, 1, 0.81, false), cell(sq, 3, 2, 0.73, false)];
    expect(matrixPositions(cells, 4)).toEqual(["ok", "ok", "ok", "ok", "ok", "ok"]);
  });

  it("a value that is not on the row is not this check's business", () => {
    const cells = [cell(patterson, 1, 0, 0.2), cell(patterson, 2, 0, 0.12), cell(patterson, 2, 1, 0.09), cell(patterson, 3, 1, 0.32), cell(patterson, 3, 0, 0.99)];
    expect(matrixPositions(cells, 6).at(-1)).toBe("unknown");
  });
});
