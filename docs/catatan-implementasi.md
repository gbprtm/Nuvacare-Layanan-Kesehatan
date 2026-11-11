# Catatan implementasi

Keputusan kecil untuk hal yang tidak dirinci [RANCANGAN FINAL](RANCANGANFINAL.md).
Dokumen ini tidak menambah fitur. Bila bertentangan, RANCANGAN FINAL yang
berlaku.

## 1. Keputusan atas celah rancangan

| No | Celah | Keputusan |
|---|---|---|
| 1 | Registrasi pasien, OTP WA & Login Google | Atas arahan pemilik, pasien dapat mendaftar mandiri via `daftar.html` dengan verifikasi OTP 4 digit ke WhatsApp (`POST /api/auth/register/send-otp` & `POST /api/auth/register/verify-otp`, TTL 5 menit, maks 5 percobaan). Login mendukung akun Google (`POST /api/auth/google`); bila nomor WhatsApp belum terverifikasi (`phone_verified_at = null`), muncul verifikasi wajib OTP WhatsApp 4 digit (`POST /api/auth/phone/send-otp` & `POST /api/auth/phone/verify-otp`). Pemulihan kata sandi didukung penuh via WhatsApp OTP 3-tahap (`lupa-password.html`: `POST /api/auth/forgot-password/send-otp`, `verify-otp`, `reset`) dengan sensor/masking nomor telepon pada frontend untuk keamanan. Pengiriman gateway WhatsApp Fonnte menggunakan format `asForm()` dengan `countryCode: '0'`. Tamu dapat mengakses beranda publik `index.html` (`GET /api/public-info`). Reset kata sandi via email tetap didukung (`POST /api/forgot-password` & `POST /api/reset-password`). |
| 2 | Auth "Session atau Sanctum" | **Sanctum token**. `/api/login` mengembalikan token; `api.js` menyimpannya di `localStorage` dan mengirim `Authorization: Bearer <token>`. `/api/logout` menghapus token. |
| 3 | Admin butuh `user_id` untuk jadwal kontrol | `user_id` dipilih dari daftar pasien (`GET /api/admin/pasien`) pada formulir jadwal kontrol di `kelola-janji.html`. |
| 4 | Ketersediaan dokter (`is_active`) | Poli & dokter ditambah melalui `POST`. Admin dapat mengubah status ketersediaan dokter (`is_active`) lewat `PATCH /api/admin/dokter/{id}` agar dokter yang berhalangan tidak muncul di pilihan pasien. |
| 5 | Siapa yang membatalkan | Hanya admin yang mengeksekusi pembatalan, baik langsung lewat `PATCH /api/admin/janji-temu/{id}` (`status = 'dibatalkan'`) maupun dengan menyetujui pengajuan dokter via `POST /api/admin/pengajuan-pembatalan/{id}/setujui`. Pasien tetap tidak membatalkan mandiri (tetap melalui admin); bila janji dibatalkan/diubah admin saat pengajuan masih `diajukan`, pengajuan otomatis berstatus `gugur`. |
| 6 | Validasi slot & bentrok jadwal | Tanpa tabel `slots` terpisah: kolom `appointment_time` (`08:00` s.d. `16:00`) ditambahkan pada `appointments` dengan PostgreSQL *partial unique index* `(doctor_id, appointment_date, appointment_time) WHERE status = 'terjadwal'` untuk mencegah *double booking*. Saat jadwal diubah atau dibatalkan via `PATCH /api/admin/janji-temu/{id}`, backend mengirim notifikasi WhatsApp (`WhatsAppNotificationService`) dan menyertakan tautan `whatsapp_url` (`https://wa.me/62...`). |
| 7 | Vite | Tidak dipakai. CSS/JS langsung dari `public/css` dan `public/js`; halaman HTML per permukaan berada di `surfaces/pasien/` dan `surfaces/staf/` yang disajikan melalui `routes/web.php`. |
| 8 | Tipe `id` | `BIGINT` auto increment (pilihan pertama di skema). |
| 9 | Nama produk | "Nuvicare" (selaras dengan `DESIGN.md` dan beranda publik). |
| 10 | Arsitektur dua permukaan & domain (Opsi B) | Satu codebase Laravel JSON API dan satu database Neon (`klinik`), dipecah menjadi dua deployment terpisah melalui env `APP_SURFACE` (`pasien` untuk host placeholder `nuvacare.id`, `staf` untuk host placeholder `staf.nuvacare.id`, serta `combined` untuk pengembangan lokal dan pengujian terpadu). Deployment staf memakai `vercel.staf.json`, pembatasan IP opsional `STAFF_ALLOWED_IPS`, serta feature flag `FEATURE_DOCTOR_PORTAL`. |
| 11 | Batas waktu pengajuan dokter (BR2) | Dokter hanya dapat mengajukan pembatalan paling lambat **2 jam** sebelum waktu janji (`appointment_date` + `appointment_time`). Lewat dari batas tersebut API mengembalikan 422. |
| 12 | SLA tindak lanjut admin (BR8) | Batas waktu tindak lanjut admin disimpan pada `due_at = min(24 jam sejak diajukan, 1 jam sebelum jam janji)`. Item yang melewati `due_at` diberi tanda merah di inbox admin dan memicu notifikasi WhatsApp ke admin. |
| 13 | Kategori alasan pengajuan (BR4) | Kategori alasan memakai lima nilai baku: `cuti_mendadak`, `sakit`, `tugas_darurat`, `bentrok_jadwal`, dan `lainnya`, disertai `reason` wajib 10 s.d. 500 karakter. |
| 14 | Status kedaluwarsa pengajuan (BR7) | Apabila jam janji terlewati saat pengajuan masih berstatus `diajukan`, status pengajuan menjadi `kedaluwarsa` (dievaluasi saat baca/tulis dan lewat perintah `php artisan pengajuan:kedaluwarsa` di cron host staf). **Janji temu tetap `terjadwal`**, disertai notifikasi WhatsApp kepada admin dan dokter. |
| 15 | Data minimal untuk dokter | Kolom `complaint` dan `doctor_notes` disembunyikan dari seluruh endpoint dokter; nomor telepon pasien disamarkan (contoh `0812****7890`). Dokter tidak dapat mengubah data janji, master poli/dokter, maupun data pasien. |
| 16 | Pembatalan pasien tetap melalui admin | Tidak ada fitur batal mandiri pasien. Pasien menghubungi admin/klinik, lalu admin membatalkan lewat `PATCH /api/admin/janji-temu/{id}` yang sekaligus menggugurkan (`gugur`) pengajuan pembatalan terbuka dan mengirim notifikasi WhatsApp ke dokter. |

