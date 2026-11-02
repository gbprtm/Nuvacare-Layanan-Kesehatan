# Gerbang backend migrasi Laravel

Tanggal: 2 November 2026. **Checklist target, bukan laporan backend Laravel selesai.** Tidak mengakses source lama, env/secret atau database; tidak menjalankan scaffold/migrasi/test pada sesi dokumentasi ini. Status tugas hanya di [status-tugas.md](status-tugas.md).

Tinjauan Next 1 November 2026 dipertahankan di `_arsip/nextjs-2026-11-02/docs/tinjauan-backend-agen.md`. Bukti/path kode di sana adalah provenance historis, bukan hasil pemeriksaan source pada sesi ini. Temuan bisnis/keamanan yang masih relevan dikonversi menjadi gerbang di bawah. Bug middleware Next, pemetaan path Bxx, util TypeScript, dan discovery Vitest **tidak menjadi kondisi perbaikan aktif Laravel**.

## 1. Prosedur sebelum implementasi

1. Baca tugas Lxx pada status dan rencana migrasi aktif, scope/path yang disetujui, acceptance serta verify. Jangan memakai status selesai Axx/Bxx sebagai bukti Lxx selesai.
2. Baca [kontrak web](api-contract.md), [rencana database](database-schema.md), lalu hanya potongan FR/acceptance/privacy pada [PRD read-only](rancangan/prd-v0.3.md) yang terkait. Peta lama membantu menemukan FR, bukan menentukan path Laravel.
3. Cocokkan pemicu di tabel berikut. Ketergantungan keputusan yang belum ada berarti acceptance terkait **blocked**, bukan memilih kebijakan sendiri atau menghapus test.
4. Lakukan perubahan hanya pada scope yang disetujui. Berkas bersama seperti route, model, migrasi, layout dan config dikerjakan serial dengan handoff, tidak ditimpa paralel.
5. Jalankan verifikasi nyata di lingkungan aman; tulis bukti per skenario, perintah, tanggal dan commit. Belum dijalankan/butuh database test bukan hasil lulus.

`docs/rancangan/**` dan vault eksternal `brain-project` tetap read-only. Konflik sumber produk dilaporkan ke pemilik. Tenggat baru belum pasti: pernyataan sisa 10 hari tidak otomatis menggantikan tanggal lama 2 November dengan tanggal tertentu.

## 2. Pemicu bacaan L01–L17

| Tugas | Gerbang terkait |
|---|---|
| L01 bootstrap PHP/Composer, PHPUnit/Pint/Vite vanilla, Playwright Chrome, CI/hosting awal | G01, G02, G10 |
| L02 inventaris/backup/strategi database terisolasi | G02, G03 |
| L03 migrations/models/seeds | G02, G03, G05, G06, G07 |
| L04 auth dan registrasi pasien | G01, G03, G04, G10 |
| L05 layout Blade/CSS/JS bersama | G01, G04, G10 |
| L06 fondasi audit | G06, G04 |
| L07 profil/katalog | G04, G07 |
| L08 dokter/slot/janji | G01, G04, G05, G06, G10 |
| L09 usulan/notifikasi/tanggapan/cancel/expiry | G01, G04, G05, G06, G10 |
| L10 kontrol berulang | G06, G08, G10 |
| L11 antrean/check-in | G04, G06, G08, G09, G10 |
| L12 resep/kepatuhan obat | G04, G06, G07, G10 |
| L13 kebiasaan FB-5 wajib | G04, G07, G10 |
| L14 timeline FR-11 + FR-13 | G04, G08, G10 |
| L15 keamanan/E2E | Semua gerbang yang diuji lintas fitur |
| L16 performa/UAT/rilis | G02, G10 dan sisa gerbang yang belum terbukti |
| L17 konten/log opsional | G01, G04, G06, G07, G10; keputusan rilis dahulu |

L06 harus siap sebelum mutasi admin pertama. L10 memiliki generator jadwal; L11 hanya memanggilnya saat selesai. Setiap route memiliki **satu** pemilik di kontrak, termasuk dokter/slot admin, registrasi, pembatalan, audit pasien dan notifikasi. Jangan menciptakan alias route untuk menutup celah scope.

## 3. Gerbang dan bukti penutupan

### G01. Kontrak web, CSRF dan error HTML

**Asal:** BE-01/BE-03/BE-10 lama, diterjemahkan untuk server-rendered web.

