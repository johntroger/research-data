/**
 * End-to-end test for the admin quality page (step 1b.5).
 * Seeds one paper with an extraction run of its own model name and five fields (✓ ✓ ⚠ ◇ hidden) into Supabase local,
 * then checks the numbers, the filter by source and the attention list. Needs Supabase local (pnpm db:start).
 * Run: pnpm --filter @research-data/web test:e2e
 */
import { expect, test } from "@playwright/test";
import pg from "pg";
import { adminDbUrl } from "../lib/admin-db";

const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const HASH = "e2e-quality-hash";
const MODEL = "e2e-quality-model";
const db = new pg.Client({ connectionString: DB_URL });
let paperId = "";

test.beforeAll(async () => {
  await db.connect();
  await db.query("delete from papers where file_hash = $1", [HASH]);
  paperId = (await db.query<{ id: string }>("insert into papers (title, file_hash, page_count) values ('E2E quality paper', $1, 4) returning id", [HASH])).rows[0]!.id;
  const run = (
    await db.query<{ id: string }>("insert into extraction_runs (paper_id, model_name, prompt_version, schema_version) values ($1, $2, 'p', 's') returning id", [paperId, MODEL])
  ).rows[0]!.id;
  const field = (key: string, badge: string, checks: unknown[]) =>
    db.query(
      `insert into extracted_fields (paper_id, extraction_run_id, natural_key, field_name, tier, value, badge, check_results)
       values ($1, $2, $3, $4, 'T1', '1', $5, $6)`,
      [paperId, run, key, key.split(":").pop(), badge, JSON.stringify({ checks })],
    );
  await field("e2e:a", "auto_verified", []);
  await field("e2e:b", "auto_verified", []);
  await field("e2e:c", "needs_attention", [{ name: "number_in_pdf", passed: false, detail: "x" }]);
  await field("e2e:d", "ai_interpreted", []);
  await field("e2e:e", "hidden", [{ name: "quote_in_pdf", passed: false, detail: "y" }]);
});

test.afterAll(async () => {
  await db.query("delete from papers where file_hash = $1", [HASH]);
  await db.end();
});

test("shows the numbers of one source: ✓ 2 · ⚠ 1 · ◇ 1 · hidden 1 and the problem rate", async ({ page }) => {
  await page.goto(`/admin/quality?source=${MODEL}`);
  await expect(page.getByRole("heading", { name: "Chất lượng trích xuất" })).toBeVisible();
  // problem rate = (⚠ + hidden) / (✓ + ⚠ + hidden) = 2 / 4
  await expect(page.getByTestId("quality-total")).toHaveText("1 bài, 5 trường: ✓ 2 · ⚠ 1 · ◇ 1 · ẩn 1 · tỷ lệ vấn đề 50%");
  const row = page.getByTestId(`by-source-${MODEL}`);
  await expect(row).toContainText("2");
  await expect(row.locator("td").nth(5)).toHaveText("50%");
  await expect(page.getByTestId("by-design-(paper-level)")).toBeVisible();
});

test("lists the paper that needs attention, with a link to it, and the checks that failed", async ({ page }) => {
  await page.goto(`/admin/quality?source=${MODEL}`);
  const item = page.getByTestId(`attention-${paperId}`);
  await expect(item).toContainText("E2E quality paper");
  await expect(item).toContainText("⚠ 1 · ẩn 1 · ✓ 2");
  await expect(item.getByRole("link")).toHaveAttribute("href", `/papers/${paperId}`);
  await expect(page.getByTestId("by-check")).toContainText("c / number_in_pdf");
  await expect(page.getByTestId("by-check")).toContainText("e / quote_in_pdf");
});

test("filters by the text of the model, ignoring case, and shows nothing for another model", async ({ page }) => {
  await page.goto("/admin/quality");
  await page.getByRole("textbox").fill("E2E-QUALITY");
  await page.getByRole("button", { name: "Lọc" }).click();
  await expect(page).toHaveURL(/source=E2E-QUALITY/);
  await expect(page.getByTestId("quality-total")).toContainText("1 bài, 5 trường");
  await page.goto("/admin/quality?source=no-such-model-zzz");
  await expect(page.getByTestId("quality-total")).toContainText("0 bài, 0 trường");
  await expect(page.getByText("Không có bài nào.")).toBeVisible();
});

test("the admin page is reachable from the header while in development", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Chất lượng (quản trị)" }).click();
  await expect(page).toHaveURL(/\/admin\/quality/);
});

test("admin database access exists only where it is meant to: development, or an explicit URL", () => {
  expect(adminDbUrl({ NODE_ENV: "production" })).toBeNull();
  expect(adminDbUrl({})).toBeNull();
  expect(adminDbUrl({ NODE_ENV: "development" })).toMatch(/127\.0\.0\.1:54322/);
  expect(adminDbUrl({ NODE_ENV: "production", SUPABASE_DB_URL: "postgresql://x" })).toBe("postgresql://x");
  expect(adminDbUrl({ NODE_ENV: "production", SUPABASE_DB_URL: "   " })).toBeNull();
});
