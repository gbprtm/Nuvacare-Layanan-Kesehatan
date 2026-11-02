# Tinjauan Sistem dan Use Case

Tanggal tinjauan: 31 Oktober 2026  
Sumber utama: `docs/rancangan/ringkasan-proyek.md`, `docs/peta-bagian.md`, `docs/status-tugas.md`, dan `docs/01-laporan-unit/TINJAUAN-2026-10-29.md`.

> Dokumen ini merupakan ringkasan kondisi sistem dan tinjauan ketertelusuran dokumentasi. Kesimpulan di dalamnya didasarkan pada laporan dan berkas yang tersedia di repo. Verifikasi ulang ke database live belum dilakukan karena kredensial `.env` atau akses database belum disediakan.

## 1. Ringkasan proyek

Sistem ini adalah aplikasi web untuk membantu klinik mengelola kunjungan pasien. Fokusnya adalah menggantikan proses manual seperti buku jadwal, pemesanan slot, check-in, nomor antrean, perubahan jadwal, dan pencatatan kebiasaan pasien.

Sistem bukan aplikasi diagnosis dan bukan rekam medis lengkap. Sistem tidak memberikan rekomendasi medis, tidak memilihkan obat, tidak mengirim WhatsApp/email/push notification, dan tidak terintegrasi dengan SATUSEHAT pada rilis ini.

Aktor sistem hanya dua:

- **Pasien**, yang menggunakan aplikasi untuk mengelola profil, jadwal, janji, antrean, kebiasaan, obat, dan riwayat.
- **Admin klinik**, yang mengelola dokter, slot praktik, janji, kedatangan, status antrean, perubahan jadwal, obat, serta audit log.

Dokter bukan pengguna aplikasi. Dokter hanya disimpan sebagai data nama, spesialisasi, dan slot praktik.

## 2. Use case pasien

Pasien dapat:

1. Membuat akun dan masuk.
2. Mengisi atau memperbarui profil kesehatan, alergi, dan obat yang dikonsumsi.
3. Melihat jadwal kontrol berulang yang terbentuk dari anjuran kontrol.
4. Melihat pengingat jadwal di dalam aplikasi.
5. Memilih spesialis/dokter dan slot praktik.
6. Membuat janji dengan aturan satu slot hanya memiliki satu janji aktif.
7. Melihat janji yang dimiliki.
8. Melakukan check-in ketika tiba di klinik.
9. Mendapat nomor antrean final setelah check-in.
10. Melihat status antrean.
11. Menyetujui, menolak, atau memilih slot lain ketika admin mengusulkan perubahan jadwal.
12. Mencatat kebiasaan harian, seperti hidrasi, tidur, dan aktivitas.
13. Melihat resep dan menandai kepatuhan minum obat.
14. Melihat timeline riwayat janji, kunjungan, obat, dan jadwal berikutnya.

Alur utama pasien:

```text
Masuk
  -> Melihat atau memilih slot
  -> Membuat janji
  -> Datang ke klinik
  -> Check-in
  -> Mendapat nomor antrean final
  -> Menunggu dipanggil
  -> Melihat perubahan status kunjungan
```

Nomor antrean perkiraan hanya untuk membantu memperkirakan waktu datang. Nomor tersebut bukan urutan panggilan resmi.

## 3. Use case admin

Admin dapat:

1. Mengelola data dokter dan slot praktik.
2. Melihat janji pasien.
3. Memproses check-in pasien.
4. Mengubah status antrean dari menunggu, diperiksa, selesai, atau tidak hadir.
5. Mengoreksi status dengan alasan yang wajib dicatat.
6. Mengusulkan perubahan jadwal.
7. Membatalkan janji dengan alasan.
8. Mencatat aturan kontrol berulang.
9. Mencatat obat berdasarkan resep dokter.
10. Melihat audit log perubahan.

Batas data admin adalah nama pasien, jadwal, status, dan ringkasan alergi. Admin tidak boleh membuka catatan kebiasaan harian pasien.

Setiap perubahan penting harus mencatat:

- pelaku;
- waktu;
- objek yang diubah;
- nilai sebelum;
- nilai sesudah; dan
- alasan perubahan jika diperlukan.

Alur perubahan jadwal:

```text
Admin mengusulkan perubahan
  -> Sistem menyimpan alasan dan membuat pemberitahuan
  -> Pasien menerima pemberitahuan di aplikasi
  -> Pasien menyetujui, menolak, atau memilih slot lain
```

Janji lama tetap berlaku sampai pasien memberikan tanggapan.

## 4. Status implementasi saat ini

Berdasarkan `docs/status-tugas.md`:

- Total tugas: 44
- Selesai: 12
- Todo: 31
- Blocked: 1
- Doing: 0

Fondasi proyek, struktur Next.js, konfigurasi pengujian, sebagian skema database, constraint, dan seed sudah tersedia. Namun, alur produk secara end-to-end belum selesai.

`A09` sudah berstatus `blocked` karena:

