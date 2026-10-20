import { describe, expect, it } from "vitest";
import { readTextLayer } from "../pdf/text-layer.js";
import { type PageSpec, renderPdf } from "../synthetic/render.js";
import { findRowQuote } from "./row-quote.js";

async function layerOf(pages: PageSpec[]) {
  return readTextLayer(await renderPdf({ title: "t", pages }));
}

const matrix: PageSpec = {
  blocks: [
    {
      kind: "table",
      title: "Table 2 Factor intercorrelations",
      header: ["", "1", "2", "3", "4"],
      rows: [
        ["1. Novelty", "1.00"],
        ["2. Importance", ".20", "1.00"],
        ["3. Complexity", ".12", ".09", "1.00"],
        ["4. Stakeholding", ".20", ".32", "-.08", "1.00"],
      ],
      widths: [110, 50, 50, 50, 50],
    },
  ],
};

describe("the row of a table that holds a value (Mục 6.10)", () => {
  it("picks the row of the cell, not another row that prints the same number", async () => {
    const layer = await layerOf([matrix]);
    // .20 is in the rows of Importance and of Stakeholding.
    expect(findRowQuote(layer, 1, { value: 0.2, labels: ["Stakeholding"], rowNumber: 4 })?.quote).toBe("4. Stakeholding .20 .32 -.08 1.00");
    expect(findRowQuote(layer, 1, { value: 0.2, labels: ["Importance"], rowNumber: 2 })?.quote).toBe("2. Importance .20 1.00");
  });

  it("uses the printed row number when the variable's name differs from the print", async () => {
    const layer = await layerOf([matrix]);
    expect(findRowQuote(layer, 1, { value: 0.2, labels: ["Perceived novelty of stuff"], rowNumber: 4 })?.quote).toBe("4. Stakeholding .20 .32 -.08 1.00");
  });

  it("finds a negative value written with or without the zero", async () => {
    const layer = await layerOf([matrix]);
    expect(findRowQuote(layer, 1, { value: -0.08, labels: ["Complexity", "Stakeholding"] })?.quote).toBe("4. Stakeholding .20 .32 -.08 1.00");
  });

  it("accepts a long name printed as its first letters", async () => {
    const page: PageSpec = { blocks: [{ kind: "table", title: "Table 5", header: ["", "alpha", "CR", "AVE"], rows: [["Effi", "0.83", "0.88", "0.50"], ["SQua", "0.97", "0.97", "0.79"]], widths: [60, 60, 60, 60] }] };
    const layer = await layerOf([page]);
    expect(findRowQuote(layer, 1, { value: 0.79, labels: ["Service Quality"] })?.quote).toBe("SQua 0.97 0.97 0.79");
    expect(findRowQuote(layer, 1, { value: 0.5, labels: ["Efficiency"] })?.quote).toBe("Effi 0.83 0.88 0.50");
  });

  it("finds a correlation of zero printed as .00", async () => {
    const page: PageSpec = { blocks: [{ kind: "table", title: "Table 3", header: ["", "1", "2"], rows: [["1. Age", "1.00"], ["2. Gender", ".00", "1.00"], ["3. Income", ".31", ".12"]], widths: [90, 50, 50] }] };
    expect(findRowQuote(await layerOf([page]), 1, { value: 0, labels: ["Gender"], rowNumber: 2 })?.quote).toBe("2. Gender .00 1.00");
  });

  it("finds a share printed as a percentage", async () => {
    const page: PageSpec = { blocks: [{ kind: "table", title: "Table 8", header: ["Path", "Beta", "R2"], rows: [["Satisfaction Loyalty", "0.42**", "R2=68.7%"], ["Status Loyalty", "0.05", "R2=63.6%"]], widths: [140, 60, 80] }] };
    const layer = await layerOf([page]);
    expect(findRowQuote(layer, 1, { value: 0.687, labels: ["Satisfaction", "Loyalty"], percent: true })?.quote).toBe("Satisfaction Loyalty 0.42** R2=68.7%");
    expect(findRowQuote(layer, 1, { value: 0.687, labels: ["Satisfaction", "Loyalty"] })).toBeNull(); // not a percentage here: never guesses
  });

  it("looks on the next page when the table was cited one page off", async () => {
    const empty: PageSpec = { blocks: [{ kind: "text", lines: ["Nothing here."] }] };
    const layer = await layerOf([empty, matrix]);
    expect(findRowQuote(layer, 1, { value: 0.09, labels: ["Complexity"], rowNumber: 3 })).toMatchObject({ page: 2, quote: "3. Complexity .12 .09 1.00" });
  });

  it("gives null when no row holds the value, and when the value is ambiguous without a hint", async () => {
    const layer = await layerOf([matrix]);
    expect(findRowQuote(layer, 1, { value: 0.77, labels: ["Complexity"] })).toBeNull();
    expect(findRowQuote(layer, 1, { value: 0.2 })).toBeNull(); // on two rows, nothing says which
    expect(findRowQuote(layer, 1, { value: 0.32 })?.quote).toBe("4. Stakeholding .20 .32 -.08 1.00"); // on one row only
  });

  it("does not take part of a longer number", async () => {
    const page: PageSpec = { blocks: [{ kind: "text", lines: ["Sample size n = 4120 respondents answered"] }] };
    expect(findRowQuote(await layerOf([page]), 1, { value: 412 })).toBeNull();
  });

  it("reads a table printed sideways", async () => {
    // A turned page is only read when it holds enough text to be a real table (20 pieces, 150 characters).
    const names = ["Novelty", "Importance", "Complexity", "Stakeholding", "Uncertainty", "Expectations", "Performance", "Fairness"];
    const rows = names.map((n, i) => [`${i + 1}. ${n}`, ...Array.from({ length: i }, (_, j) => (0.1 + ((i * 7 + j * 3) % 20) / 100).toFixed(2).replace(/^0/, ""))]);
    const page: PageSpec = { sideways: true, blocks: [{ kind: "table", title: "Table 2 Factor intercorrelations between the constructs", header: ["", "1", "2", "3", "4", "5", "6", "7"], rows, widths: [110, 45, 45, 45, 45, 45, 45, 45] }] };
    const layer = await layerOf([page]);
    const line = rows[5]!.join(" ");
    expect(findRowQuote(layer, 1, { value: Number(rows[5]![3]), labels: ["Expectations"], rowNumber: 6 })?.quote).toContain("6. Expectations");
    expect(layer.pages[0]!.rowText).toContain(line);
  });
});

