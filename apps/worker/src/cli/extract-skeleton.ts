/**
 * Runs the skeleton extraction (step 0.5) on one PDF and prints the result, tokens and cost.
 * Usage: pnpm extract:skeleton [file.pdf]   (default: first PDF in raw_papers/)
 * The raw response is saved to extracted_data/ (git-ignored).
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { geminiConfig, REPO_ROOT } from "../config.js";
import { ExtractionError, extractSkeleton } from "../extract/extract-skeleton.js";
import { geminiGenerator } from "../extract/gemini.js";
import { PRICES_LAST_UPDATED } from "../extract/pricing.js";
import { sha256 } from "../pdf/text-layer.js";

async function pickPdf(arg: string | undefined): Promise<string> {
  if (arg) return path.resolve(arg);
  const dir = path.join(REPO_ROOT, "raw_papers");
  const first = (await readdir(dir)).find((f) => f.toLowerCase().endsWith(".pdf"));
  if (!first) throw new Error(`No PDF found in ${dir}`);
  return path.join(dir, first);
}

const config = geminiConfig();
const file = await pickPdf(process.argv[2]);
const pdf = new Uint8Array(await readFile(file));
const model = config.strongModel;

console.log(`File : ${path.basename(file)}`);
console.log(`Model: ${model}`);
const started = Date.now();

try {
  const result = await extractSkeleton(pdf, { model, generate: geminiGenerator(config.apiKey) });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  const outDir = path.join(REPO_ROOT, "extracted_data");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `${sha256(pdf).slice(0, 16)}.skeleton.json`);
  await writeFile(outFile, JSON.stringify({ ...result, file: path.basename(file) }, null, 2));

  console.log(`\nResult (${seconds}s):`);
  console.log(JSON.stringify(result.data, null, 2));
  console.log(`\nTokens: input ${result.usage.inputTokens}, output (incl. thinking) ${result.usage.outputTokens}`);
  console.log(
    result.costUsd === null
      ? "Cost  : unknown (model not in price table)"
      : `Cost  : $${result.costUsd.toFixed(4)} (prices as of ${PRICES_LAST_UPDATED})`,
  );
  console.log(`Saved : ${path.relative(REPO_ROOT, outFile)}`);
} catch (error) {
  if (error instanceof ExtractionError) {
    console.error(`\nExtraction failed: ${error.message}\nRaw output:\n${error.rawText.slice(0, 2000)}`);
  } else {
    console.error(`\nExtraction failed: ${(error as Error).message}`);
  }
  process.exitCode = 1;
}
