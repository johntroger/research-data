/**
 * Quality numbers for the admin page (step 1b.5, A.3): how many extracted fields are ✓ / ⚠ / ◇ / hidden, by source,
 * study design, field and failed check, and which papers need attention. Same definitions as `pnpm worker quality`:
 * problem rate = (⚠ + hidden) / (✓ + ⚠ + hidden), because ◇ fields (interpretations) cannot be checked.
 */
import type pg from "pg";

export interface Counts {
  verified: number;
  attention: number;
  interpreted: number;
  hidden: number;
}

export interface QualityRow extends Counts {
  name: string;
  papers: number;
  problemRate: number;
}

export interface PaperAttention extends Counts {
  id: string;
  title: string;
  problemRate: number;
}

export interface QualityReport {
  fields: number;
  papers: number;
  total: Counts & { problemRate: number };
  bySource: QualityRow[];
  byDesign: QualityRow[];
  byField: QualityRow[];
  byCheck: { name: string; fields: number; papers: number }[];
  /** Papers with at least one ⚠ or hidden field, the worst first. */
  attention: PaperAttention[];
}

export const problemRate = (c: Counts): number => {
  const checkable = c.verified + c.attention + c.hidden;
  return checkable === 0 ? 0 : (c.attention + c.hidden) / checkable;
};

interface RawCounts {
  verified: number;
  attention: number;
  interpreted: number;
  hidden: number;
}

const withRate = <T extends RawCounts>(r: T): T & { problemRate: number } => ({ ...r, problemRate: problemRate(r) });

/** What the database function `public.quality_report` returns (supabase/migrations/20261023200000_owner_access.sql). */
export interface RawReport {
  total: RawCounts & { fields: number; papers: number };
  bySource: (RawCounts & { name: string; papers: number })[];
  byDesign: (RawCounts & { name: string; papers: number })[];
  byField: (RawCounts & { name: string; papers: number })[];
  byCheck: { name: string; fields: number; papers: number }[];
  attention: (RawCounts & { id: string; title: string })[];
}

export function toReport(raw: RawReport): QualityReport {
  const t = raw.total;
  return {
    fields: t.fields,
    papers: t.papers,
    total: withRate({ verified: t.verified, attention: t.attention, interpreted: t.interpreted, hidden: t.hidden }),
    bySource: raw.bySource.map(withRate),
    byDesign: raw.byDesign.map(withRate),
    byField: raw.byField.map(withRate),
    byCheck: raw.byCheck,
    attention: raw.attention.map(withRate),
  };
}

/**
 * The report through a direct database connection (the developer machine). The function only answers the owner, so the connection says so
 * explicitly for one transaction, as the owner's session token would; nothing is allowed by default.
 */
export async function loadQuality(db: pg.Client, options: { source?: string; limit?: number } = {}): Promise<QualityReport> {
  await db.query("begin");
  try {
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ app_metadata: { role: "owner" } })]);
    const res = await db.query<{ r: RawReport }>("select public.quality_report($1, $2) as r", [options.source?.trim() || null, options.limit ?? 15]);
    return toReport(res.rows[0]!.r);
  } finally {
    await db.query("rollback");
  }
}
