# Sistem Informasi Janji Temu Klinik (Klinik Sehat)
Sebuah rancangan aplikasi web untuk membuat janji temu dan pemeriksaan.


---

## 1. Peran & Fitur Utama

1. **Tamu (Guest)**
   - Mengakses halaman beranda publik (`/index.html`) untuk melihat profil klinik, daftar poliklinik, dan dokter yang aktif berpraktik.
   - Mendaftarkan akun pasien baru (`/daftar.html`) serta melakukan pengaturan ulang kata sandi via email (`/lupa-password.html` & `/reset-password.html`).
2. **Pasien (`role: pasien`)**
   - Mengajukan janji temu pemeriksaan baru berdasarkan poliklinik, dokter aktif, tanggal kunjungan, dan keluhan (`/pasien/janji-temu.html`).
   - Memantau status janji temu (`Terjadwal`, `Selesai`, `Dibatalkan`) beserta catatan/rekomendasi klinik apabila terjadi penyesuaian jadwal dokter.
   - Melihat riwayat pemeriksaan yang telah selesai beserta catatan medis dokter (`/pasien/riwayat.html`).
   - Memantau jadwal kontrol rutin pasca-pemeriksaan (`/pasien/jadwal-kontrol.html`).
   - Memperbarui profil pribadi dan kata sandi (`/pasien/profil.html`).
3. **Admin Klinik (`role: admin`)**
   - Mengelola seluruh janji temu pasien dengan filter tanggal, tipe kunjungan, dan status (`/admin/kelola-janji.html`).
   - Menyelesaikan pemeriksaan dengan mengisi catatan dokter (`doctor_notes`) atau membatalkan janji bila jadwal bentrok disertai rekomendasi dokter pengganti.
   - Menetapkan jadwal kontrol rutin berikutnya untuk pasien.
   - Mengelola master data poliklinik, menambah dokter baru, serta mengaktifkan/menonaktifkan status praktik dokter (`is_active`) (`/admin/master-data.html`).
---

## 2. Arsitektur & Stack Teknologi

Sistem memisahkan lapisan antarmuka statis dan layanan backend secara tegas (**Decoupled Client–Server via JSON API**):

### A. Frontend (`public/`)
- **Teknologi:** HTML5 semantik, CSS3 murni ([`public/css/style.css`](public/css/style.css)), dan Vanilla JavaScript (ES6+) menggunakan `fetch()`.
- **Tanpa Langkah Build:** Tidak menggunakan Blade, tidak menggunakan framework UI (React/Vue/Tailwind), dan **tidak memerlukan `npm run build` atau Vite**. Seluruh aset statis disajikan langsung dari direktori `public/`.
- **Desain & Aksesibilitas:** Mengikuti token visual [`DESIGN.md`](DESIGN.md) dengan tipografi **Inter**, kartu datar tanpa bayangan, kontras warna terverifikasi WCAG AA (≥ 4.5:1), sasaran sentuh minimal 44–48 px, dukungan navigasi papan ketik (`:focus-visible`, `.skip-link`), serta format tanggal lokal Indonesia (`Intl.DateTimeFormat('id-ID')`).

### B. Backend (`app/`, `routes/api.php`)
- **Teknologi:** PHP 8.4, **Laravel 12** sebagai **JSON API murni** ([`routes/api.php`](routes/api.php)), dan Eloquent ORM.
- **Autentikasi & Otorisasi:**
  - **Laravel Sanctum** (Personal Access Token). Token dikirim oleh frontend melalui header `Authorization: Bearer <token>` yang disimpan di `localStorage`.
  - Proteksi peran melalui [`RoleMiddleware`](app/Http/Middleware/RoleMiddleware.php) (`role:pasien` dan `role:admin`) serta pembatasan laju (*rate limiting* `throttle:15,1`) pada endpoint autentikasi publik.
  - Pengaturan ulang kata sandi menggunakan broker `Password` Laravel dan [`ResetPasswordNotification`](app/Notifications/ResetPasswordNotification.php) melalui SMTP, disertai pencabutan seluruh token aktif saat kata sandi berhasil diubah.

