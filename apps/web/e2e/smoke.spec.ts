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
