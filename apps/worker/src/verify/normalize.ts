/**
 * Text normalisation used before comparing AI quotes or numbers with the PDF text layer.
 * It removes differences that come from PDF typesetting rather than from wording.
 */

const QUOTE_CHARS = /[‘’‚‛′`´]/g; // ‘ ’ ‚ ‛ ′ ` ´
const DOUBLE_QUOTE_CHARS = /[“”„‟″«»]/g; // “ ” „ ‟ ″ « »
const DASH_CHARS = /[‐‑‒–—―−﹘﹣－]/g; // ‐ ‑ ‒ – — ― − …

/** Normalises characters only (keeps case and spacing), shared by text and number matching. */
export function normaliseChars(text: string): string {
  return (
    text
      // NFKC turns ligatures (ﬁ, ﬂ) and full-width forms into plain letters.
      .normalize("NFKC")
      .replace(QUOTE_CHARS, "'")
      .replace(DOUBLE_QUOTE_CHARS, '"')
      .replace(DASH_CHARS, "-")
      // Any non-breaking or thin space becomes a normal space (newlines are kept).
      .replace(/[^\S\r\n]/g, " ")
  );
}

/**
 * Normalises text for quote matching:
 * - joins words hyphenated across line breaks ("per-\nceive" → "perceive")
 * - unifies quotes, apostrophes, dashes and the minus sign
 * - removes the stray spaces PDFs put inside quotes and before punctuation (“ right ” → "right")
 * - collapses whitespace and lower-cases
 */
export function normaliseForMatch(text: string): string {
  return normaliseChars(text)
    .replace(/(\p{L})-\s*\n\s*(\p{Ll})/gu, "$1$2")
    .replace(/\s+/g, " ")
    .replace(/" (.*?) "/g, '"$1"')
    .replace(/ ' /g, "'")
    .replace(/ ([.,;:!?)\]])/g, "$1")
    .replace(/([([]) /g, "$1")
    .trim()
    .toLowerCase();
}

/** Splits normalised text into word tokens (punctuation is ignored for fuzzy matching). */
export function tokens(normalised: string): string[] {
  return normalised
    .split(/[^\p{L}\p{N}.]+/u)
    .map((t) => (/\d/.test(t) ? t.replace(/\.$/, "") : t.replace(/^\.+|\.+$/g, "")))
    .filter((t) => t.length > 0);
}
