/**
 * Library filters (step 3b.1, Mục 8.2): pure logic, no I/O. The page loads the papers with a few facts about each
 * (study designs, sample types, countries, whether a correlation matrix exists, badge counts), and this module parses the
 * query from the URL, filters, and counts how many papers each facet value would give with the other filters kept.
 */
import type { PaperInfo } from "./relations";

export interface LibraryItem {
  id: string;
  title: string | null;
  authors: PaperInfo["authors"];
  year: number | null;
  journal: string | null;
  doi: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  pageCount: number | null;
  paperType: string | null;
  designs: string[];
  sampleTypes: string[];
  countries: string[];
  hasMatrix: boolean;
  verified: number;
  attention: number;
  interpreted: number;
}

export interface LibraryQuery {
  q: string;
  years: string[];
  types: string[];
  designs: string[];
  samples: string[];
  countries: string[];
  /** "high": at most 10% of the visible fields are ⚠; "mid": at most 25%. */
  trust: "" | "high" | "mid";
  matrix: boolean;
}

export const FACETS = ["years", "types", "designs", "samples", "countries"] as const;
export type FacetName = (typeof FACETS)[number];

export const TRUST_LIMITS = { high: 0.1, mid: 0.25 } as const;

export const PAPER_TYPE_LABELS: Record<string, string> = {
  empirical_quant: "Thực nghiệm định lượng",
  empirical_qual: "Thực nghiệm định tính",
  mixed: "Phương pháp hỗn hợp",
  conceptual: "Lý thuyết / khái niệm",
  systematic_review: "Tổng quan hệ thống",
  meta_analysis: "Phân tích tổng hợp (meta)",
  literature_review: "Tổng quan tài liệu",
};
export const DESIGN_LABELS: Record<string, string> = {
  survey: "Khảo sát",
  online_experiment: "Thực nghiệm trực tuyến",
  lab_experiment: "Thực nghiệm phòng lab",
  field_experiment: "Thực nghiệm hiện trường",
  longitudinal_panel: "Dữ liệu bảng / dọc",
  secondary_data: "Dữ liệu thứ cấp",
  qualitative: "Định tính",
  other: "Khác",
};
export const SAMPLE_LABELS: Record<string, string> = {
  students: "Sinh viên",
  mturk: "MTurk",
  prolific: "Prolific",
  consumer_panel: "Panel người tiêu dùng",
  online_convenience: "Mẫu thuận tiện trực tuyến",
  social_media_users: "Người dùng mạng xã hội",
  managers: "Nhà quản lý",
  secondary: "Dữ liệu thứ cấp",
  other: "Khác",
};

const list = (v: string | string[] | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : v.split(",")).map((s) => s.trim()).filter(Boolean);

export function parseLibraryQuery(params: Record<string, string | string[] | undefined>): LibraryQuery {
  const one = (k: string) => (Array.isArray(params[k]) ? params[k]![0]! : (params[k] as string | undefined)) ?? "";
  const trust = one("trust");
  return {
    q: one("q").trim(),
    years: list(params.year),
    types: list(params.type),
    designs: list(params.design),
    samples: list(params.sample),
    countries: list(params.country),
    trust: trust === "high" || trust === "mid" ? trust : "",
    matrix: one("matrix") === "1",
  };
}

export function libraryQueryString(q: LibraryQuery): string {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.years.length) p.set("year", q.years.join(","));
  if (q.types.length) p.set("type", q.types.join(","));
  if (q.designs.length) p.set("design", q.designs.join(","));
  if (q.samples.length) p.set("sample", q.samples.join(","));
  if (q.countries.length) p.set("country", q.countries.join(","));
  if (q.trust) p.set("trust", q.trust);
  if (q.matrix) p.set("matrix", "1");
  return p.toString();
}

/** A decade bucket such as "2020s": few papers per year, so single years would be a long list of ones. */
export const decadeOf = (year: number | null): string => (year === null ? "unknown" : `${Math.floor(year / 10) * 10}s`);

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const authorNames = (item: LibraryItem) => item.authors.map((a) => `${a.given ?? ""} ${a.family ?? ""}`).join(" ");

function matchesText(item: LibraryItem, q: string): boolean {
  if (!q) return true;
  const hay = fold([item.title, authorNames(item), item.journal, item.doi, item.year].filter(Boolean).join(" "));
  return fold(q).split(/\s+/).every((w) => hay.includes(w));
}

const anyOf = (wanted: string[], have: string[]) => wanted.length === 0 || wanted.some((w) => have.includes(w));

const valuesOf = (item: LibraryItem, facet: FacetName): string[] => {
  switch (facet) {
    case "years": return [decadeOf(item.year)];
    case "types": return item.paperType ? [item.paperType] : ["unknown"];
    case "designs": return item.designs.length ? item.designs : ["unknown"];
    case "samples": return item.sampleTypes.length ? item.sampleTypes : ["unknown"];
    case "countries": return item.countries.length ? item.countries : ["unknown"];
  }
};

export function warnShare(item: LibraryItem): number {
  const total = item.verified + item.attention + item.interpreted;
  return total === 0 ? 1 : item.attention / total;
}

function passes(item: LibraryItem, q: LibraryQuery, skip?: FacetName): boolean {
  if (!matchesText(item, q.q)) return false;
  for (const f of FACETS) if (f !== skip && !anyOf(q[f], valuesOf(item, f))) return false;
  if (q.trust && warnShare(item) > TRUST_LIMITS[q.trust]) return false;
  if (q.matrix && !item.hasMatrix) return false;
  return true;
}

export function filterLibrary(items: LibraryItem[], q: LibraryQuery): LibraryItem[] {
  return items.filter((i) => passes(i, q));
}

export interface FacetOption {
  value: string;
  count: number;
  selected: boolean;
}

/** Options of one facet with the number of papers each would give if picked, the other filters kept (this facet's own picks ignored). */
export function facetOptions(items: LibraryItem[], q: LibraryQuery, facet: FacetName): FacetOption[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!passes(item, q, facet)) continue;
    for (const v of new Set(valuesOf(item, facet))) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  for (const v of q[facet]) if (!counts.has(v)) counts.set(v, 0);
  const rank = (v: string) => (v === "unknown" ? 1 : 0);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count, selected: q[facet].includes(value) }))
    .sort((a, b) => rank(a.value) - rank(b.value) || (facet === "years" ? b.value.localeCompare(a.value) : b.count - a.count || a.value.localeCompare(b.value)));
}

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["vi"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
