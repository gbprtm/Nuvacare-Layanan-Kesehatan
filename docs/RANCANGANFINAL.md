# Dokumen Rancangan Terpadu: Sistem Janji Temu Kesehatan (Versi 2.0, Revisi Opsi B)

**Versi:** 2.0 (Revisi Opsi B)

**Tanggal Awal:** 2 November 2026 | **Tanggal Revisi:** 11 November 2026 (Disetujui pemilik)

**Status:** Dokumen Kanonik Tunggal (Menggantikan seluruh dokumen `prd-v0.3`, `api-contract`, `database-schema`, `panduan-arsitektur`, dan `rencana-agen` versi sebelumnya).

**Catatan Revisi (11 November 2026):** Atas persetujuan pemilik proyek atas Opsi B, revisi Versi 2.0 menambahkan pemisahan dua permukaan web (`pasien` dan `staf`), peran staf `dokter` (baca-saja dengan pengajuan pembatalan satuan/massal), RBAC staf (`admin` dan `dokter`) berbasis Laravel Gate/Policy, tabel `cancellation_requests`, serta log perubahan status sederhana `status_change_logs`, sambil mempertahankan seluruh kontrak API pasien dan admin dari Versi 1.0.

## 1. Gambaran Umum & Batasan Proyek (PRD)

### 1.1 Tujuan Produk

Aplikasi web ini berfungsi murni sebagai **jembatan akses layanan kesehatan untuk pembuatan janji temu** dengan pemisahan dua permukaan aplikasi: permukaan **Pasien** dan permukaan **Staf** (Admin dan Dokter). Pengguna (Pasien) dapat mendaftarkan janji temu, melihat riwayat pemeriksaan, dan memantau jadwal kontrol rutin berikutnya. Admin bertugas memfasilitasi data master (Poli & Dokter), mengelola akun staf dokter, menindak pengajuan pembatalan dokter, serta memperbarui hasil akhir pemeriksaan (menyelesaikan janji temu, mengisi catatan pemeriksaan, dan menjadwalkan kontrol berikutnya bila disarankan dokter). Dokter bertugas memantau jadwal janji temu miliknya secara baca-saja dan dapat mengajukan permohonan pembatalan untuk diputuskan oleh Admin.

### 1.2 Fitur Utama Berdasarkan Peran

#### A. Peran Pengguna (Pasien)

    
2. **Janji Temu:** Membuat janji temu baru dengan memilih poli, dokter terkait, dan tanggal pemeriksaan.
    
3. **Riwayat Pemeriksaan:** Melihat catatan pemeriksaan sebelumnya yang telah selesai (tanggal, poli, dokter yang menangani, dan catatan dokter).
    
4. **Jadwal Kontrol:** Melihat jadwal pemeriksaan berikutnya apabila dokter menyarankan kontrol rutin.
    
5. **Profil Pengguna:** Melihat dan mengubah informasi dasar akun atau data diri (nama, nomor telepon, tanggal lahir, alamat).
    

#### B. Peran Admin (Staf Klinik)

1. **Login & Logout:** Masuk ke panel admin pada permukaan staf menggunakan akun admin.
    
2. **Kelola Janji Temu & Pemeriksaan:** Melihat daftar janji temu yang masuk, mengubah statusnya menjadi "Selesai" setelah pasien diperiksa, menambahkan catatan dokter/pemeriksaan, membatalkan atau menjadwalkan ulang janji, serta membuatkan "Jadwal Kontrol" berikutnya untuk pasien jika disarankan dokter.
    
3. **Data Master Poli & Dokter:** Mengelola daftar poli dan dokter agar dapat dipilih oleh pengguna saat membuat janji temu, termasuk membuat serta mengaktifkan atau menonaktifkan akun login dokter.

4. **Tindak Pengajuan Pembatalan & Log Status:** Meninjau antrean pengajuan pembatalan dari dokter, lalu menyetujui (membatalkan janji), menjadwalkan ulang, atau menolak dengan catatan wajib, serta melihat riwayat log perubahan status janji temu.
    

#### C. Peran Dokter (Staf Klinik - Baca-Saja & Pengajuan Pembatalan)

1. **Login & Logout Staf:** Masuk ke portal dokter pada permukaan staf menggunakan akun ber-role `dokter` yang dibuat dan diaktifkan oleh admin (tanpa registrasi publik).

2. **Lihat Janji Temu Milik Sendiri (Data Minimal):** Melihat daftar dan detail janji temu sesuai `doctor_id` miliknya (dengan filter tanggal dan status) menggunakan data minimal: tanggal, jam slot, nama pasien, poli, jenis janji, status janji, status pengajuan terbuka, serta kontak pasien yang disamarkan (`0812****7890`). Keluhan pasien (`complaint`) dan catatan pemeriksaan (`doctor_notes`) tidak ditampilkan.

