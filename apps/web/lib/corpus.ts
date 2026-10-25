/** "Kho này gồm gì" (step P1.3): what the corpus holds, from the library items. Pure, no I/O. */
import type { LibraryItem } from "./library";

/** A value (design, sample type, paper type) and how many papers have it; the page turns the key into a name in its language. */
export interface CorpusPart {
  key: string;
  n: number;
}

export interface CorpusSummary {
  papers: number;
  yearMin: number | null;
  yearMax: number | null;
  /** Papers published in or after `RECENT_FROM`. */
  recent: number;
  noYear: number;
  types: CorpusPart[];
  designs: CorpusPart[];
  samples: CorpusPart[];
  countries: number;
}

export const RECENT_FROM = 2020;

/** Counts papers per value (a paper counts once per value), most frequent first. */
function tally(items: LibraryItem[], pick: (i: LibraryItem) => string[]): CorpusPart[] {
  const counts = new Map<string, number>();
  for (const i of items) for (const v of new Set(pick(i))) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .map(([key, n]) => ({ key, n }))
    .sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
}

export function describeCorpus(items: LibraryItem[]): CorpusSummary {
  const years = items.map((i) => i.year).filter((y): y is number => y !== null);
  return {
    papers: items.length,
    yearMin: years.length ? Math.min(...years) : null,
    yearMax: years.length ? Math.max(...years) : null,
    recent: years.filter((y) => y >= RECENT_FROM).length,
    noYear: items.length - years.length,
    types: tally(items, (i) => (i.paperType ? [i.paperType] : [])),
    designs: tally(items, (i) => i.designs),
    samples: tally(items, (i) => i.sampleTypes),
    countries: new Set(items.flatMap((i) => i.countries)).size,
  };
}