Route login/daftar tamu harus dapat dicapai; halaman inti tamu redirect ke masuk, bukan dianggap sudah aman karena controller tidak pernah tercapai. GET tidak melakukan logout/read-state/check-in. Semua mutasi memakai Form Request, role/policy dan CSRF; PATCH/DELETE dari form memakai method spoof. Logout hanya POST.

**Tutup bila:** PHPUnit HTTP dan Playwright Chrome membuktikan GET 200 HTML, mutasi PRG 302, error bag/old input aman tanpa password, CSRF hilang/salah ditolak, role salah 403, resource pasien lain 404 konsisten. Fetch JSON jika benar-benar didukung mengembalikan 401/409/422 yang sesuai; tidak ada kewajiban semua route memakai envelope JSON `/api`. Konflik HTML menampilkan flash tanpa mutasi parsial. Test CSRF harus mengaktifkan middleware yang relevan; test feature yang menonaktifkannya bukan bukti proteksi CSRF.

### G02. Bootstrap, hosting dan keselamatan database

**Asal:** BE-09 dan batas verifikasi live lama; risiko baru migrasi stack.

PHP/Composer belum tersedia di PATH menurut inventaris; `artisan`/`composer.json` belum ada. L01 memvalidasi/pin versi Laravel/PHP/host, PHPUnit, Pint, Vite vanilla, Playwright Google Chrome dan CI sejak awal. Rujukan resmi yang telah diperiksa koordinator: [installation](https://laravel.com/docs/13.x/installation), [database](https://laravel.com/docs/13.x/database). Tidak menganggap Laravel 13 sudah terpasang hanya karena URL itu dipakai.

**Tutup bila:** L01 punya output toolchain/CI dan smoke hosting aktual; L02 memilih baseline terisolasi vs adopsi lama **sebelum L03**, menyediakan inventaris aman, backup/restore drill terisolasi dan guard target test PostgreSQL. Database lama tetap dipertahankan. Dilarang `migrate:fresh`, `db:wipe`, `migrate:reset` atau drop/reset pada existing/produksi; scaffold default tidak dijalankan ke Neon lama. PHPUnit harus benar-benar menemukan test transaksi PostgreSQL, bukan hanya mock/SQLite. Tanpa DB test, sebut belum terverifikasi.

### G03. Auth model dan sesi persisten

**Asal:** BE-02/BE-06; mismatch schema Laravel kini eksplisit.

`users.id` UUID dan `password_hash` perlu auth mapping, key type/non-incrementing, casts role serta timestamp Eloquent yang tepat. `sessions.token_hash` lama bukan schema database session driver Laravel. L02/L04 memilih tabel baru terisolasi atau adapter teruji, berikut cutover/invalidation sesi lama. Jangan menimpa tabel dengan migration session bawaan.

**Tutup bila:** login round-trip melalui HTTP/hosting terbukti; session ID diregenerasi; cookie HttpOnly/Secure produksi/SameSite; cookie/sesi yang disimpan sebelum logout ditolak setelah logout; idle expiry dicek server-side dengan clock terkontrol. Batas idle dan percobaan login disahkan. Limiter memakai store persisten/bersama antarproses/instance, bukan memori lokal yang diklaim sebagai proteksi global. Password/hash/token tidak bocor melalui view, error, old input atau log. Registrasi publik selalu pasien, field role/ID asing/NIK/KK ditolak, admin individual hanya seed aman.

### G04. Isolasi pasien dan privasi admin

**Asal:** BE-06/BE-10 dan PRD §4.4.

**Tutup bila:** uji pasien A/B mencakup daftar, detail, mutasi, relasi, agregasi, notifikasi, audit perubahan dan timeline. Kepemilikan berasal dari sesi/objek terotorisasi, bukan hidden field. Admin ditolak pada kebiasaan dan ringkasan kepatuhan pasien, termasuk melalui eager loading, audit snapshot atau route alternatif. Admin hanya mendapat proyeksi operasional minimal. Ringkasan alergi hanya saat check-in dengan pencatatan pembukaan, menunggu konfirmasi asumsi PRD; tidak ada akses profil lengkap. Tidak ada role dokter, registrasi admin, NIK atau KK baru.

### G05. Reservasi dua slot dan expiry race

**Asal:** BE-04/BE-05; invariant bisnis tetap berlaku.

Selama pending, janji lama tetap berlaku **dan** slot usulan dicadangkan. Index lama yang hanya mencakup `status='aktif'` tidak cukup. TTL timestamp bukan row lock/constraint. Semua operasi yang menyentuh slot memakai protokol PostgreSQL yang sama dan urutan lock konsisten.

**Tutup bila PostgreSQL terisolasi membuktikan:**

- dua pemesan satu slot: tepat satu berhasil;
- slot lama janji `perubahan_diusulkan` dan slot usulan sama-sama tidak dapat diambil pihak lain;
- setuju memindah atomik, tolak mempertahankan lama, alternatif langsung pindah tanpa konfirmasi admin tambahan;
- slot lama/usulan dilepas hanya pada hasil yang tepat; perebutan alternatif gagal tidak menghilangkan janji lama;
- expiry mempertahankan lama dan memberi tahu admin; respons/expiry/cancel bersamaan hanya menghasilkan satu hasil terminal;
- respons duplikat/kedaluwarsa ditolak tanpa mutasi parsial.

L09 memerlukan keputusan TTL, batas jawab, cutoff batal serta bentuk status terminal alternatif/cancel. PRD memuat usulan waktu yang belum final; jangan menulis test penerimaan dengan angka pilihan agen lalu menganggap kebijakan disetujui.

### G06. Mutasi admin dan satu audit satu transaksi

**Asal:** BE-07.

**Tutup bila:** setiap perubahan admin menghasilkan tepat satu audit berisi aktor/waktu/objek/before/after/alasan dalam transaksi yang sama; injeksi kegagalan audit menggagalkan mutasi dan efek domain terkait. Aksi ditolak tidak mengubah data; replay tanpa perubahan tidak menggandakan audit. Untuk batch, setiap objek yang berubah memiliki satu audit. Jangan memasang observer dan Action yang sama-sama mencatat, atau mengganti audit wajib dengan job setelah commit. Tidak ada route ubah/hapus audit. Snapshot tidak memuat password/kebiasaan/profil penuh. Append-only database (trigger/privilege) adalah keputusan dan test terpisah, tidak disimpulkan dari ketiadaan `updated_at`.

### G07. Data profil, resep dan kebiasaan tidak dicampur

**Asal:** BE-06/BE-10.

**Tutup bila:** kondisi, alergi dan obat laporan pasien dapat disimpan/dibaca ulang dari profil; persistensi laporan terpisah dari resep klinis. Hapus profil dengan konfirmasi tidak menghapus akun/resep klinis dan menghasilkan state ajakan melengkapi. Pasien tidak membuat/mengedit resep admin. Katalog Fornas hanya referensi; `data/fornas` dipertahankan, Excel/JSON tidak diimpor membabi buta. Resep menampilkan label bukan saran medis, pencatat dan sumber/tanggal yang dirancang. Tidak ada mapping penyakit -> rekomendasi obat.

Obat harian upsert unik, denominator bukan klaim dosis individual. Kebiasaan mencakup CRUD dan ringkasan milik sendiri, tanggal bolong, nilai batas, tidur 0/24/nonangka ditolak. **FB-5 tetap wajib L13**. Nilai ambang dan denominator yang belum disahkan membuat acceptance penilaian blocked, tidak diganti angka medis rekaan. Satu catatan per pasien+tanggal memerlukan pengaman data, bukan hanya tombol simpan dinonaktifkan.

### G08. Kontrol WIB dan satu generator jadwal

**Asal:** BE-07/BE-08; bug util Next bukan pekerjaan aktif.

PRD FR-02 menyebut interval 30 hari tetapi menuntut contoh anchor bulan; ini keputusan produk terbuka, bukan izin mengimplementasikan `+30 days` atau `+1 month` diam-diam. Cutoff jadwal terlewat dan pengganti juga harus disahkan.

**Tutup bila:** keputusan kalender tercatat, test 7/14 serta kebijakan 30/bulanan mencakup Jan–Apr, kabisat, perpindahan tahun dan batas tengah malam WIB. Jika bulanan dipilih, clamp tidak menggeser anchor asli. Pengingat tiga hari tidak ganda, jadwal lewat tidak memicu pengingat baru, jadwal pengganti sesuai keputusan. L10 memiliki generator yang dipanggil L11 saat selesai; retry tidak menggandakan jadwal/pengingat. Timeline tunggal FR-11+13 menampilkan kontrol berikutnya tanpa riwayat alias kedua.

### G09. Antrean/check-in dan transisi server

**Asal:** BE-07/BE-10 dan acceptance FR-04.

**Tutup bila:** satu tiket per janji; nomor final unik harian WIB dialokasikan aman pada check-in serentak; check-in kedua ditolak. Konfirmasi janji selalu menampilkan nomor estimasi + perkiraan jam dengan label, tidak dipakai memanggil. Menunggu -> diperiksa -> selesai diterima; menunggu -> selesai ditolak; koreksi mundur butuh alasan dan audit. Pasien tidak dapat menulis status admin. Tidak hadir/tutup hari idempoten, mengikuti jam tutup dan jendela check-in yang disahkan. Jika keputusan waktu belum ada, acceptance terkait belum dapat ditutup.

PRD mengatakan final “berbeda” dari estimasi; klarifikasi apakah ini beda konsep atau wajib beda angka, jangan membuat nomor palsu demi memenuhi redaksi.

### G10. Bukti terukur, bukan pemindahan angka lama

**Asal:** BE-09/BE-10 dan temuan sistem lama.

**Tutup bila:** traceability FR -> acceptance -> test -> hasil -> bukti tersedia. PHPUnit unit dan feature dibedakan dari concurrency PostgreSQL nyata, Playwright Google Chrome, security, hosting, UAT/SUS dan performa. Config Chrome/CI disiapkan L01, bukan menunggu akhir. Rekam commit/tanggal/perintah/lingkungan nonrahasia. Test stub, skip, mock sukses, atau build lama tidak menutup acceptance bisnis.

L15 menguji CSRF, sesi/idle/replay, brute-force, role/IDOR, XSS/escaping, field terlarang dan transaksi HTTP sebenarnya. L16 mengukur beban ringan dan UAT sesuai target yang disahkan; p95 lama belum otomatis menjadi hasil atau target hosting baru. URL hosting harus benar-benar diuji dari perangkat lain, termasuk login dan persistensi sesi/data aman. Tidak ada klaim rilis hanya karena dokumentasi selesai.

## 4. Urutan aman dan bentuk bukti

1. L01 toolchain/CI/kelayakan hosting; L02 keputusan data/backup; L03 schema/model/seed terisolasi.
2. L04 auth dan L05 layout; L06 fondasi audit sebelum mutasi admin; L07 profil/katalog.
3. L08–L14 sesuai dependensi rencana aktif, dengan keputusan waktu/ambang ditutup sebelum acceptance terkait. Generator L10 harus siap untuk integrasi selesai kunjungan L11.
4. L15 keamanan/E2E dan L16 performa/UAT/rilis; L17 hanya jika disetujui, tanpa mengorbankan lima fitur wajib.

Pembagian ini bukan perubahan status/dependensi otomatis. Jika scope tidak cukup, ajukan keputusan; jangan menyunting vault atau menambah route/persistensi tanpa pemilik.

Format bukti pada laporan tugas pemilik, bukan ledger status kedua:

```text
GERBANG: Gxx (asal BE-xx jika relevan)
TUGAS/COMMIT/TANGGAL: Lxx / revisi yang benar-benar diuji / waktu eksekusi
KEPUTUSAN: rujukan kebijakan dan scope yang disetujui
LINGKUNGAN: test PostgreSQL terisolasi atau hosting, tanpa URL/secret
VERIFIKASI: perintah, skenario, hasil aktual
SISA: keputusan/akses/verifikasi yang belum tersedia
```

## 5. Provenance lama yang tidak ditagih sebagai bug Laravel

| Temuan lama | Perlakuan target |
|---|---|
| BE-01 middleware Next memblokir API login | Arsipkan bug path; uji public/auth routes Laravel melalui G01 |
| BE-03 konflik Bxx dan path `/api` | Tidak memperbaiki Bxx; route target satu pemilik Lxx pada kontrak web |
| BE-08 util TypeScript kehilangan anchor | Tidak mem-port util; tetapkan kebijakan kalender dan test service WIB G08 |
| BE-09 discovery Vitest tidak mencakup lokasi test | Tidak mengubah Vitest; bangun discovery PHPUnit/PostgreSQL/Chrome G02/G10 |
| Ringkasan status Axx, commit gabungan, render Mermaid lama | Simpan sebagai histori; bukan bukti/utang implementasi Laravel otomatis |

Belum ada gerbang yang diklaim tertutup oleh penulisan dokumen ini. Verifikasi live/database, scaffold, build dan uji aplikasi tidak dilakukan.
