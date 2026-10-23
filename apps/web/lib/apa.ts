/** A plain-text APA 7 reference built from the stored metadata (for the Copy APA button; no italics in plain text). */
export interface ApaSource {
  title: string | null;
  authors: { given?: string | null; family?: string | null }[];
  year: number | null;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  doi: string | null;
}

const initials = (given: string | null | undefined) =>
  (given ?? "")
    .split(/[\s]+/)
    .filter(Boolean)
    .flatMap((part) => part.split("-").map((p) => `${p[0]!.toUpperCase()}.`))
    .join(" ");

const name = (a: ApaSource["authors"][number]) => {
  const family = a.family?.trim() ?? "";
  const ini = initials(a.given);
  return ini ? `${family}, ${ini}` : family;
};

export function apaReference(p: ApaSource): string {
  const names = p.authors.filter((a) => a.family || a.given).map(name);
  const authors = names.length === 0 ? "" : names.length === 1 ? names[0]! : names.length <= 20 ? `${names.slice(0, -1).join(", ")}, & ${names.at(-1)}` : `${names.slice(0, 19).join(", ")}, ... ${names.at(-1)}`;
  const title = p.title?.replace(/[.?!]+$/, "") ?? "";
  const titleEnd = p.title && /[?!]$/.test(p.title.trim()) ? p.title.trim().slice(-1) : ".";
  const where = [p.journal, p.volume ? `${p.volume}${p.issue ? `(${p.issue})` : ""}` : null, p.pages].filter(Boolean).join(", ");
  const parts = [
    authors ? `${authors}${authors.endsWith(".") ? "" : "."}` : "",
    `(${p.year ?? "n.d."}).`,
    title ? `${title}${titleEnd}` : "",
    where ? `${where}.` : "",
    p.doi ? `https://doi.org/${p.doi}` : "",
  ];
  return parts.filter(Boolean).join(" ");
}
