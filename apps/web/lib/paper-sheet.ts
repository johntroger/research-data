/**
 * The summary sheet at the top of a paper page: what the paper contributes, how each study was run, how every hypothesis came out, and
 * what the authors say about limits and next steps. It answers "what does this paper say and can I trust it" in one screen; the fields,
 * the checks and the PDF stay below for whoever wants to verify a number. Pure, no I/O.
 */
import { groupRepeats, isVerified, type PathRow } from "./relations";
import { pathLine, type MatrixPath, type SampleRow, type TheoryRow, type StudyInfo, type TheoryChip } from "./matrix";

export type SheetStudy = StudyInfo;

export interface SheetHypothesis {
  id: string;
  code: string | null;
  relation: string;
  statistic: string;
  status: PathRow["status"];
  verified: boolean;
  naturalKey: string;
  table: string | null;
  printedPage: string | null;
  /** Other statements of the same relationship in the paper (another table or model). */
  repeats: number;
}

export interface SheetStudyResults {
  studyId: string;
  label: string;
  rows: SheetHypothesis[];
}

export interface Statements {
  theoretical: string[];
  practical: string[];
  limitations: string[];
  future: string[];
}

export interface Sheet {
  studies: SheetStudy[];
  hypotheses: SheetStudyResults[];
  /** Hypothesis tests in the sheet, and the other paths (controls, no hypothesis, indirect effects) left to the Results tab. */
  hypothesisCount: number;
  otherPaths: number;
  theories: TheoryChip[];
  contribution: { utility: string | null; originality: string | null } | null;
  gap: string | null;
  statements: Statements;
}

const HYPOTHESIS_STATUS = new Set<PathRow["status"]>(["supported", "not_supported", "partially_supported", "mixed"]);

/** Text copied out of a PDF: ligatures turned into letters (ﬁ → fi) and the "eth- icality" breaks at the end of a line joined again. */
export function cleanQuote(text: string): string {
  return text.normalize("NFKC").replace(/([a-z])- ([a-z])/g, "$1$2").replace(/\s+/g, " ").trim();
}

const ROLE_RANK: Record<string, number> = { tested: 0, extended: 1, hypothesis_derivation: 2, framing: 3, mentioned: 4 };

interface FieldLike {
  natural_key: string;
  field_name: string;
  value: unknown;
}

const asText = (v: unknown): string | null => (typeof v === "string" && v.trim() ? cleanQuote(v) : null);

function statementsOf(fields: FieldLike[]): Statements {
  const pick = (prefix: string) =>
    fields
      .filter((f) => f.natural_key.startsWith(`${prefix}:`))
      .sort((a, b) => Number(a.natural_key.split(":")[1]) - Number(b.natural_key.split(":")[1]))
      .map((f) => asText(f.value))
      .filter((x): x is string => x !== null);
  return { theoretical: pick("theoretical_contribution"), practical: pick("practical_implication"), limitations: pick("limitation"), future: pick("future_direction") };
}

export function buildSheet(paths: MatrixPath[], samples: SampleRow[], theories: TheoryRow[], fields: FieldLike[], moderatorWord = "moderator"): Sheet {
  const studies: SheetStudy[] = samples
    .map((s) => ({
      studyId: s.study_id,
      label: s.studies?.study_label ?? "Study",
      position: s.studies?.position ?? 0,
      design: s.studies?.research_design ?? null,
      n: s.n,
      countries: s.country_iso,
      sampleType: s.sample_type,
    }))
    .sort((a, b) => a.position - b.position || a.label.localeCompare(b.label));
  const order = new Map(studies.map((s, i) => [s.studyId, i]));

  const real = paths.filter((p) => p.effect_type !== "control");
  const tested = real.filter((p) => HYPOTHESIS_STATUS.has(p.status));
  const byStudy = new Map<string, MatrixPath[]>();
  for (const p of tested) byStudy.set(p.study_id, [...(byStudy.get(p.study_id) ?? []), p]);
  const hypotheses: SheetStudyResults[] = [...byStudy.entries()]
    .map(([studyId, list]) => ({
      studyId,
      label: list[0]!.studies?.study_label ?? studies.find((s) => s.studyId === studyId)?.label ?? "Study",
      rows: groupRepeats(list).map(({ main, repeats }) => {
        const line = pathLine(main, moderatorWord);
        return {
          id: main.id,
          code: main.hypothesis_code,
          relation: line.relation,
          statistic: line.statistic,
          status: main.status,
          verified: isVerified(main),
          naturalKey: main.natural_key,
          table: main.evidence?.table_or_figure ?? null,
          printedPage: main.evidence?.printed_page ?? null,
          repeats: repeats.length,
        };
      }),
    }))
    .sort((a, b) => (order.get(a.studyId) ?? 99) - (order.get(b.studyId) ?? 99) || a.label.localeCompare(b.label));

  const chips = new Map<string, TheoryChip>();
  for (const th of [...theories].sort((a, b) => (ROLE_RANK[a.application_role] ?? 9) - (ROLE_RANK[b.application_role] ?? 9))) {
    const name = th.theory_name_original.trim();
    if (name && !chips.has(name.toLowerCase())) chips.set(name.toLowerCase(), { name, role: th.application_role });
  }

  const contribution = fields.find((f) => f.field_name === "contribution_type")?.value;
  const c = contribution && typeof contribution === "object" ? (contribution as { utility?: unknown; originality?: unknown }) : null;
  return {
    studies,
    hypotheses,
    hypothesisCount: hypotheses.reduce((n, s) => n + s.rows.length, 0),
    otherPaths: real.length - tested.length,
    theories: [...chips.values()],
    contribution: c ? { utility: typeof c.utility === "string" ? c.utility : null, originality: typeof c.originality === "string" ? c.originality : null } : null,
    gap: asText(fields.find((f) => f.field_name === "gap_type")?.value),
    statements: statementsOf(fields),
  };
}
