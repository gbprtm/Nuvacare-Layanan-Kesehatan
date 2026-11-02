# Sistem dan use case target Laravel

Tanggal: 2 November 2026. **Rancangan migrasi dokumentasi, bukan laporan aplikasi Laravel telah berjalan.** Tidak ada scaffold, koneksi database, inspeksi env/secret atau pengujian aplikasi pada sesi ini.

## 1. Sumber, status dan batas klaim

- Kebutuhan produk: [PRD read-only](rancangan/prd-v0.3.md), khususnya §3.3–3.5, §4.1–4.4, §6 dan pertanyaan terbuka §9. `docs/rancangan/**` dan vault eksternal `brain-project` tetap read-only.
- Target teknis: [arsitektur Laravel](panduan-arsitektur.md), [kontrak route HTML](api-contract.md), [rencana data](database-schema.md), [gerbang backend](tinjauan-backend-agen.md).
- Dokumen dan bukti Next terdahulu disimpan di `_arsip/nextjs-2026-11-02/docs`. Angka tugas/test/migrasi/seeds lama bukan kemajuan Laravel.
- **Satu-satunya ledger status implementasi baru adalah [status-tugas.md](status-tugas.md).** Dokumen ini tidak menyalin jumlah done/todo atau menandai Lxx selesai.
- PHP dan Composer belum tersedia di PATH menurut inventaris migrasi; belum ada `artisan`/`composer.json`. Perintah dan path Laravel adalah rencana sampai L01 membuktikan bootstrap.

