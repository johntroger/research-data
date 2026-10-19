/**
 * Comparison of two extractions of the same paper (steps 1.9c and 1b.8e): the synchronous one against a Batch one,
 * Gemini against an external extractor (Codex…), or two runs of the same tool. Both are analysed against the same
 * PDF, then compared by badge counts, natural keys, Studies and hypothesis codes.
 *
 * Two extractors rarely give the same *names* to the same things, and their free text differs in where it starts and
 * ends. So before keys are compared:
 *  - discussion statements (keyed by position) are paired by their text;
 *  - measured constructs are paired by their reliability numbers (α, CR, AVE), theories by name, paths by their
 *    estimate and test statistic, whatever label each extractor gave them;
 *  - a long text counts as equal when one contains the other or they share nearly all their words.
 * Criteria: same Studies and hypothesis codes; ✓+◇ within 10%; hidden at most +2; at least 90% of the
 * structured values (numbers, enums, short values) equal. Free text is reported apart.
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

export interface Agreement {
  shared: number;
  equal: number;
}

export interface Comparison {
  sync: BadgeCounts;
  batch: BadgeCounts;
  studies: { sync: number; batch: number };
  hypothesisCodes: { sync: string[]; batch: string[] };
  keys: { shared: number; onlySync: string[]; onlyBatch: string[]; equal: number; different: FieldDiff[] };
  /** Shared keys split into structured values (numbers, enums, short strings…) and free text (long strings). */
  agreement: { structured: Agreement; freeText: Agreement };
  /** Groups of the second extraction renamed to the key of the same thing in the first one. */
  paired: { constructs: number; theories: number; paths: number };
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

/** Same value regardless of object key order, curly vs straight quotes, hyphen kinds, case and spacing. */
const canonical = (v: unknown): unknown => {
  if (typeof v === "string") return v.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[‐‑‒­]/g, "-").trim().replace(/\s+/g, " ").toLowerCase();
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).sort(([x], [y]) => x.localeCompare(y)).map(([k, x]) => [k, canonical(x)]));
  return v ?? null;
};

/** Strings at least this long are free text: they may start or end at another word and still be the same passage. */
const FREE_TEXT_MIN = 40;
const wordsOf = (s: string) => s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Words whose presence on one side only can flip or change a finding: texts differing in these are never "the same". */
const CRITICAL_WORDS = new Set([
  "not", "no", "non", "never", "neither", "nor", "without", "insignificant", "nonsignificant", "significant", "significantly",
  "positive", "positively", "negative", "negatively", "increase", "increased", "increases", "decrease", "decreased", "decreases",
  "higher", "lower", "more", "less", "stronger", "weaker",
]);

/** Words in one list but not the other (multiset difference, both ways). */
function differingWords(a: string[], b: string[]): string[] {
  const counts = new Map<string, number>();
  for (const w of a) counts.set(w, (counts.get(w) ?? 0) + 1);
  for (const w of b) counts.set(w, (counts.get(w) ?? 0) - 1);
  return [...counts.entries()].filter(([, n]) => n !== 0).map(([w]) => w);
}

/** Two long texts are the same passage: equal, one inside the other, or sharing nearly all their words. */
export function similarText(a: string, b: string): boolean {
  if (a === b) return true;
  const wa = wordsOf(a);
  const wb = wordsOf(b);
  if (differingWords(wa, wb).some((w) => CRITICAL_WORDS.has(w) || /[0-9]/.test(w))) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length >= FREE_TEXT_MIN && short.length >= 0.6 * long.length && long.includes(short)) return true;
  const counts = new Map<string, number>();
  for (const w of wa) counts.set(w, (counts.get(w) ?? 0) + 1);
  let common = 0;
  for (const w of wb) {
    const n = counts.get(w) ?? 0;
    if (n > 0) {
      common++;
      counts.set(w, n - 1);
    }
  }
  return wa.length + wb.length > 0 && (2 * common) / (wa.length + wb.length) >= 0.9;
}

