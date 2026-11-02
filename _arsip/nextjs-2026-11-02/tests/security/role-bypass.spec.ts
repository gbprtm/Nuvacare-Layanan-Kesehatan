import { test } from "@playwright/test";

// Kerangka uji keamanan untuk D02. Sebelumnya berkas ini hanya memeriksa
// `response.status()` terdefinisi, sehingga selalu hijau tanpa membuktikan
// pencegahan role bypass.
test.describe("Uji Keamanan: Pencegahan Role Bypass", () => {
  test.skip("tamu tanpa sesi diarahkan ke halaman masuk dari /admin/slot", async ({ page }) => {
    await page.goto("/admin/slot");
  });

  test.skip("pasien yang login tidak dapat membuka /admin/slot", async ({ page }) => {
    await page.goto("/admin/slot");
  });
});
