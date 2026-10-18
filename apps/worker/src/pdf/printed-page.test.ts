import { describe, expect, it } from "vitest";
import { resolvePrintedPages } from "./printed-page.js";
import { buildPdf, SAMPLE_BODY } from "./test-fixtures.js";
import { readTextLayer } from "./text-layer.js";

async function resolve(...args: Parameters<typeof buildPdf>) {
  return readTextLayer(await buildPdf(...args));
}

describe("resolvePrintedPages", () => {
  it("prefers /PageLabels when the PDF declares them", async () => {
    const layer = await resolve({
      pages: [{ body: SAMPLE_BODY }, { body: SAMPLE_BODY }, { body: SAMPLE_BODY }],
      pageLabelStart: 1245,
    });
    expect(resolvePrintedPages(layer)).toEqual({ printedPages: ["1245", "1246", "1247"], method: "page_labels" });
  });

  it("detects page numbers in running heads, ignoring the year and volume", async () => {
    const layer = await resolve({
      pages: [
        { body: "Publisher cover page without a page number." },
        { header: "Journal of Testing 45 (2023) 88-102    88", body: SAMPLE_BODY },
        { header: "89    A. Author / Journal of Testing 45 (2023)", body: SAMPLE_BODY },
        { header: "Journal of Testing 45 (2023)    90", body: SAMPLE_BODY },
      ],
    });
    expect(resolvePrintedPages(layer)).toEqual({ printedPages: ["87", "88", "89", "90"], method: "header_footer" });
  });

  it("detects page numbers placed in the footer", async () => {
    const layer = await resolve({
      pages: [
        { body: SAMPLE_BODY, footer: "501" },
        { body: SAMPLE_BODY, footer: "502" },
      ],
    });
    expect(resolvePrintedPages(layer).method).toBe("header_footer");
    expect(resolvePrintedPages(layer).printedPages).toEqual(["501", "502"]);
  });

  it("does not trust a single page-number-like token", async () => {
    const layer = await resolve({
      pages: [{ header: "Page 7", body: SAMPLE_BODY }, { body: SAMPLE_BODY }, { body: SAMPLE_BODY }],
    });
    expect(resolvePrintedPages(layer).method).toBe("pdf_index");
  });

  it("falls back to the Crossref first page when the PDF gives no page numbers", async () => {
    const layer = await resolve({ pages: [{ body: SAMPLE_BODY }, { body: SAMPLE_BODY }] });
    expect(resolvePrintedPages(layer, { crossrefFirstPage: 1245 })).toEqual({
      printedPages: ["1245", "1246"],
      method: "crossref_offset",
    });
  });

  it("falls back to the PDF index as a last resort", async () => {
    const layer = await resolve({ pages: [{ body: SAMPLE_BODY }, { body: SAMPLE_BODY }] });
    expect(resolvePrintedPages(layer)).toEqual({ printedPages: ["1", "2"], method: "pdf_index" });
  });

  it("treats trivial labels (1, 2, …) as no information", async () => {
    const layer = await resolve({
      pages: [{ body: SAMPLE_BODY }, { body: SAMPLE_BODY }],
      pageLabelStart: 1,
    });
    expect(resolvePrintedPages(layer, { crossrefFirstPage: 30 }).method).toBe("crossref_offset");
  });
});
