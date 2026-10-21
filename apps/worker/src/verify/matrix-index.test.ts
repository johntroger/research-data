import type { StudyDetail } from "@research-data/schema";
import { beforeAll, describe, expect, it } from "vitest";
import { readTextLayer, type PdfTextLayer } from "../pdf/text-layer.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { INDEX_SHIFTED, isCountedFromOne, normaliseMatrixIndices } from "./matrix-index.js";
import { verifyFull, type FullData } from "./verify-full.js";

type Matrix = StudyDetail["correlation_matrices"][number];
const matrix = (cells: [number, number][], n = 3): Matrix =>
  ({ source_table: "Table 2", n: 100, variables: Array.from({ length: n }, (_, i) => `V${i}`), cells: cells.map(([i, j]) => ({ i, j, r: 0.1 + i / 10 })), descriptives: [] }) as unknown as Matrix;
const wrap = (m: Matrix) => ({ studies: [{ study_label: "Study 1", correlation_matrices: [m] } as unknown as StudyDetail] });

describe("matrices counted from 1 (Mục 6.10)", () => {
  it("is proven by a cell whose row index equals the number of variables", () => {
    expect(isCountedFromOne(matrix([[2, 1], [3, 1], [3, 2]]))).toBe(true);
    expect(isCountedFromOne(matrix([[1, 0], [2, 0], [2, 1]]))).toBe(false);
  });

  it("shifts every cell of such a matrix back by one, marks it, and leaves the input alone", () => {
    const input = wrap(matrix([[2, 1], [3, 1], [3, 2]]));
    const { data, shifted } = normaliseMatrixIndices(input);
    const m = data.studies[0]!.correlation_matrices[0]! as unknown as Record<string, unknown> & Matrix;
    expect(m.cells.map((c) => [c.i, c.j])).toEqual([[1, 0], [2, 0], [2, 1]]);
    expect(m[INDEX_SHIFTED]).toBe(true);
    expect(shifted).toEqual([{ study: "Study 1", table: "Table 2", cells: 3 }]);
    expect(input.studies[0]!.correlation_matrices[0]!.cells.map((c) => [c.i, c.j])).toEqual([[2, 1], [3, 1], [3, 2]]);
  });

  it("changes nothing when the matrix counts from 0, has no proof, or mixes both", () => {
    const zero = wrap(matrix([[1, 0], [2, 0], [2, 1]]));
    expect(normaliseMatrixIndices(zero).data).toBe(zero);
    expect(normaliseMatrixIndices(zero).shifted).toEqual([]);
    const few = wrap(matrix([[2, 1]]));
    expect(normaliseMatrixIndices(few).data).toBe(few); // only a row index below n: no proof
    const mixed = wrap(matrix([[3, 1], [1, 0]]));
    expect(normaliseMatrixIndices(mixed).data).toBe(mixed);
  });

  it("shifts only the matrices that need it", () => {
    const input = { studies: [{ study_label: "S", correlation_matrices: [matrix([[3, 1]]), matrix([[1, 0]])] } as unknown as StudyDetail] };
    const out = normaliseMatrixIndices(input).data.studies[0]!.correlation_matrices;
    expect(out[0]!.cells[0]).toMatchObject({ i: 2, j: 0 });
    expect(out[1]!.cells[0]).toMatchObject({ i: 1, j: 0 });
  });
});

describe("a matrix counted from 1 is verified as if counted from 0", () => {
  const paper = SYNTHETIC_PAPERS[0]!;
  let layer: PdfTextLayer;
  beforeAll(async () => {
    layer = await readTextLayer(await renderPdf(paper.render));
  });
  const oneBased = (): FullData => {
    const d = structuredClone(paper.answer) as FullData;
    for (const c of d.studies[0]!.correlation_matrices[0]!.cells) {
      c.i += 1;
      c.j += 1;
    }
    return d;
  };

  it("without the shift the last row index equals the number of variables and the cell is ⚠", () => {
    const rows = verifyFull(layer, oneBased());
    expect(rows.find((r) => r.naturalKey === "study_1:corr:table_2:r:3,1")?.checks.find((c) => c.name === "cell_index")?.passed).toBe(false);
  });

  it("after the shift every cell is back at its own place, ✓, with a note", () => {
    const rows = verifyFull(layer, normaliseMatrixIndices(oneBased()).data);
    const reference = verifyFull(layer, structuredClone(paper.answer) as FullData);
    for (const key of ["study_1:corr:table_2:r:1,0", "study_1:corr:table_2:r:2,0", "study_1:corr:table_2:r:2,1"]) {
      const row = rows.find((r) => r.naturalKey === key)!;
      expect(row.badge).toBe("auto_verified");
      expect(row.evidence.quote).toBe(reference.find((r) => r.naturalKey === key)!.evidence.quote);
      expect(row.checks.find((c) => c.name === "index_base")?.passed).toBe(true);
    }
    expect(reference.find((r) => r.naturalKey === "study_1:corr:table_2:r:1,0")!.checks.some((c) => c.name === "index_base")).toBe(false);
  });
});
