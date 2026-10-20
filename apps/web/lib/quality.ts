/**
 * Quality numbers for the admin page (step 1b.5): how many extracted fields are ✓ / ⚠ / ◇ / hidden, by source,
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

/** Fields with the model of their run and the design of their study; `source` keeps runs whose model contains the text. */
const FIELDS = `
  select f.paper_id, f.field_name, f.badge, f.check_results,
         coalesce(er.model_name, '(unknown)') as source,
         coalesce((select s.research_design from studies s
                    where s.paper_id = f.paper_id and (f.natural_key = s.natural_key or f.natural_key like s.natural_key || ':%')
                    order by length(s.natural_key) desc limit 1), '(paper-level)') as design
    from extracted_fields f
    left join extraction_runs er on er.id = f.extraction_run_id
   where ($1::text is null or er.model_name ilike '%' || $1 || '%')`;

const COUNTS = `
  count(*) filter (where badge = 'auto_verified')::int as verified,
  count(*) filter (where badge = 'needs_attention')::int as attention,
  count(*) filter (where badge = 'ai_interpreted')::int as interpreted,
  count(*) filter (where badge = 'hidden')::int as hidden`;

interface RawCounts {
  verified: number;
  attention: number;
  interpreted: number;
  hidden: number;
}

const withRate = <T extends RawCounts>(r: T): T & { problemRate: number } => ({ ...r, problemRate: problemRate(r) });

async function groupBy(db: pg.Client, column: "source" | "design" | "field_name", source: string | null, limit: number): Promise<QualityRow[]> {
  const res = await db.query<RawCounts & { name: string; papers: number }>(
    `with f as (${FIELDS})
     select ${column} as name, ${COUNTS}, count(distinct paper_id)::int as papers
       from f group by 1
      order by (count(*) filter (where badge in ('needs_attention', 'hidden'))) desc, 1
      limit $2`,
    [source, limit],
  );
  return res.rows.map(withRate);
}

export async function loadQuality(db: pg.Client, options: { source?: string; limit?: number } = {}): Promise<QualityReport> {
  const source = options.source?.trim() || null;
  const limit = options.limit ?? 15;
  const total = await db.query<RawCounts & { fields: number; papers: number }>(
    `with f as (${FIELDS}) select ${COUNTS}, count(*)::int as fields, count(distinct paper_id)::int as papers from f`,
    [source],
  );
  const t = total.rows[0]!;
  const checks = await db.query<{ name: string; fields: number; papers: number }>(
    `with f as (${FIELDS})
     select f.field_name || ' / ' || (c ->> 'name') as name, count(*)::int as fields, count(distinct f.paper_id)::int as papers
       from f, jsonb_array_elements(f.check_results -> 'checks') c
      where f.badge in ('needs_attention', 'hidden') and (c ->> 'passed') = 'false'
      group by 1 order by 2 desc, 1 limit $2`,
    [source, limit],
  );
  const attention = await db.query<RawCounts & { id: string; title: string }>(
    `with f as (${FIELDS})
     select p.id, coalesce(p.title, p.pdf_path, p.id::text) as title, ${COUNTS.replaceAll("badge", "f.badge")}
       from f join papers p on p.id = f.paper_id
      group by p.id, p.title, p.pdf_path
     having count(*) filter (where f.badge in ('needs_attention', 'hidden')) > 0
      order by (count(*) filter (where f.badge in ('needs_attention', 'hidden'))) desc, 2`,
    [source],
  );
  return {
    fields: t.fields,
    papers: t.papers,
    total: withRate({ verified: t.verified, attention: t.attention, interpreted: t.interpreted, hidden: t.hidden }),
    bySource: await groupBy(db, "source", source, limit),
    byDesign: await groupBy(db, "design", source, limit),
    byField: await groupBy(db, "field_name", source, limit),
    byCheck: checks.rows,
    attention: attention.rows.map(withRate),
  };
}
