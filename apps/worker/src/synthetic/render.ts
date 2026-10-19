/**
 * Renders synthetic papers (step 0.13) to PDF with pdf-lib. Only standard fonts are used so the
 * output is identical on every machine; text is therefore ASCII ("beta", "->", "<=").
 * The creation date is fixed, so the same spec always produces the same bytes.
 */
import { degrees, PDFDocument, PDFName, PDFNumber, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

export const PAGE_WIDTH = 595;
export const PAGE_HEIGHT = 842;
const MARGIN = 60;
const LINE = 14;

export type Block =
  /** Paragraph lines, drawn top-down from the current position. */
  | { kind: "text"; lines: string[]; size?: number; bold?: boolean }
  /** Two-column body: each side is a list of lines. */
  | { kind: "columns"; left: string[]; right: string[] }
  /** A table: each cell is drawn at its own x, so the text layer sees separate pieces like real PDFs. */
  | { kind: "table"; title: string; header: string[]; rows: string[][]; note?: string; widths: number[] }
  /** One line made of pieces with their own size and vertical shift (subscripts), optionally at a given x. */
  | { kind: "inline"; parts: { text: string; size: number; dy?: number; x?: number; mono?: boolean }[] }
  /** Graphics only (a table embedded as an image): no text layer. */
  | { kind: "image"; height: number };

export interface PageSpec {
  /** Running head drawn in the top margin. */
  header?: string;
  /** Running head in the top-right corner (journals alternate it with the left one). */
  headerRight?: string;
  footer?: string;
  /** Page number printed in the outer side margin (Emerald style). */
  side?: { text: string; at: "left" | "right" };
  /**
   * The blocks are drawn on a landscape page that is printed sideways on this portrait page (a wide table
   * turned a quarter circle, reading bottom to top), like journals do for big tables. Not for images.
   */
  sideways?: boolean | "down";
  /** Rotated download watermark along the left edge. */
  watermark?: string;
  blocks: Block[];
}

export interface RenderSpec {
  title: string;
  pages: PageSpec[];
  /** When set, the PDF declares /PageLabels as decimal numbers starting here. */
  pageLabelStart?: number;
}

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  /** Fixed width: equal-length lines are equally wide, like the justified columns of a journal. */
  mono: PDFFont;
}

/** What the blocks draw with: a real page, or a landscape frame turned onto a portrait page. */
type Canvas = Pick<PDFPage, "drawText" | "drawLine" | "drawRectangle">;

/** Landscape frame (842 wide, 595 high) turned onto the portrait page: text then reads upwards. */
function sidewaysCanvas(page: PDFPage, down: boolean): Canvas {
  // Turned the other way (text reads downwards), the frame is mirrored: glyph tops point right.
  const at = down ? (x: number, y: number) => ({ x: y, y: PAGE_HEIGHT - x }) : (x: number, y: number) => ({ x: PAGE_WIDTH - y, y: x });
  return {
    drawText: (text, options) => page.drawText(text, { ...options, ...at(options?.x ?? 0, options?.y ?? 0), rotate: degrees(down ? -90 : 90) }),
    drawLine: (options) => page.drawLine({ ...options, start: at(options.start.x, options.start.y), end: at(options.end.x, options.end.y) }),
    drawRectangle: () => {
      throw new Error("sideways pages cannot hold image blocks");
    },
  };
}

