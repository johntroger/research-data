/**
 * End-to-end test for the summary matrix (step 3b.2): one row per paper with theories, design and sample and the
 * count of verified hypothesis tests; the detail lists the tests by study; the library filters apply. Seeds one paper.
 * Needs Supabase local (pnpm db:start). Run: pnpm --filter @research-data/web test:e2e
 */
import { expect, test } from "@playwright/test";
import pg from "pg";

const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const HASH = "e2e-matrix-hash";
const db = new pg.Client({ connectionString: DB_URL });
let paperId = "";

test.beforeAll(async () => {
  await db.connect();
  await db.query("delete from papers where file_hash = $1", [HASH]);
  paperId = (
    await db.query<{ id: string }>(
      "insert into papers (title, file_hash, page_count, year, journal, authors) values ('Quokka matrix study', $1, 8, 1961, 'Journal of Tests', '[{\"given\":\"Bo\",\"family\":\"Lindqvist\"}]') returning id",
      [HASH],
    )
  ).rows[0]!.id;
  const studyId = (
    await db.query<{ id: string }>("insert into studies (paper_id, natural_key, study_label, position, research_design, badge) values ($1, 'study_1', 'Study 1', 1, 'survey', 'auto_verified') returning id", [paperId])
  ).rows[0]!.id;
  await db.query("insert into samples (study_id, paper_id, natural_key, n, country_iso, sample_type, badge) values ($1, $2, 'study_1:sample', 412, '{VN}', 'students', 'auto_verified')", [studyId, paperId]);
  await db.query("insert into paper_theories (paper_id, natural_key, theory_name_original, application_role, badge) values ($1, 'theory:1', 'social exchange theory', 'tested', 'ai_interpreted')", [paperId]);
  const path = (key: string, code: string, status: string, badge: string, estimate: number) =>
    db.query(
      `insert into path_results (study_id, paper_id, natural_key, hypothesis_code, iv_label_original, dv_label_original, effect_type, estimate_type, estimate, p_reported_as, status, observed_sign, significant, badge, ci_low, ci_high)
       values ($1, $2, $3, $4, 'Trust', 'Loyalty', 'direct', 'std_beta', $5, '< .001', $6, 'positive', true, $7, 0.2, 0.5)`,
      [studyId, paperId, key, code, estimate, status, badge],
    );
  await path("study_1:path:h1", "H1", "supported", "auto_verified", 0.35);
  await path("study_1:path:h2", "H2", "not_supported", "auto_verified", 0.05);
  await path("study_1:path:h3", "H3", "supported", "needs_attention", 0.3);
});

test.afterAll(async () => {
  await db.query("delete from papers where file_hash = $1", [HASH]);
  await db.end();
});

test("a row shows the theory, the design and sample, and counts only verified tests", async ({ page }) => {
  await page.goto("/matrix?q=quokka");
  const row = page.getByTestId(`matrix-${paperId}`);
  await expect(row).toContainText("Lindqvist (1961)");
  await expect(row).toContainText("Social exchange theory");
  await expect(row).toContainText("được kiểm định");
  await expect(row).toContainText("Khảo sát");
  await expect(row).toContainText("n = 412");
  await expect(row.getByTestId("matrix-outcome")).toContainText("✓ 1 ủng hộ · ✗ 1 không ủng hộ");
  await expect(row.getByTestId("matrix-outcome")).toContainText("⚠ 1 chưa kiểm chứng, không đếm");
});

test("the detail lists the tests by study with APA numbers and a link to the evidence", async ({ page }) => {
  await page.goto("/matrix?q=quokka");
  const row = page.getByTestId(`matrix-${paperId}`);
  await row.getByText(/Xem kiểm định theo Study \(3\)/).click();
  await expect(row.getByText("Study 1", { exact: true })).toBeVisible();
  await expect(row).toContainText("β = .35, 95% CI [.20, .50], p < .001");
  const link = row.getByRole("link", { name: "mở" }).first();
  await expect(link).toHaveAttribute("href", new RegExp(`/papers/${paperId}\\?focus=study_1%3Apath%3Ah1`));
});

test("uses the library filters", async ({ page }) => {
  await page.goto("/matrix?q=quokka&design=online_experiment");
  await expect(page.getByText("Không có bài nào khớp")).toBeVisible();
  await page.goto("/matrix?q=quokka&country=VN&year=1960s");
  await expect(page.getByTestId("matrix-total")).toContainText(/^1 \/ \d+ bài/);
});

test("is reachable from the header", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Ma trận" }).click();
  await expect(page).toHaveURL(/\/matrix/);
});

test("the Word file of the matrix follows the page's filters", async ({ page, request }) => {
  await page.goto("/matrix?q=quokka");
  const href = (await page.getByTestId("matrix-word").getAttribute("href"))!;
  expect(href).toBe("/matrix/word?q=quokka");
  const response = await request.get(href);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("wordprocessingml");
  expect(response.headers()["content-disposition"]).toMatch(/ma-tran-\d{4}-\d{2}-\d{2}\.docx/);
  expect((await response.body()).subarray(0, 2).toString()).toBe("PK");
});
