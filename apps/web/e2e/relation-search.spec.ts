/**
 * End-to-end test for Relationship Search, the home page (step 3a.1).
 * Seeds two papers with made-up variable names (Zebra Anxiety, Quokka Loyalty, Mongoose Calm) so that real data cannot
 * interfere, then checks the search, the summary, the role and direction, the links and the shareable URL.
 * Needs Supabase local (pnpm db:start). Run: pnpm --filter @research-data/web test:e2e
 */
import { expect, test } from "@playwright/test";
import ExcelJS from "exceljs";
import pg from "pg";

const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const HASHES = ["e2e-rel-1", "e2e-rel-2"];
const db = new pg.Client({ connectionString: DB_URL });
let p1 = "";
let p2 = "";
let firstTest = "";

test.beforeAll(async () => {
  await db.connect();
  await db.query("delete from papers where file_hash = any($1)", [HASHES]);
  const paper = async (hash: string, title: string, year: number) =>
    (
      await db.query<{ id: string }>(
        "insert into papers (title, file_hash, year, journal, authors, page_count) values ($1, $2, $3, 'E2E Journal', $4, 4) returning id",
        [title, hash, year, JSON.stringify([{ family: "Zhao" }, { family: "Okafor" }])],
      )
    ).rows[0]!.id;
  p1 = await paper(HASHES[0]!, "E2E relation paper one", 2023);
  p2 = await paper(HASHES[1]!, "E2E relation paper two", 2021);
  const study = async (paperId: string, key: string, label: string, design: string) =>
    (await db.query<{ id: string }>("insert into studies (paper_id, natural_key, study_label, research_design) values ($1, $2, $3, $4) returning id", [paperId, key, label, design])).rows[0]!.id;
  const s1 = await study(p1, "study_1", "Study 1", "survey");
  const s2 = await study(p1, "study_2", "Study 2", "survey");
  const s3 = await study(p2, "study_1", "Study 1", "online_experiment");

  const path = async (paperId: string, studyId: string, key: string, o: Record<string, unknown>) =>
    (
      await db.query<{ id: string }>(
        `insert into path_results (paper_id, study_id, natural_key, hypothesis_code, iv_label_original, dv_label_original, effect_type, estimate_type,
                                   estimate, p_reported_as, status, observed_sign, significant, mediator_labels, badge)
         values ($1, $2, $3, $4, $5, $6, $7, 'std_beta', $8, $9, $10, $11, $12, $13, $14) returning id`,
        [paperId, studyId, key, o.h, o.iv ?? "Zebra Anxiety", o.dv ?? "Quokka Loyalty", o.effect ?? "direct", o.est, o.p, o.status, o.sign, o.sig, o.mediators ?? [], o.badge ?? "auto_verified"],
      )
    ).rows[0]!.id;
  firstTest = await path(p1, s1, "study_1:h1:zebra->quokka:direct", { h: "H1", est: -0.31, p: "< 0.001", status: "supported", sign: "negative", sig: true });
  await path(p1, s2, "study_2:h1:zebra->quokka:direct", { h: "H1", est: -0.05, p: "= 0.42", status: "not_supported", sign: "negative", sig: false });
  await path(p1, s1, "study_1:h2:zebra->quokka:indirect", { h: "H2", est: -0.1, p: "< 0.05", status: "supported", sign: "negative", sig: true, effect: "indirect", mediators: ["Mongoose Calm"] });
  await path(p2, s3, "study_1:h3:mongoose->quokka:direct", { h: "H3", iv: "Mongoose Calm", dv: "Quokka Loyalty", est: 0.2, p: "< 0.05", status: "supported", sign: "positive", sig: true, badge: "needs_attention" });
  await path(p2, s3, "study_1:h1:zebra->quokka:direct", { h: "H1", est: -0.2, p: "< 0.01", status: "supported", sign: "negative", sig: true, badge: "needs_attention" });
  await db.query(
    `insert into extracted_fields (paper_id, natural_key, field_name, tier, value, evidence_quote, pdf_page_index, badge, check_results)
     values ($1, 'study_1:h1:zebra->quokka:direct:estimate', 'estimate', 'T1', '-0.31', 'quote', 0, 'auto_verified', '{"checks":[]}'),
            ($1, 'paper_type', 'paper_type', 'T2', '"survey"', 'other quote', 1, 'auto_verified', '{"checks":[]}')`,
    [p1],
  );
});

test.afterAll(async () => {
  await db.query("delete from papers where file_hash = any($1)", [HASHES]);
  await db.end();
});

