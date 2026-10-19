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
      // APL alpha (⍺) and Latin alpha (ɑ) are used by some typesetters for Cronbach's α.
      .replace(/[⍺ɑ]/g, "α")
      // Any non-breaking or thin space becomes a normal space (newlines are kept).
      .replace(/[^\S\r\n]/g, " ")
  );
}

/**
 * Journals set Greek letters in a symbol font whose text layer holds the Latin letter on the same key
 * ("Cronbach's α" is stored as "Cronbach's a"), while Gemini reads the page and writes "α". For quote
 * matching both sides are folded to the Latin letter; numbers are not touched.
 */
const GREEK_TO_LATIN: Record<string, string> = { α: "a", β: "b", γ: "g", δ: "d", ε: "e", η: "h", θ: "q", λ: "l", μ: "m", ρ: "r", σ: "s", χ: "c", ω: "w" };
const foldGreek = (text: string) => text.replace(/[αβγδεηθλμρσχω]/g, (c) => GREEK_TO_LATIN[c]!);

/**
 * Normalises text for quote matching:
 * - joins words hyphenated across line breaks ("per-\nceive" → "perceive")
 * - unifies quotes, apostrophes, dashes and the minus sign
 * - removes the stray spaces PDFs put inside quotes and before punctuation (“ right ” → "right")
 * - collapses whitespace and lower-cases
 */
export function normaliseForMatch(text: string): string {
  return foldGreek(normaliseChars(text))
    .replace(/(\p{L})-\s*\n\s*(\p{Ll})/gu, "$1$2")
    .replace(/\s+/g, " ")
    .replace(/" (.*?) "/g, '"$1"')
    .replace(/ ' /g, "'")
    .replace(/ ([.,;:!?)\]])/g, "$1")
    .replace(/([([]) /g, "$1")
    .trim()
    .toLowerCase();
}

/**
 * Some PDFs (seen in Emerald papers, step 1.4) set mathematical signs in a symbol font whose text
 * layer maps them to other characters: "+" → "þ", "−" → "2 ", "=" → "¼", "<" → ",", and the decimal
 * point in "0.05" → "0 : 05". The reader sees the right sign, and so does Gemini. Returns the text
 * with these signs restored, or null when the text shows no sign of this substitution.
 */
export function repairSymbolFont(text: string): string | null {
  // Signature: a thorn or ¼ for a sign, a p-value note written "p , 0 : 05", or a confidence interval
  // whose minus signs came out as "2": "[ 2 0.79 to 2 0.14]" (Sage tables, step 1.9b).
  if (!/[þ¼]|\bp , ?0 : \d|\[\s*2\s+\d*\.\d+\s+to\s/.test(text)) return null;
  let repaired = text
    .replace(/þ/g, "+")
    .replace(/¼/g, "=")
    .replace(/(\d) : (\d)/g, "$1.$2")
    .replace(/ , (?=\.?\d)/g, " < ");
  // A lone "2" before a decimal number (or before another lone "2") is a minus sign:
  // "2 0.288" → "− 0.288", "H2 2 2 0.288" → "H2 − − 0.288". Repeated because matches touch.
  for (let previous = ""; previous !== repaired; ) {
    previous = repaired;
    // Any whitespace, since in reading order the sign and the number can sit on two lines.
    repaired = repaired.replace(/(^|[\s(])2\s+(?=2\s|\d*\.\d)/gm, "$1− ");
  }
  return repaired;
}

/** Splits normalised text into word tokens (punctuation is ignored for fuzzy matching). */
export function tokens(normalised: string): string[] {
  return normalised
    .split(/[^\p{L}\p{N}.]+/u)
    .map((t) => (/\d/.test(t) ? t.replace(/\.$/, "") : t.replace(/^\.+|\.+$/g, "")))
    .filter((t) => t.length > 0);
}