3. **Ajukan Pembatalan (Satuan & Massal):** Mengajukan permohonan pembatalan untuk janji temu miliknya yang masih berstatus `terjadwal`, baik secara satuan maupun massal untuk cuti dalam rentang maksimal 14 hari, dengan kategori alasan dan alasan tertulis wajib.

4. **Pantau & Tarik Pengajuan:** Melihat daftar dan status pengajuan pembatalannya sendiri beserta catatan keputusan admin, serta menarik kembali pengajuan yang masih berstatus `diajukan`.

5. **Batasan Tegas:** Dokter **TIDAK PERNAH** membatalkan atau menjadwalkan ulang janji temu secara langsung, dan dilarang menulis atau mengubah data klinis (`appointments`), data master (`polyclinics`, `doctors`), maupun data pasien (`users`).

### 1.3 Fitur yang Dihapus (Di Luar Ruang Lingkup / Non-Goals)

Untuk menjaga fokus proyek, fitur-fitur dari rancangan lama berikut **dihapus sepenuhnya**:

- Sistem tiket antrean harian, nomor estimasi vs nomor final, dan proses _check-in_ di lokasi.
- Tawar-menawar perubahan jadwal (_reschedule proposal_) beserta penguncian slot sementara (TTL).
- Pencatatan resep obat klinis, katalog Fornas, dan pelacak kepatuhan minum obat harian.
- Pencatatan kebiasaan harian (jam tidur, hidrasi, aktivitas fisik).
- Panel artikel/konten kesehatan statis (WHO/Kemenkes).
- Audit log kompleks di luar perubahan status janji dan pengajuan pembatalan (log perubahan status sederhana `status_change_logs` diizinkan).
- Registrasi publik untuk akun staf/dokter, serta pencatatan data kependudukan (NIK/KK).
    

## 2. Arsitektur Teknis (Arsitektur Dua Permukaan / Opsi B)

Aplikasi dibangun menggunakan **satu codebase Laravel JSON API dan satu database PostgreSQL Neon (skema `klinik`)**, dengan pemisahan dua permukaan aplikasi (**Opsi B**) antara **Pasien** dan **Staf** (Admin dan Dokter). Antarmuka tetap menggunakan **HTML, CSS, dan Vanilla JavaScript murni** dengan `fetch()`, tanpa _template engine_ Blade, tanpa framework UI, dan tanpa langkah build.

- **Pemisahan Deployment (`APP_SURFACE`):** Satu repo dideploy ke dua host terpisah berdasarkan environment variable `APP_SURFACE`:
  - `APP_SURFACE=pasien` (host placeholder `nuvacare.id`, konfigurasi `vercel.json`): hanya mendaftarkan rute web pasien dan API pasien (`/api/login`, registrasi/OTP/Google pasien, `/api/janji-temu`, `/api/riwayat-pemeriksaan`, `/api/jadwal-kontrol`, `/api/profil`, `/api/public-info`, `/api/master-poli`, `/api/slot-tersedia`). Seluruh rute `/api/admin/*`, `/api/dokter/*`, serta halaman staf tidak didaftarkan (mengembalikan **404**).
  - `APP_SURFACE=staf` (host placeholder `staf.nuvacare.id`, konfigurasi `vercel.staf.json`): hanya mendaftarkan rute web staf (`staf/login.html`, `admin/*`, `dokter/*`), login staf, endpoint `/api/admin/*`, `/api/dokter/*`, `/api/master-poli`, `/api/slot-tersedia`, dan `/api/logout`. Rute registrasi publik, Google Sign-In, OTP pasien, dan endpoint pasien tidak didaftarkan (**404**). Mendukung pembatasan IP opsional melalui `STAFF_ALLOWED_IPS` dan feature flag `FEATURE_DOCTOR_PORTAL`. Hanya deployment staf yang menjalankan perintah kedaluwarsa (`php artisan pengajuan:kedaluwarsa`).
  - `APP_SURFACE=combined` (khusus pengembangan lokal dan pengujian terpadu): mendaftarkan kedua permukaan pada satu host agar mudah diuji, dengan tetap menegakkan validasi token ability (`surface:pasien` vs `surface:staf`), middleware role, dan Gate/Policy RBAC.
