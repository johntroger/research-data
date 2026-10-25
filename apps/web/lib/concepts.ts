/** The "Khái niệm" page (step P3.4): each canonical concept with the names merged into it and how much evidence it holds. Pure, no I/O. */
import type { Concept, PathRow } from "./relations";

export interface ConceptDetail extends Concept {
  definition: string;
  source: string;
}

export interface ConceptSummary extends ConceptDetail {
  tests: number;
  papers: number;
  /** The variable names the authors used for it in the tests, most used first. */
  usedNames: { label: string; n: number }[];
}

type RowIds = Pick<PathRow, "paper_id" | "iv_construct_id" | "dv_construct_id" | "iv_label_original" | "dv_label_original">;

/** A test counts for a concept when it is the independent or the dependent variable (a test counts once even if it is both). */
export function summariseConcepts(concepts: ConceptDetail[], rows: RowIds[]): ConceptSummary[] {
  const byConcept = new Map<string, { tests: number; papers: Set<string>; names: Map<string, number> }>();
  const note = (id: string | null, label: string, paper: string) => {
    if (!id) return;
    const e = byConcept.get(id) ?? { tests: 0, papers: new Set<string>(), names: new Map<string, number>() };
    e.tests++;
    e.papers.add(paper);
    const key = label.trim().toLowerCase();
    e.names.set(key, (e.names.get(key) ?? 0) + 1);
    byConcept.set(id, e);
  };
  for (const r of rows) {
    note(r.iv_construct_id, r.iv_label_original, r.paper_id);
    if (r.dv_construct_id !== r.iv_construct_id) note(r.dv_construct_id, r.dv_label_original, r.paper_id);
  }
  return concepts
    .map((c) => {
      const e = byConcept.get(c.id);
      return {
        ...c,
        tests: e?.tests ?? 0,
        papers: e?.papers.size ?? 0,
        usedNames: [...(e?.names ?? [])].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n || a.label.localeCompare(b.label)),
      };
    })
    .sort((a, b) => b.tests - a.tests || a.canonical_name.localeCompare(b.canonical_name));
}
