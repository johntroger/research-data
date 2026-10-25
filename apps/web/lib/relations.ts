/**
 * Relationship Search (step 3a.1, Mục 8.2b): "what is known about the relationship between variable A and variable B?".
 * Pure logic, no I/O: the page loads the visible path rows and the canonical concepts, and this module parses the
 * query, finds the matching tests, groups them by paper and counts them. Everything counted is "in the repository".
 *
 * A and B are matched against the variable names the authors used (every word typed must appear in the name) and,
 * with "equivalent names" on, against the canonical concept and its aliases, so "risk" finds Perceived Risk and Risk
 * Perception. Only 4 of 410 paths are mapped to a canonical concept so far, hence the names come first.
 */

export type Role = "direct" | "mediated" | "moderated" | "all";
export type Direction = "ab" | "ba" | "both";

export const STATUSES = ["supported", "not_supported", "mixed", "not_hypothesized"] as const;
export const SIGNS = ["positive", "negative", "none"] as const;
export type StatusGroup = (typeof STATUSES)[number];
export type SignGroup = (typeof SIGNS)[number];
/** Kinds of effect size that cannot be compared with each other (the project never converts β to r). */
export const ESTIMATES = ["std_beta", "path_coefficient", "r", "other", "none"] as const;
export type EstimateGroup = (typeof ESTIMATES)[number];
/** How the papers of a result are ordered. "effect" sorts by the largest |estimate| a paper reports, whatever its kind: read the kinds first. */
export const SORTS = ["year", "n", "effect", "name"] as const;
export type SortKey = (typeof SORTS)[number];
export const SORT_LABEL: Record<SortKey, string> = { year: "Năm (mới nhất trước)", n: "Cỡ mẫu (lớn nhất trước)", effect: "Cỡ hiệu ứng (|ước lượng| lớn nhất trước)", name: "Tác giả (A–Z)" };
export const ESTIMATE_LABEL: Record<EstimateGroup, string> = {
  std_beta: "β chuẩn hóa",
  path_coefficient: "hệ số đường dẫn",
  r: "r (tương quan)",
  other: "khác (b, η², OR…)",
  none: "chưa có số",
};

export interface RelationQuery {
  a: string;
  b: string;
  dir: Direction;
  role: Role;
  /** Also match the canonical concept and its aliases. */
  equiv: boolean;
  /** Count tests that are not ✓ / ★ in the summary too. */
  includeWarn: boolean;
  status: StatusGroup[];
  sign: SignGroup[];
  /** Only these kinds of effect size (empty: all). */
  est: EstimateGroup[];
  /** Paper year range (inclusive); null: no limit. */
  from: number | null;
  to: number | null;
  /** Study design, type of sample and country (ISO code) of the study; empty: all. */
  design: string[];
  sample: string[];
  country: string[];
  sort: SortKey;
}

export interface PaperInfo {
  title: string | null;
  authors: { given?: string | null; family?: string | null }[];
  year: number | null;
  journal: string | null;
  citekey: string | null;
  apa_citation: string | null;
}

/** PostgREST returns a one-to-one embed (one sample per study) as an object, a one-to-many one as a list. */
type SampleN = { n: number | null; sample_type?: string | null; country_iso?: string[] | null };

export interface PathRow {
  id: string;
  paper_id: string;
  study_id: string;
  natural_key: string;
  hypothesis_code: string | null;
  iv_label_original: string;
  dv_label_original: string;
  iv_construct_id: string | null;
  dv_construct_id: string | null;
  mediator_labels: string[];
  moderator_labels: string[];
  effect_type: "direct" | "indirect" | "interaction" | "total" | "control";
  estimate_type: string | null;
  estimate: number | null;
  p_value: number | null;
  p_reported_as: string | null;
  status: "supported" | "not_supported" | "partially_supported" | "mixed" | "not_hypothesized";
  observed_sign: "positive" | "negative" | null;
  significant: boolean | null;
  badge: string;
  /** Standard error and confidence interval, when the paper prints them (about one test in eight). */
  se?: number | null;
  ci_low?: number | null;
  ci_high?: number | null;
  studies: { study_label: string; research_design: string | null; samples?: SampleN | SampleN[] | null } | null;
  papers: PaperInfo | null;
  evidence: { printed_page: string | null; pdf_page_index: number } | null;
}

export interface Concept {
  id: string;
  canonical_name: string;
  aliases: string[];
}

export const DEFAULT_QUERY: RelationQuery = { a: "", b: "", dir: "ab", role: "direct", equiv: true, includeWarn: false, status: [], sign: [], est: [], from: null, to: null, design: [], sample: [], country: [], sort: "year" };

