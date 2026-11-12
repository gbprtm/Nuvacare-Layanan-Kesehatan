# Implementation Plan: Revisi Peran Dokter & Admin (Grace Period 15 Menit, Penyelesaian Eksklusif Dokter, Kontrol Opsional, Slot Tambahan, dan Privasi Pasien)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan revisi alur operasional klinik Nuvicare: (1) Jendela pembatalan cepat 15 menit pasca janji terbuat bagi dokter dan pasien, (2) Hak eksklusif dokter menyelesaikan janji temu dengan catatan pemeriksaan serta jadwal kontrol opsional, (3) Pengajuan slot tambahan oleh dokter dengan persetujuan admin, (4) Pembatasan pembatalan admin hanya atas dasar pengajuan dokter/pasien serta pengalihan ke dokter lain saat menolak pengajuan, dan (5) Proteksi privasi ketat data pasien di dashboard monitoring admin.

**Architecture:** Laravel JSON API dengan Sanctum surface abilities (`surface:pasien` dan `surface:staf`), migrasi skema tabel pengajuan slot `doctor_slot_requests`, penambahan endpoint dokter menyelesaikan janji dan pengajuan slot, update log append-only `status_change_logs`, serta pembaruan antarmuka murni HTML/JS di `surfaces/pasien/` dan `surfaces/staf/`.

**Tech Stack:** PHP 8.2+, Laravel 11, PostgreSQL Neon, Sanctum, Tailwind CSS, Vanilla JavaScript (`fetch()`).

**Spec:** `docs/RANCANGANFINAL.md`, `docs/catatan-implementasi.md`.

## Global Constraints
- Token Sanctum dipisahkan dengan ability `surface:pasien` dan `surface:staf`.
- Endpoint dokter (`/api/dokter/*`) mewajibkan `FEATURE_DOCTOR_PORTAL=true`, role `dokter`, dan `doctors.user_id = auth()->id()`. Dilarang mengambil `doctor_id` dari input body/query.
- Tanpa *hard delete* pada seluruh tabel transaksi dan pengajuan. Setiap mutasi status wajib menulis satu baris append-only pada `status_change_logs`.
- Frontend murni HTML/CSS/JS tanpa Blade, tanpa framework SPA, dan tanpa build step. Mengikuti aturan *Anti-Slop Delivery Gate*.

## Review Focus
1. **Grace Period 15 Menit:** Pastikan pembatalan cepat oleh dokter hanya diterima jika `now() <= appointment.created_at + 15 menit`. Jika lebih dari 15 menit, dokter diarahkan ke alur pengajuan pembatalan resmi.
2. **Eksklusivitas Status Selesai:** Endpoint admin lama `PATCH /api/admin/janji-temu/{id}` dilarang mengubah status menjadi `selesai` (harus return 403/422). Hanya dokter via `POST /api/dokter/janji-temu/{id}/selesai` yang dapat menyelesaikan pemeriksaan.
3. **Privasi Pasien di Admin:** Respons `GET /api/admin/janji-temu` tidak boleh memuat nomor HP pasien asli, hanya memuat ID Rekam Medis / Inisial Pasien dan waktu janji.
4. **Pengalihan Dokter Saat Tolak Pengajuan:** Saat admin menolak pengajuan pembatalan dokter (`POST /api/admin/pengajuan-pembatalan/{id}/tolak`), janji temu dialihkan ke dokter lain (`substitute_doctor_id`) di poli yang sama, bukan dibiarkan menggantung pada dokter asal.
5. **Kunjungan Kontrol Opsional:** Jika dokter mengisi `follow_up_date` saat menyelesaikan janji, baris janji baru berjenis `kontrol_rutin` otomatis dibuat; jika tidak diisi, janji tetap selesai tanpa membuat jadwal baru.

---

### Task 1: Migrasi Skema Database `doctor_slot_requests`
**Files:**
- Create: `database/migrations/2026_11_12_000001_create_doctor_slot_requests_table.php`
- Modify: `app/Models/Doctor.php`
- Create: `app/Models/DoctorSlotRequest.php`
- Test: `tests/Feature/DoctorSlotRequestMigrationTest.php`

- [ ] **Step 1:** Buat file migrasi `create_doctor_slot_requests_table.php` dengan kolom:
  - `id` (bigIncrements)
  - `doctor_id` (foreign key ke `doctors.id`, cascade on delete)
  - `schedule_date` (date)
  - `start_time` (time)
  - `end_time` (time)
  - `quota` (integer)
  - `reason` (string / text)
  - `status` (enum: `diajukan`, `disetujui`, `ditolak`, default: `diajukan`)
  - `admin_note` (text, nullable)
  - `created_at`, `updated_at` (timestamps)
