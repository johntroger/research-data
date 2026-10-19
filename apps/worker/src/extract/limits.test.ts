import { describe, expect, it } from "vitest";
import { isRetryable, RateLimiter, RetriesExhausted, retryAfterMs, withRetry, type Clock } from "./limits.js";

/** A clock that only moves when somebody sleeps. */
function fakeClock(): Clock & { slept: number[]; time: number } {
  const clock = {
    time: 0,
    slept: [] as number[],
    now: () => clock.time,
    sleep: async (ms: number) => {
      clock.slept.push(ms);
      clock.time += ms;
    },
  };
  return clock;
}

describe("RateLimiter", () => {
  it("lets requests through until the per-minute request limit, then waits for the oldest to leave", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ rpm: 3, tpm: 1e9 }, clock);
    for (let i = 0; i < 3; i++) {
      expect(await limiter.acquire(10)).toEqual({ waitedMs: 0 });
      clock.time += 5_000; // calls spread over 15 s
    }
    const fourth = await limiter.acquire(10);
    expect(fourth.waitedMs).toBe(45_000); // the first call was at t = 0, so the window frees at 60 s; now is 15 s
    expect(clock.time).toBe(60_000);
  });

  it("waits on the token limit too, and does not wait when the window has emptied", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ rpm: 100, tpm: 100_000 }, clock);
    await limiter.acquire(60_000);
    expect((await limiter.acquire(30_000)).waitedMs).toBe(0); // 90k of 100k
    expect((await limiter.acquire(30_000)).waitedMs).toBeGreaterThan(0); // would be 120k
    clock.time += 120_000;
    expect((await limiter.acquire(90_000)).waitedMs).toBe(0);
  });

  it("lets a single request above the whole minute budget through an empty window instead of waiting forever", async () => {
    const limiter = new RateLimiter({ rpm: 10, tpm: 1_000 }, fakeClock());
    expect((await limiter.acquire(50_000)).waitedMs).toBe(0);
  });

  it("books the real token count once it is known", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ rpm: 100, tpm: 100_000 }, clock);
    await limiter.acquire(90_000);
    limiter.adjust(90_000, 10_000);
    expect((await limiter.acquire(80_000)).waitedMs).toBe(0);
  });
});

describe("retry classification", () => {
  it("retries rate limits, overload, server errors and dropped connections, not client errors", () => {
    const retryable = [
      { status: 429 },
      { status: 503 },
      { status: 500 },
      new Error("fetch failed"),
      new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}'),
      new Error("429 RESOURCE_EXHAUSTED"),
    ];
    for (const e of retryable) expect(isRetryable(e), (e as Error).message ?? JSON.stringify(e)).toBe(true);
    const notRetryable = [{ status: 400 }, { status: 401 }, { status: 403 }, { status: 404 }, new Error("INVALID_ARGUMENT: schema too complex")];
    for (const e of notRetryable) expect(isRetryable(e), (e as Error).message ?? JSON.stringify(e)).toBe(false);
  });

  it("reads the delay the server asked for", () => {
    expect(retryAfterMs({ retryAfter: 7 })).toBe(7000);
    expect(retryAfterMs(new Error('{"error":{"code":429,"details":[{"retryDelay":"34s"}]}}'))).toBe(34_000);
    expect(retryAfterMs(new Error("Please retry in 2.5s."))).toBe(2500);
    expect(retryAfterMs(new Error("boom"))).toBeNull();
  });
});

describe("withRetry", () => {
  it("backs off exponentially with jitter, then succeeds", async () => {
    const clock = fakeClock();
    let calls = 0;
    const result = await withRetry(
      async () => {
        if (++calls < 4) throw Object.assign(new Error("overloaded"), { status: 503 });
        return "ok";
      },
      { clock, baseMs: 1_000, random: () => 0.5 },
    );
    expect(result).toBe("ok");
    // backoff 1000, 2000, 4000 → half fixed + half × 0.5 = 750, 1500, 3000
    expect(clock.slept).toEqual([750, 1500, 3000]);
  });

  it("never waits less than the server asked, and never more than the cap on its own", async () => {
    const clock = fakeClock();
    let calls = 0;
    await withRetry(
      async () => {
        if (++calls === 1) throw Object.assign(new Error('retryDelay":"34s"'), { status: 429 });
      },
      { clock, baseMs: 1_000, random: () => 0 },
    );
    expect(clock.slept).toEqual([34_000]);

    const capped = fakeClock();
    let n = 0;
    await withRetry(
      async () => {
        if (++n < 8) throw Object.assign(new Error("x"), { status: 503 });
      },
      { clock: capped, baseMs: 10_000, capMs: 20_000, maxRetries: 10, random: () => 1 },
    );
    expect(Math.max(...capped.slept)).toBe(20_000);
  });

  it("gives up after maxRetries with the reason, and does not retry client errors", async () => {
    const clock = fakeClock();
    let calls = 0;
    const error = await withRetry(
      async () => {
        calls++;
        throw Object.assign(new Error("quota exhausted"), { status: 429 });
      },
      { clock, maxRetries: 2, random: () => 0 },
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RetriesExhausted);
    expect((error as RetriesExhausted).attempts).toBe(3);
    expect((error as Error).message).toMatch(/gave up after 3 attempt\(s\): quota exhausted/);
    expect(calls).toBe(3);

    let once = 0;
    await expect(
      withRetry(
        async () => {
          once++;
          throw Object.assign(new Error("bad schema"), { status: 400 });
        },
        { clock },
      ),
    ).rejects.toThrow("bad schema");
    expect(once).toBe(1);
  });
});
