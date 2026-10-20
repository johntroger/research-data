import { beforeAll, describe, expect, it } from "vitest";
import { readTextLayer, type PdfTextLayer } from "../pdf/text-layer.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { findMissing } from "./completeness.js";
import type { FullData } from "./verify-full.js";

const paper = SYNTHETIC_PAPERS[0]!; // H1, H2, H3 printed in the text, one path each
let layer: PdfTextLayer;
beforeAll(async () => {
  layer = await readTextLayer(await renderPdf(paper.render));
});

/** The answer key with the listed hypothesis codes and the codes of its paths replaced. */
function data(listed: string[], pathCodes: (string | null)[]): FullData {
  const d = structuredClone(paper.answer);
  d.structure.hypothesis_codes = listed;
  d.studies[0]!.paths = pathCodes.map((code, i) => ({ ...structuredClone(d.studies[0]!.paths[0]!), hypothesis_code: code, iv_label_original: `iv${i}`, dv_label_original: `dv${i}` }));
  return d;
}
const withoutResult = (d: FullData) => findMissing(layer, d).filter((m) => m.kind === "hypothesis_without_path").map((m) => m.item);

describe("a family code has its result when a part of it has one", () => {
  it("accepts H1 when a path carries H1a (or H1b…), as the paper reports H1a / H1b / H1c", () => {
    expect(withoutResult(data(["H1", "H1a", "H1b"], ["H1a", "H1b"]))).toEqual([]);
    expect(withoutResult(data(["H1"], ["H1c"]))).toEqual([]);
  });

  it("still reports a family none of whose parts has a path", () => {
    expect(withoutResult(data(["H1", "H2"], ["H2a"]))).toEqual(["H1"]);
  });

  it("still reports a part without a path, even when a sibling has one", () => {
    expect(withoutResult(data(["H1a", "H1b"], ["H1a"]))).toEqual(["H1b"]);
  });

  it("does not take H10 for a part of H1", () => {
    expect(withoutResult(data(["H1", "H10"], ["H10"]))).toEqual(["H1"]);
  });

  it("keeps the plain case: the code of a path is the code listed", () => {
    expect(withoutResult(data(["H1", "H2", "H3"], ["H1", "H2", "H3"]))).toEqual([]);
    expect(withoutResult(data(["H1", "H2", "H3"], ["H1", "H2"]))).toEqual(["H3"]);
  });
});
