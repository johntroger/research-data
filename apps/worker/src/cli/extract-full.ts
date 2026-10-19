/**
 * Runs the full extraction (step 1.3) on one PDF and prints a summary, tokens and cost per call.
 * Usage: pnpm extract:full <file.pdf>
 * The result, including every raw response, is saved to extracted_data/<hash>.full.json (git-ignored),
 * also when a call fails half-way (the calls already made were paid for).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { geminiConfig, loadEnv, REPO_ROOT } from "../config.js";
import { connect } from "../db/client.js";
import { Budget, BudgetExceeded, budgetConfigFromEnv, PgLedger } from "../extract/budget.js";
import { type CallRecord, extractFull, FullExtractionError } from "../extract/extract-full.js";
import { FULL_PROMPT_VERSION } from "../extract/full-prompt.js";
import { geminiGenerator } from "../extract/gemini.js";
import { guardedGenerator } from "../extract/guarded.js";
import { RateLimiter, rateLimitsFromEnv } from "../extract/limits.js";
import { PRICES_LAST_UPDATED } from "../extract/pricing.js";
import { sha256 } from "../pdf/text-layer.js";

const usd = (n: number | null) => (n === null ? "unknown" : `$${n.toFixed(4)}`);

function printCalls(calls: CallRecord[]): void {
  for (const c of calls) {
    console.log(
      `  ${c.pass.padEnd(26)} ${(c.studyLabel ?? "").padEnd(10)} in ${String(c.usage.inputTokens).padStart(6)}` +
        ` out ${String(c.usage.outputTokens).padStart(6)}  ${usd(c.costUsd).padStart(9)}  ${(c.durationMs / 1000).toFixed(1)}s`,
    );
  }
  const costs = calls.map((c) => c.costUsd);
  console.log(`  total ${calls.length} call(s): ${usd(costs.includes(null) ? null : costs.reduce<number>((n, c) => n + c!, 0))} (prices as of ${PRICES_LAST_UPDATED})`);
}

async function main(): Promise<number> {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: pnpm extract:full <file.pdf>");
    return 1;
  }
  const file = path.resolve(arg);
  const config = geminiConfig();
  const pdf = new Uint8Array(await readFile(file));
  const outDir = path.join(REPO_ROOT, "extracted_data");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `${sha256(pdf).slice(0, 16)}.full.json`);
  const base = { file: path.basename(file), file_hash: sha256(pdf), model: config.strongModel, prompt_version: FULL_PROMPT_VERSION };

  console.log(`File : ${base.file}\nModel: ${base.model} · prompt ${FULL_PROMPT_VERSION}\n`);

  // Every paid call goes through the budget cap, the rate limit and the retry rules (step 1.7).
  loadEnv();
  const db = await connect();
  const budget = new Budget(new PgLedger(db), budgetConfigFromEnv());
  const generate = guardedGenerator(geminiGenerator(config.apiKey), {
    budget,
    limiter: new RateLimiter(rateLimitsFromEnv()),
    fileHash: base.file_hash,
    retry: { onRetry: ({ attempt, delayMs }) => console.log(`  … retry ${attempt} in ${(delayMs / 1000).toFixed(0)}s`) },
  });
  console.log(`Budget: ${(await budget.remainingUsd()).toFixed(2)} USD left of ${budget.config.limitUsd.toFixed(2)}\n`);
  try {
    const result = await extractFull(pdf, { model: config.strongModel, generate });
    await writeFile(outFile, JSON.stringify({ ...base, status: "done", ...result }, null, 2));
    const s = result.structure;
    console.log(`paper_type ${s.paper_type} · ${s.studies.length} study(ies) · ${s.hypothesis_codes.length} hypotheses · ${s.tables.length} tables · ${s.theories.length} theories`);
    for (const study of result.studies) {
      console.log(
        `  ${study.study_label}: n=${study.sample.n ?? "?"} · ${study.measurements.length} constructs · ${study.paths.length} paths · ` +
          `${study.correlation_matrices.length} correlation matrices · ${study.condition_cells.length} condition cells`,
      );
    }
    const d = result.discussion;
    console.log(`  discussion: ${d.theoretical_contributions.length} contributions · ${d.limitations.length} limitations · ${d.future_directions.length} future directions\n`);
    printCalls(result.calls);
    console.log(`Saved: ${path.relative(REPO_ROOT, outFile)}`);
    return 0;
  } catch (error) {
    if (error instanceof BudgetExceeded) {
      console.error(`${error.message}\nStopped before the call; the calls already made are in the ledger (pnpm worker spend).`);
      return 1;
    }
    if (!(error instanceof FullExtractionError)) throw error;
    await writeFile(outFile, JSON.stringify({ ...base, status: "failed", error: error.message, failed_raw: error.rawText, calls: error.calls }, null, 2));
    console.error(`Extraction failed at ${error.pass}${error.studyLabel ? ` (${error.studyLabel})` : ""}: ${error.message.slice(0, 500)}\n`);
    printCalls(error.calls);
    console.error(`Saved partial result: ${path.relative(REPO_ROOT, outFile)}`);
    return 1;
  } finally {
    await db.end();
  }
}

process.exitCode = await main();