export const isFreeText = (v: unknown): boolean => typeof v === "string" && v.length >= FREE_TEXT_MIN;

export function sameValue(a: unknown, b: unknown): boolean {
  const ca = canonical(a);
  const cb = canonical(b);
  if (typeof ca === "string" && typeof cb === "string" && ca.length >= FREE_TEXT_MIN && cb.length >= FREE_TEXT_MIN) return similarText(ca, cb);
  return JSON.stringify(ca) === JSON.stringify(cb);
}

const fieldKey = (f: { naturalKey: string; fieldName: string }) => `${f.naturalKey}#${f.fieldName}`;

interface F {
  naturalKey: string;
  fieldName: string;
  value: unknown;
}

const LIST_KEY = /^(theoretical_contribution|practical_implication|limitation|future_direction):\d+$/;

/** Batch fields with list items renamed to the key of the sync item holding the same statement. */
export function pairListItems<T extends F>(syncFields: T[], batchFields: T[]): T[] {
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

/**
 * Renames the groups of `batch` whose key prefix exists only there to the prefix of the one group of `sync` that is
 * the same thing (same signature, or related names). Ambiguity pairs nothing: a wrong pairing hides a real difference.
 */
export function pairGroups<T extends F>(
  sync: T[],
  batch: T[],
  rule: { groupOf: (naturalKey: string) => string | null; signature: (fields: T[]) => string | null; related?: (syncPrefix: string, batchPrefix: string) => boolean },
): { fields: T[]; pairs: number } {
  const group = (fields: T[]) => {
    const m = new Map<string, T[]>();
    for (const f of fields) {
      const g = rule.groupOf(f.naturalKey);
      if (g !== null) m.set(g, [...(m.get(g) ?? []), f]);
    }
    return m;
  };
  const gs = group(sync);
  const gb = group(batch);
  const onlySync = [...gs.keys()].filter((k) => !gb.has(k));
  const onlyBatch = [...gb.keys()].filter((k) => !gs.has(k));
  const sigS = new Map(onlySync.map((k) => [k, rule.signature(gs.get(k)!)]));
  const chosen = new Map<string, string>(); // batch prefix -> sync prefix
  for (const b of onlyBatch) {
    const sigB = rule.signature(gb.get(b)!);
    const candidates = onlySync.filter((s) => (sigB !== null && sigS.get(s) === sigB) || (rule.related?.(s, b) ?? false));
    if (candidates.length === 1) chosen.set(b, candidates[0]!);
  }
  // A sync group can be taken by one batch group only.
  const taken = new Map<string, number>();
  for (const s of chosen.values()) taken.set(s, (taken.get(s) ?? 0) + 1);
  for (const [b, s] of [...chosen]) if (taken.get(s)! > 1) chosen.delete(b);
  const fields = batch.map((f) => {
    const g = rule.groupOf(f.naturalKey);
    const to = g === null ? undefined : chosen.get(g);
    return g !== null && to !== undefined ? { ...f, naturalKey: to + f.naturalKey.slice(g.length) } : f;
  });
  return { fields, pairs: chosen.size };
}

const num = (fields: F[], name: string): number | null => {
  const v = fields.find((f) => f.fieldName === name)?.value;
  return typeof v === "number" ? v : null;
};

/** Constructs (…:m:<label>) by their reliability numbers: two of α, CR and AVE equal. */
export function pairConstructs<T extends F>(sync: T[], batch: T[]) {
  return pairGroups(sync, batch, {
    groupOf: (k) => /^([^:]+:m:[^:]+):/.exec(k)?.[1] ?? null,
    signature: (fields) => {
      const parts = [["alpha", num(fields, "alpha")], ["CR", num(fields, "CR")], ["AVE", num(fields, "AVE")]].filter(([, v]) => v !== null);
      return parts.length >= 2 ? parts.map(([n, v]) => `${n}=${v}`).join("|") : null;
    },
  });
}

/** Theories (theory:<name>) by name: one name is the start of the other ("privacy_calculus" and "privacy_calculus_theory"). */
export function pairTheories<T extends F>(sync: T[], batch: T[]) {
  const name = (p: string) => p.slice("theory:".length);
  return pairGroups(sync, batch, {
    groupOf: (k) => /^(theory:[^:]+)/.exec(k)?.[1] ?? null,
    signature: () => null,
    related: (s, b) => name(b).startsWith(`${name(s)}_`) || name(s).startsWith(`${name(b)}_`),
  });
}

/** Paths (…<iv>-><dv>:<effect>) by their estimate and test statistic, whatever the variables were called or their direction. */
export function pairPaths<T extends F>(sync: T[], batch: T[]) {
  return pairGroups(sync, batch, {
    groupOf: (k) => (k.includes("->") ? k.slice(0, k.lastIndexOf(":")) : null),
    signature: (fields) => {
      const estimate = num(fields, "estimate");
      return estimate === null ? null : `${estimate}|${num(fields, "t_or_z") ?? ""}`;
    },
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
  // Discussion statements are keyed by position, constructs / theories / paths by the label each extractor chose:
  // pair them by what they contain, then compare the rest by key.
  const listed = pairListItems(sync.analysis.fields, batch.analysis.fields);
  const constructs = pairConstructs(sync.analysis.fields, listed);
  const theories = pairTheories(sync.analysis.fields, constructs.fields);
  const paths = pairPaths(sync.analysis.fields, theories.fields);
  const batchFields = new Map(paths.fields.map((f) => [fieldKey(f), f]));
  const shared = [...syncFields.keys()].filter((k) => batchFields.has(k));
  const different: FieldDiff[] = [];
  const agreement = { structured: { shared: 0, equal: 0 }, freeText: { shared: 0, equal: 0 } };
  let equal = 0;
  for (const k of shared) {
    const a = syncFields.get(k)!.value;
    const c = batchFields.get(k)!.value;
    const kind = isFreeText(a) || isFreeText(c) ? agreement.freeText : agreement.structured;
    kind.shared++;
    if (sameValue(a, c)) {
      equal++;
      kind.equal++;
    } else different.push({ key: k, sync: a, batch: c });
  }
  const codes = { sync: hypothesisCodes(sync.data), batch: hypothesisCodes(batch.data) };
  const studies = { sync: sync.data.studies.length, batch: batch.data.studies.length };
  const goodSync = s.verified + s.interpreted;
  const goodBatch = b.verified + b.interpreted;
  const pct = (x: Agreement) => (x.shared ? `${x.equal}/${x.shared} (${((x.equal / x.shared) * 100).toFixed(1)}%)` : "0/0");
  const criteria = [
    { name: "same number of Studies", pass: studies.sync === studies.batch, detail: `${studies.sync} vs ${studies.batch}` },
    { name: "same hypothesis codes", pass: codes.sync.join(",") === codes.batch.join(","), detail: `[${codes.sync.join(" ")}] vs [${codes.batch.join(" ")}]` },
    { name: "✓+◇ within 10% of sync", pass: goodBatch >= goodSync * 0.9, detail: `${goodBatch} vs ${goodSync}` },
    { name: "hidden at most sync + 2", pass: b.hidden <= s.hidden + 2, detail: `${b.hidden} vs ${s.hidden}` },
    {
      name: "structured values ≥ 90% equal",
      pass: agreement.structured.shared > 0 && agreement.structured.equal / agreement.structured.shared >= 0.9,
      detail: `${pct(agreement.structured)}; free text ${pct(agreement.freeText)}`,
    },
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
    agreement,
    paired: { constructs: constructs.pairs, theories: theories.pairs, paths: paths.pairs },
    criteria,
    pass: criteria.every((c) => c.pass),
  };
}
