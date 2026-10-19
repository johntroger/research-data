/**
 * Gemini does not always respect the schema's maxLength: a quote of 58 or 75 words came back where
 * the codebook allows 50 (step 1.3b, seen on a real paper). An over-long quote is shortened to its
 * first words, cut at a word boundary. What remains is still one continuous passage copied word for
 * word, so it is valid evidence and the PDF check can still match it. The raw response is not changed.
 */
import { MAX_QUOTE_CHARS } from "@research-data/schema";

export interface ShortenedQuote {
  /** Where in the answer, e.g. ".sample.n_evidence". */
  path: string;
  originalChars: number;
}

/** Cuts `quote` to at most `max` characters at a word boundary (a single huge word is cut hard). */
export function shortenQuote(quote: string, max = MAX_QUOTE_CHARS): string {
  if (quote.length <= max) return quote;
  const cut = quote.slice(0, max);
  const lastSpace = cut.search(/\s\S*$/);
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/** Walks a parsed answer and shortens every over-long `quote`; returns what it changed. */
export function shortenQuotes(json: unknown, path = ""): ShortenedQuote[] {
  const changed: ShortenedQuote[] = [];
  if (Array.isArray(json)) {
    json.forEach((item, i) => changed.push(...shortenQuotes(item, `${path}[${i}]`)));
  } else if (json && typeof json === "object") {
    const object = json as Record<string, unknown>;
    for (const [key, value] of Object.entries(object)) {
      if (key === "quote" && typeof value === "string" && value.length > MAX_QUOTE_CHARS) {
        changed.push({ path, originalChars: value.length });
        object[key] = shortenQuote(value);
      } else {
        changed.push(...shortenQuotes(value, `${path}.${key}`));
      }
    }
  }
  return changed;
}
