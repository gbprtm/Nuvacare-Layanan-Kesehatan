# Rencana agen: migrasi Laravel

Spesifikasi eksekusi, bukan papan status. Status hidup hanya di
[`status-tugas.md`](status-tugas.md). Urutan 10 hari dan gerbang ada di
[`to-do.md`](to-do.md); pemetaan PRD ada di [`peta-bagian.md`](peta-bagian.md).

## Kontrak eksekusi

- Migrasi disetujui pemilik: Laravel, Blade HTML, CSS biasa, JavaScript vanilla,
  PostgreSQL Neon, Eloquent, validasi Laravel, PHPUnit, Pint, Playwright Chrome.
  Tidak memakai starter kit, React, Tailwind, Drizzle, Zod, atau Pest.
- Penyimpangan teknis dirujuk ke `docs/keputusan/0002-migrasi-laravel.md`.
  PRD dan aturan produk tetap berlaku. Vault eksternal dan `docs/rancangan/**`
  read-only; arsip Next.js bukan sumber status aktif.
- Semua path di bawah **target yang direncanakan**, bukan klaim sudah ada.
  Saat rencana ditulis belum ada `composer.json`/`artisan`; PHP dan Composer
  tidak ditemukan di PATH. Tidak ada tugas implementasi yang telah dikerjakan.
- Setiap tugas boleh menulis hanya `paths`-nya, ditambah
  `docs/status-tugas.md` dan berkas `evidence` tugas itu sendiri. Perlu path
  tambahan: minta perluasan rencana, jangan menyunting diam-diam.
- Dependensi berurutan sengaja menyerialkan perubahan `routes/web.php`,
  `routes/console.php`, konfigurasi, model, migrasi, layout, dan runner bersama.
  Tidak ada janji paralel untuk path yang beririsan, termasuk status bersama.
- Ambil tugas `todo` yang semua `depends`-nya `done`, ubah menjadi `doing`,
  tambah uji, jalankan verifikasi, simpan bukti. Jika accept tidak tercapai,
  `blocked` dengan sebab dan kebutuhan. Jangan melunakkan uji.
- Tidak ada commit otomatis. Kolom commit diisi hanya bila pemilik mengizinkan
  commit; izin itu bukan prasyarat untuk mencatat hasil uji yang sebenarnya.
- Semua mutasi memakai Form Request/validator server, otorisasi server dan
  CSRF. Kepemilikan diperiksa pada query dan policy, bukan hanya menyembunyikan UI.
- Konfigurasi rahasia hanya lewat env Laravel dan `config/*`; jangan memakai
  `env()` di logika domain. Jangan menimpa atau menyalin rahasia `.env`.
- Tanggal domain melalui `app/Support/WibClock.php` (Asia/Jakarta), dapat
  dibekukan dalam uji. Label Indonesia, nama kode Inggris. Data demo fiktif,
  tanpa NIK/KK. Tidak ada rekomendasi medis otomatis.

### Verifikasi bersama G (setelah bootstrap)

Setiap tugas L01–L17 wajib menjalankan G, selain verify khusus tugas:

```sh
composer validate --strict
vendor/bin/pint --test
php artisan test
npm ci && npm run build
```

Perintah ini **belum tersedia sekarang**. L01 membuat manifest/lockfile yang
benar dan mengonfigurasi runner; jangan mengaku perintah lulus sebelum dijalankan.
Uji bernama di bawah wajib dibuat oleh tugas pemiliknya sebagai class PHPUnit,
bukan sekadar filter yang menemukan nol tes. Bukti mencatat jumlah tes/assertion,
exit code, versi runtime, lingkungan DB tersamarkan, dan keluaran perintah.

L01 mengonfigurasi `npx playwright test --project=chrome` dengan kanal Google
Chrome yang sudah terpasang sesuai ADR 0001; jangan mengunduh browser otomatis.
Jika Chrome tidak tersedia, catat prasyarat yang terhalang. Browser wajib dijalankan
untuk skenario yang sudah dibangun, bukan menuntut skenario masa depan.
PHPUnit integrasi, race, browser, dan beban memakai PostgreSQL terisolasi;
SQLite tidak sah sebagai bukti constraint atau konkurensi. Guard harus menolak
DB produksi sebelum setup uji/destructive command dijalankan.

## L01: Siapkan prasyarat dan fondasi Laravel

