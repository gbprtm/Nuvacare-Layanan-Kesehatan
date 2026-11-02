> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

# Product Requirements Document (PRD)

**Product / Feature Name:** Aplikasi Pengelola Kesehatan Personal **Author:** Tim Kelompok 4 - Arya Tri Utomo, Gilang Bayu Pratomo, Vigo Rasha, Dita, Ibnu Zaki **Stakeholders:** Dosen pengampu Implementasi dan Pengujian Perangkat Lunak, pembimbing, tim 5 anggota **Status:** Draft (v0.3 - keputusan 24 Okt 2026 sudah tercatat; butir ASUMSI masih menunggu konfirmasi) **Version:** 0.3 **Last Updated:** 24 Oktober 2026

> Catatan: dokumen ini adalah revisi dari versi 0.1 (21 Oktober 2026) yang mengikuti struktur `docs/produk/PRD Template.md`. Revisi ini memasukkan masukan dosen (peran admin dan pertanggungjawaban pada tema kesehatan), keputusan **dua role (pasien dan admin)**, penguatan pengalaman pengguna, dan seluruh butir to-do hasil review. Istilah FB-1 sampai FB-6 dipertahankan supaya bisa dirujuk dari laporan pengujian. Semua butir yang masih berupa asumsi ditandai **(ASUMSI)** dan terdaftar di bagian 8.2 serta 9.
>
> **Versi 0.3 (24 Oktober 2026)** menambahkan keputusan yang diambil setelah review v0.2:
> (a) **catatan resep + kepatuhan minum obat** (FR-12) - aplikasi mencatat obat yang diresepkan dokter, tidak pernah menyarankan obat;
> (b) **timeline kunjungan pasien** (FR-13) yang menggabungkan riwayat, catatan obat, dan jadwal kontrol berikutnya;
> (c) **log aktivitas akun** (FR-14);
> (d) **nomor antrian estimasi** saat pemesanan dan **nomor final** saat check-in;
> (e) jadwal kontrol dengan **agenda + toggle bulan**, bukan kalender penuh;
> (f) status antrian **Tidak hadir**;
> (g) **SATUSEHAT dinyatakan di luar rilis** dan **Formularium Nasional (Fornas)** dipakai sebagai rujukan sumber data obat.
> Berkas ini adalah salinan revisi dari `final -.md` (v0.2). Versi 0.2 dan seluruh versi sebelumnya dibekukan di `_arsip/2026-10-24/`.

## 1. Overview

### 1.1 Summary

Aplikasi web pengelola kesehatan personal yang tersambung ke alur klinik. Pasien mencatat kondisi dan kebiasaannya sendiri, sementara jadwal temu, pemilihan spesialis, dan antrian kunjungan mengikuti cara kerja klinik yang dikelola **admin** (staf klinik). Keputusan medis tetap di tangan tenaga kesehatan; aplikasi hanya membantu pasien konsisten dan teratur, dan membantu admin mengelola jadwal serta antrian dengan jejak yang dapat dipertanggungjawabkan. Dokter direpresentasikan sebagai **data** (nama, spesialisasi, slot praktik), bukan sebagai pengguna aplikasi.

Produk dibangun sebagai tugas mata kuliah dengan lima fitur wajib dan satu fitur pelengkap. Seluruh aturan pentingnya harus punya bukti uji yang bisa ditunjukkan saat presentasi.

### 1.2 Background and Context

Pelayanan di klinik kecil masih banyak dikerjakan manual. Pasien tidak mengetahui posisi antriannya, jadwal kontrol mudah terlewat karena tidak ada pengingat, dan catatan kebiasaan harian tidak tersimpan sehingga sulit dilihat perkembangannya. Aplikasi kesehatan konsumen umumnya berhenti pada saran umum yang tidak terhubung ke jadwal kunjungan nyata.

Inisiatif ini muncul dari Final Ide kelompok (19 Oktober 2026) yang menggabungkan dua arah: alur klinik (jadwal, janji, antrian) dan pelacak kesehatan personal (kebiasaan harian). Pada bimbingan, dosen menekankan bahwa pada tema kesehatan harus jelas **bagaimana admin melihat dan mengubah jadwal, bagaimana pasien dapat menanggapi perubahan itu, dan bagaimana tindakan admin dipertanggungjawabkan**. Tenggat hosting 2 November 2026, sehingga ruang lingkup dikunci ketat.

**Dasar bukti masalah (to-do):** kondisi klinik manual di atas masih berupa pengamatan kelompok. Sebelum 28 Oktober 2026, tambahkan satu paragraf bukti sederhana (observasi singkat atau wawancara satu sampai dua orang pasien atau staf klinik) di bagian ini **(ASUMSI: dikerjakan oleh Dita)**.

### 1.3 Problem Statement

> Pasien dengan kondisi kronis (mis. hipertensi) di klinik kecil kesulitan menjaga jadwal kontrol dan mencatat kebiasaannya karena semuanya diandalkan pada ingatan dan catatan manual. Posisi antrian tidak transparan, dan perubahan jadwal dari pihak klinik sering tidak sampai atau tidak bisa ditanggapi pasien, sehingga kontrol terlewat dan riwayat kesehatan personal tidak pernah terbentuk.

### 1.4 Batasan yang Diakui

Produk ini **tidak menjanjikan** bahwa pasien akan selalu ingat jadwalnya. Pengingat dan pemberitahuan hanya tampil di dalam aplikasi (lihat Non-Goals 5), sehingga pasien tetap harus membuka aplikasi untuk melihatnya. Konsekuensi yang harus dinyatakan terang-terangan:

- Perubahan jadwal oleh admin hanya efektif bila pasien membuka aplikasi sebelum batas waktu jawaban.
- Bila pasien tidak membuka aplikasi, klinik bisa terjebak pada slot lama yang sudah tidak bisa dilayani.
- Untuk persona usia 40-65 dengan literasi digital rendah, ini titik lemah yang diakui, bukan disembunyikan.

**Mitigasi yang diusulkan (menunggu keputusan tim, belum masuk ruang lingkup):**

1. **Penanda "belum dibaca"** di dashboard admin, sehingga admin tahu perubahan belum sampai dan dapat menelusuri pasien secara manual. Biaya: rendah.
2. **Blok "sejak terakhir masuk"** di Beranda yang merangkum perubahan janji dan pengingat terlewat, agar satu kali membuka aplikasi sudah cukup. Biaya: rendah.
3. **Hak admin membatalkan paksa dengan alasan wajib** ketika batas waktu jawaban lewat, sehingga klinik tidak terikat pada slot yang tidak tersedia. Biaya: rendah (memakai FR-08 yang sudah ada).

**Bukti masalah** juga masih terbatas pada pengamatan kelompok (lihat 1.2). Bila bukti tidak terkumpul sebelum 28 Oktober 2026, klaim pada 1.3 harus **diperlunak**, bukan dibuat-buat.

## 2. Goals and Success Metrics

### 2.1 Goals

1. Pasien dapat mengikuti jadwal kontrol dan kebiasaan harian tanpa bergantung pada ingatan.
2. Klinik (lewat admin) memiliki alur janji dan antrian yang konsisten serta mencegah satu slot dipakai dua pasien.
3. Setiap perubahan janji oleh admin **diberitahukan, dapat ditanggapi pasien, dan tercatat** sehingga dapat dipertanggungjawabkan.
4. Pengalaman pasien (pengguna akhir) mudah dan jelas bagi usia 40 sampai 65 tahun dengan literasi digital rendah sampai sedang.
5. Setiap aturan penting punya bukti uji yang bisa ditunjukkan saat presentasi dan saat penilaian mata kuliah.
6. Pasien kronis dapat memantau kepatuhan minum obat yang diresepkan dokter, tanpa aplikasi pernah menyarankan obat.

### 2.2 Non-Goals

1. Rekomendasi gaya hidup personal - ditolak di Final Ide karena tidak dapat dipertanggungjawabkan tanpa peninjauan tenaga kesehatan.
2. **Pemberian resep oleh aplikasi**, farmasi/penebusan obat, pembayaran, dan bagian alur klinik lain di luar lima fitur. Aplikasi hanya **mencatat** obat yang diresepkan dokter (FR-12); aplikasi tidak menulis resep, tidak memilih obat, dan tidak menghitung dosis.
3. Aplikasi mobile native - produk berbentuk website di browser.
4. Integrasi ke sistem klinik sungguhan, termasuk sandbox SATUSEHAT Kemenkes - hanya simulasi alur internal. **Keputusan v0.3:** SATUSEHAT tidak diintegrasikan pada rilis ini. Sandbox-nya adalah platform pertukaran data (FHIR R4) yang menuntut faskes terdaftar, bukan sumber rekomendasi obat, sehingga integrasinya dipindahkan ke bagian Pengembangan Lanjutan. Sumber data obat memakai **Formularium Nasional (e-fornas.kemkes.go.id)** yang ditetapkan lewat Kepmenkes. Struktur data tetap dirancang agar mudah dipetakan ke standar nasional **(ASUMSI, perlu konfirmasi pembimbing)**.
5. Notifikasi push, email, atau WhatsApp - pemberitahuan hanya tampil di dalam aplikasi **(ASUMSI, perlu konfirmasi)**.
6. Reset password, verifikasi email, login pihak ketiga (OAuth), dan registrasi mandiri untuk akun admin.
7. Akun dokter. Dokter hanya data dan tidak memiliki login.

