/**
 * End-to-end test for the library filters and the paper actions (step 3b.1). Seeds one paper from the 1950s with a lab
 * experiment, then filters by search, decade, design and "has matrix". Needs Supabase local (pnpm db:start).
 * Run: pnpm --filter @research-data/web test:e2e
 */
import { expect, test } from "@playwright/test";
import pg from "pg";

const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const HASH = "e2e-library-filter-hash";
const db = new pg.Client({ connectionString: DB_URL });
let paperId = "";

test.beforeAll(async () => {
  await db.connect();
  await db.query("delete from papers where file_hash = $1", [HASH]);
  paperId = (
    await db.query<{ id: string }>(
      `insert into papers (title, file_hash, page_count, year, journal, doi, authors, volume, issue, pages)
       values ('Zebra filtering study', $1, 8, 1955, 'Journal of Tests', '10.9999/e2e-lib', '[{"given":"Ada","family":"Quine"}]', '3', '2', '10-18') returning id`,
      [HASH],
    )
  ).rows[0]!.id;
  await db.query("insert into studies (paper_id, natural_key, study_label, research_design, badge) values ($1, 'study_1', 'Study 1', 'lab_experiment', 'auto_verified')", [paperId]);
});

test.afterAll(async () => {
  await db.query("delete from papers where file_hash = $1", [HASH]);
  await db.end();
});

test("searches by title and author without accents", async ({ page }) => {
  await page.goto("/library?q=zebra");
  await expect(page.getByTestId(`library-${paperId}`)).toBeVisible();
  await expect(page.getByTestId("library-total")).toContainText(/^1 \/ \d+ bài$/);
  await page.goto("/library?q=quine");
  await expect(page.getByTestId(`library-${paperId}`)).toBeVisible();
  await page.goto("/library?q=zebra+nonexistentword");
  await expect(page.getByText("Không có bài nào khớp")).toBeVisible();
});

test("filters by decade and design, with counts, through the form", async ({ page }) => {
  await page.goto("/library");
  await page.getByText("Năm", { exact: true }).click();
  await page.getByLabel(/1950s/).check();
  await page.getByRole("button", { name: "Lọc" }).click();
  await expect(page).toHaveURL(/year=1950s/);
  await expect(page.getByTestId(`library-${paperId}`)).toBeVisible();
  await expect(page.locator(".paper-list li")).toHaveCount(1);

  await page.goto("/library?design=lab_experiment&year=1950s");
  await expect(page.locator(".paper-list li")).toHaveCount(1);
  await page.goto("/library?design=survey&year=1950s");
  await expect(page.getByText("Không có bài nào khớp")).toBeVisible();
  await page.getByRole("link", { name: "Xóa lọc" }).click();
  await expect(page).toHaveURL(/\/library$/);
});

test("the matrix filter hides a paper without a correlation matrix", async ({ page }) => {
  await page.goto("/library?matrix=1&q=zebra");
  await expect(page.getByText("Không có bài nào khớp")).toBeVisible();
});

test("copies the APA reference and links the DOI", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/library?q=zebra");
  const card = page.getByTestId(`library-${paperId}`);
  await expect(card.getByRole("link", { name: "DOI" })).toHaveAttribute("href", "https://doi.org/10.9999/e2e-lib");
  await card.getByTestId("copy-apa").click();
  await expect(card.getByTestId("copy-apa")).toHaveText(/Đã chép/);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("Quine, A. (1955). Zebra filtering study. Journal of Tests, 3(2), 10-18. https://doi.org/10.9999/e2e-lib");
});