type Params = Record<string, string | string[] | undefined>;
const many = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : v ? [v] : []);
const pick = <T extends string>(v: string | string[] | undefined, allowed: readonly T[], fallback: T): T => {
  const first = many(v)[0];
  return (allowed as readonly string[]).includes(first ?? "") ? (first as T) : fallback;
};

const slug = (v: string) => /^[a-z_]{1,40}$/.test(v);
const year = (v: string | string[] | undefined): number | null => {
  const n = Number(many(v)[0]);
  return Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : null;
};

/** The query from the URL (anything unknown is ignored). A checkbox "equiv" is sent with a hidden 0 so that "off" can be told from "not given". */
export function parseQuery(p: Params): RelationQuery {
  const equiv = many(p.equiv);
  return {
    a: many(p.a)[0]?.trim() ?? "",
    b: many(p.b)[0]?.trim() ?? "",
    dir: pick(p.dir, ["ab", "ba", "both"], "ab"),
    role: pick(p.role, ["direct", "mediated", "moderated", "all"], "direct"),
    equiv: equiv.length === 0 ? true : equiv.includes("1"),
    includeWarn: many(p.warn).includes("1"),
    status: many(p.status).filter((s): s is StatusGroup => (STATUSES as readonly string[]).includes(s)),
    sign: many(p.sign).filter((s): s is SignGroup => (SIGNS as readonly string[]).includes(s)),
    est: many(p.est).filter((s): s is EstimateGroup => (ESTIMATES as readonly string[]).includes(s)),
    from: year(p.from),
    to: year(p.to),
    design: many(p.design).filter(slug),
    sample: many(p.sample).filter(slug),
    sort: pick(p.sort, SORTS, "year"),
    country: many(p.country).map((c) => c.toUpperCase()).filter((c) => /^[A-Z]{2,3}$/.test(c)),
  };
}

/** The query as a URL query string (shareable); only what differs from the default plus what is typed. */
export function queryToSearch(q: RelationQuery): string {
  const s = new URLSearchParams();
  if (q.a) s.set("a", q.a);
  if (q.b) s.set("b", q.b);
  if (q.dir !== DEFAULT_QUERY.dir) s.set("dir", q.dir);
  if (q.role !== DEFAULT_QUERY.role) s.set("role", q.role);
  if (!q.equiv) s.set("equiv", "0");
  if (q.includeWarn) s.set("warn", "1");
  for (const v of q.status) s.append("status", v);
  for (const v of q.sign) s.append("sign", v);
  for (const v of q.est) s.append("est", v);
  if (q.from !== null) s.set("from", String(q.from));
  if (q.to !== null) s.set("to", String(q.to));
  for (const v of q.design) s.append("design", v);
  for (const v of q.sample) s.append("sample", v);
  for (const v of q.country) s.append("country", v);
  if (q.sort !== DEFAULT_QUERY.sort) s.set("sort", q.sort);
  return s.toString();
}

export const hasQuestion = (q: RelationQuery) => q.a !== "" || q.b !== "";

/** Only one box is filled: show every relationship of that concept, whatever its direction or role. */
export const isSingleConcept = (q: RelationQuery): boolean => (q.a !== "") !== (q.b !== "");

/** The one concept typed in a single-concept search. */
export const singleTerm = (q: RelationQuery): string => (q.a !== "" ? q.a : q.b);

