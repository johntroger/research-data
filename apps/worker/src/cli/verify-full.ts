/**
 * Checks a saved full extraction (step 1.3) against the PDF (step 1.4) and prints the badges.
 * Usage: pnpm verify:full <file.pdf>
 * Reads extracted_data/<hash>.full.json (from `pnpm extract:full`); no API call, no cost.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "../config.js";
import { readTextLayer, sha256 } from "../pdf/text-layer.js";
import { verifyFull, type FullData } from "../verify/verify-full.js";

const ICON: Record<string, string> = { auto_verified: "✓", needs_attention: "⚠", ai_interpreted: "◇", hidden: "ẩn" };

async function main(): Promise<number> {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: pnpm verify:full <file.pdf>");
    return 1;
  }
  const pdf = new Uint8Array(await readFile(path.resolve(arg)));
  const stem = path.join(REPO_ROOT, "extracted_data", sha256(pdf).slice(0, 16));
  const saved = JSON.parse(await readFile(`${stem}.full.json`, "utf8")) as FullData & { status: string };
  if (saved.status !== "done") {
    console.error(`The saved extraction did not finish (${saved.status}); run pnpm extract:full again.`);
    return 1;
  }
  const rows = verifyFull(await readTextLayer(pdf), saved);
  await writeFile(`${stem}.verify.json`, JSON.stringify(rows, null, 2));

  const count = (badge: string) => rows.filter((r) => r.badge === badge).length;
  console.log(`${path.basename(arg)}: ${rows.length} fields · ✓ ${count("auto_verified")} · ⚠ ${count("needs_attention")} · ◇ ${count("ai_interpreted")} · ẩn ${count("hidden")}\n`);
  for (const r of rows.filter((r) => r.badge === "needs_attention" || r.badge === "hidden")) {
    const failed = r.checks.filter((c) => !c.passed).map((c) => `${c.name}: ${c.detail}`).join(" | ");
    console.log(`${ICON[r.badge]!.padEnd(2)} ${r.naturalKey} = ${JSON.stringify(r.value).slice(0, 40)}\n     ${failed.slice(0, 220)}`);
  }
  console.log(`\nSaved: ${path.relative(REPO_ROOT, `${stem}.verify.json`)}`);
  return 0;
}

process.exitCode = await main();