- **depends:** `[]`
- **input:** FR-07; PRD §4.2; ADR migrasi; arsip konfigurasi sebagai referensi saja.
- **paths:** `app/**`, `bootstrap/**`, `config/**`, `database/**`, `public/**`,
  `resources/**`, `routes/**`, `storage/**`, `tests/**`, `artisan`,
  `composer.json`, `composer.lock`, `package.json`, `package-lock.json`,
  `vite.config.js`, `phpunit.xml`, `pint.json`, `playwright.config.ts`,
  `.env.example`, `.gitignore`, `.github/workflows/laravel.yml`,
  `docs/migrasi/bootstrap.md`, `docs/migrasi/hosting.md`, `_bootstrap/laravel/**`.
- **accept:** Periksa `php --version`, `composer --version`, ekstensi PHP
  (termasuk `pdo_pgsql`) dan kompatibilitas Laravel stabil yang dipilih;
  pin versi/lockfile. Jika PHP/Composer belum tersedia saat dicoba, hentikan
  sebagai blocked, bukan mengganti stack atau membuat hasil scaffold palsu.
  Generate aplikasi bersih di staging `_bootstrap/laravel/` di repo ini,
  bukan langsung menimpa root yang tidak kosong. Inventaris hasil, lalu salin
  terkontrol hanya path yang disetujui; jangan menulis ke luar repo.
  Nonaktifkan hook scaffold/Composer yang otomatis membuat SQLite atau
  menjalankan migrasi/seed; L01 tidak menerapkan skema domain. Migrasi baru
  dijalankan L03 setelah strategi L02 diterima, hanya pada DB terisolasi.
  Jangan menimpa `docs/`, `.gitignore`, `AGENTS.md`, `.env`, `.agents/`, `data/`,
  `DESIGN.md`, atau `.git`; `.gitignore` hanya digabung setelah dibaca.
  Hapus bawaan SQLite, Tailwind, React/Pest dari target; Blade dengan Vite CSS/JS
  biasa. PHPUnit, Pint, Playwright Chrome, lockfile npm dan CI menjalankan G;
  guard DB uji aktif sebelum tes menyentuh data. Inventaris dan bersihkan cache
  Next/npm lama sebelum pemasangan dependency baru. Tes fondasi sebelum L03 tidak
  menjalankan migrasi/domain DB; gunakan session/cache sementara yang aman.
  Buat `FoundationTest` dan
  `tests/e2e/foundation.spec.ts`. Halaman publik dan aset bekerja.
  Hosting smoke awal: pilih runtime PHP yang mendukung HTTPS, Neon TLS,
  writable storage, scheduler dan proses deployment; buktikan URL publik,
  aset, health tanpa bocor rahasia. Batas biaya Rp0 harus dibuktikan, bukan
  menganggap Vercel lama mendukung Laravel. Login hosting dibuktikan di L04.
- **verify:** `php --version`; `composer --version`; `php -m`; G;
  `php artisan test --filter=FoundationTest`;
  `npx playwright test tests/e2e/foundation.spec.ts --project=chrome`.
- **evidence:** `docs/bukti/L01.md`.

## L02: Inventaris database dan latih pemulihan

- **depends:** `[L01]`
- **input:** FR-01/03/07/08/10/12; PRD §6; arsip `docs/database-schema.md`,
  migrasi Drizzle dan data lokal, tanpa menganggapnya sama dengan DB hidup.
- **paths:** `docs/migrasi/database.md`, `scripts/database/**`,
  `tests/Feature/DatabaseSafetyTest.php`.
- **accept:** Inventaris read-only tabel, kolom, UUID, enum, indeks, FK,
  reservasi, hash password, sesi dan jumlah record aktual tanpa menulis produksi.
  Bedakan data riil, demo dan belum diketahui. Tentukan pemetaan Eloquent:
  reuse/adapt tabel atau skema baru dengan transfer terverifikasi; catat nama
  tabel/kolom dan migration ledger agar default Laravel tidak menimpa tabel lama.
  Backup terenkripsi di luar Git, checksum dan lokasi aman; latihan restore
  ke branch Neon terisolasi dengan rekonsiliasi jumlah/FK dan batas rollback.
  Tetapkan koneksi direct untuk migrasi/backup, pooled bila cocok untuk runtime,
  TLS dan allowlist branch dev/test. Cabang salinan data sensitif tetap dibatasi;
  fixture demo harus fiktif. Dokumentasikan invalidasi sesi Next.js, kompatibilitas
  bcrypt `password_hash`, serta keputusan rehash/reset jika tak kompatibel.
  Tanpa kredensial/backup atau isolasi terverifikasi, tugas blocked.