- **Penyajian Frontend & Aset Bersama:** Aset statis bersama (CSS, JS, gambar, ikon) diletakkan di `public/`. Halaman HTML khusus pasien berada di `surfaces/pasien/` dan halaman HTML khusus staf (`staf/login.html`, `admin/*`, `dokter/*`) berada di `surfaces/staf/`. Seluruh halaman HTML disajikan murni oleh `routes/web.php` sesuai `APP_SURFACE` (tanpa Blade dan tanpa build step).
- **Backend (Server-Side API) & Database:** Laravel memvalidasi input, menegakkan otorisasi, mengakses PostgreSQL (Neon) melalui Eloquent ORM, menulis notifikasi WhatsApp Fonnte dan log perubahan status lewat layanan terpusat, serta mengembalikan respons **JSON** (`response()->json(...)`).
- **Autentikasi & Otorisasi:**
  - **Token Sanctum Per Permukaan:** Token Sanctum diberi _ability_ `surface:pasien` atau `surface:staf` sesuai permukaan saat login. Middleware surface menolak token pasien pada host/rute staf, dan menolak token staf pada host/rute pasien (403), meskipun di mode `combined`.
  - **Pasien (Tanpa RBAC):** Menggunakan autentikasi Sanctum + isolasi kepemilikan ketat (`user_id` dari token, bukan dari input) tanpa pembagian izin RBAC.
  - **Staf (RBAC Gate/Policy):** Menggunakan Laravel Gate/Policy bawaan untuk memetakan peran `admin` dan `dokter` ke izin eksplisit (`janji.lihat_semua`, `janji.kelola`, `janji.lihat_milik`, `pengajuan.ajukan`, `pengajuan.tarik`, `pengajuan.putuskan`, `master.kelola`, `dokter_akun.kelola`, `log.lihat`).

### Struktur Direktori Inti

```
app/
├── Console/Commands/
│   └── ExpireCancellationRequests.php  # Perintah pengajuan:kedaluwarsa (host staf)
├── Http/
│   ├── Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── Patient/
│   │   │   ├── AppointmentController.php
│   │   │   ├── ControlScheduleController.php
│   │   │   ├── HistoryController.php
│   │   │   └── ProfileController.php
│   │   ├── Doctor/
│   │   │   ├── DoctorAppointmentController.php
│   │   │   └── CancellationRequestController.php
│   │   └── Admin/
│   │       ├── AppointmentManagementController.php
│   │       ├── CancellationManagementController.php
│   │       ├── DoctorAccountController.php
│   │       ├── DoctorController.php
│   │       └── PolyclinicController.php
│   └── Middleware/
│       ├── EnsureDoctorLinked.php
│       ├── RoleMiddleware.php
│       └── SurfaceMiddleware.php
├── Models/
│   ├── Appointment.php
│   ├── CancellationRequest.php
│   ├── Doctor.php
│   ├── Polyclinic.php
│   ├── StatusChangeLog.php
│   ├── User.php
│   └── WhatsappOtp.php
├── Policies/                           # RBAC Gate & Policy staf (admin & dokter)
└── Services/
    ├── StatusChangeLogger.php
    └── WhatsAppNotificationService.php
public/                                 # Aset statis bersama (CSS, JS, gambar, ikon)
├── css/
│   └── style.css
├── images/
└── js/
    ├── api.js
    ├── auth.js
    ├── pasien.js
    ├── admin.js
    └── dokter.js
surfaces/
├── pasien/                             # Halaman HTML murni permukaan pasien
│   ├── index.html
│   ├── login.html
│   ├── daftar.html
│   ├── lupa-password.html
│   ├── reset-password.html
│   └── pasien/
│       ├── janji-temu.html
│       ├── riwayat.html
│       ├── jadwal-kontrol.html
│       └── profil.html
└── staf/                               # Halaman HTML murni permukaan staf
    ├── staf/
    │   └── login.html
    ├── admin/
    │   ├── kelola-janji.html
    │   └── master-data.html
    └── dokter/
        └── janji-temu.html
routes/
├── api.php                             # Endpoint JSON API dipilah sesuai APP_SURFACE
└── web.php                             # Menyajikan halaman surfaces/pasien atau surfaces/staf
```

## 3. Skema Database (4 Tabel Inti & Migrasi Aditif)

Empat tabel inti dipertahankan bersama kolom dan dua tabel aditif untuk mendukung peran dokter, pengajuan pembatalan, dan log perubahan status tanpa memutus kontrak lama. Seluruh migrasi dijalankan pada branch Neon terisolasi tanpa `migrate:fresh`.

### 3.1 Tabel `users`

Menyimpan data kredensial login sekaligus profil dasar pasien, admin, dan dokter.

|   |   |   |
|---|---|---|
|**Nama Kolom**|**Tipe Data**|**Keterangan**|
|`id`|`BIGINT` (PK)|Primary Key|
|`name`|`VARCHAR(255)`|Nama lengkap pengguna/staf|
|`email`|`VARCHAR(255)` (Unique)|Email untuk login|
|`google_id`|`VARCHAR(255)` (Nullable, Unique)|ID Google OAuth untuk login pasien|
|`password`|`VARCHAR(255)`|Hash kata sandi|
|`role`|`ENUM('pasien', 'admin', 'dokter')`|CHECK constraint mencakup `'dokter'`; Default: `'pasien'`|
|`phone_number`|`VARCHAR(30)` (Nullable)|Nomor telepon / WhatsApp|
|`phone_verified_at`|`TIMESTAMP` (Nullable)|Waktu verifikasi OTP WhatsApp pasien|
|`birth_date`|`DATE` (Nullable)|Tanggal lahir (Profil pasien)|
|`address`|`TEXT` (Nullable)|Alamat domisili (Profil pasien)|
|`disabled_at`|`TIMESTAMP` (Nullable)|Penanda penonaktifan akun staf/dokter tanpa menghapus data|
|`created_at` & `updated_at`|`TIMESTAMP`|Waktu pembuatan & pembaruan|

