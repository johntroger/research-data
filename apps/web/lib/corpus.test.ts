import { describe, expect, it } from "vitest";
import { describeCorpus } from "./corpus";
import type { LibraryItem } from "./library";

const item = (o: Partial<LibraryItem>): LibraryItem => ({
  id: "p", title: null, authors: [], year: null, journal: null, doi: null, volume: null, issue: null, pages: null, pageCount: null,
  paperType: null, designs: [], sampleTypes: [], countries: [], hasMatrix: false, verified: 0, attention: 0, interpreted: 0, ...o,
});

describe("describeCorpus", () => {
  const items = [
    item({ year: 1991, paperType: "empirical_quant", designs: ["survey"], sampleTypes: ["students"], countries: ["US"] }),
    item({ year: 2021, paperType: "empirical_quant", designs: ["survey", "online_experiment"], sampleTypes: ["students", "mturk"], countries: ["US", "VN"] }),
    item({ year: 2026, paperType: "conceptual", designs: ["survey"] }),
    item({}),
  ];

  it("gives the size, the year range, how many are recent and how many have no year", () => {
    expect(describeCorpus(items)).toMatchObject({ papers: 4, yearMin: 1991, yearMax: 2026, recent: 2, noYear: 1, countries: 2 });
  });

  it("counts papers per design, sample type and paper type, most frequent first", () => {
    const c = describeCorpus(items);
    expect(c.designs).toEqual([
      { key: "survey", n: 3 },
      { key: "online_experiment", n: 1 },
    ]);
    expect(c.samples[0]).toEqual({ key: "students", n: 2 });
    expect(c.types[0]).toEqual({ key: "empirical_quant", n: 2 });
  });

  it("copes with an empty corpus", () => {
    expect(describeCorpus([])).toMatchObject({ papers: 0, yearMin: null, yearMax: null, recent: 0, designs: [] });
  });
});