## 2. Aturan validasi minimum
| Endpoint | Aturan |
|---|---|
| `GET /api/public-info` | Publik (tanpa token); mengembalikan info klinik, `google_client_id`, dan daftar poliklinik beserta dokter aktif |
| `POST /api/register` | `name` wajib ≤ 255; `email` unik; `password` min 8 + `confirmed`; `birth_date` opsional sebelum hari ini (`before:today`) |
| `POST /api/auth/register/send-otp` | Validasi form pendaftaran + nomor WhatsApp unik; mengirim OTP 4 digit via Fonnte WhatsApp (TTL 5 menit, jeda kirim ulang 60 detik) |
| `POST /api/auth/register/verify-otp` | `phone_number` + `otp` 4 digit (maks 5 percobaan); membuat akun `User` dengan `phone_verified_at` terisi dan mengembalikan token Sanctum |
| `POST /api/login` | `email` wajib email, `password` wajib (dibatasi `throttle:15,1`); menyertakan `requires_phone_verification` untuk pasien; pada permukaan `staf` menolak role `pasien` (403) dan akun nonaktif (`disabled_at` terisi, 403); menerbitkan token ability `surface:pasien` atau `surface:staf` |
| `POST /api/auth/google` | Menerima kredensial Google (`credential` ID token / profil OAuth), masuk atau membuat akun pasien, serta mengembalikan `requires_phone_verification` |
| `POST /api/auth/phone/send-otp` | `auth:sanctum`; mengirim kode OTP 4 digit ke nomor WhatsApp baru pengguna |
| `POST /api/auth/phone/verify-otp` | `auth:sanctum`; memverifikasi kode OTP 4 digit dan menyimpan `phone_number` serta `phone_verified_at` |
| `POST /api/auth/forgot-password/send-otp` | `identifier` (email atau nomor WhatsApp terdaftar); mengirim kode OTP 4 digit via WhatsApp |
| `POST /api/auth/forgot-password/verify-otp` | `phone_number` + `otp` 4 digit (maks 5 percobaan); mengembalikan `reset_token` berlaku 15 menit |
| `POST /api/auth/forgot-password/reset` | `phone_number` + `reset_token` + `password` min 8 + `confirmed`; memperbarui sandi dan mencabut sesi |
| `POST /api/forgot-password` | `email` wajib email terdaftar; mengirim tautan reset via SMTP (mengembalikan 503 JSON bila SMTP gagal) |
| `POST /api/reset-password` | `token` wajib; `email` wajib; `password` min 8 + `confirmed`; mencabut seluruh token Sanctum lama milik pengguna |
| `GET /api/slot-tersedia` | `doctor_id` ada; `date` tanggal ≥ hari ini; mengembalikan daftar slot jam beserta status `available` |
| `POST /api/janji-temu` | `polyclinic_id` ada; `doctor_id` ada, aktif (`is_active = true`), dan milik poli itu; `appointment_date` tanggal ≥ hari ini; `appointment_time` slot tersedia (menolak *double booking* dengan 422); `complaint` opsional ≤ 500 karakter |
| `PATCH /api/profil` | `name` ≤ 255; `phone_number` ≤ 30; `birth_date` tanggal sebelum hari ini; `address` teks; `password` opsional min 8 + `password_confirmation` |
| `GET /api/admin/janji-temu` | Mendukung filter query opsional `?date=YYYY-MM-DD`, `?status=`, `?type=`, dan `?doctor_id=` |
| `PATCH /api/admin/janji-temu/{id}` | `status` (`terjadwal/selesai/dibatalkan`); `appointment_date`, `appointment_time`, `doctor_id` opsional (divalidasi anti-bentrok); `doctor_notes` opsional ≤ 2000 karakter; memicu notifikasi WhatsApp, menulis `status_change_logs`, dan mengubah pengajuan pembatalan `diajukan` terkait menjadi `gugur` |
| `POST /api/admin/jadwal-kontrol` | `user_id` wajib pengguna ber-role `pasien`; `polyclinic_id` ada; `doctor_id` aktif dan milik poli itu; `appointment_date` ≥ hari ini |
| `POST /api/admin/poli` | `name` wajib unik; `description` opsional |
| `POST /api/admin/dokter` | `polyclinic_id` ada; `name` wajib; `is_active` boolean opsional (default `true`) |
| `PATCH /api/admin/dokter/{id}` | `is_active` boolean wajib |
| `GET /api/admin/pasien` | Mengembalikan daftar pengguna dengan `role = 'pasien'` untuk pilihan jadwal kontrol |
| `GET /api/dokter/janji-temu` | Token `surface:staf`, role `dokter`, akun aktif & terhubung ke `doctors` aktif; filter query opsional `date_from` (`date`), `date_to` (`date`, `after_or_equal:date_from`), `status` (`in:terjadwal,selesai,dibatalkan`); di-scope ke `doctor_id` akun; mengembalikan field minimal tanpa `complaint`/`doctor_notes` dengan kontak tersamar |
| `GET /api/dokter/janji-temu/{id}` | Otorisasi dokter sama; hanya janji milik `doctor_id` akun (janji dokter lain = 404); field minimal + status kelayakan pengajuan |
| `POST /api/dokter/janji-temu/{id}/pengajuan-pembatalan` | Otorisasi dokter sama; janji milik dokter berstatus `terjadwal`, waktu janji minimal 2 jam dari sekarang (422 bila lewat), belum ada pengajuan berstatus `diajukan` (409 bila sudah ada); `reason_category` wajib (`in:cuti_mendadak,sakit,tugas_darurat,bentrok_jadwal,lainnya`); `reason` wajib string 10 s.d. 500 karakter |
| `POST /api/dokter/pengajuan-pembatalan/massal` | Otorisasi dokter sama; `date_from` wajib `date` (`>= today`), `date_to` wajib `date` (`after_or_equal:date_from`, rentang maksimal 14 hari dari `date_from`); `reason_category` wajib (5 nilai BR4); `reason` wajib 10 s.d. 500 karakter; mengembalikan `{batch_id, created[], skipped[{id, sebab}]}` |
| `GET /api/dokter/pengajuan-pembatalan` | Otorisasi dokter sama; filter opsional `status` (`in:diajukan,disetujui,dijadwalkan_ulang,ditolak,ditarik,gugur,kedaluwarsa`); hanya pengajuan milik dokter |
| `POST /api/dokter/pengajuan-pembatalan/{id}/tarik` | Otorisasi dokter sama; hanya pengajuan milik dokter dengan status `diajukan` (409 jika sudah final/ditindak admin, 404 jika milik dokter lain) |
| `GET /api/admin/pengajuan-pembatalan` | Token `surface:staf`, role `admin`; filter opsional `status`, `doctor_id` (`exists:doctors,id`), `batch_id` (`uuid`), `overdue` (`boolean`); diurutkan berdasarkan `due_at` terdekat |
| `POST /api/admin/pengajuan-pembatalan/{id}/setujui` | Role `admin`; `admin_note` opsional string maks 500 karakter; kunci baris `FOR UPDATE`; verifikasi pengajuan `diajukan` dan janji `terjadwal` (409 jika berubah); ubah janji jadi `dibatalkan`, pengajuan jadi `disetujui`, catat 2 baris `status_change_logs`, kirim WA pasien & dokter |
| `POST /api/admin/pengajuan-pembatalan/{id}/jadwalkan-ulang` | Role `admin`; `appointment_date` wajib `date` (`>= today`); `appointment_time` wajib slot valid (`08:00` s.d. `16:00`); `doctor_id` opsional `exists:doctors,id` (harus satu poli dengan janji dan `is_active = true`); `admin_note` opsional maks 500 karakter; validasi slot anti-bentrok (422 bila terisi); catat log + perubahan jadwal/dokter |
| `POST /api/admin/pengajuan-pembatalan/{id}/tolak` | Role `admin`; `admin_note` wajib string 5 s.d. 500 karakter; pengajuan menjadi `ditolak`, janji tetap `terjadwal`, catat log, kirim WA ke dokter |
| `GET /api/admin/janji-temu/{id}/log` | Role `admin`; janji harus ada (404 jika tidak); mengembalikan riwayat `status_change_logs` janji beserta pengajuan pembatalan terkait |
| `POST /api/admin/dokter/{id}/akun` | Role `admin`; dokter `id` ada dan belum punya `user_id` (409 jika sudah terhubung); `email` wajib email unik (`unique:users,email`); `password` wajib min 8 karakter; membuat user `role = 'dokter'` dan mengisi `doctors.user_id` |
| `PATCH /api/admin/dokter/{id}/akun` | Role `admin`; dokter `id` harus sudah terhubung ke `user_id` (422/404 jika belum); `access_enabled` wajib boolean; memperbarui `users.disabled_at` dan mencabut semua token Sanctum dokter saat `access_enabled = false` |