- [ ] **Step 2:** Buat model `DoctorSlotRequest` dengan `$fillable` lengkap dan relasi `belongsTo(Doctor::class)`.
- [ ] **Step 3:** Tambahkan relasi `hasMany(DoctorSlotRequest::class)` di `app/Models/Doctor.php`.
- [ ] **Step 4:** Tulis feature test `DoctorSlotRequestMigrationTest.php` untuk memvalidasi skema tabel dan relasi model.
- [ ] **Step 5:** Jalankan `php artisan test --filter=DoctorSlotRequestMigrationTest` dan pastikan lulus.

---

### Task 2: Logika Jendela Waktu 15 Menit Pembatalan Cepat & Pengguguran Otomatis
**Files:**
- Modify: `app/Http/Controllers/Api/Doctor/CancellationRequestController.php`
- Modify: `app/Http/Controllers/Api/Patient/AppointmentController.php`
- Test: `tests/Feature/FifteenMinuteCancellationGracePeriodTest.php`

- [ ] **Step 1:** Tambahkan endpoint pembatalan cepat dokter `POST /api/dokter/janji-temu/{id}/batal-cepat`:
  - Periksa kepemilikan janji temu (`doctor_id`).
  - Validasi bahwa waktu sekarang `<= appointment.created_at->addMinutes(15)`. Jika lewat, kembalikan 422: *"Jendela pembatalan cepat (15 menit pertama) telah berakhir. Silakan gunakan pengajuan pembatalan resmi."*
  - Ubah status janji menjadi `dibatalkan`, catat log `status_change_logs`, dan teruskan notifikasi ke Admin serta Pasien.
- [ ] **Step 2:** Pada pembatalan mandiri oleh pasien di `AppointmentController`, jika janji memiliki `cancellation_requests` berstatus `diajukan`:
  - Ubah status pengajuan menjadi `gugur`.
  - Catat log perubahan status ke `status_change_logs`.
  - Teruskan notifikasi langsung ke dokter terkait tanpa menunggu tindakan admin.
- [ ] **Step 3:** Tulis feature test `FifteenMinuteCancellationGracePeriodTest.php`:
  - Dokter membatalkan pada menit ke-10 -> Berhasil (200).
  - Dokter membatalkan pada menit ke-16 -> Gagal (422).
  - Pasien membatalkan janji -> Pengajuan dokter berubah menjadi `gugur` seketika.
- [ ] **Step 4:** Jalankan `php artisan test --filter=FifteenMinuteCancellationGracePeriodTest` dan pastikan lulus.

---

### Task 3: Hak Eksklusif Dokter Menyelesaikan Pemeriksaan & Kontrol Opsional
**Files:**
- Modify: `routes/api.php`
- Modify: `app/Http/Controllers/Api/Doctor/DoctorAppointmentController.php`
- Modify: `app/Http/Controllers/Api/Admin/AppointmentManagementController.php`
- Test: `tests/Feature/DoctorExclusiveCompleteTest.php`

- [ ] **Step 1:** Daftarkan rute `POST /api/dokter/janji-temu/{id}/selesai` di `routes/api.php` di bawah grup token `surface:staf` dan role `dokter`.
- [ ] **Step 2:** Implementasikan method `selesai` pada `DoctorAppointmentController`:
  - Validasi status janji harus `terjadwal`.
  - Menerima `doctor_notes` (wajib, string, min 5 karakter).
  - Menerima `follow_up_date` (opsional, date, format Y-m-d) dan `follow_up_doctor_id` (opsional, default dokter saat ini).
  - Update janji temu: `status = 'selesai'`, `doctor_notes = input`.
  - Jika `follow_up_date` ada: buat baris janji baru dengan `type = 'kontrol_rutin'`, `status = 'terjadwal'`, `user_id = appointment.user_id`.
  - Tulis log append-only ke `status_change_logs`.
- [ ] **Step 3:** Kunci endpoint admin `PATCH /api/admin/janji-temu/{id}`:
  - Tolak percobaan mengubah status menjadi `selesai` oleh admin dengan HTTP 403/422 (*"Status selesai hanya dapat diubah oleh dokter pemeriksa"*).
  - Tolak pembatalan sepihak tanpa adanya pengajuan pembatalan dokter atau alasan gugur.
- [ ] **Step 4:** Tulis feature test `DoctorExclusiveCompleteTest.php` untuk menguji penyelesaian oleh dokter, pembuatan kontrol opsional, dan penolakan jika admin mencoba menyelesaikan janji.
- [ ] **Step 5:** Jalankan `php artisan test --filter=DoctorExclusiveCompleteTest` dan pastikan lulus.

---

### Task 4: Alur Pengajuan Slot Tambahan Dokter & Persetujuan Admin
**Files:**
- Modify: `routes/api.php`
- Create: `app/Http/Controllers/Api/Doctor/DoctorSlotRequestController.php`
- Create: `app/Http/Controllers/Api/Admin/DoctorSlotApprovalController.php`
- Test: `tests/Feature/DoctorSlotRequestWorkflowTest.php`

