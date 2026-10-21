/**
 * Matrix cells are indexed from 0 into the matrix's variable list (schema: "indices into variables"). One extraction
 * (Authentic Brand Ethicality, by Codex) counted from 1: the numbers were right but each sat one row and one column off.
 * Counting from 0, a cell's row index is always below the number of variables, so a cell whose row index EQUALS that
 * number proves the matrix was counted from 1. Such a matrix is shifted back by one, on every publish (the saved
 * extraction is not touched), and its cells carry a note. Without that proof nothing is changed.
 */
import type { StudyDetail } from "@research-data/schema";

type Matrix = StudyDetail["correlation_matrices"][number];

/** The matrix counted its cells from 1 (some cell has a row index equal to the number of variables). */
export function isCountedFromOne(matrix: Pick<Matrix, "variables" | "cells">): boolean {
  const n = matrix.variables.length;
  return n > 0 && matrix.cells.some((c) => c.i === n) && matrix.cells.every((c) => c.i >= 1 && c.j >= 1 && c.i <= n && c.j <= n);
}

/** Marks a matrix whose indices were shifted back, so its cells can say so. */
export const INDEX_SHIFTED = "indexShiftedFromOne";

export interface Normalised<T> {
  data: T;
  /** natural-key-free description of what was shifted, for the log. */
  shifted: { study: string; table: string; cells: number }[];
}

/** A copy of the extraction whose matrices all count from 0; the input is not modified. */
export function normaliseMatrixIndices<T extends { studies: StudyDetail[] }>(saved: T): Normalised<T> {
  const shifted: Normalised<T>["shifted"] = [];
  const studies = saved.studies.map((study) => ({
    ...study,
    correlation_matrices: study.correlation_matrices.map((m) => {
      if (!isCountedFromOne(m)) return m;
      shifted.push({ study: study.study_label, table: m.source_table, cells: m.cells.length });
      return { ...m, cells: m.cells.map((c) => ({ ...c, i: c.i - 1, j: c.j - 1 })), [INDEX_SHIFTED]: true } as Matrix;
    }),
  }));
  return { data: shifted.length ? { ...saved, studies } : saved, shifted };
}
