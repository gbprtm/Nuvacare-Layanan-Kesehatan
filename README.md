# Web pengelola kunjungan klinik

Website untuk pasien dan admin klinik: profil kesehatan, jadwal kontrol,
pemesanan janji, antrean, kebiasaan, catatan resep, dan riwayat kunjungan.
Dokter adalah data yang dikelola admin, bukan pengguna aplikasi. Aplikasi
bukan pemberi diagnosis, rekomendasi obat, atau rekam medis terintegrasi.

## Keputusan stack baru

**Laravel + Blade (HTML) + CSS biasa + JavaScript vanilla**, dengan
**PostgreSQL di Neon**. Eloquent untuk akses database, validasi Laravel
untuk server, PHPUnit untuk pengujian backend, dan Playwright Google Chrome
untuk alur browser. Vite membangun aset CSS/JS, bukan framework antarmuka.

Keputusan dan penggantian alat lama ada di
[ADR migrasi](docs/keputusan/0002-migrasi-laravel.md).

## Keadaan saat ini

Repo sudah ditata untuk **memulai migrasi**, belum berisi aplikasi Laravel.
Kode, pengujian, manifest npm, CI dan konfigurasi Next.js sebelumnya sudah
masuk [arsip](docs/migrasi/arsip.md), termasuk pekerjaan lokal yang belum
sempat di-commit. Jangan memakai hasil uji lama sebagai hasil Laravel.

Pada pemeriksaan awal, `php` dan `composer` tidak ditemukan di PATH terminal;
Node.js 22 dan npm 10 tersedia. Belum ada `artisan`/`composer.json`.
**`npm run dev` lama tidak berlaku di root ini.** Tidak ada klaim build,
login, koneksi Neon, atau hosting Laravel telah berhasil.

## Mulai dari sini

1. Baca [panduan bootstrap](docs/migrasi/bootstrap.md), lalu kerjakan **L01**.
2. Ikuti [rencana relatif 10 hari](docs/to-do.md) dan
   [spesifikasi tugas L01–L17](docs/rencana-agen.md).
3. Perbarui hanya [papan status aktif](docs/status-tugas.md).
4. Sebelum menyentuh database lama, kerjakan inventaris/backup **L02**.
   Migrasi dan uji memakai target PostgreSQL terisolasi, bukan produksi.

Perintah Laravel/build/uji ditetapkan dan dibuktikan saat L01. Jangan
menjalankan perintah scaffold di root yang tidak kosong atau menimpa `.env`.
Hosting PHP harus dipilih dan dicoba sejak awal; Vercel lama bukan solusi
yang otomatis berlaku. Tenggat kalender baru belum dikonfirmasi: rencana
memakai hari relatif 1–10 sesuai sisa waktu yang disebut pemilik.

## Dokumentasi

| Butuh | Buka |
|---|---|
| Indeks dan urutan bacaan | [docs/README.md](docs/README.md) |
| Aturan coding agent | [AGENTS.md](AGENTS.md) |
| Arsitektur target | [Panduan arsitektur](docs/panduan-arsitektur.md) |
| Kontrak form/halaman web | [Kontrak route](docs/api-contract.md) |
| Strategi database | [Rencana database](docs/database-schema.md) |
| FR, layar, tugas dan modul | [Peta bagian](docs/peta-bagian.md) |
| Arah visual yang dipertahankan | [DESIGN.md](DESIGN.md) |
| Bukti penataan sesi ini | [Bukti dokumentasi](docs/migrasi/00-penataan.md) |

`docs/rancangan/` tetap salinan read-only dari vault eksternal. Kebutuhan
produk di sana tetap berlaku; ketentuan stack dan rencana Next.js lama
mendapat pengecualian teknis lewat ADR baru. Pemilik perlu menyelaraskan
vault sebelum sinkron berikutnya; agen tidak menyuntingnya dari repo ini.
