import { describe, expect, it } from "vitest";
import { CRAWLER_DISALLOW, indexingAllowed } from "./seo";

describe("indexingAllowed", () => {
  it("is closed unless the owner opens it with ALLOW_INDEXING=1", () => {
    expect(indexingAllowed({})).toBe(false);
    expect(indexingAllowed({ ALLOW_INDEXING: "" })).toBe(false);
    expect(indexingAllowed({ ALLOW_INDEXING: "0" })).toBe(false);
    expect(indexingAllowed({ ALLOW_INDEXING: "true" })).toBe(false);
    expect(indexingAllowed({ ALLOW_INDEXING: "1" })).toBe(true);
  });
  it("keeps the API, admin, sign-in and exports away from crawlers", () => {
    for (const p of ["/api/", "/admin/", "/login", "/auth/", "/export"]) expect(CRAWLER_DISALLOW).toContain(p);
  });
});
