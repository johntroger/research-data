/**
 * Checks a saved full extraction (step 1.3) against the PDF and prints the badges (steps 1.4–1.5):
 * Layer B, cross-checks, recomputed statistics and completeness. No API call, no cost.
 * Usage: pnpm verify:full <file.pdf> [--top-up]
 * With --top-up, items the PDF has but the first pass missed are extracted with small extra Gemini
 * calls (about $0.07 each); the merged result replaces extracted_data/<hash>.full.json.
 * Reads extracted_data/<hash>.full.json (from `pnpm extract:full`); writes <hash>.verify.json.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { geminiConfig, REPO_ROOT } from "../config.js";
import { geminiGenerator } from "../extract/gemini.js";
import { topUp } from "../extract/topup.js";
import { readTextLayer, sha256 } from "../pdf/text-layer.js";
import { analysePaper, type PaperAnalysis } from "../verify/analyse.js";
import type { FullData } from "../verify/verify-full.js";

const ICON: Record<string, string> = { auto_verified: "✓", needs_attention: "⚠", ai_interpreted: "◇", hidden: "ẩn" };

function print(name: string, a: PaperAnalysis): void {
  const count = (badge: string) => a.fields.filter((r) => r.badge === badge).length;
  console.log(
    `${name}: ${a.fields.length} fields · ✓ ${count("auto_verified")} · ⚠ ${count("needs_attention")} · ◇ ${count("ai_interpreted")} · ẩn ${count("hidden")} · ${a.completeness}\n`,
  );
  for (const r of a.fields.filter((r) => r.badge === "needs_attention" || r.badge === "hidden")) {
    const failed = r.checks.filter((c) => !c.passed).map((c) => `${c.name}: ${c.detail}`).join(" | ");
    console.log(`${ICON[r.badge]!.padEnd(2)} ${r.naturalKey} = ${JSON.stringify(r.value).slice(0, 40)}\n     ${failed.slice(0, 220)}`);
  }
  if (a.stats.length) {
    console.log("\nThống kê tính lại:");
    for (const s of a.stats) {
      const mark = s.status === "consistent" ? "✓" : s.status === "not_checked" ? "·" : "⚠";
      console.log(`  ${mark} ${s.stat} → p "${s.reported}": ${s.status}${s.errorSource ? ` (${s.errorSource})` : ""} — ${s.detail}`);
    }
  }
  if (a.missing.length) {
    console.log("\nMục còn thiếu:");
    for (const m of a.missing) console.log(`  - ${m.note}`);
  }
}

async function main(): Promise<number> {
  const [arg, flag] = process.argv.slice(2);
  if (!arg) {
    console.error("Usage: pnpm verify:full <file.pdf> [--top-up]");
    return 1;
  }
  const pdf = new Uint8Array(await readFile(path.resolve(arg)));
  const stem = path.join(REPO_ROOT, "extracted_data", sha256(pdf).slice(0, 16));
  const saved = JSON.parse(await readFile(`${stem}.full.json`, "utf8")) as FullData & { status: string; calls: unknown[]; top_ups?: unknown[] };
  if (saved.status !== "done") {
    console.error(`The saved extraction did not finish (${saved.status}); run pnpm extract:full again.`);
    return 1;
  }
  const layer = await readTextLayer(pdf);
  let analysis = analysePaper(layer, saved);

  if (flag === "--top-up" && analysis.missing.length > 0) {
    const config = geminiConfig();
    console.log(`Trích bổ sung ${analysis.missing.length} mục thiếu…\n`);
    const result = await topUp(pdf, saved, analysis.missing, { model: config.strongModel, generate: geminiGenerator(config.apiKey) });
    const cost = result.calls.reduce((n, c) => n + (c.costUsd ?? 0), 0);
    console.log(`Đã thêm: ${result.added.join(", ") || "không có gì"} · ${result.calls.length} lượt gọi · $${cost.toFixed(4)}\n`);
    await writeFile(
      `${stem}.full.json`,
      JSON.stringify({ ...saved, ...result.data, top_ups: [...(saved.top_ups ?? []), { added: result.added, calls: result.calls }] }, null, 2),
    );
    analysis = analysePaper(layer, result.data);
  }

  await writeFile(`${stem}.verify.json`, JSON.stringify(analysis, null, 2));
  print(path.basename(arg), analysis);
  console.log(`\nSaved: ${path.relative(REPO_ROOT, `${stem}.verify.json`)}`);
  return 0;
}

process.exitCode = await main();
