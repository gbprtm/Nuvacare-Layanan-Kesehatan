# Nuvacare - Sistem Janji Temu Poliklinik Rawat Jalan

Aplikasi web untuk pencatatan dan pengelolaan janji temu rawat jalan di Nuvacare. Sistem ini menghubungkan pasien dan petugas admin klinik dalam satu alur terpadu: pendaftaran mandiri dengan verifikasi WhatsApp OTP, pemilihan jadwal dokter spesialis tanpa antrean fisik, konfirmasi notifikasi jadwal, serta pencatatan riwayat medis dan kontrol lanjutan.

---

## 1. Peran Pengguna dan Fitur

### A. Pengunjung (Tamu)
* **Informasi Layanan:** Melihat profil klinik, daftar poliklinik, serta dokter spesialis aktif di halaman utama (`/index.html`).
* **Pencarian Poli & Dokter:** Menyaring layanan dan jadwal dokter langsung dari kolom pencarian beranda.
* **Pendaftaran Akun:** Mendaftar akun pasien baru dengan verifikasi nomor WhatsApp OTP (`/daftar.html`).
* **Autentikasi:** Masuk ke akun (`/login.html`) menggunakan email dan kata sandi atau akun Google, serta fasilitas atur ulang kata sandi (`/lupa-password.html`).

### B. Pasien
* **Buat Janji Temu:** Memilih poliklinik, dokter aktif, tanggal kunjungan, jam praktik, dan keluhan awal (`/pasien/janji-temu.html`).
* **Perlindungan Jadwal:** Slot waktu dikunci otomatis agar tidak terjadi bentrok pemesanan (*anti-collision*).
* **Pantau Janji Aktif:** Memeriksa status janji temu (`Terjadwal`, `Selesai`, `Dibatalkan`) beserta catatan dokter jika ada perubahan.
* **Riwayat Pemeriksaan:** Melihat catatan medis hasil kunjungan yang telah selesai (`/pasien/riwayat.html`).
* **Jadwal Kontrol Rutin:** Memantau jadwal periksa ulang yang ditetapkan oleh dokter (`/pasien/jadwal-kontrol.html`).
* **Profil Pasien:** Memperbarui data diri, nomor telepon, dan kata sandi (`/pasien/profil.html`).

### C. Petugas Admin
* **Kelola Janji Temu:** Menyaring seluruh janji temu berdasarkan tanggal dan status pemeriksaan (`/admin/kelola-janji.html`).
* **Penyelesaian Pemeriksaan:** Mengubah status janji temu menjadi `selesai` dan memasukkan catatan medis pemeriksaan dokter (`doctor_notes`).
* **Penanganan Jadwal Bentrok:** Membatalkan janji temu jika terjadi kendala operasional, disertai alasan dan rekomendasi dokter pengganti yang dikirim via WhatsApp.
* **Buat Jadwal Kontrol:** Mendaftarkan jadwal kontrol ulang untuk pasien yang memerlukan penanganan berkala.
* **Master Data Poli & Dokter:** Menambah data poliklinik baru, mendaftarkan dokter spesialis, serta mengatur status keaktifan praktik dokter (`/admin/master-data.html`).

---

## 2. Arsitektur Teknis

Sistem menggunakan arsitektur terpisah antara antarmuka dan logika backend (*Decoupled Client-Server*):

```text
[ Browser Client ]  <--- (JSON API via fetch) --->  [ Laravel 12 JSON API ]  <--->  [ Neon PostgreSQL ]
  public/ HTML/CSS/JS                                 routes/api.php + Eloquent       4 Tabel Relasional
```

### A. Frontend (`public/`)
* **Teknologi:** HTML5 semantik, CSS3 murni ([`public/css/style.css`](public/css/style.css)), dan Vanilla JavaScript (ES6+).
* **Tanpa Langkah Build:** Tanpa Blade templating, tanpa framework JavaScript berat, dan tanpa proses kompilasi bundler (Vite/Webpack). Seluruh berkas statis disajikan langsung dari folder `public/`.
* **Desain UI/UX:** Menerapkan sistem desain *Warm Clinical Modernism* ([`DESIGN.md`](DESIGN.md)) dengan tipografi Plus Jakarta Sans dan DM Sans, standar kontras WCAG AA, serta target sentuh minimal 44x44 px.
* **Komunikasi Data:** Modul [`public/js/api.js`](public/js/api.js) menangani seluruh permintaan `fetch()`, injeksi token Sanctum, normalisasi respons, dan pengalihan otomatis saat sesi berakhir (401).

### B. Backend (`app/`, `routes/api.php`)
* **Teknologi:** PHP 8.4 dan **Laravel 12** sebagai penyedia JSON API murni ([`routes/api.php`](routes/api.php)).
* **Autentikasi & Otorisasi:**
  * **Laravel Sanctum:** Token sesi API disimpan pada `localStorage` browser dan dikirim melalui header `Authorization: Bearer <token>`.
  * **RoleMiddleware:** Membatasi akses endpoint secara ketat antara peran `admin` dan `pasien` (akses tanpa izin menghasilkan 403 Forbidden).
  * **Rate Limiting:** Pembatasan laju request (`throttle:15,1`) pada endpoint autentikasi publik untuk mencegah penyalahgunaan.
* **Layanan WhatsApp & OTP:** [`WhatsAppNotificationService.php`](app/Services/WhatsAppNotificationService.php) menangani pengiriman kode OTP pendaftaran serta notifikasi perubahan atau pembatalan jadwal.

