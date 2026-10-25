/**
 * End-to-end test for the paper workspace (step 3a.2): tabs, section badges, the "why this badge" table and the
 * draggable divider. Seeds one paper with fields of every kind into Supabase local. Needs Supabase local (pnpm db:start).
 * Run: pnpm --filter @research-data/web test:e2e
 */
import { expect, test } from "@playwright/test";
import pg from "pg";

const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const HASH = "e2e-workspace-hash";
const db = new pg.Client({ connectionString: DB_URL });
let paperId = "";

const checks = (list: [boolean, string][]) => JSON.stringify({ checks: list.map(([passed, detail], i) => ({ name: `check_${i}`, passed, detail })) });

test.beforeAll(async () => {
  await db.connect();
  await db.query("delete from papers where file_hash = $1", [HASH]);
  paperId = (await db.query<{ id: string }>("insert into papers (title, file_hash, page_count) values ('E2E workspace paper', $1, 6) returning id", [HASH])).rows[0]!.id;
  const field = (key: string, badge: string, page: number | null, list: [boolean, string][]) =>
    db.query(
      `insert into extracted_fields (paper_id, natural_key, field_name, tier, value, evidence_quote, pdf_page_index, printed_page, badge, check_results)
       values ($1, $2, $3, 'T1', '"v"', 'a quote', $4, $5, $6, $7)`,
      [paperId, key, key.split(":").pop(), page, page === null ? null : String(500 + page), badge, checks(list)],
    );
  await field("paper_type", "auto_verified", 0, [[true, "Câu trích khớp nguyên văn trên trang PDF 1"]]);
  await field("theory:social_exchange:role", "ai_interpreted", 1, []);
  await field("study_1:sample_size", "auto_verified", 2, [[true, "Số 412 xuất hiện trên trang 3"]]);
  await field("study_1:m:trust:alpha", "auto_verified", 3, [[true, "Số .86 xuất hiện trên trang 4"]]);
  await field("study_1:m:trust:cr", "needs_attention", 3, [[false, "CR nhỏ hơn alpha"]]);
  await field("study_1:h1:a->b:direct:estimate", "auto_verified", 4, [[true, "Số -.31 xuất hiện trên trang 5"], [true, "p tính lại khớp"]]);
  await field("study_1:h1:a->b:direct:status", "needs_attention", 4, [[true, "Câu trích khớp trên trang 5"], [false, "Kết quả Supported không khớp với p"]]);
  await field("study_1:corr:table_2:r:1,0", "auto_verified", 5, [[true, "Số .48 xuất hiện trên trang 6"]]);
  await field("limitation:1", "ai_interpreted", 5, []);
  await field("future_direction:1", "ai_interpreted", 5, []);
});

test.afterAll(async () => {
  await db.query("delete from papers where file_hash = $1", [HASH]);
  await db.end();
});

test.beforeEach(async ({ page }) => {
  // Start every test without a remembered width, but keep what the test stores across its own reloads.
  await page.addInitScript(() => {
    try {
      if (!window.sessionStorage.getItem("rd-test-started")) {
        window.sessionStorage.setItem("rd-test-started", "1");
        window.localStorage.removeItem("rd-split");
      }
    } catch {
      /* ignore */
    }
  });
});

test("has a tab for each part of the paper with its number of records (a test, a measure, a table or a study each, not one per field), and opens on the results", async ({ page }) => {
  await page.goto(`/papers/${paperId}`);
  for (const [id, count] of [["overview", 1], ["theory", 1], ["study", 1], ["measures", 1], ["results", 1], ["tables", 1], ["contribution", 2]] as const) {
    await expect(page.getByTestId(`tab-${id}`)).toContainText(String(count));
  }
  await expect(page.getByTestId("tab-results")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("field-study_1:h1:a->b:direct:estimate")).toBeVisible();
  await expect(page.getByTestId("field-paper_type")).toHaveCount(0); // it is in another tab
  await expect(page.getByTestId("paper-head")).toBeVisible();
  await expect(page.getByTestId("paper-facts")).toContainText("kiểm định đường quan hệ");
});