- **verify:** G; `php artisan test --filter=DatabaseSafetyTest`;
  jalankan `pg_dump --version` dan `pg_restore --version`, lalu backup/restore
  dengan argumen literal dari inventaris (rekam perintah tersamarkan dan hasil,
  jangan menaruh URL/kata sandi di bukti). Uji guard menolak target produksi.
- **evidence:** `docs/bukti/L02.md`.

## L03: Bangun skema dan pemetaan Eloquent terisolasi

- **depends:** `[L02]`
- **input:** keputusan L02; FR-01–14; PRD §6 dan §4.4.
- **paths:** `database/migrations/**`, `database/factories/**`,
  `database/seeders/**`, `app/Models/**`, `config/database.php`,
  `config/auth.php`, `config/session.php`, `app/Support/WibClock.php`,
  `tests/Feature/SchemaMappingTest.php`, `tests/Unit/WibClockTest.php`,
  `docs/migrasi/database.md`.
- **accept:** Migrasi dapat dijalankan pada branch PostgreSQL dev/test yang
  diizinkan; tidak menjalankan `migrate:fresh` atau migrasi apa pun di produksi.
  Pemetaan tabel eksplisit, UUID dan FK terjaga, `password_hash` dipetakan ke
  auth Laravel, tabel sesi Laravel terpisah/tidak kompatibel dengan sesi lama.
  Factory/seed fiktif, admin individual dan password lewat konfigurasi aman.
  Bangun unique/partial index, lock atau constraint untuk janji aktif **dan**
  reservasi usulan agar keduanya tak bisa memiliki slot sama; rancang perubahan
  slot atomik. Unique nomor final per tanggal WIB, check-in, reminder, occurrence
  kontrol dan catatan obat harian. Audit append-only. Tidak memakai migrasi
  framework default tanpa memeriksa benturan tabel. Uji preserve data lama,
  rollback aman di branch isolasi, batas tengah malam WIB dan tahun kabisat.
- **verify:** G; `php artisan migrate --env=testing`;
  `php artisan db:seed --env=testing`;
  `php artisan test --filter=SchemaMappingTest`;
  `php artisan test --filter=WibClockTest`.
- **evidence:** `docs/bukti/L03.md`.

## L04: Autentikasi dan formulir Blade

- **depends:** `[L03]`
- **input:** FR-07; PRD §4.2/4.3/4.4; P1–P2, K1.
- **paths:** `app/Http/Controllers/Auth/**`, `app/Http/Requests/Auth/**`,
  `app/Http/Middleware/**`, `app/Policies/**`, `app/Models/User.php`,
  `bootstrap/app.php`, `config/auth.php`, `config/session.php`,
  `routes/web.php`, `resources/views/auth/**`,
  `resources/views/dashboards/**`,
  `tests/Feature/AuthenticationTest.php`, `tests/e2e/auth.spec.ts`,
  `docs/migrasi/hosting.md`.
- **accept:** Registrasi hanya pasien (role kiriman diabaikan/ditolak), password
  minimal 8 karakter, login/logout, rotasi ID sesi, hash legacy sesuai L02,
  idle **15 menit** benar-benar ditegakkan server, rate limit percobaan gagal,
  CSRF dan cookie HttpOnly/Secure pada HTTPS. Logout menginvalidasi sesi.
  Tamu ditolak, pasien tak dapat masuk admin; admin tak dapat melihat data
  pribadi yang dilarang. Buat dashboard minimal kedua role sebagai tujuan
  redirect login tanpa tautan fitur yang belum tersedia; L05 merapikan layout.
  Form menampilkan validasi Indonesia tanpa membocorkan password. Di hosting staging HTTPS, buktikan login, cookie bertahan antar
  request, logout dan akses terproteksi dengan PostgreSQL terisolasi.
  Target bukti parsial L01/L04 akhir hari ke-2, bukan menunggu seluruh rilis;
  bukti parsial tidak menjadikan L04 done.
- **verify:** G; `php artisan test --filter=AuthenticationTest`;
  `npx playwright test tests/e2e/auth.spec.ts --project=chrome` (lokal dan staging
  sesuai base URL aman yang direkam, tidak memakai akun produksi).
