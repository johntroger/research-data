/** Step P5.4: the evidence map. Uses the real concepts and tests of the local database (those mapped to a canonical concept). */
import { expect, test } from "@playwright/test";

test("the evidence map shows the pairs of concepts that have tests, and a cell opens the search for that pair", async ({ page }) => {
  await page.goto("/map");
  await expect(page.getByTestId("evidence-map")).toBeVisible();
  await expect(page.getByTestId("map-summary")).toContainText("ô có kiểm định");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Bản đồ bằng chứng" })).toBeVisible();
  const cell = page.locator("td a").first();
  await expect(cell).toBeVisible();
  const title = (await cell.getAttribute("title"))!;
  expect(title).toMatch(/→.*: \d+ kiểm định từ \d+ bài/);
  await cell.click();
  await expect(page).toHaveURL(/\/\?a=.+&b=.+/);
  await expect(page.getByTestId("summary")).toBeVisible();
});

test("the map is readable without colour: every filled cell states its numbers, and an empty cell is labelled", async ({ page }) => {
  await page.goto("/map");
  const first = page.locator("td a").first();
  await expect(first.locator("strong")).toHaveText(/^\d+$/);
  await expect(first).toContainText("bài");
  await expect(page.locator("td.empty").first()).toHaveAttribute("aria-label", /không có kiểm định/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 || !!document.querySelector(".matrix-scroll"))).toBe(true);
});
