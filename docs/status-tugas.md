# Status tugas Laravel

**Satu-satunya sumber status hidup** untuk L01–L17. Spesifikasi aktif:
[`rencana-agen.md`](rencana-agen.md); jadwal relatif 10 hari dan gerbang:
[`to-do.md`](to-do.md); pemetaan FR: [`peta-bagian.md`](peta-bagian.md).

Snapshot status Next.js sebelumnya, termasuk perubahan lokal yang belum
ter-commit, dipertahankan di `_arsip/nextjs-2026-11-02/docs/status-tugas.md`.
Hasil A/B/C/D lama bukan bukti Laravel dan tidak diwariskan sebagai `done`.
`docs/rancangan/rencana-agen.md` adalah salinan read-only rencana lama,
bukan antrean implementasi aktif.

## Aturan

- Status sah: `todo`, `doing`, `blocked`, `done`.
- Seluruh tugas dimulai `todo`: sesi ini dokumentasi/arsip, bukan implementasi.
  PHP dan Composer sebelumnya tidak ditemukan di PATH, dan belum ada
  `composer.json`/`artisan`. Itu risiko prasyarat, bukan percobaan L01 baru.
  Jika saat L01 dieksekusi prasyarat masih tidak tersedia, ubah ke `blocked`.
- Ambil hanya tugas yang semua dependensinya `done`; dependensi di rencana
  agen. Status `blocked` wajib satu kalimat sebab dan kebutuhan pembuka.
- `done` hanya bila seluruh accept/verify terbukti dalam `docs/bukti/Lxx.md`.
  Bukti parsial gerbang hosting hari 2 tidak mengubah seluruh L04 menjadi done.
- Commit hanya setelah izin pemilik; kolom commit diisi hash nyata bila ada,
  atau `Belum diizinkan` jika implementasi sudah diterima tanpa izin commit.
  Pada sesi ini tidak ada commit dan tidak ada klaim implementasi selesai.
- Jangan ubah status tugas yang sedang dipegang agen lain. Perubahan status
  bersama diserialkan. Jangan menduplikasi papan status di dokumen lain.

## Antrean

| ID | Tugas | Status | Commit | Bukti target (belum hasil uji) | Catatan |
|---|---|---|---|---|---|
| L01 | Prasyarat, scaffold Laravel bersih, runner/CI dan hosting awal | done | - | `docs/bukti/L01.md` | Selesai: PHP 8.4, Composer 2.11, Laravel 13, Vite, PHPUnit, Pint, Playwright Chrome lulus. |
| L02 | Inventaris DB, backup/restore dan keputusan pemetaan | done | - | `docs/bukti/L02.md` | Selesai: Inventaris 21 tabel, guard isolasi produksi, drill backup/restore, DatabaseSafetyTest lulus. |
| L03 | Migrasi, model, factory dan seed PostgreSQL terisolasi | done | - | `docs/bukti/L03.md` | Selesai: 18 Model Eloquent, WibClock, migrasi DDL, partial unique indexes, seed fiktif aman, SchemaMappingTest lulus. |
| L04 | Auth, role, idle 15 menit dan formulir Blade | done | - | `docs/bukti/L04.md` | Selesai: Registrasi pasien, login/logout, rotasi session ID, idle 15 menit, rate limit, Blade DESIGN.md, 13 test PHPUnit + 3 E2E Chrome lulus. |
| L05 | Layout bersama, CSS/JS dan aksesibilitas | todo | - | `docs/bukti/L05.md` | Setelah auth. |
| L06 | Audit atomik dan log hanya baca | todo | - | `docs/bukti/L06.md` | Sebelum mutasi admin fitur. |
| L07 | Profil, katalog dan obat laporan pasien | todo | - | `docs/bukti/L07.md` | Data legacy/pemilik harus terjaga. |
| L08 | Dokter, slot dan janji anti-race beserta UI | todo | - | `docs/bukti/L08.md` | Race harus memakai PostgreSQL. |
| L09 | Usulan, tanggapan, expiry, notifikasi dan pembatalan | todo | - | `docs/bukti/L09.md` | Keputusan TTL/cutoff diperlukan. |
| L10 | Kontrol berulang, reminder dan agenda/bulan | todo | - | `docs/bukti/L10.md` | Anchor asli dan retry idempoten. |
| L11 | Check-in, antrian, tutup hari dan hook kontrol | todo | - | `docs/bukti/L11.md` | Bergantung pada L10. |
| L12 | Resep klinik, label Fornas dan kepatuhan obat | todo | - | `docs/bukti/L12.md` | Terpisah dari obat laporan sendiri. |
| L13 | Kebiasaan dan ringkasan wajib FB-5 | todo | - | `docs/bukti/L13.md` | Ambang belum diputus, bukan fitur opsional. |
| L14 | Timeline tunggal FR-11 + FR-13 | todo | - | `docs/bukti/L14.md` | Hanya data pasien yang masuk. |
| L15 | Browser lengkap dan regresi keamanan | todo | - | `docs/bukti/L15.md` | Chrome, IDOR, CSRF, sesi dan role. |
| L16 | Beban, UAT dan bukti rilis | todo | - | `docs/bukti/L16.md` | Cutover produksi perlu izin terpisah. |
| L17 | Opsional: konten resmi dan log akun | todo | - | `docs/bukti/L17.md` | Tidak memblokir L16; persetujuan rilis terpisah. |

Tanggal akhir kalender belum dikonfirmasi: gunakan hari relatif 1–10, bukan
menganggap tenggat 2 November dalam PRD telah berubah otomatis.
