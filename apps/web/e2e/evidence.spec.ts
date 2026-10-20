/**
 * End-to-end test for the skeleton web (step 0.8).
 * Seeds a synthetic 4-page paper (self-made PDF, written to raw_papers/ and removed afterwards)
 * into Supabase local, then checks that clicking a value opens the PDF on the right page.
 * Needs Supabase local (pnpm db:start). Run: pnpm --filter @research-data/web test:e2e
 */
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import pg from "pg";

const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const PDF_NAME = "e2e-synthetic-paper.pdf";
const PDF_FILE = path.join(REPO_ROOT, "raw_papers", PDF_NAME);
const HASH = "e2e-synthetic-hash";
const BAD_HASH = "e2e-path-traversal";

const db = new pg.Client({ connectionString: DB_URL });
let paperId = "";
let badPaperId = "";

async function syntheticPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 4; i++) {
    doc.addPage([595, 842]).drawText(`Synthetic test page ${i}`, { x: 60, y: 420, size: 18, font });
  }
  return doc.save();
}

test.beforeAll(async () => {
  await writeFile(PDF_FILE, await syntheticPdf());
  await db.connect();
  await db.query("delete from papers where file_hash in ($1, $2)", [HASH, BAD_HASH]);

  const paper = await db.query<{ id: string }>(
    "insert into papers (title, file_hash, pdf_path, page_count) values ($1, $2, $3, 4) returning id",
    ["E2E synthetic paper", HASH, `raw_papers/${PDF_NAME}`],
  );
  paperId = paper.rows[0]!.id;
  await db.query(
    `insert into extracted_fields (paper_id, natural_key, field_name, tier, value, evidence_quote, pdf_page_index, printed_page, badge, check_results, highlight)
     values
       ($1, 'study_1:sample_size', 'sample_size', 'T1', '412', 'The final sample comprised 412 respondents.', 0, '501', 'auto_verified',
        '{"checks":[{"name":"quote_in_pdf","passed":true,"detail":"Câu trích khớp nguyên văn trên trang PDF 1"}]}',
        '{"page":1,"rects":[[60,416,230,434]]}'),
       ($1, 'study_1:h2:risk->intention', 'hypothesis_result', 'T1',
        '{"iv":"Perceived risk","dv":"Purchase intention","estimate":-0.31,"p_reported":"< .001","status":"supported"}',
        'Perceived risk had a significant negative effect.', 2, '503', 'auto_verified', '{"checks":[]}', null),
       ($1, 'paper_type', 'paper_type', 'T2', '"survey"', 'Hidden quote', 3, '504', 'hidden', '{"checks":[]}', null)`,
    [paperId],
  );

  const bad = await db.query<{ id: string }>(
    "insert into papers (title, file_hash, pdf_path) values ('Bad path', $1, '../.env') returning id",
    [BAD_HASH],
  );
  badPaperId = bad.rows[0]!.id;
});

test.afterAll(async () => {
  await db.query("delete from papers where file_hash in ($1, $2)", [HASH, BAD_HASH]);
  await db.end();
  await rm(PDF_FILE, { force: true });
});

test("lists the paper in the library and opens its workspace", async ({ page }) => {
  await page.goto("/library");
  await page.getByRole("link", { name: "E2E synthetic paper" }).click();
  await expect(page.getByRole("heading", { name: "E2E synthetic paper" })).toBeVisible();
  await expect(page.locator(".site-footer")).toContainText("chỉ để tham khảo");
});

test("clicking a value opens the PDF on that value's evidence page", async ({ page }) => {
  await page.goto(`/papers/${paperId}`);

  // The workspace opens on the first part that has fields (Study & Sample); its first field is selected.
  await expect(page.getByTestId("tab-study")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("field-study_1:sample_size")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("pdf-page")).toContainText("trang 1 của file PDF (trang in 501)");
  await expect(page.getByTestId("pdf-viewer")).toHaveAttribute("data-page", "1");
  await expect(page.getByTestId("why-study_1:sample_size")).toContainText("Câu trích khớp nguyên văn");

  // The hypothesis is in the Results tab: opening it jumps to its evidence on PDF page 3.
  await page.getByTestId("tab-results").click();
  await expect(page.getByTestId("field-study_1:h2:risk->intention")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("pdf-page")).toContainText("trang 3 của file PDF (trang in 503)");
  await expect(page.getByTestId("pdf-viewer")).toHaveAttribute("data-page", "3");
  await expect(page.getByTestId("field-study_1:h2:risk->intention")).toContainText(
    "Perceived risk → Purchase intention (β = -0.31, p < .001)",
  );

  // And back to the sample size, page 1.
  await page.getByTestId("tab-study").click();
  await page.getByTestId("field-study_1:sample_size").click();
  await expect(page.getByTestId("pdf-viewer")).toHaveAttribute("data-page", "1");
});

