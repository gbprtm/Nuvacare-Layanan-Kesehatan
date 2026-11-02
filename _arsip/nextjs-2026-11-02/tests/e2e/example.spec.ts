import { test, expect } from "@playwright/test";

test.describe("Aplikasi Web Health IPL", () => {
  test("halaman beranda menampilkan judul utama", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Pengelola Layanan Kesehatan Personal");
  });

  test("halaman masuk dapat diakses", async ({ page }) => {
    await page.goto("/masuk");
    await expect(page.locator("h1")).toContainText("Masuk");
  });
});
