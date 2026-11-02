# Catatan implementasi

Keputusan kecil untuk hal yang tidak dirinci [RANCANGAN FINAL](RANCANGANFINAL.md).
Dokumen ini tidak menambah fitur. Bila bertentangan, RANCANGAN FINAL yang
berlaku.

## 1. Keputusan atas celah rancangan

| No | Celah | Keputusan |
|---|---|---|
| 1 | Registrasi pasien & tamu | Atas arahan pemilik, pasien dapat mendaftar mandiri via `daftar.html` (`POST /api/register`). Tamu dapat mengakses beranda publik `index.html` (`GET /api/public-info`). Reset kata sandi via email (`POST /api/forgot-password` & `POST /api/reset-password`). Tampilan akun demo dihilangkan dari `login.html`. |
| 2 | Auth "Session atau Sanctum" | **Sanctum token**. `/api/login` mengembalikan token; `api.js` menyimpannya di `localStorage` dan mengirim `Authorization: Bearer <token>`. `/api/logout` menghapus token. |
| 3 | Admin butuh `user_id` untuk jadwal kontrol | `user_id` dipilih dari daftar pasien (`GET /api/admin/pasien`) pada formulir jadwal kontrol di `kelola-janji.html`. |
| 4 | Ketersediaan dokter (`is_active`) | Poli & dokter ditambah melalui `POST`. Admin dapat mengubah status ketersediaan dokter (`is_active`) lewat `PATCH /api/admin/dokter/{id}` agar dokter yang berhalangan tidak muncul di pilihan pasien. |
| 5 | Siapa yang membatalkan | Hanya admin, lewat `PATCH /api/admin/janji-temu/{id}` dengan `status = 'dibatalkan'`. |
| 6 | Bentrok jadwal (Tahap 4) | Tidak ada penguncian slot. Admin memfilter daftar janji per tanggal (`?date=YYYY-MM-DD`), mengubah status menjadi `dibatalkan`, dan menuliskan rekomendasi dokter pengganti pada `doctor_notes` yang tampil di halaman `janji-temu.html` pasien. |
| 7 | Vite | Tidak dipakai. CSS/JS langsung dari `public/css` dan `public/js`. |
| 8 | Tipe `id` | `BIGINT` auto increment (pilihan pertama di skema). |
| 9 | Nama produk | Belum diputuskan; pakai "Klinik Sehat" sebagai sementara. |

## 2. Aturan validasi minimum
| Endpoint | Aturan |
|---|---|
| `POST /api/login` | `email` wajib email, `password` wajib |
| `POST /api/janji-temu` | `polyclinic_id` ada; `doctor_id` ada, aktif, dan milik poli itu; `appointment_date` tanggal ≥ hari ini; `complaint` opsional ≤ 500 karakter |
| `PATCH /api/profil` | `name` ≤ 255; `phone_number` ≤ 30; `birth_date` tanggal sebelum hari ini; `address` teks; `password` min 8 + `password_confirmation` |
| `PATCH /api/admin/janji-temu/{id}` | `status` salah satu `terjadwal/selesai/dibatalkan`; `doctor_notes` opsional |
| `POST /api/admin/jadwal-kontrol` | `user_id` pasien; `polyclinic_id`; `doctor_id`; `appointment_date` ≥ hari ini |
| `POST /api/admin/poli` | `name` wajib; `description` opsional |
| `POST /api/admin/dokter` | `polyclinic_id` ada; `name` wajib |
| `PATCH /api/admin/dokter/{id}` | `is_active` boolean wajib |

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
php artisan serve            # buka http://127.0.0.1:8000/login.html
php artisan test
vendor/bin/pint --test
node scripts/check-docs.mjs  # validasi tautan dokumen dan papan status
```

