/**
 * Rate limiting by IP (step A.5, risk 18): a public site must not be hammered by bots, mass PDF downloads or sign-in guessing.
 * Pure logic and a store interface, no I/O of its own, so it is tested without a server:
 *  - `rulesFor` says which limits a request counts against (a page, a search, a PDF link, an export, a sign-in);
 *  - a sliding window per (rule, visitor): only requests that are let through are counted, so a flood does not keep itself locked out;
 *  - the visitor is a salted SHA-256 of the IP, never the IP itself, and nothing outlives its window (at most one hour, under the
 *    24 hours of docs/ux-spec.md Mục 7.1).
 * The store here lives in the memory of one process (development, tests, a single server). A deployment on serverless functions swaps in a
 * shared store (Upstash Redis, step 4) behind the same `RateStore` interface.
 */

export interface RateRule {
  name: string;
  limit: number;
  windowSec: number;
  /**
   * Counted in the store shared by every function instance (default). Pages and searches are cheap and constant, and a call to a shared store
   * costs a round trip on every request (about 230 ms from a far-away Redis), so they are counted in each instance's own memory: the limit
   * then holds per instance, which still stops one visitor from hammering the site.
   */
  shared?: boolean;
}

export const RULES = {
  pages: { name: "pages", limit: 120, windowSec: 60, shared: false },
  search: { name: "search", limit: 60, windowSec: 60, shared: false },
  pdf: { name: "pdf", limit: 20, windowSec: 60 },
  pdfDownload: { name: "pdf-download", limit: 10, windowSec: 3600 },
  export: { name: "export", limit: 10, windowSec: 3600 },
  login: { name: "login", limit: 5, windowSec: 600 },
  auth: { name: "auth", limit: 20, windowSec: 600 },
} as const satisfies Record<string, RateRule>;

export interface RequestInfo {
  pathname: string;
  method: string;
  search: URLSearchParams;
  /** A link prefetch the browser made on its own (cheap, not a visitor's action): never counted. */
  prefetch?: boolean;
}

/** The limits a request counts against, tightest purpose first. Nothing for assets (the proxy does not run for them). */
export function rulesFor(req: RequestInfo): RateRule[] {
  if (req.prefetch) return [];
  const { pathname, method, search } = req;
  if (/^\/api\/papers\/[^/]+\/pdf$/.test(pathname)) return search.get("download") === "1" ? [RULES.pdfDownload, RULES.pdf] : [RULES.pdf];
  if (pathname === "/export" || pathname === "/export/word" || pathname === "/matrix/word" || pathname === "/export/csv" || pathname === "/export/refs") return [RULES.export];
  if (pathname === "/auth/callback") return [RULES.auth];
  if (pathname === "/auth/logout") return [];
  if (pathname === "/login" && method === "POST") return [RULES.login];
  const searching = (pathname === "/" && (search.has("a") || search.has("b"))) || ((pathname === "/library" || pathname === "/matrix") && [...search.keys()].length > 0);
  return searching ? [RULES.search, RULES.pages] : [RULES.pages];
}

export interface Consumed {
  allowed: boolean;
  /** When refused: milliseconds until the oldest counted request leaves the window. */
  retryAfterMs: number;
}

export interface RateStore {
  /** Counts one request in the sliding window if fewer than `limit` are already in it; otherwise counts nothing and says how long to wait. */
  consume(key: string, limit: number, windowMs: number, now: number): Promise<Consumed>;
}

export function memoryStore(maxKeys = 20_000): RateStore {
  const hits = new Map<string, number[]>();
  const sweep = (now: number) => {
    for (const [k, list] of hits) if (list.length === 0 || list.at(-1)! < now - 3_600_000) hits.delete(k);
    // Still too many visitors in memory: forget the least recently inserted ones.
    for (const k of hits.keys()) {
      if (hits.size <= maxKeys) break;
      hits.delete(k);
    }
  };
  return {
    async consume(key, limit, windowMs, now) {
      const list = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
      if (list.length >= limit) {
        hits.set(key, list);
        return { allowed: false, retryAfterMs: Math.max(1, list[0]! + windowMs - now) };
      }
      list.push(now);
      hits.set(key, list);
      if (hits.size > maxKeys) sweep(now);
      return { allowed: true, retryAfterMs: 0 };
    },
  };
}

export interface Verdict {
  allowed: boolean;
  /** When refused: whole seconds to wait (at least 1), for the Retry-After header. */
  retryAfterSec: number;
  /** When refused: the rule that refused. */
  rule?: RateRule;
}

/** Applies every rule to one visitor; the first one that refuses decides. */
export async function enforce(store: RateStore, rules: RateRule[], visitor: string, now: number, localStore: RateStore = store): Promise<Verdict> {
  for (const rule of rules) {
    const r = await (rule.shared === false ? localStore : store).consume(`${rule.name}:${visitor}`, rule.limit, rule.windowSec * 1000, now);
    if (!r.allowed) return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(r.retryAfterMs / 1000)), rule };
  }
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * The address a request came from. A forwarded-for header can be written by anyone who reaches the server directly, so it is believed only
 * when the site sits behind a proxy that overwrites it (Vercel does): TRUST_PROXY=1. Otherwise everyone shares one bucket, which is
 * right for a local machine and wrong for nothing else.
 */
export function clientIp(headers: Headers, trustProxy: boolean): string {
  if (!trustProxy) return "unknown";
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/** A salted SHA-256 of the address (first 32 hex characters): what is counted, and what a shared store would hold. */
export async function visitorId(ip: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** On in production, off in development (a developer and the e2e suite make hundreds of requests from one machine); RATE_LIMIT=on|off overrides. */
export function rateLimitEnabled(env: Record<string, string | undefined>): boolean {
  const v = env.RATE_LIMIT?.trim().toLowerCase();
  if (v === "on") return true;
  if (v === "off") return false;
  return env.NODE_ENV === "production";
}
