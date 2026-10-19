/**
 * Quality report (step 1b.1): how many fields are ✓ / ⚠ / ◇ / hidden, by study design, field and
 * failed check, read from what was published (`extracted_fields`). It shows where the machine checks
 * disagree with the extraction most often, so prompts and rules are tuned where it matters.
 */
import type pg from "pg";

export type BadgeName = "auto_verified" | "needs_attention" | "ai_interpreted" | "hidden";

export interface QualityField {
  paperId: string;
  paperTitle: string;
  /** Design of the study the field belongs to; null for paper-level fields (discussion, theories, tables…). */
  design: string | null;
  fieldName: string;
  badge: BadgeName;
  /** Names of the checks that failed, as "check" strings. */
  failedChecks: string[];
}

export interface Counts {
  verified: number;
  attention: number;
  interpreted: number;
  hidden: number;
}

export interface Row extends Counts {
  name: string;
  /** (⚠ + hidden) / (✓ + ⚠ + hidden): the share of checkable fields that did not pass. ◇ fields are not checkable. */
  problemRate: number;
  papers: number;
}

export interface QualitySummary {
  fields: number;
  papers: number;
  total: Counts & { problemRate: number };
  byDesign: Row[];
  byField: Row[];
  byPaper: Row[];
  /** Failed checks on ⚠ or hidden fields, most frequent first. */
  byCheck: { name: string; fields: number; papers: number }[];
}

const empty = (): Counts => ({ verified: 0, attention: 0, interpreted: 0, hidden: 0 });

function add(c: Counts, badge: BadgeName): void {
  if (badge === "auto_verified") c.verified++;
  else if (badge === "needs_attention") c.attention++;
  else if (badge === "ai_interpreted") c.interpreted++;
  else c.hidden++;
}

export function problemRate(c: Counts): number {
  const checkable = c.verified + c.attention + c.hidden;
  return checkable === 0 ? 0 : (c.attention + c.hidden) / checkable;
}

function rows(groups: Map<string, { counts: Counts; papers: Set<string> }>): Row[] {
  return [...groups.entries()]
    .map(([name, g]) => ({ name, ...g.counts, problemRate: problemRate(g.counts), papers: g.papers.size }))
    .sort((a, b) => b.attention + b.hidden - (a.attention + a.hidden) || a.name.localeCompare(b.name));
}

export function summariseQuality(fields: QualityField[]): QualitySummary {
  const total = empty();
  const designs = new Map<string, { counts: Counts; papers: Set<string> }>();
  const names = new Map<string, { counts: Counts; papers: Set<string> }>();
  const papers = new Map<string, { counts: Counts; papers: Set<string> }>();
  const checks = new Map<string, { fields: number; papers: Set<string> }>();

  const group = (map: Map<string, { counts: Counts; papers: Set<string> }>, key: string, f: QualityField) => {
    const g = map.get(key) ?? { counts: empty(), papers: new Set<string>() };
    add(g.counts, f.badge);
    g.papers.add(f.paperId);
    map.set(key, g);
  };

  for (const f of fields) {
    add(total, f.badge);
    group(designs, f.design ?? "(paper-level)", f);
    group(names, f.fieldName, f);
    group(papers, f.paperTitle, f);
    if (f.badge === "needs_attention" || f.badge === "hidden") {
      for (const c of new Set(f.failedChecks)) {
        const key = `${f.fieldName} / ${c}`;
        const g = checks.get(key) ?? { fields: 0, papers: new Set<string>() };
        g.fields++;
        g.papers.add(f.paperId);
        checks.set(key, g);
      }
    }
  }

  return {
    fields: fields.length,
    papers: new Set(fields.map((f) => f.paperId)).size,
    total: { ...total, problemRate: problemRate(total) },
    byDesign: rows(designs),
    byField: rows(names),
    byPaper: rows(papers),
    byCheck: [...checks.entries()].map(([name, g]) => ({ name, fields: g.fields, papers: g.papers.size })).sort((a, b) => b.fields - a.fields || a.name.localeCompare(b.name)),
  };
}

/** Every published field with its design and failed checks. */
export async function loadQualityFields(db: pg.Client): Promise<QualityField[]> {
  const res = await db.query<{ paper_id: string; title: string | null; file_hash: string; field_name: string; badge: BadgeName; check_results: { checks?: { name: string; passed: boolean }[] }; design: string | null }>(
    `select f.paper_id, p.title, p.file_hash, f.field_name, f.badge, f.check_results,
            (select s.research_design from studies s
              where s.paper_id = f.paper_id and (f.natural_key = s.natural_key or f.natural_key like s.natural_key || ':%')
              order by length(s.natural_key) desc limit 1) as design
       from extracted_fields f join papers p on p.id = f.paper_id`,
  );
  return res.rows.map((r) => ({
    paperId: r.paper_id,
    paperTitle: (r.title ?? r.file_hash.slice(0, 12)).slice(0, 60),
    design: r.design,
    fieldName: r.field_name,
    badge: r.badge,
    failedChecks: (r.check_results?.checks ?? []).filter((c) => !c.passed).map((c) => c.name),
  }));
}

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

function table(title: string, data: Row[], limit: number): string[] {
  const lines = [`\n${title}`, `  ${"name".padEnd(44)} ${"✓".padStart(5)} ${"⚠".padStart(5)} ${"◇".padStart(5)} ${"ẩn".padStart(5)}  ${"problem".padStart(7)}  papers`];
  for (const r of data.slice(0, limit)) lines.push(`  ${r.name.slice(0, 44).padEnd(44)} ${String(r.verified).padStart(5)} ${String(r.attention).padStart(5)} ${String(r.interpreted).padStart(5)} ${String(r.hidden).padStart(5)}  ${pct(r.problemRate).padStart(7)}  ${r.papers}`);
  if (data.length > limit) lines.push(`  … ${data.length - limit} more`);
  return lines;
}

export function formatQuality(s: QualitySummary, limit = 15): string {
  const t = s.total;
  const lines = [
    `${s.papers} paper(s), ${s.fields} field(s): ✓ ${t.verified}  ⚠ ${t.attention}  ◇ ${t.interpreted}  ẩn ${t.hidden}   (problem rate ${pct(t.problemRate)} of checkable fields = (⚠ + ẩn) / (✓ + ⚠ + ẩn))`,
    ...table("By study design", s.byDesign, limit),
    ...table("By field (most ⚠ + ẩn first)", s.byField, limit),
    ...table("By paper", s.byPaper, limit),
    "\nFailed checks on ⚠ / ẩn fields",
    `  ${"field / check".padEnd(56)} fields  papers`,
    ...s.byCheck.slice(0, limit).map((c) => `  ${c.name.slice(0, 56).padEnd(56)} ${String(c.fields).padStart(6)}  ${c.papers}`),
  ];
  return lines.join("\n");
}
