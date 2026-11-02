# Bukti penataan dokumentasi dan arsip

Tanggal: 2 November 2026. Jenis pekerjaan: dokumentasi, pengarsipan dan
validasi statis. **Bukan implementasi L01–L17 atau hasil uji Laravel.**
Tidak ada commit pada sesi ini.

## Cakupan yang dikerjakan

- Catat keputusan Laravel/Blade HTML/CSS biasa/JS vanilla, PostgreSQL Neon,
  Eloquent, validasi Laravel, PHPUnit, Pint dan Playwright Chrome dalam ADR.
- Perbarui README, aturan agen, indeks docs, arsitektur, route web/form,
  strategi data, peta FR, gerbang backend dan skenario sistem.
- Buat spesifikasi L01–L17 dengan dependensi/path/accept/verify/evidence,
  rencana relatif 10 hari, serta ledger baru. Semua implementasi belum dimulai;
  status hidup tetap hanya di [status-tugas.md](../status-tugas.md).
- Arsipkan kode/uji/aset/config/npm/CI Next dan snapshot dokumen sebelumnya,
  termasuk perubahan lokal B03. Ukuran/SHA-256 136 berkas dicatat sebelum pindah.
- Pertahankan sumber publik katalog, salinan read-only rancangan, konfigurasi
  agen/editor dan arsip lama. Ubah hanya referensi teknis pada DESIGN.md, bukan
  mengesahkan usulan brand, kalender, ambang atau keputusan bisnis.
- Tambah pemeriksa dokumentasi tanpa dependensi `scripts/check-docs.mjs`.

## Pemeriksaan aktual

| Perintah/pemeriksaan | Hasil |
|---|---|
| `git --no-optional-locks status --short` sebelum perubahan | Menemukan perubahan lokal AGENTS/status/B03/config dan berkas untracked; dipertahankan melalui snapshot/arsip, tanpa reset |
| `php --version` | `command not found` pada shell ini; bukan hasil bootstrap lulus |
| `composer --version` | `command not found` pada shell ini |
| `node --version` | v22.19.0 |
| `npm --version` | 10.9.3 |
| Verifikasi SHA-256 setelah copy sebelum sumber src/tests dibuang | 136/136 berkas cocok |
| `node scripts/check-docs.mjs` | Lulus, exit 0: 17 spesifikasi/dependensi tanpa siklus, ledger 17 tugas, 14 FR, 62 route unik berpemilik, 75 tautan lokal pada 19 dokumen, 136 checksum arsip, 14 dokumen read-only identik |
| `node --check scripts/check-docs.mjs` | Lulus, exit 0 |
| `git --no-pager diff --check` | Lulus, exit 0; Git memberi peringatan normalisasi LF/CRLF pada `.gitignore` dan README |

Pembacaan dokumentasi resmi: [instalasi Laravel 13.x](https://laravel.com/docs/13.x/installation)
dan [database](https://laravel.com/docs/13.x/database). Ini rujukan perencanaan,
bukan penetapan bahwa Laravel versi tersebut telah dipasang.

Dua rename direktori src/tests gagal pada filesystem; fallback copy berhasil,
kemudian checksum diperiksa sebelum sumber aktif dibuang. Tidak ada konten
working tree yang dipulihkan paksa ke HEAD. Satu subagen perencana terputus
karena DNS setelah empat dokumen tertulis; koordinator membaca dan meninjau
hasilnya, memperbaiki kontrak Chrome, scope dashboard/bootstrap, dan memeriksa
ulang tugas/dependensi sendiri. Pemeriksaan pertama script docs gagal karena
pemisahan baris hanya LF meninggalkan CR pada Windows; diperbaiki menjadi
pemisahan CRLF/LF lalu seluruh pemeriksaan lulus. Salinan bukti sementara
yang duplikat dengan snapshot `docs/` diverifikasi identik sebelum dibuang.
Tidak ada tahap validasi diam-diam dianggap lulus.

## Yang belum diverifikasi dan kebutuhan pembuka

- PHP/Composer/ekstensi belum dapat dipanggil dari PATH; siapkan runtime di L01.
- Belum ada `artisan`, `composer.json`, aplikasi Laravel, atau manifest npm aktif.
- PHPUnit, Pint, build Vite, Playwright aplikasi, koneksi Neon dan hosting Laravel
  belum dijalankan. Bukti Next.js lama tidak dipakai untuk menutup acceptance.
- Tidak membaca/menyalin `.env` private, menghubungi database, menjalankan
  migration/seed/import, atau mengubah data produksi dalam sesi ini.
- L02 perlu akses aman untuk inventaris/backup/restore terisolasi sebelum L03.
- Keputusan kalender, TTL, check-in, ambang kebiasaan, dan tenggat kalender baru
  masih perlu pemilik. Sisa 10 hari tidak diubah menjadi tanggal asumsi.
- Vault tidak disunting; pemilik perlu menyelaraskan ketentuan teknis sebelum
  sinkron berikutnya. Lingkup produk/privasi tetap mengikuti sumber read-only.
