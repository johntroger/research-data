/**
 * Step P1.1: refreshes a paper's bibliographic fields from Crossref (never from the LLM), optionally after the owner supplies a
 * DOI that Zotero lacked. A paper whose DOI Crossref does not know is left untouched.
 */
import type pg from "pg";
import { fetchCrossref, type BibMetadata } from "../metadata/crossref.js";

export interface MetadataPaper {
  id: string;
  doi: string | null;
  title: string | null;
  year: number | null;
  journal: string | null;
  authors: { family: string; given: string | null }[];
  abstract?: string | null;
}

export interface MetadataChange {
  paper: MetadataPaper;
  /** null: no DOI, or Crossref has no record. */
  meta: BibMetadata | null;
  changes: string[];
}

const names = (authors: { family: string; given: string | null }[]) => authors.map((a) => `${a.family}${a.given ? `, ${a.given}` : ""}`).join("; ");

export function diffMetadata(paper: MetadataPaper, meta: BibMetadata | null): MetadataChange {
  if (!meta) return { paper, meta, changes: [] };
  const changes: string[] = [];
  if (meta.title && meta.title !== paper.title) changes.push(`title: ${paper.title ?? "-"} -> ${meta.title}`);
  if (meta.year && meta.year !== paper.year) changes.push(`year: ${paper.year ?? "-"} -> ${meta.year}`);
  if (meta.journal && meta.journal !== paper.journal) changes.push(`journal: ${paper.journal ?? "-"} -> ${meta.journal}`);
  if (meta.authors.length > 0 && names(meta.authors) !== names(paper.authors)) changes.push(`authors: ${names(paper.authors) || "-"} -> ${names(meta.authors)}`);
  if (meta.abstract && meta.abstract !== paper.abstract) changes.push(`abstract: ${paper.abstract ? "changed" : "added"} (${meta.abstract.length} characters)`);
  if (meta.doi !== paper.doi) changes.push(`doi: ${paper.doi ?? "-"} -> ${meta.doi}`);
  return { paper, meta, changes };
}

export async function lookupMetadata(papers: MetadataPaper[], doiOverride?: string): Promise<MetadataChange[]> {
  const out: MetadataChange[] = [];
  for (const paper of papers) {
    const doi = doiOverride ?? paper.doi;
    const meta = doi ? await fetchCrossref(doi) : null;
    out.push(diffMetadata(paper, meta));
    await new Promise((r) => setTimeout(r, 200));
  }
  return out;
}

export async function saveMetadata(db: pg.Client, changes: MetadataChange[]): Promise<number> {
  let n = 0;
  for (const c of changes) {
    if (!c.meta || c.changes.length === 0) continue;
    const m = c.meta;
    const r = await db.query(
      `update papers set doi = $2, title = coalesce($3, title), authors = case when $4::jsonb = '[]'::jsonb then authors else $4::jsonb end,
         year = coalesce($5, year), journal = coalesce($6, journal), volume = coalesce($7, volume), issue = coalesce($8, issue),
         pages = coalesce($9, pages), abstract = coalesce($10::text, abstract),
         abstract_source = case when $10::text is null then abstract_source else 'Crossref' end, updated_at = now() where id = $1`,
      [c.paper.id, m.doi, m.title, JSON.stringify(m.authors), m.year, m.journal, m.volume, m.issue, m.pages, m.abstract ?? null],
    );
    n += r.rowCount ?? 0;
  }
  return n;
}