### C. Database (`database/`)
* **Teknologi:** **PostgreSQL Serverless (Neon)** pada skema terisolasi `klinik`.
* **Koneksi:** Menggunakan PgBouncer connection pooler dengan konfigurasi `sslmode=require` dan emulasi prepared statements pada [`config/database.php`](config/database.php).
* **4 Tabel Utama:**
  1. `users`: Akun admin dan pasien, kontak, tanggal lahir, dan alamat.
  2. `polyclinics`: Data poliklinik layanan rawat jalan.
  3. `doctors`: Data dokter spesialis terhubung ke poliklinik beserta status aktif praktik (`is_active`).
  4. `appointments`: Transaksi janji temu (`janji_baru` / `kontrol_rutin`), status (`terjadwal` / `selesai` / `dibatalkan`), keluhan, dan catatan dokter.
* **Tabel Token Pendukung:**
  5. `personal_access_tokens`: Token sesi API Laravel Sanctum.
  6. `password_reset_tokens`: Token pengaturan ulang kata sandi.

---

### D. Pengujian dan Verifikasi Mutu

* **Feature Test PHPUnit:** 34 pengujian fitur terotomatisasi dengan 261 asersi pengujian mencakup autentikasi, booking, pencegahan bentrok slot, profil, dan panel admin.
* **Laravel Pint:** Pemeriksaan format kode sesuai standar PSR-12 (`vendor/bin/pint --test`).

---

## 3. Struktur Direktori Proyek

```text
project/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── Patient/ (AppointmentController, ControlScheduleController, HistoryController, ProfileController)
│   │   │   └── Admin/ (AppointmentManagementController, DoctorController, PolyclinicController)
│   │   └── Middleware/RoleMiddleware.php
│   ├── Models/ (User, Polyclinic, Doctor, Appointment)
│   └── Services/WhatsAppNotificationService.php
├── database/
│   ├── migrations/ (Skema 4 tabel utama + token)
│   └── seeders/DatabaseSeeder.php
├── public/
│   ├── index.html                  # Beranda publik Nuvacare
│   ├── login.html & daftar.html    # Halaman masuk dan daftar akun pasien
│   ├── lupa-password.html & reset-password.html
│   ├── pasien/                     # Portal Pasien (janji-temu, riwayat, jadwal-kontrol, profil)
│   ├── admin/                      # Portal Admin (kelola-janji, master-data)
│   ├── css/style.css               # Desain sistem dan token visual
│   ├── js/                         # Script frontend (api.js, auth.js, pasien.js, admin.js)
│   └── images/                     # Banner hero, visual klinik, dan ikon SVG
├── routes/
│   ├── api.php                     # Rute RESTful JSON API
│   └── web.php                     # Pengalihan rute "/" ke "/index.html"
├── tests/Feature/                  # Rangkaian pengujian otomatis PHPUnit
└── docs/                           # Dokumentasi kanonik dan acuan kerja
```

---

## 4. Cara Menjalankan Proyek Secara Lokal

### Prasyarat
* PHP 8.4 dengan ekstensi `pdo_pgsql` aktif.
* Composer.
* Akun PostgreSQL Neon dengan skema `klinik`.

### Langkah Menjalankan Server
1. Pasang dependensi PHP:
   ```bash
   composer install
   ```
2. Siapkan berkas konfigurasi lingkungan:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
3. Sesuaikan variabel koneksi database `DB_URL` di dalam berkas `.env`.
4. Jalankan migrasi tabel dan data seeder:
   ```bash
   php artisan migrate --seed
   ```
5. Jalankan server lokal:
   ```bash
   php artisan serve
   ```
6. Buka aplikasi di browser pada alamat `http://127.0.0.1:8000`.

### Menjalankan Pengujian
```bash
# Menjalankan seluruh pengujian fitur API (34 tests, 261 assertions)
php artisan test

# Memeriksa standarisasi gaya kode PHP
vendor/bin/pint --test
```

---

## 5. Hierarki Dokumentasi Proyek

Dokumentasi lengkap proyek dikelola di dalam folder [`docs/`](docs/):

| Berkas Dokumen | Fungsi dan Isi |
|---|---|
| **[RANCANGAN FINAL](docs/RANCANGANFINAL.md)** | **Sumber kebenaran tunggal (Master Reference):** Menetapkan kebutuhan fungsional, arsitektur, skema tabel, endpoint API, dan batasan ruang lingkup. |
| **[Catatan Implementasi](docs/catatan-implementasi.md)** | Keputusan teknis pendukung: alur registrasi OTP WhatsApp, mekanisme PgBouncer Neon, dan aturan slot jam periksa. |
| **[DESIGN.md](DESIGN.md)** | Panduan token visual, tipografi Plus Jakarta Sans dan DM Sans, palet warna, dan aturan aksesibilitas antarmuka. |
| **[Status Tugas](docs/status-tugas.md)** | Papan pemantauan tahap implementasi T1 sampai T5 (seluruh tahap telah selesai). |
| **[Bukti Tahap (`docs/bukti/`)](docs/bukti/)** | Laporan hasil pengujian aktual per tahap pengerjaan (T1 hingga T5). |
| **[AGENTS.md](AGENTS.md)** | Panduan kerja, batasan teknis, dan aturan guardrail pengembangan. |
