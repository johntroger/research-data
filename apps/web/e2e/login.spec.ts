/**
 * End-to-end test of the owner sign-in (step A.2): a real emailed link, through the local Supabase Auth and its test mailbox (Mailpit).
 * Needs Supabase local (pnpm db:start) restarted after supabase/config.toml changed, and ADMIN_EMAILS in apps/web/.env.local.
 * The owner account of the local Auth is created here with the service role, like the prod one (signups are off).
 * Run: pnpm --filter @research-data/web test:e2e
 */
import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import pg from "pg";

const OWNER = "tranthanhtung37@gmail.com";
const AUTH = "http://127.0.0.1:54321/auth/v1";
const MAIL = "http://127.0.0.1:54324/api/v1";
const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/** The service-role JWT of a local Supabase (its well-known development secret; it opens nothing outside this machine). */
function serviceKey(): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ iss: "supabase-demo", role: "service_role", exp: 1983812996 });
  const sig = createHmac("sha256", "super-secret-jwt-token-with-at-least-32-characters-long").update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

async function admin(path: string, init: RequestInit = {}) {
  const key = serviceKey();
  return fetch(`${AUTH}/admin${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
}

test.beforeAll(async () => {
  const list = (await (await admin("/users?per_page=50")).json()) as { users: { id: string; email: string; app_metadata?: { role?: string } }[] };
  const existing = list.users.find((u) => u.email === OWNER);
  if (!existing) {
    const r = await admin("/users", { method: "POST", body: JSON.stringify({ email: OWNER, email_confirm: true, app_metadata: { role: "owner" } }) });
    expect(r.status).toBe(200);
  } else if (existing.app_metadata?.role !== "owner") {
    await admin(`/users/${existing.id}`, { method: "PUT", body: JSON.stringify({ app_metadata: { role: "owner" } }) });
  }
  // The same address may be asked for a link only once a minute: forget the last request, and empty the test mailbox.
  const db = new pg.Client({ connectionString: DB_URL });
  await db.connect();
  await db.query("update auth.users set recovery_sent_at = null, confirmation_sent_at = null, email_change_sent_at = null, reauthentication_sent_at = null where email = $1", [OWNER]);
  await db.end();
  await fetch(`${MAIL}/messages`, { method: "DELETE" });
});

async function mailCount(): Promise<number> {
  return ((await (await fetch(`${MAIL}/messages`)).json()) as { messages_count: number }).messages_count;
}

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
  await page.goto("/login");
  await page.getByLabel("Email").fill(OWNER);
  await page.getByRole("button", { name: "Gửi link đăng nhập" }).click();
  await expect(page.getByTestId("login-sent")).toBeVisible();

  let id = "";
  await expect
    .poll(async () => {
      const m = (await (await fetch(`${MAIL}/messages`)).json()) as { messages: { ID: string; To: { Address: string }[] }[] };
      id = m.messages.find((x) => x.To.some((t) => t.Address === OWNER))?.ID ?? "";
      return id;
    }, { timeout: 15_000 })
    .not.toBe("");
  const mail = (await (await fetch(`${MAIL}/message/${id}`)).json()) as { Text: string; HTML: string };
  const link = /https?:\/\/[^\s"'<>)]+\/auth\/v1\/verify[^\s"'<>)]+/.exec(`${mail.Text}\n${mail.HTML}`)?.[0]?.replaceAll("&amp;", "&");
  expect(link, "the email carries a sign-in link").toBeTruthy();

  await page.goto(link!);
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
