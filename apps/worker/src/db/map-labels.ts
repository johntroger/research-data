/**
 * Step P3.3: gives the rows already in the database the canonical concept their label now maps to, after the canonical list grew
 * (packages/schema canonical-data.ts). Only fills what is empty or recomputes the id lists of mediators and moderators with the rule the
 * import uses (a label maps only when it equals a canonical name or alias: "không chắc thì tách"); an id already set is never changed.
 */
import type pg from "pg";
import { CANONICAL_CONSTRUCTS, canonicalKey, RETIRED_ALIASES } from "@research-data/schema";
import { buildIndex, mapLabel, type AliasIndex } from "../mapping/labels.js";

export function canonicalIndex(): AliasIndex {
  return buildIndex(CANONICAL_CONSTRUCTS.map((c) => ({ id: c.id, canonicalName: c.canonical_name, aliases: c.aliases })));
}

const retiredKeys = new Set(RETIRED_ALIASES.map((r) => `${canonicalKey(r.alias)}|${r.construct_id}`));
/** A concept id set earlier through a name that has since been retired no longer stands. */
const keep = (current: string | null, label: string): string | null => (current !== null && retiredKeys.has(`${canonicalKey(label)}|${current}`) ? null : current);

const idOf = (label: string, index: AliasIndex): string | null => {
  const m = mapLabel(label, index);
  return m.status === "mapped" ? m.id : null;
};

export interface PathRowLabels {
  id: string;
  iv_label_original: string;
  dv_label_original: string;
  iv_construct_id: string | null;
  dv_construct_id: string | null;
  mediator_labels: string[];
  moderator_labels: string[];
  mediator_ids: string[];
  moderator_ids: string[];
}

export interface PathChange {
  id: string;
  iv_construct_id: string | null;
  dv_construct_id: string | null;
  mediator_ids: string[];
  moderator_ids: string[];
  /** Human-readable "label -> concept" lines, for the preview. */
  notes: string[];
}

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** The rows whose concept ids would change, with the new ids. Pure. */
export function planPathChanges(rows: PathRowLabels[], index: AliasIndex): PathChange[] {
  const out: PathChange[] = [];
  for (const r of rows) {
    const notes: string[] = [];
    const iv = keep(r.iv_construct_id, r.iv_label_original) ?? idOf(r.iv_label_original, index);
    const dv = keep(r.dv_construct_id, r.dv_label_original) ?? idOf(r.dv_label_original, index);
    if (iv !== r.iv_construct_id) notes.push(`${r.iv_label_original} -> ${iv ?? "(bỏ gắn)"}`);
    if (dv !== r.dv_construct_id) notes.push(`${r.dv_label_original} -> ${dv ?? "(bỏ gắn)"}`);
    const med = r.mediator_labels.map((l) => idOf(l, index)).filter((x): x is string => x !== null);
    const mod = r.moderator_labels.map((l) => idOf(l, index)).filter((x): x is string => x !== null);
    if (!same(med, r.mediator_ids)) notes.push(`trung gian: ${r.mediator_labels.join(", ")} -> ${med.join(", ") || "-"}`);
    if (!same(mod, r.moderator_ids)) notes.push(`điều tiết: ${r.moderator_labels.join(", ")} -> ${mod.join(", ") || "-"}`);
    if (notes.length) out.push({ id: r.id, iv_construct_id: iv, dv_construct_id: dv, mediator_ids: med, moderator_ids: mod, notes });
  }
  return out;
}

export interface LabelRow {
  id: string;
  label: string;
  current: string | null;
}

/** Rows of a table with one label column and one concept column (measurements, condition cells) whose concept is empty and now maps. */
export function planSimpleChanges(rows: LabelRow[], index: AliasIndex): { id: string; to: string | null; label: string }[] {
  return rows.flatMap((r) => {
    const current = keep(r.current, r.label);
    if (current) return [];
    const to = idOf(r.label, index);
    return to !== r.current ? [{ id: r.id, to, label: r.label }] : [];
  });
}

export interface RemapPlan {
  paths: PathChange[];
  measurements: { id: string; to: string | null; label: string }[];
  conditionCells: { id: string; to: string | null; label: string }[];
}

export async function planRemap(db: pg.Client): Promise<RemapPlan> {
  const index = canonicalIndex();
  const paths = await db.query<PathRowLabels>(
    "select id, iv_label_original, dv_label_original, iv_construct_id, dv_construct_id, mediator_labels, moderator_labels, mediator_ids, moderator_ids from path_results",
  );
  const measurements = await db.query<LabelRow>("select id, construct_label_original as label, canonical_construct_id as current from measurements");
  const cells = await db.query<LabelRow>("select id, dv_label_original as label, dv_construct_id as current from condition_cells");
  return {
    paths: planPathChanges(paths.rows, index),
    measurements: planSimpleChanges(measurements.rows, index),
    conditionCells: planSimpleChanges(cells.rows, index),
  };
}

/** Writes the plan in one transaction. The canonical list itself must already be in `constructs` (the seed). */
export async function applyRemap(db: pg.Client, plan: RemapPlan): Promise<void> {
  await db.query("begin");
  try {
    for (const c of plan.paths) {
      await db.query("update path_results set iv_construct_id = $2, dv_construct_id = $3, mediator_ids = $4, moderator_ids = $5, updated_at = now() where id = $1", [
        c.id,
        c.iv_construct_id,
        c.dv_construct_id,
        c.mediator_ids,
        c.moderator_ids,
      ]);
    }
    for (const m of plan.measurements) await db.query("update measurements set canonical_construct_id = $2 where id = $1", [m.id, m.to]);
    for (const m of plan.conditionCells) await db.query("update condition_cells set dv_construct_id = $2 where id = $1", [m.id, m.to]);
    await db.query("commit");
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}
