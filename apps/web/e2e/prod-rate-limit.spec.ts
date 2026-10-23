/**
 * Rate limiting by IP, on the site as deployed (step A.5, run with `pnpm test:e2e:prod`). The production server trusts the forwarded-for header
 * here (TRUST_PROXY=1 in playwright.prod.config.ts), so each test plays a different visitor by sending its own address, and the buckets do not
 * touch each other. Limits are those of lib/rate-limit.ts.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";

const as = (ip: string) => ({ "x-forwarded-for": ip });

/** Sends `n` GETs one after the other and returns the status of each. */
async function hit(request: APIRequestContext, path: string, ip: string, n: number): Promise<number[]> {
  const statuses: number[] = [];
  for (let i = 0; i < n; i++) statuses.push((await request.get(path, { headers: as(ip), maxRedirects: 0 })).status());
  return statuses;
}

test("pages: the 121st request in a minute from one visitor is refused with a wait time; another visitor is not affected", async ({ request }) => {
  const first = await hit(request, "/about", "203.0.113.10", 120);
  expect(first.every((s) => s === 200)).toBe(true);
  const refused = await request.get("/about", { headers: as("203.0.113.10") });
  expect(refused.status()).toBe(429);
  const wait = Number(refused.headers()["retry-after"]);
  expect(wait).toBeGreaterThanOrEqual(1);
  expect(wait).toBeLessThanOrEqual(60);
  expect(await refused.text()).toContain("quá nhiều yêu cầu");
  expect((await request.get("/about", { headers: as("203.0.113.11") })).status()).toBe(200);
});

test("PDF links: 20 a minute, then 429 (a request for a paper that does not exist counts too: it is a request)", async ({ request }) => {
  const statuses = await hit(request, "/api/papers/00000000-0000-0000-0000-000000000000/pdf", "203.0.113.20", 21);
  expect(statuses.slice(0, 20).every((s) => s === 404)).toBe(true);
  expect(statuses[20]).toBe(429);
});

test("exports: 10 an hour, then 429", async ({ request }) => {
  const statuses = await hit(request, "/export?a=zzzz&b=qqqq", "203.0.113.30", 11);
  expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
  expect(statuses[10]).toBe(429);
});

test("the sign-in link endpoint: 20 tries in ten minutes, then 429", async ({ request }) => {
  const statuses = await hit(request, "/auth/callback?code=guess", "203.0.113.40", 21);
  expect(statuses.slice(0, 20).every((s) => s === 303)).toBe(true);
  expect(statuses[20]).toBe(429);
});

test("the sign-in form: 5 sends in ten minutes, then 429", async ({ request }) => {
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    statuses.push((await request.post("/login", { headers: as("203.0.113.60"), form: { email: "someone@example.org" }, maxRedirects: 0 })).status());
  }
  expect(statuses.slice(0, 5).every((s) => s !== 429)).toBe(true);
  expect(statuses[5]).toBe(429);
});

test("only the first address of the forwarded-for list names the visitor, so adding addresses gives no fresh bucket", async ({ request }) => {
  const path = "/api/papers/00000000-0000-0000-0000-000000000000/pdf";
  expect((await hit(request, path, "203.0.113.50, 198.51.100.1", 20)).every((s) => s === 404)).toBe(true);
  expect((await request.get(path, { headers: as("203.0.113.50, 192.0.2.99") })).status()).toBe(429);
});