### 2.3 Success Metrics

|Metric|Baseline|Target|Measurement Method|Timeframe|
|---|---|---|---|---|
|Hosting aktif|Belum ada|Tautan hidup dan bisa diakses|Buka URL dari perangkat lain|2 Nov 2026|
|Skenario hipertensi ujung ke ujung|0 dari 10 langkah|10 dari 10 langkah lulus|Tabel lulus/gagal system test|Review pekan kedua (30-31 Okt)|
|Uji per fitur|0|Minimal 1 unit atau integration test lulus per FB|Keluaran runner di `docs/01-..02-`|Saat kartu tugas ditutup|
|UAT|0 penguji luar|Minimal 1 penguji di luar tim untuk peran pasien dan 1 untuk peran admin|Skrip UAT bertanda tangan|Sebelum hari H|
|Konten statis bersumber resmi|0 materi|100% materi punya URL + tanggal pengambilan|Review manual|Pekan pertama|
|Waktu respons endpoint janji dan antrian|Belum diukur|p95 di bawah 2 detik pada 50-100 permintaan bersamaan|Skrip load, catat p95|Sebelum rilis|
|Uji rebutan slot|Belum ada|Tepat satu janji berhasil dari percobaan serentak|Tes reliability|Sebelum rilis|
|Akuntabilitas tindakan admin|Belum ada|100% perubahan janji dan status oleh admin menghasilkan tepat satu catatan audit|Uji integration dan pemeriksaan log|Sebelum rilis|
|Jumlah layar per tujuan (UX)|Belum diukur|Maksimal 5 layar dari halaman masuk sampai tujuan tercapai|Hitung manual pada alur inti|Review pekan kedua|
|Waktu penyelesaian tugas "buat janji" (UX)|Belum diukur|Median di bawah 3 menit pada UAT **(angka sementara)**|Pencatatan waktu saat UAT|UAT|
|Skor kegunaan SUS (UX)|Belum diukur|Minimal 68 **(angka sementara)**|Kuesioner SUS setelah UAT|UAT|
|Tanggapan pasien terhadap usulan perubahan (UX)|Belum ada|Pasien dapat menanggapi (setuju, tolak, pilih slot lain) dalam maksimal 3 ketukan dari notifikasi|Uji alur manual dan UAT|Sebelum rilis|
|Kepatuhan minum obat tercatat|Belum ada|Minimal 1 catatan minum obat tersimpan per hari untuk obat aktif, dan ringkasan 7 hari terakhir benar|Uji unit + integration|Sebelum rilis|
|Ketepatan nomor antrian|Belum ada|Nomor final hanya terbit setelah check-in; nomor estimasi tidak pernah dipakai sebagai urutan panggilan|Uji integration|Sebelum rilis|

## 3. Users and Use Cases

### 3.1 Target Users and Personas

|Persona|Description|Key Needs|Pain Points|
|---|---|---|---|
|Pasien kronis (hipertensi)|Pasien rutin klinik kecil, usia 40-65, literasi digital rendah sampai sedang, memakai browser ponsel|Tahu kapan kontrol berikutnya, bisa membuat janji, tahu posisi antrian, mencatat kebiasaan dengan cepat, mengerti dan bisa menanggapi perubahan jadwal|Lupa jadwal, tidak tahu harus datang jam berapa, jadwal berubah tanpa kabar, catatan kesehatan hilang|
|Admin (staf klinik)|Petugas klinik yang mengatur jadwal temu (slot dokter dan janji) dan antrian pemeriksaan|Mengelola slot dan janji, memproses status antrian, mencatat aturan kontrol berulang sesuai anjuran dokter, mengusulkan atau membatalkan janji dengan jelas|Jadwal ditulis manual, dua pasien bisa mendapat slot yang sama, perubahan jadwal sulit disampaikan|
|Tamu (belum masuk)|Pengunjung yang membuka tautan tanpa akun|Hanya perlu tahu produk ini apa|Tidak boleh melihat data apa pun|

Catatan: **dokter bukan persona pengguna**. Dokter hadir sebagai data (nama, spesialisasi, slot praktik) yang dikelola admin.

### 3.2 User Stories

| ID    | As a... | I want to...                                                                            | So that...                                                                           | Priority |
| ----- | ------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| US-01 | Pasien  | Mendaftar dan masuk dengan email dan kata sandi                                         | Data saya terikat pada satu akun                                                     | Must     |
| US-02 | Pasien  | Mengisi, melihat, mengubah, dan menghapus profil (kondisi, alergi, obat)                | Klinik punya dasar informasi dan saya tidak perlu mengulang cerita                   | Must     |
| US-03 | Pasien  | Melihat jadwal kontrol berulang yang terbentuk otomatis                                 | Saya tahu kapan harus datang tanpa menghitung sendiri                                | Must     |
| US-04 | Pasien  | Mendapat pengingat di dalam aplikasi tiga hari sebelum jatuh tempo                      | Saya tidak melewatkan kontrol                                                        | Must     |
| US-05 | Pasien  | Melihat spesialis dan slot kosong                                                       | Saya bisa memilih waktu yang cocok                                                   | Must     |
| US-06 | Pasien  | Membuat janji pada satu slot                                                            | Slot itu terkunci untuk saya dan tidak dipakai orang lain                            | Must     |
| US-07 | Pasien  | Melakukan check-in saat datang dan menerima nomor antrian beserta posisinya             | Saya tahu urutan dan perkiraan giliran                                               | Must     |
| US-08 | Admin   | Mengubah status antrian menunggu, diperiksa, selesai                                    | Alur kunjungan tercatat rapi                                                         | Must     |
| US-09 | Admin   | Mencatat aturan kontrol berulang untuk pasien sesuai anjuran dokter                     | Jadwal berikutnya terbentuk tanpa input manual dan keputusan medis tetap pada dokter | Must     |
| US-10 | Pasien  | Mencatat hidrasi, jam tidur, dan aktivitas harian                                       | Kebiasaan saya terdokumentasi                                                        | Should   |
| US-11 | Pasien  | Melihat ringkasan kepatuhan dan runtutan hari                                           | Saya tahu seberapa konsisten saya                                                    | Should   |
| US-12 | Pasien  | Melihat panel konten statis sesuai kondisi yang tercatat                                | Saya mendapat informasi resmi yang relevan                                           | Could    |
| US-13 | Pasien  | Ditolak saat mencoba membuka data pasien lain lewat URL                                 | Data saya tidak bisa diintip orang lain                                              | Must     |
| US-14 | Tamu    | Ditolak saat membuka halaman inti                                                       | Tidak ada data yang bocor sebelum masuk                                              | Must     |
| US-15 | Admin   | Mengelola daftar dokter dan slot praktik                                                | Pasien hanya melihat slot yang benar-benar tersedia                                  | Must     |
| US-16 | Admin   | Mengusulkan perubahan slot pada janji pasien dengan alasan                              | Perubahan jadwal dari klinik tidak mengagetkan pasien                                | Must     |
| US-17 | Admin   | Membatalkan janji dengan alasan wajib                                                   | Pasien tahu penyebab dan dapat menjadwalkan ulang                                    | Must     |
| US-18 | Pasien  | Menerima pemberitahuan perubahan janji lalu menyetujui, menolak, atau memilih slot lain | Saya tetap memegang kendali atas jadwal saya                                         | Must     |
| US-19 | Pasien  | Melihat riwayat perubahan pada janji saya                                               | Saya tahu siapa mengubah apa dan kapan                                               | Should   |
| US-20 | Admin   | Tindakan saya tercatat dalam audit log                                                  | Tindakan saya dapat dipertanggungjawabkan                                            | Must     |
| US-21 | Admin   | Hanya melihat data pasien yang diperlukan untuk tugas saya                              | Data kesehatan sensitif tidak dibuka tanpa kebutuhan                                 | Must     |
| US-22 | Pasien  | Ditolak saat membuka halaman admin                                                      | Fungsi admin tidak bisa dipakai oleh pasien                                          | Must     |
| US-23 | Pasien  | Melihat riwayat janji dan kunjungan saya                                                | Saya dapat meninjau kunjungan sebelumnya                                                | Must     |
| US-24 | Pasien  | Melihat daftar obat yang diresepkan dokter beserta dosis dan aturan pakainya            | Saya tidak lupa obat apa yang harus saya minum                                         | Must     |
| US-25 | Pasien  | Menandai obat yang sudah saya minum setiap hari                                          | Saya bisa melihat seberapa patuh saya menjalani pengobatan                             | Must     |
| US-26 | Pasien  | Melihat satu timeline berisi janji, kunjungan, obat, dan jadwal kontrol berikutnya       | Saya tidak perlu membuka banyak halaman untuk memahami riwayat kesehatan saya           | Must     |
| US-27 | Pasien  | Melihat log aktivitas akun saya sendiri                                                  | Saya tahu apa saja yang pernah saya lakukan di aplikasi                                 | Should   |

