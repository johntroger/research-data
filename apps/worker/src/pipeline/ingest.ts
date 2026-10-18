/**
 * Pipeline S1–S3 (Mục 2) for the papers of the Zotero inbox (step 1.2):
 *   S1 ingest     — download the stored PDF, SHA-256, create the paper, detect duplicates (hash, DOI, Zotero key)
 *   S2 metadata   — bibliographic data from Crossref by DOI, Zotero as fallback (never from the LLM)
 *   S3 text_layer — text layer, scanned-PDF detection, printed page numbers
 * Every step is recorded in pipeline_runs and skipped when already done for the processing key.
 * A second run without changes in Zotero downloads nothing and runs no step.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type pg from "pg";
import type { BibMetadata } from "../metadata/crossref.js";
import { resolvePrintedPages } from "../pdf/printed-page.js";
import { readTextLayer, sha256 } from "../pdf/text-layer.js";
import type { ZoteroClient } from "../zotero/client.js";
import type { InboxPaper } from "../zotero/inbox.js";
import { attachPaper, processingKey, runStep, type StepContext, type StepOutcome } from "./runs.js";

export interface IngestDeps {
  db: pg.Client;
  zotero: Pick<ZoteroClient, "downloadFile">;
  crossref: (doi: string) => Promise<BibMetadata | null>;
  /** Folder for downloaded PDFs (git-ignored). */
  pdfDir: string;
  /** pdf_path is stored relative to this folder (the repository root). */
  repoRoot: string;
  log?: (line: string) => void;
}

export type PaperOutcome =
  /** At least one step ran in this run. */
  | "processed"
  /** Every step was already done: nothing to do. */
  | "up_to_date"
  | "duplicate"
  | "no_pdf"
  | "failed";

export interface PaperResult {
  itemKey: string;
  title: string;
  outcome: PaperOutcome;
  paperId: string | null;
  downloaded: boolean;
  steps: Partial<Record<"S1" | "S2" | "S3", StepOutcome<Record<string, unknown>>["status"]>>;
  message: string | null;
}

interface S1Details extends Record<string, unknown> {
  paper_id: string;
  pdf_path: string;
  bytes: number;
}

interface S2Details extends Record<string, unknown> {
  source: "crossref" | "zotero";
  doi: string | null;
  first_page: number | null;
}

/** Downloads to a temporary name first, so an interrupted download never leaves a broken PDF. */
async function download(deps: IngestDeps, attachmentKey: string, file: string): Promise<Uint8Array> {
  const bytes = await deps.zotero.downloadFile(attachmentKey);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(`${file}.part`, bytes);
  await rename(`${file}.part`, file);
  return bytes;
}

/**
 * Another paper that already holds this PDF or DOI under a different Zotero item. Checked before
 * the steps: the same PDF gives the same processing key, so the steps alone would just be skipped.
 */
async function findDuplicate(db: pg.Client, paper: InboxPaper, fileHash: string) {
  const duplicate = await db.query<{ id: string; reason: string }>(
    `select id, case when file_hash = $1 then 'same PDF (SHA-256)' else 'same DOI' end as reason
     from papers
     where (file_hash = $1 and zotero_item_key is not null and zotero_item_key <> $2)
        or ($3::text is not null and doi = $3 and file_hash <> $1 and coalesce(zotero_item_key, '') <> $2)
     order by (file_hash = $1) desc
     limit 1`,
    [fileHash, paper.itemKey, paper.doi],
  );
  return duplicate.rows[0] ?? null;
}

/** S1: create or update the paper row. */
async function ingest(deps: IngestDeps, paper: InboxPaper, fileHash: string, bytes: number, pdfPath: string): Promise<S1Details> {
  const { db } = deps;
  const values = [fileHash, paper.itemKey, paper.attachmentKey, paper.version, paper.doi, paper.title, paper.year ? Number(paper.year) : null, pdfPath];
  const byItem = await db.query<{ id: string }>(
    `update papers set file_hash = $1, zotero_attachment_key = $3, zotero_version = $4, doi = coalesce($5, doi),
       title = coalesce(title, $6), year = coalesce(year, $7), pdf_path = $8, updated_at = now()
     where zotero_item_key = $2 returning id`,
    values,
  );
  // A PDF already known from raw_papers/ (same hash, no Zotero key yet) is adopted by the Zotero item.
  const id =
    byItem.rows[0]?.id ??
    (
      await db.query<{ id: string }>(
        `insert into papers (file_hash, zotero_item_key, zotero_attachment_key, zotero_version, doi, title, year, pdf_path)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (file_hash) do update set zotero_item_key = excluded.zotero_item_key,
           zotero_attachment_key = excluded.zotero_attachment_key, zotero_version = excluded.zotero_version,
           doi = coalesce(papers.doi, excluded.doi), title = coalesce(papers.title, excluded.title),
           year = coalesce(papers.year, excluded.year), pdf_path = excluded.pdf_path, updated_at = now()
         returning id`,
        values,
      )
    ).rows[0]!.id;
  return { paper_id: id, pdf_path: pdfPath, bytes };
}

