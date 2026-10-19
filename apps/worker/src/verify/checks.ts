/**
 * Building blocks of Layer B (Mục 6.3) and the badge rule (Mục 6.5), shared by the skeleton
 * verification (step 0.6) and the full verification (step 1.4).
 */
import type { Badge, FieldTier } from "@research-data/schema";
import type { PdfTextLayer } from "../pdf/text-layer.js";
import { normaliseForMatch, repairSymbolFont, tokens } from "./normalize.js";
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
  /** pdfPage 0 and an empty quote mean "no evidence". */
  evidence: { pdfPage: number; quote: string };
  badge: Badge;
  checks: CheckResult[];
}

export interface EvidenceIn {
  pdf_page: number;
  quote: string;
  /** Table holding the evidence; null when the evidence is a sentence. Absent for the skeleton schema, which does not say. */
  table_or_figure?: string | null;
}

export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_|_$/g, "");
}

const pass = (name: string, detail: string, severity: CheckResult["severity"] = "hide"): CheckResult => ({ name, passed: true, severity, detail });
const fail = (name: string, detail: string, severity: CheckResult["severity"] = "hide"): CheckResult => ({ name, passed: false, severity, detail });

/** Checks the quote and returns the (possibly corrected) evidence page. */
export function quoteCheck(layer: PdfTextLayer, evidence: EvidenceIn): { check: CheckResult; page: number } {
  const result = verifyQuote(layer, evidence.quote, evidence.pdf_page);
  const score = result.score.toFixed(2);
  switch (result.match) {
    case "exact":
      return { check: pass("quote_in_pdf", `Câu trích khớp nguyên văn trên trang PDF ${evidence.pdf_page}`), page: evidence.pdf_page };
    case "fuzzy":
      return { check: pass("quote_in_pdf", `Câu trích khớp ${score} (gần đúng) trên trang PDF ${evidence.pdf_page}`), page: evidence.pdf_page };
    case "neighbour_page":
      return {
        check: pass("quote_in_pdf", `Câu trích khớp ${score} trên trang PDF ${result.foundOnPage} (AI ghi trang ${evidence.pdf_page}; đã sửa)`),
        page: result.foundOnPage!,
      };
    case "not_found":
      return { check: fail("quote_in_pdf", `Không tìm thấy câu trích quanh trang PDF ${evidence.pdf_page} (độ giống cao nhất ${score})`), page: evidence.pdf_page };
  }
}

/** A number (or a reported p such as "< .001") must appear on the evidence page or a neighbouring page. */
export function numberCheck(
  layer: PdfTextLayer,
  name: string,
  value: number | string,
  page: number,
  severity: CheckResult["severity"] = "hide",
): CheckResult {
  const result = typeof value === "string" ? verifyPValue(layer, value, page) : verifyNumber(layer, value, page);
  return result.found
    ? pass(name, `Tìm thấy "${result.matchedForm}" trên trang PDF ${result.foundOnPage}`, severity)
    : fail(name, `Không tìm thấy ${JSON.stringify(value)} quanh trang PDF ${page}`, severity);
}

/**
 * A name or short text written as in the paper (software, construct label, period) must appear,
 * word for word after normalisation, on the evidence page or a neighbouring page. Failing gives ⚠,
 * not hidden: tables often print abbreviations of the names the AI writes out.
 */
export function textCheck(layer: PdfTextLayer, name: string, text: string, page: number): CheckResult {
  const wanted = normaliseForMatch(text);
  const wantedTokens = tokens(wanted).join(" ");
  for (const p of [page, page - 1, page + 1]) {
    const pageData = layer.pages[p - 1];
    if (!pageData) continue;
    for (const reading of [pageData.text, pageData.rowText, repairSymbolFont(pageData.text)]) {
      if (!reading) continue;
      const normalised = normaliseForMatch(reading);
      if (normalised.includes(wanted) || tokens(normalised).join(" ").includes(wantedTokens)) {
        return pass(name, `Tìm thấy "${text}" trên trang PDF ${p}`, "attention");
      }
    }
  }
  return fail(name, `Không tìm thấy "${text}" nguyên văn quanh trang PDF ${page}`, "attention");
}

/** A logic rule on the extracted values (Mục 6.3, "Kiểm tra logic chung"); failing gives ⚠. */
export function logicCheck(name: string, ok: boolean, okDetail: string, failDetail: string): CheckResult {
  return ok ? pass(name, okDetail, "attention") : fail(name, failDetail, "attention");
}

