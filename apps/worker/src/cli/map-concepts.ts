/**
 * Maps the construct and theory names of a saved full extraction to the canonical lists (step 1.6).
 * Usage: pnpm map:concepts <file.pdf>      No API call, no cost.
 * Reads extracted_data/<hash>.full.json; writes <hash>.mapping.json. Nothing is merged unless the
 * name equals a canonical name or alias ("không chắc thì tách"); suggestions are only shown.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "../config.js";
import { mapExtraction, type UsedLabel } from "../mapping/extraction.js";
import { sha256 } from "../pdf/text-layer.js";
import type { FullData } from "../verify/verify-full.js";

function print(title: string, rows: UsedLabel[]): void {
  console.log(`\n${title}:`);
  for (const r of rows) {
    const mark = r.status === "mapped" ? "✓ ghép  " : r.status === "ambiguous" ? "? mơ hồ " : "· tách  ";
    console.log(`  ${mark} ${r.label}  [${r.usedAs.join(", ")}]${r.id ? `  →  ${r.id}` : ""}`);
    if (r.status !== "mapped" && r.suggestions.length) console.log(`           gợi ý: ${r.note}`);
  }
}

async function main(): Promise<number> {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: pnpm map:concepts <file.pdf>");
    return 1;
  }
  const pdf = new Uint8Array(await readFile(path.resolve(arg)));
  const stem = path.join(REPO_ROOT, "extracted_data", sha256(pdf).slice(0, 16));
  const saved = JSON.parse(await readFile(`${stem}.full.json`, "utf8")) as FullData & { status: string };
  if (saved.status !== "done") {
    console.error(`The saved extraction did not finish (${saved.status}); run pnpm extract:full again.`);
    return 1;
  }
  const mapping = mapExtraction(saved);
  await writeFile(`${stem}.mapping.json`, JSON.stringify(mapping, null, 2));
  print("Khái niệm", mapping.constructs);
  print("Lý thuyết", mapping.theories);
  const s = mapping.summary;
  console.log(`\nKhái niệm: ${s.constructsMapped} ghép, ${s.constructsSeparate} tách riêng · Lý thuyết: ${s.theoriesMapped} ghép, ${s.theoriesSeparate} tách riêng`);
  console.log(`Saved: ${path.relative(REPO_ROOT, `${stem}.mapping.json`)}`);
  return 0;
}

process.exitCode = await main();