### 3.3 Key Use Case Scenarios

1. **UC-1 Alur hipertensi (skenario resmi 10 langkah):** (1) pasien masuk dan mengisi profil dengan kondisi hipertensi, (2) admin mencatat anjuran kontrol bulanan dari dokter, (3) jadwal kontrol terbentuk otomatis, (4) pengingat muncul tiga hari sebelum jatuh tempo, (5) pasien memilih spesialis dan membuat janji sehingga slot terkunci, (6) admin mengusulkan perubahan slot karena dokter berhalangan dan pasien menyetujuinya, (7) pasien datang dan check-in sehingga mendapat nomor antrian, (8) admin menggerakkan status menunggu lalu diperiksa lalu selesai, (9) jadwal kontrol berikutnya terbentuk otomatis, dan (10) di antara kunjungan pasien mencatat kebiasaan serta melihat ringkasan kepatuhan.
2. **UC-2 Rebutan slot:** dua pasien membuka slot yang sama dan menyimpan hampir bersamaan. Tepat satu berhasil, yang lain menerima pesan jelas bahwa slot sudah diambil, dan tidak ada data setengah tersimpan.
3. **UC-3 Akses lintas pasien:** pasien yang sudah masuk mengubah ID di URL ke ID pasien atau janji lain. Sistem menolak, bukan menampilkan data tersebut.
4. **UC-4 Tamu:** pengunjung tanpa sesi membuka halaman profil, jadwal, janji, antrian, atau catatan kebiasaan. Semua permintaan ditolak dan diarahkan ke halaman masuk.
5. **UC-5 Kondisi batas:** profil belum diisi, tidak ada slot tersedia, jadwal terlewat, check-in dua kali, dan tanggal catatan bolong - masing-masing punya perilaku yang sudah ditetapkan di bagian 4.3.
6. **UC-6 Usulan perubahan janji:** admin mengusulkan slot baru beserta alasan, pasien menerima pemberitahuan, lalu menyetujui, menolak, atau memilih slot lain. Janji lama tetap aktif sampai pasien menjawab.
7. **UC-7 Pembatalan oleh admin:** admin membatalkan janji dengan alasan, pasien diberi tahu dan ditawari penjadwalan ulang.
8. **UC-8 Akses lintas peran:** pasien membuka halaman admin dan admin membuka catatan kebiasaan pasien. Keduanya ditolak.

### 3.4 Siklus Status Janji

|Status|Arti|Transisi yang diizinkan|
|---|---|---|
|Aktif|Janji berjalan normal|Perubahan diusulkan, Dibatalkan, Selesai|
|Perubahan diusulkan|Admin mengusulkan slot baru; janji lama tetap berlaku sampai pasien menjawab|Aktif (pasien setuju atau menolak atau batas waktu lewat), Dibatalkan|
|Dibatalkan|Dibatalkan pasien atau admin dengan alasan|Tidak ada (pasien membuat janji baru)|
|Selesai|Kunjungan tuntas|Tidak ada|
|Tidak hadir|Pasien tidak check-in sampai jam tutup klinik pada hari janji|Tidak ada (pasien membuat janji baru)|

### 3.5 Siklus Status Antrian

|Status|Arti|Transisi yang diizinkan|
|---|---|---|
|Belum check-in|Janji sudah ada, pasien belum datang; hanya **nomor estimasi** yang tampil|Menunggu (saat check-in), Tidak hadir|
|Menunggu|Sudah check-in, **nomor final** terbit, masuk urutan panggilan|Diperiksa, Tidak hadir|
|Diperiksa|Sedang dilayani|Selesai|
|Selesai|Kunjungan tuntas di layar antrian|Tidak ada|
|Tidak hadir|Tidak check-in sampai jam tutup|Tidak ada|

Catatan v0.3:
- **Nomor estimasi** terbit saat janji dibuat (informatif, berbasis rata-rata durasi layanan). **Nomor final** hanya terbit saat check-in dan itulah yang dipakai memanggil pasien.
- Koreksi status oleh admin (mis. `Diperiksa` kembali ke `Menunggu`) hanya boleh dengan alasan wajib dan tercatat di audit log.
- Semua transisi divalidasi di sisi server; transisi ilegal ditolak tanpa mengubah data.

## 4. Requirements

### 4.1 Functional Requirements

Legenda prioritas (lapisan pemangkasan, bukan urutan pengerjaan):

|Label|Arti|
|---|---|
|P0|Wajib, bahan uji utama|
|P1|Wajib, dibangun lebih dahulu karena menjadi fondasi|
|P2|Dipotong lebih dulu bila waktu mepet|
|Pelengkap|Di luar lima fitur wajib|

Lima fitur wajib mengikuti Final Ide: FB-1 sampai FB-5. Riwayat pasien (FR-11) dihitung sebagai bagian dari FB-3 dan FB-4, bukan fitur kelima baru **(ASUMSI)**.

|ID|Requirement|Description|Priority|Linked User Story|
|---|---|---|---|---|
|FR-01|Profil kesehatan pasien (FB-1)|Kondisi terpantau, alergi, dan daftar obat; dapat diisi, dilihat, diubah, dihapus dengan konfirmasi; hanya pemilik yang boleh membuka|P1|US-02, US-13|
|FR-02|Jadwal berobat rutin berulang + pengingat (FB-2)|Aturan kontrol dicatat admin sesuai anjuran dokter; jadwal otomatis per interval 7/14/30 hari dengan **anchor tanggal asli** (tanggal 31 tetap 31, hanya di-clamp saat bulan lebih pendek); penandaan terlewat beserta **jadwal pengganti**; pengingat tiga hari sebelum jatuh tempo; tidak ada pengingat ganda; tampilan **agenda (default) + toggle bulan**|P1|US-03, US-04, US-09|
|FR-03|Pilih spesialis + janji dengan pencegahan bentrok (FB-3)|Daftar spesialis dan slot kosong; satu slot hanya boleh punya satu janji aktif, dijamin di level data|P0|US-05, US-06|
|FR-04|Antrian kunjungan dengan transisi status (FB-4)|Janji menerbitkan **nomor estimasi** (informatif); check-in menerbitkan **nomor antrian final** yang unik per hari; status diubah **hanya oleh admin**: belum check-in, menunggu, diperiksa, selesai, tidak hadir; transisi ilegal ditolak; koreksi status wajib beralasan dan tercatat; selesai memicu jadwal kontrol berikutnya|P0|US-07, US-08|
|FR-05|Catatan kebiasaan harian + ringkasan kepatuhan (FB-5)|Catatan hidrasi, jam tidur, aktivitas per hari; ringkasan kepatuhan dengan ambang batas eksplisit dan runtutan hari|P2|US-10, US-11|
|FR-06|Panel konten statis terverifikasi (FB-6)|Konten statis bersumber Kemenkes atau WHO, tampil hanya bila kondisi terkait tercatat di profil, setiap materi mencantumkan URL dan tanggal pengambilan|Pelengkap|US-12|
|FR-07|Autentikasi, sesi, dan otorisasi dua role|Login pasien dan admin; akun admin di-seed per individu; tamu ditolak di semua halaman inti; pasien hanya membaca data sendiri; admin hanya mengakses fungsi dan data yang menjadi wewenangnya|P0|US-01, US-13, US-14, US-21, US-22|
|FR-08|Pengelolaan slot, janji, dan usulan perubahan oleh admin|Admin mengelola dokter dan slot, mengusulkan perubahan slot dengan alasan wajib, atau membatalkan janji dengan alasan wajib; janji lama tetap aktif selama usulan menunggu jawaban|P0|US-15, US-16, US-17|
|FR-09|Notifikasi dalam aplikasi dan tanggapan pasien|Pasien menerima pemberitahuan perubahan atau pembatalan, melihat alasan, slot lama, dan slot baru, lalu dapat menyetujui, menolak, atau memilih slot lain|P0|US-18|
|FR-10|Audit log tindakan admin|Setiap perubahan oleh admin dicatat: pelaku, waktu, aksi, objek, nilai sebelum dan sesudah, alasan; log tidak dapat diubah atau dihapus dari aplikasi; pasien melihat riwayat perubahan janjinya sendiri|P0|US-19, US-20|
|FR-11|Riwayat janji dan kunjungan pasien **(digabung ke FR-13 sejak v0.3)**|Dilebur ke FR-13 agar pasien melihat satu timeline, bukan dua daftar terpisah|P1|US-23|
|FR-12|Catatan resep dan kepatuhan minum obat|Admin mencatat obat dari resep dokter (nama, dosis, aturan pakai, periode, sumber pencatatan); pasien hanya membaca dan menandai sudah/belum minum per hari; **tidak ada rekomendasi obat otomatis**; daftar obat menampilkan label "catatan resep, bukan saran medis" dan rujukan Fornas|P1|US-24, US-25|
|FR-13|Timeline kunjungan pasien|Satu tampilan kronologis berisi janji, check-in, kunjungan, catatan obat, dan jadwal kontrol berikutnya; urut terbaru; hanya milik pasien yang masuk|P1|US-26|
|FR-14|Log aktivitas akun|Pasien melihat jejak aksinya sendiri (masuk, buat/ubah janji, check-in, menandai obat); append-only; tidak dapat diubah dari antarmuka|P2|US-27|

