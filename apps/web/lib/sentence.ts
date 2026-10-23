/**
 * "Copy câu học thuật" (step 3b.5, Mục 8.4): a draft sentence for one test, in the style of a results paragraph, with the
 * statistic and the in-text citation. Only for ✓ / ★ tests: a ⚠ or ◇ value is never turned into a sentence that reads like fact.
 * The wording is a draft; the user must check it against the paper (the page number points to the evidence).
 */
import { formatEstimate, formatP, isVerified, type PathRow } from "./relations";

const EXPERIMENTS = new Set(["lab_experiment", "online_experiment", "field_experiment"]);

const surname = (a: { given?: string | null; family?: string | null }) => (a.family ?? a.given ?? "").trim();

/** "Tran", "Tran & Le" or "Tran et al." with the year: "Tran et al., 2023" (APA 7 parenthetical citation). */
export function inTextCitation(paper: PathRow["papers"]): string {
  if (!paper) return "";
  const names = paper.authors.map(surname).filter(Boolean);
  const who = names.length === 0 ? "" : names.length === 1 ? names[0]! : names.length === 2 ? `${names[0]} & ${names[1]}` : `${names[0]} et al.`;
  if (!who) return paper.year ? String(paper.year) : "";
  return paper.year ? `${who}, ${paper.year}` : who;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** The sentence, or null when the test is not ✓ / ★ or has no result to state. */
export function academicSentence(row: PathRow): string | null {
  if (!isVerified(row) || row.effect_type === "control" || row.effect_type === "total" || row.significant === null) return null;
  const iv = row.iv_label_original.trim();
  const dv = row.dv_label_original.trim();
  const sig = row.significant;
  const sign = row.observed_sign;
  const causal = EXPERIMENTS.has(row.studies?.research_design ?? "");
  let body: string;
  if (row.effect_type === "indirect") {
    const via = row.mediator_labels.length ? ` through ${row.mediator_labels.join(" and ")}` : "";
    body = `The indirect effect of ${iv} on ${dv}${via} was ${sig ? "" : "not "}significant`;
  } else if (row.effect_type === "interaction") {
    const by = row.moderator_labels.length ? row.moderator_labels.join(" and ") : "the moderator";
    body = `The effect of ${iv} on ${dv} was ${sig ? "" : "not "}moderated by ${by}`;
  } else if (!sig) {
    body = `${cap(iv)} ${causal ? "does not significantly affect" : "is not significantly related to"} ${dv}`;
  } else if (sign === "positive" || sign === "negative") {
    body = `${cap(iv)} ${sign === "positive" ? "positively" : "negatively"} ${causal ? "affects" : "relates to"} ${dv}`;
  } else {
    return null;
  }
  // An estimate whose type the paper did not make clear is written out, not abbreviated.
  const stats = [formatEstimate(row).replace(/^est\. =/, "estimate ="), formatP(row)].filter(Boolean).join(", ");
  const page = row.evidence?.printed_page ? `p. ${row.evidence.printed_page}` : "";
  const source = [inTextCitation(row.papers), page].filter(Boolean).join(", ");
  const inside = [stats, source].filter(Boolean).join("; ");
  return `${body}${inside ? ` (${inside})` : ""}.`;
}
