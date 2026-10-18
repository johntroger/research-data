/**
 * Worker CLI (Giai đoạn 1).
 *   pnpm worker extract [--limit N]   run the pipeline on the Zotero inbox (step 1.2: S1–S3)
 *   pnpm worker status                count pipeline_runs by step and status
 * Uses a READ-ONLY Zotero key (Mục 3.3) and the local Supabase database.
 */
import path from "node:path";
import { REPO_ROOT, zoteroConfig } from "../config.js";
import { connect } from "../db/client.js";
import { fetchCrossref } from "../metadata/crossref.js";
import { ingestInbox, type PaperOutcome } from "../pipeline/ingest.js";
import { readOnlyKeyProblems, ZoteroClient } from "../zotero/client.js";
import { findCollection, inboxPath, listInbox } from "../zotero/inbox.js";

const PDF_DIR = path.join(REPO_ROOT, "raw_papers", "zotero");

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function extract(args: string[]): Promise<number> {
  const limit = option(args, "--limit") ? Number(option(args, "--limit")) : Infinity;
  if (!(limit > 0)) {
    console.error("--limit must be a positive number");
    return 1;
  }
  const config = zoteroConfig();
  const zotero = new ZoteroClient(config);
  const problems = readOnlyKeyProblems(await zotero.keyInfo(), config.userId);
  if (problems.length) {
    console.error(`Zotero key not suitable for this phase:\n  - ${problems.join("\n  - ")}`);
    return 1;
  }
  const inbox = inboxPath(process.env.ZOTERO_INBOX_PATH);
  const collectionKey = await findCollection(zotero, inbox);
  if (!collectionKey) {
    console.error(`Collection "${inbox.join(" › ")}" not found (see pnpm zotero:inbox).`);
    return 1;
  }
  const papers = (await listInbox(zotero, collectionKey)).slice(0, limit);
  console.log(`Inbox "${inbox.join(" › ")}": ${papers.length} item(s)\n`);

  const db = await connect();
  try {
    const results = await ingestInbox(
      { db, zotero, crossref: (doi) => fetchCrossref(doi), pdfDir: PDF_DIR, repoRoot: REPO_ROOT, log: console.log },
      papers,
    );
    const count = (o: PaperOutcome) => results.filter((r) => r.outcome === o).length;
    console.log(
      `\nSummary: ${count("processed")} processed, ${count("up_to_date")} up to date, ${count("duplicate")} duplicate, ` +
        `${count("no_pdf")} without PDF, ${count("failed")} failed; ${results.filter((r) => r.downloaded).length} PDF downloaded.`,
    );
    return count("failed") ? 1 : 0;
  } finally {
    await db.end();
  }
}

async function status(): Promise<number> {
  const db = await connect();
  try {
    const res = await db.query<{ step: string; status: string; n: string }>(
      `select step, status, count(*) as n from pipeline_runs
       group by step, status order by length(step), step, status`,
    );
    if (!res.rows.length) console.log("pipeline_runs is empty.");
    for (const r of res.rows) console.log(`${r.step.padEnd(4)} ${r.status.padEnd(8)} ${r.n}`);
    return 0;
  } finally {
    await db.end();
  }
}

async function main(): Promise<number> {
  const [command, ...args] = process.argv.slice(2);
  if (command === "extract") return extract(args);
  if (command === "status") return status();
  console.error("Usage: pnpm worker extract [--limit N] | pnpm worker status");
  return 1;
}

process.exitCode = await main();
