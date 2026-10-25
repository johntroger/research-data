import { describe, expect, it } from "vitest";
import { findCaption, MAX_CAPTION } from "./captions.js";

describe("findCaption", () => {
  it("reads a caption on the same line as the label", () => {
    expect(findCaption("Results\nTable 7. Mediation results with the parsimonious scale\nβ  SE  p\n0.12  0.03  .001", "Table 7")).toBe("Mediation results with the parsimonious scale");
    expect(findCaption("TABLE 3: Descriptive statistics and correlations", "Table 3")).toBe("Descriptive statistics and correlations");
  });

  it("reads a caption that sits on the lines after a bare label, stopping at a table row", () => {
    const page = "Table 6\nIndirect effects on brand trust\nthrough authentic brand ethicality\n0.089  0.021  .000";
    expect(findCaption(page, "Table 6")).toBe("Indirect effects on brand trust through authentic brand ethicality");
  });

  it("does not take table 6 for table 60, and does not invent a caption", () => {
    expect(findCaption("Table 60. Something else", "Table 6")).toBeNull();
    expect(findCaption("The results are in table 7 above.", "Table 7")).toBeNull();
    expect(findCaption("Table 7\n0.12  0.03  .001", "Table 7")).toBeNull();
  });

  it("handles labels such as Table A1 and cuts a long caption", () => {
    expect(findCaption("Table A1. Items of the scale", "Table A1")).toBe("Items of the scale");
    const long = `Table 2. ${"word ".repeat(80)}`;
    const caption = findCaption(long, "Table 2")!;
    expect(caption.length).toBeLessThanOrEqual(MAX_CAPTION);
    expect(caption.endsWith("…")).toBe(true);
  });

  it("returns null for something that is not a table label", () => {
    expect(findCaption("Figure 1. A figure", "Figure 1")).toBeNull();
  });
});
