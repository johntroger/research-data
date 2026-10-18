/**
 * Builds small synthetic PDFs for tests (self-made content, safe to commit).
 */
import { degrees, PDFDocument, PDFName, PDFNumber, StandardFonts, type PDFPage } from "pdf-lib";

export interface FixturePage {
  /** Body text drawn in the middle of the page (empty for an image-only page). */
  body?: string;
  /** Text drawn in the top margin, e.g. a running head with the page number. */
  header?: string;
  /** Text drawn in the bottom margin. */
  footer?: string;
  /** Two-column body: lines drawn in the left and right halves of the page. */
  leftColumn?: string;
  rightColumn?: string;
  /** Rotated text along the left margin, like publisher download watermarks. */
  watermark?: string;
}

export interface FixtureOptions {
  pages: FixturePage[];
  /** When set, the PDF declares /PageLabels as decimal numbers starting here. */
  pageLabelStart?: number;
}

const WIDTH = 595;
const HEIGHT = 842;

type Font = Awaited<ReturnType<PDFDocument["embedFont"]>>;

function drawBlock(page: PDFPage, text: string, y: number, font: Font, x = 60) {
  text.split("\n").forEach((line, i) => {
    page.drawText(line, { x, y: y - i * 14, size: 11, font });
  });
}

export async function buildPdf(options: FixtureOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const spec of options.pages) {
    const page = doc.addPage([WIDTH, HEIGHT]);
    if (spec.header) drawBlock(page, spec.header, HEIGHT - 30, font);
    if (spec.body) drawBlock(page, spec.body, HEIGHT / 2, font);
    if (spec.footer) drawBlock(page, spec.footer, 30, font);
    if (spec.leftColumn) drawBlock(page, spec.leftColumn, HEIGHT - 120, font, 50);
    if (spec.rightColumn) drawBlock(page, spec.rightColumn, HEIGHT - 120, font, WIDTH / 2 + 15);
    if (spec.watermark) {
      page.drawText(spec.watermark, { x: 20, y: 100, size: 7, font, rotate: degrees(90) });
    }
    const hasText = spec.body || spec.header || spec.footer || spec.leftColumn || spec.rightColumn;
    if (!hasText) {
      // Simulates a scanned page: graphics only, no text.
      page.drawRectangle({ x: 50, y: 50, width: WIDTH - 100, height: HEIGHT - 100, borderWidth: 1 });
    }
  }

  if (options.pageLabelStart !== undefined) {
    const style = doc.context.obj({ S: PDFName.of("D"), St: PDFNumber.of(options.pageLabelStart) });
    const nums = doc.context.obj([PDFNumber.of(0), style]);
    doc.catalog.set(PDFName.of("PageLabels"), doc.context.obj({ Nums: nums }));
  }

  return doc.save();
}

/** A body paragraph long enough to count as real text. */
export const SAMPLE_BODY =
  "Perceived risk had a significant negative effect on purchase intention\n(beta = -.31, p < .001), supporting H2.";
