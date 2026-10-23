/**
 * End-to-end test of the owner sign-in (step A.2): a real emailed link, through the local Supabase Auth and its test mailbox (Mailpit).
 * Needs Supabase local (pnpm db:start) restarted after supabase/config.toml changed, and ADMIN_EMAILS in apps/web/.env.local.
 * The owner account of the local Auth is created here with the service role, like the prod one (signups are off).
 * Run: pnpm --filter @research-data/web test:e2e
 */
import { expect, test } from "@playwright/test";
import { mailCount, OWNER, prepareOwner, requestOwnerLink } from "./support/local-auth";

test.beforeAll(prepareOwner);

test("a visitor sees the sign-in page; a stranger gets the same answer as the owner and no mail is sent", async ({ page }) => {
  // (The developer machine counts as the owner, so the header link "Đăng nhập" that visitors see is covered by the unit tests, not here.)
  await page.goto("/login");
  await expect(page.getByTestId("login-form")).toBeVisible();
  await page.getByLabel("Email").fill("stranger@example.org");
  await page.getByRole("button", { name: "Gửi link đăng nhập" }).click();
  await expect(page.getByTestId("login-sent")).toContainText("Nếu đây là email của chủ dự án");
  expect(await mailCount()).toBe(0);
});

test("the owner gets a link by email, opens it, is signed in, and signs out", async ({ page }) => {
  const link = await requestOwnerLink(page);

  await page.goto(link);
  await expect(page.getByTestId("session-email")).toHaveText(OWNER);

  // Still signed in on another page, and the sign-in page says so.
  await page.goto("/login");
  await expect(page.getByTestId("login-already")).toContainText(OWNER);

  // With a session, the admin page reads through the owner's own token (one call to quality_report), not a direct database connection:
  // the hidden fields are counted, which a visitor's token can never see.
  await page.goto("/admin/quality");
  await expect(page.getByTestId("quality-total")).toContainText(/\d+ bài, \d+ trường/);
  await expect(page.getByTestId("quality-total")).toContainText(/ẩn [1-9]\d*/);

  await page.getByTestId("logout").click();
  await expect(page.getByTestId("session-email")).toHaveCount(0);
  await page.goto("/login");
  await expect(page.getByTestId("login-form")).toBeVisible();
});

test("a link that is not valid is refused with an explanation", async ({ page }) => {
  await page.goto("/auth/callback?code=not-a-real-code");
  await expect(page).toHaveURL(/\/login\?error=denied/);
  await expect(page.getByTestId("login-error")).toContainText("Đăng nhập không thành công");
});

test("the callback never sends anyone to another site", async ({ request }) => {
  const r = await request.get("/auth/callback?code=x&next=https://evil.example", { maxRedirects: 0 });
  expect(r.status()).toBe(303);
  expect(r.headers().location).not.toContain("evil.example");
});
