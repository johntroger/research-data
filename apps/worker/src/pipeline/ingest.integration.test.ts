/**
 * Integration tests for pipeline S1–S3 (step 1.2), on the synthetic papers with a fake Zotero and
 * fake Crossref. Requires Supabase local: `pnpm db:reset`, then `pnpm test:db`.
 * Every test runs in a transaction that is rolled back.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { connect } from "../db/client.js";
import type { BibMetadata } from "../metadata/crossref.js";
import { sha256 } from "../pdf/text-layer.js";
import { SYNTHETIC_PAPERS } from "../synthetic/papers.js";
import { renderPdf } from "../synthetic/render.js";
import type { InboxPaper } from "../zotero/inbox.js";
import { ingestInbox, type IngestDeps } from "./ingest.js";
import { processingKey } from "./runs.js";

let db: pg.Client;
let dir: string;
const pdfs = new Map<string, Uint8Array>();

beforeAll(async () => {
  db = await connect();
  for (const p of SYNTHETIC_PAPERS) pdfs.set(p.id, await renderPdf(p.render));
});

afterAll(async () => {
  await db.end();
});

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "rd-ingest-"));
  return async () => rm(dir, { recursive: true, force: true });
});

async function inRollback(fn: () => Promise<void>): Promise<void> {
  await db.query("begin");
  try {
    await fn();
  } finally {
    await db.query("rollback");
  }
}

/** Inbox item for synthetic paper `i` (attachment key = its id). */
function item(i: number, overrides: Partial<InboxPaper> = {}): InboxPaper {
  const p = SYNTHETIC_PAPERS[i]!;
  return {
    itemKey: `ITEM${i}`,
    version: 1,
    title: p.render.title,
    doi: `10.5555/synthetic.${i}`,
    year: "2026",
    firstAuthor: "Nguyen",
    attachmentKey: p.id,
    attachmentFilename: `${p.id}.pdf`,
    problem: null,
    zotero: { authors: [{ family: "Nguyen", given: "An" }], journal: "Zotero Journal", volume: "1", issue: null, pages: null },
    ...overrides,
  };
}

function fakeDeps(crossref: (doi: string) => Promise<BibMetadata | null> = async () => null) {
  const downloads: string[] = [];
  const deps: IngestDeps = {
    db,
    zotero: {
      downloadFile: async (key: string) => {
        downloads.push(key);
        const bytes = pdfs.get(key);
        if (!bytes) throw new Error(`no file ${key}`);
        return bytes;
      },
    },
    crossref,
    pdfDir: dir,
    repoRoot: dir,
  };
  return { deps, downloads };
}

const crossrefRecord = (doi: string): BibMetadata => ({
  doi,
  title: "Crossref title",
  authors: [{ family: "Tran", given: "Binh", orcid: null }],
  year: 2026,
  journal: "Journal of Synthetic Marketing",
  volume: "12",
  issue: "3",
  pages: "1201-1204",
  firstPage: 1201,
});

const runsOf = async (fileHash: string) =>
  (
    await db.query<{ step: string; status: string; attempts: number }>(
      "select step, status, attempts from pipeline_runs where processing_key = $1 order by step",
      [processingKey(fileHash)],
    )
  ).rows;