### 3.2 Tabel `polyclinics` (Data Master Poli)

Menyimpan daftar poli yang tersedia di layanan kesehatan.

|   |   |   |
|---|---|---|
|**Nama Kolom**|**Tipe Data**|**Keterangan**|
|`id`|`BIGINT` (PK)|Primary Key|
|`name`|`VARCHAR(255)`|Nama poli (misal: Poli Umum, Poli Gigi, Poli Penyakit Dalam)|
|`description`|`TEXT` (Nullable)|Keterangan singkat poli|
|`created_at` & `updated_at`|`TIMESTAMP`|Waktu pembuatan & pembaruan|

### 3.3 Tabel `doctors` (Data Master Dokter)

Menyimpan daftar dokter yang bertugas pada poli tertentu.

|   |   |   |
|---|---|---|
|**Nama Kolom**|**Tipe Data**|**Keterangan**|
|`id`|`BIGINT` (PK)|Primary Key|
|`polyclinic_id`|`FK -> polyclinics.id`|Relasi ke tabel poli|
|`user_id`|`BIGINT` (FK -> `users.id`, Nullable, Unique)|Tautan ke akun login `dokter` (`nullOnDelete`); dokter lama tetap `NULL` sampai admin membuat akun|
|`name`|`VARCHAR(255)`|Nama lengkap dokter beserta gelar|
|`is_active`|`BOOLEAN`|Status aktif dokter (Default: `true`)|
|`created_at` & `updated_at`|`TIMESTAMP`|Waktu pembuatan & pembaruan|

### 3.4 Tabel `appointments` (Janji Temu, Riwayat, & Jadwal Kontrol)

Satu tabel terpadu untuk mencatat seluruh siklus pemeriksaan.

|   |   |   |
|---|---|---|
|**Nama Kolom**|**Tipe Data**|**Keterangan**|
|`id`|`BIGINT` (PK)|Primary Key|
|`user_id`|`FK -> users.id`|Pasien pemilik janji temu|
|`polyclinic_id`|`FK -> polyclinics.id`|Poli yang dipilih|
|`doctor_id`|`FK -> doctors.id`|Dokter yang menangani|
|`appointment_date`|`DATE`|Tanggal pemeriksaan|
|`appointment_time`|`VARCHAR(5)`|Slot jam (`08:00` s.d. `16:00`); dilindungi *partial unique index* `(doctor_id, appointment_date, appointment_time) WHERE status = 'terjadwal'`|
|`type`|`ENUM('janji_baru', 'kontrol_rutin')`|`'janji_baru'` dibuat pasien; `'kontrol_rutin'` dijadwalkan admin|
|`status`|`ENUM('terjadwal', 'selesai', 'dibatalkan')`|Status pemeriksaan (Default: `'terjadwal'`); status tetap 3 nilai|
|`complaint`|`TEXT` (Nullable)|Keluhan singkat pasien (disembunyikan dari role `dokter`)|
|`doctor_notes`|`TEXT` (Nullable)|Catatan hasil pemeriksaan yang diisi Admin (disembunyikan dari role `dokter`)|
|`created_at` & `updated_at`|`TIMESTAMP`|Waktu pembuatan & pembaruan|

> **Logika Pembacaan Data pada Tabel `appointments`:**
> 
> - **Menu Janji Temu (Pasien):** Menampilkan daftar dengan `status = 'terjadwal'` dan `type = 'janji_baru'`.
>     
> - **Menu Riwayat Pemeriksaan (Pasien):** Menampilkan daftar dengan `status = 'selesai'` (menampilkan tanggal, poli, dokter, dan `doctor_notes`).
>     
> - **Menu Jadwal Kontrol (Pasien):** Menampilkan daftar dengan `type = 'kontrol_rutin'` dan `status = 'terjadwal'`.
>     
> - **Status pengajuan terbuka:** Diturunkan dari tabel `cancellation_requests` tanpa menambah nilai status baru pada `appointments`.

### 3.5 Tabel `cancellation_requests` (Pengajuan Pembatalan Dokter)

Menyimpan permohonan pembatalan janji temu dari dokter (satuan maupun massal) untuk ditindak oleh admin. Tidak memiliki endpoint hapus (tanpa hard delete) dan seluruh FK wajib menggunakan `restrictOnDelete` (kecuali `handled_by` yang nullable `nullOnDelete`).