- **evidence:** `docs/bukti/L04.md`.

## L05: Layout bersama, CSS dan interaksi dasar

- **depends:** `[L04]`
- **input:** FR-07; PRD §4.2 dan §5; `DESIGN.md` bila ada; wireframe dan state/copy.
- **paths:** `resources/views/layouts/**`, `resources/views/components/**`,
  `resources/views/auth/**`, `resources/views/dashboards/**`,
  `resources/views/home.blade.php`, `routes/web.php`,
  `app/Http/Controllers/DashboardController.php`, `resources/css/**`, `resources/js/**`,
  `tests/Feature/LayoutTest.php`, `tests/e2e/layout.spec.ts`.
- **accept:** Layout pasien/admin Blade, navigasi hanya ke fitur yang sudah
  tersedia, satu aksi utama per layar. CSS/JS biasa, tanpa UI framework.
  Pertahankan arah desain yang disetujui, bukan menciptakan brand baru.
  Lebar 360 px tanpa overflow, label/fokus keyboard, teks dasar 16 px,
  target 44x44 px, kontras 4.5:1; pesan kosong, submit/loading dan galat.
  Form tetap bekerja tanpa JS; JS meningkatkan perilaku, bukan syarat otorisasi.
- **verify:** G; `php artisan test --filter=LayoutTest`;
  `npx playwright test tests/e2e/layout.spec.ts --project=chrome`.
- **evidence:** `docs/bukti/L05.md`.

## L06: Audit atomik dan log hanya baca

- **depends:** `[L05]`
- **input:** FR-10; PRD §4.3/4.4; K7.
- **paths:** `app/Services/Audit/**`, `app/Models/AuditLog.php`,
  `app/Policies/AuditLogPolicy.php`, `app/Http/Controllers/Audit/**`,
  `routes/web.php`, `resources/views/audit/**`,
  `tests/Feature/AuditLogTest.php`, `tests/e2e/audit.spec.ts`.
- **accept:** Service transaksi membungkus mutasi admin dan audit; sukses
  menghasilkan tepat satu entri (pelaku individual, waktu WIB, aksi, objek,
  sebelum/sesudah, alasan sesuai aturan), kegagalan audit membatalkan mutasi.
  Tidak ada route update/delete log, cegah modifikasi melalui model/aplikasi.
  Admin hanya baca; pasien hanya perubahan janjinya sendiri. Data rahasia
  tidak masuk payload log. Uji fixture mutasi dalam transaksi sebelum service
  dipakai fitur admin berikutnya; jangan membuka CRUD admin tanpa audit.
- **verify:** G; `php artisan test --filter=AuditLogTest`;
  `npx playwright test tests/e2e/audit.spec.ts --project=chrome`.
- **evidence:** `docs/bukti/L06.md`.

## L07: Profil dan katalog obat tanpa kehilangan data

- **depends:** `[L06]`
- **input:** FR-01; batas FR-12; PRD §4.4; P4; keputusan pemetaan L02.
- **paths:** `app/Services/Profile/**`, `app/Services/Medicines/**`,
  `app/Http/Controllers/Profile/**`, `app/Http/Requests/Profile/**`,
  `app/Policies/ProfilePolicy.php`, `app/Models/HealthProfile.php`,
  `app/Models/PatientMedicine.php`, `app/Models/MedicineCatalog.php`,
  `app/Console/Commands/ImportMedicineCatalog.php`,
  `routes/web.php`, `resources/views/profile/**`,
  `tests/Feature/ProfileTest.php`, `tests/e2e/profile.spec.ts`.
- **accept:** CRUD kondisi/alergi/obat laporan pasien, hapus dengan konfirmasi,
  ownership/IDOR; data legacy dan relasi pemilik tetap utuh. Tanpa NIK/KK.
  Import katalog Fornas mempertahankan sumber, tanggal pengambilan dan batas
  cakupan snapshot; jangan menyebut katalog parsial lengkap. Obat laporan
  pasien terpisah dari resep klinik L12, bukan cara pasien mengedit resep.
  Admin tidak dapat membaca profil penuh; ringkasan alergi hanya melalui L11
  saat check-in dengan pencatatan akses. Hapus profil tidak merusak fitur lain.
