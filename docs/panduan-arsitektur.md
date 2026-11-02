# Arsitektur target Laravel

Tanggal: 2 November 2026. **Rancangan target, belum diimplementasikan atau diverifikasi live.** Perubahan sesi ini hanya dokumentasi dan pengarsipan, bukan scaffold aplikasi.

## 1. Keputusan dan sumber

Target yang disetujui: Laravel, Blade yang menghasilkan HTML di server, CSS biasa, JavaScript vanilla, PostgreSQL Neon, Eloquent, Laravel Form Requests, PHPUnit untuk backend, dan Playwright dengan Google Chrome untuk browser. Tidak memakai Next.js, React, Tailwind, Drizzle, Zod, atau Vitest sebagai fondasi aplikasi baru.

- Kebutuhan produk tetap merujuk [PRD read-only](rancangan/prd-v0.3.md), terutama §3.4–3.5, §4.1–4.4 dan §6. Vault eksternal `brain-project` dan seluruh `docs/rancangan/**` tidak disunting.
- Instruksi stack/tugas Next dalam salinan rancangan adalah konteks lama, bukan perintah scaffold target. Konflik kebutuhan produk dilaporkan, bukan diselesaikan dengan mengubah salinan.
- [Kontrak web](api-contract.md), [rencana data](database-schema.md), dan [gerbang backend](tinjauan-backend-agen.md) menjadi rujukan teknis target.
- Panduan lama tersedia di `_arsip/nextjs-2026-11-02/docs/panduan-arsitektur.md`. Bukti Next tidak membuktikan Laravel.
- Rujukan resmi: [Laravel 13.x installation](https://laravel.com/docs/13.x/installation) dan [database](https://laravel.com/docs/13.x/database), telah diperiksa koordinator migrasi. L01 harus memvalidasi versi PHP, ekstensi, Composer, Laravel dan host, lalu mematok versi yang kompatibel. URL dokumentasi bukan bukti versi terpasang.

PHP dan Composer belum tersedia di PATH menurut inventaris migrasi; belum ada `artisan` atau `composer.json`. Semua struktur dan perintah Laravel di bawah adalah **rencana**, bukan berkas/perintah yang sudah tersedia.

## 2. Struktur konvensional, tanpa lapisan tambahan yang tidak dibutuhkan

```text
app/Http/Controllers/       controller tipis: request -> action/query -> HTML/redirect
app/Http/Requests/          Form Requests: authorize, whitelist dan validasi input
app/Http/Middleware/        sesi, role, batas idle dan kontrol akses lintas route
app/Policies/              otorisasi objek dan kepemilikan
app/Actions/               satu operasi bisnis/transaksi, misalnya RespondToProposal
app/Services/              aturan domain bersama: jadwal WIB, reservasi, audit
app/Models/                Eloquent, relasi, casts dan pemetaan tabel lama eksplisit
resources/views/           Blade layouts, components, halaman pasien/admin
resources/css/             CSS biasa
resources/js/              JavaScript vanilla untuk peningkatan interaksi
routes/web.php             named web routes dengan session dan CSRF
config/                    konfigurasi Laravel; env dibaca lewat konfigurasi
database/migrations/       migrasi target setelah keputusan L02
database/seeders/          data demo fiktif dan admin individual
tests/Unit/                aturan murni dan perhitungan WIB
tests/Feature/             HTTP, otorisasi, persistensi dan transaksi PostgreSQL
tests/e2e/                 Playwright, channel Google Chrome
```

Semua path adalah rencana. Tidak perlu repository generik di atas Eloquent; tambah abstraksi hanya bila ada kebutuhan nyata yang tidak terwakili oleh Action, service domain, atau query Eloquent.

| Lapisan | Tanggung jawab | Tidak boleh |
|---|---|---|
| Controller | Memilih view/redirect dan memanggil operasi domain | Menghitung jadwal atau menulis audit terpisah |
| Form Request | Validasi server, field yang diizinkan, authorize | Memercayai role/pemilik dari hidden input |
| Policy + middleware | Sesi, role, kepemilikan, pembatasan data | Mengandalkan tombol disembunyikan di Blade |
| Action/service | State machine, transaksi, locks, idempotensi | Mengirim efek samping sebelum commit |
| Eloquent | Query terparameterisasi, relasi, casts dan persistence | Mass assignment dari seluruh request |
| Blade | HTML dengan escaping, form CSRF, pesan galat | Menentukan izin atau mengakses data pasien tanpa scope |
| JS vanilla | Progressive enhancement, refresh status/ringkasan | Menjadi satu-satunya jalur validasi/transaksi |

Alur dasar harus bekerja tanpa JavaScript: GET HTML, form submit, redirect, GET hasil. Vite hanya untuk membangun aset CSS/JS vanilla, bukan memperkenalkan framework UI.

## 3. Kontrak HTTP dan keamanan

- Route utama ada di `routes/web.php`, bukan API JSON terpisah. GET berhasil menghasilkan HTML 200; mutasi berhasil memakai POST/Redirect/GET (302). PATCH/DELETE dari form memakai POST dengan `_method`.
- Semua mutasi memakai CSRF, termasuk login, registrasi dan logout. Logout hanya POST. Validasi HTML mengembalikan redirect dengan errors serta input lama yang aman, tidak pernah kata sandi.
- `Accept: application/json` hanya peningkatan opsional untuk route yang secara eksplisit mendukungnya: 401/403/404/409/422 sesuai kontrak. Tidak ada kewajiban envelope `/api` di seluruh aplikasi.
- Session cookie HttpOnly, Secure di produksi, SameSite yang sesuai alur same-origin. Regenerasi ID sesi setelah login; logout menginvalidasi sesi di server dan meregenerasi token CSRF. Batas idle diperiksa server-side pada request berikutnya.
- Pembatas percobaan login memakai store persisten/bersama antarproses dan instance, bukan array atau memori lokal. Target idle 15 menit mengikuti rencana L04; batas percobaan dan maksimum sesi perlu keputusan L04.
- Registrasi publik selalu membuat pasien di backend. Admin individual dibuat melalui seed yang aman. Dokter hanya data master tanpa akun. Tidak mengumpulkan NIK atau KK.
- Pasien hanya membaca/mengubah data sendiri. Resource pasien lain disamarkan dengan 404; role salah 403. Admin tidak boleh membuka kebiasaan atau ringkasan kepatuhan pasien, termasuk lewat query relasi, audit, dan timeline.
- Admin mendapat proyeksi minimal operasional: nama, jadwal, status, nomor antrean. Pembukaan ringkasan alergi hanya pada check-in, dengan jejak pembukaan; asumsi PRD ini perlu dikonfirmasi sebelum fitur tersebut diaktifkan.

## 4. Batas transaksi domain

### Pemesanan dan perubahan jadwal

Satu slot hanya menampung satu klaim janji berjalan. Janji `perubahan_diusulkan` **tetap menguasai slot lama**, dan slot usulan juga harus dicadangkan sampai jawaban atau expiry. TTL hanyalah waktu, bukan pengaman konkurensi.

Action pemesanan/usulan/jawaban/pembatalan dan proses expiry menggunakan transaksi PostgreSQL, urutan row locks konsisten, pembacaan ulang status/expiry di dalam lock, serta constraint sesuai rancangan L03. Jangan hanya melakukan SELECT tersedia lalu INSERT tanpa pengaman data. Unique index lama `status = 'aktif'` tidak cukup.

| Peristiwa | Hasil atomik wajib |
|---|---|
| Admin mengusulkan | Janji lama dipertahankan, slot usulan dicadangkan, usulan + notifikasi + satu audit tersimpan bersama |
| Pasien setuju | Janji pindah ke slot usulan, slot lama dilepas, usulan selesai |
| Pasien menolak | Janji lama tetap berlaku, slot usulan dilepas, usulan selesai |
| Pasien memilih alternatif kosong | Janji langsung pindah ke alternatif; slot lama dan slot usulan dilepas; tidak menunggu konfirmasi admin lagi |
| Expiry | Janji lama tetap berlaku, slot usulan dilepas, usulan ditutup dan admin diberi tahu |
| Pembatalan | Janji dan reservasi terkait ditutup/dilepas bersama; pembatalan admin mencakup audit dan pemberitahuan |

Jawaban kedua, slot direbut, serta jawaban bersamaan dengan expiry tidak boleh meninggalkan perpindahan parsial. Kebijakan TTL/batas jawab belum final. State/kolom untuk merekam alternatif dan pembatalan usulan ditentukan dalam rancangan data, bukan diasumsikan sudah ada.

### Audit

Setiap perubahan domain oleh admin menghasilkan tepat satu audit untuk perubahan tersebut dalam **transaksi yang sama**. Pelaku, waktu, objek, before/after, dan alasan berasal dari server. Audit gagal berarti seluruh mutasi rollback. Jangan mengandalkan observer sekaligus Action sehingga log ganda, atau job after-commit sebagai satu-satunya audit wajib. Tidak ada route ubah/hapus audit. Jaminan append-only database melalui privilege/trigger memerlukan keputusan dan bukti terpisah dari jaminan aplikasi.

### Kontrol dan antrean

L10 memiliki generator jadwal/pengingat idempoten; L11 memanggilnya saat kunjungan selesai, bukan membuat generator kedua. Rollback juga mencakup efek domain terkait. Nomor estimasi dan perkiraan jam wajib tampil saat konfirmasi janji, tetapi bukan nomor panggilan. Nomor final unik per hari WIB hanya terbit saat check-in. Alokasi nomor harus aman saat dua check-in bersamaan, bukan `MAX + 1` tanpa lock.

Semua tanggal bisnis melalui satu service waktu WIB (Asia/Jakarta), dengan clock terkontrol untuk test. Timestamp absolut dan tanggal bisnis dibedakan. FR-02 mencampur interval 30 hari dengan anchor bulanan; minta keputusan, jangan memilih salah satu diam-diam.

### Profil, resep, kebiasaan, timeline

Obat yang dilaporkan pasien pada profil terpisah dari `resep`/`obat` klinis yang dicatat admin. Pasien dapat memperbarui laporan sendiri, tidak membuat resep. Fornas adalah katalog referensi nama/sumber, bukan mesin rekomendasi. `data/fornas` tetap dipertahankan; Excel/JSON publik tidak otomatis diimpor menjadi tabel resep atau data produksi.

Kebiasaan FR-05/FB-5 tetap wajib. CRUD dan ringkasan harus tersedia; ambang medis/bisnis tidak boleh dikarang. Kepatuhan obat diukur per catatan harian, bukan jumlah dosis yang tidak dicatat. Timeline L14 menyatukan FR-11 dan FR-13 tanpa alias riwayat kedua.

## 5. Data, konfigurasi dan operasi

L02 memilih **baseline baru pada database terisolasi** atau **adopsi skema lama melalui pemetaan dan migrasi terkontrol**, sebelum L03. Keduanya bukan izin menghapus database lama. Backup harus punya rencana restore yang teruji pada target terisolasi. Jangan menjalankan migrasi scaffold default terhadap Neon lama/live.

Pemetaan Eloquent wajib eksplisit untuk UUID, `password_hash`, tabel Indonesia, enum, JSON, tanggal dan timestamp. `sessions.token_hash` lama bukan schema session driver database Laravel; pilih adapter teruji atau tabel sesi Laravel terisolasi. Lihat [rencana database](database-schema.md).

Env/secret hanya konfigurasi server dan penyimpanan CI/hosting yang aman; tidak di Blade, JS, fixture, log, atau bukti. Jangan mengakses source/data/secret lama untuk sekadar menyusun dokumen. Hosting Laravel harus mendukung PHP yang dipatok, PostgreSQL TLS, aset, sesi persisten, scheduler dan deployment aman. Vercel lama bukan bukti kelayakan host Laravel.

## 6. Pemilik pekerjaan target

Ini pembagian tanggung jawab, **bukan ledger status**. Status hanya di [status tugas](status-tugas.md).

| ID | Tanggung jawab |
|---|---|
| L01 | Bootstrap PHP/Composer, baseline PHPUnit/Pint/Vite vanilla, konfigurasi Playwright Chrome, CI dan pembuktian hosting sejak awal |
| L02 | Inventaris, backup/restore dan keputusan strategi database terisolasi |
| L03 | Migrations, models, seeds sesuai keputusan L02 |
| L04 | Auth, registrasi pasien, sesi, idle logout dan rate limit |
| L05 | Layout Blade bersama, CSS biasa, JS vanilla dan aksesibilitas |
| L06 | Fondasi transaksi audit dan route baca audit |
| L07 | Profil, obat laporan pasien dan katalog referensi |
| L08 | Dokter, slot dan janji anti-bentrok |
| L09 | Usulan, tanggapan, notifikasi, expiry dan pembatalan |
| L10 | Kontrol berulang, pengingat dan generator idempoten |
| L11 | Antrean, check-in, koreksi dan penutupan hari |
| L12 | Pencatatan resep dan kepatuhan obat harian |
| L13 | Kebiasaan + ringkasan, FB-5 wajib |
| L14 | Timeline tunggal FR-11 + FR-13 |
| L15 | Gerbang keamanan dan E2E |
| L16 | Performa, UAT dan rilis |
| L17 | Konten/log aktivitas opsional jika disetujui |

L06 harus tersedia sebelum mutasi admin pertama. Perubahan bersama pada `routes/web.php`, layout, konfigurasi, migrasi dan model lintas domain dikerjakan **serial** dengan handoff pemilik, bukan dua agen menimpa berkas yang sama.

## 7. Bukti dan keputusan tertunda

Rencana verifikasi setelah scaffold tersedia: PHPUnit unit/feature, test konkurensi pada PostgreSQL test terisolasi, Pint, Vite build, Playwright Google Chrome, lalu smoke test hosting. `php artisan test`, `vendor/bin/pint --test` dan perintah build aset masih **rencana**; L01 menetapkan perintah nyata dan memastikan test discovery CI. SQLite/mock tidak membuktikan locks, enum atau partial index PostgreSQL.

Setiap bukti menyebut commit, tanggal, perintah, lingkungan test nonrahasia, skenario dan hasil aktual. Test yang belum dijalankan atau terhalang keputusan tidak disebut lulus. Tidak menjalankan `migrate:fresh`, `db:wipe`, reset/drop skema atau pembersihan fixture pada database lama, existing, atau produksi.

Keputusan wajib: makna 30 hari vs bulanan; TTL dan batas jawab; jendela check-in/jam tutup; ambang kebiasaan dan denominator ringkasan; idle/rate limit; cakupan alergi; hosting/versi. Pemilik menyebut sisa waktu 10 hari, sedangkan rancangan lama memuat 2 November 2026. Tanggal tenggat baru **belum dikonfirmasi**; jangan mengubahnya menjadi tanggal pasti atau memangkas lima fitur wajib.