- [ ] **Step 1:** Daftarkan endpoint pengajuan slot tambahan:
  - `POST /api/dokter/slot-tambahan`: Dokter mengajukan slot (tanggal, jam mulai, jam selesai, kuota, alasan).
  - `GET /api/dokter/slot-tambahan`: Dokter memantau status pengajuan slot miliknya.
  - `GET /api/admin/slot-tambahan`: Admin melihat antrean pengajuan slot dokter.
  - `POST /api/admin/slot-tambahan/{id}/setujui`: Admin menyetujui pengajuan slot.
  - `POST /api/admin/slot-tambahan/{id}/tolak`: Admin menolak pengajuan slot dengan catatan.
- [ ] **Step 2:** Pada `setujui`:
  - Ubah status pengajuan menjadi `disetujui`.
  - Masukkan/sinkronkan baris baru ke tabel master jadwal `doctor_schedules` sehingga slot langsung terbuka untuk booking pasien.
- [ ] **Step 3:** Tulis feature test `DoctorSlotRequestWorkflowTest.php` untuk menguji alur pengajuan, penolakan, dan persetujuan hingga slot muncul di pencarian publik.
- [ ] **Step 4:** Jalankan `php artisan test --filter=DoctorSlotRequestWorkflowTest` dan pastikan lulus.

---

### Task 5: Penolakan Pembatalan Dokter dengan Pengalihan ke Dokter Lain & Privasi Admin
**Files:**
- Modify: `app/Http/Controllers/Api/Admin/CancellationManagementController.php`
- Modify: `app/Http/Controllers/Api/Admin/AppointmentManagementController.php`
- Test: `tests/Feature/AdminPrivacyAndReassignmentTest.php`

- [ ] **Step 1:** Pada method penolakan pengajuan pembatalan dokter `POST /api/admin/pengajuan-pembatalan/{id}/tolak`:
  - Validasi wajib input `substitute_doctor_id` (dokter pengganti yang aktif di poliklinik yang sama).
  - Perbarui janji temu pasien: ubah `doctor_id` menjadi `substitute_doctor_id`.
  - Ubah status pengajuan menjadi `ditolak` (dengan catatan pengalihan dokter).
  - Catat perubahan dokter di `status_change_logs`.
  - Kirim notifikasi WA ke Pasien menginformasikan perubahan dokter pengganti.
- [ ] **Step 2:** Pada `GET /api/admin/janji-temu`:
  - Sembunyikan nomor telepon pasien (`phone_number` dihapus dari JSON respons admin).
  - Tampilkan hanya ID Pasien/Rekam Medis dan nama inisial (misal: "Tn. Budi S.") untuk menjaga privasi pasien di meja admin.
- [ ] **Step 3:** Tulis feature test `AdminPrivacyAndReassignmentTest.php`.
- [ ] **Step 4:** Jalankan `php artisan test --filter=AdminPrivacyAndReassignmentTest` dan pastikan lulus.

---

### Task 6: Integrasi Antarmuka Frontend (HTML/JS) & Verifikasi Kualitas
**Files:**
- Modify: `surfaces/staf/dokter/janji-temu.html`
- Modify: `surfaces/staf/admin/kelola-janji.html`
- Modify: `surfaces/pasien/janji-temu.html`
- Modify: `docs/catatan-implementasi.md`

- [ ] **Step 1:** Di portal dokter (`surfaces/staf/dokter/janji-temu.html`):
  - Tambahkan tombol **"Batalkan Cepat (15 Menit)"** pada janji baru (`created_at <= 15m`).
  - Tambahkan tombol **"Selesai & Catatan"** dengan modal form: `Catatan Dokter` (textarea) dan checkbox `Perlu Jadwal Kontrol?` (dengan input tanggal opsional).
  - Tambahkan form modal **"Ajukan Slot Praktik Tambahan"**.
- [ ] **Step 2:** Di portal admin (`surfaces/staf/admin/kelola-janji.html`):
  - Hilangkan tombol pembatalan sepihak pada janji aktif.
  - Tambahkan panel/modal **"Pengajuan Slot Tambahan Dokter"** (Setujui / Tolak).
  - Pada penolakan pembatalan dokter, sediakan dropdown pilihan **Dokter Pengganti**.
  - Pastikan kolom nomor telepon pasien tersembunyi.
- [ ] **Step 3:** Jalankan `vendor/bin/pint --test` dan `php artisan test` untuk memastikan seluruh test suite hijau.
- [ ] **Step 4:** Verifikasi tampilan UI dengan *Anti-Slop Delivery Gate* (kontras AA, tombol target minimal 44x44px).
- [ ] **Step 5:** Catat pembaruan arsitektural ini pada `docs/catatan-implementasi.md`.
