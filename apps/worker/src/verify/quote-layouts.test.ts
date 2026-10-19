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