describe("pipeline S1–S3", () => {
  it("ingests the inbox, fills metadata and printed pages, and records every step", async () => {
    await inRollback(async () => {
      const { deps, downloads } = fakeDeps(async (doi) => (doi.endsWith(".0") ? crossrefRecord(doi) : null));
      const results = await ingestInbox(deps, [item(0), item(1), item(2)]);

      expect(results.map((r) => r.outcome)).toEqual(["processed", "processed", "processed"]);
      expect(downloads).toHaveLength(3);
      for (const [i, p] of SYNTHETIC_PAPERS.entries()) {
        const hash = sha256(pdfs.get(p.id)!);
        expect(await runsOf(hash)).toEqual(["S1", "S2", "S3"].map((step) => ({ step, status: "done", attempts: 1 })));
        const s3 = await db.query<{ details: { printed_pages: string[]; printed_page_method: string; pages_without_text: number[] } }>(
          "select details from pipeline_runs where processing_key = $1 and step = 'S3'",
          [processingKey(hash)],
        );
        expect(s3.rows[0]!.details).toMatchObject({
          printed_pages: p.expected.printedPages,
          printed_page_method: p.expected.printedPageMethod,
          pages_without_text: p.expected.pagesWithoutText,
        });
        const paper = await db.query("select * from papers where zotero_item_key = $1", [`ITEM${i}`]);
        expect(paper.rows[0]).toMatchObject({ file_hash: hash, page_count: p.render.pages.length, zotero_version: 1 });
      }
      // Crossref wins when it knows the DOI; Zotero's own fields are the fallback.
      const meta = await db.query<{ zotero_item_key: string; title: string; journal: string; authors: unknown }>(
        "select zotero_item_key, title, journal, authors from papers where zotero_item_key in ('ITEM0', 'ITEM1') order by 1",
      );
      expect(meta.rows).toEqual([
        { zotero_item_key: "ITEM0", title: "Crossref title", journal: "Journal of Synthetic Marketing", authors: [{ family: "Tran", given: "Binh", orcid: null }] },
        { zotero_item_key: "ITEM1", title: SYNTHETIC_PAPERS[1]!.render.title, journal: "Zotero Journal", authors: [{ family: "Nguyen", given: "An", orcid: null }] },
      ]);
    });
  });

  it("skips everything on a second run: no download, no step", async () => {
    await inRollback(async () => {
      const { deps, downloads } = fakeDeps();
      await ingestInbox(deps, [item(0), item(1)]);
      const again = await ingestInbox(deps, [item(0), item(1)]);
      expect(again.map((r) => r.outcome)).toEqual(["up_to_date", "up_to_date"]);
      expect(again.map((r) => r.steps)).toEqual([0, 1].map(() => ({ S1: "skipped", S2: "skipped", S3: "skipped" })));
      expect(downloads).toHaveLength(2);
      expect((await runsOf(sha256(pdfs.get(SYNTHETIC_PAPERS[0]!.id)!))).map((r) => r.attempts)).toEqual([1, 1, 1]);
    });
  });

  it("retries a failed step on the next run and keeps the steps already done", async () => {
    await inRollback(async () => {
      let calls = 0;
      const { deps } = fakeDeps(async () => {
        if (calls++ === 0) throw new Error("Crossref 503 for DOI");
        return null;
      });
      const first = await ingestInbox(deps, [item(0)]);
      expect(first[0]).toMatchObject({ outcome: "failed", steps: { S1: "done", S2: "failed" } });
      const second = await ingestInbox(deps, [item(0)]);
      expect(second[0]).toMatchObject({ outcome: "processed", steps: { S1: "skipped", S2: "done", S3: "done" } });
      expect(await runsOf(sha256(pdfs.get(SYNTHETIC_PAPERS[0]!.id)!))).toEqual([
        { step: "S1", status: "done", attempts: 1 },
        { step: "S2", status: "done", attempts: 2 },
        { step: "S3", status: "done", attempts: 1 },
      ]);
    });
  });

  it("downloads again when the item changes in Zotero, and reruns the steps when the PDF changed", async () => {
    await inRollback(async () => {
      const { deps, downloads } = fakeDeps();
      await ingestInbox(deps, [item(0)]);
      // New version, same file: downloaded again, but the processing key is unchanged.
      const sameFile = await ingestInbox(deps, [item(0, { version: 2 })]);
      expect(sameFile[0]).toMatchObject({ outcome: "up_to_date", downloaded: true });
      // The attachment now holds another PDF: new hash, new processing key, every step runs.
      pdfs.set("replaced", pdfs.get(SYNTHETIC_PAPERS[1]!.id)!);
      const newFile = await ingestInbox(deps, [item(0, { version: 3, attachmentKey: "replaced", doi: null })]);
      expect(newFile[0]).toMatchObject({ outcome: "processed", steps: { S1: "done", S2: "done", S3: "done" } });
      expect(downloads).toEqual([SYNTHETIC_PAPERS[0]!.id, SYNTHETIC_PAPERS[0]!.id, "replaced"]);
      const paper = await db.query("select file_hash, zotero_version from papers where zotero_item_key = 'ITEM0'");
      expect(paper.rows[0]).toEqual({ file_hash: sha256(pdfs.get("replaced")!), zotero_version: 3 });
      pdfs.delete("replaced");
    });
  });

  it("reports duplicates by PDF hash and by DOI instead of creating a second paper", async () => {
    await inRollback(async () => {
      const { deps } = fakeDeps();
      const results = await ingestInbox(deps, [
        item(0),
        item(0, { itemKey: "COPY_SAME_PDF", doi: null }),
        item(1, { itemKey: "COPY_SAME_DOI", doi: "10.5555/synthetic.0" }),
      ]);
      expect(results.map((r) => r.outcome)).toEqual(["processed", "duplicate", "duplicate"]);
      expect(results[1]!.message).toMatch(/same PDF/);
      expect(results[2]!.message).toMatch(/same DOI/);
      const n = await db.query("select count(*)::int as n from papers where zotero_item_key like 'COPY_%'");
      expect(n.rows[0]).toEqual({ n: 0 });
    });
  });

  it("adopts a paper already published from raw_papers/ (same PDF, no Zotero key)", async () => {
    await inRollback(async () => {
      const hash = sha256(pdfs.get(SYNTHETIC_PAPERS[2]!.id)!);
      const before = await db.query<{ id: string }>("insert into papers (file_hash, pdf_path) values ($1, 'raw_papers/x.pdf') returning id", [hash]);
      const { deps } = fakeDeps();
      const [r] = await ingestInbox(deps, [item(2)]);
      expect(r).toMatchObject({ outcome: "processed", paperId: before.rows[0]!.id });
      const paper = await db.query("select zotero_item_key from papers where id = $1", [before.rows[0]!.id]);
      expect(paper.rows[0]).toEqual({ zotero_item_key: "ITEM2" });
    });
  });

  it("explains items without a stored PDF and failed downloads, and carries on", async () => {
    await inRollback(async () => {
      const { deps } = fakeDeps();
      const results = await ingestInbox(deps, [
        item(0, { attachmentKey: null, problem: "no PDF attachment" }),
        item(1, { attachmentKey: "missing-file" }),
        item(2),
      ]);
      expect(results.map((r) => r.outcome)).toEqual(["no_pdf", "failed", "processed"]);
      expect(results[1]!.message).toMatch(/download failed/);
    });
  });
});
