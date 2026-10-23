/**
 * End-to-end test for the About page (step 3b.4): reachable from the header, explains the badges and the accuracy
 * checks, and reports the repository's current size. Needs Supabase local (pnpm db:start).
 * Run: pnpm --filter @research-data/web test:e2e
 */
import { expect, test } from "@playwright/test";

test("is reachable from the header and explains the badges, the checks and the limits", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Giới thiệu" }).click();
  await expect(page).toHaveURL(/\/about/);
  await expect(page.getByRole("heading", { name: "Giới thiệu và cách đọc dữ liệu" })).toBeVisible();
  await expect(page.getByText("Người dùng có trách nhiệm tự đối chiếu với bài gốc").first()).toBeVisible();
  for (const name of ["Đã kiểm chứng", "Nên xem kỹ", "AI diễn giải", "Đã sửa tay"]) await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
  await expect(page.getByTestId("about-audits").getByRole("row")).toHaveCount(4);
  await expect(page.getByRole("heading", { name: "Giới hạn đã biết" })).toBeVisible();
});

test("states how many papers and values the repository shows", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByTestId("about-overview")).toContainText(/\d+ bài, [\d.]+ giá trị đang hiển thị/);
});
