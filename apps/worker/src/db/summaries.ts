/**
 * Steps S1-S2: the research question and the main conclusions of a paper, written by an AI agent from the first pages of the PDF.
 * The agent works in a folder of page texts (no .env, no repo) and writes answer.json; this module checks that every quote it gives is
 * really on the PDF page it names (the same check as every other field) and stores the result. A statement whose quote is not found is
 * kept but marked not_found, and the web page does not show it.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type pg from "pg";
import type { PdfTextLayer } from "../pdf/text-layer.js";
import { verifyQuote, type QuoteMatch } from "../verify/quote.js";

/** The first pages hold the abstract, the introduction and the statement of the research question. */
export const SUMMARY_PAGES = 6;
export const MAX_FINDINGS = 3;

export interface SummaryAnswer {
  research_question: string;
  question_quote: string;
  question_page: number;
  findings: { text: string; quote: string; page: number }[];
}

export interface CheckedFinding {
  text: string;
  quote: string;
  pdf_page_index: number;
  match: QuoteMatch;
}

export interface CheckedSummary {
  researchQuestion: string | null;
  questionQuote: string | null;
  questionPageIndex: number | null;
  questionMatch: QuoteMatch | null;
  findings: CheckedFinding[];
}

const str = (v: unknown): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
const page = (v: unknown): number => (typeof v === "number" && Number.isInteger(v) && v >= 1 ? v : 0);

/** Reads the agent's answer.json; throws a message that says what is wrong so the agent (or the owner) can fix the file. */
export function parseSummaryAnswer(raw: string): SummaryAnswer {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("answer.json is not valid JSON");
  }
  if (!data || typeof data !== "object") throw new Error("answer.json must be an object");
  const d = data as Record<string, unknown>;
  const findings = Array.isArray(d.findings) ? d.findings : [];
  const parsed: SummaryAnswer = {
    research_question: str(d.research_question),
    question_quote: str(d.question_quote),
    question_page: page(d.question_page),
    findings: findings.slice(0, MAX_FINDINGS).map((f) => {
      const o = (f ?? {}) as Record<string, unknown>;
      return { text: str(o.text), quote: str(o.quote), page: page(o.page) };
    }),
  };
  if (!parsed.research_question) throw new Error("research_question is empty");
  if (parsed.findings.some((f) => !f.text)) throw new Error("a finding has no text");
  return parsed;
}

/** Quote of a statement against the PDF text; a missing quote or page counts as not found. */
function check(layer: PdfTextLayer, quote: string, pageNo: number): { match: QuoteMatch; pdfPageIndex: number } {
  if (!quote || pageNo < 1) return { match: "not_found", pdfPageIndex: Math.max(0, pageNo - 1) };
  const result = verifyQuote(layer, quote, pageNo);
  // A quote the agent placed on the wrong page but that sits on a neighbour keeps the page where it was found.
  return { match: result.match, pdfPageIndex: (result.foundOnPage ?? pageNo) - 1 };
}

export function checkSummary(layer: PdfTextLayer, answer: SummaryAnswer): CheckedSummary {
  const q = check(layer, answer.question_quote, answer.question_page);
  return {
    researchQuestion: answer.research_question,
    questionQuote: answer.question_quote || null,
    questionPageIndex: answer.question_quote ? q.pdfPageIndex : null,
    questionMatch: q.match,
    findings: answer.findings.map((f) => {
      const c = check(layer, f.quote, f.page);
      return { text: f.text, quote: f.quote, pdf_page_index: c.pdfPageIndex, match: c.match };
    }),
  };
}

/** Statements the web page may show: the quote was found on the PDF page. */
export const shown = (m: QuoteMatch | null): boolean => m === "exact" || m === "fuzzy" || m === "neighbour_page";

export async function saveSummary(db: pg.Client, paperId: string, s: CheckedSummary, source: string, model: string | null): Promise<void> {
  await db.query(
    `insert into paper_summaries (paper_id, research_question, question_quote, question_page_index, question_match, findings, source, model)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
     on conflict (paper_id) do update set research_question = excluded.research_question, question_quote = excluded.question_quote,
       question_page_index = excluded.question_page_index, question_match = excluded.question_match, findings = excluded.findings,
       source = excluded.source, model = excluded.model, created_at = now()`,
    [paperId, s.researchQuestion, s.questionQuote, s.questionPageIndex, s.questionMatch, JSON.stringify(s.findings), source, model],
  );
}

const TASK = `# Task: summarise one paper

You are given the text of the first pages of an academic paper in \`pages/page-NN.txt\` (NN is the PDF page number, starting at 01).
Read them and write \`answer.json\` in this folder. Work only inside this folder; read nothing else.

Write:

- \`research_question\`: ONE sentence, in your own words, saying what the paper sets out to find out (a question or an aim). Do not copy the abstract.
- \`question_quote\`: one short passage (8 to 40 words) copied EXACTLY, character for character, from a page, which states that aim or question.
- \`question_page\`: the PDF page number (as in the file name, 1-based) the quote is on.
- \`findings\`: 1 to ${MAX_FINDINGS} main conclusions the authors state (what they found), each \`{ "text": "...", "quote": "...", "page": N }\`: \`text\` is your own one-sentence wording (no copied sentences), \`quote\` is a short passage (8 to 40 words) copied exactly from the page given in \`page\`. Take them from the abstract or the introduction, only if the authors state them; do not infer.

Rules: write in English. Copy quotes exactly (the same spelling, no added or removed words, no ellipsis); a quote that is not found on its page is discarded by a machine check. If the first pages do not state a finding, give an empty \`findings\` list. Never invent a quote.

Example of the file:

{"research_question": "...", "question_quote": "...", "question_page": 2, "findings": [{"text": "...", "quote": "...", "page": 1}]}
`;

/** Writes `<root>/<code>/{TASK.md, pages/page-NN.txt}` for one paper; an existing answer.json is never touched. */
export async function writeSummaryJob(root: string, code: string, layer: PdfTextLayer): Promise<string> {
  const dir = path.join(root, code);
  const pages = path.join(dir, "pages");
  await mkdir(pages, { recursive: true });
  await writeFile(path.join(dir, "TASK.md"), TASK);
  for (const [i, p] of layer.pages.slice(0, SUMMARY_PAGES).entries()) {
    await writeFile(path.join(pages, `page-${String(i + 1).padStart(2, "0")}.txt`), p.text);
  }
  return dir;
}

export async function readAnswer(dir: string): Promise<SummaryAnswer | null> {
  const file = path.join(dir, "answer.json");
  const names = await readdir(dir).catch(() => [] as string[]);
  if (!names.includes("answer.json")) return null;
  return parseSummaryAnswer(await readFile(file, "utf8"));
}
