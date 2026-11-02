# Evaluasi dan Rencana Hosting PHP Laravel (L01 & L04)

Dokumen ini memetakan kelayakan lingkungan hosting produksi/staging untuk aplikasi Laravel, mengevaluasi platform penyedia, dan menetapkan prasyarat arsitektur sesuai keputusan [ADR 0002](../keputusan/0002-migrasi-laravel.md).

---

## 1. Prasyarat Teknis Hosting Laravel

Aplikasi membutuhkan runtime server dengan kriteria minimum:
1. **PHP Runtime:** PHP 8.3+ (Rekomendasi: PHP 8.4) dengan ekstensi `pdo_pgsql`, `pgsql`, `openssl`, `mbstring`, `tokenizer`, `xml`, `curl`.
2. **Web Server / Document Root:** Web server (Nginx/Apache/Caddy) yang mengarahkan document root ke direktori `/public`.
3. **Writable Directory:** Direktori `storage/` dan `bootstrap/cache/` wajib memiliki izin tulis (*writable*) untuk sesi file/cookie, view compilation, cache, dan log aplikasi.
4. **Koneksi Keluar TLS:** Kemampuan inisiasi koneksi keluar terenkripsi TLS (SSL mode `require`) menuju endpoint PostgreSQL Neon.
5. **Scheduler & Worker (Opsional/Background):** Kemampuan menjalankan cron job `php artisan schedule:run` per menit.
6. **HTTPS Otomatis:** Sertifikat SSL/TLS otomatis tanpa biaya tambahan.
7. **Batas Biaya Rp0:** Pembuktian penggunaan tier gratis atau kredit awal resmi tanpa tagihan tak terduga.

---

## 2. Perbandingan Platform Calon Hosting

| Kriteria | Railway | Render | Fly.io | Koyeb |
|---|---|---|---|---|
| **Dukungan PHP 8.4** | Ya (Nixpacks / Dockerfile) | Ya (Native / Docker) | Ya (Dockerfile) | Ya (Buildpack / Docker) |
| **Document Root /public** | Mudah (`NIXPACKS_PHP_ROOT_DIR=public`) | Mudah (`publish: public`) | Via Caddy / Nginx conf | Mudah (`PORT=8000`) |
| **Storage Persisten** | Ya (Volume) | Ya (Disk mount) | Ya (Volume) | Ephemeral / Volume |
| **Koneksi Neon TLS** | Ya (Egress lancar) | Ya (Egress lancar) | Ya (Egress lancar) | Ya (Egress lancar) |
| **Paket Gratis (Rp0)** | Trial kredit $5 / bulan | Free tier (spin down jika idle) | Free allowance | Free nano instance |
| **HTTPS Otomatis** | Ya (Let's Encrypt bawaan) | Ya (Bawaan) | Ya (Bawaan) | Ya (Bawaan) |

### Rekomendasi Pilihan:
* **Pilihan Utama (PaaS):** **Railway / Render** dengan Dockerfile/Nixpacks minimalis yang mengeksekusi `php artisan serve --host=0.0.0.0 --port=$PORT` atau Nginx+PHP-FPM.
* **Prosedur Deployment:**
  1. Build aset frontend: `npm ci && npm run build`
  2. Setup dependensi: `composer install --no-dev --optimize-autoloader`
  3. Cache konfigurasi & route: `php artisan config:cache && php artisan route:cache && php artisan view:cache`
  4. Health check endpoint: `/up` (merespons HTTP 200)

---

## 3. Strategi Keamanan & Kerahasiaan

1. **Pemisahan Environment:** Seluruh rahasia (`APP_KEY`, kredensial Neon DB `DB_URL`/`DB_PASSWORD`) dimasukkan via panel environment variable platform, **tidak pernah di-commit ke Git**.
2. **Akses Root Tertutup:** Hanya direktori `public/` yang terekspos ke internet. Berkas `.env`, direktori `storage/`, `docs/`, `database/`, dan `tests/` terlindung dari akses publik web.

---

## 4. Verifikasi Gerbang Parsial Login & Sesi (L04)

1. **Rotasi Session ID & Proteksi CSRF:**
   - Sesi login meregenerasi ID sesi (`session()->regenerate()`) untuk mencegah serangan *session fixation*.
   - Setiap formulir Blade memuat token CSRF (`@csrf`), diverifikasi dengan aman oleh middleware `ValidateCsrfToken`.
2. **Penegakan Server-Side Idle Timeout 15 Menit:**
   - Middleware `App\Http\Middleware\EnforceIdleTimeout` secara ketat memeriksa waktu aktivitas terakhir di server.
   - Sesi terputus otomatis setelah 900 detik tidak aktif dan pengguna dialihkan ke `/masuk`.
3. **Pemisahan Role & Dashboard:**
   - Pasien diarahkan ke `/beranda` dan ditolak (403) bila mencoba mengakses `/admin`.
   - Admin diarahkan ke `/admin`.
4. **Verifikasi Browser E2E:**
   - Teruji secara end-to-end pada Google Chrome melalui Playwright (`tests/e2e/auth.spec.ts` dan `tests/e2e/foundation.spec.ts`).
