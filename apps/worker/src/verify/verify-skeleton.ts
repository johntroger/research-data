/**
 * Layer B (Mục 6.3) for the skeleton extraction: checks every value against the PDF text layer
 * and assigns a badge (Mục 6.5). The result rows map to the `extracted_fields` table.
 */
import type { Badge, FieldTier } from "@research-data/schema";
import type { SkeletonExtraction } from "../extract/skeleton-schema.js";
import type { PdfTextLayer } from "../pdf/text-layer.js";
import { parsePValue, verifyNumber, verifyPValue } from "./number.js";
import { verifyQuote } from "./quote.js";

export interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
  /** A failed check with severity "hide" makes the field hidden; "attention" gives ⚠. */
  severity: "hide" | "attention";
}

export interface FieldVerification {
  naturalKey: string;
  fieldName: string;
  tier: FieldTier;
  value: unknown;
  evidence: { pdfPage: number; quote: string };
  badge: Badge;
  checks: CheckResult[];
}

interface Evidence {
  pdf_page: number;
  quote: string;
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_|_$/g, "");
}

/** Checks the quote and returns the (possibly corrected) evidence page. */
function quoteCheck(layer: PdfTextLayer, evidence: Evidence): { check: CheckResult; page: number } {
  const result = verifyQuote(layer, evidence.quote, evidence.pdf_page);
  const score = result.score.toFixed(2);
  switch (result.match) {
    case "exact":
      return {
        check: { name: "quote_in_pdf", passed: true, severity: "hide", detail: `Câu trích khớp nguyên văn trên trang PDF ${evidence.pdf_page}` },
        page: evidence.pdf_page,
      };
    case "fuzzy":
      return {
        check: { name: "quote_in_pdf", passed: true, severity: "hide", detail: `Câu trích khớp ${score} (gần đúng) trên trang PDF ${evidence.pdf_page}` },
        page: evidence.pdf_page,
      };
    case "neighbour_page":
      return {
        check: {
          name: "quote_in_pdf",
          passed: true,
          severity: "hide",
          detail: `Câu trích khớp ${score} trên trang PDF ${result.foundOnPage} (AI ghi trang ${evidence.pdf_page}; đã sửa)`,
        },
        page: result.foundOnPage!,
      };
    case "not_found":
      return {
        check: {
          name: "quote_in_pdf",
          passed: false,
          severity: "hide",
          detail: `Không tìm thấy câu trích quanh trang PDF ${evidence.pdf_page} (độ giống cao nhất ${score})`,
        },
        page: evidence.pdf_page,
      };
  }
}

function numberCheck(layer: PdfTextLayer, name: string, value: number | string, page: number): CheckResult {
  const result = typeof value === "string" ? verifyPValue(layer, value, page) : verifyNumber(layer, value, page);
  return result.found
    ? { name, passed: true, severity: "hide", detail: `Tìm thấy "${result.matchedForm}" trên trang PDF ${result.foundOnPage}` }
    : { name, passed: false, severity: "hide", detail: `Không tìm thấy ${JSON.stringify(value)} quanh trang PDF ${page}` };
}

function badgeFor(tier: FieldTier, checks: CheckResult[]): Badge {
  if (checks.some((c) => !c.passed && c.severity === "hide")) return "hidden";
  if (checks.some((c) => !c.passed)) return "needs_attention";
  return tier === "T3" ? "ai_interpreted" : "auto_verified";
}

/** A fuzzy match that differs on meaning-changing words or numbers gets ⚠ (Mục 6.3). */
function meaningCheck(layer: PdfTextLayer, evidence: Evidence): CheckResult[] {
  const diff = verifyQuote(layer, evidence.quote, evidence.pdf_page).criticalDifferences;
  return diff.length === 0
    ? []
    : [{ name: "quote_meaning", passed: false, severity: "attention", detail: `Câu trích khác bản gốc ở từ có thể đổi nghĩa: ${diff.join(", ")}` }];
}

