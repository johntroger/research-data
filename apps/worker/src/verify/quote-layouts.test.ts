/**
 * Quote and number matching on layouts the real-paper runs showed (step 1.4): table rows that the
 * reading order splits, passages across a page break, and signs set in a symbol font.
 */
import { describe, expect, it } from "vitest";
import { readTextLayer } from "../pdf/text-layer.js";
import { renderPdf } from "../synthetic/render.js";
import { verifyNumber } from "./number.js";
import { verifyQuote } from "./quote.js";

const prose = ["Left column text about brand trust", "and more left column text here", "the left column ends now"];
const right = ["Right column text about loyalty", "and more right column text here", "the right column ends now"];

describe("quotes on difficult layouts", () => {
  it("finds a table row whose cells fall on both sides of a two-column page", async () => {
    const pdf = await renderPdf({
      title: "t",
      pages: [
        {
          blocks: [
            { kind: "columns", left: prose, right },
            // Two cells per row: the reading order puts the left cells first, then the right ones.
            { kind: "inline", parts: [{ text: "H1 Trust -> Loyalty", size: 9, x: 45 }, { text: "0.42 Supported", size: 9, x: 330 }] },
            { kind: "inline", parts: [{ text: "H2 Value -> Loyalty", size: 9, x: 45 }, { text: "0.17 Rejected", size: 9, x: 330 }] },
          ],
        },
      ],
    });
    const layer = await readTextLayer(pdf);
    expect(layer.pages[0]!.columns).toBe(2);
    expect(layer.pages[0]!.text).not.toContain("H1 Trust -> Loyalty\n0.42"); // split apart in reading order
    expect(verifyQuote(layer, "H1 Trust -> Loyalty 0.42 Supported", 1).match).toBe("exact");
    expect(verifyQuote(layer, "H2 Value -> Loyalty 0.17 Rejected", 1).match).toBe("exact");
  });

  it("finds a passage that runs over a page break, even with a running title in the margin", async () => {
    const pdf = await renderPdf({
      title: "t",
      pages: [
        { blocks: [{ kind: "text", lines: ["Our model fits the data well.", "Third, this study"] }] },
        {
          side: { text: "Green trust", at: "right" },
          blocks: [{ kind: "text", lines: ["relies on cross-sectional data from one country", "so causal claims remain limited.", "Fourth, the sample is young."] }],
        },
      ],
    });
    const layer = await readTextLayer(pdf);
    const quote = "Third, this study relies on cross-sectional data from one country so causal claims remain limited.";
    const check = verifyQuote(layer, quote, 1);
    expect(check.foundOnPage).toBe(1);
    expect(["exact", "fuzzy"]).toContain(check.match);
  });

  it("still credits a passage wholly on the next page to that page", async () => {
    const pdf = await renderPdf({
      title: "t",
      pages: [
        { blocks: [{ kind: "text", lines: ["Our model fits the data well."] }] },
        { blocks: [{ kind: "text", lines: ["Fourth, the sample is young and mostly female."] }] },
      ],
    });
    const check = verifyQuote(await readTextLayer(pdf), "Fourth, the sample is young and mostly female.", 1);
    expect(check).toMatchObject({ match: "neighbour_page", foundOnPage: 2 });
  });

  it("reads signs set in a symbol font (minus printed as '2', p note as 'p , 0 : 05')", async () => {
    const pdf = await renderPdf({
      title: "t",
      pages: [
        {
          blocks: [
            { kind: "text", lines: ["Table 2. Correlations"] },
            { kind: "table", title: "Table 2.", header: ["", "A", "B"], widths: [150, 60, 60], rows: [["B. Risk", "2 0.358 *", ""]] },
            { kind: "text", lines: ["Notes: * p , 0 : 05"] },
          ],
        },
      ],
    });
    const layer = await readTextLayer(pdf);
    expect(verifyNumber(layer, -0.358, 1).found).toBe(true);
    expect(verifyNumber(layer, 0.358, 1).found).toBe(true);
  });
});

