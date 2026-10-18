/**
 * Checks a saved skeleton extraction (step 0.5) against the PDF text layer (step 0.6).
 * Usage: pnpm verify:skeleton [file.pdf]   (default: first PDF in raw_papers/)
 * Reads extracted_data/<hash>.skeleton.json written by `pnpm extract:skeleton`.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "../config.js";
import { SkeletonExtraction } from "../extract/skeleton-schema.js";
import { readTextLayer } from "../pdf/text-layer.js";
import { verifySkeleton } from "../verify/verify-skeleton.js";

const BADGE_ICON: Record<string, string> = {
  auto_verified: "✓",
  needs_attention: "⚠",
  ai_interpreted: "◇",
  hidden: "ẩn",
  human_reviewed: "★",
  disputed: "⚑",
};

async function pickPdf(arg: string | undefined): Promise<string> {
  if (arg) return path.resolve(arg);
  const dir = path.join(REPO_ROOT, "raw_papers");
  const first = (await readdir(dir)).find((f) => f.toLowerCase().endsWith(".pdf"));
  if (!first) throw new Error(`No PDF found in ${dir}`);
  return path.join(dir, first);
}

const file = await pickPdf(process.argv[2]);
const layer = await readTextLayer(new Uint8Array(await readFile(file)));
const savedPath = path.join(REPO_ROOT, "extracted_data", `${layer.fileHash.slice(0, 16)}.skeleton.json`);
const saved = JSON.parse(await readFile(savedPath, "utf8")) as { data: unknown; model: string };
const data = SkeletonExtraction.parse(saved.data);

console.log(`File : ${path.basename(file)}`);
console.log(`Model: ${saved.model}\n`);
for (const field of verifySkeleton(layer, data)) {
  console.log(`${BADGE_ICON[field.badge]} ${field.naturalKey} = ${JSON.stringify(field.value).slice(0, 80)}`);
  for (const check of field.checks) console.log(`    ${check.passed ? "✓" : "✗"} ${check.name}: ${check.detail}`);
}
