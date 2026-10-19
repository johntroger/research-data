/**
 * Rate limiting and retries for Gemini calls (step 1.7, Mục 4.2):
 *   - RateLimiter: requests per minute and tokens per minute, over a sliding 60 s window;
 *   - withRetry: exponential backoff with jitter, honours the server's retry delay, and after
 *     the last attempt fails with the reason (the item is then marked FAILED, not retried forever).
 * Clock, sleep and randomness are injectable so tests run without waiting.
 */

export interface Clock {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
}

export const realClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
};

const WINDOW_MS = 60_000;

export class RateLimiter {
  private readonly events: { at: number; tokens: number }[] = [];

  constructor(
    private readonly limits: { rpm: number; tpm: number },
    private readonly clock: Clock = realClock,
  ) {}

  /**
   * Waits until one more request of `tokens` fits in the last minute, then books it.
   * A single request larger than the whole minute budget is let through when the window is empty
   * (otherwise it would wait forever).
   */
  async acquire(tokens: number): Promise<{ waitedMs: number }> {
    let waited = 0;
    for (;;) {
      const now = this.clock.now();
      while (this.events.length > 0 && now - this.events[0]!.at >= WINDOW_MS) this.events.shift();
      const usedTokens = this.events.reduce((n, e) => n + e.tokens, 0);
      const fitsRequests = this.events.length < this.limits.rpm;
      const fitsTokens = usedTokens + tokens <= this.limits.tpm || this.events.length === 0;
      if (fitsRequests && fitsTokens) {
        this.events.push({ at: now, tokens });
        return { waitedMs: waited };
      }
      // Wait until the oldest booking leaves the window.
      const wait = Math.max(1, WINDOW_MS - (now - this.events[0]!.at));
      await this.clock.sleep(wait);
      waited += wait;
    }
  }

  /** Corrects a booking made with an estimate once the real token count is known. */
  adjust(estimated: number, actual: number): void {
    const last = [...this.events].reverse().find((e) => e.tokens === estimated);
    if (last) last.tokens = actual;
  }
}

/** Thrown after the last attempt; `cause` is the last error. */
export class RetriesExhausted extends Error {
  constructor(
    readonly attempts: number,
    override readonly cause: unknown,
  ) {
    super(`gave up after ${attempts} attempt(s): ${(cause as Error)?.message ?? String(cause)}`);
    this.name = "RetriesExhausted";
  }
}

/** Errors worth retrying: rate limit, overload, server errors and dropped connections. */
export function isRetryable(error: unknown): boolean {
  const status = statusOf(error);
  if (status !== null) return status === 408 || status === 429 || status >= 500;
  const message = (error as Error)?.message ?? "";
  return /fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket|network|other side closed|overloaded|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(message);
}

function statusOf(error: unknown): number | null {
  const e = error as { status?: unknown; code?: unknown };
  for (const value of [e?.status, e?.code]) if (typeof value === "number" && value >= 100 && value < 600) return value;
  const fromMessage = /"code"\s*:\s*(\d{3})|\bstatus[: ]+(\d{3})\b|\b(429|500|502|503|504)\b/.exec((error as Error)?.message ?? "");
  const n = Number(fromMessage?.[1] ?? fromMessage?.[2] ?? fromMessage?.[3]);
  return Number.isFinite(n) && n >= 100 ? n : null;
}

/** The delay the server asked for, in ms: a Retry-After value or "retryDelay":"34s" in the error body. */
export function retryAfterMs(error: unknown): number | null {
  const e = error as { retryAfter?: unknown; message?: string };
  if (typeof e?.retryAfter === "number") return e.retryAfter * 1000;
  const match = /retryDelay"?\s*[:=]\s*"?(\d+(?:\.\d+)?)\s*s|retry (?:in|after) (\d+(?:\.\d+)?)\s*s/i.exec(e?.message ?? "");
  const seconds = Number(match?.[1] ?? match?.[2]);
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : null;
}

export interface RetryOptions {
  maxRetries?: number;
  baseMs?: number;
  capMs?: number;
  clock?: Clock;
  /** Returns [0, 1); injectable for tests. */
  random?: () => number;
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown }) => void;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries = 4, baseMs = 2_000, capMs = 60_000, clock = realClock, random = Math.random } = options;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryable(error)) throw error;
      if (attempt >= maxRetries) throw new RetriesExhausted(attempt + 1, error);
      // Full-jitter backoff (half fixed, half random) keeps parallel workers from retrying together;
      // a delay the server asked for is a floor.
      const backoff = Math.min(capMs, baseMs * 2 ** attempt);
      const delay = Math.max(retryAfterMs(error) ?? 0, Math.round(backoff / 2 + random() * (backoff / 2)));
      options.onRetry?.({ attempt: attempt + 1, delayMs: delay, error });
      await clock.sleep(delay);
    }
  }
}

/** Rate limits from the environment: GEMINI_RPM (default 30) and GEMINI_TPM (default 500000). Check the real limits of your tier in Google AI Studio. */
export function rateLimitsFromEnv(env: NodeJS.ProcessEnv = process.env): { rpm: number; tpm: number } {
  const read = (name: string, fallback: number) => {
    const raw = env[name]?.trim();
    if (!raw) return fallback;
    const value = Number(raw);
    if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive whole number, got "${raw}"`);
    return value;
  };
  return { rpm: read("GEMINI_RPM", 30), tpm: read("GEMINI_TPM", 500_000) };
}
