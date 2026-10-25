import { describe, expect, it } from "vitest";
import { CORPUS_TAG, fetchCache } from "./data-cache.js";

describe("how a public read is remembered", () => {
  it("keeps nothing when the cache time is zero, negative or not a number", () => {
    expect(fetchCache(0)).toEqual({ cache: "no-store" });
    expect(fetchCache(-5)).toEqual({ cache: "no-store" });
    expect(fetchCache(Number.NaN)).toEqual({ cache: "no-store" });
  });

  it("remembers for the cache time (in whole seconds, at least one) and tags the answer as the corpus", () => {
    expect(fetchCache(60_000)).toEqual({ next: { revalidate: 60, tags: [CORPUS_TAG] } });
    expect(fetchCache(1_500)).toEqual({ next: { revalidate: 2, tags: [CORPUS_TAG] } });
    expect(fetchCache(200)).toEqual({ next: { revalidate: 1, tags: [CORPUS_TAG] } });
  });
});
