/**
 * The shared rate-limit store for a deployment on serverless functions (step 4.1): Upstash Redis through its REST API, behind the same
 * `RateStore` interface as the in-memory one. The sliding window is one Lua script, so counting and checking are a single atomic step
 * even when many function instances run at once, and, as in memory, only requests that are let through are counted.
 * Fail-open: if Upstash cannot be reached in time, the request is let through (and the error logged) rather than taking the site down;
 * the limits are a protection against abuse, not a gate the site depends on.
 */
import type { Consumed, RateStore } from "./rate-limit";

/** KEYS[1] the visitor's set; ARGV: now (ms), window (ms), limit, a unique member. Returns {1, 0} when counted, {0, retryAfterMs} when full. */
export const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
if redis.call('ZCARD', key) >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  return {0, math.max(1, tonumber(oldest[2]) + window - now)}
end
redis.call('ZADD', key, now, ARGV[4])
redis.call('PEXPIRE', key, window)
return {1, 0}
`;

export interface UpstashOptions {
  url: string;
  token: string;
  fetchImpl?: typeof fetch;
  /** Give up after this long and let the request through (default 400 ms). */
  timeoutMs?: number;
  log?: (message: string) => void;
}

/** The REST address and token from the environment, under the names Upstash itself or the Vercel integration use; null when absent. */
export function upstashFromEnv(env: Record<string, string | undefined>): { url: string; token: string } | null {
  const url = (env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL)?.trim();
  const token = (env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN)?.trim();
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

export function upstashStore(options: UpstashOptions): RateStore {
  const doFetch = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 400;
  const log = options.log ?? ((m: string) => console.error(m));
  return {
    async consume(key, limit, windowMs, now): Promise<Consumed> {
      const member = `${now}-${Math.random().toString(36).slice(2, 10)}`;
      try {
        const response = await doFetch(options.url, {
          method: "POST",
          headers: { Authorization: `Bearer ${options.token}`, "Content-Type": "application/json" },
          body: JSON.stringify(["EVAL", SLIDING_WINDOW_LUA, "1", key, String(now), String(windowMs), String(limit), member]),
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!response.ok) throw new Error(`Upstash answered ${response.status}`);
        const body = (await response.json()) as { result?: [number, number]; error?: string };
        if (body.error || !Array.isArray(body.result)) throw new Error(body.error ?? "Upstash gave no result");
        const [allowed, retryAfterMs] = body.result;
        return { allowed: allowed === 1, retryAfterMs: allowed === 1 ? 0 : Math.max(1, Number(retryAfterMs)) };
      } catch (error) {
        log(`rate limit store unavailable, letting the request through: ${(error as Error).message}`);
        return { allowed: true, retryAfterMs: 0 };
      }
    },
  };
}