- **verify:** G; `php artisan test --filter=ProfileTest`;
  `npx playwright test tests/e2e/profile.spec.ts --project=chrome`.
- **evidence:** `docs/bukti/L07.md`.

## L08: Dokter, slot dan janji anti-bentrok beserta UI

- **depends:** `[L07]`
- **input:** FR-03/08/10; PRD §3.4, §4.3; P6–P8, K2–K4.
- **paths:** `app/Services/Appointments/**`, `app/Http/Controllers/Appointments/**`,
  `app/Http/Requests/Appointments/**`, `app/Policies/AppointmentPolicy.php`,
  `app/Models/Doctor.php`, `app/Models/PracticeSlot.php`,
  `app/Models/Appointment.php`, `routes/web.php`,
  `resources/views/appointments/**`, `resources/views/doctors/**`,
  `resources/views/slots/**`, `tests/Feature/AppointmentTest.php`,
  `tests/e2e/appointments.spec.ts`.
- **accept:** Admin CRUD dokter/spesialis/slot dengan audit, pasien memilih
  slot dan membuat janji lewat UI penuh. Nomor estimasi dan perkiraan jam
  berlabel perkiraan, bukan nomor panggilan. Tepat satu sukses pada dua koneksi
  PostgreSQL serentak merebut slot; pasien/admin saling bersaing juga konsisten.
  Konflik menghasilkan pesan Indonesia, rollback tidak meninggalkan data
  setengah jadi. Proteksi IDOR, validasi slot lampau/overlap dan larangan
  menghapus slot berjanji tanpa alur aman; state kosong/galat tersedia.
- **verify:** G; `php artisan test --filter=AppointmentTest` (termasuk race
  nyata, bukan dua request berurutan dalam satu transaksi tes);
  `npx playwright test tests/e2e/appointments.spec.ts --project=chrome`.
- **evidence:** `docs/bukti/L08.md`.

## L09: Usulan perubahan, notifikasi dan pembatalan

- **depends:** `[L08]`
- **input:** FR-08/09/10; PRD §1.4, §3.4, §4.3, pertanyaan §9 #11/15/17; P13.
- **paths:** `app/Services/Appointments/**`, `app/Services/Notifications/**`,
  `app/Http/Controllers/Rescheduling/**`, `app/Http/Requests/Rescheduling/**`,
  `app/Models/ChangeProposal.php`, `app/Models/InAppNotification.php`,
  `app/Console/Commands/ExpireProposals.php`, `routes/web.php`,
  `routes/console.php`, `resources/views/rescheduling/**`,
  `resources/views/notifications/**`, `tests/Feature/ReschedulingTest.php`,
  `tests/e2e/rescheduling.spec.ts`.
- **accept:** Alasan admin wajib, slot lama tetap aktif selama menunggu,
  reservasi slot baru memakai constraint lintas janji/reservasi L03. Setuju,
  tolak, pilih slot lain dan balasan ganda semuanya atomik; race dengan booking
  biasa teruji. Expiry melepaskan reservasi, mempertahankan janji lama dan
  memberi tahu admin; pembatalan beralasan melepas slot dan memberi opsi
  penjadwalan ulang pasien. Notifikasi in-app sekali per event, status belum
  dibaca/riwayat respons, alasan dan slot lama/baru; tanggapan maksimal tiga
  ketukan. Scheduler dan pemrosesan saat membuka aplikasi idempoten.
  TTL, cutoff respons, usulan dekat jadwal dan mitigasi in-app di §9 masih
  perlu keputusan eksplisit pemilik; catat keputusan di bukti. Jangan mengunci
  asumsi 12 jam/24 jam sebagai fakta; accept terkait blocked bila belum diputus.
- **verify:** G; `php artisan test --filter=ReschedulingTest`;
  `npx playwright test tests/e2e/rescheduling.spec.ts --project=chrome`.
- **evidence:** `docs/bukti/L09.md`.

## L10: Kontrol berulang, pengingat dan agenda/bulan

- **depends:** `[L09]`
- **input:** FR-02/10; PRD §4.1/4.3, §5; P5.
- **paths:** `app/Services/Controls/**`, `app/Http/Controllers/Controls/**`,
  `app/Http/Requests/Controls/**`, `app/Models/ControlRule.php`,
  `app/Models/ControlOccurrence.php`, `app/Console/Commands/ProcessControls.php`,
  `routes/web.php`, `routes/console.php`, `resources/views/controls/**`,
  `tests/Feature/RecurringControlTest.php`, `tests/e2e/controls.spec.ts`.
