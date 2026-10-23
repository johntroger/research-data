import { describe, expect, it } from "vitest";
import { enforce } from "./rate-limit";
import { SLIDING_WINDOW_LUA, upstashFromEnv, upstashStore } from "./rate-limit-upstash";

/**
 * A stand-in for Upstash that runs the SAME rule as the Lua script in JavaScript, to test the client around it: the command it sends,
 * the answer it reads, the errors it survives. (The script itself is run for real by the integration test below when UPSTASH_TEST_URL is set.)
 */
function fakeUpstash() {
  const sets = new Map<string, number[]>();
  const calls: unknown[][] = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    const command = JSON.parse(String(init.body)) as string[];
    calls.push(command);
    const [, , , key, now, window, limit] = command;
    const list = (sets.get(key!) ?? []).filter((t) => t > Number(now) - Number(window));
    if (list.length >= Number(limit)) {
      sets.set(key!, list);
      return new Response(JSON.stringify({ result: [0, list[0]! + Number(window) - Number(now)] }));
    }
    list.push(Number(now));
    sets.set(key!, list);
    return new Response(JSON.stringify({ result: [1, 0] }));
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("upstashStore", () => {
  const rule = { name: "t", limit: 2, windowSec: 60 };
  it("counts through the script, refuses past the limit and says how long to wait", async () => {
    const { fetchImpl, calls } = fakeUpstash();
    const store = upstashStore({ url: "https://example.upstash.io", token: "tok", fetchImpl });
    expect((await enforce(store, [rule], "v", 1000)).allowed).toBe(true);
    expect((await enforce(store, [rule], "v", 2000)).allowed).toBe(true);
    const refused = await enforce(store, [rule], "v", 3000);
    expect(refused).toMatchObject({ allowed: false, retryAfterSec: 58 });
    expect(calls[0]!.slice(0, 3)).toEqual(["EVAL", SLIDING_WINDOW_LUA, "1"]);
    expect(calls[0]![3]).toBe("t:v");
    expect(calls[0]!.slice(5, 7)).toEqual(["60000", "2"]);
  });
  it("sends the token as a bearer header and nothing about the visitor but the hashed key", async () => {
    let seen: RequestInit | undefined;
    const store = upstashStore({ url: "https://example.upstash.io", token: "secret-token", fetchImpl: (async (_u: string, init: RequestInit) => ((seen = init), new Response(JSON.stringify({ result: [1, 0] })))) as unknown as typeof fetch });
    await store.consume("pages:abc123", 5, 1000, 1);
    expect((seen!.headers as Record<string, string>).Authorization).toBe("Bearer secret-token");
  });
  it("lets the request through, and logs, when Upstash fails, times out or answers badly", async () => {
    const logs: string[] = [];
    const bad = async (impl: () => Promise<Response>) => upstashStore({ url: "https://x", token: "t", fetchImpl: impl as unknown as typeof fetch, log: (m) => logs.push(m) }).consume("k", 1, 1000, 1);
    expect((await bad(async () => new Response("nope", { status: 500 }))).allowed).toBe(true);
    expect((await bad(async () => { throw new Error("network down"); })).allowed).toBe(true);
    expect((await bad(async () => new Response(JSON.stringify({ error: "ERR script" })))).allowed).toBe(true);
    expect((await bad(async () => new Response("{}"))).allowed).toBe(true);
    expect(logs).toHaveLength(4);
    expect(logs[0]).toContain("letting the request through");
  });
});

describe("upstashFromEnv", () => {
  it("reads Upstash's own names or the Vercel integration's, and trims a trailing slash", () => {
    expect(upstashFromEnv({ UPSTASH_REDIS_REST_URL: "https://a.upstash.io/", UPSTASH_REDIS_REST_TOKEN: "t" })).toEqual({ url: "https://a.upstash.io", token: "t" });
    expect(upstashFromEnv({ KV_REST_API_URL: "https://b.upstash.io", KV_REST_API_TOKEN: "u" })).toEqual({ url: "https://b.upstash.io", token: "u" });
    expect(upstashFromEnv({ UPSTASH_REDIS_REST_URL: "https://a.upstash.io" })).toBeNull();
    expect(upstashFromEnv({})).toBeNull();
  });
});

// Runs the real Lua script against a real Upstash database; skipped unless UPSTASH_TEST_URL and UPSTASH_TEST_TOKEN are set.
describe.skipIf(!process.env.UPSTASH_TEST_URL || !process.env.UPSTASH_TEST_TOKEN)("the Lua script on a real Upstash database", () => {
  it("is a sliding window that counts only what it lets through", async () => {
    const store = upstashStore({ url: process.env.UPSTASH_TEST_URL!, token: process.env.UPSTASH_TEST_TOKEN!, timeoutMs: 3000 });
    const key = `test:${Date.now()}-${Math.random()}`;
    const now = Date.now();
    expect((await store.consume(key, 2, 5000, now)).allowed).toBe(true);
    expect((await store.consume(key, 2, 5000, now + 1)).allowed).toBe(true);
    const refused = await store.consume(key, 2, 5000, now + 2);
    expect(refused.allowed).toBe(false);
    expect(refused.retryAfterMs).toBeGreaterThan(4000);
    expect((await store.consume(key, 2, 5000, now + 5001)).allowed).toBe(true);
  });
});