describe("signs in the row finder and the sign check (Mục 6.10)", () => {
  it("does not take a line that prints the number only with the opposite sign", async () => {
    const page: PageSpec = { blocks: [{ kind: "table", title: "Table 2", header: ["", "1", "2"], rows: [["6. Expectations", ".25", "-.27"], ["7. Performance", ".27", ".15"]], widths: [110, 50, 50] }] };
    const layer = await layerOf([page]);
    // R² = .27 cannot be the cell printed "-.27": the other line holds it.
    expect(findRowQuote(layer, 1, { value: 0.27, labels: ["Expectations"] })?.quote).toBe("7. Performance .27 .15");
    expect(findRowQuote(layer, 1, { value: -0.27, labels: ["Expectations"] })?.quote).toBe("6. Expectations .25 -.27");
  });

  it("gives null when the number is printed only with the opposite sign", async () => {
    const page: PageSpec = { blocks: [{ kind: "text", lines: ["H2 Brand opportunism to ABE - 0.380 p = 0.001 supported effect"] }] };
    expect(findRowQuote(await layerOf([page]), 1, { value: 0.38, labels: ["Brand opportunism"] })).toBeNull();
  });
});

describe("only lines that look like table rows (Mục 6.10)", () => {
  it("does not take a sentence that mentions the number", async () => {
    const page: PageSpec = {
      blocks: [{ kind: "text", lines: ["Respondents were asked to indicate their expectations about novelty and importance (.27), novelty and stakeholding (.12) and complexity"] }],
    };
    expect(findRowQuote(await layerOf([page]), 1, { value: 0.27, labels: ["novelty", "expectations"] })).toBeNull();
  });

  it("still takes a row with a long label and a few numbers", async () => {
    const page: PageSpec = { blocks: [{ kind: "table", title: "Table 4", header: ["", "M", "SD"], rows: [["Customer positive word-of-mouth intention", "4.12", "1.03"]], widths: [250, 50, 50] }] };
    expect(findRowQuote(await layerOf([page]), 1, { value: 4.12, labels: ["Customer positive word-of-mouth intention"] })?.quote).toBe("Customer positive word-of-mouth intention 4.12 1.03");
  });
});