/** Lower case, no accents, words separated by single spaces. */
export function normalise(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

interface Side {
  tokens: string[];
  phrases: string[];
  conceptIds: Set<string>;
}

/** What a typed term stands for; null for an empty term, which matches any variable. */
function expand(term: string, concepts: Concept[], equiv: boolean): Side | null {
  const n = normalise(term);
  if (!n) return null;
  const tokens = n.split(" ");
  const side: Side = { tokens, phrases: [], conceptIds: new Set() };
  if (equiv) {
    for (const c of concepts) {
      const names = [c.canonical_name, ...c.aliases].map(normalise).filter(Boolean);
      if (names.some((name) => tokens.every((t) => name.includes(t)))) {
        side.conceptIds.add(c.id);
        side.phrases.push(...names);
      }
    }
  }
  return side;
}

function matches(side: Side | null, label: string, conceptId: string | null): boolean {
  if (side === null) return true;
  if (conceptId !== null && side.conceptIds.has(conceptId)) return true;
  const n = normalise(label);
  return side.tokens.every((t) => n.includes(t)) || side.phrases.some((p) => n.includes(p));
}

/** The parts a concept plays in a test: independent variable, dependent variable, mediator, moderator. */
function conceptRoles(row: PathRow, side: Side | null): string[] {
  const roles: string[] = [];
  if (matches(side, row.iv_label_original, row.iv_construct_id)) roles.push("biến độc lập");
  if (matches(side, row.dv_label_original, row.dv_construct_id)) roles.push("biến phụ thuộc");
  if (row.mediator_labels.some((l) => matches(side, l, null))) roles.push("trung gian");
  if (row.moderator_labels.some((l) => matches(side, l, null))) roles.push("điều tiết");
  return roles;
}

/** What the single concept of the query is in this test, for the list ("là biến độc lập, trung gian"). */
export function rolesInTest(row: PathRow, concepts: Concept[], q: RelationQuery): string[] {
  return isSingleConcept(q) ? conceptRoles(row, expand(singleTerm(q), concepts, q.equiv)) : [];
}

const roleOf = (row: PathRow, role: Role): boolean => {
  if (role === "direct") return row.effect_type === "direct";
  if (role === "mediated") return row.effect_type === "indirect";
  if (role === "moderated") return row.effect_type === "interaction" || row.moderator_labels.length > 0;
  return row.effect_type !== "control";
};

export function estimateGroup(row: Pick<PathRow, "estimate" | "estimate_type">): EstimateGroup {
  if (row.estimate === null || row.estimate_type === "none") return "none";
  const t = row.estimate_type;
  return t === "std_beta" || t === "path_coefficient" || t === "r" ? t : "other";
}

export const statusGroup = (row: PathRow): StatusGroup => (row.status === "partially_supported" ? "mixed" : row.status);

export function signGroup(row: PathRow): SignGroup | "unknown" {
  if (row.significant === false) return "none";
  if (row.significant === true && row.observed_sign === "positive") return "positive";
  if (row.significant === true && row.observed_sign === "negative") return "negative";
  return "unknown";
}

/** ✓ (automatic check) or ★ (edited by hand): the tests the summary counts by default. */
export const isVerified = (row: PathRow): boolean => row.badge === "auto_verified" || row.badge === "human_reviewed";

export interface Summary {
  /** Every matching test and the papers they come from, counted or not (the honest size of the evidence). */
  matchedTests: number;
  matchedPapers: number;
  /** Papers in the corpus that have any relationship data. */
  corpusPapers: number;
  papers: number;
  studies: number;
  tests: number;
  /** Matching tests the summary leaves out because they are not ✓ / ★. */
  notCounted: number;
  notCountedByDesign: Record<string, number>;
  /** Share of the matching tests left out. */
  shareNotCounted: number;
  outcome: Record<StatusGroup, number>;
  direction: Record<SignGroup | "unknown", number>;
  /** Counted tests by kind of effect size. */
  estimates: Record<EstimateGroup, number>;
}

export interface PaperGroup {
  paperId: string;
  paper: PaperInfo | null;
  rows: PathRow[];
  /** Studies of the paper disagree: some tests supported, others not. */
  differs: boolean;
}

export interface RelationResult {
  query: RelationQuery;
  /** Every matching test (counted or not). */
  rows: PathRow[];
  groups: PaperGroup[];
  summary: Summary;
}

/** The tests that answer the query: after the role, the direction and the extra filters. */
/** The filters that do not depend on which concepts were typed: result of the hypothesis, direction of the effect, kind of estimate. */
function passesFilters(r: PathRow, q: RelationQuery): boolean {
  if (q.status.length && !q.status.includes(statusGroup(r))) return false;
  if (q.sign.length) {
    const sg = signGroup(r);
    if (sg === "unknown" || !q.sign.includes(sg)) return false;
  }
  if (q.est.length && !q.est.includes(estimateGroup(r))) return false;
  const y = r.papers?.year ?? null;
  if ((q.from !== null || q.to !== null) && (y === null || (q.from !== null && y < q.from) || (q.to !== null && y > q.to))) return false;
  if (q.design.length && !q.design.includes(r.studies?.research_design ?? "")) return false;
  const sample = sampleOf(r);
  if (q.sample.length && !q.sample.includes(sample?.sample_type ?? "")) return false;
  if (q.country.length && !(sample?.country_iso ?? []).some((c) => q.country.includes(c))) return false;
  return true;
}

export function findRows(rows: PathRow[], concepts: Concept[], q: RelationQuery): PathRow[] {
  if (isSingleConcept(q)) {
    const side = expand(singleTerm(q), concepts, q.equiv);
    return rows.filter((r) => {
      return roleOf(r, "all") && conceptRoles(r, side).length > 0 && passesFilters(r, q);
    });
  }
  const a = expand(q.a, concepts, q.equiv);
  const b = expand(q.b, concepts, q.equiv);
  return rows.filter((r) => {
    if (!roleOf(r, q.role)) return false;
    const forward = matches(a, r.iv_label_original, r.iv_construct_id) && matches(b, r.dv_label_original, r.dv_construct_id);
    const backward = matches(b, r.iv_label_original, r.iv_construct_id) && matches(a, r.dv_label_original, r.dv_construct_id);
    if (!(q.dir === "ab" ? forward : q.dir === "ba" ? backward : forward || backward)) return false;
    return passesFilters(r, q);
  });
}

const authorName = (a: { family?: string | null; given?: string | null }) => a.family ?? a.given ?? "";

/** "Singh (2012)", "Singh & Iglesias (2012)", "Singh et al. (2012)"; the title when there are no authors. */
export function paperLabel(paper: PaperInfo | null): string {
  if (!paper) return "(bài không rõ)";
  const names = paper.authors.map(authorName).filter(Boolean);
  const who = names.length === 0 ? null : names.length === 1 ? names[0]! : names.length === 2 ? `${names[0]} & ${names[1]}` : `${names[0]} et al.`;
  if (!who) return paper.title ?? "(bài không rõ)";
  return paper.year ? `${who} (${paper.year})` : who;
}

export function searchRelations(allRows: PathRow[], concepts: Concept[], q: RelationQuery): RelationResult {
  const rows = findRows(allRows, concepts, q);
  const counted = q.includeWarn ? rows : rows.filter(isVerified);
  const notCountedRows = rows.filter((r) => !counted.includes(r));
  const byDesign: Record<string, number> = {};
  for (const r of notCountedRows) {
    const design = r.studies?.research_design ?? "(không rõ)";
    byDesign[design] = (byDesign[design] ?? 0) + 1;
  }
  const outcome: Summary["outcome"] = { supported: 0, not_supported: 0, mixed: 0, not_hypothesized: 0 };
  const direction: Summary["direction"] = { positive: 0, negative: 0, none: 0, unknown: 0 };
  const estimates: Summary["estimates"] = { std_beta: 0, path_coefficient: 0, r: 0, other: 0, none: 0 };
  for (const r of counted) {
    estimates[estimateGroup(r)]++;
    outcome[statusGroup(r)]++;
    direction[signGroup(r)]++;
  }

  const byPaper = new Map<string, PathRow[]>();
  for (const r of rows) byPaper.set(r.paper_id, [...(byPaper.get(r.paper_id) ?? []), r]);
  const groups: PaperGroup[] = [...byPaper.entries()].map(([paperId, list]) => {
    const sorted = [...list].sort((x, y) => (x.studies?.study_label ?? "").localeCompare(y.studies?.study_label ?? "") || (x.hypothesis_code ?? "").localeCompare(y.hypothesis_code ?? ""));
    const states = new Set(sorted.map((r) => statusGroup(r)).filter((s) => s === "supported" || s === "not_supported"));
    return { paperId, paper: list[0]!.papers, rows: sorted, differs: states.size > 1 };
  });
  const byName = (x: PaperGroup, y: PaperGroup) => paperLabel(x.paper).localeCompare(paperLabel(y.paper));
  const biggest = (g: PaperGroup, value: (r: PathRow) => number | null) => Math.max(-1, ...g.rows.map((r) => value(r) ?? -1));
  const order: Record<SortKey, (x: PaperGroup, y: PaperGroup) => number> = {
    year: (x, y) => (y.paper?.year ?? 0) - (x.paper?.year ?? 0) || byName(x, y),
    n: (x, y) => biggest(y, sampleSize) - biggest(x, sampleSize) || byName(x, y),
    effect: (x, y) => biggest(y, (r) => (r.estimate === null ? null : Math.abs(r.estimate))) - biggest(x, (r) => (r.estimate === null ? null : Math.abs(r.estimate))) || byName(x, y),
    name: byName,
  };
  groups.sort(order[q.sort]);

  return {
    query: q,
    rows,
    groups,
    summary: {
      matchedTests: rows.length,
      matchedPapers: byPaper.size,
      corpusPapers: new Set(allRows.map((r) => r.paper_id)).size,
      papers: new Set(counted.map((r) => r.paper_id)).size,
      studies: new Set(counted.map((r) => r.study_id)).size,
      tests: counted.length,
      notCounted: notCountedRows.length,
      notCountedByDesign: byDesign,
      shareNotCounted: rows.length === 0 ? 0 : notCountedRows.length / rows.length,
      outcome,
      direction,
      estimates,
    },
  };
}

/** APA 7: no leading zero for a value that cannot exceed 1 (β, r, p), and a real minus sign. */
export function apaNumber(n: number): string {
  const abs = Math.abs(n);
  const text = String(abs).replace(/^0\./, "."); // 0 stays "0"; 0.31 becomes ".31"
  return `${n < 0 ? "−" : ""}${text}`;
}

const SYMBOL: Record<string, string> = { std_beta: "β", path_coefficient: "β", unstd_b: "b", r: "r", d: "d", odds_ratio: "OR", eta_squared: "η²" };

export function formatEstimate(row: Pick<PathRow, "estimate" | "estimate_type">): string {
  if (row.estimate === null) return "";
  return `${SYMBOL[row.estimate_type ?? ""] ?? "est."} = ${apaNumber(row.estimate)}`;
}

/**
 * p as the authors printed it ("< 0.01" → "p < .01"; a bare "0. 221" from a loose text layer → "p = .221"), or the
 * exact value when only that is known. Anything else ("n.s.", stars) is shown as printed.
 */
export function formatP(row: Pick<PathRow, "p_reported_as" | "p_value">): string {
  const printed = row.p_reported_as?.trim();
  if (printed) {
    const m = /^([<>=≤≥])?\s*(\d*)\.\s*(\d+)$/.exec(printed);
    return m ? `p ${m[1] ?? "="} ${apaNumber(Number(`${m[2] || "0"}.${m[3]}`))}` : printed;
  }
  return row.p_value === null ? "" : `p = ${apaNumber(row.p_value)}`;
}

/** Two decimals, no leading zero (APA 7). */
function two(n: number): string {
  const [whole = "0", frac = ""] = Math.abs(n).toFixed(2).split(".");
  return `${n < 0 ? "−" : ""}${whole === "0" ? "" : whole}.${frac}`;
}

/** The sample of the study the test comes from (a one-to-one embed arrives as an object). */
export function sampleOf(row: Pick<PathRow, "studies">): SampleN | null {
  const samples = row.studies?.samples;
  const list = Array.isArray(samples) ? samples : samples ? [samples] : [];
  return list.find((x) => x.n !== null) ?? list[0] ?? null;
}

/** The sample size of the study the test comes from, or null when the paper did not give one. */
export function sampleSize(row: Pick<PathRow, "studies">): number | null {
  return sampleOf(row)?.n ?? null;
}

export const formatSe = (row: Pick<PathRow, "se">): string => (row.se == null ? "" : `SE = ${two(row.se)}`);
export const formatCi = (row: Pick<PathRow, "ci_low" | "ci_high">): string => (row.ci_low == null || row.ci_high == null ? "" : `CI [${two(row.ci_low)}, ${two(row.ci_high)}]`);

/** "β = −.31, SE = .05, CI [−.42, −.20], p < .001, N = 312": everything the paper gave, in APA order. */
export function formatStats(row: PathRow): string {
  const n = sampleSize(row);
  return [formatEstimate(row), formatSe(row), formatCi(row), formatP(row), n === null ? "" : `N = ${n.toLocaleString("en-US")}`].filter(Boolean).join(", ");
}

export const STATUS_LABEL: Record<PathRow["status"], string> = {
  supported: "✓ Ủng hộ",
  not_supported: "✗ Không ủng hộ",
  partially_supported: "◐ Một phần",
  mixed: "◐ Trộn",
  not_hypothesized: "○ Không đặt giả thuyết",
};

export const EFFECT_LABEL: Record<PathRow["effect_type"], string> = { direct: "trực tiếp", indirect: "gián tiếp", interaction: "tương tác", total: "tổng", control: "biến kiểm soát" };

/** Names for the autocomplete: canonical concepts first, then the variable names the authors used most often. */
export function suggestions(rows: PathRow[], concepts: Concept[], limit = 300): string[] {
  const seen = new Map<string, { label: string; n: number }>();
  const add = (label: string, n: number) => {
    const key = normalise(label);
    if (!key) return;
    const e = seen.get(key);
    if (e) e.n += n;
    else seen.set(key, { label, n });
  };
  for (const c of concepts) add(c.canonical_name, 1000);
  for (const r of rows) {
    add(r.iv_label_original, 1);
    add(r.dv_label_original, 1);
  }
  return [...seen.values()].sort((x, y) => y.n - x.n || x.label.localeCompare(y.label)).slice(0, limit).map((e) => e.label);
}

/** Questions to try; they return results on the current repository. */
export const SAMPLE_QUERIES: { a: string; b: string }[] = [
  { a: "ethicality", b: "trust" },
  { a: "CSR", b: "value" },
  { a: "satisfaction", b: "loyalty" },
];
