/**
 * Security headers and search-engine settings (step 4.1): the site is public but not announced, and cannot be put in a frame.
 * Run: pnpm --filter @research-data/web test:e2e
 */
import { expect, test } from "@playwright/test";

test("every page carries the security headers and says noindex until indexing is opened", async ({ request }) => {
  const r = await request.get("/about");
  const h = r.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["content-security-policy"]).toBe("frame-ancestors 'none'");
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["x-robots-tag"]).toBe("noindex, nofollow");
});

test("robots.txt closes the site to crawlers and the pages say noindex", async ({ request, page }) => {
  const txt = await (await request.get("/robots.txt")).text();
  expect(txt).toMatch(/User-Agent: \*/i);
  expect(txt).toMatch(/Disallow: \//);
  await page.goto("/about");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
