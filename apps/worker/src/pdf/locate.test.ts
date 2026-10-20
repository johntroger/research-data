import { describe, expect, it } from "vitest";
import { PAGE_HEIGHT, PAGE_WIDTH, renderPdf, type PageSpec } from "../synthetic/render.js";
import { locateQuote, readPageItems, type Rect } from "./locate.js";

async function locate(pages: PageSpec[], quote: string, citedPage: number) {
  const bytes = await renderPdf({ title: "t", pages });
  return locateQuote(await readPageItems(bytes), quote, citedPage);
}

const inside = (r: Rect) => r[0] >= 0 && r[1] >= 0 && r[2] <= PAGE_WIDTH && r[3] <= PAGE_HEIGHT && r[2] > r[0] && r[3] > r[1];

describe("locating a quote on its page (step 3a.3)", () => {
  const body: PageSpec = {
    blocks: [
      { kind: "text", lines: ["Introduction", "Brand trust increases loyalty among young consumers (beta = .31, p < .001)."] },
      { kind: "text", lines: ["A second paragraph about satisfaction and intention to repurchase the brand."] },
    ],
  };

  it("boxes a single line quote, only the part that is quoted", async () => {
    const h = await locate([body], "Brand trust increases loyalty among young consumers", 1);
    expect(h?.page).toBe(1);
    expect(h?.rects).toHaveLength(1);
    const full = await locate([body], "Brand trust increases loyalty among young consumers (beta = .31, p < .001).", 1);
    expect(h!.rects[0]![2]).toBeLessThan(full!.rects[0]![2]);
    expect(inside(h!.rects[0]!)).toBe(true);
  });

  it("boxes a quote over two lines as two boxes", async () => {
    const page: PageSpec = { blocks: [{ kind: "text", lines: ["trust increases loyalty among", "young consumers in every sample"] }] };
    const h = await locate([page], "loyalty among young consumers", 1);
    expect(h?.rects).toHaveLength(2);
    expect(h!.rects[0]![1]).toBeGreaterThan(h!.rects[1]![1]);
  });

  it("ignores case and punctuation, and joins a word split by a hyphen at the end of a line", async () => {
    const page: PageSpec = { blocks: [{ kind: "text", lines: ["Participants described the experi-", "ence of being targeted by ads."] }] };
    const h = await locate([page], "described the experience of being targeted", 1);
    expect(h?.rects).toHaveLength(2);
  });

  it("finds a table row as one box", async () => {
    const page: PageSpec = {
      blocks: [{ kind: "table", title: "Table 2", header: ["Path", "Beta", "p"], rows: [["Trust to Loyalty", "0.31", "<.001"], ["Value to Loyalty", "0.22", ".004"]], widths: [150, 80, 80] }],
    };
    const h = await locate([page], "Value to Loyalty 0.22 .004", 1);
    expect(h?.rects).toHaveLength(1);
  });

  it("follows the column on a two-column page", async () => {
    const left = Array.from({ length: 12 }, (_, i) => `Left column line ${i} about trust and value`);
    const right = Array.from({ length: 12 }, (_, i) => `Right column line ${i} on loyalty and intention`);
    const page: PageSpec = { blocks: [{ kind: "columns", left, right }] };
    // The quote runs down the right column, which is not how the text sits line by line across the page.
    const h = await locate([page], "Right column line 3 on loyalty and intention Right column line 4 on loyalty and intention", 1);
    expect(h?.rects).toHaveLength(2);
    expect(h!.rects[0]![0]).toBeGreaterThan(PAGE_WIDTH / 2);
  });

  it("boxes text turned sideways as tall, narrow boxes", async () => {
    const page: PageSpec = {
      sideways: true,
      blocks: [{ kind: "table", title: "Table 5", header: ["Construct", "Alpha", "CR"], rows: [["Brand trust", ".86", ".90"], ["Loyalty", ".91", ".93"]], widths: [200, 100, 100] }],
    };
    const h = await locate([page], "Loyalty .91 .93", 1);
    expect(h?.rects).toHaveLength(1);
    const [x0, y0, x1, y1] = h!.rects[0]!;
    expect(y1 - y0).toBeGreaterThan(x1 - x0);
  });

  it("tolerates one wrong word in a long quote (near match)", async () => {
    const h = await locate([body], "A second paragraph about satisfaction and intention to repurchase the product.", 1);
    expect(h?.page).toBe(1);
    expect(h?.rects.length).toBeGreaterThan(0);
  });

  it("looks on the neighbouring page when the citation is one page off", async () => {
    const other: PageSpec = { blocks: [{ kind: "text", lines: ["Nothing relevant here at all."] }] };
    const h = await locate([other, body], "Brand trust increases loyalty among young consumers", 1);
    expect(h?.page).toBe(2);
  });

  it("gives null, never a guess, when the quote is not on the page or next to it", async () => {
    const other: PageSpec = { blocks: [{ kind: "text", lines: ["Nothing relevant here at all."] }] };
    expect(await locate([body, other, other, other], "Employees reported lower burnout after the intervention", 1)).toBeNull();
    expect(await locate([other, other, other, body], "Brand trust increases loyalty among young consumers", 1)).toBeNull();
    expect(await locate([body], "", 1)).toBeNull();
  });
});
