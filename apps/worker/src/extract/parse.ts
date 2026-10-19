/**
 * Turns the text Gemini returned for one pass into validated data (shared by the synchronous
 * extraction and the Batch flow): JSON parse, shorten over-long quotes (step 1.3b), Zod check.
 */
import { EXTRACTION_SCHEMAS, type ExtractionSchemaName } from "@research-data/schema";
import type { z } from "zod";
import { type ShortenedQuote, shortenQuotes } from "./quotes.js";

export type ParsedAnswer<S extends ExtractionSchemaName> =
  | { ok: true; data: z.infer<(typeof EXTRACTION_SCHEMAS)[S]>; shortened: ShortenedQuote[] }
  | { ok: false; error: string };

export function parseAnswer<S extends ExtractionSchemaName>(pass: S, text: string): ParsedAnswer<S> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: `${pass}: Gemini did not return valid JSON` };
  }
  const shortened = shortenQuotes(json);
  const parsed = EXTRACTION_SCHEMAS[pass].safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
    return { ok: false, error: `${pass}: output does not match the schema: ${issues}` };
  }
  return { ok: true, data: parsed.data as z.infer<(typeof EXTRACTION_SCHEMAS)[S]>, shortened };
}
