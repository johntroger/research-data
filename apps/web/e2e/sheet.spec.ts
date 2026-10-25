/** The summary sheet at the top of a paper page. Uses a real paper of the local database (the ABE paper), skipped when it is not there. */
import { expect, test } from "@playwright/test";

async function openAbePaper(page: import("@playwright/test").Page) {
  await page.goto("/library?q=Authentic+Brand+Ethicality");
  const link = page.locator("ul.paper-list a", { hasText: "Authentic Brand Ethicality" }).first();
  if ((await link.count()) === 0) test.skip(true, "the local database does not hold the ABE paper");
  await link.click();
}

test("the sheet comes first: what the paper contributes, each study, each hypothesis with its result, the limits", async ({ page }) => {
  await openAbePaper(page);
  const sheet = page.getByTestId("paper-sheet");
  await expect(sheet).toBeVisible();
  await expect(page.getByTestId("sheet-what")).toBeVisible();
  await expect(page.getByTestId("sheet-design").locator("tbody tr").first()).toBeVisible();
  const rows = page.getByTestId("sheet-hypotheses").locator("tbody tr:not(.sheet-study)");
  expect(await rows.count()).toBeGreaterThan(3);
  await expect(page.getByTestId("sheet-limits")).toBeVisible();
  // The sheet is above the details and the PDF.
  const sheetBox = (await sheet.boundingBox())!;
  const detailsBox = (await page.locator("#details").boundingBox())!;
  expect(sheetBox.y).toBeLessThan(detailsBox.y);
});

test("the research question and the main conclusions come first, marked as reworded by AI with the PDF page of the quote", async ({ page }) => {
  await openAbePaper(page);
  await expect(page.getByTestId("paper-sheet")).toBeVisible();
  const block = page.getByTestId("sheet-question");
  if ((await block.count()) === 0) test.skip(true, "the local database holds no summary for the ABE paper");
  await expect(block.locator("h3").first()).toBeVisible();
  await expect(block).toContainText("◇");
  const sheetBox = (await page.getByTestId("paper-sheet").boundingBox())!;
  const questionBox = (await block.boundingBox())!;
  const whatBox = (await page.getByTestId("sheet-what").boundingBox())!;
  expect(questionBox.y).toBeGreaterThanOrEqual(sheetBox.y);
  expect(questionBox.y).toBeLessThan(whatBox.y);
});

test("a hypothesis row links to its evidence: the paper opens at the details with that test selected", async ({ page }) => {
  await openAbePaper(page);
  const link = page.getByTestId("sheet-hypotheses").locator("tbody tr:not(.sheet-study) a").first();
  await link.click();
  await expect(page).toHaveURL(/focus=.+#details/);
  await expect(page.locator("[data-testid^='field-'][aria-pressed='true']").first()).toBeVisible();
});
