/**
 * The extraction queue (step 1.7): papers that went through S1–S3 and have no finished full
 * extraction yet, and are not waiting in a Batch.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type pg from "pg";

export interface QueuedPaper {
  fileHash: string;
  pdfPath: string;
  title: string | null;
  pages: number;
}

/** Path of the saved full extraction of a PDF (same naming as the extract:full CLI). */
export const resultFile = (extractedDir: string, fileHash: string) => path.join(extractedDir, `${fileHash.slice(0, 16)}.full.json`);

export async function hasFinishedExtraction(extractedDir: string, fileHash: string): Promise<boolean> {
  const file = resultFile(extractedDir, fileHash);
  if (!existsSync(file)) return false;
  return /"status":\s*"done"/.test((await readFile(file, "utf8")).slice(0, 2000));
}

/** Path of a Batch result kept only for comparison with the synchronous one (step 1.9c). */
export const batchResultFile = (extractedDir: string, fileHash: string) => path.join(extractedDir, `${fileHash.slice(0, 16)}.batch.json`);

/** Papers that already have a finished synchronous extraction: the ones a Batch comparison can run on. */
export async function loadExtracted(db: pg.Client, extractedDir: string): Promise<QueuedPaper[]> {
  const rows = await db.query<{ file_hash: string; pdf_path: string; title: string | null; page_count: number }>(
    "select file_hash, pdf_path, title, page_count from papers where pdf_path is not null and page_count is not null order by created_at",
  );
  const out: QueuedPaper[] = [];
  for (const r of rows.rows) if (await hasFinishedExtraction(extractedDir, r.file_hash)) out.push({ fileHash: r.file_hash, pdfPath: r.pdf_path, title: r.title, pages: r.page_count });
  return out;
}

export async function loadQueue(db: pg.Client, extractedDir: string): Promise<QueuedPaper[]> {
  const rows = await db.query<{ file_hash: string; pdf_path: string; title: string | null; page_count: number }>(
    `select p.file_hash, p.pdf_path, p.title, p.page_count from papers p
     where p.pdf_path is not null and p.page_count is not null and p.zotero_item_key is not null
       and not exists (select 1 from batch_jobs b where b.file_hash = p.file_hash and b.phase = 'structure' and b.purpose = 'extract' and b.state in ('submitted', 'succeeded', 'ingested'))
     order by p.created_at`,
  );
  const queue: QueuedPaper[] = [];
  for (const r of rows.rows) {
    if (await hasFinishedExtraction(extractedDir, r.file_hash)) continue;
    queue.push({ fileHash: r.file_hash, pdfPath: r.pdf_path, title: r.title, pages: r.page_count });
  }
  return queue;
}
