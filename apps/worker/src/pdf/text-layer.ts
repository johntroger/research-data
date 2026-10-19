import { createHash } from "node:crypto";
import { getDocumentProxy } from "unpdf";

/** Fraction of the page height treated as header (top) or footer (bottom). */
const MARGIN_RATIO = 0.08;

/** Fraction of the page width treated as left or right side margin. */
const SIDE_MARGIN_RATIO = 0.12;

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
  /** Text in the left / right page margins, outside the body (e.g. Emerald prints page numbers there). */
  sideLines: string[];
  /** Rotated text (e.g. "Downloaded from …" watermarks along the margin), kept out of `text`. */
  marginNotes: string[];
  /** Number of text columns detected on the page (1 or 2). */
  columns: 1 | 2;
  /** False when the page has (almost) no extractable text, e.g. a table or figure embedded as an image. */
  hasTextLayer: boolean;
  /**
   * The page as visual rows: every piece at (about) the same height joined left to right, across
   * columns. Table rows come out whole here, while `text` has one line per cell (step 1.4).
   */
  rowText: string;
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
  /** Font size in points (0 when unknown). */
  size: number;
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

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/** Text noticeably smaller than the body text is treated as a subscript / superscript. */
const SMALL_TEXT_RATIO = 0.85;

/**
 * Groups items into segments: items on the same line (same rounded y) are joined,
 * but a large horizontal gap starts a new segment, so two columns stay apart.
 * Small text sitting slightly above or below a line (subscripts such as M<sub>age</sub>,
 * superscripts) is attached to that line instead of forming a line of its own.
 */