|   |   |   |
|---|---|---|
|**Nama Kolom**|**Tipe Data**|**Keterangan**|
|`id`|`BIGINT` (PK)|Primary Key|
|`appointment_id`|`FK -> appointments.id` (`restrictOnDelete`)|Janji temu yang diajukan pembatalannya|
|`doctor_id`|`FK -> doctors.id` (`restrictOnDelete`)|Dokter terkait janji temu|
|`requested_by`|`FK -> users.id` (`restrictOnDelete`)|Akun user dokter yang mengajukan|
|`reason_category`|`VARCHAR(50)`|Salah satu dari: `cuti_mendadak`, `sakit`, `tugas_darurat`, `bentrok_jadwal`, `lainnya`|
|`reason`|`TEXT`|Alasan tertulis dari dokter (10 s.d. 500 karakter)|
|`status`|`VARCHAR(30)`|CHECK constraint: `diajukan`, `disetujui`, `dijadwalkan_ulang`, `ditolak`, `ditarik`, `gugur`, `kedaluwarsa` (Default: `'diajukan'`)|
|`batch_id`|`UUID` (Nullable)|Pengelompok pengajuan massal/cuti pada satu pengiriman|
|`admin_note`|`TEXT` (Nullable)|Catatan admin (wajib 5 s.d. 500 karakter saat menolak)|
|`handled_by`|`FK -> users.id` (Nullable, `nullOnDelete`)|Admin yang memutuskan pengajuan|
|`handled_at`|`TIMESTAMP` (Nullable)|Waktu keputusan admin|
|`due_at`|`TIMESTAMP`|Batas SLA admin: `min(24 jam sejak diajukan, 1 jam sebelum janji)`|
|`created_at` & `updated_at`|`TIMESTAMP`|Waktu pembuatan & pembaruan|

> **Index dan Constraint `cancellation_requests`:**
> - *Partial unique index* `(appointment_id) WHERE status = 'diajukan'` untuk menjamin maksimal satu pengajuan terbuka per janji (pelanggaran mengembalikan 409).
> - Index komposit `(status, due_at)` untuk inbox admin dan pemeriksaan SLA/kedaluwarsa, serta index pada `batch_id`.

### 3.6 Tabel `status_change_logs` (Log Perubahan Status Sederhana)

Tabel *append-only* tanpa kolom `updated_at` dan tanpa endpoint ubah atau hard delete untuk mencatat setiap perubahan status pada `appointments` dan `cancellation_requests`.

|   |   |   |
|---|---|---|
|**Nama Kolom**|**Tipe Data**|**Keterangan**|
|`id`|`BIGINT` (PK)|Primary Key|
|`subject_type`|`VARCHAR(50)`|Jenis entitas: `'appointment'` atau `'cancellation_request'`|
|`subject_id`|`BIGINT`|ID baris pada tabel subjek terkait|
|`actor_user_id`|`FK -> users.id` (Nullable, `nullOnDelete`)|ID aktor pengguna; `NULL` jika perubahan dipicu sistem (misal `kedaluwarsa`)|
|`actor_role`|`VARCHAR(30)`|Peran aktor saat aksi terjadi (`'pasien'`, `'admin'`, `'dokter'`, atau `'system'`)|
|`from_status`|`VARCHAR(50)` (Nullable)|Status sebelum perubahan (`NULL` saat pembuatan awal)|
|`to_status`|`VARCHAR(50)`|Status baru sesudah perubahan|
|`changes`|`JSONB` (Nullable)|Rincian perubahan jadwal (`appointment_date`, `appointment_time`, `doctor_id` lama dan baru)|
|`reason`|`TEXT` (Nullable)|Alasan atau catatan ringkas perubahan|
|`created_at`|`TIMESTAMP`|Waktu kejadian (tanpa `updated_at`)|

## 4. Kontrak Endpoint JSON API (`routes/api.php`)

Seluruh komunikasi antara file HTML/JS dan backend Laravel dilakukan menggunakan `fetch()` dengan format request dan response **JSON** (`Accept: application/json`).

> **Aturan Pemisahan Permukaan & Token Surface:**
> - **Permukaan `pasien` (`APP_SURFACE=pasien`):** Hanya mendaftarkan rute §4.1 (termasuk registrasi/OTP/Google pasien), §4.2, dan referensi (`/api/public-info`, `/api/master-poli`, `/api/slot-tersedia`). Rute `/api/admin/*` dan `/api/dokter/*` tidak didaftarkan (**404**). Login pada host pasien menerbitkan token ber-ability `surface:pasien`.
> - **Permukaan `staf` (`APP_SURFACE=staf`):** Hanya mendaftarkan `/api/login` (khusus staf `admin` dan `dokter`; role `pasien` ditolak **403**), `/api/logout`, `/api/user`, `/api/master-poli`, `/api/slot-tersedia`, serta rute §4.3, §4.4, dan §4.5. Rute registrasi publik, Google Sign-In, OTP pasien, dan §4.2 tidak didaftarkan (**404**). Login pada host staf menerbitkan token ber-ability `surface:staf`.
> - **Mode `combined` (`APP_SURFACE=combined`):** Khusus pengembangan lokal dan pengujian terpadu; seluruh rute aktif dalam satu host, namun middleware surface tetap menolak token `surface:pasien` pada rute staf dan token `surface:staf` pada rute pasien (**403**).

