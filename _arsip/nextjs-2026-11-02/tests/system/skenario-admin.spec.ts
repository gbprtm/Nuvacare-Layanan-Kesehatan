import { test, expect } from "@playwright/test";

test.describe("Skenario Sistem Admin (E2E)", () => {
  test("halaman login memiliki form input email dan sandi", async ({ page }) => {
    await page.goto("/masuk");
    await expect(page.locator("input#email")).toBeVisible();
    await expect(page.locator("input#password")).toBeVisible();
  });
});

