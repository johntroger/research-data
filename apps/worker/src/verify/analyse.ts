/**
 * Everything the machine checks about one extracted paper, without AI (Mục 6.3–6.5):
 * Layer B (verify-full), Layer C (cross-checks, recomputed statistics) and completeness.
 */
import type { PdfTextLayer } from "../pdf/text-layer.js";
import type { FieldVerification } from "./checks.js";
import { findMissing, type MissingItem } from "./completeness.js";
import { applyFindings, crossCheck, type StatResult } from "./crosscheck.js";
import { type FullData, type GroupRefs, verifyFull } from "./verify-full.js";

export interface PaperAnalysis {
  fields: FieldVerification[];
  stats: StatResult[];
  missing: MissingItem[];
  /** "incomplete" when the PDF has hypotheses or tables that were not extracted. */
  completeness: "complete" | "incomplete";
}

export function analysePaper(layer: PdfTextLayer, data: FullData): PaperAnalysis {
  const refs: GroupRefs = new Map();
  const rows = verifyFull(layer, data, refs);
  const { findings, stats } = crossCheck(data, refs, rows);
  const missing = findMissing(layer, data);
  return { fields: applyFindings(rows, findings), stats, missing, completeness: missing.length ? "incomplete" : "complete" };
}
