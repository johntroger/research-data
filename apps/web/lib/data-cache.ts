/**
 * How a public read asks Next.js to remember its answer. Every read in lib/data.ts uses the visitor's rights (the anon key), so the answer
 * is the same for everyone and may be shared between function instances. With a cache time the answer goes into Next's Data Cache, which
 * a new instance reads instead of asking Supabase again (the in-memory copy in data.ts is still the fastest path inside one instance).
 * With none (development and the e2e run, DATA_CACHE_SECONDS=0) nothing is kept, so a change shows at once. The tag lets a later step
 * drop the whole corpus with revalidateTag, e.g. right after a publish.
 */
export const CORPUS_TAG = "corpus";

export type FetchCache = { cache: "no-store" } | { next: { revalidate: number; tags: string[] } };

export function fetchCache(cacheMs: number): FetchCache {
  if (!(cacheMs > 0)) return { cache: "no-store" };
  return { next: { revalidate: Math.max(1, Math.ceil(cacheMs / 1000)), tags: [CORPUS_TAG] } };
}
