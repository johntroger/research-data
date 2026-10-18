/**
 * Verifies a saved skeleton extraction and writes it to the database, then reads it back (step 0.7).
 * Usage: pnpm publish:skeleton [file.pdf]   (default: first PDF in raw_papers/)
 * Needs Supabase local running (pnpm db:start) and extracted_data/<hash>.skeleton.json from step 0.5.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { SCHEMA_VERSION } from "@research-data/schema";
import { REPO_ROOT } from "../config.js";
import { connect, withTransaction } from "../db/client.js";
import { publishPaper } from "../db/publish.js";
import { SkeletonExtraction } from "../extract/skeleton-schema.js";
import type { SkeletonResult } from "../extract/extract-skeleton.js";
import { resolvePrintedPages } from "../pdf/printed-page.js";
import { readTextLayer } from "../pdf/text-layer.js";
import { verifySkeleton } from "../verify/verify-skeleton.js";

async function pickPdf(arg: string | undefined): Promise<string> {
  if (arg) return path.resolve(arg);
  const dir = path.join(REPO_ROOT, "raw_papers");
  const first = (await readdir(dir)).find((f) => f.toLowerCase().endsWith(".pdf"));
  if (!first) throw new Error(`No PDF found in ${dir}`);
  return path.join(dir, first);
}

const file = await pickPdf(process.argv[2]);
const layer = await readTextLayer(new Uint8Array(await readFile(file)));
const { printedPages } = resolvePrintedPages(layer);
const savedPath = path.join(REPO_ROOT, "extracted_data", `${layer.fileHash.slice(0, 16)}.skeleton.json`);
const saved = JSON.parse(await readFile(savedPath, "utf8")) as SkeletonResult;
const fields = verifySkeleton(layer, SkeletonExtraction.parse(saved.data));

const client = await connect();
try {
  const summary = await withTransaction(client, () =>
    publishPaper(client, {
      layer,
      printedPages,
      pdfPath: path.relative(REPO_ROOT, file).replaceAll("\\", "/"),
      extraction: saved,
      schemaVersion: SCHEMA_VERSION,
      fields,
    }),
  );
  console.log(`Paper ${summary.paperId}`);
  console.log(
    `Fields: ${summary.inserted} inserted, ${summary.updated} updated, ${summary.skippedLocked} kept (edited by hand)`,
  );

  const back = await client.query<{
    natural_key: string;
    badge: string;
    value: unknown;
    pdf_page_index: number | null;
    printed_page: string | null;
  }>(
    `select natural_key, badge, value, pdf_page_index, printed_page
     from extracted_fields where paper_id = $1 order by natural_key`,
    [summary.paperId],
  );
  console.log("\nRead back from the database:");
  for (const row of back.rows) {
    const page = row.pdf_page_index === null ? "-" : `PDF ${row.pdf_page_index + 1} / in ${row.printed_page}`;
    console.log(`  ${row.badge.padEnd(16)} ${row.natural_key.padEnd(40)} ${JSON.stringify(row.value).slice(0, 40).padEnd(42)} ${page}`);
  }
  const runs = await client.query<{ n: string; cost: string | null }>(
    "select count(*) as n, sum(cost_usd) as cost from extraction_runs where paper_id = $1",
    [summary.paperId],
  );
  console.log(`\nExtraction runs stored for this paper: ${runs.rows[0]!.n} (total cost $${Number(runs.rows[0]!.cost ?? 0).toFixed(4)})`);
} finally {
  await client.end();
}
