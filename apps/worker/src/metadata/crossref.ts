/**
 * Crossref REST API (S2, Mục 2): bibliographic metadata by DOI. Metadata never comes from the LLM.
 * Read-only, no key. Retries 429 / 5xx and network errors with backoff; `fetchImpl` and `sleep`
 * are injectable so tests run offline.
 */

export const CROSSREF_API = "https://api.crossref.org";
const USER_AGENT = "research-data/0.1 (https://github.com/johntroger/research-data)";

export interface BibAuthor {
  family: string;
  given: string | null;
  orcid: string | null;
}

export interface BibMetadata {
  doi: string;
  title: string | null;
  authors: BibAuthor[];
  year: number | null;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  /** First printed page, used to place printed page numbers (S3). */
  firstPage: number | null;
}

export interface CrossrefOptions {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
}

interface CrossrefWork {
  DOI: string;
  title?: string[];
  author?: { family?: string; given?: string; name?: string; ORCID?: string }[];
  "container-title"?: string[];
  volume?: string;
  issue?: string;
  page?: string;
  issued?: { "date-parts"?: (number | null)[][] };
  "published-print"?: { "date-parts"?: (number | null)[][] };
  "published-online"?: { "date-parts"?: (number | null)[][] };
}

const firstYear = (...dates: (CrossrefWork["issued"] | undefined)[]) => {
  for (const d of dates) {
    const year = d?.["date-parts"]?.[0]?.[0];
    if (typeof year === "number") return year;
  }
  return null;
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decodeEntities = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
    if (name.startsWith("#")) {
      const code = name[1]!.toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[name.toLowerCase()] ?? whole;
  });

/** Crossref titles may carry JATS / HTML markup such as <i>…</i> and entities such as &amp;. */
const plain = (text: string | undefined) => (text ? decodeEntities(text.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim() || null : null);

/**
 * JSTOR-sourced records sometimes put the page header "Morris B. Holbrook Reviewed work(s):" into the name fields, so the
 * author comes out as given "Morris B. Holbrook Reviewed", family "work(s):". Restore the name that precedes "Reviewed".
 */
export function cleanAuthor(a: BibAuthor): BibAuthor {
  const artefact = /^work\(s\):?$/i.test(a.family.trim());
  const given = (a.given ?? "").replace(/\s*\bReviewed\s*$/i, "").trim();
  if (!artefact) return a;
  const parts = given.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return a;
  return { ...a, family: parts[parts.length - 1]!, given: parts.slice(0, -1).join(" ") };
}

export function parseCrossrefWork(work: CrossrefWork): BibMetadata {
  const pages = work.page ?? null;
  const first = pages ? Number(/^\d+/.exec(pages)?.[0]) : NaN;
  return {
    doi: work.DOI.toLowerCase(),
    title: plain(work.title?.[0]),
    authors: (work.author ?? []).map((a) =>
      cleanAuthor({
        family: a.family ?? a.name ?? "",
        given: a.given ?? null,
        orcid: a.ORCID ? a.ORCID.replace(/^https?:\/\/orcid\.org\//, "") : null,
      }),
    ),
    // The year of the issue (print) is the citation year; fall back to online publication.
    year: firstYear(work["published-print"], work.issued, work["published-online"]),
    journal: plain(work["container-title"]?.[0]),
    volume: work.volume ?? null,
    issue: work.issue ?? null,
    pages,
    firstPage: Number.isFinite(first) ? first : null,
  };
}

/** Metadata for a DOI, or null when Crossref has no record of it (404). */
export async function fetchCrossref(doi: string, options: CrossrefOptions = {}): Promise<BibMetadata | null> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const maxRetries = options.maxRetries ?? 3;
  const url = `${CROSSREF_API}/works/${encodeURIComponent(doi)}`;

  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetchImpl(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
    } catch (error) {
      if (attempt < maxRetries) {
        await sleep(2 ** attempt * 1000);
        continue;
      }
      throw error;
    }
    if (response.status === 404) return null;
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      const retryAfter = Number(response.headers.get("Retry-After")) || 2 ** attempt;
      await sleep(retryAfter * 1000);
      continue;
    }
    if (!response.ok) throw new Error(`Crossref ${response.status} for DOI ${doi}`);
    const body = (await response.json()) as { message: CrossrefWork };
    return parseCrossrefWork(body.message);
  }
}
