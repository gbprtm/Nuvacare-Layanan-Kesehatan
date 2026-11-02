# Strategi Migrasi Database: Inventaris, Pemetaan Eloquent, dan Pemulihan Terisolasi

- **Tugas:** L02 (Inventaris database dan latih pemulihan)
- **Status:** Done
- **Target Stack:** PostgreSQL (Neon) + Laravel 13 Eloquent

---

## 1. Inventaris Skema Database (21 Tabel)

Berdasarkan analisis riwayat migrasi PostgreSQL / Drizzle di arsip (`_arsip/nextjs-2026-11-02/src/db/migrations/`), berikut inventaris lengkap 21 tabel:

| No | Nama Tabel Arsip | Primary Key | Kolom Kunci / Relasi | Enum Terkait | Keterangan & Batasan |
|---|---|---|---|---|---|
| 1 | `users` | UUID (`id`) | `email`, `password_hash`, `role` | `user_role` | Model Auth Laravel; password column: `password_hash` |
| 2 | `sessions` | UUID (`id`) | `user_id` (FK `users.id`), `token_hash`, `expires_at` | - | **Sesi Next.js lama (tidak kompatibel)** dengan Laravel session driver |
| 3 | `dokter` | UUID (`id`) | `nama`, `spesialisasi`, `nomor_izin`, `aktif` | - | Data katalog dokter klinik (tanpa akun login) |
| 4 | `slot` | UUID (`id`) | `dokter_id` (FK `dokter.id`), `tanggal`, `jam_mulai`, `jam_selesai`, `kuota`, `tersedia`, `dikunci_sampai` | - | Kuota default 1; slot waktu janji temu |
| 5 | `janji` | UUID (`id`) | `pasien_id` (FK `users`), `dokter_id`, `slot_id`, `status`, `keluhan`, `catatan` | `status_janji` | Status: `aktif`, `perubahan_diusulkan`, `dibatalkan`, `selesai`, `tidak_hadir` |
| 6 | `usulan_perubahan` | UUID (`id`) | `janji_id`, `slot_baru_id`, `alasan`, `status`, `batas_waktu_jawab`, `ttl_kunci_slot` | `status_usulan` | Status: `menunggu_tanggapan`, `disetujui`, `ditolak`, `kedaluwarsa` |
| 7 | `notifikasi` | UUID (`id`) | `user_id`, `judul`, `pesan`, `tipe`, `dibaca`, `data_terkait` (JSONB) | `tipe_notifikasi` | Notifikasi in-app; tidak memiliki kolom `updated_at` |
| 8 | `audit_log` | UUID (`id`) | `user_id`, `aksi`, `objek`, `objek_id`, `nilai_sebelum`, `nilai_sesudah`, `alasan`, `ip_address` | - | Append-only audit record; tanpa kolom `updated_at` |
| 9 | `aturan_kontrol` | UUID (`id`) | `pasien_id`, `dokter_id`, `interval_hari`, `tanggal_mulai`, `anchor_hari`, `aktif` | - | Pengaturan kontrol berkala oleh dokter |
| 10 | `profil` | UUID (`id`) | `user_id` (Unique), `nik` (nullable), `nomor_telepon`, `tanggal_lahir`, `jenis_kelamin`, `kondisi_kesehatan`, `riwayat_alergi` | `jenis_kelamin` | Profil pasien; NIK/KK tidak ditampilkan di UI formulir |
| 11 | `jadwal_kontrol` | UUID (`id`) | `pasien_id`, `aturan_kontrol_id`, `dokter_id`, `tanggal_rencana`, `status`, `janji_id` | `status_jadwal_kontrol` | Jadwal kontrol hasil generate otomatis |
| 12 | `tiket_antrian` | UUID (`id`) | `janji_id` (Unique), `pasien_id`, `tanggal`, `nomor_antrian_final`, `status`, `waktu_check_in` | `status_antrian` | Nomor antrean final saat check-in, unik per tanggal |
| 13 | `catatan_kebiasaan` | UUID (`id`) | `pasien_id`, `tanggal`, `hidrasi_ml`, `jam_tidur`, `aktivitas_menit`, `catatan` | - | Ringkasan gaya hidup pasien (FB-5 wajib) |
| 14 | `resep` | UUID (`id`) | `pasien_id`, `janji_id`, `dokter_id`, `nomor_resep`, `diagnosis`, `tanggal_resep` | - | Catatan resep klinis oleh dokter/admin |
| 15 | `obat` | UUID (`id`) | `resep_id`, `nama_obat`, `dosis`, `aturan_pakai`, `frekuensi_per_hari`, `tanggal_mulai`, `tanggal_selesai`, `rujukan_fornas`, `aktif` | - | Item obat resep klinis |
| 16 | `catatan_minum_obat` | UUID (`id`) | `pasien_id`, `obat_id`, `tanggal`, `status`, `waktu_minum`, `catatan` | `status_minum_obat` | Catatan harian minum obat (`sudah`, `belum`) |
| 17 | `log_aktivitas` | UUID (`id`) | `user_id`, `jenis_aksi`, `objek`, `objek_id`, `keterangan` | - | Opsional L17; tanpa `updated_at` |
| 18 | `konten_statis` | UUID (`id`) | `slug` (Unique), `judul`, `ringkasan`, `isi`, `kategori`, `kondisi_terkait`, `url_sumber`, `tanggal_pengambilan` | - | Opsional L17; artikel edukasi kesehatan terverifikasi |
| 19 | `login_attempts` | VARCHAR(64) (`account_key`) | `failed_attempts`, `window_started_at`, `locked_until`, `updated_at` | - | Rate limiter login persisten lama |
| 20 | `katalog_obat_fornas`| UUID (`id`) | `nama_indonesia`, `nama_internasional`, `kode_resmi`, `sumber`, `sumber_url`, `versi_snapshot`, `tanggal_snapshot` | - | Referensi katalog obat FORNAS (bukan rekomendasi otomatis) |
| 21 | `obat_pasien` | UUID (`id`) | `pasien_id`, `katalog_obat_fornas_id`, `nama_obat`, `dosis_catatan`, `frekuensi_catatan`, `mulai_pada`, `selesai_pada`, `sumber` | - | Laporan obat mandiri oleh pasien (terpisah dari resep klinis) |