- **accept:** Hanya admin mencatat anjuran dokter dengan audit. Implementasi
  interval 7/14/30 dan anchor asli, 31 Jan ke Feb kabisat/nonkabisat lalu pulih
  ke 31, bukan drift dari tanggal hasil clamp. Perbedaan istilah “30 hari”
  dan contoh kalender bulanan PRD harus diputus pemilik dan diabadikan sebagai
  uji sebelum penerimaan, bukan ditafsirkan diam-diam. Reminder H-3 satu kali,
  lewat tenggat menjadi terlewat tanpa reminder baru dan jadwal pengganti
  terbentuk tanpa duplikat. Agenda default dan toggle bulan ramah 360 px.
  Service completion idempoten tersedia untuk dipanggil L11; pengulangan
  scheduler/request bersamaan tidak membuat occurrence/reminder ganda.
- **verify:** G; `php artisan test --filter=RecurringControlTest`;
  `npx playwright test tests/e2e/controls.spec.ts --project=chrome`.
- **evidence:** `docs/bukti/L10.md`.

## L11: Check-in, antrian dan tutup hari

- **depends:** `[L10]`
- **input:** FR-04/10 dan hook FR-02; PRD §3.5, §4.3/4.4; P9, K5.
- **paths:** `app/Services/Queue/**`, `app/Http/Controllers/Queue/**`,
  `app/Http/Requests/Queue/**`, `app/Models/QueueEntry.php`,
  `app/Models/ClinicDay.php`, `app/Services/Controls/**`,
  `routes/web.php`, `resources/views/queue/**`,
  `tests/Feature/QueueTest.php`, `tests/e2e/queue.spec.ts`.
- **accept:** Check-in milik sendiri sekali, nomor final unik per hari WIB
  diterbitkan hanya saat check-in, estimasi tidak menjadi urutan panggilan.
  Uji check-in serentak, tengah malam, hari tertutup dan tidak hadir.
  Hanya admin mengubah menunggu → diperiksa → selesai; transisi ilegal tak
  mengubah data. Koreksi memerlukan alasan dan audit. Tutup hari idempoten
  menandai yang belum check-in tidak hadir; completion memanggil service L10
  tepat sekali secara efek bisnis walau retry/koreksi/tutup hari berulang.
  Audit dan mutasi satu transaksi. UI pasien menampilkan posisi/status,
  UI admin mengelola antrian/tutup hari. Ringkasan alergi admin hanya pada
  konteks check-in, setiap pembukaan tercatat; kebiasaan tetap tidak terbaca.
- **verify:** G; `php artisan test --filter=QueueTest`;
  `npx playwright test tests/e2e/queue.spec.ts --project=chrome`.
- **evidence:** `docs/bukti/L11.md`.

## L12: Resep klinik dan kepatuhan obat

- **depends:** `[L11]`
- **input:** FR-12/10; PRD §4.3, §2.3; P15, K6; pemisahan data L07.
- **paths:** `app/Services/Prescriptions/**`,
  `app/Http/Controllers/Prescriptions/**`, `app/Http/Requests/Prescriptions/**`,
  `app/Policies/PrescriptionPolicy.php`, `app/Models/Prescription.php`,
  `app/Models/Medication.php`, `app/Models/MedicationAdherence.php`, `routes/web.php`,
  `resources/views/prescriptions/**`, `tests/Feature/PrescriptionTest.php`,
  `tests/e2e/prescriptions.spec.ts`.
- **accept:** Admin mencatat resep dokter dengan audit: obat, dosis, aturan,
  periode, sumber dan pencatat. Pasien tidak bisa mengubah resep, hanya status
  sudah/belum minum miliknya per hari WIB, satu record per obat/tanggal;
  perubahan status terakhir menang sesuai aturan transaksi. Ringkasan 7 hari
  benar; UI memiliki state tanpa resep. Label “catatan resep, bukan saran medis”
  dan rujukan Fornas beserta sumber/tanggal, tanpa pemetaan kondisi ke obat.
  Jangan menyatukan resep dengan obat laporan sendiri atau membuka ringkasan
  kepatuhan pasien kepada admin tanpa keputusan wewenang produk.
