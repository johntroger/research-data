/**
 * Layer B (Mục 6.3) for the skeleton extraction: checks every value against the PDF text layer
 * and assigns a badge (Mục 6.5). The result rows map to the `extracted_fields` table.
 */
import type { SkeletonExtraction } from "../extract/skeleton-schema.js";
import type { PdfTextLayer } from "../pdf/text-layer.js";
import { type CheckResult, field, type FieldVerification, numberCheck, pChecks, slug, withoutEvidence } from "./checks.js";

export type { CheckResult, FieldVerification } from "./checks.js";

export function verifySkeleton(layer: PdfTextLayer, data: SkeletonExtraction): FieldVerification[] {
  const fields: FieldVerification[] = [];

  fields.push(field("paper_type", "paper_type", "T2", data.paper_type, data.paper_type_evidence, layer));

  for (const study of data.studies) {
    const s = slug(study.study_label);
    fields.push(field(`${s}:research_design`, "research_design", "T2", study.research_design, study.design_evidence, layer));

    if (study.sample_size !== null) {
      const n = study.sample_size;
      fields.push(
        study.sample_size_evidence
          ? field(`${s}:sample_size`, "sample_size", "T1", n, study.sample_size_evidence, layer, (page) => [numberCheck(layer, "number_in_pdf", n, page)])
          : withoutEvidence(`${s}:sample_size`, "sample_size", "T1", n),
      );
    }
  }

  const h = data.example_hypothesis;
  if (h) {
    const key = `${slug(h.study_label)}:${slug(h.hypothesis_code ?? "first")}:${slug(h.iv)}->${slug(h.dv)}`;
    fields.push(
      field(key, "hypothesis_result", "T1", h, h.evidence, layer, (page) => {
        const checks: CheckResult[] = [];
        if (h.estimate !== null) checks.push(numberCheck(layer, "estimate_in_pdf", h.estimate, page));
        if (h.p_reported !== null) {
          checks.push(numberCheck(layer, "p_in_pdf", h.p_reported, page));
          checks.push(...pChecks(h.p_reported, h.status));
        }
        return checks;
      }),
    );
  }

  return fields;
}
