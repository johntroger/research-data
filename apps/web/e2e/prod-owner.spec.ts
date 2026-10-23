/**
 * The site as deployed (step A.4, run with `pnpm test:e2e:prod`): no developer-machine shortcut, so only a signed-in owner is the owner.
 * A visitor cannot see or download a PDF that has no open licence and has no admin page; the signed-in owner can see and download it
 * (a 5-minute link to the private R2 copy), and reads the admin page through their own session. Signing out takes it all away again.
 * Uses a real paper of the local database whose PDF is in R2; the test is skipped when there is none.
 */
import { expect, test } from "@playwright/test";
import pg from "pg";
import { DB_URL, OWNER, prepareOwner, requestOwnerLink } from "./support/local-auth";

let closed: { id: string; hash: string } | null = null;
let open: { id: string } | null = null;

test.beforeAll(async () => {
  await prepareOwner();
  const db = new pg.Client({ connectionString: DB_URL });
  await db.connect();
  closed = (await db.query<{ id: string; hash: string }>("select id, file_hash as hash from papers where oa_status = 'closed' and file_hash ~ '^[0-9a-f]{64}$' and pdf_path is not null limit 1")).rows[0] ?? null;
  open = (await db.query<{ id: string }>("select id from papers where license_source = 'oa' and oa_status in ('gold', 'green', 'hybrid') and file_hash ~ '^[0-9a-f]{64}$' limit 1")).rows[0] ?? null;
  await db.end();
});

test("a visitor: no PDF without an open licence, no admin page, a link to sign in", async ({ page, request }) => {
  test.skip(!closed, "no closed-access paper with a PDF in the local database");
  expect((await request.get(`/api/papers/${closed!.id}/pdf`, { maxRedirects: 0 })).status()).toBe(403);
  expect((await request.get(`/api/papers/${closed!.id}/pdf?download=1`, { maxRedirects: 0 })).status()).toBe(403);
  expect((await request.get("/admin/quality")).status()).toBe(404);
  await page.goto(`/papers/${closed!.id}`);
  await expect(page.getByTestId("pdf-restricted")).toBeVisible();
  await expect(page.getByTestId("login-link")).toBeVisible();
  await expect(page.getByTestId("session-box")).toHaveCount(0);
});

test("a visitor may view and download a paper with an open licence", async ({ request }) => {
  test.skip(!open, "no open-licence paper with a PDF in the local database");
  const view = await request.get(`/api/papers/${open!.id}/pdf`, { maxRedirects: 0 });
  expect(view.status()).toBe(302);
  expect(view.headers().location).toContain(".r2.cloudflarestorage.com/pdf/");
  expect((await request.get(`/api/papers/${open!.id}/pdf?download=1`, { maxRedirects: 0 })).status()).toBe(302);
});

test("the signed-in owner views and downloads a closed PDF and reads the admin page; signing out takes it away", async ({ page }) => {
  test.skip(!closed, "no closed-access paper with a PDF in the local database");
  await page.goto(await requestOwnerLink(page));
  await expect(page.getByTestId("session-email")).toHaveText(OWNER);

  // The PDF: a 5-minute signed link to the private R2 copy, for viewing (inline) and for saving (attachment, readable file name).
  const view = await page.request.get(`/api/papers/${closed!.id}/pdf`, { maxRedirects: 0 });
  expect(view.status()).toBe(302);
  const viewUrl = new URL(view.headers().location!);
  expect(viewUrl.hostname).toMatch(/\.r2\.cloudflarestorage\.com$/);
  expect(viewUrl.pathname).toBe(`/pdf/${closed!.hash}.pdf`);
  expect(viewUrl.searchParams.get("X-Amz-Expires")).toBe("300");
  expect(viewUrl.searchParams.get("response-content-disposition")).toBe("inline");
  const save = await page.request.get(`/api/papers/${closed!.id}/pdf?download=1`, { maxRedirects: 0 });
  expect(save.status()).toBe(302);
  expect(new URL(save.headers().location!).searchParams.get("response-content-disposition")).toMatch(/^attachment; filename="[A-Za-z0-9._-]+\.pdf"$/);

  // The paper page offers the viewer and the download button instead of the "not published" notice.
  await page.goto(`/papers/${closed!.id}`);
  await expect(page.getByTestId("pdf-restricted")).toHaveCount(0);
  await expect(page.getByTestId("pdf-download")).toBeVisible();

  // The admin page, through the owner's own session.
  await page.goto("/admin/quality");
  await expect(page.getByTestId("quality-total")).toContainText(/ẩn [1-9]\d*/);

  await page.getByTestId("logout").click();
  await expect(page.getByTestId("login-link")).toBeVisible();
  expect((await page.request.get(`/api/papers/${closed!.id}/pdf`, { maxRedirects: 0 })).status()).toBe(403);
  expect((await page.request.get("/admin/quality")).status()).toBe(404);
});
