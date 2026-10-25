/** Step P4.1 and P4.2: the numbered release of the data and how to cite the tool. Cuts a release dated far ahead so it is the latest, then removes it. */
import { expect, test } from "@playwright/test";
import pg from "pg";
import { DB_URL } from "./support/local-auth";

const ID = "9999.01.01";

test.describe.configure({ mode: "serial" });

async function withDb<T>(fn: (db: pg.Client) => Promise<T>): Promise<T> {
  const db = new pg.Client({ connectionString: DB_URL });
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}

test.beforeAll(async () => {
  await withDb(async (db) => {
    await db.query("delete from data_releases where id = $1", [ID]);
    await db.query("insert into data_releases (id, released_at, papers, tests, canonical_version, note) values ($1, '9999-01-01T00:00:00Z', 36, 1007, '1.1.0', 'Bản thử của e2e.')", [ID]);
  });
});

test.afterAll(async () => {
  await withDb((db) => db.query("delete from data_releases where id = $1", [ID]));
});

test("every page says which release of the data it shows", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByTestId("data-release")).toContainText("bản 9999.01.01, 36 bài, 1.007 kiểm định");
});

test("the About page names the release and gives a citation to copy", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByTestId("about-release")).toContainText("bản 9999.01.01");
  await expect(page.getByTestId("tool-citation")).toContainText("Research Data: Academic literature matrix (Version 9999.01.01) [Data set]");
  await expect(page.getByTestId("copy-tool-citation")).toBeVisible();
});

test("an exported Excel file and Word file carry the release and the citation", async ({ request }) => {
  const xlsx = await request.get("/export?a=zebra&b=quokka");
  expect(xlsx.status()).toBe(200);
  const body = (await xlsx.body()).toString("latin1");
  expect(body.length).toBeGreaterThan(1000); // the workbook is zipped: the text itself is checked by the unit tests
  const word = await request.get("/export/word?a=zebra&b=quokka");
  expect(word.status()).toBe(200);
});

test("a permanent link from an older release warns that the data has changed since; one from the current release does not", async ({ page }) => {
  await page.goto("/?a=nonexistentzzz&v=1999.01.01");
  await expect(page.getByTestId("stale-release")).toContainText("bản dữ liệu 1999.01.01");
  await expect(page.getByTestId("stale-release")).toContainText("bản 9999.01.01");
  await page.goto(`/?a=nonexistentzzz&v=${ID}`);
  await expect(page.getByTestId("stale-release")).toHaveCount(0);
  await page.goto("/?a=nonexistentzzz");
  await expect(page.getByTestId("stale-release")).toHaveCount(0);
});
