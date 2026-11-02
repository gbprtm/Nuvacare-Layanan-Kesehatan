import { test, expect } from '@playwright/test';

test.describe('L06 Audit Atomik dan Log Hanya Baca', () => {
  test('admin dapat mengakses audit log dan melihat riwayat tanpa kontrol hapus/ubah', async ({ page }) => {
    // 1. Masuk sebagai admin klinik dengan kredensial seeder Laravel aman
    await page.goto('/masuk');
    await page.fill('#email', 'admin@klinik.local');
    await page.fill('#password', 'AdminKlinik2026!');
    await page.click('button[type="submit"]');

    // 2. Berada di dasbor admin, klik menu Audit Log
    await expect(page).toHaveURL(/\/admin/);
    await page.click('a:has-text("Audit Log")');

    // 3. Verifikasi halaman Audit Log
    await expect(page).toHaveURL(/\/admin\/audit-log/);
    await expect(page.locator('h1.page-title')).toContainText('Audit Log Operasional');

    // 4. Pastikan formulir filter tersedia dan aksesibel
    await expect(page.locator('label[for="filter-action"]')).toBeVisible();
    await expect(page.locator('label[for="filter-object"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Terapkan Filter")')).toBeVisible();

    // 5. Pastikan TIDAK ADA tombol atau aksi hapus/edit (Append-Only Enforcement)
    await expect(page.locator('button:has-text("Hapus")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Edit")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Ubah")')).toHaveCount(0);
    await expect(page.locator('a:has-text("Hapus")')).toHaveCount(0);
    await expect(page.locator('a:has-text("Edit")')).toHaveCount(0);

    // 6. Jika terdapat catatan audit log di tabel, buka rincian salah satunya
    const detailButton = page.locator('a:has-text("Rincian")').first();
    if (await detailButton.isVisible()) {
      await detailButton.click();
      await expect(page).toHaveURL(/\/admin\/audit-log\/.+/);
      await expect(page.locator('h1.page-title')).toContainText('Rincian Audit Log');
      await expect(page.locator('text=Metadata Transaksi')).toBeVisible();
      await expect(page.locator('text=Perbandingan Nilai Data')).toBeVisible();
      
      // Kembali ke daftar
      await page.click('a:has-text("Kembali ke Daftar")');
      await expect(page).toHaveURL(/\/admin\/audit-log/);
    }
  });

  test('pasien ditolak mengakses audit log admin', async ({ page }) => {
    const timestamp = Date.now();
    const patientEmail = `pasien.audit.${timestamp}@example.com`;
    const patientPassword = 'PasswordAudit123!';

    // Daftarkan pasien baru
    await page.goto('/daftar');
    await page.fill('input#name', `Pasien Uji Audit ${timestamp}`);
    await page.fill('input#email', patientEmail);
    await page.fill('input#password', patientPassword);
    await page.fill('input#password_confirmation', patientPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/masuk/);

    // Masuk sebagai pasien
    await page.fill('#email', patientEmail);
    await page.fill('#password', patientPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/beranda/);

    // Coba langsung buka URL audit log admin
    const response = await page.goto('/admin/audit-log');
    expect(response?.status()).toBe(403);
  });
});
