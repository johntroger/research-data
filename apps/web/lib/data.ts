/**
 * Server-side data access through Supabase's REST API with the public (anon) key,
 * so the web sees exactly what visitors are allowed to see (RLS: no hidden fields, no runs).
 */
import type { Badge } from "@research-data/schema";
import type { LibraryItem } from "./library";
import type { Concept, PathRow } from "./relations";

export interface Paper {
  id: string;
  doi: string | null;
  title: string | null;
  pdf_path: string | null;
  page_count: number | null;
  oa_status: string | null;
  license_source: string | null;
  authors: { given?: string | null; family?: string | null }[];
  year: number | null;
  journal: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  paper_type?: string | null;
}

export interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface ExtractedField {
  id: string;
  natural_key: string;
  field_name: string;
  tier: "T1" | "T2" | "T3";
  value: unknown;
  evidence_quote: string | null;
  pdf_page_index: number | null;
  printed_page: string | null;
  badge: Badge;
  check_results: { checks?: CheckResult[] };
  /** Where the quote sits on its PDF page, in PDF points (step 3a.3); null when it could not be placed. */
  highlight: { page: number; rects: [number, number, number, number][] } | null;
}

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.local");
  }
  return { url, key };
}

async function rest<T>(pathAndQuery: string): Promise<T> {
  const { url, key } = config();
  const res = await fetch(`${url}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

const PAPER_COLUMNS = "id,doi,title,pdf_path,page_count,oa_status,license_source,authors,year,journal,volume,issue,pages,paper_type";

export function listPapers(): Promise<Paper[]> {
  return rest<Paper[]>(`papers?select=${PAPER_COLUMNS}&order=created_at.desc`);
}

/** How many visible fields of each paper are ✓ / ⚠ / ◇ (a view that obeys the visitor's row-level security). */
export interface BadgeCounts {
  paper_id: string;
  verified: number;
  attention: number;
  interpreted: number;
}

export async function listBadgeCounts(): Promise<Map<string, BadgeCounts>> {
  const rows = await rest<BadgeCounts[]>("paper_badge_counts?select=paper_id,verified,attention,interpreted");
  return new Map(rows.map((r) => [r.paper_id, r]));
}

export async function getPaper(id: string): Promise<Paper | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await rest<Paper[]>(`papers?select=${PAPER_COLUMNS}&id=eq.${id}`);
  return rows[0] ?? null;
}

export function listFields(paperId: string): Promise<ExtractedField[]> {
  return rest<ExtractedField[]>(
    `extracted_fields?select=id,natural_key,field_name,tier,value,evidence_quote,pdf_page_index,printed_page,badge,check_results,highlight` +
      `&paper_id=eq.${paperId}&order=natural_key`,
  );
}

/** Short display name for a paper until real metadata (Crossref) arrives in Giai đoạn 1. */
export function paperLabel(paper: Paper): string {
  return paper.title ?? paper.pdf_path?.split("/").pop()?.replace(/\.pdf$/i, "") ?? paper.id;
}

/** Papers with the facts the library filters on (step 3b.1), read with the visitor's rights. */
export async function listLibraryItems(): Promise<LibraryItem[]> {
  const [papers, studies, samples, matrices, counts] = await Promise.all([
    listPapers(),
    restAll<{ paper_id: string; research_design: string | null }>("studies?select=paper_id,research_design"),
    restAll<{ paper_id: string; sample_type: string | null; country_iso: string[] }>("samples?select=paper_id,sample_type,country_iso"),
    restAll<{ paper_id: string }>("correlation_matrices?select=paper_id"),
    listBadgeCounts(),
  ]);
  const by = <T extends { paper_id: string }>(rows: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of rows) m.set(r.paper_id, [...(m.get(r.paper_id) ?? []), r]);
    return m;
  };
  const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))];
  const studiesBy = by(studies);
  const samplesBy = by(samples);
  const matrixIds = new Set(matrices.map((m) => m.paper_id));
  return papers.map((p) => {
    const c = counts.get(p.id);
    return {
      id: p.id, title: p.title, authors: p.authors ?? [], year: p.year, journal: p.journal, doi: p.doi,
      volume: p.volume ?? null, issue: p.issue ?? null, pages: p.pages ?? null, pageCount: p.page_count, paperType: p.paper_type ?? null,
      designs: uniq((studiesBy.get(p.id) ?? []).map((s) => s.research_design)),
      sampleTypes: uniq((samplesBy.get(p.id) ?? []).map((s) => s.sample_type)),
      countries: uniq((samplesBy.get(p.id) ?? []).flatMap((s) => s.country_iso)),
      hasMatrix: matrixIds.has(p.id),
      verified: c?.verified ?? 0, attention: c?.attention ?? 0, interpreted: c?.interpreted ?? 0,
    };
  });
}

// --- Relationship Search (step 3a.1) ---------------------------------------------------------------

/** All rows of a query, page by page: the REST API returns at most 1000 rows per request. */
async function restAll<T>(pathAndQuery: string): Promise<T[]> {
  const { url, key } = config();
  const all: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const res = await fetch(`${url}/rest/v1/${pathAndQuery}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Range-Unit": "items", Range: `${from}-${from + size - 1}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    const rows = (await res.json()) as T[];
    all.push(...rows);
    if (rows.length < size) return all;
  }
}

const PATH_COLUMNS =
  "id,paper_id,study_id,natural_key,hypothesis_code,iv_label_original,dv_label_original,iv_construct_id,dv_construct_id," +
  "mediator_labels,moderator_labels,effect_type,estimate_type,estimate,p_value,p_reported_as,status,observed_sign,significant,badge," +
  "studies(study_label,research_design),papers(title,authors,year,journal,citekey,apa_citation),evidence(printed_page,pdf_page_index)";

/** Every test (path) visitors may see, with its study, paper and evidence page. */
export function listPathRows(): Promise<PathRow[]> {
  return restAll<PathRow>(`path_results?select=${PATH_COLUMNS}&order=paper_id,natural_key`);
}

/** The canonical concepts with their other names. */
export async function listConcepts(): Promise<Concept[]> {
  const rows = await restAll<{ id: string; canonical_name: string; construct_aliases: { alias: string }[] }>(
    "constructs?select=id,canonical_name,construct_aliases(alias)&order=id",
  );
  return rows.map((r) => ({ id: r.id, canonical_name: r.canonical_name, aliases: r.construct_aliases.map((a) => a.alias) }));
}
