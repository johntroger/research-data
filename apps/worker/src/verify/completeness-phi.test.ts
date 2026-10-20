import { describe, expect, it } from "vitest";
import { readTextLayer } from "../pdf/text-layer.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { findMissing, holdsSquaredCorrelations } from "./completeness.js";
import type { FullData } from "./verify-full.js";

const paper = SYNTHETIC_PAPERS[0]!;
const header = ["", "A", "B", "C"];
const rows = [
  ["A", "0.80", "[ .60; .70]", "[ .50; .60]"],
  ["B", "0.40", "0.77", "[ .40; .50]"],
  ["C", "0.30", "0.20", "0.73"],
];
const widths = [60, 90, 90, 90];

/** A page with two tables: Table 2 with the given note, and a plain Table 3. */
async function layerWith(note2: string) {
  return readTextLayer(
    await renderPdf({
      title: "t",
      pages: [
        {
          blocks: [
            { kind: "table", title: "Table 2 Phi matrix of latent constructs", header, rows, note: note2, widths },
            { kind: "table", title: "Table 3 Means, standard deviations and correlations", header, rows: [["A", "1", "", ""], ["B", ".40", "1", ""], ["C", ".30", ".20", "1"]], note: "Note. Pearson correlations.", widths },
          ],
        },
      ],
    }),
  );
}

/** The answer key whose structure lists the given tables and which has no correlation matrix. */
function dataWith(tables: { label: string }[]): FullData {
  const d = structuredClone(paper.answer);
  d.structure.tables = tables.map((t) => ({ table_label: t.label, pdf_page: 1, kind: "correlation", study_label: "Study 1" }));
  for (const s of d.studies) s.correlation_matrices = [];
  return d;
}
const matrixMissing = (layer: Awaited<ReturnType<typeof layerWith>>, d: FullData) => findMissing(layer, d).filter((m) => m.kind === "matrix_missing").map((m) => m.item);

describe("a table of squared correlations is not a missing correlation matrix", () => {
  const phi = "Note. The diagonal represents average variance extracted values; below the diagonal are the shared variances (squared correlations).";

  it("recognises the Phi-matrix by the words of its own note", async () => {
    const layer = await layerWith(phi);
    expect(holdsSquaredCorrelations(layer, "Table 2", 1)).toBe(true);
    expect(matrixMissing(layer, dataWith([{ label: "Table 2" }]))).toEqual([]);
  });

  it("still reports a real correlation table whose matrix was not extracted", async () => {
    const layer = await layerWith(phi);
    expect(holdsSquaredCorrelations(layer, "Table 3", 1)).toBe(false); // the words belong to Table 2's note, not Table 3's
    expect(matrixMissing(layer, dataWith([{ label: "Table 3" }]))).toEqual(["Table 3"]);
  });

  it("treats the two tables separately when both were called correlation tables", async () => {
    const layer = await layerWith(phi);
    expect(matrixMissing(layer, dataWith([{ label: "Table 2" }, { label: "Table 3" }]))).toEqual(["Table 3"]);
  });

  it("does not skip a table whose note has no such words (a correlation table with an AVE diagonal)", async () => {
    const layer = await layerWith("Note. The diagonal shows the square root of the AVE.");
    expect(holdsSquaredCorrelations(layer, "Table 2", 1)).toBe(false);
    expect(matrixMissing(layer, dataWith([{ label: "Table 2" }]))).toEqual(["Table 2"]);
  });

  it("does not fail when the caption cannot be found on the page", async () => {
    const layer = await layerWith(phi);
    expect(holdsSquaredCorrelations(layer, "Table 9", 1)).toBe(false);
    expect(holdsSquaredCorrelations(layer, "not a table", 1)).toBe(false);
  });
});
