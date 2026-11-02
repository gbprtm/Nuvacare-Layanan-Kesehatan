# Aturan kerja: migrasi Laravel

Website pasien dan admin klinik, bukan aplikasi native. Bahasa UI Indonesia;
nama kode Inggris. Keputusan pemilik mengganti stack dicatat dalam
[ADR migrasi](docs/keputusan/0002-migrasi-laravel.md).

## Stack dan keadaan repo

Target: Laravel + Blade (HTML), CSS biasa, JavaScript vanilla, Eloquent,
PostgreSQL Neon, validasi Laravel, PHPUnit, Pint, Playwright Google Chrome.
Vite hanya bundler aset. React, Inertia, Livewire, Tailwind, Drizzle, Zod,
dan Vitest bukan fondasi baru. Dependensi tambahan perlu alasan dan izin.

Repo sedang pada tahap dokumentasi/pengarsipan. `artisan`, `composer.json`,
dan aplikasi Laravel belum dibuat. Perintah aplikasi baru tersedia setelah
L01. Periksa versi dan dokumentasi resmi yang sesuai lockfile sebelum menulis
kode Laravel. PHP dan Composer belum ditemukan di PATH pada pemeriksaan awal.

## Sumber kebenaran dan batas penulisan

- **Teknis migrasi:** ADR di atas, `docs/rencana-agen.md`, dan kontrak aktif
  yang ditautkan `docs/README.md`. Ini pengecualian teknis yang disetujui
  terhadap stack/tugas Next.js lama, bukan perubahan kebutuhan produk.
- **Produk:** PRD/wireframe di `docs/rancangan/`, salinan read-only vault
  `C:\Users\HYPE AMD\Documents\brain-project`. Keduanya tetap read-only.
  Bila berbeda, vault yang benar: laporkan, jangan menyunting atau memindahkan.
  Pemilik memperbarui sumber vault lalu melakukan sinkron terkontrol.
- **Status:** hanya `docs/status-tugas.md`. ID L01–L17 aktif; A/B/C/D lama
  adalah sejarah di `_arsip/nextjs-2026-11-02/`, bukan hasil Laravel.
- **Visual:** baca `DESIGN.md` sebelum UI. Migrasi tidak menyetujui otomatis
  usulan brand, ambang kesehatan, atau perilaku bisnis yang masih terbuka.
- Arsip bersifat referensi. Jangan menjalankan migrasi, seed, CI, atau import
  Next.js dari sana. Pertahankan data sumber publik di `data/`.

## Menjalankan satu tugas

1. Pilih `todo` yang seluruh `depends`-nya `done` di status aktif.
2. Baca spesifikasi ID pada `docs/rencana-agen.md`, baris FR di
   `docs/peta-bagian.md`, lalu potongan PRD terkait saja. Untuk backend,
   baca gerbang terkait di `docs/tinjauan-backend-agen.md`.
3. Ubah ke `doing`; kerjakan hanya `paths` tugas dan bukti/statusnya. Perubahan
   route/config/model/layout bersama diserialkan. Perluasan scope harus dicatat.
4. Tambah/perbarui uji, jalankan `verify` tugas dan gerbang bersama G dalam
   rencana. Perintah yang gagal/nol tes/belum tersedia tidak disebut lulus.
5. Tulis bukti aktual `docs/bukti/Lxx.md`, lalu `done` hanya bila seluruh
   acceptance terbukti. Jika terhalang, `blocked` + sebab + kebutuhan pembuka.
6. Commit hanya jika diminta pemilik. Jika diizinkan, gunakan `Lxx: judul`
   dan isi hash nyata. Jangan melakukan push/reset destruktif.

## Guardrail implementasi

- Semua mutasi: validasi server, otorisasi sesi/peran/kepemilikan, CSRF.
  Role registrasi selalu pasien; admin individual melalui seed; dokter tanpa akun.
- Pasien hanya data sendiri; admin tidak melihat profil penuh, kebiasaan atau
  ringkasan kepatuhan pasien. Ringkasan alergi mengikuti batas PRD dan keputusan.
- Satu transaksi untuk perubahan admin dan audit wajib. Audit gagal berarti
  rollback. Tidak ada endpoint ubah/hapus audit.
- Slot lama selama usulan dan slot usulan harus dilindungi bersama. Locks,
  constraints dan test konkurensi PostgreSQL wajib; SQLite/mock bukan bukti.
- Env hanya melalui `config/*` Laravel; jangan membaca/menyalin `.env` untuk
  dokumentasi, menaruh secret di frontend/log/bukti, atau menimpa env lama.
- L02 inventaris/backup/restore terisolasi sebelum L03. Dilarang reset/wipe/drop
  atau `migrate:fresh` pada database existing/produksi. Cutover produksi L16
  memerlukan izin tersendiri. Migrasi stack bukan izin menghapus data.
- Tanggal bisnis melalui `app/Support/WibClock.php`, Asia/Jakarta, clock dapat
  dikontrol dalam tes. Aturan kalender ambigu diputuskan pemilik, bukan ditebak.
- Lima fitur wajib termasuk kebiasaan tetap masuk rilis. Ambang kesehatan tidak
  dikarang. Obat adalah catatan, bukan rekomendasi. Data demo fiktif tanpa NIK/KK.
- Halaman Blade/form bekerja tanpa JS. Animasi hanya tambahan, hormati reduced
  motion. Aksesibilitas, pesan kosong/galat dan responsivitas diuji per fitur.

## Laporan hasil

Tulis ID, status, berkas, perintah dan hasil uji aktual, lokasi bukti, serta
blocker. Untuk dokumentasi saja, validasi tautan/dependensi/arsip; jangan
mengklaim build Laravel, hosting, atau database sudah lulus.