test("without a question the home page offers sample questions that lead to results", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Mối quan hệ giữa hai biến/ })).toBeVisible();
  await expect(page.getByTestId("samples")).toBeVisible();
  await page.locator(".sample-list").getByRole("link").first().click();
  await expect(page).toHaveURL(/a=ethicality&b=trust/);
  await expect(page.getByTestId("summary-counts")).toBeVisible();
});

test("counts what is in the repository: only ✓ tests, and says how many were left out and why", async ({ page }) => {
  await page.goto("/?a=zebra&b=quokka");
  await expect(page.getByTestId("summary-counts")).toHaveText("1 bài trong kho · 2 study · 2 kiểm định");
  await expect(page.getByTestId("summary-coverage")).toContainText("Tìm thấy 3 kiểm định từ 2 bài");
  await expect(page.getByTestId("summary-method")).toContainText("không phải meta-analysis");
  await expect(page.getByTestId("summary-outcome")).toContainText("✓ Ủng hộ 1 · ✗ Không ủng hộ 1");
  await expect(page.getByTestId("summary-direction")).toContainText("－ Âm 1 · ∅ Không có ý nghĩa 1");
  await expect(page.getByTestId("summary-not-counted")).toContainText("1 kiểm định ⚠ hoặc ◇ chưa kiểm chứng");
  await expect(page.getByTestId("summary-not-counted")).toContainText("1 thuộc thực nghiệm online");
  // Every matching test is listed, counted or not; the two studies of paper one disagree.
  await expect(page.getByTestId(`paper-${p1}`)).toContainText("Zhao & Okafor (2023)");
  await expect(page.getByTestId(`paper-${p1}`)).toContainText("Kết quả khác nhau giữa các study");
  await expect(page.getByTestId(`test-${firstTest}`)).toContainText("β = −.31");
  await expect(page.getByTestId(`test-${firstTest}`)).toContainText("p < .001");
  await expect(page.getByTestId(`paper-${p2}`)).toContainText("⚠ nên xem kỹ");
  // "Count the ⚠ tests too" includes the second paper.
  await page.getByRole("link", { name: "Tính cả ⚠ để xem số liệu sơ bộ" }).click();
  await expect(page).toHaveURL(/warn=1/);
  await expect(page.getByTestId("summary-counts")).toHaveText("2 bài trong kho · 3 study · 3 kiểm định");
  await expect(page.getByTestId("summary-not-counted")).toHaveCount(0);
});

test("when no test is ✓ yet, it says so instead of '0 bài' and a row of zeros", async ({ page }) => {
  await page.goto("/?a=mongoose&b=quokka");
  await expect(page.getByTestId("summary-counts")).toHaveText("Chưa có kiểm định nào đã kiểm chứng (✓)");
  await expect(page.getByTestId("summary-outcome")).toHaveCount(0);
  await expect(page.getByTestId("summary-direction")).toHaveCount(0);
  await expect(page.getByTestId("summary-not-counted")).toContainText("1 kiểm định ⚠ hoặc ◇ chưa kiểm chứng, chưa được tính");
  // The test is still listed, and counting ⚠ brings the usual summary back.
  await expect(page.getByTestId("results")).toContainText("Mongoose Calm → Quokka Loyalty");
  await page.getByRole("link", { name: "Tính cả ⚠ để xem số liệu sơ bộ" }).click();
  await expect(page.getByTestId("summary-counts")).toHaveText("1 bài trong kho · 1 study · 1 kiểm định");
});

test("the direction matters; an empty answer says it may be a research gap and offers the way back", async ({ page }) => {
  await page.goto("/?a=quokka&b=zebra");
  await expect(page.getByTestId("empty")).toContainText("có thể là khoảng trống nghiên cứu");
  await page.getByRole("link", { name: "Thử cả hai chiều" }).click();
  await expect(page).toHaveURL(/dir=both/);
  await expect(page.getByTestId("summary-counts")).toHaveText("1 bài trong kho · 2 study · 2 kiểm định");
});

test("the role picks direct, mediated or moderated tests and names the mediator", async ({ page }) => {
  await page.goto("/?a=zebra&b=quokka&role=mediated");
  await expect(page.getByTestId("summary-counts")).toHaveText("1 bài trong kho · 1 study · 1 kiểm định");
  await expect(page.getByTestId("results")).toContainText("qua trung gian: Mongoose Calm");
  await page.goto("/?a=zebra&b=quokka&role=moderated");
  await expect(page.getByTestId("empty")).toBeVisible();
});