/** p must be a valid probability; a hypothesis marked supported needs p below .05 (or the authors' stars). */
export function pChecks(pReported: string | null, status: string | null): CheckResult[] {
  if (pReported === null) return [];
  const p = parsePValue(pReported);
  if (!p) return []; // "n.s.", "***" with a threshold note… nothing to compare
  if (p.value < 0 || p.value > 1) return [fail("p_valid", `p "${pReported}" không nằm trong [0, 1]`, "attention")];
  const notSignificant = p.operator === ">" || p.operator === "≥" || (p.operator === "=" && p.value >= 0.05);
  if (status === "supported" && notSignificant) {
    return [fail("status_consistent", `AI ghi "supported" nhưng p ${pReported} không đạt mức .05`, "attention")];
  }
  return status ? [pass("status_consistent", "Kết quả giả thuyết nhất quán với p", "attention")] : [];
}

export function badgeFor(tier: FieldTier, checks: CheckResult[]): Badge {
  if (checks.some((c) => !c.passed && c.severity === "hide")) return "hidden";
  if (checks.some((c) => !c.passed)) return "needs_attention";
  return tier === "T3" ? "ai_interpreted" : "auto_verified";
}

/** A fuzzy match that differs on meaning-changing words or numbers gets ⚠ (Mục 6.3). */
function meaningCheck(layer: PdfTextLayer, evidence: EvidenceIn): CheckResult[] {
  const diff = verifyQuote(layer, evidence.quote, evidence.pdf_page).criticalDifferences;
  return diff.length === 0 ? [] : [fail("quote_meaning", `Câu trích khác bản gốc ở từ có thể đổi nghĩa: ${diff.join(", ")}`, "attention")];
}

/** A value the AI gave without the evidence the schema requires: hidden. */
export function withoutEvidence(naturalKey: string, fieldName: string, tier: FieldTier, value: unknown): FieldVerification {
  return {
    naturalKey,
    fieldName,
    tier,
    value,
    evidence: { pdfPage: 0, quote: "" },
    badge: "hidden",
    checks: [fail("has_evidence", "AI không đưa bằng chứng cho giá trị này")],
  };
}

/**
 * One field: its evidence quote is checked, then `extraChecks` run on the page where the quote was found.
 * Pages without a text layer, and table evidence whose numbers are all on the page, turn a missing
 * quote into ⚠ instead of hiding a value that may be right.
 */
export function field(
  naturalKey: string,
  fieldName: string,
  tier: FieldTier,
  value: unknown,
  evidence: EvidenceIn,
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
      check = {
        ...check,
        severity: "attention",
        detail: `Trang PDF ${evidence.pdf_page} không có text (bảng hoặc hình dạng ảnh) nên không kiểm chứng tự động được; hãy mở PDF để xem`,
      };
    } else if (evidence.table_or_figure !== null && mainNumbers.length > 0 && mainNumbers.every((c) => c.passed)) {
      check = { ...check, severity: "attention", detail: `${check.detail}; nhưng mọi con số đều có trên trang (thường do bằng chứng nằm trong bảng)` };
    } else if (evidence.table_or_figure && mainNumbers.length === 0 && textCheck(layer, "table_label", evidence.table_or_figure, evidence.pdf_page).passed) {
      // A classification read from a table (diagonal type, correlation type…): the table is on the page.
      check = { ...check, severity: "attention", detail: `${check.detail}; nhưng ${evidence.table_or_figure} có trên trang (bằng chứng nằm trong bảng)` };
    }
  }

  if (!pageHasText) extra = extra.map((c) => (!c.passed && c.severity === "hide" ? { ...c, severity: "attention" } : c));
  const estimateFound = mainNumbers.some((c) => c.name === "estimate_in_pdf" && c.passed);
  extra = extra.map((c) =>
    c.name === "p_in_pdf" && !c.passed && estimateFound ? { ...c, severity: "attention", detail: `${c.detail} (p thường nằm ở chú thích dưới bảng)` } : c,
  );

  const checks = [check, ...meaningCheck(layer, evidence), ...extra];
  return { naturalKey, fieldName, tier, value, evidence: { pdfPage: page, quote: evidence.quote }, badge: badgeFor(tier, checks), checks };
}

/** A scanned PDF (no usable text layer) cannot be checked: every T1/T2 field gets ⚠ (Mục 6.3). */
export function scannedPdf(fields: FieldVerification[]): FieldVerification[] {
  const note = fail("needs_ocr", "PDF dạng ảnh quét, không có text để kiểm chứng tự động; hãy mở PDF để xem", "attention");
  return fields.map((f) =>
    f.tier === "T3" ? f : { ...f, badge: "needs_attention", checks: [...f.checks.map((c) => ({ ...c, severity: "attention" as const })), note] },
  );
}