/** S2: Crossref first; Zotero's own fields when there is no DOI or Crossref does not know it. */
async function metadata(deps: IngestDeps, paper: InboxPaper, paperId: string): Promise<S2Details> {
  const crossref = paper.doi ? await deps.crossref(paper.doi) : null;
  const meta: Omit<BibMetadata, "doi" | "firstPage"> & { doi: string | null } = crossref ?? {
    doi: paper.doi,
    title: paper.title,
    authors: paper.zotero.authors.map((a) => ({ ...a, orcid: null })),
    year: paper.year ? Number(paper.year) : null,
    journal: paper.zotero.journal,
    volume: paper.zotero.volume,
    issue: paper.zotero.issue,
    pages: paper.zotero.pages,
  };
  await deps.db.query(
    `update papers set doi = coalesce($2, doi), title = $3, authors = $4, year = $5, journal = $6,
       volume = $7, issue = $8, pages = $9, updated_at = now()
     where id = $1`,
    [paperId, meta.doi, meta.title, JSON.stringify(meta.authors), meta.year, meta.journal, meta.volume, meta.issue, meta.pages],
  );
  return { source: crossref ? "crossref" : "zotero", doi: meta.doi, first_page: crossref?.firstPage ?? null };
}

/** S3: text layer and printed page numbers. */
async function textLayer(deps: IngestDeps, paperId: string, bytes: Uint8Array, firstPage: number | null) {
  const layer = await readTextLayer(bytes);
  const printed = resolvePrintedPages(layer, firstPage ? { crossrefFirstPage: firstPage } : {});
  await deps.db.query("update papers set page_count = $2, updated_at = now() where id = $1", [paperId, layer.pageCount]);
  return {
    page_count: layer.pageCount,
    needs_ocr: layer.needsOcr,
    printed_page_method: printed.method,
    printed_pages: printed.printedPages,
    pages_without_text: layer.pages.filter((p) => !p.hasTextLayer).map((p) => p.pdfPageIndex + 1),
  };
}

export async function ingestPaper(deps: IngestDeps, paper: InboxPaper): Promise<PaperResult> {
  const result: PaperResult = {
    itemKey: paper.itemKey,
    title: paper.title,
    outcome: "failed",
    paperId: null,
    downloaded: false,
    steps: {},
    message: null,
  };
  if (!paper.attachmentKey) return { ...result, outcome: "no_pdf", message: paper.problem };

  const file = path.join(deps.pdfDir, `${paper.attachmentKey}.pdf`);
  const pdfPath = path.relative(deps.repoRoot, file).split(path.sep).join("/");
  const known = await deps.db.query<{ id: string; zotero_version: number | null }>(
    "select id, zotero_version from papers where zotero_item_key = $1",
    [paper.itemKey],
  );

  // Download only when the item is new or changed in Zotero, or the local copy is missing.
  let bytes: Uint8Array;
  try {
    if (known.rows[0]?.zotero_version === paper.version && existsSync(file)) {
      bytes = new Uint8Array(await readFile(file));
    } else {
      bytes = await download(deps, paper.attachmentKey, file);
      result.downloaded = true;
    }
  } catch (error) {
    return { ...result, message: `download failed: ${(error as Error).message}` };
  }

  const fileHash = sha256(bytes);
  const ctx: StepContext = {
    processingKey: processingKey(fileHash),
    paperId: known.rows[0]?.id ?? null,
    fileHash,
    zoteroItemKey: paper.itemKey,
  };

  const duplicate = await findDuplicate(deps.db, paper, fileHash);
  if (duplicate) return { ...result, outcome: "duplicate", message: `${duplicate.reason} as paper ${duplicate.id}` };

  const s1 = await runStep(deps.db, "S1", ctx, () => ingest(deps, paper, fileHash, bytes.length, pdfPath));
  result.steps.S1 = s1.status;
  if (s1.status === "failed") return { ...result, message: s1.error };
  const paperId = s1.details.paper_id;
  result.paperId = paperId;
  ctx.paperId = paperId;
  await attachPaper(deps.db, ctx.processingKey, paperId);
  // Keep the Zotero version current even when S1 was skipped, so the next run does not download again.
  await deps.db.query("update papers set zotero_version = $2 where id = $1 and zotero_version is distinct from $2", [paperId, paper.version]);

  const s2 = await runStep(deps.db, "S2", ctx, () => metadata(deps, paper, paperId));
  result.steps.S2 = s2.status;
  if (s2.status === "failed") return { ...result, message: s2.error };

  const s3 = await runStep(deps.db, "S3", ctx, () => textLayer(deps, paperId, bytes, s2.details.first_page));
  result.steps.S3 = s3.status;
  if (s3.status === "failed") return { ...result, message: s3.error };

  const ran = Object.values(result.steps).some((s) => s === "done");
  return { ...result, outcome: ran ? "processed" : "up_to_date" };
}

/** Runs S1–S3 for each paper in turn; a failure on one paper does not stop the others. */
export async function ingestInbox(deps: IngestDeps, papers: InboxPaper[]): Promise<PaperResult[]> {
  const results: PaperResult[] = [];
  for (const paper of papers) {
    const r = await ingestPaper(deps, paper);
    deps.log?.(
      `${r.outcome.padEnd(10)} ${paper.itemKey} ${Object.entries(r.steps).map(([s, v]) => `${s}:${v}`).join(" ")}` +
        `${r.downloaded ? " (downloaded)" : ""}${r.message ? ` — ${r.message}` : ""} · ${paper.title.slice(0, 60)}`,
    );
    results.push(r);
  }
  return results;
}