### C. Database (`database/`)
- **Teknologi:** **PostgreSQL Serverless (Neon)** pada skema terisolasi `klinik` (`search_path=klinik`).
- **Koneksi Pooler:** Menggunakan koneksi pooled PgBouncer Neon (`DB_URL` dengan `sslmode=require` dan `PDO::ATTR_EMULATE_PREPARES = true` pada [`config/database.php`](config/database.php)).
- **Skema Tabel:**
  - **4 Tabel Bisnis Utama** ([`0001_01_01_000000_create_users_table.php`](database/migrations/0001_01_01_000000_create_users_table.php)):
    1. `klinik.users` — Data pengguna (`pasien` dan `admin`), kontak, tanggal lahir, dan alamat.
    2. `klinik.polyclinics` — Master data poliklinik layanan.
    3. `klinik.doctors` — Master data dokter per poliklinik beserta status ketersediaan praktik (`is_active`).
    4. `klinik.appointments` — Transaksi janji temu (`janji_baru` / `kontrol_rutin`), status (`terjadwal` / `selesai` / `dibatalkan`), keluhan (`complaint`), dan catatan dokter (`doctor_notes`).
  - **2 Tabel Infrastruktur Autentikasi**:
    5. `klinik.personal_access_tokens` — Token sesi API Laravel Sanctum.
    6. `klinik.password_reset_tokens` — Token pengaturan ulang kata sandi via email.

### D. Pengujian & Kualitas Kode
- **PHPUnit Feature Test:** Menguji seluruh endpoint API, validasi, otorisasi peran, dan skema database (`tests/Feature/*`).
- **Laravel Pint:** Pemeriksaan standar gaya kode PHP (`vendor/bin/pint --test`).
- **Pemeriksa Dokumentasi:** Skrip Node.js ([`scripts/check-docs.mjs`](scripts/check-docs.mjs)) untuk memvalidasi papan status T1–T5 dan keutuhan seluruh tautan antardokumen.

---

## 3. Struktur Direktori Utama

```text
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── Patient/
│   │   │   │   ├── ProfileController.php
│   │   │   │   ├── AppointmentController.php
│   │   │   │   ├── HistoryController.php
│   │   │   │   └── ControlScheduleController.php
│   │   │   └── Admin/
│   │   │       ├── AppointmentManagementController.php
│   │   │       ├── PolyclinicController.php
│   │   │       └── DoctorController.php
│   │   └── Middleware/RoleMiddleware.php
│   ├── Models/ (User, Polyclinic, Doctor, Appointment, PersonalAccessToken)
│   └── Notifications/ResetPasswordNotification.php
├── database/
│   ├── migrations/ (Skema 4 tabel utama + Sanctum + Password Reset)
│   └── seeders/DatabaseSeeder.php
├── public/
│   ├── index.html                  # Beranda publik (Tamu)
│   ├── login.html                  # Halaman masuk
│   ├── daftar.html                 # Pendaftaran akun pasien baru
│   ├── lupa-password.html          # Permintaan tautan reset kata sandi
│   ├── reset-password.html         # Pengaturan kata sandi baru
│   ├── pasien/
│   │   ├── janji-temu.html         # Buat & pantau janji temu pasien
│   │   ├── riwayat.html            # Riwayat pemeriksaan selesai
│   │   ├── jadwal-kontrol.html     # Jadwal kontrol rutin pasien
│   │   └── profil.html             # Profil & ubah kata sandi pasien
│   ├── admin/
│   │   ├── kelola-janji.html       # Kelola janji temu & buat jadwal kontrol
│   │   └── master-data.html        # Kelola poliklinik & status aktif dokter
│   ├── css/style.css               # Stylesheet utama sesuai DESIGN.md
│   └── js/ (api.js, auth.js, pasien.js, admin.js)
├── routes/
│   ├── api.php                     # Seluruh endpoint JSON API (/api/*)
│   └── web.php                     # Pengalihan rute "/" ke "/index.html"
└── tests/Feature/                  # Pengujian otomatis API & database
```

---

## 4. Cara Menjalankan & Menguji Secara Lokal