test("filters by the result of the hypothesis and by the direction of the effect", async ({ page }) => {
  await page.goto("/?a=zebra&b=quokka&status=not_supported");
  await expect(page.getByTestId("summary-counts")).toHaveText("1 bài trong kho · 1 study · 1 kiểm định");
  await page.goto("/?a=zebra&b=quokka&sign=negative");
  await expect(page.getByTestId("summary-counts")).toHaveText("1 bài trong kho · 1 study · 1 kiểm định");
});

test("the form puts the question in the URL, so it can be shared", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[name="a"]').fill("Zebra");
  await page.locator('input[name="b"]').fill("Quokka");
  await page.getByRole("radio", { name: "Tất cả" }).check();
  await page.getByRole("button", { name: "Tìm kiếm" }).click();
  await expect(page).toHaveURL(/a=Zebra/);
  await expect(page).toHaveURL(/b=Quokka/);
  await expect(page).toHaveURL(/role=all/);
  await expect(page.getByTestId("summary-counts")).toContainText("kiểm định");
});

test("a test links to its paper with the estimate of that test selected", async ({ page }) => {
  await page.goto("/?a=zebra&b=quokka");
  await page.getByTestId(`test-${firstTest}`).getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`/papers/${p1}\\?focus=`));
  await expect(page.getByTestId("field-study_1:h1:zebra->quokka:direct:estimate")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("pdf-page")).toContainText("trang 1 của file PDF");
});

test("the library lists the papers, reachable from the header", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Thư viện" }).click();
  await expect(page).toHaveURL(/\/library/);
  await expect(page.getByRole("link", { name: "E2E relation paper one" })).toBeVisible();
});

test("the Excel file has exactly the tests of the list, with badge, printed page and the disclaimer", async ({ page, request }) => {
  await page.goto("/?a=zebra&b=quokka");
  const link = page.getByTestId("export-excel");
  await expect(link).toContainText("Tải Excel (3 kiểm định)");
  const href = (await link.getAttribute("href"))!;
  expect(href).toMatch(/^\/export\?/);
  expect(href).toContain("a=zebra");

  const response = await request.get(href);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("spreadsheetml");
  expect(response.headers()["content-disposition"]).toMatch(/attachment; filename="quan-he-\d{4}-\d{2}-\d{2}\.xlsx"/);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load((await response.body()) as unknown as ArrayBuffer);
  const sheet = wb.getWorksheet("Kết quả")!;
  const header = (sheet.getRow(1).values as string[]).slice(1);
  expect(sheet.rowCount).toBe(1 + 3); // the page lists 3 tests: two ✓ and one ⚠ (counted or not)
  const col = (name: string) => header.indexOf(name) + 1;
  const badges = [2, 3, 4].map((r) => sheet.getCell(r, col("Huy hiệu")).value);
  expect(badges.filter((b) => b === "✓ đã kiểm chứng")).toHaveLength(2);
  expect(badges.filter((b) => b === "⚠ nên xem kỹ")).toHaveLength(1);
  expect(wb.getWorksheet("Ghi chú")!.getCell(8, 2).value).toContain("tự đối chiếu với bài gốc");

  // The filter in the URL narrows the file in the same way as the page.
  const filtered = await request.get("/export?a=zebra&b=quokka&status=not_supported");
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.load((await filtered.body()) as unknown as ArrayBuffer);
  expect(wb2.getWorksheet("Kết quả")!.rowCount).toBe(2);
});

test("the Word file (APA 7) follows the same URL as the page and is a .docx attachment", async ({ page, request }) => {
  await page.goto("/?a=zebra&b=quokka");
  const link = page.getByTestId("export-word");
  await expect(link).toContainText("Tải Word APA 7");
  const href = (await link.getAttribute("href"))!;
  expect(href).toMatch(/^\/export\/word\?/);
  expect(href).toContain("a=zebra");

  const response = await request.get(href);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("wordprocessingml");
  expect(response.headers()["content-disposition"]).toMatch(/attachment; filename="quan-he-\d{4}-\d{2}-\d{2}\.docx"/);
  const body = await response.body();
  expect(body.subarray(0, 2).toString()).toBe("PK");
  const narrow = await request.get("/export/word?a=zebra&b=quokka&status=not_supported");
  expect((await narrow.body()).length).toBeLessThan(body.length);
});

