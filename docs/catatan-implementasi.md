# Catatan implementasi

Keputusan kecil untuk hal yang tidak dirinci [RANCANGAN FINAL](RANCANGANFINAL.md).
Dokumen ini tidak menambah fitur. Bila bertentangan, RANCANGAN FINAL yang
berlaku.

## 1. Keputusan atas celah rancangan

| No | Celah | Keputusan |
|---|---|---|
| 1 | Registrasi pasien, OTP WA & Login Google | Atas arahan pemilik, pasien dapat mendaftar mandiri via `daftar.html` dengan verifikasi OTP 6 digit ke WhatsApp (`POST /api/auth/register/send-otp` & `POST /api/auth/register/verify-otp`, TTL 5 menit, maks 5 percobaan). Login mendukung akun Google (`POST /api/auth/google`); bila nomor WhatsApp belum terverifikasi (`phone_verified_at = null`), muncul popup wajib verifikasi OTP WhatsApp (`POST /api/auth/phone/send-otp` & `POST /api/auth/phone/verify-otp`). Tamu dapat mengakses beranda publik `index.html` (`GET /api/public-info`). Reset kata sandi via email (`POST /api/forgot-password` & `POST /api/reset-password`). |
| 2 | Auth "Session atau Sanctum" | **Sanctum token**. `/api/login` mengembalikan token; `api.js` menyimpannya di `localStorage` dan mengirim `Authorization: Bearer <token>`. `/api/logout` menghapus token. |
| 3 | Admin butuh `user_id` untuk jadwal kontrol | `user_id` dipilih dari daftar pasien (`GET /api/admin/pasien`) pada formulir jadwal kontrol di `kelola-janji.html`. |
| 4 | Ketersediaan dokter (`is_active`) | Poli & dokter ditambah melalui `POST`. Admin dapat mengubah status ketersediaan dokter (`is_active`) lewat `PATCH /api/admin/dokter/{id}` agar dokter yang berhalangan tidak muncul di pilihan pasien. |
| 5 | Siapa yang membatalkan | Hanya admin, lewat `PATCH /api/admin/janji-temu/{id}` dengan `status = 'dibatalkan'`. |
| 6 | Validasi slot & bentrok jadwal | Tanpa tabel `slots` terpisah: kolom `appointment_time` (`08:00`–`16:00`) ditambahkan pada `appointments` dengan PostgreSQL *partial unique index* `(doctor_id, appointment_date, appointment_time) WHERE status = 'terjadwal'` untuk mencegah *double booking*. Saat jadwal diubah atau dibatalkan via `PATCH /api/admin/janji-temu/{id}`, backend mengirim notifikasi WhatsApp (`WhatsAppNotificationService`) dan menyertakan tautan `whatsapp_url` (`https://wa.me/62...`). |
| 7 | Vite | Tidak dipakai. CSS/JS langsung dari `public/css` dan `public/js`. |
| 8 | Tipe `id` | `BIGINT` auto increment (pilihan pertama di skema). |
| 9 | Nama produk | Belum diputuskan; pakai "Klinik Sehat" sebagai sementara. |

## 2. Aturan validasi minimum
| Endpoint | Aturan |
|---|---|
| `GET /api/public-info` | Publik (tanpa token); mengembalikan info klinik, `google_client_id`, dan daftar poliklinik beserta dokter aktif |
| `POST /api/register` | `name` wajib ≤ 255; `email` unik; `password` min 8 + `confirmed`; `birth_date` opsional sebelum hari ini (`before:today`) |
| `POST /api/auth/register/send-otp` | Validasi form pendaftaran + nomor WhatsApp unik; mengirim OTP 6 digit via Fonnte WhatsApp (TTL 5 menit, jeda kirim ulang 60 detik) |
| `POST /api/auth/register/verify-otp` | `phone_number` + `otp` 6 digit (maks 5 percobaan); membuat akun `User` dengan `phone_verified_at` terisi dan mengembalikan token Sanctum |
| `POST /api/login` | `email` wajib email, `password` wajib (dibatasi `throttle:15,1`); menyertakan `requires_phone_verification` |
| `POST /api/auth/google` | Menerima kredensial Google (`credential` ID token / profil OAuth), masuk atau membuat akun pasien, serta mengembalikan `requires_phone_verification` |
| `POST /api/auth/phone/send-otp` | `auth:sanctum`; mengirim kode OTP 6 digit ke nomor WhatsApp baru pengguna |
| `POST /api/auth/phone/verify-otp` | `auth:sanctum`; memverifikasi kode OTP 6 digit dan menyimpan `phone_number` serta `phone_verified_at` |
| `POST /api/forgot-password` | `email` wajib email terdaftar; mengirim tautan reset via SMTP (mengembalikan 503 JSON bila SMTP gagal) |
| `POST /api/reset-password` | `token` wajib; `email` wajib; `password` min 8 + `confirmed`; mencabut seluruh token Sanctum lama milik pengguna |
| `GET /api/slot-tersedia` | `doctor_id` ada; `date` tanggal ≥ hari ini; mengembalikan daftar slot jam beserta status `available` |
| `POST /api/janji-temu` | `polyclinic_id` ada; `doctor_id` ada, aktif (`is_active = true`), dan milik poli itu; `appointment_date` tanggal ≥ hari ini; `appointment_time` slot tersedia (menolak *double booking* dengan 422); `complaint` opsional ≤ 500 karakter |
| `PATCH /api/profil` | `name` ≤ 255; `phone_number` ≤ 30; `birth_date` tanggal sebelum hari ini; `address` teks; `password` opsional min 8 + `password_confirmation` |
| `GET /api/admin/janji-temu` | Mendukung filter query opsional `?date=YYYY-MM-DD`, `?status=`, `?type=`, dan `?doctor_id=` |
| `PATCH /api/admin/janji-temu/{id}` | `status` (`terjadwal/selesai/dibatalkan`); `appointment_date`, `appointment_time`, `doctor_id` opsional (divalidasi anti-bentrok); `doctor_notes` opsional ≤ 2000 karakter; memicu notifikasi WhatsApp |
| `POST /api/admin/jadwal-kontrol` | `user_id` wajib pengguna ber-role `pasien`; `polyclinic_id` ada; `doctor_id` aktif dan milik poli itu; `appointment_date` ≥ hari ini |
| `POST /api/admin/poli` | `name` wajib unik; `description` opsional |
| `POST /api/admin/dokter` | `polyclinic_id` ada; `name` wajib; `is_active` boolean opsional (default `true`) |
| `PATCH /api/admin/dokter/{id}` | `is_active` boolean wajib |
| `GET /api/admin/pasien` | Mengembalikan daftar pengguna dengan `role = 'pasien'` untuk pilihan jadwal kontrol |

Galat validasi memakai respons standar Laravel (422 + `errors`). JavaScript
menampilkan pesan di bawah kolom terkait.

## 3. Database Neon

- Gunakan **branch/database Neon baru** untuk skema 4 tabel. Database lama
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
php artisan migrate --seed   # hanya pada database terisolasi
php artisan serve            # buka http://127.0.0.1:8000 (beranda) atau /login.html
php artisan test             # menjalankan 30 feature test API & database
vendor/bin/pint --test       # memeriksa standar gaya kode PHP
node scripts/check-docs.mjs  # validasi tautan dokumen dan papan status
```

