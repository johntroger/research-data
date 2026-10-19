/**
 * Applies the label mapping (labels.ts) to a full extraction (step 1.6): every construct name the
 * authors used in measurements, tested paths, mediators, moderators and tables, and every theory.
 */
import { CANONICAL_CONSTRUCTS, CANONICAL_THEORIES, canonicalKey } from "@research-data/schema";
import type { FullData } from "../verify/verify-full.js";
import { type AliasIndex, buildIndex, type Entity, type LabelMapping, mapLabel } from "./labels.js";

export const canonicalConstructEntities = (): Entity[] =>
  CANONICAL_CONSTRUCTS.map((c) => ({ id: c.id, canonicalName: c.canonical_name, aliases: c.aliases }));

export const canonicalTheoryEntities = (): Entity[] =>
  CANONICAL_THEORIES.map((t) => ({ id: t.id, canonicalName: t.canonical_name, aliases: t.aliases }));

export type UsedLabel = LabelMapping & { usedAs: string[] };

export interface ExtractionMapping {
  /** One row per distinct label (after trimming), with the roles it played in the paper. */
  constructs: UsedLabel[];
  theories: UsedLabel[];
  summary: { constructsMapped: number; constructsSeparate: number; theoriesMapped: number; theoriesSeparate: number };
}

export interface MappingIndexes {
  constructs: AliasIndex;
  theories: AliasIndex;
}

export const canonicalIndexes = (): MappingIndexes => ({
  constructs: buildIndex(canonicalConstructEntities()),
  theories: buildIndex(canonicalTheoryEntities()),
});

export function mapExtraction(data: FullData, indexes: MappingIndexes = canonicalIndexes()): ExtractionMapping {
  // Labels that differ only by case or spacing are one name: keep the first spelling, merge the roles.
  const uses = new Map<string, { label: string; roles: Set<string> }>();
  const use = (label: string, as: string) => {
    const name = label.trim().replace(/\s+/g, " ");
    if (!name) return;
    const key = canonicalKey(name);
    const entry = uses.get(key) ?? { label: name, roles: new Set<string>() };
    entry.roles.add(as);
    uses.set(key, entry);
  };
  for (const study of data.studies) {
    for (const m of study.measurements) {
      use(m.construct_label_original, "measurement");
      if (m.parent_label_original) use(m.parent_label_original, "parent");
    }
    for (const p of study.paths) {
      use(p.iv_label_original, "iv");
      use(p.dv_label_original, "dv");
      p.mediator_labels.forEach((l) => use(l, "mediator"));
      p.moderator_labels.forEach((l) => use(l, "moderator"));
    }
    for (const mx of study.correlation_matrices) mx.variables.forEach((v) => use(v, "matrix"));
    for (const c of study.condition_cells) use(c.dv_label_original, "dv");
  }
  const constructs = [...uses.values()].map(({ label, roles }) => ({ ...mapLabel(label, indexes.constructs), usedAs: [...roles].sort() }));
  const theories = data.structure.theories.map((t) => ({ ...mapLabel(t.theory_name_original, indexes.theories), usedAs: [t.application_role] }));
  const mapped = (rows: UsedLabel[]) => rows.filter((r) => r.status === "mapped").length;
  return {
    constructs,
    theories,
    summary: {
      constructsMapped: mapped(constructs),
      constructsSeparate: constructs.length - mapped(constructs),
      theoriesMapped: mapped(theories),
      theoriesSeparate: theories.length - mapped(theories),
    },
  };
}
