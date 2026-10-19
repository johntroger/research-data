/**
 * Loads the label index from the database (step 1.6), so aliases the owner adds later to
 * `construct_aliases` take effect without a code change. The seed holds the canonical list.
 */
import type pg from "pg";
import { type AliasIndex, buildIndex } from "./labels.js";

export async function loadConstructIndex(db: pg.Client): Promise<AliasIndex> {
  const rows = await db.query<{ id: string; canonical_name: string; aliases: string[] }>(
    `select c.id, c.canonical_name, coalesce(array_agg(a.alias) filter (where a.alias is not null), '{}') as aliases
     from constructs c left join construct_aliases a on a.construct_id = c.id
     group by c.id, c.canonical_name`,
  );
  return buildIndex(rows.rows.map((r) => ({ id: r.id, canonicalName: r.canonical_name, aliases: r.aliases })));
}

export async function loadTheoryIndex(db: pg.Client): Promise<AliasIndex> {
  const rows = await db.query<{ id: string; canonical_name: string; aliases: string[] }>("select id, canonical_name, aliases from theories");
  return buildIndex(rows.rows.map((r) => ({ id: r.id, canonicalName: r.canonical_name, aliases: r.aliases })));
}
