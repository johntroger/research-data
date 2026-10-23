import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { renderPageAsImage } from "unpdf";
import { describe, expect, it } from "vitest";
import { renderPdf } from "../synthetic/render.js";
import { applyOcr, loadTextLayer, ocrFilePath, ocrPaper, pagesNeedingOcr } from "./ocr.js";
import { readTextLayer, type PdfTextLayer } from "./text-layer.js";

const fakePage = (text: string) => ({ text, rowText: text, hasTextLayer: text.length > 50, columns: 1 as const, gutter: null }) as unknown as PdfTextLayer["pages"][number];
const fakeLayer = (texts: string[]): PdfTextLayer => ({ fileHash: "a".repeat(64), pageCount: texts.length, pages: texts.map(fakePage), pageLabels: null, needsOcr: false });

describe("OCR text for scanned pages", () => {
  it("picks the pages with (almost) no text of their own, ignoring a database licence line", () => {
    const footer = "Reproduced with permission of the copyright owner. Further reproduction prohibited without permission.";
    const layer = fakeLayer([footer, "x".repeat(600), `${footer}\nSome title`, "y".repeat(450)]);
    expect(pagesNeedingOcr(layer)).toEqual([0, 2]);
  });

  it("replaces the text of those pages only, and clears needsOcr when the scan is readable again", () => {
    const layer = { ...fakeLayer(["", "", "real text ".repeat(60)]), needsOcr: true };
    const out = applyOcr(layer, { engine: "t", scale: 3, pages: [{ index: 0, text: "Table 1  Price  0.45", confidence: 90 }, { index: 1, text: "More text here", confidence: 88 }] });
    expect(out.pages[0]!.text).toBe("Table 1 Price 0.45");
    expect(out.pages[0]!.hasTextLayer).toBe(true);
    expect(out.pages[2]!.text).toBe(layer.pages[2]!.text);
    expect(out.needsOcr).toBe(false);
    expect(applyOcr(layer, null)).toBe(layer);
  });

  it("recognises the words of a page that is only a picture, saves them, and loadTextLayer reads them back", async () => {
    // A page of text, drawn, then turned into a picture: the PDF has no text layer, like a scan.
    const text = await renderPdf({ title: "t", pages: [{ blocks: [{ kind: "text", lines: ["Perceived quality increased with price", "Willingness to buy was higher for the national brand"], size: 14 }] }] });
    const png = new Uint8Array(await renderPageAsImage(text, 1, { canvasImport: () => import("@napi-rs/canvas"), scale: 2 }));
    const doc = await PDFDocument.create();
    const image = await doc.embedPng(png);
    doc.addPage([595, 842]).drawImage(image, { x: 0, y: 0, width: 595, height: 842 });
    const scan = new Uint8Array(await doc.save());
    expect((await readTextLayer(scan)).pages[0]!.text.trim()).toBe("");

    const dir = await mkdtemp(path.join(os.tmpdir(), "ocr-"));
    try {
      const saved = await ocrPaper(scan, dir);
      expect(saved.pages).toEqual([0]);
      const layer = await loadTextLayer(scan, dir);
      expect(layer.pages[0]!.text.toLowerCase()).toContain("perceived quality increased with price");
      expect(layer.pages[0]!.text.toLowerCase()).toContain("national brand");
      expect(JSON.parse(await readFile(ocrFilePath(dir, layer.fileHash), "utf8")).pages).toHaveLength(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 120_000);
});