### Prasyarat
- PHP 8.4 dengan ekstensi `pdo_pgsql` aktif.
- Composer.
- Konfigurasi `.env` dengan koneksi PostgreSQL Neon (`DB_URL`) pada skema `klinik`.

### Menjalankan Server Aplikasi
Karena frontend menggunakan HTML/CSS/JS murni di `public/`, tidak diperlukan perintah build frontend:

```powershell
composer install
php artisan migrate --seed
php artisan serve
```

Akses aplikasi di browser melalui:
- **Beranda Publik (Tamu):** `http://127.0.0.1:8000` atau `http://127.0.0.1:8000/index.html`
- **Halaman Masuk:** `http://127.0.0.1:8000/login.html`
- **Pendaftaran Pasien:** `http://127.0.0.1:8000/daftar.html`

### Menjalankan Pengujian & Pemeriksaan Kualitas
```powershell
php artisan test              # Menjalankan 30 feature test PHPUnit
vendor/bin/pint --test        # Memeriksa format kode PHP
node scripts/check-docs.mjs   # Memvalidasi papan status & tautan dokumentasi
```

---

## 5. Panduan Dokumentasi Proyek

Seluruh dokumentasi teknis dikelola di dalam direktori [`docs/`](docs/README.md) dengan hierarki sumber kebenaran sebagai berikut:

| Dokumen | Peran & Isi |
|---|---|
| **[RANCANGAN FINAL](docs/RANCANGANFINAL.md)** | **Acuan utama (Master Reference):** kebutuhan fungsional, arsitektur, skema 4 tabel inti, daftar endpoint API, dan rencana kerja 5 tahap (T1–T5). Dokumen ini bersifat tetap dan tidak boleh diubah. |
| **[Catatan Implementasi](docs/catatan-implementasi.md)** | Keputusan teknis untuk merinci celah implementasi (registrasi mandiri pasien, alur reset kata sandi, toggle status aktif dokter `PATCH /api/admin/dokter/{id}`, aturan validasi, dan konfigurasi PgBouncer Neon). |
| **[DESIGN.md](DESIGN.md)** | Spesifikasi arah visual, token warna, tipografi `Inter`, tata letak komponen, standar aksesibilitas WCAG AA, dan naskah UI. |
| **[Status Tugas](docs/status-tugas.md)** | Papan status tunggal pengerjaan tahap **T1–T5** (seluruh tahap berstatus `done`). |
| **[Bukti Tahap (`docs/bukti/`)](docs/bukti/README.md)** | Catatan bukti pengujian aktual untuk setiap tahapan: [T1](docs/bukti/T1.md), [T2](docs/bukti/T2.md), [T3](docs/bukti/T3.md), [T4](docs/bukti/T4.md), dan [T5](docs/bukti/T5.md). |
| **Audit UI/UX (`docs/audit/anti-slop/`)** | Laporan pemeriksaan kualitas antarmuka dan aksesibilitas: [Audit 001](docs/audit/anti-slop/audit-001-2026-11-02.md), [Tindak Lanjut 001](docs/audit/anti-slop/audit-001-tindak-lanjut-2026-11-02.md), dan [Audit & Tindak Lanjut 002](docs/audit/anti-slop/audit-002-2026-11-02.md). |
| **Keputusan Arsitektur (`docs/keputusan/`)** | Catatan keputusan arsitektur: [ADR 0001 (Playwright Chrome)](docs/keputusan/0001-chrome-bawaan-playwright.md) dan [ADR 0003 (Peralihan ke RANCANGAN FINAL)](docs/keputusan/0003-rancangan-final.md). |
| **[AGENTS.md](AGENTS.md)** | Aturan kerja agen, batasan ruang lingkup, dan guardrail keamanan proyek. |

> **Catatan Arsip Sejarah:** Direktori `docs/rancangan/` merupakan salinan *read-only* dari dokumen rancangan awal (PRD v0.3 dan wireframe lama). Isi direktori tersebut bersifat historis, telah digantikan sepenuhnya oleh **[RANCANGAN FINAL](docs/RANCANGANFINAL.md)**, dan tidak digunakan sebagai acuan implementasi.