describe("narrow gutter and symbol fonts in a Sage-style two-column paper (step 1.9b)", () => {
  // Left column ends at x = 301, right column starts at x = 313: a gutter of 11.9 pt, just under the 12 pt
  // that used to join runs on one line.
  // Courier at 9 pt is 5.4 pt per character, so lines of 44 characters are all 237.6 pt wide, like a justified column.
  const WORDS = "brand trust loyalty value risk intention green purchase ethics attitude consumer engagement".split(" ");
  const column = (prefix: string, rows: number) =>
    Array.from({ length: rows }, (_, row) => {
      let text = `${prefix}${row + 1} `;
      for (let w = row; text.length < 44; w++) text += `${WORDS[w % WORDS.length]} `;
      return { text: text.slice(0, 43).trimEnd().padEnd(44, "."), width: 44 * 5.4 };
    });

  it("keeps the two columns apart when the gutter is under 12 pt", async () => {
    const left = column("L", 12);
    const right = column("R", 12);
    // The right column starts 11.9 pt after the end of every left line (just under the 12 pt that used to glue them).
    const rightX = 62 + 44 * 5.4 + 11.9;
    const lines = left.map((l, i) => ({
      kind: "inline" as const,
      parts: [
        { text: l.text, size: 9, x: 62, mono: true },
        { text: right[i]!.text, size: 9, x: rightX, mono: true },
      ],
    }));
    const pdf = await renderPdf({ title: "t", pages: [{ blocks: lines }] });
    const layer = await readTextLayer(pdf);
    const page = layer.pages[0]!;
    expect(page.gutter).not.toBeNull();
    expect(page.columns).toBe(2);
    const text = page.text;
    // Reading order: the whole left column, then the whole right column.
    expect(text.indexOf(left[11]!.text)).toBeLessThan(text.indexOf(right[0]!.text));
    expect(page.text.split("\n")).toContain(left[3]!.text); // every row is its own line, not left + right glued
    expect(verifyQuote(layer, `${left[4]!.text} ${left[5]!.text}`, 1).match).toBe("exact");
    expect(verifyQuote(layer, `${right[4]!.text} ${right[5]!.text}`, 1).match).toBe("exact");
  });

  it("puts a running head in the top-right corner before both columns, not between them", async () => {
    const left = column("L", 12);
    const right = column("R", 12);
    const rightX = 62 + 44 * 5.4 + 11.9;
    const lines = left.map((l, i) => ({
      kind: "inline" as const,
      parts: [
        { text: l.text, size: 9, x: 62, mono: true },
        { text: right[i]!.text, size: 9, x: rightX, mono: true },
      ],
    }));
    const pdf = await renderPdf({ title: "t", pages: [{ header: "442", headerRight: "VAN BERLO AND BOCK", blocks: lines }] });
    const layer = await readTextLayer(pdf);
    const text = layer.pages[0]!.text.split("\n");
    const head = text.indexOf("VAN BERLO AND BOCK");
    expect(head).toBeGreaterThanOrEqual(0);
    expect(head).toBeLessThan(text.indexOf(left[0]!.text)); // before the left column
    // The last line of the left column is followed directly by the first line of the right one.
    expect(text.indexOf(right[0]!.text)).toBe(text.indexOf(left[11]!.text) + 1);
    expect(layer.pages[0]!.headerLines).toContain("VAN BERLO AND BOCK");
  });

  it("finds no gutter on a single-column page", async () => {
    const pdf = await renderPdf({ title: "t", pages: [{ blocks: [{ kind: "text", lines: Array.from({ length: 30 }, (_, i) => `Line ${i} of a long single column paragraph that runs well across the middle of the page`) }] }] });
    const layer = await readTextLayer(pdf);
    expect(layer.pages[0]!.gutter).toBeNull();
    expect(layer.pages[0]!.columns).toBe(1);
  });

  it("reads minus signs stored as '2' in a confidence interval", async () => {
    const pdf = await renderPdf({
      title: "t",
      pages: [{ blocks: [{ kind: "text", lines: ["Omission 2 0.47 (0.11) [ 2 0.79 to 2 0.14] 2 0.97 (0.20) [ 2 0.49 to 0.30]"] }] }],
    });
    const layer = await readTextLayer(pdf);
    expect(verifyNumber(layer, -0.47, 1).found).toBe(true);
    expect(verifyNumber(layer, -0.79, 1).found).toBe(true);
    expect(verifyNumber(layer, -0.14, 1).found).toBe(true);
    expect(verifyNumber(layer, -0.49, 1).found).toBe(true);
    expect(verifyNumber(layer, 0.3, 1).found).toBe(true);
  });
});
