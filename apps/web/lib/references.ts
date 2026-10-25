/**
 * Step P4.3: the papers of a list as RIS (Zotero, EndNote, Mendeley) and BibTeX (LaTeX, Zotero). Bibliographic data only, as Crossref gave it.
 * Pure, no I/O. A paper with no title is left out: a reference without one cannot be told apart.
 */
import type { LibraryItem } from "./library";

type Ref = Pick<LibraryItem, "id" | "title" | "authors" | "year" | "journal" | "volume" | "issue" | "pages" | "doi">;

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** First and last page from "81-93", "81–93", "e12345" or "194". */
function pageRange(pages: string | null): { start: string | null; end: string | null } {
  if (!pages) return { start: null, end: null };
  const [start, end] = pages.split(/\s*[-–—]\s*/);
  return { start: start || null, end: end || null };
}

/** RIS: one record per paper, tags TY AU TI JO PY VL IS SP EP DO UR ER, CRLF line ends. */
export function toRis(items: Ref[]): string {
  const records: string[] = [];
  for (const p of items) {
    if (!p.title) continue;
    const { start, end } = pageRange(p.pages);
    const lines: [string, string | null][] = [
      ["TY", "JOUR"],
      ...p.authors.map((a): [string, string | null] => ["AU", [a.family, a.given].filter(Boolean).join(", ") || null]),
      ["TI", clean(p.title)],
      ["JO", p.journal ? clean(p.journal) : null],
      ["PY", p.year ? String(p.year) : null],
      ["VL", p.volume],
      ["IS", p.issue],
      ["SP", start],
      ["EP", end],
      ["DO", p.doi],
      ["UR", p.doi ? `https://doi.org/${p.doi}` : null],
    ];
    records.push([...lines.filter(([, v]) => v).map(([k, v]) => `${k}  - ${v}`), "ER  - "].join("\r\n"));
  }
  return records.join("\r\n\r\n") + (records.length ? "\r\n" : "");
}

/** Characters that mean something to BibTeX or LaTeX inside a value. */
const bibEscape = (s: string) => s.replace(/\\/g, "\\textbackslash{}").replace(/([&%$#_])/g, "\\$1").replace(/[{}]/g, "");

const ascii = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]/g, "");

/** Keys like "chaudhuri2001chain": first author's family name, year, first word of the title; a letter is added to keep them unique. */
export function citeKeys(items: Ref[]): Map<string, string> {
  const used = new Set<string>();
  const keys = new Map<string, string>();
  for (const p of items) {
    const word = ascii((p.title ?? "").split(/\s+/).find((w) => ascii(w).length > 3) ?? "");
    const base = `${ascii(p.authors[0]?.family ?? "") || "anon"}${p.year ?? ""}${word}`.toLowerCase();
    let key = base;
    for (let i = 0; used.has(key); i++) key = `${base}${String.fromCharCode(97 + (i % 26))}${i >= 26 ? i : ""}`;
    used.add(key);
    keys.set(p.id, key);
  }
  return keys;
}

/** BibTeX: @article entries; the title is in double braces so the case the authors wrote is kept. */
export function toBibtex(items: Ref[]): string {
  const withTitle = items.filter((p) => p.title);
  const keys = citeKeys(withTitle);
  return withTitle
    .map((p) => {
      const fields: [string, string | null][] = [
        ["author", p.authors.length ? p.authors.map((a) => [a.family, a.given].filter(Boolean).join(", ")).join(" and ") : null],
        ["title", `{${bibEscape(clean(p.title!))}}`],
        ["journal", p.journal ? bibEscape(clean(p.journal)) : null],
        ["year", p.year ? String(p.year) : null],
        ["volume", p.volume],
        ["number", p.issue],
        ["pages", p.pages ? p.pages.replace(/\s*[-–—]\s*/, "--") : null],
        ["doi", p.doi],
        ["url", p.doi ? `https://doi.org/${p.doi}` : null],
      ];
      const body = fields
        .filter(([, v]) => v)
        .map(([k, v]) => `  ${k} = {${k === "title" ? v : k === "author" ? bibEscape(v!) : v}}`)
        .join(",\n");
      return `@article{${keys.get(p.id)},\n${body}\n}`;
    })
    .join("\n\n") + (withTitle.length ? "\n" : "");
}
