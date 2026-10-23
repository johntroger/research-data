/**
 * Summary matrix (step 3b.2, Mục 8.4): one row per paper (authors and year, theories, design and sample, main result)
 * that opens to the tests of each study. Pure logic, no I/O: the page loads the rows, this module groups and formats them.
 * The "main result" counts only ✓ / ★ hypothesis tests; tests that are not are shown as "chưa kiểm chứng", never counted.
 */
import { apaNumber, formatEstimate, formatP, isVerified, type PathRow } from "./relations";

export interface TheoryRow {
  paper_id: string;
  theory_name_original: string;
  application_role: string;
}
export interface SampleRow {
  paper_id: string;
  study_id: string;
  n: number | null;
  country_iso: string[];
  sample_type: string | null;
  studies: { study_label: string; position: number; research_design: string | null } | null;
}
export type MatrixPath = PathRow & { ci_low?: number | null; ci_high?: number | null; r2_dv?: number | null };

export interface TheoryChip {
  name: string;
  role: string;
}
export interface StudyInfo {
  studyId: string;
  label: string;
  position: number;
  design: string | null;
  n: number | null;
  countries: string[];
  sampleType: string | null;
}
export interface Outcome {
  supported: number;
  notSupported: number;
  mixed: number;
  /** Hypothesis tests that are not ✓ / ★: shown, not counted. */
  unchecked: number;
}
export interface PathLine {
  id: string;
  naturalKey: string;
  hypothesis: string | null;
  relation: string;
  effect: PathRow["effect_type"];
  statistic: string;
  r2: string;
  status: PathRow["status"];
  verified: boolean;
  printedPage: string | null;
}
export interface MatrixStudy extends StudyInfo {
  lines: PathLine[];
}
export interface MatrixRow {
  paperId: string;
  theories: TheoryChip[];
  studies: MatrixStudy[];
  outcome: Outcome;
}

const ROLE_RANK: Record<string, number> = { tested: 0, extended: 1, hypothesis_derivation: 2, framing: 3, mentioned: 4 };
export const THEORY_ROLE_LABELS: Record<string, string> = {
  tested: "được kiểm định",
  extended: "mở rộng",
  hypothesis_derivation: "dẫn giả thuyết",
  framing: "khung",
  mentioned: "nhắc đến",
};

const pretty = (name: string) => (name === name.toLowerCase() ? name.charAt(0).toUpperCase() + name.slice(1) : name);

/** Up to `limit` distinct theories, the ones the paper actually leans on first; names only mentioned come last. */
export function theoryChips(theories: TheoryRow[], limit = 3): TheoryChip[] {
  const seen = new Set<string>();
  return [...theories]
    .sort((a, b) => (ROLE_RANK[a.application_role] ?? 9) - (ROLE_RANK[b.application_role] ?? 9))
    .filter((t) => {
      const key = t.theory_name_original.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((t) => ({ name: pretty(t.theory_name_original.trim()), role: t.application_role }));
}

const isHypothesisTest = (p: PathRow) => p.effect_type !== "control" && p.status !== "not_hypothesized";

export function outcomeOf(paths: PathRow[]): Outcome {
  const o: Outcome = { supported: 0, notSupported: 0, mixed: 0, unchecked: 0 };
  for (const p of paths.filter(isHypothesisTest)) {
    if (!isVerified(p)) o.unchecked++;
    else if (p.status === "supported") o.supported++;
    else if (p.status === "not_supported") o.notSupported++;
    else o.mixed++;
  }
  return o;
}

/** Two decimals, no leading zero (APA 7). */
const two = (n: number) => {
  const [whole = "0", frac = ""] = Math.abs(n).toFixed(2).split(".");
  return `${n < 0 ? "−" : ""}${whole === "0" ? "" : whole}.${frac}`;
};
const ci = (p: MatrixPath) => (p.ci_low != null && p.ci_high != null ? `95% CI [${two(p.ci_low)}, ${two(p.ci_high)}]` : "");

export function pathLine(p: MatrixPath): PathLine {
  const relation = `${p.iv_label_original}${p.mediator_labels.length ? ` → ${p.mediator_labels.join(", ")}` : ""}${p.moderator_labels.length ? ` (điều tiết: ${p.moderator_labels.join(", ")})` : ""} → ${p.dv_label_original}`;
  return {
    id: p.id,
    naturalKey: p.natural_key,
    hypothesis: p.hypothesis_code,
    relation,
    effect: p.effect_type,
    statistic: [formatEstimate(p), ci(p), formatP(p)].filter(Boolean).join(", "),
    r2: p.r2_dv != null ? `R² = ${apaNumber(p.r2_dv)}` : "",
    status: p.status,
    verified: isVerified(p),
    printedPage: p.evidence?.printed_page ?? null,
  };
}

export function buildMatrix(paperIds: string[], theories: TheoryRow[], samples: SampleRow[], paths: MatrixPath[]): Map<string, MatrixRow> {
  const group = <T extends { paper_id: string }>(rows: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of rows) (m.get(r.paper_id) ?? m.set(r.paper_id, []).get(r.paper_id)!).push(r);
    return m;
  };
  const th = group(theories);
  const sa = group(samples);
  const pa = group(paths);
  const out = new Map<string, MatrixRow>();
  for (const id of paperIds) {
    const myPaths = pa.get(id) ?? [];
    const studies = new Map<string, MatrixStudy>();
    for (const s of sa.get(id) ?? []) {
      studies.set(s.study_id, {
        studyId: s.study_id, label: s.studies?.study_label ?? "Study", position: s.studies?.position ?? 0, design: s.studies?.research_design ?? null,
        n: s.n, countries: s.country_iso, sampleType: s.sample_type, lines: [],
      });
    }
    for (const p of myPaths.filter((x) => x.effect_type !== "control")) {
      const s = studies.get(p.study_id) ?? { studyId: p.study_id, label: p.studies?.study_label ?? "Study", position: 99, design: p.studies?.research_design ?? null, n: null, countries: [], sampleType: null, lines: [] };
      studies.set(p.study_id, s);
      s.lines.push(pathLine(p));
    }
    out.set(id, {
      paperId: id,
      theories: theoryChips(th.get(id) ?? []),
      studies: [...studies.values()].sort((a, b) => a.position - b.position || a.label.localeCompare(b.label)),
      outcome: outcomeOf(myPaths),
    });
  }
  return out;
}

/** "n = 412 · US, VN" for one study. */
export const sampleSummary = (s: StudyInfo, countryName: (c: string) => string): string =>
  [s.n != null ? `n = ${s.n}` : null, s.countries.map(countryName).join(", ") || null].filter(Boolean).join(" · ");
