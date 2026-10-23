import { describe, expect, it } from "vitest";
import { apaReference } from "./apa";
import { facetOptions, filterLibrary, libraryQueryString, parseLibraryQuery, type LibraryItem } from "./library";

const item = (o: Partial<LibraryItem>): LibraryItem => ({
  id: "x", title: "T", authors: [], year: 2020, journal: null, doi: null, volume: null, issue: null, pages: null, pageCount: 10,
  paperType: "empirical_quant", designs: ["survey"], sampleTypes: ["mturk"], countries: ["US"], hasMatrix: false, verified: 90, attention: 5, interpreted: 5, ...o,
});
const items = [
  item({ id: "a", title: "Brand gratitude", authors: [{ given: "An", family: "Nguyễn" }], year: 2024, designs: ["online_experiment"], countries: ["VN"], hasMatrix: true }),
  item({ id: "b", title: "Trust in brands", year: 2019, designs: ["survey"], sampleTypes: ["students"], attention: 40, verified: 55, interpreted: 5 }),
  item({ id: "c", title: "Review", year: 2015, paperType: "systematic_review", designs: [], sampleTypes: [], countries: [] }),
];
const q = (p: Record<string, string>) => parseLibraryQuery(p);
const ids = (p: Record<string, string>) => filterLibrary(items, q(p)).map((i) => i.id);

describe("filterLibrary", () => {
  it("returns everything with no filter", () => expect(ids({})).toEqual(["a", "b", "c"]));
  it("searches title and authors without accents, every word must match", () => {
    expect(ids({ q: "nguyen gratitude" })).toEqual(["a"]);
    expect(ids({ q: "nguyen trust" })).toEqual([]);
  });
  it("ORs values inside a facet and ANDs facets", () => {
    expect(ids({ design: "online_experiment,survey" })).toEqual(["a", "b"]);
    expect(ids({ design: "survey", sample: "students" })).toEqual(["b"]);
  });
  it("filters by decade, matrix and trust", () => {
    expect(ids({ year: "2020s" })).toEqual(["a"]);
    expect(ids({ matrix: "1" })).toEqual(["a"]);
    expect(ids({ trust: "high" })).toEqual(["a", "c"]);
  });
  it("treats a paper with no value as unknown", () => expect(ids({ design: "unknown" })).toEqual(["c"]));
});

describe("facetOptions", () => {
  it("counts with the other filters kept and this facet's own picks ignored", () => {
    const opts = facetOptions(items, q({ design: "survey", sample: "students" }), "designs");
    expect(opts.find((o) => o.value === "survey")).toMatchObject({ count: 1, selected: true });
    expect(opts.find((o) => o.value === "online_experiment")).toBeUndefined();
  });
  it("lists unknown last and keeps a picked value with zero papers", () => {
    const opts = facetOptions(items, q({ design: "lab_experiment" }), "designs");
    expect(opts.at(-1)!.value).toBe("unknown");
    expect(opts.find((o) => o.value === "lab_experiment")).toMatchObject({ count: 0, selected: true });
  });
});

describe("query string", () => {
  it("round-trips", () => {
    const query = q({ q: "brand", design: "survey,online_experiment", trust: "mid", matrix: "1" });
    expect(parseLibraryQuery(Object.fromEntries(new URLSearchParams(libraryQueryString(query))))).toEqual(query);
  });
  it("ignores an unknown trust value", () => expect(q({ trust: "x" }).trust).toBe(""));
});

describe("apaReference", () => {
  it("formats authors, year, title, source and DOI", () => {
    expect(
      apaReference({ title: "Brand gratitude.", authors: [{ given: "Jean-Paul", family: "Koskie" }, { given: "Ann Marie", family: "Lee" }], year: 2024, journal: "Journal of Brands", volume: "33", issue: "2", pages: "1-17", doi: "10.1/x" }),
    ).toBe("Koskie, J. P., & Lee, A. M. (2024). Brand gratitude. Journal of Brands, 33(2), 1-17. https://doi.org/10.1/x");
  });
  it("copes with missing parts", () => expect(apaReference({ title: null, authors: [], year: null, journal: null, volume: null, issue: null, pages: null, doi: null })).toBe("(n.d.)."));
});
