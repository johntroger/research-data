/**
 * The tabs of the paper workspace (step 3a.2, Mục 8.3) and the section badges ("Kết quả: 18/20 đã kiểm chứng").
 * Pure logic: which tab a field belongs to (from its natural key), how a section is summed up, and the divider.
 */

export type TabId = "overview" | "theory" | "study" | "measures" | "results" | "tables" | "contribution";

/** The tabs in order; the name of tab X is the message `c.tab.X`. */
export const TABS: { id: TabId }[] = [{ id: "overview" }, { id: "theory" }, { id: "study" }, { id: "measures" }, { id: "results" }, { id: "tables" }, { id: "contribution" }];

/** Anything that turns a message key and values into text (the server's `t` and the client's `useT().t` both fit). */
export type Say = (key: string, vars?: Record<string, string | number>) => string;

export interface TabField {
  natural_key: string;
  field_name: string;
  badge: string;
}

const STATEMENTS = /^(theoretical_contribution|practical_implication|limitation|future_direction):/;

/** The tab a field is shown in, from its natural key (the keys are built in apps/worker/src/verify/verify-full.ts). */
export function tabOf(field: Pick<TabField, "natural_key" | "field_name">): TabId {
  const key = field.natural_key;
  if (field.field_name === "contribution_type" || field.field_name === "gap_type" || STATEMENTS.test(key)) return "contribution";
  if (key.startsWith("theory:")) return "theory";
  if (key.includes(":m:")) return "measures";
  if (/:(corr|cell):/.test(key)) return "tables";
  if (key.includes("->")) return "results";
  if (key.startsWith("table:") || !key.includes(":")) return "overview";
  return "study";
}

export interface SectionSummary {
  total: number;
  /** ✓ (automatic check) or ★ (edited by hand). */
  verified: number;
  /** ⚠ and ⚑ (reported). */
  attention: number;
  /** ◇: interpretations the machine cannot check. */
  interpreted: number;
}

export function summariseSections(fields: TabField[]): Record<TabId, SectionSummary> {
  const out = Object.fromEntries(TABS.map((t) => [t.id, { total: 0, verified: 0, attention: 0, interpreted: 0 }])) as Record<TabId, SectionSummary>;
  for (const f of fields) {
    const s = out[tabOf(f)];
    s.total++;
    if (f.badge === "auto_verified" || f.badge === "human_reviewed") s.verified++;
    else if (f.badge === "ai_interpreted") s.interpreted++;
    else s.attention++;
  }
  return out;
}

/** "Kết quả: 18/20 đã kiểm chứng" for a section with checkable fields; only the ◇ count for one made of interpretations. */
export function sectionBadge(label: string, s: SectionSummary, say: Say): string {
  if (s.total === 0) return say("c.section.none", { label });
  const checkable = s.verified + s.attention;
  const parts: string[] = [];
  if (checkable > 0) parts.push(say("c.section.verified", { v: s.verified, c: checkable }));
  if (s.interpreted > 0) parts.push(say("c.section.interpreted", { n: s.interpreted }));
  return `${label}: ${parts.join(" · ")}`;
}

/** The part of a natural key before the field itself: it says which path, construct or study a field belongs to. */
export function keyContext(naturalKey: string, fieldName: string): string {
  const i = naturalKey.lastIndexOf(":");
  return i > 0 && naturalKey.endsWith(`:${fieldName}`) ? naturalKey.slice(0, i) : naturalKey;
}

/** First tab with fields, so a paper never opens on an empty tab. */
export function firstTabWithFields(summary: Record<TabId, SectionSummary>): TabId {
  return TABS.find((t) => summary[t.id].total > 0)?.id ?? "overview";
}

// --- the divider between the fields and the PDF ---------------------------------------------------------------

export const SPLIT_MIN = 25;
export const SPLIT_MAX = 75;
export const SPLIT_DEFAULT = 45;
export const SPLIT_STEP = 2;
export const SPLIT_STORAGE_KEY = "rd-split";

export const clampSplit = (percent: number): number => (Number.isFinite(percent) ? Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, Math.round(percent))) : SPLIT_DEFAULT);

/** The left pane's share (in %) for a pointer at `x` inside a container that starts at `left` and is `width` wide. */
export const splitFromPointer = (x: number, left: number, width: number): number => (width > 0 ? clampSplit(((x - left) / width) * 100) : SPLIT_DEFAULT);

/** A remembered share from storage; anything unusable gives the default. */
export function parseStoredSplit(raw: string | null): number {
  if (raw === null || raw.trim() === "") return SPLIT_DEFAULT;
  const n = Number(raw);
  return Number.isFinite(n) ? clampSplit(n) : SPLIT_DEFAULT;
}

/** The tab a paper opens on: the results, which is what a reader comes for; else the first tab with fields. */
export function defaultTab(summary: Record<TabId, SectionSummary>): TabId {
  return summary.results.total > 0 ? "results" : firstTabWithFields(summary);
}
