import type { PdfTextLayer } from "../pdf/text-layer.js";
import { normaliseChars, repairSymbolFont } from "./normalize.js";

export interface NumberCheck {
  found: boolean;
  /** 1-based PDF page where the number was found (cited page first, then ±1), or null. */
  foundOnPage: number | null;
  /** The written form that matched, e.g. "-.31". */
  matchedForm: string | null;
}

/** Page text prepared for number search: unified minus/dashes, no spaces around operators. */
function numberSearchText(text: string): string {
  return normaliseChars(text)
    .replace(/\s+/g, " ")
    .replace(/\s*([<>=≤≥])\s*/g, "$1");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Written forms a number can take in a paper: "-0.31", "-.31", "−.31", "0,31", "1,234" …
 * The decimal places are taken from the printed value when it is a string ("0.310"),
 * otherwise from the shortest representation of the number.
 */
export function numberForms(value: number | string): string[] {
  const text = typeof value === "string" ? normaliseChars(value).trim() : String(value);
  const negative = text.startsWith("-");
  const digits = negative ? text.slice(1) : text;
  const forms = new Set<string>();

  const add = (body: string) => {
    forms.add(negative ? `-${body}` : body);
    if (!negative) return;
    // Some tables print the sign apart: "- .31"
    forms.add(`- ${body}`);
  };

  add(digits);
  if (/^0\.\d+$/.test(digits)) add(digits.slice(1)); // 0.31 → .31
  if (/^\.\d+$/.test(digits)) add(`0${digits}`); // .31 → 0.31
  if (/^\d+\.\d+$/.test(digits)) add(digits.replace(".", ",")); // 0.31 → 0,31 (European decimals)
  if (/^\d{4,}$/.test(digits)) add(Number(digits).toLocaleString("en-US")); // 1234 → 1,234
  return [...forms];
}

/** Forms of a p-value as reported, e.g. "< .001" → "<.001", "<0.001". */
export function pValueForms(reported: string): string[] {
  // Star notation as written from a table note: "* p < .05", "***p<.001" → "<.05".
  const text = normaliseChars(reported).replace(/\s+/g, "").replace(/^[*†‡]+/, "").replace(/^p/i, "");
  const match = /^([<>=≤≥]?)(-?\d*\.?\d+)$/.exec(text);
  if (!match) return [text];
  const [, operator = "", number = ""] = match;
  return numberForms(number).map((form) => `${operator}${form}`);
}

/** The first of `forms` that `text` contains as a whole number (also with symbol-font signs restored), or null. */
export function containsNumber(text: string, forms: string[]): string | null {
  const texts = [text, repairSymbolFont(text)].filter((t): t is string => t !== null).map(numberSearchText);
  for (const form of forms) {
    // The number must not be part of a longer number (412 must not match 4120 or 1.412),
    // but decimals may carry extra trailing zeros in print (0.7 matches "0.70").
    const trailingZeros = /[.,]\d/.test(form) ? "0*" : "";
    const pattern = new RegExp(`(?<![\\d.,])${escapeRegExp(form)}${trailingZeros}(?![\\d]|[.,]\\d)`);
    if (texts.some((t) => pattern.test(t))) return form;
  }
  return null;
}

function findOnPage(layer: PdfTextLayer, pdfPage: number, forms: string[]): string | null {
  const page = layer.pages[pdfPage - 1];
  // Also search with symbol-font signs restored ("2 0.288" printed as "−0.288", see repairSymbolFont).
  return page ? containsNumber(page.text, forms) : null;
}

function search(layer: PdfTextLayer, pdfPage: number, forms: string[]): NumberCheck {
  for (const page of [pdfPage, pdfPage - 1, pdfPage + 1]) {
    const form = findOnPage(layer, page, forms);
    if (form !== null) return { found: true, foundOnPage: page, matchedForm: form };
  }
  return { found: false, foundOnPage: null, matchedForm: null };
}

/** Checks that a number (β, n, r, α…) appears on the cited PDF page or a neighbouring page. */
export function verifyNumber(layer: PdfTextLayer, value: number | string, pdfPage: number): NumberCheck {
  return search(layer, pdfPage, numberForms(value));
}

/** Checks that a reported p-value (e.g. "< .001") appears on the cited page or a neighbouring page. */
export function verifyPValue(layer: PdfTextLayer, reported: string, pdfPage: number): NumberCheck {
  return search(layer, pdfPage, pValueForms(reported));
}

/** Parses a reported p-value into its upper bound or exact value: "< .001" → 0.001, "= .03" → 0.03. */
export function parsePValue(reported: string): { operator: "<" | ">" | "=" | "≤" | "≥"; value: number } | null {
  // Star notation as written from a table note: "* p < .05", "***p<.001" → "<.05".
  const text = normaliseChars(reported).replace(/\s+/g, "").replace(/^[*†‡]+/, "").replace(/^p/i, "");
  const match = /^([<>=≤≥]?)(\d*\.?\d+)$/.exec(text);
  if (!match) return null;
  const operator = (match[1] || "=") as "<" | ">" | "=" | "≤" | "≥";
  return { operator, value: Number(match[2]) };
}
