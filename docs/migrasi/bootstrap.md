# Memulai L01 dengan aman

Panduan ini adalah rencana pelaksanaan, **bukan hasil instalasi**. Spesifikasi
lengkap dan batas berkas ada di [L01](../rencana-agen.md#l01-siapkan-prasyarat-dan-fondasi-laravel).
Status hidup di [status tugas](../status-tugas.md).

## 1. Periksa runtime sebelum scaffold

Pada pemeriksaan 2 November 2026, shell mengembalikan `command not found`
untuk PHP dan Composer. Node v22.19.0 dan npm 10.9.3 tersedia. Ini berarti
PHP/Composer belum dapat dipanggil dari PATH terminal ini, bukan bukti bahwa
keduanya tidak terpasang di seluruh Windows.

Pemilik dapat menyiapkan PHP/Composer melalui installer tepercaya, misalnya
Laravel Herd Windows, atau instalasi PHP dan Composer biasa. Perubahan sistem,
instalasi administrator, kredensial hosting dan akses Neon bukan bagian sesi
pengarsipan ini. Setelah tersedia, buka terminal baru dan periksa:

```sh
php --version
composer --version
php -m
node --version
npm --version
```

Cocokkan PHP, ekstensi (terutama `pdo_pgsql`) dan Composer dengan versi Laravel
stabil yang didukung hosting. Catat versi pasti dan lockfile di bukti L01.
[Dokumentasi instalasi Laravel 13.x](https://laravel.com/docs/13.x/installation)
telah dibaca sebagai referensi, bukan janji versi yang sudah terpasang.
Jangan memilih starter kit React/Vue/Livewire hanya karena ditawarkan installer.

## 2. Root ini bukan folder kosong

Generate aplikasi dalam staging lokal `_bootstrap/laravel/`, bukan langsung
menimpa root. Nonaktifkan script instalasi yang otomatis membuat SQLite atau
menjalankan migration/seed. Inventaris hasil lalu salin hanya path aplikasi
L01 yang diizinkan. Jangan menyalin `.git`, AGENTS/README scaffold, atau `.env`
hasil generate ke atas milik proyek. `.gitignore` digabung, bukan ditimpa.
Staging harus berada di repo ini, bukan menulis ke vault atau folder luar.

Pertahankan:
- `AGENTS.md`, `README.md`, `DESIGN.md`, `.agents/`, `docs/`, `_arsip/`, `data/`;
- `.env` lama jika ada, tanpa membaca/menyalinnya ke laporan atau menimpanya;
- data katalog publik dan pekerjaan lokal yang telah diarsipkan.

Cache Next `.next/`, `node_modules/`, dan `tsconfig.tsbuildinfo` mungkin masih
ada sebagai artefak ignored. Itu bukan aplikasi aktif. L01 menginventaris
lalu membersihkan/mengganti dependency cache sebelum memasang npm dependency
baru; jangan memakai lockfile/dependency Next sebagai fondasi Vite.

## 3. Target fondasi

Laravel/PHP, Blade HTML, CSS/JS vanilla lewat Vite, PHPUnit dan Pint, serta
Playwright Google Chrome. Hapus referensi Tailwind/React/SQLite bawaan dari
scaffold target jika ada. Test discovery dan CI hanya menargetkan aplikasi
aktif, tidak memindai `_arsip/` atau `docs/rancangan/`.

Sebelum L03, tes fondasi tidak boleh mengharuskan skema domain atau menjalankan
migrasi otomatis. Gunakan konfigurasi sementara yang aman untuk session/cache
fondasi; konfigurasi database/sesi persisten diselesaikan setelah keputusan L02.
Jangan mengaktifkan reset database hanya agar template tes default lulus.

Perintah aplikasi baru diverifikasi **setelah** manifest/tooling dibuat L01:

```sh
composer validate --strict
vendor/bin/pint --test
php artisan test
npm ci && npm run build
npx playwright test tests/e2e/foundation.spec.ts --project=chrome
```

Pakai Google Chrome yang sudah terpasang; jangan mengunduh browser otomatis.
Konfigurasi browser mengikuti [ADR 0001](../keputusan/0001-chrome-bawaan-playwright.md).
Server dev lokal adalah proses foreground yang dijalankan pemilik/runner
terkendali, bukan proses abadi dalam sesi tool agen. Jangan mengklaim perintah
di atas tersedia atau lulus sebelum bootstrap benar-benar dijalankan.

## 4. Hosting dan database adalah gerbang awal

L01 memilih dan mencoba hosting PHP: HTTPS, document root `public/`, writable
storage/cache, versi runtime, aset, koneksi keluar TLS ke Neon, sesi persisten,
dan scheduler. Verifikasi biaya/retensi; paket gratis tidak diasumsikan tersedia.
Jangan mempublikasikan root repo, arsip, backup, `.env` atau dokumen internal.

L02 menginventaris database lama dengan akses read-only, backup dan restore
ke target terisolasi, lalu memutuskan pemetaan. L03 baru menjalankan migration
pada dev/test terisolasi. Panduan database Laravel mendukung URL melalui opsi
`url`/`DB_URL`; nama `DATABASE_URL` Next tidak otomatis dibaca konfigurasi baru.
L01/L02 harus menetapkan mapping konfigurasi, TLS dan koneksi pooled/direct
sesuai versi, tanpa mencetak URL rahasia.

Target akhir hari 2 adalah hosting + koneksi aman + bukti parsial login L04.
Jika runtime/hosting/data belum siap, laporkan blocker saat itu, bukan tunggu
hari 10. Tanggal mulai dan tenggat kalender perlu dikonfirmasi pemilik.
