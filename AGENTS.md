# Aturan kerja agen

Website janji temu klinik untuk **pasien**, **admin**, dan **dokter (baca-saja)** dengan pemisahan dua permukaan (`APP_SURFACE`: `pasien` dan `staf`). Bahasa UI Indonesia; nama kode Inggris.

## Sumber kebenaran

1. **[RANCANGAN FINAL](docs/RANCANGANFINAL.md)**, satu-satunya acuan
   kebutuhan, skema, endpoint, dan tahapan. **Jangan diubah tanpa persetujuan pemilik.** Bila ada
   yang ambigu, catat di [catatan implementasi](docs/catatan-implementasi.md)
   atau tanyakan pemilik; jangan menambah fitur.
2. [Catatan implementasi](docs/catatan-implementasi.md), keputusan kecil
   untuk celah di RANCANGAN FINAL.
3. [DESIGN.md](DESIGN.md), tampilan dan token CSS.
4. [Status tugas](docs/status-tugas.md), satu-satunya papan status.

`docs/rancangan/` adalah salinan read-only vault `brain-project` (PRD v0.3
dan wireframe lama). Isinya sejarah dan **tidak mengatur implementasi**.
Jangan menyunting atau memindahkannya.

## Stack

- Backend: Laravel sebagai **JSON API** (`routes/api.php`), Eloquent,
  PostgreSQL Neon, validasi Laravel, Sanctum token (dibedakan dengan ability
  `surface:pasien` dan `surface:staf`), serta RBAC staf (`admin` dan `dokter`)
  via Laravel Gate/Policy.
- Frontend: HTML, CSS, dan JavaScript murni dengan `fetch()`. Aset bersama
  (CSS, JS, gambar, ikon) berada di `public/`; halaman HTML pasien di
  `surfaces/pasien/` dan halaman HTML staf (`staf/login.html`, `admin/*`,
  `dokter/*`) di `surfaces/staf/`, disajikan murni oleh `routes/web.php`
  sesuai `APP_SURFACE` (`pasien`, `staf`, atau `combined` untuk lokal/test).
  Tanpa Blade, tanpa framework UI, tanpa langkah build.
- Uji: PHPUnit (feature test API) dan Pint. Playwright Chrome opsional.
- Standar kualitas UI, teks, dan kode: **Wajib selalu memuat dan menerapkan skill `antislop`** beserta sub-skill terkait (`antislop-ui`, `antislop-human`, `antislop-layoutmobile`, `antislop-copywriting`, `antislop-code`) pada setiap pembuatan maupun revisi halaman, komponen, teks UI, dan kode. Setiap perubahan antarmuka wajib melewati pemeriksaan *Anti-Slop Delivery Gate* (satu titik fokus utama per layar, tanpa *em dash*, kontras WCAG AA minimal 4.5:1 untuk teks dan 3:1 untuk tepi kontrol, target sentuh minimal 44x44px, serta tidak ada elemen generik yang berlebihan).

Dependensi baru perlu alasan dan izin pemilik.

## Di luar ruang lingkup

Mengikuti RANCANGAN FINAL §1.3: antrean/check-in, usulan perubahan jadwal
(reschedule proposal) dengan slot/TTL, resep dan katalog Fornas, kebiasaan
harian, konten statis, audit log kompleks di luar perubahan status janji dan
pengajuan pembatalan (log sederhana `status_change_logs` diizinkan). Tidak ada
registrasi publik untuk staf/dokter maupun data NIK/KK. Dokter bersifat
baca-saja dan dilarang menulis atau mengubah data apa pun selain pengajuan
pembatalannya sendiri. Jangan membangunnya kembali.

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
- Pemisahan permukaan & surface token: deployment hanya mendaftarkan rute
  sesuai `APP_SURFACE` (`pasien`, `staf`, atau `combined`). Token Sanctum
  wajib membawa ability `surface:pasien` atau `surface:staf`; token pasien
  ditolak di endpoint staf dan token staf ditolak di endpoint pasien.
- RBAC staf: endpoint admin dan dokter menegakkan izin melalui Laravel
  Gate/Policy; akses tanpa token mengembalikan 401, role atau izin salah
  mengembalikan 403.
- Endpoint dokter (`/api/dokter/*`): hanya untuk role `dokter` dengan akun
  aktif (`disabled_at` null) yang terhubung ke baris `doctors` aktif dan
  valid; `doctor_id` diambil dari akun dokter (bukan dari input), janji atau
  pengajuan milik dokter lain mengembalikan 404, kontak pasien wajib
  disamarkan, serta `complaint` dan `doctor_notes` tidak boleh dikirim ke
  dokter.
- Tanpa hard delete & wajib log status: tidak ada penghapusan permanen untuk
  janji temu, pengajuan pembatalan, maupun log; setiap perubahan status janji
  temu dan pengajuan pembatalan (termasuk melalui endpoint admin lama) wajib
  mencatat satu baris append-only pada `status_change_logs`.
- Rahasia hanya di `.env` melalui `config/*`. Jangan menyalin `.env` ke
  dokumen, log, bukti, atau JavaScript.
- Database: migrasi (4 tabel inti dan migrasi aditif skema `klinik`)
  dijalankan pada **database/branch Neon terisolasi**. Dilarang
  `migrate:fresh`, `db:wipe`, atau drop pada database lama/produksi.
- Data seeder fiktif.

## Laporan hasil

Sebutkan tahap, status, berkas yang diubah, perintah uji dan hasil aktual,
serta blocker. Perintah yang gagal atau tidak dijalankan tidak disebut lulus.
