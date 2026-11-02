# Dokumen Rancangan Terpadu: Sistem Janji Temu Kesehatan (Versi Ramping)

**Tanggal:** 2 November 2026

**Status:** Dokumen Kanonik Tunggal (Menggantikan seluruh dokumen `prd-v0.3`, `api-contract`, `database-schema`, `panduan-arsitektur`, dan `rencana-agen` versi sebelumnya).

## 1. Gambaran Umum & Batasan Proyek (PRD)

### 1.1 Tujuan Produk

Aplikasi web ini berfungsi murni sebagai **jembatan akses layanan kesehatan untuk pembuatan janji temu**. Pengguna (Pasien) dapat mendaftarkan janji temu, melihat riwayat pemeriksaan, dan memantau jadwal kontrol rutin berikutnya. Admin bertugas memfasilitasi data master (Poli & Dokter) serta memperbarui hasil akhir pemeriksaan (menyelesaikan janji temu, mengisi catatan pemeriksaan, dan menjadwalkan kontrol berikutnya bila disarankan dokter).

### 1.2 Fitur Utama Berdasarkan Peran

#### A. Peran Pengguna (Pasien)

    
2. **Janji Temu:** Membuat janji temu baru dengan memilih poli, dokter terkait, dan tanggal pemeriksaan.
    
3. **Riwayat Pemeriksaan:** Melihat catatan pemeriksaan sebelumnya yang telah selesai (tanggal, poli, dokter yang menangani, dan catatan dokter).
    
4. **Jadwal Kontrol:** Melihat jadwal pemeriksaan berikutnya apabila dokter menyarankan kontrol rutin.
    
5. **Profil Pengguna:** Melihat dan mengubah informasi dasar akun atau data diri (nama, nomor telepon, tanggal lahir, alamat).
    

#### B. Peran Admin (Staf Klinik)

1. **Login & Logout:** Masuk ke panel admin menggunakan akun admin.
    
2. **Kelola Janji Temu & Pemeriksaan:** Melihat daftar janji temu yang masuk, mengubah statusnya menjadi "Selesai" setelah pasien diperiksa, menambahkan catatan dokter/pemeriksaan, serta membuatkan "Jadwal Kontrol" berikutnya untuk pasien jika disarankan dokter.
    
3. **Data Master Poli & Dokter:** Mengelola daftar poli dan dokter agar dapat dipilih oleh pengguna saat membuat janji temu.
    

### 1.3 Fitur yang Dihapus (Di Luar Ruang Lingkup / Non-Goals)

Untuk menjaga fokus proyek, fitur-fitur dari rancangan lama berikut **dihapus sepenuhnya**:

- Sistem tiket antrean harian, nomor estimasi vs nomor final, dan proses _check-in_ di lokasi.
- Tawar-menawar perubahan jadwal (_reschedule proposal_) beserta penguncian slot sementara (TTL).
- Pencatatan resep obat klinis, katalog Fornas, dan pelacak kepatuhan minum obat harian.
- Pencatatan kebiasaan harian (jam tidur, hidrasi, aktivitas fisik).
- Panel artikel/konten kesehatan statis (WHO/Kemenkes).
- _Append-only audit log_ kompleks dan _account activity log_.
    

## 2. Arsitektur Teknis (HTML/CSS/JS Murni + Laravel JSON API)

Aplikasi dibangun dengan memisahkan tampilan antarmuka murni (**HTML, CSS, dan Vanilla JavaScript**) dari logika server (**Laravel sebagai penyedia JSON API**), tanpa menggunakan _template engine_ Blade:

- **Frontend (Client-Side):** File `.html`, `.css`, dan `.js` murni yang diletakkan di dalam folder `public/`. JavaScript menggunakan `fetch()` untuk mengambil data JSON dari server dan memanipulasi DOM (menampilkan tabel riwayat, daftar poli, jadwal kontrol, serta mengirim form).
    
- **Backend (Server-Side API):** Laravel hanya bertugas menerima request HTTP, memvalidasi data, mengakses database, dan mengembalikan respons berformat **JSON** (`response()->json(...)`).
    