---

## 2. Klasifikasi Data

- **Data Riil / Produksi:** Database Neon utama saat ini menyimpan kredensial admin dan akun pasien riil. **DILARANG KERAS** menjalankan `migrate:fresh`, `db:wipe`, atau `migrate:reset` pada target ini.
- **Data Demo / Fiktif:** Semua data uji (dokter, janji, jadwal, resep dummy) yang di-seed di lingkungan pengembangan harus bersifat fiktif tanpa memuat NIK, nomor KK, atau data pribadi nyata.
- **Data Referensi Statis:** Katalog FORNAS berasal dari snapshot publik Kementerian Kesehatan di `data/mentah/` dan bersifat referensi read-only.

---

## 3. Keputusan Pemetaan Eloquent (Adapt & Map)

Diputuskan untuk menggunakan pendekatan **Adopsi Skema Terkelola (Adapt & Map)**:

1. **Konvensi Model Eloquent:**
   - Model PHP ditulis dalam bahasa Inggris (`User`, `Doctor`, `Appointment`, `RescheduleProposal`, `QueueTicket`, `HabitLog`, `Prescription`, `Medication`, `FornasCatalog`, `PatientMedication`).
   - Setiap model menetapkan properti `$table` secara eksplisit sesuai nama tabel PostgreSQL (misal: `protected $table = 'dokter';`, `protected $table = 'janji';`).
   - Primary key: UUID non-incrementing (`public $incrementing = false; protected $keyType = 'string';`).
   - Relasi timestamps: Kolom `created_at` dan `updated_at` eksplisit. Pada tabel append-only seperti `audit_log`, `notifikasi`, dan `log_aktivitas`, nonaktifkan `public $timestamps = false` atau atur `const UPDATED_AT = null`.

2. **Autentikasi & Kolom Password:**
   - Kolom password pada tabel `users` adalah `password_hash`.
   - Model `User` mengimplementasikan fungsi `getAuthPassword()` untuk mengembalikan `$this->password_hash`.
   - Password hashing lama menggunakan format bcrypt (`$2a$`, `$2b$`) yang 100% kompatibel dengan PHP `password_verify()`.

3. **Strategi Sesi Laravel:**
   - Tabel `sessions` bawaan Drizzle menggunakan `token_hash` tunggal dan tidak kompatibel dengan skema session driver database Laravel.
   - Keputusan: Laravel akan menggunakan session driver `file` untuk pengujian/lokal, dan jika menggunakan database di produksi, Laravel akan memakai tabel terpisah bernama **`laravel_sessions`** (`config/session.php: 'table' => 'laravel_sessions'`).
   - Seluruh sesi login Next.js lama secara aman diinvalidasi saat cutover; semua pengguna diharuskan login ulang untuk menerbitkan session identifier baru yang terenkripsi dan terlindungi CSRF.

---

## 4. Topologi Koneksi Database Neon

1. **Direct Connection (Unpooled):**
   - URL: `DATABASE_URL_UNPOOLED` (tanpa suffix `-pooler`, port `5432`).
   - Penggunaan: Khusus untuk DDL, `php artisan migrate`, `pg_dump`, `pg_restore`, dan command CLI long-running.
2. **Pooled Connection:**
   - URL: `DATABASE_URL` (mengandung suffix `-pooler`).
   - Penggunaan: Khusus untuk web application runtime HTTP Laravel.
3. **Enkripsi TLS Wajib:**
   - Parameter `sslmode=require` wajib disertakan pada seluruh connection string Neon.

---

## 5. Prosedur Backup & Restore Terisolasi

1. **Guard Keselamatan (`scripts/database/guard.php`):**
   - Menolak eksekusi jika target terdeteksi mengandung kata kunci produksi (`prod`, `production`, `live`, `main`).
   - Hanya mengizinkan eksekusi pada branch terisolasi (`test`, `dev`, `isolated`, `staging`).
2. **Skrip Backup (`scripts/database/backup.ps1`):**
   - Menjalankan `pg_dump` dengan format custom terkompresi (`-Fc`) atau snapshot copy-on-write branch Neon via `npx neonctl`.
   - File dump disimpan di luar pelacakan git (`.backups/`).
   - Menghasilkan hash checksum `SHA-256` untuk verifikasi integritas data.
3. **Skrip Restore Drill (`scripts/database/restore.ps1`):**
   - Memverifikasi checksum SHA-256 sebelum pemulihan.
   - Memastikan database target adalah target terisolasi.
   - Melakukan rekonsiliasi tabel dan record pasca pemulihan.

---

## 6. Kesiapan Perangkat Klien PostgreSQL

- Ekstensi PHP `pdo_pgsql` dan `pgsql` aktif pada PHP 8.4.27.
- Neon CLI (`neonctl v8.16.0`) terpasang dan siap digunakan untuk instant branch copy-on-write restore.
- Binary `pg_dump` dan `pg_restore` versi sistem belum terdaftar di PATH Windows; skrip fallback otomatis mengekspor skema melalui PDO atau branch snapshot Neon.

