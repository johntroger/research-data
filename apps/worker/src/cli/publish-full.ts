/**
 * Verifies a saved full extraction and publishes it to the database (steps 1.4–1.8, S5–S10).
 * Usage: pnpm publish:full <file.pdf> [--force]
 * No API call, no cost. Needs Supabase local (pnpm db:start) and extracted_data/<hash>.full.json from
 * `pnpm extract:full` or the Batch flow. Re-running is safe: locked (hand-edited) data is never overwritten.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "../config.js";
import { connect } from "../db/client.js";
import { publishExtracted, type SavedExtraction } from "../pipeline/extracted.js";
import { sha256 } from "../pdf/text-layer.js";

async function main(): Promise<number> {
  const [arg, flag] = process.argv.slice(2);
  if (!arg) {
    console.error("Usage: pnpm publish:full <file.pdf> [--force]");
    return 1;
  }
  const file = path.resolve(arg);
  const pdf = new Uint8Array(await readFile(file));
  const saved = JSON.parse(await readFile(path.join(REPO_ROOT, "extracted_data", `${sha256(pdf).slice(0, 16)}.full.json`), "utf8")) as SavedExtraction;

  const db = await connect();
  try {
    const result = await publishExtracted(db, { pdf, pdfPath: path.relative(REPO_ROOT, file).replaceAll("\\", "/"), saved, force: flag === "--force" });
    console.log(`Steps: ${Object.entries(result.steps).map(([s, v]) => `${s}:${v}`).join(" ")}`);
    const a = result.analysis;
    const n = (badge: string) => a.fields.filter((f) => f.badge === badge).length;
    console.log(`Fields: ✓ ${n("auto_verified")} · ⚠ ${n("needs_attention")} · ◇ ${n("ai_interpreted")} · ẩn ${n("hidden")} · ${a.completeness}`);
    if (!result.published) {
      console.log("Already published under this processing key (add --force to publish again).");
      return 0;
    }
    const p = result.published;
    console.log(`\nPaper ${p.paperId}`);
    console.log(`Runs: ${p.runs.stored} stored, ${p.runs.reused} reused · evidence rows: ${p.evidence}`);
    for (const [table, c] of Object.entries(p.tables)) {
      console.log(`  ${table.padEnd(22)} +${c.inserted} ~${c.updated} locked ${c.skippedLocked} removed ${c.removed}${c.orphanedLocked ? ` ⚠ ${c.orphanedLocked} locked row(s) no longer in the extraction` : ""}`);
    }
    const f = p.fields;
    console.log(`  ${"extracted_fields".padEnd(22)} +${f.inserted} ~${f.updated} locked ${f.skippedLocked} removed ${f.removed}${f.orphanedLocked ? ` ⚠ ${f.orphanedLocked} locked field(s) no longer in the extraction` : ""}`);
    return 0;
  } finally {
    await db.end();
  }
}

process.exitCode = await main();
