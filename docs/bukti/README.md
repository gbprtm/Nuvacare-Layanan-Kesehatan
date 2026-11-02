# Bukti implementasi Laravel

Folder ini menampung hasil **aktual** L01–L17. Saat penataan dokumentasi belum
ada tugas implementasi yang diuji. Jangan membuat laporan Lxx berisi lulus
sebelum menjalankan pengujian. Bukti Next.js tersimpan terpisah dalam arsip.

Setiap `Lxx.md` memuat:

1. ID, tanggal, revisi kerja/commit nyata bila ada, versi runtime dan dependency.
2. Lingkungan lokal/staging/produksi dan identitas DB nonrahasia yang cukup
   membuktikan isolasi; jangan tulis connection string, token, atau password.
3. Pemetaan setiap acceptance ke nama test/skenario dan hasil sebenarnya.
4. Perintah, exit code, jumlah tes/assertion dan keluaran relevan. Nol tes,
   skip, gagal, timeout, atau belum dijalankan disebutkan apa adanya.
5. Untuk UI: langkah dan hasil per aksi, state kosong/galat/proses, keyboard,
   lebar layar dan browser yang benar-benar diperiksa.
6. Untuk DB: constraint/race dengan koneksi berbeda, rollback dan isolasi yang
   terverifikasi; SQLite/mock tidak menggantikan bukti PostgreSQL.
7. Kriteria yang belum tercapai, sebab, keputusan/kredensial yang dibutuhkan,
   dan lokasi artefak aman. Bukti parsial tidak menutup seluruh tugas.

Status hidup tetap hanya di [status-tugas.md](../status-tugas.md). Bukti
pengarsipan/dokumentasi awal ada di [00-penataan](../migrasi/00-penataan.md),
bukan bukti bahwa aplikasi Laravel sudah berjalan.
