import { test, expect } from '@playwright/test';

test.describe('L08 Dokter, Slot dan Janji Anti-Bentrok Beserta UI', () => {
  test('alur admin mengelola jadwal dokter dan pasien memesan janji temu dengan estimasi kedatangan', async ({ page }) => {
    test.setTimeout(180000);

    const timestamp = Date.now();
    const specialtyName = `Spesialis L08 ${timestamp}`;
    const doctorName = `dr. Hendra Pratama ${timestamp}, Sp.PD`;
    const sipNumber = `SIP-E2E-${timestamp}`;

    // 1. Masuk sebagai Admin Klinik
    await page.goto('/masuk');
    await page.fill('#email', 'admin@klinik.local');
    await page.fill('#password', 'AdminKlinik2026!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin$/);

    // 2. Admin membuka menu Pengelolaan Dokter
    await page.goto('/admin/dokter');
    await expect(page.locator('h1')).toContainText('Pengelolaan Tenaga Medis (Dokter)');

    // 3. Tambahkan dokter baru
    await page.click('summary:has-text("+ Tambah Dokter Baru")');
    await page.fill('input#nama', doctorName);
    await page.fill('input#spesialisasi', specialtyName);
    await page.fill('input#nomor_izin', sipNumber);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]:has-text("Simpan Dokter Baru")'),
    ]);

    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.locator('table')).toContainText(doctorName);

    // 4. Admin membuka Pengelolaan Slot Praktik
    await page.goto('/admin/slot');
    await expect(page.locator('h1')).toContainText('Pengelolaan Slot Praktik Dokter');

    // 5. Tambahkan slot praktik baru untuk dokter tersebut
    await page.click('summary:has-text("+ Tambah Slot Praktik Baru")');
    await page.selectOption('select#dokter_id', { label: `${doctorName} (${specialtyName})` });
    
    // Gunakan tanggal besok (format YYYY-MM-DD)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await page.fill('input#tanggal', tomorrowStr);
    await page.fill('input#jam_mulai', '10:00');
    await page.fill('input#jam_selesai', '10:30');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]:has-text("Simpan Slot Praktik")'),
    ]);

    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.locator('table')).toContainText('10:00 - 10:30 WIB');

    // 6. Admin keluar
    await page.click('button:has-text("Keluar")');
    await expect(page).toHaveURL(/\/masuk/);

    // 7. Registrasi akun pasien baru
    const patientEmail = `pasien.e2e.${timestamp}@example.com`;
    const patientPassword = 'PasswordJanji123!';

    await page.goto('/daftar');
    await page.fill('input#name', `Pasien Janji ${timestamp}`);
    await page.fill('input#email', patientEmail);
    await page.fill('input#password', patientPassword);
    await page.fill('input#password_confirmation', patientPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/masuk/);

    // 8. Pasien masuk
    await page.fill('#email', patientEmail);
    await page.fill('#password', patientPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/beranda/);

    // 9. Pasien membuka alur pembuatan janji (P6: Pilih spesialis)
    await page.click('a:has-text("Buat Janji Temu")');
    await expect(page).toHaveURL(/\/janji\/buat/);
    await expect(page.locator('h2:has-text("1. Pilih Spesialisasi Kunjungan")')).toBeVisible();

    // Pilih spesialisasi
    await Promise.all([
      page.waitForURL(url => url.searchParams.get('spesialisasi') === specialtyName),
      page.click(`a[href*="spesialisasi=${encodeURIComponent(specialtyName)}"]`),
    ]);

    // 10. Pasien memilih tanggal & slot praktik (P7: Pilih waktu)
    await expect(page.locator('h2:has-text("2. Pilih Waktu Praktik")')).toBeVisible();
    await page.fill('input#tanggal', tomorrowStr);
    await Promise.all([
      page.waitForURL(url => url.searchParams.get('tanggal') === tomorrowStr),
      page.click('button:has-text("Cari Slot")'),
    ]);

    await expect(page.locator('text=10:00 - 10:30 WIB').first()).toBeVisible();
    await Promise.all([
      page.waitForURL(url => url.searchParams.get('slot_id') !== null),
      page.locator('a:has-text("Pilih Jam Ini")').first().click(),
    ]);

    // 11. Konfirmasi Janji Temu (P8)
    await expect(page.locator('h2:has-text("3. Konfirmasi Janji Temu")')).toBeVisible();
    await expect(page.locator('text=Nomor estimasi yang diterbitkan adalah perkiraan kedatangan, bukan nomor urutan panggilan antrean klinik')).toBeVisible();

    // Pastikan tidak ada NIK/KK
    await expect(page.locator('input[name="nik"]')).toHaveCount(0);
    await expect(page.locator('input[name="kk"]')).toHaveCount(0);

    // Isi keluhan singkat
    await page.fill('textarea#keluhan', 'Keluhan pusing dan badan lemas sejak kemarin.');

    await Promise.all([
      page.waitForURL(url => url.pathname.startsWith('/janji/')),
      page.click('button[type="submit"]:has-text("Buat Janji Temu")'),
    ]);

    // 12. Verifikasi halaman detail konfirmasi janji temu
    await expect(page.locator('h1')).toContainText(doctorName);
    await expect(page.locator('text=Nomor Estimasi Kedatangan')).toBeVisible();
    await expect(page.locator('text=Perkiraan Jam: 10:00 - 10:30 WIB')).toBeVisible();
    await expect(page.locator('text=Keluhan yang Dilaporkan')).toBeVisible();
    await expect(page.locator('text=Keluhan pusing dan badan lemas sejak kemarin.')).toBeVisible();

    // 13. Pasien membatalkan janji temu
    await page.click('summary:has-text("Batalkan Janji Ini")');
    await page.fill('textarea#alasan', 'Ada perubahan jadwal mendadak');
    
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/batal') && res.status() === 302),
      page.click('button[type="submit"]:has-text("Ya, Batalkan")'),
    ]);

    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.locator('.brand-badge:has-text("Dibatalkan")')).toBeVisible();
    await expect(page.locator('text=Ada perubahan jadwal mendadak')).toBeVisible();
  });
});