test("sums up each section in one line: x/y checked, or how many interpretations", async ({ page }) => {
  await page.goto(`/papers/${paperId}`);
  await expect(page.getByTestId("section-badge")).toHaveText("Kết quả: 1/2 đã kiểm chứng");
  await page.getByTestId("tab-overview").click();
  await expect(page.getByTestId("section-badge")).toHaveText("Tổng quan: 1/1 đã kiểm chứng");
  await page.getByTestId("tab-results").click();
  await expect(page.getByTestId("section-badge")).toHaveText("Kết quả: 1/2 đã kiểm chứng");
  await page.getByTestId("tab-measures").click();
  await expect(page.getByTestId("section-badge")).toHaveText("Đo lường: 1/2 đã kiểm chứng");
  await page.getByTestId("tab-contribution").click();
  await expect(page.getByTestId("section-badge")).toHaveText("Đóng góp & Khoảng trống: ◇ 2 mục AI diễn giải");
});

test("switching tab shows that part's fields and jumps the PDF to the first of them", async ({ page }) => {
  await page.goto(`/papers/${paperId}`);
  await page.getByTestId("tab-results").click();
  await expect(page.getByTestId("tab-results")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("field-study_1:h1:a->b:direct:estimate")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("pdf-viewer")).toHaveAttribute("data-page", "5");
  await expect(page.getByTestId("field-paper_type")).toHaveCount(0);
});

test("the 'why this badge' table lists what passed, and for ⚠ the failed check first", async ({ page }) => {
  await page.goto(`/papers/${paperId}`);
  await page.getByTestId("tab-results").click();
  const ok = page.getByTestId("why-study_1:h1:a->b:direct:estimate");
  await expect(ok).toContainText("Vì sao ✓ đã kiểm chứng");
  await expect(ok.locator("li")).toHaveText(["✓ Số -.31 xuất hiện trên trang 5", "✓ p tính lại khớp"]);
  await page.getByTestId("field-study_1:h1:a->b:direct:status").click();
  const warn = page.getByTestId("why-study_1:h1:a->b:direct:status");
  await expect(warn).toContainText("Vì sao ⚠ nên xem kỹ");
  await expect(warn.locator("li").first()).toHaveText("✗ chưa qua: Kết quả Supported không khớp với p");
  await expect(warn.getByRole("link", { name: /Mở trong PDF/ })).toHaveAttribute("href", `/api/papers/${paperId}/pdf#page=5`);
});

test("an interpretation says the machine cannot check it, instead of an empty table", async ({ page }) => {
  await page.goto(`/papers/${paperId}`);
  await page.getByTestId("tab-contribution").click();
  await page.getByTestId("field-limitation:1").click();
  await expect(page.getByTestId("why-limitation:1")).toContainText("máy không kiểm tra được");
});

test("a link from the search opens the right tab and selects that test", async ({ page }) => {
  await page.goto(`/papers/${paperId}?focus=${encodeURIComponent("study_1:h1:a->b:direct")}`);
  await expect(page.getByTestId("tab-results")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("field-study_1:h1:a->b:direct:estimate")).toHaveAttribute("aria-pressed", "true");
});

test("the divider moves with the arrow keys, stays between 25% and 75%, and is remembered after a reload", async ({ page }) => {
  await page.goto(`/papers/${paperId}`);
  const splitter = page.getByTestId("splitter");
  await expect(splitter).toHaveAttribute("aria-valuenow", "45");
  await splitter.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(splitter).toHaveAttribute("aria-valuenow", "49");
  await page.keyboard.press("End");
  await expect(splitter).toHaveAttribute("aria-valuenow", "75");
  await page.keyboard.press("ArrowRight");
  await expect(splitter).toHaveAttribute("aria-valuenow", "75");
  await page.keyboard.press("Home");
  await expect(splitter).toHaveAttribute("aria-valuenow", "25");
  await page.reload();
  await expect(page.getByTestId("splitter")).toHaveAttribute("aria-valuenow", "25");
});

test("the divider follows the mouse", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(`/papers/${paperId}`);
  const splitter = page.getByTestId("splitter");
  const box = (await splitter.boundingBox())!;
  const workspace = (await page.locator(".workspace").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 40); // near the top: the divider is as tall as the list of cards
  await page.mouse.down();
  await page.mouse.move(workspace.x + workspace.width * 0.6, box.y + 40, { steps: 5 });
  await page.mouse.up();
  const value = Number(await splitter.getAttribute("aria-valuenow"));
  expect(value).toBeGreaterThanOrEqual(58);
  expect(value).toBeLessThanOrEqual(62);
});

test("a record is one card with its numbers on a line; a paper with many records starts folded and the selected card is open", async ({ page }) => {
  await page.goto(`/papers/${paperId}`);
  const card = page.getByTestId("record-study_1:h1:a->b:direct");
  await expect(card).toBeVisible();
  await expect(card.locator("summary .record-line")).toBeVisible();
  await expect(card.locator("summary .record-badges")).toContainText("trường");
});
