/**
 * Writes docs/canonical-lists.md from packages/schema/src/canonical-data.ts (step 0.14).
 * Usage: pnpm canonical:doc
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { renderCanonicalMarkdown } from "../packages/schema/src/canonical.js";

const file = path.resolve(import.meta.dirname, "../docs/canonical-lists.md");
writeFileSync(file, renderCanonicalMarkdown());
console.log(`Đã ghi ${path.relative(process.cwd(), file)}`);
