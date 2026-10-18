/**
 * Prints what the worker reads from a PDF's text layer.
 * Usage: pnpm pdf:inspect [file.pdf ...]   (default: every PDF in raw_papers/)
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { resolvePrintedPages } from "../pdf/printed-page.js";
import { readTextLayer } from "../pdf/text-layer.js";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const RAW_PAPERS = path.join(ROOT, "raw_papers");
const PREVIEW_CHARS = 90;

async function listPdfs(args: string[]): Promise<string[]> {
  if (args.length > 0) return args.map((a) => path.resolve(a));
  const entries = await readdir(RAW_PAPERS).catch(() => [] as string[]);
  return entries.filter((f) => f.toLowerCase().endsWith(".pdf")).map((f) => path.join(RAW_PAPERS, f));
}

function preview(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > PREVIEW_CHARS ? `${flat.slice(0, PREVIEW_CHARS)}…` : flat;
}

async function inspect(file: string): Promise<void> {
  const layer = await readTextLayer(new Uint8Array(await readFile(file)));
  const printed = resolvePrintedPages(layer);

  console.log(`\n=== ${path.basename(file)}`);
  console.log(`SHA-256        : ${layer.fileHash}`);
  console.log(`Số trang PDF   : ${layer.pageCount}`);
  console.log(`PageLabels     : ${layer.pageLabels ? layer.pageLabels.join(", ") : "(không có)"}`);
  console.log(`Trang in       : ${printed.printedPages.join(", ")}  [cách xác định: ${printed.method}]`);
  console.log(`Cần OCR        : ${layer.needsOcr ? "CÓ (PDF scan / không có text layer)" : "không"}`);
  for (const page of layer.pages) {
    const label = printed.printedPages[page.pdfPageIndex] ?? "?";
    console.log(
      `  PDF ${String(page.pdfPageIndex + 1).padStart(2)} → trang in ${label.padEnd(6)} ${String(page.charCount).padStart(6)} ký tự | ${preview(page.text)}`,
    );
  }
}

const files = await listPdfs(process.argv.slice(2));
if (files.length === 0) {
  console.log(`Không tìm thấy PDF nào. Hãy chép file vào ${RAW_PAPERS} hoặc truyền đường dẫn file.`);
  process.exitCode = 1;
} else {
  for (const file of files) await inspect(file);
}