- **Database & ORM:** PostgreSQL (Neon) diakses menggunakan Laravel Eloquent ORM.
    
- **Autentikasi & Otorisasi:** Menggunakan sesi/token (Laravel Session atau Sanctum Token disimpan di `localStorage`/cookie) dengan middleware sederhana untuk memisahkan hak akses endpoint `pasien` dan `admin`.
    

### Struktur Direktori Inti

```
app/
├── Http/
│   ├── Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── Patient/
│   │   │   ├── AppointmentController.php
│   │   │   ├── ControlScheduleController.php
│   │   │   ├── HistoryController.php
│   │   │   └── ProfileController.php
│   │   └── Admin/
│   │       ├── AppointmentManagementController.php
│   │       ├── DoctorController.php
│   │       └── PolyclinicController.php
│   └── Middleware/
│       └── RoleMiddleware.php
├── Models/
│   ├── User.php
│   ├── Polyclinic.php
│   ├── Doctor.php
│   └── Appointment.php
public/                         # Seluruh kode Frontend murni berada di sini
├── login.html
├── pasien/
│   ├── janji-temu.html
│   ├── riwayat.html
│   ├── jadwal-kontrol.html
│   └── profil.html
├── admin/
│   ├── kelola-janji.html
│   └── master-data.html
├── css/
│   └── style.css               # CSS murni untuk seluruh halaman
└── js/
    ├── api.js                  # Helper fetch() ke backend Laravel
    ├── auth.js                 # Logika login, logout, dan cek role
    ├── pasien.js               # DOM manipulation untuk halaman pasien
    └── admin.js                # DOM manipulation untuk halaman admin
routes/
└── api.php                     # Seluruh endpoint JSON API terdaftar di sini
```

## 3. Skema Database (4 Tabel Inti)

Seluruh kebutuhan aplikasi untuk kedua peran di atas cukup ditopang oleh **4 tabel** berikut:

### 3.1 Tabel `users`

Menyimpan data kredensial login sekaligus profil dasar pengguna dan admin.

|   |   |   |
|---|---|---|
|**Nama Kolom**|**Tipe Data**|**Keterangan**|
|`id`|`BIGINT` / `UUID` (PK)|Primary Key|
|`name`|`VARCHAR(255)`|Nama lengkap pengguna/admin|
|`email`|`VARCHAR(255)` (Unique)|Email untuk login|
|`password`|`VARCHAR(255)`|Hash kata sandi|
|`role`|`ENUM('pasien', 'admin')`|Default: `'pasien'`|
|`phone_number`|`VARCHAR(30)` (Nullable)|Nomor telepon (Profil)|
|`birth_date`|`DATE` (Nullable)|Tanggal lahir (Profil)|
|`address`|`TEXT` (Nullable)|Alamat domisili (Profil)|
|`created_at` & `updated_at`|`TIMESTAMP`|Waktu pembuatan & pembaruan|

### 3.2 Tabel `polyclinics` (Data Master Poli)

Menyimpan daftar poli yang tersedia di layanan kesehatan.

|   |   |   |
|---|---|---|
|**Nama Kolom**|**Tipe Data**|**Keterangan**|
|`id`|`BIGINT` / `UUID` (PK)|Primary Key|
|`name`|`VARCHAR(255)`|Nama poli (misal: Poli Umum, Poli Gigi, Poli Penyakit Dalam)|
|`description`|`TEXT` (Nullable)|Keterangan singkat poli|
|`created_at` & `updated_at`|`TIMESTAMP`|Waktu pembuatan & pembaruan|

### 3.3 Tabel `doctors` (Data Master Dokter)

Menyimpan daftar dokter yang bertugas pada poli tertentu.

|   |   |   |
|---|---|---|
|**Nama Kolom**|**Tipe Data**|**Keterangan**|
|`id`|`BIGINT` / `UUID` (PK)|Primary Key|
|`polyclinic_id`|`FK -> polyclinics.id`|Relasi ke tabel poli|
|`name`|`VARCHAR(255)`|Nama lengkap dokter beserta gelar|
|`is_active`|`BOOLEAN`|Status aktif dokter (Default: `true`)|
|`created_at` & `updated_at`|`TIMESTAMP`|Waktu pembuatan & pembaruan|

