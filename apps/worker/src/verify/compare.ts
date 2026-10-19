/**
 * Batch-vs-synchronous comparison (step 1.9c). Both extractions of one paper are analysed against the
 * same PDF, then compared by badge counts, natural keys, Studies and hypothesis codes.
 * Criteria (agreed before the run): same Studies and hypothesis codes; ✓+◇ of Batch within 10% of sync;
 * hidden fields of Batch at most sync + 2; at least 90% of shared natural keys with equal values.
 */
import type { PaperAnalysis } from "./analyse.js";
import type { FullData } from "./verify-full.js";

export interface BadgeCounts {
  verified: number;
  attention: number;
  interpreted: number;
  hidden: number;
  other: number;
}

export interface FieldDiff {
  key: string;
  sync: unknown;
  batch: unknown;
}

export interface Comparison {
  sync: BadgeCounts;
  batch: BadgeCounts;
  studies: { sync: number; batch: number };
  hypothesisCodes: { sync: string[]; batch: string[] };
  keys: { shared: number; onlySync: string[]; onlyBatch: string[]; equal: number; different: FieldDiff[] };
  criteria: { name: string; pass: boolean; detail: string }[];
  pass: boolean;
}

export function badgeCounts(analysis: PaperAnalysis): BadgeCounts {
  const c: BadgeCounts = { verified: 0, attention: 0, interpreted: 0, hidden: 0, other: 0 };
  for (const f of analysis.fields) {
    if (f.badge === "auto_verified") c.verified++;
    else if (f.badge === "needs_attention") c.attention++;
    else if (f.badge === "ai_interpreted") c.interpreted++;
    else if (f.badge === "hidden") c.hidden++;
    else c.other++;
  }
  return c;
}

/** Same value regardless of object key order, curly vs straight quotes, case and spacing. */
const canonical = (v: unknown): unknown => {
  if (typeof v === "string") return v.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').trim().replace(/\s+/g, " ").toLowerCase();
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).sort(([x], [y]) => x.localeCompare(y)).map(([k, x]) => [k, canonical(x)]));
  return v ?? null;
};
export const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

const fieldKey = (f: { naturalKey: string; fieldName: string }) => `${f.naturalKey}#${f.fieldName}`;

const LIST_KEY = /^(theoretical_contribution|practical_implication|limitation|future_direction):\d+$/;

/** Batch fields with list items renamed to the key of the sync item holding the same statement. */
export function pairListItems<T extends { naturalKey: string; fieldName: string; value: unknown }>(syncFields: T[], batchFields: T[]): T[] {
  const free = new Map<string, T[]>(); // sync items not yet paired, by kind
  for (const f of syncFields) if (LIST_KEY.test(f.naturalKey)) free.set(f.fieldName, [...(free.get(f.fieldName) ?? []), f]);
  const taken = new Set<string>();
  return batchFields.map((f) => {
    if (!LIST_KEY.test(f.naturalKey)) return f;
    const match = (free.get(f.fieldName) ?? []).find((s) => !taken.has(s.naturalKey) && sameValue(s.value, f.value));
    if (!match) return f;
    taken.add(match.naturalKey);
    return { ...f, naturalKey: match.naturalKey };
  });
}

export function hypothesisCodes(data: FullData): string[] {
  const codes = data.studies.flatMap((s) => s.paths.map((p) => p.hypothesis_code)).filter((c): c is string => !!c);
  return [...new Set(codes.map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, "")))].sort();
}

export function compareExtractions(sync: { data: FullData; analysis: PaperAnalysis }, batch: { data: FullData; analysis: PaperAnalysis }): Comparison {
  const s = badgeCounts(sync.analysis);
  const b = badgeCounts(batch.analysis);
  const syncFields = new Map(sync.analysis.fields.map((f) => [fieldKey(f), f]));
  // Statements of the discussion are keyed by position (kind:1, kind:2…), so one item more or less
  // would shift all the others. They are paired by value instead, then the rest by key.
  const batchFields = new Map(pairListItems(sync.analysis.fields, batch.analysis.fields).map((f) => [fieldKey(f), f]));
  const shared = [...syncFields.keys()].filter((k) => batchFields.has(k));
  const different: FieldDiff[] = [];
  let equal = 0;
  for (const k of shared) {
    const a = syncFields.get(k)!.value;
    const c = batchFields.get(k)!.value;
    if (sameValue(a, c)) equal++;
    else different.push({ key: k, sync: a, batch: c });
  }
  const codes = { sync: hypothesisCodes(sync.data), batch: hypothesisCodes(batch.data) };
  const studies = { sync: sync.data.studies.length, batch: batch.data.studies.length };
  const goodSync = s.verified + s.interpreted;
  const goodBatch = b.verified + b.interpreted;
  const share = shared.length ? equal / shared.length : 0;
  const criteria = [
    { name: "same number of Studies", pass: studies.sync === studies.batch, detail: `${studies.sync} vs ${studies.batch}` },
    { name: "same hypothesis codes", pass: codes.sync.join(",") === codes.batch.join(","), detail: `[${codes.sync.join(" ")}] vs [${codes.batch.join(" ")}]` },
    { name: "✓+◇ within 10% of sync", pass: goodBatch >= goodSync * 0.9, detail: `${goodBatch} vs ${goodSync}` },
    { name: "hidden at most sync + 2", pass: b.hidden <= s.hidden + 2, detail: `${b.hidden} vs ${s.hidden}` },
    { name: "≥ 90% of shared keys equal", pass: share >= 0.9, detail: `${equal}/${shared.length} (${(share * 100).toFixed(1)}%)` },
  ];
  return {
    sync: s,
    batch: b,
    studies,
    hypothesisCodes: codes,
    keys: {
      shared: shared.length,
      onlySync: [...syncFields.keys()].filter((k) => !batchFields.has(k)),
      onlyBatch: [...batchFields.keys()].filter((k) => !syncFields.has(k)),
      equal,
      different,
    },
    criteria,
    pass: criteria.every((c) => c.pass),
  };
}
