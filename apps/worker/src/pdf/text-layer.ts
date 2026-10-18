import { createHash } from "node:crypto";
import { getDocumentProxy } from "unpdf";

/** Fraction of the page height treated as header (top) or footer (bottom). */
const MARGIN_RATIO = 0.08;

/** A page with fewer extracted characters than this is considered to have no usable text. */
const MIN_CHARS_PER_PAGE = 30;

/** Horizontal gap (in PDF points) that separates two segments on the same line, e.g. two columns. */
const SEGMENT_GAP = 12;

/** Distance from the page centre a segment must cross on both sides to count as full width. */
const CENTRE_TOLERANCE = 15;

export interface PageText {
  /** 0-based index of the page inside the PDF file. */
  pdfPageIndex: number;
  /** Page text in reading order (columns read one after another), lines separated by "\n". */
  text: string;
  charCount: number;
  /** Text lines found in the top margin of the page. */
  headerLines: string[];
  /** Text lines found in the bottom margin of the page. */
  footerLines: string[];
  /** Rotated text (e.g. "Downloaded from …" watermarks along the margin), kept out of `text`. */
  marginNotes: string[];
  /** Number of text columns detected on the page (1 or 2). */
  columns: 1 | 2;
}

export interface PdfTextLayer {
  /** SHA-256 of the file bytes, used as the paper's stable identity. */
  fileHash: string;
  pageCount: number;
  pages: PageText[];
  /** Page labels declared in the PDF (/PageLabels), or null when the PDF has none. */
  pageLabels: string[] | null;
  /** True when the PDF looks scanned (little or no text layer). */
  needsOcr: boolean;
}

interface PositionedText {
  str: string;
  x0: number;
  x1: number;
  y: number;
}

interface Segment {
  text: string;
  x0: number;
  x1: number;
  y: number;
}

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function normaliseSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Groups items into segments: items on the same line (same rounded y) are joined,
 * but a large horizontal gap starts a new segment, so two columns stay apart.
 */
function buildSegments(items: PositionedText[]): Segment[] {
  const byLine = new Map<number, PositionedText[]>();
  for (const item of items) {
    const key = Math.round(item.y);
    const bucket = byLine.get(key) ?? [];
    bucket.push(item);
    byLine.set(key, bucket);
  }

  const segments: Segment[] = [];
  for (const [y, lineItems] of byLine) {
    lineItems.sort((a, b) => a.x0 - b.x0);
    let current: PositionedText[] = [];
    const flush = () => {
      const text = normaliseSpaces(current.map((i) => i.str).join(" "));
      if (text) segments.push({ text, x0: current[0]!.x0, x1: Math.max(...current.map((i) => i.x1)), y });
      current = [];
    };
    for (const item of lineItems) {
      const last = current.at(-1);
      if (last && item.x0 - last.x1 > SEGMENT_GAP) flush();
      current.push(item);
    }
    if (current.length) flush();
  }
  return segments;
}

type Placement = "full" | "left" | "right";

function place(segment: Segment, centre: number): Placement {
  if (segment.x0 < centre - CENTRE_TOLERANCE && segment.x1 > centre + CENTRE_TOLERANCE) return "full";
  return segment.x1 <= centre + CENTRE_TOLERANCE ? "left" : "right";
}

/**
 * Orders segments for reading. Two-column pages are read as: full-width blocks above the
 * columns (title, abstract), the left column, the right column, then full-width blocks below
 * (footnotes). Single-column pages are read top to bottom.
 */
function orderForReading(segments: Segment[], pageWidth: number): { lines: Segment[]; columns: 1 | 2 } {
  const topDown = (a: Segment, b: Segment) => b.y - a.y || a.x0 - b.x0;
  const centre = pageWidth / 2;
  const placed = segments.map((s) => ({ s, p: place(s, centre) }));
  const left = placed.filter((x) => x.p === "left").map((x) => x.s);
  const right = placed.filter((x) => x.p === "right").map((x) => x.s);

  const isTwoColumn = left.length >= 3 && right.length >= 3 && (left.length + right.length) / segments.length >= 0.4;
  if (!isTwoColumn) return { lines: [...segments].sort(topDown), columns: 1 };

  const full = placed.filter((x) => x.p === "full").map((x) => x.s);
  const columnTop = Math.max(...left.map((s) => s.y), ...right.map((s) => s.y));
  const above = full.filter((s) => s.y > columnTop).sort(topDown);
  const below = full.filter((s) => s.y <= columnTop).sort(topDown);
  return { lines: [...above, ...left.sort(topDown), ...right.sort(topDown), ...below], columns: 2 };
}

/** Reads the text layer of a PDF page by page, plus page labels and header/footer lines. */
export async function readTextLayer(bytes: Uint8Array): Promise<PdfTextLayer> {
  const fileHash = sha256(bytes);
  // pdf.js may take ownership of the buffer, so give it a copy.
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const pages: PageText[] = [];

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const { width, height } = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    const items: PositionedText[] = [];
    const rotated: string[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const [a = 1, b = 0, c = 0, , e = 0, f = 0] = item.transform;
      // Rotated text (b or c non-zero, or a mirrored a) is margin furniture such as download watermarks.
      if (Math.abs(b) > 1e-3 || Math.abs(c) > 1e-3 || a < 0) {
        rotated.push(item.str);
        continue;
      }
      items.push({ str: item.str, x0: e, x1: e + item.width, y: f });
    }

    const segments = buildSegments(items);
    const inHeader = (s: Segment) => s.y >= height * (1 - MARGIN_RATIO);
    const inFooter = (s: Segment) => s.y <= height * MARGIN_RATIO;
    const topDown = (a: Segment, b: Segment) => b.y - a.y || a.x0 - b.x0;

    const { lines, columns } = orderForReading(segments, width);
    const text = lines.map((l) => l.text).join("\n");

    pages.push({
      pdfPageIndex: i,
      text,
      charCount: text.replace(/\s/g, "").length,
      headerLines: segments.filter(inHeader).sort(topDown).map((s) => s.text),
      footerLines: segments.filter(inFooter).sort(topDown).map((s) => s.text),
      marginNotes: rotated.length ? [normaliseSpaces(rotated.join(" "))] : [],
      columns,
    });
  }

  const rawLabels = await pdf.getPageLabels();
  const pageLabels = rawLabels && rawLabels.some((l) => l.length > 0) ? rawLabels : null;

  const emptyPages = pages.filter((p) => p.charCount < MIN_CHARS_PER_PAGE).length;
  const needsOcr = pages.length > 0 && emptyPages / pages.length > 0.5;

  await pdf.cleanup();
  return { fileHash, pageCount: pages.length, pages, pageLabels, needsOcr };
}