Galat validasi memakai respons standar Laravel (422 + `errors`). JavaScript
menampilkan pesan di bawah kolom terkait.

## 3. Database Neon

- Gunakan **branch/database Neon terisolasi** untuk skema `klinik` (4 tabel
  inti beserta migrasi aditif Opsi B / Portal Dokter). Database lama
  (tabel `dokter`, `slot`, `janji`, dll.) dibiarkan apa adanya.
- `DB_URL` pooled untuk aplikasi; koneksi direct (tanpa `-pooler`) untuk
  `php artisan migrate`. Selalu `sslmode=require`.
- Pada pooler PgBouncer, aktifkan `PDO::ATTR_EMULATE_PREPARES => true` di
  `config/database.php` agar transaksi tidak gagal (`SQLSTATE 25P02`).

## 4. Pembersihan kode lama (bagian Tahap 1)

Kode implementasi sebelumnya (Blade, tabel berbahasa Indonesia, audit, slot,
Fornas, profil kesehatan) tidak sesuai rancangan. Pada Tahap 1:
- Hapus view Blade, controller web, service, policy, model, migrasi, dan test
  fitur yang tidak ada di RANCANGAN FINAL.
- Pertahankan scaffold Laravel, konfigurasi Neon, PHPUnit, dan Pint.
- Data publik di `data/` tetap disimpan; tidak dipakai aplikasi.

## 5. Perintah

```powershell
php artisan migrate --seed          # hanya pada database/branch Neon terisolasi
php artisan serve                   # jalankan lokal (APP_SURFACE=combined untuk uji terpadu, atau pasien/staf)
php artisan pengajuan:kedaluwarsa   # opsional/cron host staf: tandai pengajuan lewat waktu menjadi kedaluwarsa
php artisan test                    # menjalankan seluruh feature test API & database
vendor/bin/pint --test              # memeriksa standar gaya kode PHP
```