- URL Vercel belum dilampirkan dan belum diverifikasi dari perangkat lain.
- Handler login belum tersedia.
- Keberhasilan login di lingkungan hosting belum terbukti.

## 5. Bagian yang sudah sistematis dan sesuai

### 5.1 Pemetaan rancangan ke kode

`docs/peta-bagian.md` sudah memetakan kebutuhan fungsional ke layar, modul kode, dan tugas. Contohnya:

- FR-03: janji anti-bentrok -> `src/modules/janji/` -> B03.
- FR-04: antrean -> `src/modules/antrian/` -> B07.
- FR-05: kebiasaan -> `src/modules/kebiasaan/` -> B11 dan C09.
- FR-10: audit log -> `src/modules/audit/` -> B06.

Pemetaan ini sudah menjadi dasar traceability, meskipun belum sepenuhnya diteruskan sampai ke bukti test per use case.

### 5.2 Status deployment sudah dikoreksi

Laporan tinjauan sudah membedakan antara CI lokal yang berhasil dan deployment/login hosting yang benar-benar terbukti. Karena URL dan handler login belum ada, A09 tidak lagi dinyatakan selesai.

### 5.3 Constraint janji sudah diuji ke database

A12 sudah memiliki bukti database nyata bahwa:

- janji aktif kedua pada slot yang sama ditolak;
- PostgreSQL menghasilkan error `23505`;
- constraint yang terpicu adalah `janji_slot_aktif_unique_idx`; dan
- janji yang dibatalkan dapat menempati slot yang sama.

Ini sesuai dengan aturan bisnis bahwa satu slot hanya boleh mempunyai satu janji aktif.

### 5.4 Seed sudah diuji idempoten

A13 sudah menunjukkan dua kali eksekusi seed dengan ID dan jumlah baris yang tetap. Hash password admin juga dapat diverifikasi dari data yang tersimpan.

## 6. Ketidaksesuaian dan celah yang masih harus diperbaiki

### 6.1 Login admin belum benar-benar terbukti

Acceptance criteria A13 menyatakan admin dapat login setelah seed. Bukti yang tersedia baru memverifikasi kecocokan password dengan hash database melalui `verifyPassword`.

Hal itu belum membuktikan alur login aplikasi yang sebenarnya, yaitu:

1. form login mengirim request;
2. server mencari akun;
3. password diverifikasi;
4. session dibuat;
5. cookie dikirim;
6. admin diarahkan ke area admin; dan
7. halaman admin dapat diakses.

Perbaikan yang diperlukan:

- buat handler login server-side;
- tambahkan uji login end-to-end atau integration;
- verifikasi session dan cookie; dan
- lampirkan hasil uji login lokal serta hosting.

### 6.2 Append-only belum ditegakkan sepenuhnya

Tidak adanya kolom `updated_at` bukan bukti bahwa baris tidak dapat diubah. Laporan A12 sendiri menyatakan `log_aktivitas` belum diuji dengan percobaan `UPDATE` yang ditolak dan belum memiliki trigger.

Perbaikan yang diperlukan:

- tambahkan trigger database yang menolak `UPDATE` dan `DELETE`, atau;
- gunakan hak akses database yang hanya mengizinkan `INSERT`; dan
- tambahkan uji yang membuktikan perubahan dan penghapusan ditolak.

Jika keputusan desain memang hanya membutuhkan sifat append-only pada level aplikasi, batasan itu harus ditulis jelas pada ADR atau PRD agar tidak dianggap sebagai jaminan database.

### 6.3 Folder laporan unit memuat bukti yang bukan unit test murni

A10-A13 memuat bukti migrasi, pemeriksaan PostgreSQL, constraint database, dan seed. Secara substansi bukti tersebut valid sebagai verifikasi data/database, tetapi penempatannya di `docs/01-laporan-unit/` dapat membingungkan.

Perbaikan yang diperlukan:

- bedakan laporan unit dari laporan database integration;
- beri label jenis test pada setiap laporan; dan
- pastikan nama folder, isi, dan definisi bukti menggunakan istilah yang sama.

### 6.4 Traceability belum lengkap sampai ke bukti test

Saat ini sudah ada hubungan:

```text
PRD -> FR -> modul -> tugas
```

Namun hubungan berikut belum lengkap:

```text
FR -> acceptance criteria -> test file -> hasil test -> bukti
```

Perlu dibuat matriks yang mencatat minimal:

| FR | Use case | Tugas | Modul | Berkas test | Jenis test | Status bukti |
|---|---|---|---|---|---|---|
| FR-03 | Membuat janji anti-bentrok | B03 | `src/modules/janji/` | integration/concurrency test | Integration | Belum lengkap |
| FR-04 | Check-in dan transisi antrean | B07 | `src/modules/antrian/` | `transisi-antrian.test.ts` | Integration | Todo |
| FR-07 | Login dan role | B01/A09 | `src/modules/auth/` | auth/security/e2e test | Security + E2E | Belum lengkap |
| FR-10 | Audit append-only | B06/A12 | `src/modules/audit/` | append-only test | Database | Belum lengkap |

### 6.5 Use case utama belum diuji end-to-end

