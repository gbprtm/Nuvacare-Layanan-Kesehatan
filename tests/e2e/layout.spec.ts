import { test, expect } from '@playwright/test';

test.describe('L05 Layout Bersama, CSS, dan Aksesibilitas', () => {
  test('halaman utama dan autentikasi tidak mengalami horizontal overflow pada viewport mobile 360px', async ({ page }) => {
    // Set viewport mobile sempit (360 x 640)
    await page.setViewportSize({ width: 360, height: 640 });

    const paths = ['/', '/masuk', '/daftar'];

    for (const path of paths) {
      await page.goto(path);

      // Verifikasi tidak ada horizontal scrollbar (scrollWidth <= clientWidth)
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalOverflow, `Path ${path} tidak boleh memiliki horizontal overflow pada lebar 360px`).toBe(false);
    }
  });

  test('aksesibilitas keyboard: skip link muncul dan dapat difokuskan dengan tombol Tab', async ({ page }) => {
    await page.goto('/');

    // Tekan tombol Tab pertama kali
    await page.keyboard.press('Tab');

    // Verifikasi elemen yang aktif adalah skip-link
    const activeElementClass = await page.evaluate(() => document.activeElement?.className);
    expect(activeElementClass).toContain('skip-link');

    const activeElementHref = await page.evaluate(() => document.activeElement?.getAttribute('href'));
    expect(activeElementHref).toBe('#main-content');
  });

  test('alur autentikasi tetap bekerja 100% tanpa JavaScript (Progressive Enhancement)', async ({ browser }) => {
    // Buka browser konteks dengan JavaScript dinonaktifkan
    const context = await browser.newContext({ javaScriptEnabled: false });
    const noJsPage = await context.newPage();

    const uniqueId = Date.now();
    const noJsEmail = `pasien.nojs.${uniqueId}@example.com`;
    const noJsPassword = 'PasswordNoJs123!';

    // 1. Kunjungi formulir daftar tanpa JS
    await noJsPage.goto('/daftar');
    await noJsPage.fill('input#name', 'Pasien Tanpa JS');
    await noJsPage.fill('input#email', noJsEmail);
    await noJsPage.fill('input#password', noJsPassword);
    await noJsPage.fill('input#password_confirmation', noJsPassword);
    await noJsPage.click('button[type="submit"]');

    // 2. Berhasil redirect ke halaman masuk
    await expect(noJsPage).toHaveURL(/\/masuk/);

    // 3. Masuk akun tanpa JS
    await noJsPage.fill('input#email', noJsEmail);
    await noJsPage.fill('input#password', noJsPassword);
    await noJsPage.click('button[type="submit"]');

    // 4. Berhasil masuk ke beranda tanpa JS
    await expect(noJsPage).toHaveURL(/\/beranda/);
    await expect(noJsPage.locator('h1')).toContainText('Halo, Pasien Tanpa JS');

    // 5. Keluar akun tanpa JS
    await noJsPage.click('button:has-text("Keluar")');
    await expect(noJsPage).toHaveURL(/\/masuk/);

    await context.close();
  });
});