### 4.1 Endpoint Autentikasi & Data Referensi

|   |   |   |   |
|---|---|---|---|
|**Method**|**URI**|**Role**|**Fungsi & Respons JSON**|
|`POST`|`/api/login`|Tamu|Menerima `email` & `password`. Mengembalikan status sukses, data `user` (termasuk `role`), dan token Sanctum ber-ability `surface:pasien` atau `surface:staf` agar JS mengarahkan ke `/pasien/janji-temu.html`, `/admin/kelola-janji.html`, atau `/dokter/janji-temu.html`. Pada host staf, role `pasien` dan akun `disabled_at != null` ditolak (**403**).|
|`POST`|`/api/logout`|Pasien, Admin, Dokter|Menghapus token aktif; JS mengarahkan ke `/login.html` (pasien) atau `/staf/login.html` (staf).|
|`GET`|`/api/master-poli`|Pasien, Admin, Dokter|Mengembalikan daftar JSON seluruh Poli beserta daftar Dokter aktif di dalamnya untuk mengisi `<select>` pada form HTML.|

### 4.2 Endpoint Area Pengguna (Role: `pasien`, Token: `surface:pasien`)

|   |   |   |
|---|---|---|
|**Method**|**URI**|**Fungsi & Aturan JSON**|
|`GET`|`/api/janji-temu`|Mengambil daftar JSON janji temu aktif (`status = 'terjadwal'`, `type = 'janji_baru'`) milik pengguna yang sedang login.|
|`POST`|`/api/janji-temu`|Menerima input `polyclinic_id`, `doctor_id`, `appointment_date`, `appointment_time`, dan `complaint`. Menyimpan janji temu baru ke database.|
|`GET`|`/api/riwayat-pemeriksaan`|Mengambil daftar JSON pemeriksaan milik sendiri yang berstatus `'selesai'` beserta nama dokter, poli, dan `doctor_notes`.|
|`GET`|`/api/jadwal-kontrol`|Mengambil daftar JSON jadwal pemeriksaan berikutnya (`type = 'kontrol_rutin'`, `status = 'terjadwal'`).|
|`GET`|`/api/profil`|Mengambil informasi dasar akun dan data diri pengguna saat ini untuk ditampilkan di input form HTML.|
|`PATCH`|`/api/profil`|Menerima dan memperbarui `name`, `phone_number`, `birth_date`, `address`, atau `password`.|

### 4.3 Endpoint Area Admin (Role: `admin`, Token: `surface:staf`)

|   |   |   |
|---|---|---|
|**Method**|**URI**|**Fungsi & Aturan JSON**|
|`GET`|`/api/admin/janji-temu`|Mengambil seluruh daftar janji temu & jadwal kontrol semua pasien (mendukung filter `?date=` atau `?status=`).|
|`PATCH`|`/api/admin/janji-temu/{id}`|Memperbarui `status` pemeriksaan (misal menjadi `'selesai'` atau `'dibatalkan'`), jadwal/dokter, dan `doctor_notes`. Kontrak respons lama dipertahankan penuh; efek samping aditif: menulis baris ke `status_change_logs` serta menggugurkan (`gugur`) pengajuan pembatalan yang masih `diajukan` disertai notifikasi WA ke dokter.|
|`POST`|`/api/admin/jadwal-kontrol`|Membuat jadwal pemeriksaan berikutnya (`type = 'kontrol_rutin'`) untuk `user_id` (pasien) tertentu sesuai anjuran dokter.|
|`POST`|`/api/admin/poli`|Menambahkan data Poli baru ke database.|
|`POST`|`/api/admin/dokter`|Menambahkan data Dokter baru yang terhubung ke `polyclinic_id`.|

### 4.4 Endpoint Area Dokter (`/api/dokter/*`, Role: `dokter`, Token: `surface:staf`)

Seluruh endpoint dokter mewajibkan `FEATURE_DOCTOR_PORTAL=true` (jika mati mengembalikan **404**), token ber-ability `surface:staf`, role `dokter` melalui Gate/Policy, akun aktif (`disabled_at` null), serta tautan ke baris `doctors` aktif (`doctors.user_id = auth()->id()`; bila belum terhubung atau dinonaktifkan mengembalikan **403**). Seluruh query otomatis dibatasi ke `doctor_id` akun dokter, tanpa pernah mengambil `doctor_id` dari input.