### 4.2 Non-Functional Requirements

- **Performance:** endpoint janji dan antrian menahan 50 sampai 100 permintaan bersamaan dengan p95 di bawah 2 detik. Angka ini sementara dan dikonfirmasi saat keputusan stack; yang diuji adalah beban ringan, bukan tuning infrastruktur.
- **Security:** pemeriksaan sesi dan peran pada setiap endpoint inti; ID di URL tidak boleh mengarah ke data pasien lain; halaman dan endpoint admin menolak pasien; kata sandi disimpan dengan hash; tidak ada kredensial yang ditanam di kode; query memakai parameter, bukan rangkaian string.
- **Privacy:** data kesehatan bersifat sensitif. Seluruh data demo dan uji bersifat **fiktif**, tidak memakai identitas nyata (termasuk NIK). Admin hanya melihat data minimal (lihat bagian 4.4).
- **Accountability:** setiap tindakan admin yang mengubah data tercatat di audit log (FR-10). Akun admin bersifat individual, bukan akun bersama.
- **Scalability:** skala demo - 5 sampai 10 akun pasien dan 1 sampai 2 akun admin, cukup untuk skenario presentasi dan uji beban ringan.
- **Availability and Reliability:** tidak ada SLA komersial; aplikasi harus hidup selama periode penilaian, dan pembuatan janji tetap benar saat permintaan datang serentak (tepat satu berhasil), termasuk saat admin dan pasien mengubah slot yang sama.
- **Usability (pengguna akhir):** alur inti pasien maksimal lima layar per tujuan; satu aksi utama per layar; bahasa sederhana tanpa istilah teknis; status kosong selalu memberi langkah berikutnya; target sentuh minimal sekitar 44 px; kontras memadai; posisi antrian dan status janji selalu terlihat jelas. Target terukur ada di bagian 2.3.
- **Compatibility:** Chrome, Edge, dan Firefox versi terkini di desktop dan ponsel; tata letak responsif sampai lebar 360 px.
- **Localization:** seluruh label antarmuka berbahasa Indonesia; satu bahasa saja, tanpa pengalih bahasa.
- **Timezone:** seluruh perhitungan tanggal memakai **WIB (Asia/Jakarta, UTC+7)**. Satu "hari" untuk nomor antrian, pengingat tiga hari, dan catatan harian dimulai pukul 00:00 WIB dan berakhir saat admin menutup hari. Aturan ini diuji dengan kasus di sekitar tengah malam.
- **Session and access:** sesi berakhir setelah periode tidak aktif yang ditetapkan; login dibatasi percobaan gagal berulang; kata sandi minimal 8 karakter; tidak ada sesi yang bertahan setelah logout di perangkat bersama.
- **Accessibility (terukur):** kontras teks minimal 4.5:1 (WCAG AA), target sentuh minimal 44x44 px, ukuran teks dasar minimal 16 px, seluruh alur inti dapat diselesaikan dengan keyboard dan tanpa mengandalkan warna saja.

### 4.3 Acceptance Criteria

**FR-01 Profil kesehatan**

- Given pasien sudah masuk, when ia menyimpan kondisi, alergi, dan obat, then data tersimpan dan tampil kembali persis seperti yang diisi.
- Given pasien A sudah masuk, when ia membuka URL profil pasien B, then sistem menolak dan tidak menampilkan satu baris data pun milik B.
- Given pengguna belum masuk, when ia membuka halaman profil, then ia diarahkan ke halaman masuk.
- Given pasien menghapus profil, when konfirmasi diterima, then data terhapus dan fitur lain menampilkan ajakan melengkapi profil, bukan galat.

**FR-02 Jadwal berulang dan pengingat**

- Given admin mencatat aturan kontrol setiap 30 hari mulai 31 Januari untuk seorang pasien, when jadwal dibuat, then tanggal berikutnya 28 atau 29 Februari sesuai tahun kabisat.
- Given interval 7, 14, atau 30 hari, when jadwal dibangkitkan, then setiap tanggal jatuh tempo benar dan tidak ada duplikat.
- Given jadwal hari ini sudah lewat jam yang ditetapkan, when sistem memeriksa, then jadwal ditandai terlewat dan tidak memicu pengingat baru.
- Given pembuat pengingat dipanggil dua kali untuk jadwal yang sama, when keduanya selesai, then hanya ada satu pengingat tersimpan.
- Given pasien punya jadwal tiga hari lagi, when ia membuka aplikasi, then pengingat tampil satu kali untuk jadwal itu.
- Given pasien membuka aplikasi dengan akun pasien, when ia mencoba mencatat aturan kontrol, then aksi itu tidak tersedia (hanya admin).

**FR-03 Janji dan pencegahan bentrok**

- Given satu slot kosong, when pasien menyimpan janji, then janji tersimpan dan slot tidak lagi tampil sebagai kosong.
- Given dua pasien menyimpan janji pada slot yang sama hampir bersamaan, when kedua permintaan selesai, then tepat satu berhasil dan yang lain menerima pesan jelas bahwa slot sudah diambil.
- Given pasien mengubah ID janji di URL menjadi milik pasien lain, when halaman dibuka, then sistem menolak.
- Given tidak ada slot tersedia, when pasien membuka halaman janji, then muncul pesan jelas dan tawaran memilih waktu lain.

**FR-04 Antrian dan status**

- Given janji aktif milik pasien, when pasien check-in, then nomor antrian unik terbit dan tercatat pada hari itu.
- Given pasien sudah check-in, when ia check-in lagi, then check-in kedua ditolak dan nomor antrian tetap satu.
- Given status menunggu, when admin mengubah ke diperiksa lalu selesai, then kedua transisi diterima.
- Given status menunggu, when admin mencoba langsung ke selesai, then transisi ditolak dan status tidak berubah.
- Given pasien masuk, when ia mencoba mengubah status antrian lewat antarmuka atau API, then permintaan ditolak.
- Given status sudah diperiksa atau selesai, when admin mencoba mengembalikannya ke status sebelumnya tanpa alasan, then ditolak; dengan alasan, koreksi diterima dan tercatat di audit log.
- Given status sudah selesai dan aturan kontrol berulang aktif, when proses penutupan berjalan, then jadwal kontrol berikutnya terbentuk otomatis.
- Given pasien membuat janji, when halaman konfirmasi tampil, then nomor estimasi dan perkiraan jam tampil dengan label "perkiraan".
- Given pasien check-in, when nomor final terbit, then nomor final berbeda dari nomor estimasi dan hanya nomor final yang dipakai memanggil pasien.
- Given pasien tidak check-in sampai jam tutup klinik, when admin menutup hari, then status antrian menjadi tidak hadir dan tercatat di audit log.
- Given pasien sudah berstatus tidak hadir, when ia mencoba check-in pada hari yang sama, then permintaan ditolak dengan pesan yang jelas.

**FR-05 Catatan kebiasaan dan ringkasan**

- Given ambang hidrasi, tidur, dan aktivitas sudah ditetapkan, when nilai di bawah, tepat pada, dan di atas ambang dicatat, then penilaiannya benar untuk ketiga kasus.
- Given jam tidur diisi 0, 24, atau bukan angka, when disimpan, then input ditolak dengan pesan yang dapat dimengerti.
- Given catatan tanggal 1, 2, dan 4 (tanggal 3 bolong), when runtutan hari dihitung, then hasilnya benar dan tidak menimbulkan galat.
- Given pasien menambah satu catatan, when penyimpanan selesai, then ringkasan kepatuhan langsung menampilkan angka terbaru tanpa memuat ulang manual.