### 3.4 Tabel `appointments` (Janji Temu, Riwayat, & Jadwal Kontrol)

Satu tabel terpadu untuk mencatat seluruh siklus pemeriksaan.

|   |   |   |
|---|---|---|
|**Nama Kolom**|**Tipe Data**|**Keterangan**|
|`id`|`BIGINT` / `UUID` (PK)|Primary Key|
|`user_id`|`FK -> users.id`|Pasien pemilik janji temu|
|`polyclinic_id`|`FK -> polyclinics.id`|Poli yang dipilih|
|`doctor_id`|`FK -> doctors.id`|Dokter yang menangani|
|`appointment_date`|`DATE`|Tanggal pemeriksaan|
|`type`|`ENUM('janji_baru', 'kontrol_rutin')`|`'janji_baru'` dibuat pasien; `'kontrol_rutin'` dijadwalkan admin/dokter|
|`status`|`ENUM('terjadwal', 'selesai', 'dibatalkan')`|Status pemeriksaan (Default: `'terjadwal'`)|
|`complaint`|`TEXT` (Nullable)|Keluhan singkat yang diisi pasien saat membuat janji|
|`doctor_notes`|`TEXT` (Nullable)|Catatan hasil pemeriksaan yang diisi oleh Admin setelah diperiksa dokter|
|`created_at` & `updated_at`|`TIMESTAMP`|Waktu pembuatan & pembaruan|

> **Logika Pembacaan Data pada Tabel `appointments`:**
> 
> - **Menu Janji Temu (Pasien):** Menampilkan daftar dengan `status = 'terjadwal'` dan `type = 'janji_baru'`.
>     
> - **Menu Riwayat Pemeriksaan (Pasien):** Menampilkan daftar dengan `status = 'selesai'` (menampilkan tanggal, poli, dokter, dan `doctor_notes`).
>     
> - **Menu Jadwal Kontrol (Pasien):** Menampilkan daftar dengan `type = 'kontrol_rutin'` dan `status = 'terjadwal'`.
>     

## 4. Kontrak Endpoint JSON API (`routes/api.php`)

Seluruh komunikasi antara file HTML/JS dan backend Laravel dilakukan menggunakan `fetch()` dengan format request dan response **JSON** (`Accept: application/json`).

### 4.1 Endpoint Autentikasi & Data Referensi

|   |   |   |   |
|---|---|---|---|
|**Method**|**URI**|**Role**|**Fungsi & Respons JSON**|
|`POST`|`/api/login`|Tamu|Menerima `email` & `password`. Mengembalikan status sukses, data `user` (termasuk `role`), dan sesi/token agar JS dapat mengarahkan ke `/pasien/janji-temu.html` atau `/admin/kelola-janji.html`.|
|`POST`|`/api/logout`|Pasien, Admin|Menghapus sesi/token aktif; JS mengarahkan pengguna kembali ke `/login.html`.|
|`GET`|`/api/master-poli`|Pasien, Admin|Mengembalikan daftar JSON seluruh Poli beserta daftar Dokter aktif di dalamnya untuk mengisi `<select>` pada form HTML.|

### 4.2 Endpoint Area Pengguna (Role: `pasien`)

|   |   |   |
|---|---|---|
|**Method**|**URI**|**Fungsi & Aturan JSON**|
|`GET`|`/api/janji-temu`|Mengambil daftar JSON janji temu aktif (`status = 'terjadwal'`, `type = 'janji_baru'`) milik pengguna yang sedang login.|
|`POST`|`/api/janji-temu`|Menerima input `polyclinic_id`, `doctor_id`, `appointment_date`, dan `complaint`. Menyimpan janji temu baru ke database.|
|`GET`|`/api/riwayat-pemeriksaan`|Mengambil daftar JSON pemeriksaan milik sendiri yang berstatus `'selesai'` beserta nama dokter, poli, dan `doctor_notes`.|
|`GET`|`/api/jadwal-kontrol`|Mengambil daftar JSON jadwal pemeriksaan berikutnya (`type = 'kontrol_rutin'`, `status = 'terjadwal'`).|
|`GET`|`/api/profil`|Mengambil informasi dasar akun dan data diri pengguna saat ini untuk ditampilkan di input form HTML.|
|`PATCH`|`/api/profil`|Menerima dan memperbarui `name`, `phone_number`, `birth_date`, `address`, atau `password`.|

