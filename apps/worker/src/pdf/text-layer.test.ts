import { describe, expect, it } from "vitest";
import { buildPdf, SAMPLE_BODY } from "./test-fixtures.js";
import { readTextLayer, sha256 } from "./text-layer.js";

describe("readTextLayer", () => {
  it("reads body text page by page", async () => {
    const pdf = await buildPdf({ pages: [{ body: SAMPLE_BODY }, { body: "Second page text about brand trust." }] });
    const layer = await readTextLayer(pdf);

    expect(layer.pageCount).toBe(2);
    expect(layer.pages[0]!.text).toContain("Perceived risk had a significant negative effect");
    expect(layer.pages[0]!.text).toContain("p < .001");
    expect(layer.pages[1]!.text).toContain("brand trust");
    expect(layer.pages.map((p) => p.pdfPageIndex)).toEqual([0, 1]);
  });

  it("keeps lines in reading order", async () => {
    const pdf = await buildPdf({ pages: [{ body: "First line\nSecond line\nThird line" }] });
    const { pages } = await readTextLayer(pdf);
    expect(pages[0]!.text).toBe("First line\nSecond line\nThird line");
  });

  it("separates header and footer lines from the body", async () => {
    const pdf = await buildPdf({
      pages: [{ header: "Journal of Testing 45 (2023) 1245", body: SAMPLE_BODY, footer: "Footer note" }],
    });
    const { pages } = await readTextLayer(pdf);
    expect(pages[0]!.headerLines).toEqual(["Journal of Testing 45 (2023) 1245"]);
    expect(pages[0]!.footerLines).toEqual(["Footer note"]);
  });

  it("reads a two-column page column by column instead of merging lines across columns", async () => {
    const pdf = await buildPdf({
      pages: [
        {
          header: "Full-width title of the article",
          leftColumn: "Left one.\nLeft two.\nLeft three.\nLeft four.",
          rightColumn: "Right one.\nRight two.\nRight three.\nRight four.",
        },
      ],
    });
    const { pages } = await readTextLayer(pdf);
    expect(pages[0]!.columns).toBe(2);
    expect(pages[0]!.text).toBe(
      [
        "Full-width title of the article",
        "Left one.",
        "Left two.",
        "Left three.",
        "Left four.",
        "Right one.",
        "Right two.",
        "Right three.",
        "Right four.",
      ].join("\n"),
    );
  });

  it("keeps rotated margin watermarks out of the page text", async () => {
    const pdf = await buildPdf({
      pages: [{ body: SAMPLE_BODY, watermark: "Downloaded from https://example.com on 01/01/2026" }],
    });
    const { pages } = await readTextLayer(pdf);
    expect(pages[0]!.text).not.toContain("Downloaded from");
    expect(pages[0]!.marginNotes.join(" ")).toContain("Downloaded from https://example.com");
    expect(pages[0]!.columns).toBe(1);
  });

  it("reads declared page labels", async () => {
    const pdf = await buildPdf({ pages: [{ body: SAMPLE_BODY }, { body: SAMPLE_BODY }], pageLabelStart: 1245 });
    const layer = await readTextLayer(pdf);
    expect(layer.pageLabels).toEqual(["1245", "1246"]);
  });

  it("returns null page labels when the PDF has none", async () => {
    const pdf = await buildPdf({ pages: [{ body: SAMPLE_BODY }] });
    expect((await readTextLayer(pdf)).pageLabels).toBeNull();
  });

  it("flags PDFs without a text layer as needing OCR", async () => {
    const scanned = await buildPdf({ pages: [{}, {}, {}] });
    const normal = await buildPdf({ pages: [{ body: SAMPLE_BODY }] });
    expect((await readTextLayer(scanned)).needsOcr).toBe(true);
    expect((await readTextLayer(normal)).needsOcr).toBe(false);
  });

  it("hashes the file bytes with SHA-256 and does not consume the input buffer", async () => {
    const pdf = await buildPdf({ pages: [{ body: SAMPLE_BODY }] });
    const before = sha256(pdf);
    const layer = await readTextLayer(pdf);
    expect(layer.fileHash).toBe(before);
    expect(layer.fileHash).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256(pdf)).toBe(before);
  });
});