**FR-06 Panel konten statis**

- Given profil pasien mencatat hipertensi, when ia membuka panel konten, then materi hipertensi tampil.
- Given profil tidak mencatat kondisi terkait, when panel dibuka, then materi itu tidak tampil.
- Given setiap materi, when ditinjau, then ada URL sumber Kemenkes atau WHO dan tanggal pengambilan yang tercatat.

**FR-07 Autentikasi dan otorisasi dua role**

- Given tamu membuka halaman inti mana pun, when permintaan diproses, then permintaan ditolak dan diarahkan ke halaman masuk.
- Given pasien masuk, when ia meminta data pasien lain lewat API, then respons menolak (bukan mengembalikan data).
- Given pasien masuk, when ia membuka halaman atau endpoint admin, then akses ditolak.
- Given admin masuk, when ia membuka catatan kebiasaan atau ringkasan kepatuhan pasien, then akses ditolak.
- Given akun admin, when daftar akun ditinjau, then setiap admin memiliki akun individual (tidak ada akun bersama).
- Given kode sumber ditinjau, when dicari kredensial dan query tak berparameter, then tidak ditemukan.

**FR-08 Pengelolaan oleh admin dan usulan perubahan**

- Given janji aktif, when admin mengusulkan slot baru beserta alasan, then status menjadi perubahan diusulkan, janji lama tetap aktif, dan slot usulan terkunci sementara.
- Given admin mengusulkan perubahan tanpa alasan, when disimpan, then ditolak dengan pesan yang jelas.
- Given usulan menunggu jawaban, when pasien menyetujui, then janji berpindah ke slot baru, slot lama dilepas, dan tetap hanya ada satu janji aktif.
- Given usulan menunggu jawaban, when pasien menolak, then janji lama tetap aktif dan slot usulan dilepas.
- Given usulan menunggu jawaban, when pasien memilih slot lain yang masih kosong, then janji pindah ke slot itu dengan aturan satu slot satu janji tetap berlaku.
- Given usulan menunggu jawaban dan pasien belum menjawab hingga batas waktu **(ASUMSI: 24 jam sebelum jadwal janji lama)**, when batas tercapai, then janji lama tetap aktif, slot usulan dilepas, dan admin diberi tahu.
- Given janji aktif, when admin membatalkan dengan alasan, then status menjadi dibatalkan dan pasien diberi pemberitahuan beserta opsi menjadwalkan ulang.
- Given admin dan pasien mengubah slot yang sama hampir bersamaan, when kedua permintaan selesai, then hasil tetap konsisten (tepat satu janji aktif pada slot itu) dan tidak ada data setengah tersimpan.

**FR-09 Notifikasi dan tanggapan pasien**

- Given admin mengusulkan atau membatalkan janji, when pasien membuka aplikasi, then pemberitahuan tampil satu kali dengan alasan, slot lama, dan slot baru.
- Given pemberitahuan usulan perubahan, when pasien melihatnya, then tombol setuju, tolak, dan pilih slot lain tersedia dan dapat dicapai dalam maksimal 3 ketukan.
- Given pasien sudah menjawab usulan, when ia membuka pemberitahuan yang sama, then jawabannya terlihat dan tidak dapat dijawab dua kali.

**FR-10 Audit log**

- Given admin melakukan perubahan janji, status antrian, slot, atau aturan kontrol, when tindakan berhasil, then tepat satu catatan audit terbentuk berisi pelaku, waktu, aksi, objek, nilai sebelum dan sesudah, serta alasan (bila wajib).
- Given tindakan admin ditolak sistem, when diproses, then tidak ada perubahan data (catatan percobaan ditolak boleh dicatat).
- Given aplikasi berjalan, when diperiksa, then tidak ada antarmuka maupun endpoint untuk mengubah atau menghapus catatan audit.
- Given pasien membuka riwayat perubahan janjinya, when ditampilkan, then hanya perubahan pada janji miliknya yang terlihat.

**FR-11 Riwayat pasien (ASUMSI)**

- Given pasien punya janji dan kunjungan yang sudah lewat, when ia membuka riwayat, then daftar tampil urut terbaru dan hanya milik pasien itu.
- Given pasien belum punya riwayat, when halaman dibuka, then muncul pesan ramah dan ajakan membuat janji, bukan galat.

**FR-12 Catatan resep dan kepatuhan minum obat**

- Given admin mencatat resep untuk seorang pasien, when disimpan, then pasien melihat nama obat, dosis, aturan pakai, periode, dan nama pencatat - tanpa tombol untuk menambah obat sendiri.
- Given pasien membuka daftar obat, when ditinjau, then setiap obat menampilkan label "catatan resep, bukan saran medis" beserta rujukan Fornas.
- Given pasien menandai obat yang sama diminum dua kali pada tanggal yang sama, when disimpan, then hanya ada satu catatan untuk tanggal itu.
- Given pasien melihat obat pada hari pertama, when ia menandai "belum minum" lalu "sudah minum", then status terakhir yang tersimpan adalah yang terbaru dan ringkasan kepatuhan ikut berubah.
- Given pasien belum punya resep aktif, when halaman obat dibuka, then muncul pesan ramah dan penjelasan bahwa obat dicatat oleh klinik, bukan galat.
- Given kode dan antarmuka ditinjau, when dicari fungsi yang memetakan kondisi ke obat, then tidak ditemukan (aplikasi tidak boleh menyarankan obat).
- Given pasien mencoba menambah atau mengubah obat lewat API, when permintaan diproses, then ditolak.

**FR-13 Timeline kunjungan**

- Given pasien punya janji, kunjungan, dan catatan obat, when timeline dibuka, then ketiganya tampil dalam satu urutan kronologis terbaru beserta tautan ke detail.
- Given pasien A membuka timeline, when sistem memuat data, then tidak ada satu baris pun milik pasien B.
- Given pasien belum punya aktivitas apa pun, when timeline dibuka, then muncul pesan kosong yang mengarahkan ke pembuatan janji pertama.
- Given satu kunjungan selesai, when timeline dimuat ulang, then jadwal kontrol berikutnya muncul sebagai entri berikutnya.

**FR-14 Log aktivitas akun**

- Given pasien membuat janji, when tindakan berhasil, then satu entri log terbentuk berisi waktu, jenis aksi, dan objek.
- Given pasien membuka log, when ditampilkan, then hanya entri miliknya yang terlihat dan tidak ada tombol ubah atau hapus.
- Given permintaan mengubah atau menghapus entri log dikirim ke API, when diproses, then ditolak.

### 4.4 Batas Data dan Wewenang Admin

|Data|Admin dapat melihat|Admin dapat mengubah|
|---|---|---|
|Nama pasien, dokter, slot, status janji, nomor antrian|Ya|Ya (sesuai fungsinya, dengan audit log)|
|Aturan kontrol berulang|Ya|Ya (mencatat anjuran dokter)|
|Profil kesehatan (kondisi, alergi, obat)|Ringkasan alergi hanya saat check-in, setiap pembukaan tercatat **(ASUMSI)**|Tidak|
|Catatan kebiasaan dan ringkasan kepatuhan|Tidak|Tidak|
|Audit log|Dapat melihat, tidak dapat mengubah|Tidak|

Prinsip: aplikasi tidak menetapkan keputusan medis. Admin hanya mencatat anjuran tenaga kesehatan dan mengelola jadwal serta antrian.

## 5. Design and User Experience

