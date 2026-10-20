/**
 * Server-side data access through Supabase's REST API with the public (anon) key,
 * so the web sees exactly what visitors are allowed to see (RLS: no hidden fields, no runs).
 */
import type { Badge } from "@research-data/schema";
import type { Concept, PathRow } from "./relations";

export interface Paper {
  id: string;
  doi: string | null;
  title: string | null;
  pdf_path: string | null;
  page_count: number | null;
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

const PAPER_COLUMNS = "id,doi,title,pdf_path,page_count";

export function listPapers(): Promise<Paper[]> {
  return rest<Paper[]>(`papers?select=${PAPER_COLUMNS}&order=created_at.desc`);
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
