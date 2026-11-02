import { test, expect } from "@playwright/test";

test.describe("Skenario Sistem Pasien (E2E)", () => {
  test("halaman beranda menampilkan sambutan pengelola kesehatan", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Pengelola Layanan Kesehatan Personal");
  });
});

