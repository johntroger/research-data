/**
 * Step P4.1: cuts a numbered release of the data. The number is the day in Vietnam time (the owner's day), with -2, -3 when more than one
 * release is cut on the same day. The counts are what a visitor can see (hidden fields are not counted).
 */
import type pg from "pg";
import { CANONICAL_LIST_VERSION } from "@research-data/schema";

export interface ReleasePlan {
  id: string;
  papers: number;
  tests: number;
  canonicalVersion: string;
  note: string;
}

/** The next free number for a day: "2026.10.25", then "2026.10.25-2", "2026.10.25-3"... */
export function nextReleaseId(now: Date, existing: string[]): string {
  const vn = new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10).replace(/-/g, ".");
  if (!existing.includes(vn)) return vn;
  let n = 2;
  while (existing.includes(`${vn}-${n}`)) n++;
  return `${vn}-${n}`;
}

export async function planRelease(db: pg.Client, note: string, now: Date = new Date()): Promise<ReleasePlan> {
  const [papers, tests, ids] = await Promise.all([
    db.query<{ n: string }>("select count(*) as n from papers"),
    db.query<{ n: string }>("select count(*) as n from path_results where badge <> 'hidden'"),
    db.query<{ id: string }>("select id from data_releases"),
  ]);
  return {
    id: nextReleaseId(now, ids.rows.map((r) => r.id)),
    papers: Number(papers.rows[0]!.n),
    tests: Number(tests.rows[0]!.n),
    canonicalVersion: CANONICAL_LIST_VERSION,
    note,
  };
}

export async function saveRelease(db: pg.Client, plan: ReleasePlan): Promise<void> {
  await db.query("insert into data_releases (id, papers, tests, canonical_version, note) values ($1, $2, $3, $4, $5)", [plan.id, plan.papers, plan.tests, plan.canonicalVersion, plan.note]);
}
