/**
 * Writes the generated views of packages/schema/src/canonical-data.ts:
 *   docs/canonical-lists.md (step 0.14) and supabase/seed.sql (step 1.1).
 * Usage: pnpm canonical:build
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { renderCanonicalMarkdown } from "../packages/schema/src/canonical.js";
import { renderCanonicalSeedSql } from "../packages/schema/src/canonical-sql.js";

const root = path.resolve(import.meta.dirname, "..");
for (const [file, content] of [
  ["docs/canonical-lists.md", renderCanonicalMarkdown()],
  ["supabase/seed.sql", renderCanonicalSeedSql()],
] as const) {
  writeFileSync(path.join(root, file), content);
  console.log(`Đã ghi ${file}`);
}