function buildSegments(items: PositionedText[]): Segment[] {
  const bodySize = median(items.map((i) => i.size).filter((s) => s > 0));
  const isSmall = (i: PositionedText) => bodySize > 0 && i.size > 0 && i.size < bodySize * SMALL_TEXT_RATIO;

  const byLine = new Map<number, PositionedText[]>();
  const add = (key: number, item: PositionedText) => {
    const bucket = byLine.get(key) ?? [];
    bucket.push(item);
    byLine.set(key, bucket);
  };
  for (const item of items) if (!isSmall(item)) add(Math.round(item.y), item);

  for (const item of items) {
    if (!isSmall(item)) continue;
    // Nearest body line within 0.7 × body font size vertically that is horizontally close.
    let best: { key: number; distance: number } | null = null;
    for (const [key, lineItems] of byLine) {
      const distance = Math.abs(key - item.y);
      if (distance > bodySize * 0.7) continue;
      const near = lineItems.some((l) => item.x0 >= l.x0 - SEGMENT_GAP && item.x0 <= l.x1 + SEGMENT_GAP);
      if (near && (!best || distance < best.distance)) best = { key, distance };
    }
    add(best ? best.key : Math.round(item.y), item);
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

/** Widest a table cell can be (as a share of the page width); column lines are wider. */
const TABLE_CELL_MAX_WIDTH = 0.35;
const NARROW_CELL_MAX_WIDTH = 0.2;
/** x-distance (points) within which line starts count as one column edge. */
const ALIGN_TOLERANCE = 3;

/**
 * Segments of table rows that cross the page centre: three or more short cells on one line.
 * They are kept as full-width lines so a table on a single-column page is not mistaken for columns.
 */
function tableRowSegments(segments: Segment[], pageWidth: number): Set<Segment> {
  const centre = pageWidth / 2;
  const byY = new Map<number, Segment[]>();
  for (const s of segments) byY.set(s.y, [...(byY.get(s.y) ?? []), s]);
  const rows = new Set<Segment>();
  for (const line of byY.values()) {
    if (line.length < 3) continue;
    const crossesCentre =
      Math.min(...line.map((s) => s.x0)) < centre - CENTRE_TOLERANCE &&
      Math.max(...line.map((s) => s.x1)) > centre + CENTRE_TOLERANCE;
    // Three pieces can also be a column line beside a section heading ("3.3", "The … dimension"),
    // so a three-cell row needs narrow cells; four or more pieces on one line are a table.
    const maxWidth = pageWidth * (line.length >= 4 ? TABLE_CELL_MAX_WIDTH : NARROW_CELL_MAX_WIDTH);
    if (crossesCentre && line.every((s) => s.x1 - s.x0 < maxWidth)) {
      for (const s of line) rows.add(s);
    }
  }
  return rows;
}

/** Number of lines where a left and a right segment sit at the same height. */
function sideBySide(left: Segment[], right: Segment[]): number {
  const rightYs = new Set(right.map((s) => s.y));
  return new Set(left.filter((s) => rightYs.has(s.y)).map((s) => s.y)).size;
}

/** True when most segments start at the same x (a column edge). */
function aligned(segments: Segment[]): boolean {
  const starts = segments.map((s) => s.x0);
  const best = Math.max(...starts.map((x) => starts.filter((o) => Math.abs(o - x) <= ALIGN_TOLERANCE).length));
  return best >= Math.max(2, Math.ceil(segments.length * 0.6));
}

function place(segment: Segment, centre: number): Placement {
  if (segment.x0 < centre - CENTRE_TOLERANCE && segment.x1 > centre + CENTRE_TOLERANCE) return "full";
  return segment.x1 <= centre + CENTRE_TOLERANCE ? "left" : "right";
}

/**
 * Orders segments for reading. Two-column pages are read as: full-width blocks above the
 * columns (title, abstract), the left column, the right column, then full-width blocks below
 * (footnotes). Single-column pages are read top to bottom. Table rows across the page centre
 * only decide whether the page has columns; they never count as column text.
 */
function orderForReading(segments: Segment[], pageWidth: number): { lines: Segment[]; columns: 1 | 2 } {
  const topDown = (a: Segment, b: Segment) => b.y - a.y || a.x0 - b.x0;
  const centre = pageWidth / 2;
  const tableRows = tableRowSegments(segments, pageWidth);
  const placed = segments.map((s) => ({ s, p: tableRows.has(s) ? ("full" as const) : place(s, centre) }));
  const left = placed.filter((x) => x.p === "left").map((x) => x.s);
  const right = placed.filter((x) => x.p === "right").map((x) => x.s);

  // Table rows do not count against the columns: a table often sits above two-column text.
  const share = (left.length + right.length) / Math.max(1, segments.length - tableRows.size);
  const isTwoColumn =
    share >= 0.4 &&
    ((left.length >= 3 && right.length >= 3) ||
      // A short two-column page (the end of an article): lines side by side, each column aligned.
      (left.length >= 2 && right.length >= 2 && sideBySide(left, right) >= 2 && aligned(left) && aligned(right)));
  if (!isTwoColumn) return { lines: [...segments].sort(topDown), columns: 1 };

  // Reading order of two-column pages is unchanged: table cells follow their side of the page.
  const sides = segments.map((s) => ({ s, p: place(s, centre) }));
  const full = sides.filter((x) => x.p === "full").map((x) => x.s);
  const leftSide = sides.filter((x) => x.p === "left").map((x) => x.s);
  const rightSide = sides.filter((x) => x.p === "right").map((x) => x.s);
  const columnTop = Math.max(...leftSide.map((s) => s.y), ...rightSide.map((s) => s.y));
  const above = full.filter((s) => s.y > columnTop).sort(topDown);
  const below = full.filter((s) => s.y <= columnTop).sort(topDown);
  return { lines: [...above, ...leftSide.sort(topDown), ...rightSide.sort(topDown), ...below], columns: 2 };
}

/** Vertical distance (points) within which pieces count as one visual row (cells set on slightly different baselines). */
const ROW_TOLERANCE = 2.5;

/** Groups segments into visual rows, top to bottom, each row read left to right. */
function visualRows(segments: Segment[]): string[] {
  const sorted = [...segments].sort((a, b) => b.y - a.y);
  const rows: Segment[][] = [];
  for (const s of sorted) {
    const row = rows.at(-1);
    if (row && row[0]!.y - s.y <= ROW_TOLERANCE) row.push(s);
    else rows.push([s]);
  }
  return rows.map((row) => row.sort((a, b) => a.x0 - b.x0).map((s) => s.text).join(" "));
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
      const [a = 1, b = 0, c = 0, d = 0, e = 0, f = 0] = item.transform;
      // Rotated text (b or c non-zero, or a mirrored a) is margin furniture such as download watermarks.
      if (Math.abs(b) > 1e-3 || Math.abs(c) > 1e-3 || a < 0) {
        rotated.push(item.str);
        continue;
      }
      items.push({ str: item.str, x0: e, x1: e + item.width, y: f, size: Math.abs(d) || item.height || 0 });
    }

    const segments = buildSegments(items);
    const inHeader = (s: Segment) => s.y >= height * (1 - MARGIN_RATIO);
    const inFooter = (s: Segment) => s.y <= height * MARGIN_RATIO;
    const inSideMargin = (s: Segment) =>
      !inHeader(s) && !inFooter(s) && (s.x1 <= width * SIDE_MARGIN_RATIO || s.x0 >= width * (1 - SIDE_MARGIN_RATIO));
    const topDown = (a: Segment, b: Segment) => b.y - a.y || a.x0 - b.x0;

    const { lines, columns } = orderForReading(segments, width);
    const text = lines.map((l) => l.text).join("\n");
    const rowText = visualRows(segments).join("\n");

    pages.push({
      pdfPageIndex: i,
      text,
      charCount: text.replace(/\s/g, "").length,
      headerLines: segments.filter(inHeader).sort(topDown).map((s) => s.text),
      footerLines: segments.filter(inFooter).sort(topDown).map((s) => s.text),
      sideLines: segments.filter(inSideMargin).sort(topDown).map((s) => s.text),
      marginNotes: rotated.length ? [normaliseSpaces(rotated.join(" "))] : [],
      columns,
      hasTextLayer: text.replace(/\s/g, "").length >= MIN_CHARS_PER_PAGE,
      rowText,
    });
  }

  const rawLabels = await pdf.getPageLabels();
  const pageLabels = rawLabels && rawLabels.some((l) => l.length > 0) ? rawLabels : null;

  const emptyPages = pages.filter((p) => p.charCount < MIN_CHARS_PER_PAGE).length;
  const needsOcr = pages.length > 0 && emptyPages / pages.length > 0.5;

  await pdf.cleanup();
  return { fileHash, pageCount: pages.length, pages, pageLabels, needsOcr };
}