- **Wireframes and Mockups:** wireframe teks ada di repo ini, folder `design/` (`01-peta-alur.md` sampai `04-state-dan-copy.md`); belum ada gambar visual. **To-do:** buat wireframe visual alur pasien dan alur admin sebelum **24 Oktober 2026**.
- **Layar yang wajib ada:** daftar pemberitahuan pasien, layar tanggapan usulan perubahan (setuju, tolak, pilih slot lain), **timeline kunjungan (FR-13)**, **halaman obat + kepatuhan minum (FR-12)**, **log aktivitas akun (FR-14)**, halaman admin (daftar janji hari ini, antrian, pengelolaan slot, usulan perubahan, pencatatan resep), dan halaman audit log (hanya baca).
- **Jadwal kontrol (v0.3):** tampilan **agenda** sebagai default (satu baris per tanggal: tanggal, status, aksi), dengan **toggle "Bulan"** untuk melihat sebaran satu bulan. Kalender penuh 7 kolom ditolak pada layar 360 px karena target sentuh turun di bawah 44 px.
- **Halaman obat (v0.3):** satu kartu per obat berisi nama, dosis, aturan pakai, periode, nama pencatat, label "catatan resep, bukan saran medis", tautan Fornas, dan kontrol "sudah/belum minum" hari ini. Tanpa tombol tambah obat.
- **Nomor antrian (v0.3):** nomor estimasi tampil dengan label "perkiraan"; setelah check-in, tampilan berganti ke nomor final dan urutan panggilan.
- **Prototype:** belum ada. Prototipe tingkat klik untuk alur pasien dan alur usulan perubahan cukup sebagai bahan uji kegunaan.
- **User Flow Diagram:** alur inti 10 langkah di bagian 3.3 (UC-1), siklus status janji di bagian 3.4, peta layar di `design/01-peta-alur.md` (perlu diperbarui untuk dua role).
- **Design Notes (pengguna akhir, persona usia 40-65):**
    - Alur inti pasien maksimal lima layar per tujuan, satu aksi utama per layar.
    - Bahasa sederhana dan label Indonesia; hindari singkatan medis tanpa penjelasan.
    - Tombol dan area sentuh besar, kontras tinggi, teks tidak terlalu kecil di layar 360 px.
    - Posisi antrian (nomor, status, perkiraan giliran) selalu terlihat di halaman utama pada hari kunjungan.
    - Pemberitahuan perubahan janji memuat alasan dengan bahasa manusiawi, membandingkan jadwal lama dan baru, dan menyediakan tiga pilihan jelas.
    - Status kosong selalu memberi aksi berikutnya (mis. "lengkapi profil"), bukan galat.
    - Peringatan jelas bahwa aplikasi bukan pengganti keputusan tenaga kesehatan.
- **Uji kegunaan:** dijalankan bersamaan dengan UAT, dengan pencatatan waktu tugas, jumlah kesalahan, dan kuesioner SUS (target di bagian 2.3).

## 6. Technical Considerations

- **Architecture Overview:** belum diputuskan; bergantung pada keputusan tech stack (batas **23 Oktober 2026**). Yang mengikat tanpa peduli stack: satu bahasa untuk frontend dan backend, satu database ber-transaksi, kontrol akses per role di sisi server, dan runner test tersedia sejak hari pertama.
- **Dependencies:** framework web, pustaka hash kata sandi, pustaka migrasi database, runner test, database terkelola, platform hosting yang mendukung backend, dan alat load test (k6 atau autocannon). Tidak ada API pihak ketiga.
- **Data Requirements:** entitas pasien, admin, dokter (data), slot dokter, janji, **usulan perubahan janji, notifikasi, log audit, aturan kontrol**, tiket antrian, jadwal kontrol, catatan kebiasaan harian, materi konten statis, pengingat, **resep, obat, catatan minum obat, log aktivitas**, dan **nomor estimasi (turunan, bukan tabel baru)**. Aturan data yang mengikat:
    - satu slot hanya boleh punya satu janji aktif, dijaga dengan indeks unik parsial atau transaksi di level database, termasuk slot yang dikunci oleh usulan;
    - nomor antrian unik per hari;
    - akun admin dibuat lewat seed, bukan registrasi;
    - log audit hanya dapat ditambah (append-only) dan tidak memiliki operasi ubah atau hapus dari aplikasi;
    - dokter hanya berupa data tanpa kredensial.
    - **kunci slot sementara pada usulan perubahan punya batas waktu (TTL)** yang lebih pendek dari batas jawab pasien; bila TTL habis, slot dilepas dan usulan batal dengan pemberitahuan;
    - **satu catatan minum obat per pasien, per obat, per tanggal** (indeks unik gabungan), sehingga penandaan berulang tidak menggandakan data;
    - seluruh tanggal disimpan dengan zona waktu eksplisit (WIB) dan diuji pada batas tengah malam;
    - log aktivitas bersifat append-only, sama seperti audit log;
    - tidak ada tabel maupun kolom yang memetakan kondisi ke obat (larangan rekomendasi obat ditegakkan di level data dan kode).
- **Integration Points:** tidak ada integrasi eksternal. Sandbox SATUSEHAT Kemenkes tidak dipakai pada rilis ini (lihat Non-Goals); struktur data pasien, janji, dan kunjungan dirancang agar mudah dipetakan kelak **(ASUMSI)**. Modul antrian berdiri sendiri, terpisah dari draf klinik lama **(ASUMSI, menunggu jawaban pembimbing)**.
- **Technical Risks:** keputusan stack dan hosting yang tertunda; database sementara di platform gratis yang kehilangan data saat restart; uji serentak yang sulit dibuat bila keunikan hanya dijaga di kode aplikasi; kompleksitas kunci slot sementara pada alur usulan perubahan.

## 7. Release Plan

### 7.1 Milestones

Jadwal disusun ulang dari 22 Oktober 2026 dan menggantikan jadwal versi 0.1 (kick-off 21 Oktober dinyatakan terlewat tanpa keputusan fondasi).

|Milestone|Description|Owner|Target Date|
|---|---|---|---|
|Keputusan fondasi|Tech stack, platform hosting dengan backend dan database, pembagian area pasien dan area admin, penetapan siapa mencatat resep dan aturan kontrol|Semua, dipimpin Vigo|**24 Okt 2026 (terlambat 1 hari dari rencana 23 Okt)**|
|Design Complete|Wireframe visual dua role, alur usulan perubahan, skema data lintas fitur, **kerangka layar obat/timeline/log aktivitas**|Dita + Arya|25 Okt 2026|
|Development Complete P0|FR-07 (auth dua role) + FB-1 + FB-3 + FR-08 + FR-09 + FR-10 + FB-4 berjalan; uji rebutan slot, uji ID URL, dan uji akses lintas peran lulus|Arya, Gilang, Dita|**30 Okt 2026 (digeser dari 29 Okt)**|
|Development Complete|FB-2 selesai; **FR-12 obat + FR-13 timeline** selesai; FB-5 versi ringkas (hidrasi + tidur + obat) atau dipotong; FR-14 dan FB-6 dipotong lebih dulu|Vigo, Ibnu, Dita|31 Okt 2026|
|QA and UAT|System test 10 langkah, UAT dengan penguji luar tim (peran pasien dan admin), uji kegunaan SUS, skrip load dan p95, deploy percobaan|Gilang + Ibnu|31 Okt 2026|
|Launch|Hosting final hidup, bukti uji lengkap, materi presentasi siap (termasuk slide "Pengembangan Lanjutan: SATUSEHAT + Fornas")|Semua|2 Nov 2026|

Pembagian area pasien dan admin untuk tiap anggota perlu ditetapkan pada milestone pertama **(ASUMSI: kelompok memutuskan)**.

### 7.2 Gerbang Pemangkasan

Penambahan role admin memperbesar beban P0. Pemangkasan dilakukan berurutan bila gerbang **30 Oktober 2026** gagal:

1. FB-6 (panel konten statis) dan FR-14 (log aktivitas akun) dihentikan lebih dulu - keduanya tidak dipakai pada skenario 10 langkah.
2. FB-5 (catatan kebiasaan) diringkas menjadi hidrasi + tidur + kepatuhan obat; bila masih kurang, FB-5 dipotong.
3. Bila FB-5 dipotong, cerita presentasi ditulis ulang agar tetap utuh dengan fokus pada alur janji, antrian, perubahan janji oleh admin, dan kepatuhan obat.
4. FB-6 yang dipotong tetap masuk materi presentasi sebagai slide "Pengembangan Lanjutan" berisi Fornas dan peta ke FHIR/SATUSEHAT.

FR-07, FR-08, FR-09, dan FR-10 tidak boleh dipotong karena menjawab masukan dosen. **FR-12 dan FR-13 juga tidak boleh dipotong** sejak v0.3 karena menjadi tulang cerita "satu pintu perjalanan pasien".

### 7.3 Rollout Strategy

Satu lingkungan saja (bukan bertahap), tanpa feature flag. Rilis dilakukan dengan menandai versi di Git lalu deploy ulang; rollback = deploy ulang versi sebelumnya. Deploy percobaan wajib 31 Oktober 2026, bukan pada hari tenggat, supaya kegagalan hosting tidak memakan waktu presentasi. Migrasi database bersifat menambah (additive) selama periode ini; tidak ada migrasi yang menghapus kolom setelah data uji masuk.

### 7.4 Launch Checklist

