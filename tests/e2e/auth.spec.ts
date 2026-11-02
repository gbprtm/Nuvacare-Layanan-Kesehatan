import { test, expect } from '@playwright/test';

test.describe('L04 Autentikasi dan Formulir Blade', () => {
  const uniqueId = Date.now();
  const testEmail = `pasien.e2e.${uniqueId}@example.com`;
  const testPassword = 'PasswordE2E123!';
  const testName = `Pasien Playwright ${uniqueId}`;

  test('alur lengkap pendaftaran pasien baru hingga masuk ke dasbor pasien', async ({ page }) => {
    // 1. Kunjungi formulir pendaftaran
    await page.goto('/daftar');
    await expect(page.locator('h1')).toContainText('Pendaftaran Pasien');

    // 2. Isi formulir pendaftaran
    await page.fill('input#name', testName);
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);
    await page.fill('input#password_confirmation', testPassword);

    // 3. Kirim formulir pendaftaran
    await page.click('button[type="submit"]');

    // 4. Verifikasi diarahkan ke halaman masuk dengan pesan sukses
    await expect(page).toHaveURL(/\/masuk/);
    await expect(page.locator('.alert-success')).toBeVisible();

    // 5. Lakukan proses masuk (login) dengan akun baru
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);
    await page.click('button[type="submit"]');

    // 6. Verifikasi berhasil masuk ke dasbor pasien
    await expect(page).toHaveURL(/\/beranda/);
    await expect(page.locator('h1')).toContainText(testName);
    await expect(page.locator('.brand-badge')).toContainText('Pasien');

    // 7. Lakukan keluar (logout)
    await page.click('button:has-text("Keluar")');

    // 8. Verifikasi kembali ke halaman masuk
    await expect(page).toHaveURL(/\/masuk/);
    await expect(page.locator('h1')).toContainText('Masuk');
  });

  test('admin dapat masuk ke dasbor operasional admin dengan kredensial aman', async ({ page }) => {
    await page.goto('/masuk');

    // Masuk dengan kredensial admin seed
    await page.fill('input#email', 'admin@klinik.local');
    await page.fill('input#password', 'AdminKlinik2026!');
    await page.click('button[type="submit"]');

    // Verifikasi diarahkan ke dasbor operasional admin
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('h1')).toContainText('Dasbor Operasional');
    await expect(page.locator('.brand-badge')).toContainText('Admin');

    // Keluar dari sesi admin
    await page.click('button:has-text("Keluar")');
    await expect(page).toHaveURL(/\/masuk/);
  });

  test('validasi formulir menolak kata sandi tidak cocok dan menjaga keamanan input', async ({ page }) => {
    await page.goto('/daftar');

    await page.fill('input#name', 'Test Mismatch');
    await page.fill('input#email', 'mismatch@example.com');
    await page.fill('input#password', 'Password123!');
    await page.fill('input#password_confirmation', 'BedaPassword123!');

    await page.click('button[type="submit"]');

    // Tetap di halaman daftar dengan pesan kesalahan
    await expect(page).toHaveURL(/\/daftar/);
    await expect(page.locator('.form-error')).toBeVisible();

    // Verifikasi kata sandi tidak dipantulkan kembali di input (keamanan kredensial)
    const passwordValue = await page.inputValue('input#password');
    expect(passwordValue).toBe('');
  });
});

