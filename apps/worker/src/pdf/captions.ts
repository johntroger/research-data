/**
 * Step M3: the caption of a table ("Table 7. Mediation results with the short scale"), found by machine in the text of the PDF page that
 * holds the table; no AI is involved. It tells a reader which model or sample a table reports when one relationship is stated in two
 * tables. The caption is cut at MAX_CAPTION characters: it is a label for the table, not a copy of the paper's text.
 */

export const MAX_CAPTION = 160;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** How much of a line is digits and symbols: a table row, not a caption. */
const numericShare = (line: string): number => {
  const letters = (line.match(/\p{L}/gu) ?? []).length;
  const digits = (line.match(/[\d.,%()±−-]/g) ?? []).length;
  return letters + digits === 0 ? 1 : digits / (letters + digits);
};

/**
 * The caption of `label` ("Table 7") on a page, or null when the page has no line that starts with that label. A caption may sit on the
 * same line as the label or on the lines right after it (up to two, while they read as words and not as table rows).
 */
export function findCaption(pageText: string, label: string): string | null {
  const m = /^(table|tab\.?)\s+(\S+)$/i.exec(label.trim());
  if (!m) return null;
  const head = new RegExp(`^\\s*(?:table|tab\\.?)\\s+${escape(m[2]!)}\\b[\\s.:\\u2013\\u2014-]*(.*)$`, "i");
  const lines = pageText.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const hit = head.exec(lines[i]!);
    if (!hit) continue;
    const parts = [hit[1]!.trim()].filter(Boolean);
    for (let j = i + 1; j <= i + 2 && j < lines.length; j++) {
      const next = lines[j]!.trim();
      if (!next || numericShare(next) > 0.4 || next.length > 120 || /\s{2,}/.test(next)) break; // a table row, not words
      if (parts.length > 0 && !/^[a-z(]/.test(next)) break; // a caption that already reads as a phrase continues only in lower case
      parts.push(next);
    }
    const caption = parts.join(" ").replace(/\s+/g, " ").trim();
    if (caption.length < 6) return null;
    return caption.length > MAX_CAPTION ? `${caption.slice(0, MAX_CAPTION - 1).trimEnd()}…` : caption;
  }
  return null;
}
