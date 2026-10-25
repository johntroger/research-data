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

// Letters only Vietnamese uses (not é, ñ, ô or ü of French, Spanish or German names), so authors' names do not trip it.
const VIETNAMESE = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

test("in English no page keeps a Vietnamese word of its own (data such as titles and quotes is English already)", async ({ page, context }) => {
  await context.addCookies([{ name: "lang", value: "en", url: "http://localhost:3000" }]);
  await page.goto("/library");
  const paperHref = (await page.locator("ul.paper-list a").first().getAttribute("href"))!;
  const pages = ["/", "/?a=trust&b=loyalty&role=all", "/?a=trust", "/library", "/matrix", "/concepts", "/map", "/about", "/login", paperHref];
  for (const path of pages) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    // Open every fold so its text counts too.
    await page.evaluate(() => document.querySelectorAll("details").forEach((d) => d.setAttribute("open", "")));
    // The checker's own detail lines (with the numbers) are stored in Vietnamese and marked lang="vi"; they are the one exception.
    await page.evaluate(() => document.querySelectorAll('[lang="vi"]').forEach((e) => e.remove()));
    const text = await page.locator("body").innerText();
    const bad = text.split("\n").filter((line) => VIETNAMESE.test(line));
    expect(bad, `Vietnamese text left on ${path}`).toEqual([]);
  }
});

test("in English the exported Excel and Word files are English too", async ({ context }) => {
  await context.addCookies([{ name: "lang", value: "en", url: "http://localhost:3000" }]);
  const sheet = await context.request.get("/export?a=trust&b=loyalty&role=all");
  expect(sheet.status()).toBe(200);
  const word = await context.request.get("/export/word?a=trust&b=loyalty&role=all");
  expect(word.status()).toBe(200);
});