- [ ] Hosting hidup dan tautan bisa dibuka dari perangkat lain
- [ ] Database produksi terisi data demo fiktif dan akun admin hasil seed
- [ ] Skenario 10 langkah lulus di lingkungan hosting, bukan hanya lokal
- [ ] Uji akses lintas peran (pasien ke admin, admin ke catatan kebiasaan) lulus
- [ ] Audit log terbukti mencatat setiap perubahan oleh admin
- [ ] UAT dijalankan minimal satu penguji di luar tim dan ditandatangani; hasil SUS tercatat
- [ ] Bukti uji tersimpan di `docs/01-laporan-unit`, `02-integration`, `03-system-uat`, dan `04-bukti-security`
- [ ] Setiap materi konten statis punya URL sumber dan tanggal pengambilan (bila FB-6 dibangun)
- [ ] Laporan pengujian dan materi presentasi final siap
- [ ] Tidak ada kredensial di dalam kode; konfigurasi lewat variabel lingkungan

## 8. Risks, Assumptions, and Dependencies

### 8.1 Risks

|Risk|Likelihood|Impact|Mitigation|
|---|---|---|---|
|Tech stack dan hosting belum diputuskan|High|High|Ditutup paling lambat 23 Oktober 2026; bila buntu, pilih stack paling sederhana yang dikuasai mayoritas dan hosting yang mendukung backend|
|Belum ada kode sama sekali menjelang jendela P0|High|High|Skeleton hidup di hosting pada 24 Oktober 2026|
|Beban kerja bertambah akibat role admin, alur usulan, notifikasi, dan audit log|High|High|Gerbang pemangkasan **30 Oktober** (bagian 7.2); audit log dibuat sederhana (satu tabel, tanpa antarmuka pencarian); notifikasi hanya di dalam aplikasi|
|**Nilai inti tidak sejalan dengan masalah: notifikasi hanya in-app, sedangkan masalahnya pasien lupa**|High|High|Diakui di bagian 1.4; mitigasi murah (penanda belum dibaca, blok "sejak terakhir masuk", pembatalan paksa) menunggu keputusan tim; klaim produk tidak boleh melebihi yang bisa dibuktikan|
|**Bukti masalah masih sebatas pengamatan kelompok**|High|Medium|Wawancara/observasi 1-2 orang sebelum 28 Oktober; bila gagal, klaim 1.3 diperlunak dan dicatat sebagai asumsi|
|Privasi data kesehatan|Medium|High|Hanya data demo fiktif; admin melihat data minimal; kata sandi di-hash; uji akses lintas peran|
|Kasus uji security dan reliability sulit dirancang|Medium|High|Tabel harapan ditulis lebih dulu di `plan/03`; kode dibaca ulang untuk memenuhinya|
|Data hilang karena database sementara di platform gratis|Medium|High|Pakai database terkelola; larang SQLite berkas untuk data yang dinilai|
|Hosting gagal pada hari H|Medium|High|Deploy percobaan 31 Oktober, rollback ke versi sebelumnya|
|Fungsi melebar (ide baru masuk, termasuk integrasi SATUSEHAT)|Medium|High|Ide baru ke backlog; Penjaga Ruang Lingkup menolak pekerjaan aktif|
|Fitur P2 dipotong terlalu dini sehingga cerita personal hilang|Medium|Medium|Pemangkasan hanya setelah gerbang **30 Oktober**; cerita presentasi ditulis ulang bila terjadi|
|Peninjau tenaga kesehatan untuk konten statis tidak tersedia|High|Medium|FB-6 dipotong atau dibatasi pada materi yang bersumber resmi dan diberi label "bukan saran medis"; tidak ditayangkan tanpa tinjauan|
|Penguji UAT di luar tim tidak tersedia|Medium|Medium|Diajak sejak 27 Oktober, bukan sehari sebelum; butuh penguji untuk peran pasien dan admin|
|Anggota kehilangan waktu karena pekan sibuk|Medium|Medium|Pembuka Hambatan memindahkan kartu; tidak ada kartu menunggu lebih dari sehari|
|**Cakupan v0.3 (obat + timeline + log) menambah beban di rencana yang sudah tanpa kelonggaran**|High|High|Gerbang 30 Okt; FB-6 dan FR-14 dipotong lebih dulu; FB-5 diringkas|
|**Fitur obat disalahartikan sebagai rekomendasi medis**|Medium|High|Obat hanya dicatat dari resep; label "bukan saran medis" di setiap kartu; tidak ada pemetaan kondisi ke obat di kode maupun data; Fornas dipakai sebagai rujukan nama obat|
|Kunci slot sementara pada usulan perubahan menumpuk dan memboroskan kapasitas|Medium|Medium|TTL kunci lebih pendek dari batas jawab; slot dilepas otomatis; admin melihat daftar kunci yang akan habis|
|Salah tafsir terhadap SATUSEHAT (dianggap sumber rekomendasi obat)|Medium|Medium|Dijelaskan di Non-Goals dan slide "Pengembangan Lanjutan"; sumber obat dinyatakan tegas sebagai Fornas|

### 8.2 Assumptions

- Tim berlima dan tenggat hosting 2 November 2026 tidak berubah.
- Stack yang dipilih bisa dijalankan dan dihosting gratis atau sangat murah, dan hosting mendukung backend serta database.
- Hanya dua role yang memiliki login: pasien dan admin. Dokter adalah data. **(Keputusan kelompok, perlu dikonfirmasi pembimbing.)**
- Admin mencatat aturan kontrol berulang atas nama klinik sesuai anjuran dokter; admin tidak menetapkan keputusan medis. **(ASUMSI)**
- Lima fitur wajib adalah FB-1 sampai FB-5 sesuai Final Ide; riwayat adalah bagian dari FB-3 dan FB-4. **(ASUMSI)**
- Admin hanya melihat ringkasan alergi saat check-in dan tidak melihat catatan kebiasaan. **(ASUMSI)**
- Batas waktu jawaban pasien atas usulan perubahan adalah 24 jam sebelum jadwal janji lama; bila lewat, janji lama tetap aktif. **(ASUMSI)**
- Akun admin cukup dibuat lewat seed; tidak perlu registrasi mandiri.
- Pemberitahuan cukup tampil di dalam aplikasi, tanpa push, email, atau WhatsApp.
- Sandbox SATUSEHAT tidak dipakai pada rilis ini.
- Angka ambang batas kebiasaan memakai rujukan resmi dan ditetapkan paling lambat 28 Oktober 2026.
- Konten statis ditinjau tenaga kesehatan sebelum tayang, atau FB-6 dipotong.
- Penguji UAT dari luar tim bersedia mengikuti skrip dan mengisi kuesioner SUS.

### 8.3 Dependencies

- Jawaban pembimbing soal modul antrian (gabung draf klinik lama atau produk terpisah) dan soal kecukupan dua role serta mekanisme usulan perubahan dan audit log.
- Sumber resmi Kemenkes atau WHO untuk panel konten (bila FB-6 dibangun).
- Database dan hosting yang tersedia pada hari pertama pengembangan.
- Ketersediaan penguji luar tim pada 30-31 Oktober 2026.
- Konfirmasi pembagian tugas pada milestone keputusan fondasi.

## 9. Open Questions

