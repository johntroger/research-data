/**
 * Maps the names authors use (constructs, theories) to the canonical lists (step 1.6, Mục 5.3).
 * Rule "không chắc thì tách": a label is merged only when its name equals a canonical name or an
 * alias, up to case, punctuation, plural and an abbreviation in brackets. Everything else stays
 * separate, with suggestions the owner may accept later. Wrongly separating is harmless and visible
 * in a search; wrongly merging corrupts results silently. (Embeddings and item similarity come once
 * there are enough papers to set their thresholds.)
 */
import { canonicalKey } from "@research-data/schema";

export interface Entity {
  id: string;
  canonicalName: string;
  aliases: string[];
}

export type MappingStatus = "mapped" | "separate" | "ambiguous";

export interface Suggestion {
  id: string;
  name: string;
  reason: string;
}

export interface LabelMapping {
  label: string;
  status: MappingStatus;
  /** Canonical id when mapped, else null. */
  id: string | null;
  /** 1 for an exact name / alias match; 0 when separate. */
  confidence: number;
  method: "exact" | null;
  /** Canonical entries a human could merge this label into (never applied automatically). */
  suggestions: Suggestion[];
  note: string;
}

/** Plural of the last word dropped, so "Purchase Intentions" and "Purchase Intention" compare equal. */
function singular(key: string): string {
  const words = key.split(" ");
  const last = words.pop() ?? "";
  let s = last;
  if (last.length > 4 && last.endsWith("ies")) s = `${last.slice(0, -3)}y`;
  else if (last.length > 3 && last.endsWith("s") && !/(ss|us|is)$/.test(last)) s = last.slice(0, -1);
  return [...words, s].join(" ");
}

const keyOf = (name: string) => singular(canonicalKey(name));

export interface AliasIndex {
  /** key → ids of the entities that carry it as a name or alias. */
  byKey: Map<string, Set<string>>;
  entities: Map<string, Entity>;
}

export function buildIndex(entities: Entity[]): AliasIndex {
  const byKey = new Map<string, Set<string>>();
  const byId = new Map<string, Entity>();
  for (const e of entities) {
    byId.set(e.id, e);
    for (const name of [e.canonicalName, ...e.aliases]) {
      const key = keyOf(name);
      byKey.set(key, (byKey.get(key) ?? new Set()).add(e.id));
    }
  }
  return { byKey, entities: byId };
}

/** Keys that appear on more than one entity: such an alias can never merge anything. */
export function collidingKeys(index: AliasIndex): string[] {
  return [...index.byKey].filter(([, ids]) => ids.size > 1).map(([key]) => key);
}

/** "Social media marketing activities (SMMA)" → base name and the abbreviations in brackets. */
function splitBrackets(label: string): { base: string; inside: string[] } {
  const inside = [...label.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]!.trim());
  const base = label.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  return { base: base || label, inside };
}

/** Canonical entries whose name lies inside the label (or the other way round) on 2+ whole words. */
function suggest(label: string, index: AliasIndex): Suggestion[] {
  const labelKey = keyOf(splitBrackets(label).base);
  const labelWords = ` ${labelKey} `;
  const out = new Map<string, Suggestion>();
  for (const [key, ids] of index.byKey) {
    if (key.split(" ").length < 2) continue;
    const contained = labelWords.includes(` ${key} `);
    const containing = labelKey.split(" ").length >= 2 && ` ${key} `.includes(labelWords);
    if (!contained && !containing) continue;
    for (const id of ids) {
      const e = index.entities.get(id)!;
      out.set(id, {
        id,
        name: e.canonicalName,
        reason: contained ? `"${label}" chứa "${key}" nhưng có thêm từ khác, có thể là khái niệm hẹp hơn` : `"${label}" là một phần của "${key}"`,
      });
    }
  }
  return [...out.values()];
}

const separate = (label: string, status: MappingStatus, suggestions: Suggestion[], note: string): LabelMapping => ({
  label,
  status,
  id: null,
  confidence: 0,
  method: null,
  suggestions,
  note,
});

/** Is `abbr` the initials of `name`? ("Social media marketing activities" → SMMA; plural "s" is ignored.) */
function isExpansion(name: string, abbr: string): boolean {
  const initialsOf = (text: string) =>
    text
      .split(/[\s\-–—]+/)
      .filter((w) => w && !/^(of|and|the|for|in|to)$/i.test(w))
      .map((w) => w[0])
      .join("")
      .toLowerCase();
  const letters = abbr.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const trim = (s: string) => s.replace(/s$/, "");
  // "Stimulus-Organism-Response (S-O-R) framework": a closing generic word is not part of the abbreviation.
  const withoutSuffix = name.replace(/\s+(framework|model|theory|approach|perspective|lens)$/i, "");
  return letters.length >= 2 && [name, withoutSuffix].some((n) => trim(initialsOf(n)) === trim(letters));
}

export function mapLabel(label: string, index: AliasIndex): LabelMapping {
  // 1. The label exactly as written, brackets included ("Entertainment (SMMA)" is a canonical name).
  const whole = index.byKey.get(keyOf(label));
  if (whole?.size === 1) {
    const id = [...whole][0]!;
    return { label, status: "mapped", id, confidence: 1, method: "exact", suggestions: [], note: `Trùng tên với "${index.entities.get(id)!.canonicalName}"` };
  }

  const { base, inside } = splitBrackets(label);
  const hits = new Set(whole && whole.size > 1 ? whole : (index.byKey.get(keyOf(base)) ?? []));
  // A bracket is read as an abbreviation of the name only when it is that name's initials; otherwise
  // it would turn "Entertainment (SMMA)"-like labels of a part into the whole construct.
  const abbreviationHits = new Set<string>();
  for (const abbr of inside) {
    for (const id of index.byKey.get(keyOf(abbr)) ?? []) {
      if (isExpansion(base, abbr) || hits.size > 0) abbreviationHits.add(id);
    }
  }

  if (hits.size > 0 && abbreviationHits.size > 0 && ![...abbreviationHits].every((id) => hits.has(id))) {
    return separate(label, "ambiguous", suggest(label, index), `Tên và chữ viết tắt trong ngoặc của "${label}" chỉ về hai khái niệm khác nhau; giữ tách riêng`);
  }
  const found = hits.size > 0 ? hits : abbreviationHits;

  if (found.size === 1) {
    const id = [...found][0]!;
    return { label, status: "mapped", id, confidence: 1, method: "exact", suggestions: [], note: `Trùng tên với "${index.entities.get(id)!.canonicalName}"` };
  }
  if (found.size > 1) {
    const suggestions = [...found].map((id) => ({ id, name: index.entities.get(id)!.canonicalName, reason: "Tên trùng với bí danh của nhiều mục" }));
    return separate(label, "ambiguous", suggestions, `"${label}" trùng bí danh của ${found.size} mục; giữ tách riêng`);
  }
  const suggestions = suggest(label, index);
  return separate(
    label,
    "separate",
    suggestions,
    suggestions.length
      ? `Chưa có trong danh sách chuẩn; có thể gộp vào ${suggestions.map((s) => `"${s.name}"`).join(", ")} nếu bạn thấy đúng`
      : "Chưa có trong danh sách chuẩn; giữ tách riêng",
  );
}

export function mapLabels(labels: string[], index: AliasIndex): Map<string, LabelMapping> {
  return new Map(labels.map((label) => [label, mapLabel(label, index)]));
}
