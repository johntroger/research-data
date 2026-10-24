/**
 * The usage counters on the site as deployed (step 4.6, run with `pnpm test:e2e:prod`): a visitor's use adds one to a daily counter of a kind,
 * the browser may report only its own kinds, the owner's own use is not counted, and only the owner sees the counts.
 */
import { expect, test } from "@playwright/test";
import pg from "pg";
import { DB_URL, OWNER, prepareOwner, requestOwnerLink } from "./support/local-auth";

const db = new pg.Client({ connectionString: DB_URL });
test.beforeAll(async () => {
  await prepareOwner();
  await db.connect();
});
test.afterAll(async () => {
  await db.end();
});

const total = async (event: string) => Number((await db.query<{ n: number }>("select coalesce(sum(n), 0)::int as n from usage_daily where event = $1", [event])).rows[0]!.n);
/** The count is added after the response is sent, so wait for it. */
async function risesBy(event: string, by: number, act: () => Promise<unknown>) {
  const before = await total(event);
  await act();
  await expect.poll(() => total(event), { timeout: 10_000 }).toBe(before + by);
}

test("a visitor's search, export, PDF link and browser events are counted once each", async ({ request }) => {
  await risesBy("relation_search", 1, () => request.get("/?a=zzzzusage&b=qqqqusage"));
  await risesBy("export_excel", 1, () => request.get("/export?a=zzzzusage&b=qqqqusage"));
  await risesBy("export_word", 1, () => request.get("/export/word?a=zzzzusage&b=qqqqusage"));
  await risesBy("evidence_open", 1, async () => expect((await request.post("/api/event", { data: { event: "evidence_open" } })).status()).toBe(204));
  await risesBy("copy_apa", 1, async () => expect((await request.post("/api/event", { data: { event: "copy_apa" } })).status()).toBe(204));
});

test("the home page without a question, and an opened page, count nothing", async ({ request }) => {
  const before = await total("relation_search");
  await request.get("/");
  await request.get("/library");
  await new Promise((r) => setTimeout(r, 1500));
  expect(await total("relation_search")).toBe(before);
});

test("the browser cannot report kinds that belong to the server, nor invent kinds", async ({ request }) => {
  const before = await total("export_excel");
  expect((await request.post("/api/event", { data: { event: "export_excel" } })).status()).toBe(400);
  expect((await request.post("/api/event", { data: { event: "made-up" } })).status()).toBe(400);
  expect((await request.post("/api/event", { data: "not json", headers: { "content-type": "application/json" } })).status()).toBe(400);
  await new Promise((r) => setTimeout(r, 1000));
  expect(await total("export_excel")).toBe(before);
  expect(Number((await db.query("select count(*) from usage_daily where event = 'made-up'")).rows[0].count)).toBe(0);
});

test("a visitor cannot see the counts; the signed-in owner can, and the owner's own use is not counted", async ({ page, request }) => {
  expect((await request.get("/admin/usage")).status()).toBe(404);
  await page.goto(await requestOwnerLink(page));
  await expect(page.getByTestId("session-email")).toHaveText(OWNER);

  const search = await total("relation_search");
  const evidence = await total("evidence_open");
  await page.request.get("/?a=zzzzusage&b=qqqqusage");
  await page.request.post("/api/event", { data: { event: "evidence_open" } });
  await new Promise((r) => setTimeout(r, 1500));
  expect(await total("relation_search")).toBe(search);
  expect(await total("evidence_open")).toBe(evidence);

  await page.goto("/admin/usage");
  await expect(page.getByTestId("usage-table")).toBeVisible();
  await expect(page.getByTestId("usage-total")).toContainText("Tổng");
  await expect(page.getByRole("columnheader", { name: "Tìm quan hệ" })).toBeVisible();
});
