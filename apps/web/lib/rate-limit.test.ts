import { describe, expect, it } from "vitest";
import { clientIp, enforce, memoryStore, RULES, rateLimitEnabled, rulesFor, visitorId } from "./rate-limit";

const req = (pathname: string, query = "", method = "GET", prefetch = false) => ({ pathname, method, search: new URLSearchParams(query), prefetch });
const names = (r: ReturnType<typeof rulesFor>) => r.map((x) => x.name);

describe("rulesFor", () => {
  it("counts a page against the page limit, and a search against the tighter search limit as well", () => {
    expect(names(rulesFor(req("/about")))).toEqual(["pages"]);
    expect(names(rulesFor(req("/")))).toEqual(["pages"]);
    expect(names(rulesFor(req("/", "a=trust&b=loyalty")))).toEqual(["search", "pages"]);
    expect(names(rulesFor(req("/library", "q=brand")))).toEqual(["search", "pages"]);
    expect(names(rulesFor(req("/matrix", "design=survey")))).toEqual(["search", "pages"]);
    expect(names(rulesFor(req("/library")))).toEqual(["pages"]);
  });
  it("limits PDF links, and downloads more tightly", () => {
    expect(names(rulesFor(req("/api/papers/abc/pdf")))).toEqual(["pdf"]);
    expect(names(rulesFor(req("/api/papers/abc/pdf", "download=1")))).toEqual(["pdf-download", "pdf"]);
  });
  it("limits exports, the sign-in form and the sign-in link; sign-out is free", () => {
    for (const p of ["/export", "/export/word", "/matrix/word"]) expect(names(rulesFor(req(p, "a=x")))).toEqual(["export"]);
    expect(names(rulesFor(req("/login", "", "POST")))).toEqual(["login"]);
    expect(names(rulesFor(req("/login")))).toEqual(["pages"]);
    expect(names(rulesFor(req("/auth/callback", "code=x")))).toEqual(["auth"]);
    expect(rulesFor(req("/auth/logout", "", "POST"))).toEqual([]);
  });
  it("never counts a link prefetch the browser made by itself", () => {
    expect(rulesFor(req("/library", "", "GET", true))).toEqual([]);
  });
});

describe("the sliding window", () => {
  const rule = { name: "t", limit: 3, windowSec: 60 };
  it("lets the limit through, refuses the next, and says when to come back", async () => {
    const store = memoryStore();
    for (let i = 0; i < 3; i++) expect((await enforce(store, [rule], "v", 1000 + i * 1000)).allowed).toBe(true);
    const refused = await enforce(store, [rule], "v", 5000);
    expect(refused).toMatchObject({ allowed: false, rule });
    expect(refused.retryAfterSec).toBe(56); // the oldest request (at 1000 ms) leaves the window at 61000 ms
  });
  it("frees a place as the oldest request slides out of the window", async () => {
    const store = memoryStore();
    for (let i = 0; i < 3; i++) await enforce(store, [rule], "v", 1000 + i * 1000);
    expect((await enforce(store, [rule], "v", 61_500)).allowed).toBe(true);
    expect((await enforce(store, [rule], "v", 61_600)).allowed).toBe(false);
  });
  it("counts only what is let through, so a flood does not keep itself locked out", async () => {
    const store = memoryStore();
    for (let i = 0; i < 3; i++) await enforce(store, [rule], "v", 1000);
    for (let i = 0; i < 50; i++) expect((await enforce(store, [rule], "v", 2000)).allowed).toBe(false);
    expect((await enforce(store, [rule], "v", 61_001)).allowed).toBe(true); // the first window ended; the 50 refused ones did not count
  });
  it("keeps visitors and rules apart", async () => {
    const store = memoryStore();
    for (let i = 0; i < 3; i++) await enforce(store, [rule], "a", 1000);
    expect((await enforce(store, [rule], "a", 1100)).allowed).toBe(false);
    expect((await enforce(store, [rule], "b", 1100)).allowed).toBe(true);
    expect((await enforce(store, [{ ...rule, name: "other" }], "a", 1100)).allowed).toBe(true);
  });
  it("the first rule that refuses decides, with its own wait", async () => {
    const store = memoryStore();
    const tight = { name: "tight", limit: 1, windowSec: 3600 };
    await enforce(store, [tight, RULES.pages], "v", 0);
    const v = await enforce(store, [tight, RULES.pages], "v", 1000);
    expect(v).toMatchObject({ allowed: false, retryAfterSec: 3599, rule: tight });
  });
  it("does not grow without bound", async () => {
    const store = memoryStore(10);
    for (let i = 0; i < 100; i++) await enforce(store, [rule], `v${i}`, 1000 + i);
    // an old visitor was forgotten, so they start fresh; the newest one is still counted
    for (let i = 0; i < 3; i++) await enforce(store, [rule], "v99", 2000);
    expect((await enforce(store, [rule], "v99", 2100)).allowed).toBe(false);
  });
});

describe("who is the visitor", () => {
  const h = (o: Record<string, string>) => new Headers(o);
  it("believes forwarded-for only behind a trusted proxy", () => {
    expect(clientIp(h({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }), true)).toBe("203.0.113.5");
    expect(clientIp(h({ "x-forwarded-for": "203.0.113.5" }), false)).toBe("unknown");
    expect(clientIp(h({ "x-real-ip": "198.51.100.7" }), true)).toBe("198.51.100.7");
    expect(clientIp(h({}), true)).toBe("unknown");
  });
  it("counts a salted hash, never the address", async () => {
    const id = await visitorId("203.0.113.5", "salt");
    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(id).not.toContain("203");
    expect(await visitorId("203.0.113.5", "salt")).toBe(id);
    expect(await visitorId("203.0.113.5", "other salt")).not.toBe(id);
    expect(await visitorId("203.0.113.6", "salt")).not.toBe(id);
  });
});

describe("rateLimitEnabled", () => {
  it("is on in production, off in development, and can be forced", () => {
    expect(rateLimitEnabled({ NODE_ENV: "production" })).toBe(true);
    expect(rateLimitEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(rateLimitEnabled({ NODE_ENV: "development", RATE_LIMIT: "on" })).toBe(true);
    expect(rateLimitEnabled({ NODE_ENV: "production", RATE_LIMIT: "OFF" })).toBe(false);
  });
});
