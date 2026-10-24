/** "Kho này gồm gì" (step P1.3): what the corpus holds, from the library items. Pure, no I/O. */
import { DESIGN_LABELS, PAPER_TYPE_LABELS, SAMPLE_LABELS, type LibraryItem } from "./library";

export interface CorpusPart {
  label: string;
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
function tally(items: LibraryItem[], pick: (i: LibraryItem) => string[], labels: Record<string, string>): CorpusPart[] {
  const counts = new Map<string, number>();
  for (const i of items) for (const v of new Set(pick(i))) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .map(([key, n]) => ({ label: labels[key] ?? key, n }))
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
}

export function describeCorpus(items: LibraryItem[]): CorpusSummary {
  const years = items.map((i) => i.year).filter((y): y is number => y !== null);
  return {
    papers: items.length,
    yearMin: years.length ? Math.min(...years) : null,
    yearMax: years.length ? Math.max(...years) : null,
    recent: years.filter((y) => y >= RECENT_FROM).length,
    noYear: items.length - years.length,
    types: tally(items, (i) => (i.paperType ? [i.paperType] : []), PAPER_TYPE_LABELS),
    designs: tally(items, (i) => i.designs, DESIGN_LABELS),
    samples: tally(items, (i) => i.sampleTypes, SAMPLE_LABELS),
    countries: new Set(items.flatMap((i) => i.countries)).size,
  };
}