### 4.3 Endpoint Area Admin (Role: `admin`)

|   |   |   |
|---|---|---|
|**Method**|**URI**|**Fungsi & Aturan JSON**|
|`GET`|`/api/admin/janji-temu`|Mengambil seluruh daftar janji temu & jadwal kontrol semua pasien (mendukung filter `?date=` atau `?status=`).|
|`PATCH`|`/api/admin/janji-temu/{id}`|Memperbarui `status` pemeriksaan (misal menjadi `'selesai'`) dan menyimpan `doctor_notes`.|
|`POST`|`/api/admin/jadwal-kontrol`|Membuat jadwal pemeriksaan berikutnya (`type = 'kontrol_rutin'`) untuk `user_id` (pasien) tertentu sesuai anjuran dokter.|
|`POST`|`/api/admin/poli`|Menambahkan data Poli baru ke database.|
|`POST`|`/api/admin/dokter`|Menambahkan data Dokter baru yang terhubung ke `polyclinic_id`.|

## 5. Rencana Kerja Eksekusi & Pengujian

Pengerjaan proyek dibagi menjadi **5 tahapan berurutan (Milestone)**:

|                                            |                                                                                                                                                                                             |                                                                                                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tahap**                                  | **Fokus Pengerjaan**                                                                                                                                                                        | **Kriteria Selesai (Acceptance Criteria)**                                                                                                                                                                              |
| **Tahap 1: Fondasi & Database**            | Setup Laravel, konfigurasi koneksi DB, buat 4 migrasi tabel (`users`, `polyclinics`, `doctors`, `appointments`), dan buat `DatabaseSeeder` (1 akun Admin, 2 akun Pasien, 3 Poli, 5 Dokter). | Perintah `php artisan migrate --seed` berhasil dijalankan tanpa error.                                                                                                                                                  |
| **Tahap 2: API Auth & Halaman Login HTML** | Buat endpoint `/api/login`, `/api/logout`, `RoleMiddleware`, serta halaman `public/login.html` + `auth.js`.                                                                                 | Pengguna bisa login dari `login.html` menggunakan `fetch()`, diarahkan ke halaman HTML sesuai rolenya, dan ditolak (401/403) jika mengakses API role lain.                                                              |
| **Tahap 3: Fitur Profil Pengguna**         | Buat endpoint `GET/PATCH /api/profil` dan halaman `public/pasien/profil.html`.                                                                                                              | Data diri tampil otomatis di form HTML saat halaman dibuka, dan perubahan tersimpan ke database tanpa error saat tombol simpan diklik.                                                                                  |
| **Tahap 4: Janji Temu & Panel Admin**      | Buat endpoint & halaman HTML pembuatan janji temu pasien (`janji-temu.html`) serta halaman kelola admin (`kelola-janji.html` & `master-data.html`).                                         | Pasien bisa membuat janji & tanggal lalu menyimpan janji; Admin bisa melihat janji tersebut, menyelesaikannya dengan catatan dokter, apabila terjadi bentrok admin akan menyarankan pengguna untuk memilih dokter lain. |
| **Tahap 5: Riwayat & Jadwal Kontrol**      | Buat endpoint & halaman HTML Riwayat Pemeriksaan (`riwayat.html`) dan Jadwal Kontrol (`jadwal-kontrol.html`).                                                                               | Pemeriksaan yang diselesaikan admin tampil di tabel `riwayat.html` pasien; Jadwal kontrol yang dibuat admin tampil di `jadwal-kontrol.html` pasien.                                                                     |