- **verify:** G; `php artisan test --filter=PrescriptionTest`;
  `npx playwright test tests/e2e/prescriptions.spec.ts --project=chrome`.
- **evidence:** `docs/bukti/L12.md`.

## L13: Kebiasaan harian dan ringkasan wajib

- **depends:** `[L12]`
- **input:** FR-05 (FB-5); PRD §4.3/4.4 dan §9 #4; P10–P11.
- **paths:** `app/Services/Habits/**`, `app/Http/Controllers/Habits/**`,
  `app/Http/Requests/Habits/**`, `app/Policies/HabitPolicy.php`,
  `app/Models/HabitEntry.php`, `config/habits.php`, `routes/web.php`,
  `resources/views/habits/**`, `resources/js/habits.js`,
  `tests/Feature/HabitTest.php`, `tests/e2e/habits.spec.ts`.
- **accept:** Hidrasi/tidur/aktivitas per tanggal WIB dan ringkasan/runtutan
  hari tersedia lewat UI. Tolak tidur 0, 24 dan bukan angka, tanggal bolong
  tidak merusak streak; sesudah simpan ringkasan langsung terbaru (redirect
  server sah, tidak meminta pengguna reload manual). Ownership dan admin
  ditolak untuk catatan maupun ringkasan. Ambang resmi hidrasi/tidur/aktivitas,
  satuan dan aturan penilaian perlu persetujuan pemilik dengan URL/tanggal
  sumber; uji bawah/tepat/atas setiap ambang. Tanpa keputusan itu accept
  ringkasan **blocked**, jangan mengarang angka. FB-5 satu dari lima fitur
  wajib, tidak boleh dipindah ke opsional atau dihapus demi jadwal.
- **verify:** G; `php artisan test --filter=HabitTest`;
  `npx playwright test tests/e2e/habits.spec.ts --project=chrome`.
- **evidence:** `docs/bukti/L13.md`.

## L14: Timeline tunggal milik pasien

- **depends:** `[L13]`
- **input:** FR-11/13; PRD §4.3; P14.
- **paths:** `app/Services/Timeline/**`, `app/Http/Controllers/Timeline/**`,
  `routes/web.php`, `resources/views/timeline/**`,
  `tests/Feature/TimelineTest.php`, `tests/e2e/timeline.spec.ts`.
- **accept:** Satu timeline terbaru dahulu menggabungkan janji, perubahan,
  check-in, kunjungan, resep dan kontrol berikutnya, dengan tautan detail
  berotorisasi. Tidak ada record pasien lain atau join yang membocorkan data;
  urutan stabil/paginasi tidak menggandakan event, waktu WIB konsisten.
  Selesai kunjungan menampilkan jadwal kontrol yang dibentuk L10/L11;
  state kosong mengarah membuat janji pertama. FR-11 bukan halaman kedua.
- **verify:** G; `php artisan test --filter=TimelineTest`;
  `npx playwright test tests/e2e/timeline.spec.ts --project=chrome`.
- **evidence:** `docs/bukti/L14.md`.

## L15: Uji browser lengkap dan keamanan lintas fitur

- **depends:** `[L14]`
- **input:** FR-01–05/07–13; PRD §3.3, §4.2/4.4, §7.4.
- **paths:** `tests/Feature/SecurityRegressionTest.php`,
  `tests/Feature/SystemWorkflowTest.php`, `tests/e2e/**`,
  `playwright.config.ts`, `.github/workflows/laravel.yml`,
  `docs/migrasi/matriks-uji.md`.
- **accept:** Skenario 10 langkah hipertensi pasien+admin melalui UI selesai,
  bukan hanya request API. Matriks accept ke tes mencakup FB-1–5, resep,
  timeline, usulan semua respons/expiry, audit, kontrol dan antrian.
  Tamu, IDOR semua objek, role, CSRF nyata (bukan middleware yang dimatikan
  oleh runner), session fixation/idle/logout/rate limit, validasi, XSS dan
  query parameter diuji. Chrome desktop dan 360 px, keyboard, kontras,
  empty/error/loading, tidak ada error console; bukti klik tiap aksi inti.
  CI menolak nol tes dan memakai PostgreSQL isolasi; tidak ada skip untuk
  menyamarkan accept gagal. Chrome otomatis tidak membuktikan kompatibilitas
  Edge/Firefox, pemeriksaan manualnya dicatat di L16.