Use case penting berikut belum mempunyai bukti lengkap:

```text
Login pasien
  -> Memilih slot
  -> Membuat janji
  -> Check-in
  -> Mendapat nomor antrean
  -> Admin memproses antrean
```

Constraint database sudah diuji, tetapi belum sama dengan membuktikan dua pengguna berebut slot melalui alur aplikasi/API dan hanya satu yang berhasil.

Uji yang masih diperlukan:

- `slot-rebutan` untuk concurrency;
- `transisi-antrian` untuk validasi status;
- skenario Playwright pasien; dan
- skenario Playwright admin.

### 6.6 Uji keamanan belum tersedia

Folder keamanan belum memiliki bukti nyata. Uji yang perlu dibuat meliputi:

- role bypass: pasien tidak boleh membuka area admin;
- IDOR: pasien tidak boleh membaca data pasien lain;
- validasi server-side pada setiap mutasi;
- session kedaluwarsa;
- pemeriksaan role di server, bukan hanya di UI.

### 6.7 UAT, SUS, dan performa belum tersedia

Uji sistem saat ini baru berupa kerangka/render check. Belum ada bukti:

- alur pasien lengkap;
- alur admin lengkap;
- penerimaan pengguna;
- skor SUS; dan
- hasil pengujian beban atau p95.

### 6.8 Angka hasil test perlu diberi konteks commit dan tanggal

Sebagian laporan tugas mencantumkan hasil seperti `27/27 passed`, sedangkan tinjauan terbaru mencantumkan `33 passed | 4 todo`. Perbedaan ini dapat terjadi karena laporan dibuat pada waktu berbeda, tetapi setiap hasil perlu diberi:

- commit yang diuji;
- tanggal eksekusi;
- perintah yang dijalankan; dan
- status apakah hasil tersebut masih merupakan hasil terkini.

## 7. Catatan akses database dan `.env`

Verifikasi database live belum dilakukan dalam tinjauan ini karena akses database atau `.env` belum disediakan.

Yang diperlukan untuk verifikasi lanjutan adalah salah satu cara berikut:

- akses ke database Neon yang aman; atau
- `.env` lokal yang sudah tersedia di workspace; atau
- connection string sementara dengan hak akses terbatas.

**Jangan menuliskan `DATABASE_URL`, `SESSION_SECRET`, atau kredensial lain ke dalam laporan, chat, commit, atau repository.** Jika akses diberikan, secret sebaiknya dikirim melalui mekanisme aman dan hanya dipakai untuk verifikasi. Nilai secret tidak perlu dicatat di bukti; cukup catat bahwa verifikasi dilakukan terhadap database test/staging.

Tanpa akses tersebut, laporan ini hanya dapat memastikan:

- struktur dan migrasi yang terlihat di repo;
- isi laporan yang sudah ditulis;
- test yang dapat dijalankan tanpa database live; dan
- konsistensi antara status tugas dan dokumen.

Laporan ini belum dapat memastikan kondisi aktual database Neon, isi tabel live, keberhasilan deployment, atau konfigurasi environment produksi.

## 8. Prioritas perbaikan

### P0 — Wajib sebelum menyatakan sistem siap

1. Sediakan handler login dan buktikan login secara end-to-end.
2. Deploy ke Vercel, lampirkan URL, dan uji dari perangkat lain.
3. Pastikan konfigurasi database staging/production terverifikasi tanpa membocorkan secret.
4. Perbarui status A09 hanya setelah dua bukti di atas tersedia.

### P1 — Wajib untuk membuktikan use case inti

1. Implementasikan uji integrasi pemesanan slot secara concurrent.
2. Implementasikan uji transisi status antrean.
3. Implementasikan uji keamanan role bypass dan IDOR.
4. Implementasikan E2E pasien dan admin.
5. Buat matriks traceability FR sampai bukti test.

### P2 — Penguatan kualitas dan audit

1. Tegakkan append-only dengan trigger atau hak akses database.
2. Seragamkan metadata tanggal, commit, dan versi pada semua laporan.
3. Pisahkan laporan unit, database integration, system/UAT, security, dan performance.
4. Tambahkan bukti UAT, SUS, dan performa.

## 9. Kesimpulan akhir

Dokumentasi proyek sudah jauh lebih jujur dan terarah dibanding kondisi awal. Pemetaan rancangan ke tugas dan modul sudah tersedia, constraint slot sudah dibuktikan ke PostgreSQL, dan status deployment yang belum terbukti sudah dikoreksi menjadi `blocked`.

Namun, sistem belum dapat dinyatakan selesai atau sepenuhnya sistematis karena login aplikasi, use case end-to-end, keamanan, UAT, performa, dan append-only database belum memiliki bukti lengkap. Selain itu, verifikasi database live belum dapat dilakukan karena akses `.env` atau database belum tersedia.

Kesimpulan paling tepat saat ini adalah:

> **Fondasi dan sebagian verifikasi database sudah berjalan, tetapi bukti perilaku aplikasi secara menyeluruh belum lengkap.**
