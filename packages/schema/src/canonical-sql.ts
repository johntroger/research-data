/**
 * SQL seed for the canonical tables (step 1.1), generated from canonical-data.ts into
 * supabase/seed.sql by `pnpm canonical:build`. Upserts, so it can run again on any database.
 */
import { CANONICAL_CONSTRUCTS, CANONICAL_LIST_VERSION, CANONICAL_THEORIES, canonicalKey } from "./canonical.js";

const lit = (value: string | null) => (value === null ? "null" : `'${value.replace(/'/g, "''")}'`);
const arr = (values: string[]) => `array[${values.map(lit).join(", ")}]::text[]`;

/** Parents before children, so the foreign key to parent_construct_id holds while inserting. */
function parentsFirst() {
  const done = new Set<string>();
  const out: typeof CANONICAL_CONSTRUCTS = [];
  const visit = (c: (typeof CANONICAL_CONSTRUCTS)[number]) => {
    if (done.has(c.id)) return;
    if (c.parent_id) visit(CANONICAL_CONSTRUCTS.find((p) => p.id === c.parent_id)!);
    done.add(c.id);
    out.push(c);
  };
  CANONICAL_CONSTRUCTS.forEach(visit);
  return out;
}

export function renderCanonicalSeedSql(): string {
  const theories = CANONICAL_THEORIES.map(
    (t) => `  (${lit(t.id)}, ${lit(t.canonical_name)}, ${arr(t.aliases)}, ${lit(t.summary)}, ${arr(t.key_sources)}, ${lit(t.origin)})`,
  );
  const constructs = parentsFirst().map(
    (c) =>
      `  (${lit(c.id)}, ${lit(c.canonical_name)}, ${lit(c.canonical_definition)}, ${lit(c.definition_source)}, ${lit(c.domain)}, ${lit(c.parent_id)}, ${lit(c.origin)})`,
  );
  // The canonical name itself is also an alias, so author labels can be matched in one lookup.
  const aliases = CANONICAL_CONSTRUCTS.flatMap((c) =>
    [c.canonical_name, ...c.aliases].map((a) => `  (${lit(a)}, ${lit(canonicalKey(a))}, ${lit(c.id)}, 'human', 1, true)`),
  );

  return `-- Sinh tự động từ packages/schema/src/canonical-data.ts bằng \`pnpm canonical:build\`; đừng sửa tay.
-- Danh sách lý thuyết và khái niệm chuẩn khởi tạo, phiên bản ${CANONICAL_LIST_VERSION} (bước 0.14, Mục 5.3).

insert into theories (id, canonical_name, aliases, summary, key_sources, origin) values
${theories.join(",\n")}
on conflict (id) do update set
  canonical_name = excluded.canonical_name, aliases = excluded.aliases, summary = excluded.summary,
  key_sources = excluded.key_sources, origin = excluded.origin;

insert into constructs (id, canonical_name, canonical_definition, definition_source, domain, parent_construct_id, origin) values
${constructs.join(",\n")}
on conflict (id) do update set
  canonical_name = excluded.canonical_name, canonical_definition = excluded.canonical_definition,
  definition_source = excluded.definition_source, domain = excluded.domain,
  parent_construct_id = excluded.parent_construct_id, origin = excluded.origin;

insert into construct_aliases (alias, alias_key, construct_id, mapping_method, mapping_confidence, mapping_reviewed) values
${aliases.join(",\n")}
on conflict (alias_key, construct_id) do update set alias = excluded.alias;
`;
}