test("a value whose quote was located is framed on the page; one that was not says so", async ({ page }) => {
  await page.goto(`/papers/${paperId}`);
  await expect(page.getByTestId("pdf-canvas")).toBeVisible();
  await expect(page.getByTestId("pdf-highlight")).toHaveCount(1);
  await expect(page.getByTestId("pdf-locate-note")).toHaveCount(0);
  // The frame sits where the text is: the canvas draws the page at the width of the pane, so compare with the page's own size.
  const canvas = (await page.getByTestId("pdf-canvas").boundingBox())!;
  const frame = (await page.getByTestId("pdf-highlight").boundingBox())!;
  expect(frame.x - canvas.x).toBeCloseTo((58 / 595) * canvas.width, -1);
  expect(frame.y - canvas.y).toBeCloseTo(((842 - 436) / 842) * canvas.height, -1);

  await page.getByTestId("tab-results").click();
  await expect(page.getByTestId("pdf-highlight")).toHaveCount(0);
  await expect(page.getByTestId("pdf-locate-note")).toContainText("Không xác định được vị trí câu trích");
  await expect(page.getByTestId("pdf-locate-note")).toContainText("tự tìm câu trích");
});

test("the viewer has page, zoom and highlight controls and a link to the browser's own viewer", async ({ page }) => {
  await page.goto(`/papers/${paperId}`);
  await expect(page.getByTestId("pdf-canvas")).toBeVisible();
  await expect(page.getByTestId("pdf-viewer")).toContainText("/ 4"); // the file is loaded
  await expect(page.getByTestId("pdf-page-input")).toHaveValue("1");
  await expect(page.getByTestId("pdf-prev")).toBeDisabled();
  await page.getByTestId("pdf-next").click();
  await expect(page.getByTestId("pdf-viewer")).toHaveAttribute("data-page", "2");
  await expect(page.getByTestId("pdf-highlight")).toHaveCount(0); // the frame is on page 1
  await page.getByTestId("pdf-page-input").fill("4");
  await page.getByTestId("pdf-page-input").press("Enter");
  await expect(page.getByTestId("pdf-viewer")).toHaveAttribute("data-page", "4");
  await expect(page.getByTestId("pdf-next")).toBeDisabled();
  await expect(page.getByRole("link", { name: "Mở bằng trình xem của trình duyệt" })).toHaveAttribute("href", `/api/papers/${paperId}/pdf#page=4`);

  // Selecting a value goes back to its page.
  await page.getByTestId("field-study_1:sample_size").click();
  await expect(page.getByTestId("pdf-viewer")).toHaveAttribute("data-page", "1");
  await expect(page.getByTestId("pdf-highlight")).toHaveCount(1);

  await expect(page.getByTestId("pdf-zoom")).toHaveText("100%");
  await page.getByTestId("pdf-zoom-in").click();
  await expect(page.getByTestId("pdf-zoom")).toHaveText("125%");
  await expect(page.getByTestId("pdf-highlight")).toHaveCount(1);
  await page.getByTestId("pdf-zoom-out").click();
  await page.getByTestId("pdf-zoom-out").click();
  await expect(page.getByTestId("pdf-zoom")).toHaveText("75%");

  await page.getByTestId("pdf-frame-toggle").uncheck();
  await expect(page.getByTestId("pdf-highlight")).toHaveCount(0);
  await page.getByTestId("pdf-frame-toggle").check();
  await expect(page.getByTestId("pdf-highlight")).toHaveCount(1);
});

test("hidden fields are not shown to visitors", async ({ page }) => {
  await page.goto(`/papers/${paperId}`);
  await expect(page.getByTestId("field-study_1:sample_size")).toBeVisible();
  await page.getByTestId("tab-overview").click();
  await expect(page.getByTestId("field-paper_type")).toHaveCount(0);
});

test("the PDF endpoint serves the file and refuses paths outside raw_papers", async ({ request }) => {
  const ok = await request.get(`/api/papers/${paperId}/pdf`);
  expect(ok.status()).toBe(200);
  expect(ok.headers()["content-type"]).toBe("application/pdf");
  expect((await ok.body()).subarray(0, 4).toString()).toBe("%PDF");

  const traversal = await request.get(`/api/papers/${badPaperId}/pdf`);
  expect(traversal.status()).toBe(403);

  const unknown = await request.get("/api/papers/00000000-0000-0000-0000-000000000000/pdf");
  expect(unknown.status()).toBe(404);
});

test("the project owner (this machine) gets a Download PDF button and the file arrives as an attachment named after the paper", async ({ page, request }) => {
  await page.goto(`/papers/${paperId}`);
  const button = page.getByTestId("pdf-download");
  await expect(button).toHaveText("Tải PDF");
  await expect(button).toHaveAttribute("href", `/api/papers/${paperId}/pdf?download=1`);

  const response = await request.get(`/api/papers/${paperId}/pdf?download=1`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-disposition"]).toBe('attachment; filename="E2E-synthetic-paper.pdf"');
  expect((await response.body()).subarray(0, 4).toString()).toBe("%PDF");
  // Viewing in the page stays inline.
  expect((await request.get(`/api/papers/${paperId}/pdf`)).headers()["content-disposition"]).toBe("inline");
});

test("a paper without a PDF file offers no download", async ({ page }) => {
  const id = (await db.query<{ id: string }>("select id from papers where file_hash = $1", [BAD_HASH])).rows[0]!.id;
  await db.query("update papers set pdf_path = null where id = $1", [id]);
  await page.goto(`/papers/${id}`);
  await expect(page.getByTestId("pdf-download")).toHaveCount(0);
  await db.query("update papers set pdf_path = '../.env' where id = $1", [id]);
});
