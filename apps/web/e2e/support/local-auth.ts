/**
 * Helpers for the e2e tests that sign in as the owner through the local Supabase Auth and its test mailbox (Mailpit):
 * the owner account (created with the service role, like the prod one, since signups are off), the emptied mailbox, and the sign-in link.
 */
import { createHmac } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import pg from "pg";

export const OWNER = "tranthanhtung37@gmail.com";
const AUTH = "http://127.0.0.1:54321/auth/v1";
export const MAIL = "http://127.0.0.1:54324/api/v1";
export const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

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

/** Makes sure the owner exists in the local Auth, forgets the last link request (one per minute per address) and empties the mailbox. */
export async function prepareOwner(): Promise<void> {
  const list = (await (await admin("/users?per_page=50")).json()) as { users: { id: string; email: string; app_metadata?: { role?: string } }[] };
  const existing = list.users.find((u) => u.email === OWNER);
  if (!existing) {
    const r = await admin("/users", { method: "POST", body: JSON.stringify({ email: OWNER, email_confirm: true, app_metadata: { role: "owner" } }) });
    expect(r.status).toBe(200);
  } else if (existing.app_metadata?.role !== "owner") {
    await admin(`/users/${existing.id}`, { method: "PUT", body: JSON.stringify({ app_metadata: { role: "owner" } }) });
  }
  const db = new pg.Client({ connectionString: DB_URL });
  await db.connect();
  await db.query("update auth.users set recovery_sent_at = null, confirmation_sent_at = null, email_change_sent_at = null, reauthentication_sent_at = null where email = $1", [OWNER]);
  await db.end();
  await fetch(`${MAIL}/messages`, { method: "DELETE" });
}

export async function mailCount(): Promise<number> {
  return ((await (await fetch(`${MAIL}/messages`)).json()) as { messages_count: number }).messages_count;
}

/** Asks for a sign-in link on /login, waits for the email and returns the link in it. */
export async function requestOwnerLink(page: Page): Promise<string> {
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
  return link!;
}
