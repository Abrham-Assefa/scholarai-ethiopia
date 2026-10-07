import { expect, test } from "@playwright/test";

test("landing renders and switches language", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Find scholarships");
  await page.getByTestId("lang-switch").click();
  await expect(page).toHaveURL(/\/am$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ስኮላርሺፕ");
});

test("scholarship list loads from API", async ({ page }) => {
  await page.goto("/en/scholarships");
  await expect(page.getByTestId("scholarship-grid").locator("a").first()).toBeVisible();
});

test("conferences timeline loads and opens a detail page", async ({ page }) => {
  await page.goto("/en/conferences");
  const row = page.getByTestId("conference-row").first();
  await expect(row).toBeVisible();
  await row.locator("a").click();
  await expect(page).toHaveURL(/\/en\/conferences\/[\w-]+$/);
  await expect(page.getByTestId("deadline-panel")).toBeVisible();
});
