/**
 * Unpaywall API (step 2.2c, Mục 7): is a paper open access, with which licence, and where. Read-only; Unpaywall asks for a
 * contact email on every request (UNPAYWALL_EMAIL). Retries 429 / 5xx and network errors with backoff; `fetchImpl` and
 * `sleep` are injectable so tests run offline.
 */

export const UNPAYWALL_API = "https://api.unpaywall.org/v2";
const USER_AGENT = "research-data/0.1 (https://github.com/johntroger/research-data)";

export type OaStatus = "gold" | "green" | "hybrid" | "bronze" | "closed" | "unknown";

export interface OaInfo {
  oaStatus: OaStatus;
  /** Licence of the best open copy as Unpaywall names it ("cc-by"...), null when none or not stated. */
  license: string | null;
  /** Landing page of the best open copy; never a PDF we store. */
  url: string | null;
}

interface UnpaywallLocation {
  license?: string | null;
  url?: string | null;
  url_for_landing_page?: string | null;
}
interface UnpaywallWork {
  oa_status?: string;
  is_oa?: boolean;
  best_oa_location?: UnpaywallLocation | null;
}

const STATUSES: OaStatus[] = ["gold", "green", "hybrid", "bronze", "closed"];

export function parseUnpaywall(work: UnpaywallWork): OaInfo {
  const status = (STATUSES as string[]).includes(work.oa_status ?? "") ? (work.oa_status as OaStatus) : "unknown";
  const best = work.best_oa_location ?? null;
  return {
    oaStatus: status,
    license: best?.license?.trim() || null,
    url: best?.url_for_landing_page?.trim() || best?.url?.trim() || null,
  };
}

/**
 * Open licence in the sense of D14: the copy is gold, green or hybrid OA and the licence is a Creative Commons one
 * (CC0, CC BY and its SA / NC / ND variants) or public domain; all of them allow sharing the unmodified file with
 * attribution, and this site is non-commercial, which the NC variants ask for. Bronze (free to read, no licence),
 * publisher-specific and unknown licences are not open: the visitor gets the link to the copy, not the file.
 */
export function isOpenLicense(info: Pick<OaInfo, "oaStatus" | "license">): boolean {
  if (!["gold", "green", "hybrid"].includes(info.oaStatus)) return false;
  return /^(cc-|cc0|pd$|public-domain)/.test((info.license ?? "").trim().toLowerCase());
}

export interface UnpaywallOptions {
  email: string;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
}

/** What Unpaywall knows about a DOI, or null when it has no record (404). */
export async function fetchUnpaywall(doi: string, options: UnpaywallOptions): Promise<OaInfo | null> {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(options.email)) throw new Error("UNPAYWALL_EMAIL must be a real email address");
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const maxRetries = options.maxRetries ?? 3;
  const url = `${UNPAYWALL_API}/${encodeURIComponent(doi)}?email=${encodeURIComponent(options.email)}`;
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
      await sleep((Number(response.headers.get("Retry-After")) || 2 ** attempt) * 1000);
      continue;
    }
    if (!response.ok) throw new Error(`Unpaywall ${response.status} for DOI ${doi}`);
    return parseUnpaywall((await response.json()) as UnpaywallWork);
  }
}
