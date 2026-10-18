/**
 * Server-side data access through Supabase's REST API with the public (anon) key,
 * so the web sees exactly what visitors are allowed to see (RLS: no hidden fields, no runs).
 */
import type { Badge } from "@research-data/schema";

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
    `extracted_fields?select=id,natural_key,field_name,tier,value,evidence_quote,pdf_page_index,printed_page,badge,check_results` +
      `&paper_id=eq.${paperId}&order=natural_key`,
  );
}

/** Short display name for a paper until real metadata (Crossref) arrives in Giai đoạn 1. */
export function paperLabel(paper: Paper): string {
  return paper.title ?? paper.pdf_path?.split("/").pop()?.replace(/\.pdf$/i, "") ?? paper.id;
}