function drawBlock(page: Canvas, block: Block, y: number, fonts: Fonts): number {
  switch (block.kind) {
    case "text": {
      const size = block.size ?? 10;
      for (const line of block.lines) {
        page.drawText(line, { x: MARGIN, y, size, font: block.bold ? fonts.bold : fonts.regular });
        y -= size + 4;
      }
      return y - 6;
    }
    case "columns": {
      const rows = Math.max(block.left.length, block.right.length);
      for (let i = 0; i < rows; i++) {
        if (block.left[i]) page.drawText(block.left[i]!, { x: 45, y: y - i * LINE, size: 9, font: fonts.regular });
        if (block.right[i]) page.drawText(block.right[i]!, { x: PAGE_WIDTH / 2 + 12, y: y - i * LINE, size: 9, font: fonts.regular });
      }
      return y - rows * LINE - 8;
    }
    case "table": {
      page.drawText(block.title, { x: MARGIN, y, size: 9, font: fonts.bold });
      y -= LINE;
      page.drawLine({ start: { x: MARGIN, y: y + 10 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 10 }, thickness: 0.5 });
      const drawRow = (cells: string[], font: PDFFont) => {
        let x = MARGIN;
        cells.forEach((cell, i) => {
          if (cell) page.drawText(cell, { x, y, size: 9, font });
          x += block.widths[i] ?? 60;
        });
        y -= LINE;
      };
      drawRow(block.header, fonts.bold);
      for (const row of block.rows) drawRow(row, fonts.regular);
      page.drawLine({ start: { x: MARGIN, y: y + 10 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 10 }, thickness: 0.5 });
      if (block.note) {
        page.drawText(block.note, { x: MARGIN, y, size: 8, font: fonts.regular });
        y -= LINE;
      }
      return y - 8;
    }
    case "inline": {
      let x = MARGIN;
      for (const part of block.parts) {
        if (part.x !== undefined) x = part.x;
        const font = part.mono ? fonts.mono : fonts.regular;
        page.drawText(part.text, { x, y: y + (part.dy ?? 0), size: part.size, font });
        x += font.widthOfTextAtSize(part.text, part.size);
      }
      return y - LINE - 6;
    }
    case "image": {
      // A grid of rectangles, like a scanned or rasterised table.
      const rows = 6;
      const cell = block.height / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < 5; c++) {
          page.drawRectangle({ x: MARGIN + c * 95, y: y - (r + 1) * cell, width: 95, height: cell, borderWidth: 0.5 });
        }
      }
      return y - block.height - 10;
    }
  }
}

export async function renderPdf(spec: RenderSpec): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(spec.title);
  doc.setAuthor("Research Data synthetic fixture");
  doc.setProducer("research-data synthetic renderer");
  doc.setCreator("research-data");
  const fixed = new Date("2026-01-01T00:00:00Z");
  doc.setCreationDate(fixed);
  doc.setModificationDate(fixed);

  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    // Embedded only when a part asks for it, so documents without it stay byte for byte as committed.
    mono: spec.pages.some((p) => p.blocks.some((b) => b.kind === "inline" && b.parts.some((x) => x.mono)))
      ? await doc.embedFont(StandardFonts.Courier)
      : (undefined as unknown as PDFFont),
  };

  for (const pageSpec of spec.pages) {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    if (pageSpec.header) page.drawText(pageSpec.header, { x: MARGIN, y: PAGE_HEIGHT - 30, size: 8, font: fonts.regular });
    if (pageSpec.headerRight) {
      const x = PAGE_WIDTH - MARGIN - fonts.regular.widthOfTextAtSize(pageSpec.headerRight, 8);
      page.drawText(pageSpec.headerRight, { x, y: PAGE_HEIGHT - 30, size: 8, font: fonts.regular });
    }
    if (pageSpec.footer) page.drawText(pageSpec.footer, { x: MARGIN, y: 25, size: 8, font: fonts.regular });
    if (pageSpec.side) {
      const x = pageSpec.side.at === "right" ? PAGE_WIDTH - 40 : 18;
      page.drawText(pageSpec.side.text, { x, y: PAGE_HEIGHT * 0.77, size: 12, font: fonts.regular });
    }
    if (pageSpec.watermark) {
      page.drawText(pageSpec.watermark, { x: 15, y: 120, size: 6, font: fonts.regular, rotate: degrees(90) });
    }
    // A sideways page has the landscape frame's height (the portrait page's width) to draw in.
    let y = (pageSpec.sideways ? PAGE_WIDTH : PAGE_HEIGHT) - 70;
    const canvas = pageSpec.sideways ? sidewaysCanvas(page, pageSpec.sideways === "down") : page;
    for (const block of pageSpec.blocks) y = drawBlock(canvas, block, y, fonts);
  }

  if (spec.pageLabelStart !== undefined) {
    const style = doc.context.obj({ S: PDFName.of("D"), St: PDFNumber.of(spec.pageLabelStart) });
    doc.catalog.set(PDFName.of("PageLabels"), doc.context.obj({ Nums: doc.context.obj([PDFNumber.of(0), style]) }));
  }

  return doc.save({ useObjectStreams: false });
}