- **verify:** G; `php artisan test --filter=SecurityRegressionTest`;
  `php artisan test --filter=SystemWorkflowTest`;
  `npx playwright test --project=chrome`.
- **evidence:** `docs/bukti/L15.md`.

## L16: Beban, UAT dan bukti rilis produksi

- **depends:** `[L15]`
- **input:** PRD §2.3, §4.2, §7.4; semua FR wajib; strategi backup L02.
- **paths:** `tests/Feature/ReleaseReadinessTest.php`, `tests/load/**`,
  `tests/e2e/release.spec.ts`, `scripts/release/**`,
  `docs/migrasi/hosting.md`, `docs/migrasi/runbook-rilis.md`,
  `docs/migrasi/uat.md`, `docs/migrasi/matriks-uji.md`.
- **accept:** Ukur 50 dan 100 request bersamaan pada janji/antrian di lingkungan
  PostgreSQL representatif terisolasi: p95 <2 detik, tepat satu pemenang slot,
  nomor final unik dan audit atomik; tulis error rate, runtime dan cold/warm
  Neon, bukan klaim performa tanpa hasil. UAT minimal satu penguji luar untuk
  pasien dan satu admin dengan hasil nyata, jumlah layar ≤5, respons usulan
  ≤3 ketukan, waktu buat janji dan SUS dicatat terhadap target PRD sementara.
  Periksa manual Chrome/Edge/Firefox dan lebar 360 px. Semua blocker L01–L15
  selesai; kriteria belum disepakati tidak dianggap lulus.
  Runbook memuat backup baru, rehearsal restore, migrasi non-destruktif yang
  ditinjau terhadap DB lama, rekonsiliasi data/hash, invalidasi sesi lama,
  scheduler/expiry/reminder, HTTPS/cookie/cache/config/storage dan rollback
  kode+data. Baru setelah izin cutover pemilik jalankan perubahan produksi;
  L02/L03 tidak memberi izin itu. Bukti URL publik dari perangkat lain, login
  kedua role, aset dan smoke tanpa data sensitif. Bukti biaya/retensi hosting
  dan Neon terverifikasi; jangan menjanjikan Rp0 tanpa konfirmasi penyedia.
- **verify:** G; `php artisan test --filter=ReleaseReadinessTest`;
  `node tests/load/appointments.mjs`; `node tests/load/queue.mjs`;
  `npx playwright test --project=chrome` pada staging; smoke
  `tests/e2e/release.spec.ts` pada URL rilis dengan akun fiktif yang diizinkan.
  Script load dibangun tugas ini, menolak target produksi secara default.
- **evidence:** `docs/bukti/L16.md`.

## L17: Opsional, konten resmi dan log akun

- **depends:** `[L16]`
- **input:** FR-06/14; PRD §4.3, §9 #5 dan ketentuan tinjauan konten.
- **paths:** `app/Services/Content/**`, `app/Services/AccountActivity/**`,
  `app/Http/Controllers/Content/**`, `app/Http/Requests/Content/**`,
  `app/Http/Controllers/AccountActivity/**`,
  `app/Models/VerifiedContent.php`, `app/Models/AccountActivity.php`,
  `app/Listeners/AccountActivity/**`, `app/Providers/AppServiceProvider.php`,
  `routes/web.php`, `resources/views/content/**`,
  `resources/views/account-activity/**`,
  `tests/Feature/OptionalFeaturesTest.php`, `tests/e2e/optional.spec.ts`.
- **accept:** Tidak menghalangi rilis L16. Dikerjakan hanya dengan persetujuan
  rilis terpisah pemilik, bukan otomatis karena tenggat. Konten Kemenkes/WHO
  sesuai kondisi profil, URL/tanggal pengambilan dan tinjauan tenaga kesehatan
  terbukti sebelum tayang; tanpa tinjauan jangan ditampilkan. Log aktivitas
  akun append-only, hanya pemilik, event tak ganda dan tanpa rahasia; tidak ada
  update/delete. Jangan menyamakan log akun opsional dengan audit admin wajib.
  Jalankan regresi inti sebelum rilis tambahan, tidak mengubah vault.
- **verify:** G; `php artisan test --filter=OptionalFeaturesTest`;
  `npx playwright test --project=chrome` (termasuk `tests/e2e/optional.spec.ts`).
- **evidence:** `docs/bukti/L17.md`.
