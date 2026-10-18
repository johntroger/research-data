/**
 * Paper-level extraction schemas (codebook Phần C, K):
 *   Pass 1  — PaperStructure: what the paper is and what it contains (studies, tables, theories).
 *   Pass 1b — PaperDiscussion: contributions, limitations, future directions, gap.
 */
import { z } from "zod";
import { APPLICATION_ROLES, GAP_TYPES, ORIGINALITY, PAPER_TYPES, RESEARCH_DESIGNS, TABLE_KINDS, UTILITY } from "./enums.js";
import { Evidence, QuotedStatement } from "./evidence.js";

export const StudyOutline = z.object({
  study_label: z.string().describe('Label used by the authors ("Study 1", "Study 2a", "Exploratory study"); "Study 1" when there is only one.'),
  research_design: z.enum(RESEARCH_DESIGNS),
  design_evidence: Evidence,
});

export const TableOutline = z.object({
  table_label: z.string().describe('Label as printed, e.g. "Table 3".'),
  pdf_page: z.number().int().min(1),
  kind: z.enum(TABLE_KINDS),
  study_label: z.string().nullable().describe("Study the table belongs to, or null when it covers several studies."),
});

export const TheoryUse = z.object({
  theory_name_original: z.string().describe("Theory name exactly as the authors write it."),
  application_role: z
    .enum(APPLICATION_ROLES)
    .describe("Strongest role: extended > tested > hypothesis_derivation > framing > mentioned."),
  evidence: Evidence,
});

export const PaperStructure = z.object({
  paper_type: z.enum(PAPER_TYPES),
  paper_type_evidence: Evidence,
  studies: z.array(StudyOutline).describe("Every study with its own sample. Empty for conceptual papers and reviews."),
  hypothesis_codes: z
    .array(z.string())
    .describe('Every hypothesis code stated in the paper, as printed ("H1", "H2a"…), in order of appearance.'),
  tables: z.array(TableOutline).describe("Every table in the paper."),
  theories: z.array(TheoryUse).describe("Every named theory the paper uses."),
});

export type PaperStructure = z.infer<typeof PaperStructure>;

export const PaperDiscussion = z.object({
  contribution_type: z
    .object({ originality: z.enum(ORIGINALITY), utility: z.enum(UTILITY) })
    .describe("Corley & Gioia (2011). 'revelatory' only for a genuinely new construct or mechanism."),
  theoretical_contributions: z.array(QuotedStatement).describe("Theoretical contributions as stated by the authors."),
  practical_implications: z.array(QuotedStatement),
  limitations: z.array(QuotedStatement),
  future_directions: z.array(QuotedStatement),
  gap_type: z.enum(GAP_TYPES).nullable().describe("Müller-Bloch & Kranz (2015): the gap the authors say they address."),
  gap_evidence: Evidence.nullable(),
  problematization_hint: z
    .string()
    .nullable()
    .describe("Assumption of the research stream the paper actively challenges (Alvesson & Sandberg, 2011); usually null."),
});

export type PaperDiscussion = z.infer<typeof PaperDiscussion>;