|#|Question|Owner|Status|Resolution|
|---|---|---|---|---|
|1|Tech stack apa yang dipakai?|Vigo (memimpin)|**Terlambat**|Batas waktu 23 Okt sudah lewat; wajib ditutup 24 Okt sebelum pekerjaan lain bisa jalan|
|2|Modul antrian digabung draf klinik lama atau produk terpisah?|Gilang + Arya|**Terlambat**|Batas 23 Okt lewat; usulan tetap: terpisah, jangan menunggu pembimbing|
|3|Data apa saja yang boleh dilihat admin? (Menggantikan pertanyaan lama soal dokter dan tanggungan)|Tim|Open|Usulan di bagian 4.4; menunggu konfirmasi pembimbing|
|4|Angka ambang kebiasaan: hidrasi, rentang tidur, aktivitas|Dita + Ibnu|Open|Batas waktu: 28 Oktober 2026|
|5|Portal sumber konten statis (Kemenkes/WHO mana)|Dita|Open|Batas waktu: pekan pertama; hanya bila FB-6 dibangun|
|6|Pengingat dan pemberitahuan hanya di aplikasi atau perlu email/WhatsApp?|Tim|Open|Usulan: di aplikasi saja|
|7|Kedalaman autentikasi: perlu reset password?|Tim|Open|Usulan: tidak perlu|
|8|Apakah FB-5 dan FR-14 dipotong bila gerbang 30 Oktober gagal?|Penjaga Ruang Lingkup|Open|Kriteria sudah ditetapkan di `docs/to-do/to-do.md`|
|9|Platform hosting: GitHub Pages (statis, tanpa server) atau PaaS ber-server + database?|Vigo|**Terlambat**|GitHub Pages tidak bisa menjalankan backend, autentikasi, atau database; wajib diputuskan 24 Okt|
|10|Siapa yang menetapkan interval kontrol berulang?|Tim|Open|Usulan: admin mencatat anjuran dokter|
|11|Berapa batas waktu jawaban pasien atas usulan perubahan dan apa akibatnya jika terlewat?|Tim|Open|Usulan: 24 jam sebelum jadwal lama; janji lama tetap aktif **dan admin boleh membatalkan paksa dengan alasan wajib**|
|12|Apakah SATUSEHAT sandbox perlu disentuh?|Tim + pembimbing|**Ditutup (v0.3)**|Tidak. Platform pertukaran data, bukan sumber rekomendasi obat; butuh faskes terdaftar. Masuk slide pengembangan lanjutan|
|13|Apakah riwayat dihitung bagian dari FB-3/FB-4 atau fitur tersendiri?|Tim|**Ditutup (v0.3)**|Menjadi FR-13 (timeline kunjungan), P1, tidak boleh dipotong|
|14|Sumber data obat diambil dari mana?|Tim|**Ditutup (v0.3)**|Formularium Nasional (e-fornas.kemkes.go.id) + resep yang dicatat admin. Setiap entri mencantumkan sumber dan tanggal pengambilan|
|15|Berapa TTL kunci slot sementara pada usulan perubahan?|Tim|Open|Usulan: 12 jam atau sampai 24 jam sebelum jadwal lama, mana yang lebih dulu|
|16|Apakah kepatuhan obat digabung ke FB-5 atau berdiri sendiri?|Tim|Open|Usulan: berdiri sendiri sebagai FR-12 agar bisa diuji terpisah, tetapi memakai UI yang sama dengan FB-5|
|17|Apakah mitigasi "notifikasi hanya in-app" diadopsi? (penanda belum dibaca, blok "sejak terakhir masuk", pembatalan paksa)|Tim + pembimbing|Open|Usulan: adopsi ketiganya karena biayanya rendah dan langsung menutup celah di bagian 1.4|
|18|Apakah klaim masalah diperlunak bila bukti wawancara tidak terkumpul sebelum 28 Oktober?|Dita + Tim|Open|Usulan: ya, tulis sebagai asumsi yang belum terverifikasi, jangan mengarang data|

## 10. Appendix

- Kode aplikasi: `https://github.com/gbprtm/web-health-ipl-project` (salinan lokal `C:\Users\HYPE AMD\Documents\project`); folder ini hanya memuat rencana dan dokumen
- Model ruang lingkup MVP: `docs/produk/mvp-aplikasi-kesehatan.md` (lampirkan atau tautkan pada repo)
- Rencana uji per fitur: `plan/03-fitur-dan-rencana-uji.md` (perlu diperbarui untuk dua role, audit log, dan alur usulan)
- Pembagian tugas: `plan/04-pembagian-tugas.md` (perlu memisahkan area pasien dan area admin)
- Risiko dan tindak lanjut: `plan/05-risiko-dan-tindak-lanjut.md`
- Hasil review PRD versi 1: `_arsip/2026-10-24/tidak-dipakai/docs/produk/prd-review.md`
- PRD versi 2 (struktur lama): `_arsip/2026-10-24/tidak-dipakai/docs/produk/prd-aplikasi-kesehatan.md`
- **PRD v0.3 (kanonik - dokumen ini): `docs/produk/prd-v0.3.md`** - menggantikan seluruh versi PRD sebelumnya
- Arsip beku seluruh markdown sebelum revisi v0.3: `_arsip/2026-10-24/` (integritas dicek lewat `MANIFEST.md`)
- Berkas yang dikeluarkan dari pohon aktif: `_arsip/2026-10-24/tidak-dipakai/`
- Sumber data obat: `https://e-fornas.kemkes.go.id/` (Formularium Nasional, Kemenkes) - setiap entri obat wajib mencantumkan URL dan tanggal pengambilan
- PRD versi 0.1 (template baru): `docs/produk/prd-aplikasi-kesehatan-v3.md`
- Daftar kerja dan celah yang belum dibuat: `docs/to-do/to-do.md`
- Rencana perbaikan lanjutan: `docs/to-do/perbaikan-selanjutnya.md`
- **Glossary:**
    - FB: fitur wajib bernomor 1 sampai 6.
    - Admin: staf klinik yang mengatur jadwal temu dan antrian pemeriksaan; satu-satunya role non-pasien.
    - Slot: satu blok waktu praktik seorang dokter pada satu tanggal.
    - Janji aktif: janji yang belum dibatalkan atau selesai.
    - Usulan perubahan: permintaan admin untuk memindahkan janji ke slot lain yang harus ditanggapi pasien.
    - Audit log: catatan tindakan admin yang hanya dapat ditambah, tidak dapat diubah atau dihapus.
    - Notifikasi: pemberitahuan di dalam aplikasi kepada pasien.
    - UAT: User Acceptance Test, pengujian oleh pengguna di luar tim pengembang.
    - SUS: System Usability Scale, kuesioner baku untuk mengukur kegunaan.
    - p95: waktu respons yang dilampaui oleh 5 persen permintaan.
    - Seed: data awal yang dimasukkan lewat script, bukan lewat antarmuka.
    - **Nomor estimasi:** perkiraan urutan yang tampil saat janji dibuat; informatif, bukan urutan panggilan.
    - **Nomor final:** nomor antrian resmi yang terbit saat check-in pada hari kunjungan.
    - **Tidak hadir:** status antrian ketika pasien tidak check-in sampai jam tutup klinik.
    - **Resep:** catatan obat yang ditetapkan dokter dan dimasukkan admin; bukan hasil perhitungan aplikasi.
    - **Kepatuhan obat:** catatan harian pasien tentang obat yang sudah atau belum diminum.
    - **TTL (kunci slot):** batas waktu slot ditahan selama usulan perubahan menunggu jawaban.
    - **Fornas:** Formularium Nasional, daftar obat resmi Kemenkes yang menjadi acuan penulisan resep dan rujukan nama obat di aplikasi.
    - **Timeline kunjungan:** satu tampilan kronologis berisi janji, kunjungan, obat, dan jadwal kontrol berikutnya.

## 11. Revision History

|Version|Date|Author|Changes|
|---|---|---|---|
|0.1|21 Okt 2026|Tim Kelompok 4|PRD pertama dalam format `PRD Template.md`, disusun dari Final Ide, dokumen MVP, PRD versi 2, dan plan 03-05|
|0.2|22 Okt 2026|Tim Kelompok 4|Menindaklanjuti masukan dosen dan to-do review: dua role (pasien dan admin), dokter menjadi data; tambah FR-08 sampai FR-11 (usulan perubahan, notifikasi, audit log, riwayat); batas data admin; siklus status janji; metrik dan desain UX untuk pengguna akhir; skenario 10 langkah; jadwal dan gerbang pemangkasan disusun ulang; risiko privasi dan beban kerja; pertanyaan terbuka diperbarui; SATUSEHAT dicatat di luar ruang lingkup|
|0.3|24 Okt 2026|Tim Kelompok 4|Revisi setelah review v0.2: FR-12 catatan resep + kepatuhan obat; FR-13 timeline kunjungan (menggabung FR-11); FR-14 log aktivitas akun; nomor antrian estimasi vs final; status Tidak hadir dan siklus status antrian; jadwal kontrol agenda + toggle bulan; anchor tanggal pada jadwal berulang; TTL kunci slot; zona waktu WIB; NFR aksesibilitas dan sesi terukur; SATUSEHAT dinyatakan di luar rilis dengan Fornas sebagai sumber obat; gerbang pemangkasan digeser ke 30 Okt; risiko baru; 3 pertanyaan terbuka ditutup|
|0.3.1|24 Okt 2026|Tim Kelompok 4|Menindaklanjuti `saran/saran file prd -v0.3.md`: (1) Non-Goals 2 diperjelas - yang dilarang adalah pemberian resep oleh aplikasi, bukan pencatatan resep; (2) sisa penyebutan "29 Oktober" di tabel risiko diseragamkan menjadi 30 Oktober; (3) menambah bagian 1.4 Batasan yang Diakui yang menyatakan notifikasi hanya in-app dan bukti masalah masih terbatas, beserta tiga usulan mitigasi; (4) dua risiko baru dan dua pertanyaan terbuka (17, 18)|
---

## Tautan

- [To-Do Eksekusi](to-do.md) - gelombang kerja dan gerbang keras
- Perbaikan Selanjutnya - backlog P0-P3 dan keputusan tertunda
- MVP Aplikasi Kesehatan - dasar ruang lingkup
- [Peta Alur](design/01-peta-alur.md) - alur pasien dan admin
- [Rencana Uji](rencana-uji.md) - uji per fitur
- [Risiko dan Tindak Lanjut](risiko.md)
