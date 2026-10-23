/**
 * Whether search engines may index the site (step 4.1). Closed by default: the site is public (anyone with the address can read it) but is not
 * announced; ALLOW_INDEXING=1 opens it when the owner decides. Read when the server starts and when the site is built.
 */
export const indexingAllowed = (env: Record<string, string | undefined> = process.env): boolean => env.ALLOW_INDEXING?.trim() === "1";

/** Pages a crawler should never fetch even when indexing is open. */
export const CRAWLER_DISALLOW = ["/api/", "/admin/", "/login", "/auth/", "/export", "/matrix/word"];
