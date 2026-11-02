import { test, expect } from '@playwright/test';

test.describe('L01 Fondasi: Halaman Publik dan Aset', () => {
  test('halaman beranda menyajikan judul layanan kesehatan dan tautan autentikasi', async ({ page }) => {
    await page.goto('/');

    // Verifikasi judul utama halaman publik
    await expect(page.locator('h1')).toContainText('Layanan Kesehatan Personal');

    // Verifikasi tombol autentikasi tersedia
    const masukBtn = page.locator('a[href="/masuk"]').first();
    const daftarBtn = page.locator('a[href="/daftar"]').first();
    await expect(masukBtn).toBeVisible();
    await expect(daftarBtn).toBeVisible();
  });

  test('endpoint health check merespons HTTP 200', async ({ request }) => {
    const response = await request.get('/up');
    expect(response.status()).toBe(200);
  });
});

