// Checks that every field named in the data schema (docs/data-schema.md, Mục 5.2 and 5.3)
// has a definition row in docs/codebook.md.  Usage: pnpm codebook:check
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const schema = readFileSync(path.join(ROOT, "docs/data-schema.md"), "utf8");
const codebook = readFileSync(path.join(ROOT, "docs/codebook.md"), "utf8");

/** Field identifiers in backticks, ignoring enum values listed inside {…}. */
function fieldsIn(text) {
  const withoutEnums = text.replace(/\{[^}]*\}/g, "");
  return [...withoutEnums.matchAll(/`([A-Za-z_][A-Za-z0-9_*]*)(\[\])?`/g)].map((m) => m[1]);
}

// Mục 5.2: second column of the entity table. Mục 5.3: the bullet list.
const section52 = schema.slice(schema.indexOf("### 5.2."), schema.indexOf("### 5.3."));
const section53 = schema.slice(schema.indexOf("### 5.3."), schema.indexOf("### 5.4."));
const schemaFields = new Set();
for (const row of section52.split("\n").filter((l) => /^\| \*\*\d/.test(l))) {
  const columns = row.split("|");
  for (const f of fieldsIn(columns[2] ?? "")) schemaFields.add(f);
}
for (const f of fieldsIn(section53)) schemaFields.add(f);

// Codebook: a field is defined when it is the first cell of a table row.
const defined = new Set(
  [...codebook.matchAll(/^\| `([A-Za-z_][A-Za-z0-9_*]*)`/gm)].map((m) => m[1]),
);

// Table names (constructs, construct_aliases, review_changes) are tables, not fields.
const TABLES = new Set(["constructs", "construct_aliases", "review_changes"]);
const missing = [...schemaFields].filter((f) => !TABLES.has(f) && !defined.has(f)).sort();

if (missing.length) {
  console.error(`codebook:check — ${missing.length} schema field(s) without a codebook definition:`);
  for (const f of missing) console.error(`  - ${f}`);
  process.exitCode = 1;
} else {
  console.log(`codebook:check ok — ${[...schemaFields].filter((f) => !TABLES.has(f)).length} schema fields, all defined (${defined.size} codebook rows)`);
}
