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
type SampleN = { n: number | null };

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

export const DEFAULT_QUERY: RelationQuery = { a: "", b: "", dir: "ab", role: "direct", equiv: true, includeWarn: false, status: [], sign: [] };

type Params = Record<string, string | string[] | undefined>;
const many = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : v ? [v] : []);
const pick = <T extends string>(v: string | string[] | undefined, allowed: readonly T[], fallback: T): T => {
  const first = many(v)[0];
  return (allowed as readonly string[]).includes(first ?? "") ? (first as T) : fallback;
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
  return s.toString();
}

export const hasQuestion = (q: RelationQuery) => q.a !== "" || q.b !== "";

/** Only one box is filled: show every relationship of that concept, whatever its direction or role. */
export const isSingleConcept = (q: RelationQuery): boolean => (q.a !== "") !== (q.b !== "");

/** The one concept typed in a single-concept search. */
export const singleTerm = (q: RelationQuery): string => (q.a !== "" ? q.a : q.b);

/** The question in a few words, for the page title: "ethicality → trust", "trust ⇄ loyalty", or the one concept typed. */
export function queryTitle(q: RelationQuery): string {
  if (!hasQuestion(q)) return "";
  if (isSingleConcept(q)) return singleTerm(q);
  if (q.dir === "both") return `${q.a} ⇄ ${q.b}`;
  return q.dir === "ba" ? `${q.b} → ${q.a}` : `${q.a} → ${q.b}`;
}

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
  /** The counted tests that are different relationships: the same relationship reported in several models or tables (keys ending "#2", "#3") counts once. */
  relations: number;
  /** Matching tests the summary leaves out because they are not ✓ / ★. */
  notCounted: number;
  notCountedByDesign: Record<string, number>;
  /** Share of the matching tests left out. */
  shareNotCounted: number;
  outcome: Record<StatusGroup, number>;
  direction: Record<SignGroup | "unknown", number>;
}

/** The one main number of a result: the tests counted, and the ✓ rule behind it ("tính cả ⚠" says so when it was switched on). */
export function countsLine(s: Pick<Summary, "papers" | "studies" | "tests">, includeWarn: boolean): string {
  const what = includeWarn ? "kiểm định (tính cả ⚠ và ◇)" : "kiểm định đã kiểm chứng ✓";
  return `${s.tests} ${what} · ${s.papers} bài · ${s.studies} study`;
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
export function findRows(rows: PathRow[], concepts: Concept[], q: RelationQuery): PathRow[] {
  if (isSingleConcept(q)) {
    const side = expand(singleTerm(q), concepts, q.equiv);
    return rows.filter((r) => {
      if (!roleOf(r, "all") || conceptRoles(r, side).length === 0) return false;
      if (q.status.length && !q.status.includes(statusGroup(r))) return false;
      if (q.sign.length) {
        const sg = signGroup(r);
        if (sg === "unknown" || !q.sign.includes(sg)) return false;
      }
      return true;
    });
  }
  const a = expand(q.a, concepts, q.equiv);
  const b = expand(q.b, concepts, q.equiv);
  return rows.filter((r) => {
    if (!roleOf(r, q.role)) return false;
    const forward = matches(a, r.iv_label_original, r.iv_construct_id) && matches(b, r.dv_label_original, r.dv_construct_id);
    const backward = matches(b, r.iv_label_original, r.iv_construct_id) && matches(a, r.dv_label_original, r.dv_construct_id);
    if (!(q.dir === "ab" ? forward : q.dir === "ba" ? backward : forward || backward)) return false;
    if (q.status.length && !q.status.includes(statusGroup(r))) return false;
    if (q.sign.length) {
      const s = signGroup(r);
      if (s === "unknown" || !q.sign.includes(s)) return false;
    }
    return true;
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

/** A test's natural key without the "#2", "#3" that tells apart the same relationship reported again in the same study. */
export const relationKey = (r: Pick<PathRow, "paper_id" | "study_id" | "natural_key">): string => `${r.paper_id}|${r.study_id}|${r.natural_key.replace(/#\d+$/, "")}`;

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
  for (const r of counted) {
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
  groups.sort((x, y) => (y.paper?.year ?? 0) - (x.paper?.year ?? 0) || paperLabel(x.paper).localeCompare(paperLabel(y.paper)));

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
      relations: new Set(counted.map(relationKey)).size,
      notCounted: notCountedRows.length,
      notCountedByDesign: byDesign,
      shareNotCounted: rows.length === 0 ? 0 : notCountedRows.length / rows.length,
      outcome,
      direction,
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

/** The sample size of the study the test comes from, or null when the paper did not give one. */
export function sampleSize(row: Pick<PathRow, "studies">): number | null {
  const samples = row.studies?.samples;
  const list = Array.isArray(samples) ? samples : samples ? [samples] : [];
  return list.find((s) => s.n !== null)?.n ?? null;
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

/** Edit distance between two short strings (insert, delete, replace), enough to forgive a typo. */
function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length]!;
}

/** Two words that are the same word for a reader: a typo away, or one the beginning of the other ("loyal" and "loyalty"). */
function sameWord(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  const slack = Math.max(a.length, b.length) >= 8 ? 2 : 1;
  return Math.min(a.length, b.length) >= 4 && editDistance(a, b) <= slack;
}

/**
 * Names the reader may have meant, when the term they typed matches nothing: a typo, a plural, one word of a longer name. Nothing is
 * suggested for a term that is already a name in the repository (then the question is empty, not the spelling). Best match first.
 */
export function similarNames(term: string, names: string[], limit = 5): string[] {
  const t = normalise(term);
  if (!t || names.some((n) => normalise(n) === t)) return [];
  const words = t.split(" ");
  const scored: { name: string; score: number }[] = [];
  for (const name of names) {
    const n = normalise(name);
    const nameWords = n.split(" ");
    const shared = words.filter((w) => nameWords.some((x) => sameWord(w, x))).length;
    let score = 0;
    if (t.length >= 3 && (n.includes(t) || (n.length >= 3 && t.includes(n)))) score = 3;
    else if (shared > 0) score = 1 + shared / Math.max(words.length, nameWords.length);
    else if (t.length >= 5 && editDistance(t, n) <= 2) score = 2;
    if (score > 0) scored.push({ name, score });
  }
  return scored.sort((x, y) => y.score - x.score || x.name.length - y.name.length || x.name.localeCompare(y.name)).slice(0, limit).map((e) => e.name);
}

/** Questions to try; they return results on the current repository. */
export const SAMPLE_QUERIES: { a: string; b: string }[] = [
  { a: "ethicality", b: "trust" },
  { a: "CSR", b: "value" },
  { a: "satisfaction", b: "loyalty" },
];