function field(
  naturalKey: string,
  fieldName: string,
  tier: FieldTier,
  value: unknown,
  evidence: Evidence,
  layer: PdfTextLayer,
  extraChecks: (page: number) => CheckResult[] = () => [],
): FieldVerification {
  const quoted = quoteCheck(layer, evidence);
  let check = quoted.check;
  const page = quoted.page;
  let extra = extraChecks(page);

  const pageHasText = layer.pages[evidence.pdf_page - 1]?.hasTextLayer ?? true;
  const mainNumbers = extra.filter((c) => c.name === "estimate_in_pdf" || c.name === "number_in_pdf");

  if (!check.passed) {
    if (!pageHasText) {
      // A page without a text layer (table or figure embedded as an image) cannot be checked by the machine:
      // show the value with ⚠ so the reader opens the PDF, instead of hiding a value that may be right.
      check = {
        ...check,
        severity: "attention",
        detail: `Trang PDF ${evidence.pdf_page} không có text (bảng hoặc hình dạng ảnh) nên không kiểm chứng tự động được; hãy mở PDF để xem`,
      };
    } else if (mainNumbers.length > 0 && mainNumbers.every((c) => c.passed)) {
      // Evidence inside a table: the text layer scrambles table cells, but the numbers are on the page.
      check = { ...check, severity: "attention", detail: `${check.detail}; nhưng mọi con số đều có trên trang (thường do bằng chứng nằm trong bảng)` };
    }
  }

  if (!pageHasText) {
    extra = extra.map((c) => (!c.passed && c.severity === "hide" ? { ...c, severity: "attention" } : c));
  }
  const estimateFound = mainNumbers.some((c) => c.name === "estimate_in_pdf" && c.passed);
  extra = extra.map((c) =>
    c.name === "p_in_pdf" && !c.passed && estimateFound
      ? { ...c, severity: "attention", detail: `${c.detail} (p thường nằm ở chú thích dưới bảng)` }
      : c,
  );

  const checks = [check, ...meaningCheck(layer, evidence), ...extra];
  return { naturalKey, fieldName, tier, value, evidence: { pdfPage: page, quote: evidence.quote }, badge: badgeFor(tier, checks), checks };
}

export function verifySkeleton(layer: PdfTextLayer, data: SkeletonExtraction): FieldVerification[] {
  const fields: FieldVerification[] = [];

  fields.push(field("paper_type", "paper_type", "T2", data.paper_type, data.paper_type_evidence, layer));

  for (const study of data.studies) {
    const s = slug(study.study_label);
    fields.push(field(`${s}:research_design`, "research_design", "T2", study.research_design, study.design_evidence, layer));

    if (study.sample_size !== null) {
      if (!study.sample_size_evidence) {
        fields.push({
          naturalKey: `${s}:sample_size`,
          fieldName: "sample_size",
          tier: "T1",
          value: study.sample_size,
          evidence: { pdfPage: 0, quote: "" },
          badge: "hidden",
          checks: [{ name: "has_evidence", passed: false, severity: "hide", detail: "AI không đưa bằng chứng cho cỡ mẫu" }],
        });
      } else {
        const n = study.sample_size;
        fields.push(
          field(`${s}:sample_size`, "sample_size", "T1", n, study.sample_size_evidence, layer, (page) => [
            numberCheck(layer, "number_in_pdf", n, page),
          ]),
        );
      }
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
          const p = parsePValue(h.p_reported);
          if (!p || p.value < 0 || p.value > 1) {
            checks.push({ name: "p_valid", passed: false, severity: "attention", detail: `p "${h.p_reported}" không hợp lệ` });
          } else if (h.status === "supported" && (p.operator === ">" || p.operator === "≥" || (p.operator === "=" && p.value >= 0.05))) {
            checks.push({
              name: "status_consistent",
              passed: false,
              severity: "attention",
              detail: `AI ghi "supported" nhưng p ${h.p_reported} không đạt mức .05`,
            });
          } else {
            checks.push({ name: "status_consistent", passed: true, severity: "attention", detail: "Kết quả giả thuyết nhất quán với p" });
          }
        }
        return checks;
      }),
    );
  }

  return fields;
}
