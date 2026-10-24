/** What the top of a paper page says (step P1.4): who wrote it, where it appeared, and what is in it. Pure, no I/O. */
import { DESIGN_LABELS, PAPER_TYPE_LABELS } from "./library";

interface Named {
  given?: string | null;
  family?: string | null;
}

/** "Chaudhuri, A., & Holbrook, M. B." style is for the reference list; the header shows the plain names. */
export function authorLine(authors: Named[]): string {
  const names = authors.map((a) => [a.given, a.family].filter(Boolean).join(" ")).filter(Boolean);
  if (names.length <= 2) return names.join(" & ");
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/** "Journal of Marketing, 65(2), 81–93" (whatever part is known). */
export function sourceLine(p: { journal: string | null; volume?: string | null; issue?: string | null; pages?: string | null; year: number | null }): string {
  const volume = p.volume ? `${p.volume}${p.issue ? `(${p.issue})` : ""}` : "";
  const parts = [p.journal, volume, p.pages?.replace("-", "–")].filter(Boolean);
  const text = parts.join(", ");
  return [text, p.year ? `(${p.year})` : ""].filter(Boolean).join(" ");
}

export interface HeaderField {
  natural_key: string;
  field_name: string;
  value: unknown;
  badge: string;
}

export interface PaperFacts {
  typeLabel: string | null;
  designs: string[];
  /** Sample sizes as the paper reports them, one per study that has one. */
  sampleSizes: number[];
  /** Tests (hypothesis paths) the paper reports. */
  tests: number;
  /** Fields shown, and how many are ✓ / ★ . */
  fields: number;
  verified: number;
}

const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function paperFacts(fields: HeaderField[]): PaperFacts {
  const type = fields.find((f) => f.natural_key === "paper_type")?.value;
  const designs = [...new Set(fields.filter((f) => f.field_name === "research_design").map((f) => String(f.value)))].map((d) => DESIGN_LABELS[d] ?? d);
  // A study's sample is "study_1:n" (full extraction) or field "sample_size" (skeleton); a matrix's or a cell's n has more parts.
  const sampleSizes = fields.filter((f) => (f.field_name === "sample_size" || /^[^:]+:n$/.test(f.natural_key)) && isNumber(f.value)).map((f) => f.value as number);
  return {
    typeLabel: typeof type === "string" ? (PAPER_TYPE_LABELS[type] ?? type) : null,
    designs,
    sampleSizes,
    // One path per "study:h:iv->dv:effect", whatever it reports (β, p only, or just the conclusion).
    tests: new Set(fields.filter((f) => f.natural_key.includes("->")).map((f) => f.natural_key.slice(0, f.natural_key.lastIndexOf(":")))).size,
    fields: fields.length,
    verified: fields.filter((f) => f.badge === "auto_verified" || f.badge === "human_reviewed").length,
  };
}

/** A natural key the way a reader would say it: "study_1:h1:a->b:direct" becomes "Study 1 · H1 · a → b · direct". */
export function readableKey(context: string): string {
  return context
    .split(":")
    .map((part) => {
      if (/^study_/.test(part)) return `Study ${part.slice(6).toUpperCase()}`;
      if (/^h\d+/i.test(part)) return part.toUpperCase();
      if (part === "table") return "";
      const table = /^table_(\w+)$/.exec(part);
      if (table) return `Bảng ${table[1]}`;
      if (part === "m") return "thang đo";
      return part.replace(/->/g, " → ").replace(/_/g, " ");
    })
    .filter(Boolean)
    .join(" · ");
}
