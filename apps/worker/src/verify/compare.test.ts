import { beforeAll, describe, expect, it } from "vitest";
import { readTextLayer, type PdfTextLayer } from "../pdf/text-layer.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import { analysePaper } from "./analyse.js";
import { compareExtractions, pairListItems, sameValue } from "./compare.js";
import type { FullData } from "./verify-full.js";

let layer: PdfTextLayer;
const paper = SYNTHETIC_PAPERS[0]!;
beforeAll(async () => {
  layer = await readTextLayer(await renderPdf(paper.render));
});

const side = (edit: (d: FullData) => void = () => {}) => {
  const data = structuredClone(paper.answer);
  edit(data);
  return { data, analysis: analysePaper(layer, data) };
};

describe("compareExtractions", () => {
  it("passes every criterion for identical extractions", () => {
    const c = compareExtractions(side(), side());
    expect(c.pass).toBe(true);
    expect(c.keys.different).toEqual([]);
    expect(c.keys.equal).toBe(c.keys.shared);
    expect(c.sync).toEqual(c.batch);
  });

  it("fails when the Batch answer loses a Study", () => {
    const c = compareExtractions(side(), side((d) => d.studies.pop()));
    if (paper.answer.studies.length > 1) expect(c.criteria.find((x) => x.name === "same number of Studies")!.pass).toBe(false);
    else expect(c.pass).toBe(false); // the paths and fields of the only Study are gone
  });

  it("lists the fields whose value differs and fails below 90% equal", () => {
    const c = compareExtractions(
      side(),
      side((d) => {
        for (const s of d.studies) for (const p of s.paths) p.estimate = 0.999;
      }),
    );
    expect(c.keys.different.length).toBeGreaterThan(0);
    expect(c.keys.different[0]!.batch).toBe(0.999);
  });

  it("fails when Batch has more than 2 extra hidden fields", () => {
    const c = compareExtractions(
      side(),
      side((d) => {
        for (const s of d.studies) for (const p of s.paths) p.evidence = { ...p.evidence, pdf_page: 0, quote: "" };
      }),
    );
    expect(c.batch.hidden).toBeGreaterThan(c.sync.hidden + 2);
    expect(c.criteria.find((x) => x.name === "hidden at most sync + 2")!.pass).toBe(false);
    expect(c.pass).toBe(false);
  });
});

describe("sameValue", () => {
  it("ignores object key order, curly quotes, case and spacing, but not real differences", () => {
    expect(sameValue({ a: 1, b: ["x"] }, { b: ["x"], a: 1 })).toBe(true);
    expect(sameValue("A consumer’s  view", "a consumer's view")).toBe(true);
    expect(sameValue(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameValue("a view", "another view")).toBe(false);
    expect(sameValue(null, undefined)).toBe(true);
  });
});

describe("pairListItems", () => {
  const f = (naturalKey: string, value: string) => ({ naturalKey, fieldName: "future_direction", value });
  it("pairs discussion statements by value, so a missing item does not shift the others", () => {
    const syncList = [f("future_direction:1", "a"), f("future_direction:2", "b"), f("future_direction:3", "c")];
    const batchList = [f("future_direction:1", "b"), f("future_direction:2", "c"), f("future_direction:3", "new")];
    expect(pairListItems(syncList, batchList).map((x) => x.naturalKey)).toEqual(["future_direction:2", "future_direction:3", "future_direction:3"]);
  });
});