test("a ✓ test offers a draft sentence to copy; a ⚠ test does not; the first-time guide shows without a question", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/?a=zebra&b=quokka");
  const buttons = page.getByTestId("copy-sentence");
  expect(await buttons.count()).toBeGreaterThan(0);
  await buttons.first().click();
  await expect(buttons.first()).toHaveText(/Đã chép/);
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toMatch(/^.+ \((β|b|r|est\.)? ?.*p [<=] ?\.\d+.*\)\.$|^.+\(.+\)\.$/);
  expect(text.endsWith(".")).toBe(true);
  // 3 tests are listed: two ✓ and one ⚠, so exactly two buttons.
  await expect(buttons).toHaveCount(2);

  await page.goto("/");
  await expect(page.getByTestId("quick-guide")).toContainText("Mở bằng chứng trong PDF");
  await page.goto("/?a=zebra&b=quokka");
  await expect(page.getByTestId("quick-guide")).toHaveCount(0);
});

test("says what the repository holds: open on the start page, folded under a result, with the not-a-systematic-sample warning", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("corpus")).toHaveAttribute("open", "");
  await expect(page.getByTestId("corpus-caveat")).toContainText("Không phải mẫu hệ thống");
  await expect(page.getByTestId("corpus-years")).toContainText("bài từ 2020 trở lại");
  await page.goto("/?a=zebra&b=quokka");
  await expect(page.getByTestId("corpus")).not.toHaveAttribute("open", "");
  await expect(page.getByTestId("corpus").locator("summary")).toContainText("Kho này gồm gì:");
});

test("searching one concept lists all its relationships, whatever the case, and says how it is searched", async ({ page }) => {
  await page.goto("/?a=zebra");
  await expect(page.getByTestId("single-note")).toContainText("Tìm theo một khái niệm");
  const lower = await page.locator("[data-testid^='test-']").count();
  expect(lower).toBeGreaterThan(0);
  await page.goto("/?a=ZeBrA");
  await expect(page.locator("[data-testid^='test-']")).toHaveCount(lower);
  await expect(page.getByTestId("results")).toContainText("khái niệm tìm là");
  await page.goto("/?b=zebra");
  await expect(page.locator("[data-testid^='test-']")).toHaveCount(lower);
  await page.goto("/?a=zebra&b=quokka");
  await expect(page.getByTestId("single-note")).toHaveCount(0);
});

test("says which kinds of effect size are counted and filters by kind", async ({ page }) => {
  await page.goto("/?a=zebra&b=quokka");
  await expect(page.getByTestId("summary-estimates")).toContainText("Loại ước lượng:");
  const all = await page.locator("[data-testid^='test-']").count();
  await page.goto("/?a=zebra&b=quokka&est=r");
  const onlyR = await page.locator("[data-testid^='test-']").count();
  expect(onlyR).toBeLessThanOrEqual(all);
  await expect(page.getByRole("checkbox", { name: "r (tương quan)" })).toBeChecked();
});

test("filters by year, design, sample and country, and folds the filters open when one is on", async ({ page }) => {
  await page.goto("/?a=zebra&b=quokka");
  await expect(page.getByTestId("study-filters")).not.toHaveAttribute("open", "");
  await page.goto("/?a=zebra&b=quokka&from=2100");
  await expect(page.getByTestId("study-filters")).toHaveAttribute("open", "");
  await expect(page.getByTestId("study-filters").locator("summary")).toContainText("đang lọc");
  await expect(page.getByTestId("empty")).toBeVisible();
  await page.goto("/?a=zebra&b=quokka&design=survey&design=lab_experiment&design=online_experiment");
  await expect(page.locator("[data-testid^='test-']").first()).toBeVisible();
});

test("sorts the papers by the chosen key and keeps the choice in the URL", async ({ page }) => {
  await page.goto("/?a=zebra&sort=name");
  await expect(page.getByTestId("sort")).toHaveValue("name");
  await page.getByTestId("sort").selectOption("n");
  await page.getByRole("button", { name: "Tìm kiếm" }).click();
  await expect(page).toHaveURL(/sort=n/);
});

test("the concepts page lists each canonical concept with its merged names, and a search says which names were merged", async ({ page }) => {
  await page.goto("/concepts");
  await expect(page.getByTestId("concepts")).toBeVisible();
  await expect(page.getByTestId("concept-brand_trust")).toContainText("Customer Trust");
  await expect(page.getByTestId("concepts-total")).toContainText("khái niệm chuẩn");
  await page.goto("/?a=customer+trust");
  await expect(page.getByTestId("summary-merged")).toContainText("Brand Trust");
  await page.goto("/?a=customer+trust&equiv=0");
  await expect(page.getByTestId("summary-merged")).toHaveCount(0);
  await page.goto("/");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Khái niệm" })).toBeVisible();
});
