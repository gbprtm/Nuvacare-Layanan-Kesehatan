import { test, expect } from '@playwright/test';

test.describe('L07 Profil dan Katalog Obat Tanpa Kehilangan Data', () => {
  test('pasien dapat mengelola profil kesehatan tanpa NIK/KK, melihat capture obat read-only, dan mengakses katalog Fornas', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `pasien.profil.${timestamp}@example.com`;
    const testPassword = 'PasswordProfil123!';

    // 1. Registrasi akun pasien baru
    await page.goto('/daftar');
    await page.fill('input#name', `Pasien Profil ${timestamp}`);
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);
    await page.fill('input#password_confirmation', testPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/masuk/);

    // 2. Masuk ke aplikasi
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/beranda/);

    // 3. Buka halaman Profil Saya
    await page.click('a:has-text("Profil Saya")');
    await expect(page).toHaveURL(/\/profil$/);
    await expect(page.locator('h1.page-title')).toContainText('Profil Kesehatan Pasien');

    // 4. Pastikan ketiadaan field NIK/KK by design pada antarmuka
    await expect(page.locator('input[name="nik"]')).toHaveCount(0);
    await expect(page.locator('input[name="kk"]')).toHaveCount(0);
    await expect(page.locator('label:has-text("NIK")')).toHaveCount(0);
    await expect(page.locator('label:has-text("Nomor Induk Kependudukan")')).toHaveCount(0);

    // 5. Pastikan kartu capture obat tidak memiliki kontrol edit atau tambah obat
    await expect(page.locator('text=Rekaman Capture Konsumsi Obat')).toBeVisible();
    await expect(page.locator('button:has-text("Tambah Obat")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Edit Obat")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Hapus Obat")')).toHaveCount(0);

    // 6. Klik tombol perbarui profil
    await page.click('a:has-text("Perbarui Data Profil")');
    await expect(page).toHaveURL(/\/profil\/ubah/);

    // 7. Isi formulir data fisik dan kontak
    await page.fill('#phone_number', '081299887766');
    await page.fill('#birth_date', '1992-08-20');
    await page.selectOption('#gender', 'laki-laki');
    await page.selectOption('#blood_group', 'B');
    await page.fill('#height_cm', '170');
    await page.fill('#weight_kg', '65');
    await page.fill('#health_conditions', 'Kondisi sehat prima');
    await page.fill('#allergies', 'Tidak ada alergi obat');
    await page.fill('#emergency_contact_name', 'Ibu Kandung');
    await page.fill('#emergency_contact_phone', '081233445566');

    // 8. Simpan perubahan profil
    await Promise.all([
      page.waitForURL(url => url.pathname === '/profil'),
      page.click('button[type="submit"]:has-text("Simpan Perubahan")')
    ]);

    // 9. Verifikasi kembali ke halaman rincian profil dengan data tersimpan
    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.locator('text=081299887766')).toBeVisible();
    await expect(page.locator('text=170 cm / 65 kg')).toBeVisible();
    await expect(page.locator('text=Kondisi sehat prima')).toBeVisible();

    // 10. Kunjungi Katalog Obat Referensi Fornas
    await page.goto('/katalog-obat');
    await expect(page.locator('h1.page-title')).toContainText('Katalog Obat Referensi Fornas');
    await expect(page.locator('text=Catatan Referensi Resmi, Bukan Rekomendasi Medis')).toBeVisible();

    // 11. Cari obat dalam katalog
    await page.fill('input[name="q"]', 'akarbose');
    await page.click('button[type="submit"]:has-text("Cari Obat")');
    await expect(page.locator('table')).toContainText('akarbose');
    await expect(page.locator('table')).toContainText('acarbose');
  });
});
