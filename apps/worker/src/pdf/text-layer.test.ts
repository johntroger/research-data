import { describe, expect, it } from "vitest";
import { renderPdf } from "../synthetic/render.js";
import { buildPdf, SAMPLE_BODY } from "./test-fixtures.js";
import { readTextLayer, sha256 } from "./text-layer.js";

describe("column detection (step 0.13b)", () => {
  const left = ["Left column line one about trust", "Left column line two about value", "Left column line three"];
  const right = ["Right column line one on loyalty", "Right column line two on intention", "Right column line three"];

  it("keeps column reading order when a column line sits beside a section heading", async () => {
    // Three pieces on one line across the centre, like Montecchi et al. (2024) p. 6.
    const pdf = await renderPdf({
      title: "t",
      pages: [
        {
          blocks: [
            { kind: "columns", left, right },
            {
              kind: "inline",
              parts: [
                { text: "consumers experience transparency in relation to brands.", size: 9, x: 45 },
                { text: "3.3", size: 9, x: 310 },
                { text: "The comprehensibility dimension", size: 9, x: 335 },
              ],
            },
            { kind: "columns", left, right },
          ],
        },
      ],
    });
    const { pages } = await readTextLayer(pdf);
    expect(pages[0]!.columns).toBe(2);
    const text = pages[0]!.text;
    expect(text.indexOf("consumers experience")).toBeLessThan(text.indexOf("Right column line one"));
  });

  it("reads a full-width table on a single-column page row by row", async () => {
    const pdf = await renderPdf({
      title: "t",
      pages: [
        {
          blocks: [
            { kind: "text", lines: ["A single-column paragraph introduces the table below."] },
            {
              kind: "table",
              title: "Table 1. Results",
              header: ["Path", "beta", "t", "p", "Result"],
              widths: [200, 60, 60, 60, 80],
              rows: [
                ["A -> B", "0.42", "8.40", "< .001", "Supported"],
                ["B -> C", "0.35", "6.10", "< .001", "Supported"],
                ["A -> C", "0.08", "1.21", ".23", "Not supported"],
              ],
            },
          ],
        },
      ],
    });
    const { pages } = await readTextLayer(pdf);
    expect(pages[0]!.columns).toBe(1);
    const lines = pages[0]!.text.split("\n");
    expect(lines.indexOf("0.42")).toBeLessThan(lines.indexOf("B -> C"));
    expect(lines.indexOf("Supported")).toBeLessThan(lines.indexOf("B -> C"));
  });

  it("detects a short two-column page with two lines per column", async () => {
    const pdf = await renderPdf({
      title: "t",
      pages: [{ blocks: [{ kind: "columns", left: left.slice(0, 2), right: right.slice(0, 2) }] }],
    });
    const { pages } = await readTextLayer(pdf);
    expect(pages[0]!.columns).toBe(2);
    expect(pages[0]!.text.split("\n")).toEqual([...left.slice(0, 2), ...right.slice(0, 2)]);
  });

  it("does not split a single-column page whose lines merely differ in length", async () => {
    const pdf = await renderPdf({
      title: "t",
      pages: [{ blocks: [{ kind: "text", lines: ["Short.", "A much longer line that runs across the centre of the page.", "End."] }] }],
    });
    expect((await readTextLayer(pdf)).pages[0]!.columns).toBe(1);
  });
});

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

  it("keeps subscripts on their own line (M with subscript 'brand familiarity')", async () => {
    const pdf = await buildPdf({
      pages: [
        {
          body: SAMPLE_BODY,
          inline: {
            y: 300,
            parts: [
              { text: "indicated low brand familiarity (M", size: 11 },
              { text: "brand familiarity", size: 7, dy: -3 },
              { text: " <= 2) were removed.", size: 11 },
            ],
          },
        },
      ],
    });
    const { pages } = await readTextLayer(pdf);
    expect(pages[0]!.text).toContain("indicated low brand familiarity (M brand familiarity <= 2) were removed.");
    expect(pages[0]!.text.split("\n")).not.toContain("brand familiarity");
  });

  it("flags pages without a text layer individually", async () => {
    const { pages } = await readTextLayer(await buildPdf({ pages: [{ body: SAMPLE_BODY }, {}] }));
    expect(pages.map((p) => p.hasTextLayer)).toEqual([true, false]);
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
