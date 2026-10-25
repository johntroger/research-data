/** Step P5.1 to P5.5: the site in Vietnamese (default) and English. */
import { expect, test } from "@playwright/test";

test("the site is Vietnamese until the visitor chooses English; the choice is remembered and the parameter disappears from the address", async ({ page, context }) => {
  await page.goto("/about");
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Thư viện" })).toBeVisible();

  await page.getByTestId("lang-en").click();
  await expect(page).toHaveURL(/\/about$/); // ?lang=en was removed again
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Library" })).toBeVisible();
  expect((await context.cookies()).find((c) => c.name === "lang")?.value).toBe("en");

  await page.goto("/library"); // remembered on another page
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.getByTestId("lang-vi").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Thư viện" })).toBeVisible();
});

test("the language switch keeps the question and the filters of the page", async ({ page }) => {
  await page.goto("/?a=trust&b=loyalty&role=all");
  await page.getByTestId("lang-en").click();
  await expect(page).toHaveURL(/\/\?a=trust&b=loyalty&role=all$/);
});

test("an unknown language is ignored", async ({ page }) => {
  await page.goto("/about?lang=fr");
  await expect(page).toHaveURL(/lang=fr/);
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
});
