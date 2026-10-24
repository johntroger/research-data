/**
 * The owner's view of the daily usage counters (step 4.6): the rows of `public.usage_report` shaped into a days-by-kinds table.
 * Read through the owner's session on a deployed site, or through the developer machine's direct connection (which declares itself the
 * owner for one transaction, as lib/quality.ts does).
 */
import type pg from "pg";
import { EVENT_LABELS, type UsageEvent } from "./usage";

export interface UsageRow {
  day: string;
  event: string;
  n: number;
}

export interface UsageTable {
  /** Days with at least one use, newest first. */
  days: string[];
  /** The kinds that have any count, in the order of EVENT_LABELS. */
  events: UsageEvent[];
  cell: (day: string, event: UsageEvent) => number;
  totals: Record<string, number>;
  all: number;
}

export function toUsageTable(rows: UsageRow[]): UsageTable {
  const known = rows.filter((r): r is UsageRow & { event: UsageEvent } => r.event in EVENT_LABELS);
  const byKey = new Map(known.map((r) => [`${r.day}|${r.event}`, r.n]));
  const days = [...new Set(known.map((r) => r.day))].sort().reverse();
  const used = new Set(known.map((r) => r.event));
  const events = (Object.keys(EVENT_LABELS) as UsageEvent[]).filter((e) => used.has(e));
  const totals: Record<string, number> = {};
  for (const r of known) totals[r.event] = (totals[r.event] ?? 0) + r.n;
  return { days, events, cell: (day, event) => byKey.get(`${day}|${event}`) ?? 0, totals, all: known.reduce((n, r) => n + r.n, 0) };
}

export async function loadUsage(db: pg.Client, days = 30): Promise<UsageRow[]> {
  await db.query("begin");
  try {
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ app_metadata: { role: "owner" } })]);
    return (await db.query<{ r: UsageRow[] }>("select public.usage_report($1) as r", [days])).rows[0]!.r;
  } finally {
    await db.query("rollback");
  }
}