|   |   |   |   |
|---|---|---|---|
|**Method**|**URI**|**Payload / Query**|**Fungsi & Respons JSON**|
|`GET`|`/api/dokter/janji-temu`|`?date_from&date_to&status`|Mengembalikan `200` daftar janji milik dokter (default hari ini s.d. +7 hari) dengan field minimal (`id`, `appointment_date`, `appointment_time`, `polyclinic`, `type`, `status`, nama pasien, kontak pasien tersamar `0812****7890`, `open_request`). Tanpa `complaint` dan `doctor_notes`.|
|`GET`|`/api/dokter/janji-temu/{id}`||Mengembalikan `200` detail minimal janji milik dokter beserta status kelayakan pengajuan. Mengembalikan **404** jika janji milik dokter lain.|
|`POST`|`/api/dokter/janji-temu/{id}/pengajuan-pembatalan`|`reason_category`, `reason`|Membuat pengajuan pembatalan satuan (`201`), menulis log `status_change_logs`, dan mengirim WA ke admin. Mengembalikan **409** jika sudah ada pengajuan `diajukan` atau status janji bukan `terjadwal`; **422** jika lewat batas waktu (minimal 2 jam sebelum jam janji) atau validasi alasan gagal.|
|`POST`|`/api/dokter/pengajuan-pembatalan/massal`|`date_from`, `date_to`, `reason_category`, `reason`|Pengajuan massal cuti dengan rentang maksimal 14 hari. Mengembalikan `201` `{batch_id, created[], skipped[{id, sebab}]}`.|
|`GET`|`/api/dokter/pengajuan-pembatalan`|`?status`|Mengembalikan `200` daftar pengajuan pembatalan milik dokter sendiri beserta catatan admin.|
|`POST`|`/api/dokter/pengajuan-pembatalan/{id}/tarik`||Menarik pengajuan milik sendiri yang masih berstatus `diajukan` menjadi `ditarik` (`200`), menulis log, dan memperbarui lencana inbox admin. Mengembalikan **409** jika sudah ditindak admin; **404** jika milik dokter lain.|

### 4.5 Endpoint Staf Admin Lanjutan (Role: `admin`, Token: `surface:staf`)

|   |   |   |   |
|---|---|---|---|
|**Method**|**URI**|**Payload / Query**|**Fungsi & Respons JSON**|
|`GET`|`/api/admin/pengajuan-pembatalan`|`?status&doctor_id&batch_id&overdue`|Mengembalikan `200` daftar pengajuan pembatalan beserta data janji, status SLA (`due_at`), dan pengelompokan `batch_id`, diurutkan menurut `due_at` terdekat.|
|`POST`|`/api/admin/pengajuan-pembatalan/{id}/setujui`|`admin_note?`|Dalam transaksi DB (`FOR UPDATE`): mengubah janji menjadi `dibatalkan`, pengajuan menjadi `disetujui`, menulis 2 baris `status_change_logs`, dan mengirim WA ke pasien (`cancelled`) serta dokter (`200`). Mengembalikan **409** bila sudah ditindak admin lain.|
|`POST`|`/api/admin/pengajuan-pembatalan/{id}/jadwalkan-ulang`|`appointment_date`, `appointment_time`, `doctor_id?`, `admin_note?`|Memvalidasi slot anti-bentrok dan aturan dokter satu poli aktif (`422` bila bentrok); memperbarui janji, mengubah pengajuan menjadi `dijadwalkan_ulang`, menulis `status_change_logs` (`changes` lama & baru), serta mengirim WA ke pasien (`rescheduled`) dan dokter lama/baru (`200`).|
|`POST`|`/api/admin/pengajuan-pembatalan/{id}/tolak`|`admin_note` (wajib 5 s.d. 500 karakter)|Mengubah pengajuan menjadi `ditolak`, membiarkan janji tetap `terjadwal`, menulis log, dan mengirim WA ke dokter (`200`; pasien tidak diberi tahu).|
|`GET`|`/api/admin/janji-temu/{id}/log`||Mengembalikan `200` riwayat `status_change_logs` untuk janji temu dan pengajuan terkait (`404` jika janji tidak ditemukan).|
|`POST`|`/api/admin/dokter/{id}/akun`|`email`, `password`|Membuat akun `User` ber-role `dokter` dan menautkannya ke `doctors.user_id` (`201`).|
|`PATCH`|`/api/admin/dokter/{id}/akun`|`access_enabled`|Mengatur `users.disabled_at` dan mencabut seluruh token Sanctum aktif milik dokter apabila `access_enabled = false` (`200`).|

## 5. Rencana Kerja Eksekusi & Pengujian

Pengerjaan proyek dibagi menjadi **7 tahapan berurutan (Milestone)**:

|                                            |                                                                                                                                                                                             |                                                                                                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tahap**                                  | **Fokus Pengerjaan**                                                                                                                                                                        | **Kriteria Selesai (Acceptance Criteria)**                                                                                                                                                                              |
| **Tahap 1: Fondasi & Database**            | Setup Laravel, konfigurasi koneksi DB, buat 4 migrasi tabel (`users`, `polyclinics`, `doctors`, `appointments`), dan buat `DatabaseSeeder` (1 akun Admin, 2 akun Pasien, 3 Poli, 5 Dokter). | Perintah `php artisan migrate --seed` berhasil dijalankan tanpa error.                                                                                                                                                  |
| **Tahap 2: API Auth & Halaman Login HTML** | Buat endpoint `/api/login`, `/api/logout`, `RoleMiddleware`, serta halaman `public/login.html` + `auth.js`.                                                                                 | Pengguna bisa login dari `login.html` menggunakan `fetch()`, diarahkan ke halaman HTML sesuai rolenya, dan ditolak (401/403) jika mengakses API role lain.                                                              |
| **Tahap 3: Fitur Profil Pengguna**         | Buat endpoint `GET/PATCH /api/profil` dan halaman `public/pasien/profil.html`.                                                                                                              | Data diri tampil otomatis di form HTML saat halaman dibuka, dan perubahan tersimpan ke database tanpa error saat tombol simpan diklik.                                                                                  |
| **Tahap 4: Janji Temu & Panel Admin**      | Buat endpoint & halaman HTML pembuatan janji temu pasien (`janji-temu.html`) serta halaman kelola admin (`kelola-janji.html` & `master-data.html`).                                         | Pasien bisa membuat janji & tanggal lalu menyimpan janji; Admin bisa melihat janji tersebut, menyelesaikannya dengan catatan dokter, apabila terjadi bentrok admin akan menyarankan pengguna untuk memilih dokter lain. |
| **Tahap 5: Riwayat & Jadwal Kontrol**      | Buat endpoint & halaman HTML Riwayat Pemeriksaan (`riwayat.html`) dan Jadwal Kontrol (`jadwal-kontrol.html`).                                                                               | Pemeriksaan yang diselesaikan admin tampil di tabel `riwayat.html` pasien; Jadwal kontrol yang dibuat admin tampil di `jadwal-kontrol.html` pasien.                                                                     |
| **Tahap 6: Arsitektur Dua Permukaan & RBAC Staf** | Pisahkan rute API dan halaman HTML via `APP_SURFACE` (`pasien`, `staf`, `combined`), pindahkan HTML ke `surfaces/pasien/` & `surfaces/staf/` dengan aset bersama di `public/` dan penyajian lewat `routes/web.php`, tambah `vercel.staf.json` dan `STAFF_ALLOWED_IPS` opsional, bedakan token ability (`surface:pasien`, `surface:staf`), serta terapkan Laravel Gate/Policy RBAC staf (`admin` & `dokter`) dan `staf/login.html`. | `APP_SURFACE=pasien` mengembalikan 404 pada `/api/admin/*`, `/api/dokter/*`, dan halaman staf; `APP_SURFACE=staf` mengembalikan 404 pada registrasi/Google/OTP/endpoint pasien serta menolak login role `pasien` (403); token `surface:pasien` ditolak (403) pada endpoint staf dan sebaliknya; Gate/Policy RBAC staf menegakkan 401/403 dengan benar; seluruh feature test T1-T5 lulus dan `vendor/bin/pint --test` bersih. |
| **Tahap 7: Portal Dokter, Pengajuan Pembatalan & Audit Log** | Jalankan migrasi aditif (`users.role` + `disabled_at`, `doctors.user_id`, `cancellation_requests`, `status_change_logs`) di branch Neon terisolasi; terapkan feature flag `FEATURE_DOCTOR_PORTAL`, seluruh endpoint `/api/dokter/*` dan `/api/admin/pengajuan-pembatalan/*`, `/api/admin/janji-temu/{id}/log`, `/api/admin/dokter/{id}/akun`, logging wajib di `status_change_logs` (termasuk `PATCH /api/admin/janji-temu/{id}` dan status `gugur`), perintah `pengajuan:kedaluwarsa`, notifikasi WA Fonnte, serta UI `surfaces/staf/dokter/janji-temu.html` dan inbox admin. | Migrasi aditif sukses tanpa `migrate:fresh`; flag mati mengembalikan 404; dokter hanya membaca janji miliknya tanpa `complaint`/`doctor_notes` dan dengan kontak tersamar (janji dokter lain = 404, dokter tanpa tautan/nonaktif = 403, nol mutasi ke tabel inti); pengajuan satuan & massal (maks 14 hari), batas waktu 2 jam (422), duplikat terbuka (409), tarik pengajuan, setujui/jadwalkan ulang/tolak admin (`FOR UPDATE`, anti-bentrok slot 422, konflik 409), pengguguran otomatis, kedaluwarsa (`terjadwal` tetap aman), serta log status terbukti lewat feature test PHPUnit, `vendor/bin/pint --test`, dan verifikasi browser sesuai `DESIGN.md` & Anti-Slop Delivery Gate. |
