# Aturan kerja agen

Website janji temu klinik untuk **pasien** dan **admin**. Bahasa UI
Indonesia; nama kode Inggris.

## Sumber kebenaran

1. **[RANCANGAN FINAL](docs/RANCANGANFINAL.md)** — satu-satunya acuan
   kebutuhan, skema, endpoint, dan tahapan. **Jangan diubah.** Bila ada
   yang ambigu, catat di [catatan implementasi](docs/catatan-implementasi.md)
   atau tanyakan pemilik; jangan menambah fitur.
2. [Catatan implementasi](docs/catatan-implementasi.md) — keputusan kecil
   untuk celah di RANCANGAN FINAL.
3. [DESIGN.md](DESIGN.md) — tampilan dan token CSS.
4. [Status tugas](docs/status-tugas.md) — satu-satunya papan status.

`docs/rancangan/` adalah salinan read-only vault `brain-project` (PRD v0.3
dan wireframe lama). Isinya sejarah dan **tidak mengatur implementasi**.
Jangan menyunting atau memindahkannya.

## Stack

- Backend: Laravel sebagai **JSON API** (`routes/api.php`), Eloquent,
  PostgreSQL Neon, validasi Laravel, Sanctum token.
- Frontend: HTML, CSS, dan JavaScript murni di `public/` dengan `fetch()`.
  Tanpa Blade, tanpa framework UI, tanpa langkah build.
- Uji: PHPUnit (feature test API) dan Pint. Playwright Chrome opsional.

Dependensi baru perlu alasan dan izin pemilik.

## Di luar ruang lingkup

Mengikuti RANCANGAN FINAL §1.3: antrean/check-in, usulan perubahan jadwal,
slot/TTL, resep dan katalog Fornas, kebiasaan harian, konten statis, audit
log, log aktivitas. Juga tidak ada registrasi publik, NIK/KK, atau role
dokter. Jangan membangunnya kembali.

## Menjalankan satu tahap

1. Ambil tahap `todo` berikutnya di [status tugas](docs/status-tugas.md);
   ubah ke `doing`.
2. Kerjakan sesuai baris tahap di RANCANGAN FINAL §5.
3. Tulis feature test untuk endpoint tahap itu, lalu jalankan:
   `php artisan test` dan `vendor/bin/pint --test`.
4. Periksa halaman HTML terkait di browser.
5. Tulis bukti singkat di `docs/bukti/Tn.md`, lalu ubah ke `done` hanya bila
   kriteria selesai terbukti. Jika terhalang: `blocked` + sebab.
6. Commit hanya bila diminta pemilik, format `Tn: judul`. Jangan push paksa
   atau reset destruktif.

## Guardrail

- Setiap endpoint memvalidasi input dan memeriksa role. Pasien hanya
  mengakses data miliknya (`user_id` dari token, bukan dari input).
- Endpoint admin hanya untuk role `admin`; akses role lain 403, tanpa token 401.
- Rahasia hanya di `.env` melalui `config/*`. Jangan menyalin `.env` ke
  dokumen, log, bukti, atau JavaScript.
- Database: migrasi 4 tabel baru dijalankan pada **database/branch Neon
  terisolasi**. Dilarang `migrate:fresh`, `db:wipe`, atau drop pada database
  lama/produksi.
- Data seeder fiktif.

## Laporan hasil

Sebutkan tahap, status, berkas yang diubah, perintah uji dan hasil aktual,
serta blocker. Perintah yang gagal atau tidak dijalankan tidak disebut lulus.
