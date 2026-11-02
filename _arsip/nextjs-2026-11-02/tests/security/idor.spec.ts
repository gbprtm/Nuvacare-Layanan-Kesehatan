import { test } from "@playwright/test";

// Kerangka uji keamanan untuk D02. Sebelumnya berkas ini hanya membuka
// /masuk lalu memeriksa URL-nya sendiri, sehingga tidak menguji IDOR sama
// sekali.
test.describe("Uji Keamanan: Pencegahan IDOR (Insecure Direct Object References)", () => {
  test.skip("pasien tidak dapat membaca data pasien lain lewat ubah ID di URL", async ({ page }) => {
    await page.goto("/masuk");
  });

  test.skip("respons 403/404 tidak membocorkan keberadaan data pasien lain", async ({ page }) => {
    await page.goto("/masuk");
  });
});
