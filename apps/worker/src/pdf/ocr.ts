/**
 * OCR for scanned papers (no text layer), run on this machine with tesseract.js and @napi-rs/canvas: nothing to install
 * system-wide and nothing leaves the computer. The text of each OCR'd page is saved next to the saved extraction
 * (\`<hash16>.ocr.json\`) and read back by \`loadTextLayer\`, so the checks, the packets and the web all see the same text.
 * OCR text has no positions, so a scanned paper gets no yellow frame in the PDF viewer (the web says so).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { renderPageAsImage } from "unpdf";
import { readTextLayer, type PdfTextLayer } from "./text-layer.js";

export interface OcrPage {
  /** 0-based page index. */
  index: number;
  /** The recognised text, one line per printed line. */
  text: string;
  confidence: number;
}

export interface OcrFile {
  engine: string;
  /** Render scale used (1 = 72 dpi). */
  scale: number;
  pages: OcrPage[];
}

export const ocrFilePath = (extractedDir: string, fileHash: string) => path.join(extractedDir, `${fileHash.slice(0, 16)}.ocr.json`);

/** Database exports put a licence line on every page of a scan; it is not the text of the paper. */
const FOOTER = /reproduced with permission of the copyright owner\.?\s*further reproduction prohibited without permission\.?/gi;

/** Pages whose text layer holds (almost) no text of the paper: those are the pages to OCR. */
export function pagesNeedingOcr(layer: PdfTextLayer, minChars = 400): number[] {
  return layer.pages.flatMap((p, i) => (p.text.replace(FOOTER, "").replace(/\s+/g, " ").trim().length < minChars ? [i] : []));
}

/** The layer with the OCR text in the pages that have it; a scan that is now fully readable no longer needs OCR. */
export function applyOcr(layer: PdfTextLayer, ocr: OcrFile | null): PdfTextLayer {
  if (!ocr || ocr.pages.length === 0) return layer;
  const byIndex = new Map(ocr.pages.map((p) => [p.index, p]));
  const pages = layer.pages.map((page, i) => {
    const o = byIndex.get(i);
    if (!o) return page;
    const text = o.text.replace(/[ \t]+/g, " ").trim();
    return { ...page, text, rowText: text, hasTextLayer: text.length > 0, columns: 1 as const, gutter: null };
  });
  const stillEmpty = pages.filter((p) => !p.hasTextLayer).length;
  return { ...layer, pages, needsOcr: pages.length > 0 && stillEmpty / pages.length > 0.5 };
}

/** The text layer of a PDF, with the saved OCR text applied when the paper has an OCR file. */
export async function loadTextLayer(pdf: Uint8Array, extractedDir: string): Promise<PdfTextLayer> {
  const layer = await readTextLayer(pdf);
  const ocr = await readFile(ocrFilePath(extractedDir, layer.fileHash), "utf8").then((t) => JSON.parse(t) as OcrFile, () => null);
  return applyOcr(layer, ocr);
}

/** Recognises the given pages (0-based) of the PDF. Slow: about 5 to 15 seconds a page. */
export async function ocrPages(pdf: Uint8Array, indexes: number[], options: { scale?: number; onPage?: (index: number, chars: number) => void } = {}): Promise<OcrFile> {
  const scale = options.scale ?? 3;
  const { createWorker } = await import("tesseract.js");
  const require = createRequire(import.meta.url);
  const langPath = path.join(path.dirname(require.resolve("@tesseract.js-data/eng/package.json")), "4.0.0_best_int");
  const worker = await createWorker("eng", 1, { langPath, cachePath: path.join(langPath, ".."), gzip: true });
  try {
    await worker.setParameters({ preserve_interword_spaces: "1" });
    const pages: OcrPage[] = [];
    for (const index of indexes) {
      const png = await renderPageAsImage(new Uint8Array(pdf), index + 1, { canvasImport: () => import("@napi-rs/canvas"), scale });
      const { data } = await worker.recognize(Buffer.from(png));
      pages.push({ index, text: data.text.replace(/\r/g, "").trim(), confidence: Math.round(data.confidence) });
      options.onPage?.(index, data.text.length);
    }
    return { engine: "tesseract.js 4.0.0_best_int eng", scale, pages };
  } finally {
    await worker.terminate();
  }
}

/** OCRs the pages of a paper that have no text of their own and saves the result next to the saved extraction. */
export async function ocrPaper(pdf: Uint8Array, extractedDir: string, options: { onPage?: (index: number, chars: number) => void } = {}): Promise<{ file: string; pages: number[] }> {
  const layer = await readTextLayer(pdf);
  const indexes = pagesNeedingOcr(layer);
  if (indexes.length === 0) throw new Error("The PDF has a text layer on every page; nothing to OCR");
  const ocr = await ocrPages(pdf, indexes, options);
  await mkdir(extractedDir, { recursive: true });
  const file = ocrFilePath(extractedDir, layer.fileHash);
  await writeFile(file, `${JSON.stringify(ocr)}\n`);
  return { file, pages: indexes };
}