Stack disetujui: Laravel, Blade HTML server-rendered, CSS biasa, JavaScript vanilla, Eloquent, Laravel Form Requests, PostgreSQL Neon, PHPUnit backend, Playwright Google Chrome. Rujukan resmi yang telah diperiksa koordinator: [installation](https://laravel.com/docs/13.x/installation), [database](https://laravel.com/docs/13.x/database). Versi tepat harus diuji kompatibilitas PHP/host dan dipatok L01, tidak diasumsikan sudah terpasang.

## 2. Produk, aktor dan privasi

Website browser untuk mengelola profil personal, jadwal kontrol, janji, kunjungan/antrean dan kebiasaan. Bukan aplikasi mobile native, diagnosis, rekomendasi medis, resep elektronik, farmasi, pembayaran, atau rekam medis lengkap. Tidak terintegrasi SATUSEHAT, WhatsApp, email atau push; pemberitahuan hanya di aplikasi.

| Aktor | Wewenang target | Batas |
|---|---|---|
| Tamu | Beranda publik, daftar pasien, masuk | Tidak membaca halaman inti/data kesehatan |
| Pasien | Profil/obat laporan sendiri, janji, tanggapan usulan, check-in, kebiasaan, catatan obat harian dan timeline sendiri | Tidak mengakses pasien lain, status admin, atau membuat resep klinis |
| Admin individual | Dokter/slot, janji, usulan/cancel, check-in/antrean, catatan anjuran kontrol, pencatatan resep dan audit | Tidak membuka kebiasaan atau ringkasan kepatuhan pasien; bukan pengambil keputusan medis |
| Dokter | Data master nama/spesialisasi/slot | **Bukan akun/role aplikasi** |

Backend registrasi publik selalu menetapkan pasien; admin dibuat melalui seed aman per individu, bukan akun bersama. Login email/password; NIK dan KK tidak dikumpulkan atau diekspos meski kolom NIK lama mungkin masih ada. Data demo/uji fiktif.

Admin hanya melihat proyeksi operasional minimal: nama, jadwal, status dan nomor antrean. PRD §4.4 mengusulkan ringkasan alergi hanya pada check-in dan setiap pembukaan tercatat; asumsi ini perlu konfirmasi sebelum akses diaktifkan. Tidak ada izin membuka seluruh profil, daftar kebiasaan atau kepatuhan melalui relasi/audit/timeline.

## 3. Lima fitur wajib tidak boleh disederhanakan menjadi satu alur janji

Label P2 lama pada FR-05 bukan izin migrasi untuk membuang FB-5. Persetujuan saat ini mempertahankan **lima fitur wajib**. Resep dan timeline pendukung juga tetap dalam cakupan target; hanya konten/log aktivitas yang opsional L17.

| Fitur/kebutuhan | Cakupan target | Pemilik | Bukti penerimaan yang direncanakan |
|---|---|---|---|
| FB-1 / FR-01 | Isi/lihat/ubah/hapus profil dengan konfirmasi; kondisi, alergi dan obat laporan pasien | L07 | Round-trip lengkap, hapus aman, IDOR, profil kosong tidak menyebabkan galat |
| FB-2 / FR-02 | Aturan kontrol admin, agenda default + toggle bulan, jadwal/pengganti terlewat dan pengingat tiga hari | L10 | Kalender WIB, anchor sesuai keputusan, idempotensi jadwal/pengingat |
| FB-3 / FR-03 | Spesialis/dokter/slot dan pemesanan anti-bentrok | L08 | Dua pemesan tepat satu sukses, konfirmasi estimasi/jam berlabel perkiraan |
| FB-4 / FR-04 | Check-in, nomor final, status, koreksi beralasan, penutupan hari, selesai -> kontrol berikutnya | L11 | Nomor harian unik, check-in ganda ditolak, state machine + audit + idempotensi |
| FB-5 / FR-05 | CRUD kebiasaan hidrasi/tidur/aktivitas dan ringkasan/runtutan hari | L13 | Batas input/ambang, tanggal bolong, ringkasan terbaru, larangan admin |
| FR-07 | Registrasi pasien, login dua role, sesi/idle/logout/limiter | L04 | Login HTTP/hosting, CSRF, replay/idle/rate limit, role escalation ditolak |
| FR-08/09 | Usulan, reservasi sementara, setuju/tolak/alternatif, cancel dan notifikasi in-app | L09 | Kedua slot terlindungi, respons atomik, expiry race, tidak ada konfirmasi admin tambahan |
| FR-10 | Audit per perubahan admin; pasien membaca perubahan janjinya | L06 | Tepat satu log, rollback bila audit gagal, tidak ada operasi edit/hapus |
| FR-12 | Resep dokter dicatat admin, label/sumber, tanda sudah/belum harian dan kepatuhan | L12 | Resep vs laporan pasien terpisah, upsert harian, tanpa rekomendasi obat |
| FR-11 + FR-13 | Satu timeline janji/check-in/kunjungan/obat/kontrol berikutnya | L14 | Urut terbaru, detail/empty state, isolasi pasien, tanpa alias daftar riwayat kedua |
| FR-06 + FR-14 | Konten resmi dan log aktivitas akun | L17 opsional | Keputusan eksplisit; tanpa navigasi/claim implementasi bila dipotong |

## 4. Alur resmi pasien dan admin

### UC-1: rangkaian kunjungan dan kontrol

1. Pasien mendaftar/masuk dan mengisi kondisi, alergi serta obat laporan sendiri.
2. Admin mencatat anjuran dokter untuk kontrol berulang, bukan menetapkan terapi.
3. Sistem membentuk jadwal sesuai kebijakan kalender yang disahkan.
4. Pengingat in-app muncul sekali tiga hari sebelum jatuh tempo.
5. Pasien memilih dokter/slot dan membuat janji; konfirmasi menampilkan nomor estimasi dan perkiraan jam.
6. Jika dokter berhalangan, admin mengusulkan slot baru dengan alasan; pasien dapat setuju, menolak atau memilih alternatif.
7. Pasien datang dan check-in (atau diproses admin melalui route khusus); nomor final baru diterbitkan.
8. Admin menjalankan menunggu -> diperiksa -> selesai; koreksi memerlukan alasan dan audit.
9. Kunjungan selesai memicu tepat satu jadwal kontrol berikutnya melalui generator L10.
10. Di antara kunjungan pasien mencatat kebiasaan, menandai obat harian dan melihat ringkasan/timeline miliknya.

Playwright Chrome harus menguji rangkaian HTML nyata dengan akun pasien dan admin terpisah. Test fungsi hash atau render layout saja tidak membuktikan use case ini.

### UC-2: dua pasien berebut slot

Dua sesi pasien membaca slot kosong dan menyimpan hampir bersamaan. Transaksi PostgreSQL memastikan tepat satu janji berhasil. Pasien lain memperoleh flash konflik yang jelas melalui PRG, tanpa janji/reservasi setengah tersimpan. Uji constraint langsung saja belum membuktikan HTTP dan otorisasi, sedangkan mock saja belum membuktikan database.

### UC-3: usulan perubahan dan expiry

| Kejadian | Hasil wajib |
|---|---|
| Admin membuat usulan | Janji lama tetap berlaku; slot lama **dan** slot usulan dilindungi; alasan, notifikasi dan audit tersimpan atomik |
| Setuju | Pindah ke slot usulan, slot lama dilepas, usulan selesai |
| Tolak | Janji lama tetap, slot usulan dilepas |
| Pilih alternatif kosong | Langsung pindah atomik ke alternatif; slot lama/usulan dilepas; **tanpa** tahap konfirmasi admin lagi |
| Alternatif direbut | Konflik, tidak ada perpindahan parsial atau kehilangan janji lama |
| Batas/TTL lewat | Usulan ditutup, slot usulan dilepas, janji lama tetap dan admin diberi tahu |
| Batal | Reservasi/usulan terkait diselesaikan atomik; pembatalan admin wajib alasan, audit dan pemberitahuan |

Respons kedua/kedaluwarsa ditolak. Race antara expiry, jawaban, cancel dan pemesan lain diuji dengan koneksi PostgreSQL terpisah. Index lama hanya untuk `status='aktif'` dan timestamp TTL tidak cukup untuk invariant ini.

### UC-4: antrean dan kondisi batas

Nomor estimasi bukan nomor panggilan; nomor final unik per tanggal WIB hanya terbit setelah check-in. Check-in kedua ditolak tanpa nomor baru. Pasien tidak bisa menulis status admin. Menunggu langsung selesai ditolak. Koreksi mundur perlu alasan/audit, penutupan hari menandai tidak hadir sesuai jam tutup, dan replay tidak menggandakan efek/audit/jadwal. Profil kosong, slot kosong, resep kosong, timeline kosong dan tanggal kebiasaan bolong masing-masing punya state yang memberi langkah berikutnya, bukan data contoh.

### UC-5: obat profil vs resep klinis

Pasien dapat menyimpan obat yang ia laporkan di profil sebagai laporan personal. Admin memasukkan resep klinis berdasarkan resep dokter pada penyimpanan terpisah. Pasien membaca resep tanpa tombol tambah/edit klinis dan hanya menandai sudah/belum per hari. Label “Catatan resep, bukan saran medis”, nama pencatat, rujukan Fornas dan metadata sumber ditampilkan. Frekuensi resep tidak membuat data per dosis otomatis tersedia; ringkasan menjelaskan denominator harian. `data/fornas` dipertahankan, bukan diimpor otomatis dari Excel/JSON publik ke data klinis.

## 5. Invariant lintas fitur

- Semua mutasi divalidasi Form Request dan diotorisasi server-side. GET HTML 200; mutasi berhasil PRG 302; PATCH/DELETE memakai method spoof; CSRF mencakup login/daftar/logout. Logout hanya POST. Tidak ada kewajiban JSON envelope `/api`.
- Tamu HTML redirect masuk; JSON opsional 401. Role salah 403; resource pasien lain 404 konsisten. Konflik HTML redirect flash/JSON opsional 409, tanpa mutasi parsial. Validation error HTML redirect dan old input aman tanpa password; JSON opsional 422.
- Sesi server persisten dengan invalidasi logout/idle; cookie HttpOnly, Secure produksi, SameSite; rate limit store persisten/bersama, bukan Map/memori lokal.
- Setiap perubahan admin menghasilkan tepat satu audit dalam transaksi yang sama. Audit gagal berarti rollback semua efek wajib terkait. Tidak ada endpoint ubah/hapus audit; proteksi append-only database memerlukan keputusan dan bukti tersendiri.
- Semua tanggal bisnis memakai service WIB bersama; tanggal harian/anchor berbeda dari timestamp absolut. L10 satu-satunya pemilik generator kontrol, L11 memanggilnya.
- UI berbahasa Indonesia, responsif sampai 360 px, input berlabel, keyboard/focus, target sentuh 44 px dan kontras sesuai PRD. Vanilla JS meningkatkan interaksi, bukan syarat tunggal penyimpanan.

## 6. Keputusan terbuka dan dampaknya

| Isu | Keputusan yang dibutuhkan | Dampak tanpa keputusan |
|---|---|---|
| FR-02 “30 hari” vs anchor bulan | Arti interval; cutoff terlewat dan jadwal pengganti | Acceptance tanggal L10 belum dapat ditutup; jangan memilih `+30 days`/`+1 month` sendiri |
| TTL dan batas jawab | Durasi, relasi TTL/batas jawab, notifikasi admin dan cutoff cancel | Acceptance waktu/expiry L09 terhalang; 12/24 jam lama masih usulan |
| Check-in/jam tutup | Jendela check-in, batas tidak hadir, koreksi yang sah | Acceptance waktu L11 terhalang |
| Estimasi vs final | PRD mengatakan nomor final “berbeda”: beda konsep atau wajib beda angka | Jangan memalsukan nomor agar tampak berbeda |
| Ambang kebiasaan | Sumber/angka/aturan denominator dan presisi input | Penilaian FB-5 L13 blocked, fiturnya tetap wajib |
| Kepatuhan obat | Denominator hari aktif, perlakuan hari kosong/rentang | Persentase L12 belum boleh diklaim benar |
| Privasi alergi | Konfirmasi akses minimal hanya saat check-in dan jejak pembukaan | Jangan membuka profil lengkap sebagai jalan pintas |
| Auth | Idle timeout, persistent limiter/angka batas, cutover sesi | Keamanan sesi L04 belum dapat ditutup |
| Database | Baseline baru terisolasi atau adopsi schema lama | L02 harus memutuskan sebelum L03; tidak ada migrasi scaffold ke live |
| Hosting/versi | PHP/Laravel kompatibel yang dipatok, biaya/operasi/scheduler | L01 perlu bukti hosting awal, bukan mengasumsikan Vercel lama mendukung target |
| Tenggat | Tanggal/jam baru yang benar | Pernyataan pemilik “10 hari” dan tanggal lama 2 November belum menjadi tanggal final baru |

Tidak ada angka medis, kebijakan bisnis, tenggat baru atau pemangkasan fitur yang dipilih diam-diam untuk membuat test hijau.

## 7. Urutan pembuktian L01–L17

| Tahap | ID dan hasil yang dituntut, bukan status |
|---|---|
| Fondasi | L01 bootstrap PHP/Composer + baseline PHPUnit/Pint/Vite vanilla + Playwright Chrome/CI/hosting awal; L02 inventaris/backup/strategi terisolasi; L03 migrations/models/seeds |
| Akses dan shared UI | L04 auth; L05 layout Blade/CSS/vanilla; L06 fondasi audit sebelum mutasi admin |
| Fitur | L07 profil/katalog; L08 dokter/slot/janji; L09 reschedule/notifikasi/cancel; L10 kontrol; L11 antrean; L12 resep/adherence; L13 kebiasaan wajib; L14 timeline FR-11+13 |
| Penerimaan | L15 security/E2E; L16 performa/UAT/rilis |
| Tambahan | L17 konten/log opsional setelah keputusan, bukan pengganti fitur wajib |

Shared routes, layout, konfigurasi, migrasi dan model lintas fitur dikerjakan serial dengan handoff. Pemilik konkret tiap method/path ada pada kontrak web, bukan ditentukan ulang di sini.

## 8. Kriteria bukti dan keselamatan data

Setiap acceptance ditautkan ke tugas, berkas test aktual setelah tersedia, jenis test, perintah/commit/tanggal, lingkungan nonrahasia dan hasilnya. Tidak membuat tautan Markdown ke path kode yang masih rencana. PHPUnit membuktikan backend; concurrency/constraint/locks harus memakai PostgreSQL terisolasi; Playwright Google Chrome membuktikan alur browser; L16 menambah hasil UAT/SUS, beban dan smoke hosting aktual.

Riwayat hasil test Next tidak dipindahkan sebagai angka kelulusan target. Test belum ada/skip/blocked tidak dianggap lulus. UI/build lokal bukan bukti login hosting; query hash bukan bukti sesi; tidak adanya route edit audit bukan bukti privilege/trigger database.

L02 melindungi database lama: backup dan restore drill ke target terisolasi, lalu memilih baseline baru atau adopsi lama sebelum L03. Eloquent harus memetakan UUID, `password_hash`, enum/timestamps dan tabel lama secara eksplisit. `sessions.token_hash` lama tidak kompatibel langsung dengan session driver database Laravel; perlu adapter teruji atau tabel baru terisolasi. Jangan menjalankan scaffold migrations, `migrate:fresh`, `db:wipe`, reset/drop pada existing/produksi. Semua seed/test fiktif, tanpa NIK/KK.

**Kesimpulan:** keputusan migrasi stack telah diberikan, tetapi dokumen target tidak membuktikan aplikasi, sesi, database atau hosting Laravel sudah berjalan. Kelayakan rilis menunggu bukti L01–L16 dan keputusan terbuka yang terkait, bukan penyelesaian arsip atau angka progres lama.
