# Kontrak route web target Laravel

Tanggal: 2 November 2026. **Kontrak rencana, belum diimplementasikan, belum diuji HTTP/browser/database live.** Nama route di sini belum terdaftar di aplikasi. Tidak ada scaffold Laravel pada sesi dokumentasi ini.

Kontrak lama JSON `/api` adalah arsip: `_arsip/nextjs-2026-11-02/docs/api-contract.md`. Kebutuhan produk: [PRD](rancangan/prd-v0.3.md) §3.4–3.5 dan §4.1–4.4. Implementasi mengikuti [arsitektur target](panduan-arsitektur.md) dan [pemetaan data](database-schema.md), bukan menyalin handler Next.

## 1. Aturan lintas route

### HTML sebagai kontrak utama

- GET sukses: HTML **200**. GET tidak memutasi status dibaca, logout, check-in atau data domain.
- Mutasi sukses: **302** ke GET tujuan pada tabel (POST/Redirect/GET), dengan flash Indonesia. Untuk PATCH/DELETE, form browser mengirim POST + `_method=PATCH`/`DELETE`. Tidak memerlukan fetch agar alur inti berjalan.
- Semua mutasi berada di kelompok middleware web/session/CSRF, termasuk masuk, daftar, dan keluar. Form berisi `_token`; fetch same-origin memakai token CSRF yang benar. Token tidak valid: halaman **419**, bukan melanjutkan mutasi.
- Laravel Form Requests memvalidasi di server, termasuk array bersarang, UUID, tanggal, enum, dan relasi. Reject field tak dikenal, bukan sekadar mengabaikannya dengan `validated()`. `_token` dan `_method` adalah field transport yang diizinkan, bukan atribut domain. Jangan mass-assign `$request->all()`.
- Validasi gagal: **302** kembali ke form GET dengan error bag per field serta old input yang aman. Jangan flash `password`, `password_confirmation`, token, atau snapshot kesehatan yang tidak dibutuhkan form tersebut. Password tidak dicetak dalam HTML/log/bukti.
- Konflik domain: **302** ke GET tujuan/kembali dengan flash konflik yang jelas dan **tanpa mutasi parsial**. Galat server/audit gagal: halaman **500** generik, rollback, tanpa detail SQL/secret.

### Negosiasi JSON opsional

Untuk peningkatan yang benar-benar dibangun dan diuji, request `Accept: application/json` dapat memperoleh 200 (baca/update), 201 (create), 401 (tamu), 403/404, 409 (konflik), 422 (validasi; bentuk Laravel `message` + `errors`) atau 429. Penghapusan opsional JSON: 204 tanpa body. Dukungan JSON per route harus dicatat saat implementasi; tabel di bawah menjamin **HTML**, bukan janji semua route otomatis menjadi JSON API. Tidak ada kewajiban envelope global `{data,error}`, prefix `/api`, SPA, atau bearer token.

### Sesi, role dan kepemilikan

| Kondisi | HTML | JSON bila didukung |
|---|---|---|
| Tamu ke halaman/mutasi inti dengan CSRF valid | 302 ke `/masuk`; intended URL hanya same-origin yang diizinkan | 401 |
| Role salah, termasuk admin membuka kebiasaan/kepatuhan pasien | 403, tanpa data | 403 |
| Resource milik pasien lain/tidak ada | **404** konsisten pada baca maupun mutasi | 404 |
| Input invalid/field terlarang | 302 + errors + old input aman | 422 |
| Status/slot/expiry konflik | 302 + flash, data domain tidak berubah | 409 + kode konflik |
| Rate limit | 429 dengan pesan coba lagi dan waktu tunggu | 429 |

Cookie sesi HttpOnly, Secure pada produksi, SameSite untuk same-origin. Login meregenerasi session ID; POST logout menginvalidasi sesi di server dan meregenerasi CSRF. Idle timeout harus menolak sesi lama di server, bukan hanya menyembunyikan halaman atau menghapus cookie. Limit login memakai store persisten/bersama; target idle 15 menit mengikuti rencana L04; angka batas percobaan/durasinya dibakukan L04.

Identitas pemilik berasal dari sesi atau objek route yang diotorisasi. Pasien tidak pernah mengirim `user_id`, `patient_id`, `role`, `created_by`, timestamps, atau snapshot audit. Registrasi publik menetapkan role **pasien di server**. Tidak ada registrasi admin/dokter, NIK atau KK.

### Notasi input dan query

`!` wajib, `?` opsional/nullable jika disebut; tanpa body ditulis `—`. Nama field request target berbahasa Inggris snake_case, dipetakan eksplisit ke kolom lama (bukan rename database otomatis). Field update PATCH yang diberi `?` boleh tidak dikirim, tetapi minimal satu field domain harus ada. Boolean harus divalidasi/dinormalisasi eksplisit dari form.

Query daftar hanya field pada tabel dan pagination `page`, `per_page` (rencana default 20, maksimum 100), urutan stabil dengan tie-break ID. `from`, `to`, `date` memakai `YYYY-MM-DD` WIB; `from <= to`; periode ringkasan tidak boleh tanpa batas. Timestamp jawaban memakai ISO-8601 berzona. Batas ukuran teks dan rentang periode harus dibakukan pada Form Request tugas pemilik sebelum dinyatakan selesai; jangan memakai panjang tak terbatas. GET tanpa query berarti tampilan default aman, bukan seluruh dataset.

Kode `V` = validasi di atas; `C(kode)` = konflik domain dengan pemetaan HTML 302/JSON 409; `N` = resource/relasi yang tidak boleh terlihat 404. Auth/role/CSRF berlaku pada **semua** baris sesuai role, meski tidak diulang di kolom galat. Nilai ID dari query/form tetap harus lolos policy; ID valid bukan izin akses.

## 2. Auth dan navigasi bersama (FR-07)

| Method + path | Nama route rencana | Role | Input diizinkan | Hasil HTML / galat | Pemilik |
|---|---|---|---|---|---|
| GET `/` | `home` | Publik | — | 200 beranda publik, tanpa data pasien | L05 |
| GET `/masuk` | `login` | Tamu | — | 200 form | L04 |
| POST `/masuk` | `login.store` | Tamu | `email!`, `password!` | 302 `/beranda` atau `/admin` sesuai role; kredensial salah: errors generik tidak mengungkap akun; V/429 | L04 |
| GET `/daftar` | `register` | Tamu | — | 200 form pasien | L04 |
| POST `/daftar` | `register.store` | Tamu | `name!`, `email!`, `password!`, `password_confirmation!` | Rencana 302 `/masuk`, tanpa auto-login; email duplikat/konfirmasi/password <8: V; role tambahan ditolak | L04 |
| POST `/keluar` | `logout` | Pasien/admin | — | 302 `/masuk`, sesi server dicabut | L04 |
| GET `/beranda` | `patient.dashboard` | Pasien | — | 200 ringkasan sendiri, nomor/status kunjungan hari ini | L05 |
| GET `/admin` | `admin.dashboard` | Admin | `date?` | 200 ringkasan operasional minimal | L05 |

Tidak ada GET logout atau endpoint registrasi alternatif yang menerima role. Akun admin individual dibuat lewat seed aman. Password disimpan hash. Perilaku daftar/masuk saat sudah login diarahkan ke dashboard rolenya dan harus diuji L04.

## 3. Profil dan katalog (FR-01, L07)

| Method + path | Nama route rencana | Role | Input diizinkan | Hasil HTML / galat | Pemilik |
|---|---|---|---|---|---|
| GET `/profil` | `profile.show` | Pasien | — | 200 profil dan obat laporan sendiri, atau ajakan melengkapi | L07 |
| PATCH `/profil` | `profile.update` | Pasien | `phone_number?`, `birth_date?`, `gender?`, `blood_group?`, `height_cm?`, `weight_kg?`, `health_conditions?`, `allergies?`, `emergency_contact_name?`, `emergency_contact_phone?`, `reported_medications?` | 302 `/profil`; V | L07 |
| DELETE `/profil` | `profile.destroy` | Pasien | `confirmation!` bernilai `HAPUS PROFIL` | 302 `/profil`; V; bukan penghapusan akun/resep klinis | L07 |
| GET `/katalog-obat` | `medication-catalog.index` | Pasien/admin | `q?`, `page?`, `per_page?` | 200 hasil katalog referensi, bukan rekomendasi | L07 |

`reported_medications` adalah daftar laporan pasien yang terpisah dari resep klinis. Setiap item hanya `catalog_id?`, `name!`, `international_name?`, `dose_note?`, `frequency_note?`, `started_on?`, `ended_on?`, `notes?`. PATCH yang mengirim daftar mengganti daftar laporan sendiri secara atomik; field tidak dikirim berarti tidak diubah, daftar kosong berarti dihapus. ID katalog opsional harus berasal dari katalog yang telah diverifikasi. Bukan impor resep. Tanggal akhir tidak mendahului awal. L07 harus menyediakan persistensi terpisah dan test round-trip kondisi, alergi, dan obat. Profil boleh dihapus dengan konfirmasi, lalu fitur lain menampilkan keadaan profil kosong. Data laporan terkait profil ikut dihapus; data klinis bukan target operasi ini. Edit nama akun tidak disediakan sebelum keputusan terpisah.

NIK/KK, `role`, dan field resep ditolak. `data/fornas` dipertahankan sebagai sumber publik; Excel/JSON tidak otomatis dianggap katalog terimpor atau klinis terverifikasi.

## 4. Dokter, slot dan pemesanan (FR-03, bagian FR-08)

| Method + path | Nama route rencana | Role | Input diizinkan | Hasil HTML / galat | Pemilik |
|---|---|---|---|---|---|
| GET `/dokter` | `doctors.index` | Pasien | `specialty?` | 200 dokter aktif | L08 |
| GET `/slot` | `slots.index` | Pasien | `doctor_id?`, `date?`, `from?`, `to?` | 200 slot tersedia; kosong memberi opsi waktu lain; V/N | L08 |
| GET `/janji` | `appointments.index` | Pasien | `status?`, `from?`, `to?` | 200 janji sendiri | L08 |
| POST `/janji` | `appointments.store` | Pasien | `slot_id!`, `complaint?` | 302 `/janji/{appointment}`; V/N/C(SLOT_UNAVAILABLE) | L08 |
| GET `/janji/{appointment}` | `appointments.show` | Pasien | UUID route | 200 detail sendiri; N | L08 |
| GET `/admin/dokter` | `admin.doctors.index` | Admin | `specialty?`, `active?` | 200 daftar/form pengelolaan | L08 |
| POST `/admin/dokter` | `admin.doctors.store` | Admin | `name!`, `specialty!`, `license_number?` | 302 `/admin/dokter`; V | L08 |
| PATCH `/admin/dokter/{doctor}` | `admin.doctors.update` | Admin | `name?`, `specialty?`, `license_number?`, `active?`, `reason!` | 302 `/admin/dokter`; V/N/C(ACTIVE_BOOKINGS) | L08 |
| GET `/admin/slot` | `admin.slots.index` | Admin | `doctor_id?`, `date?`, `available?` | 200 daftar/form slot | L08 |
| POST `/admin/slot` | `admin.slots.store` | Admin | `doctor_id!`, `date!`, `starts_at!`, `ends_at!`, `available?` | 302 `/admin/slot`; V/N/C(SLOT_OVERLAP) | L08 |
| PATCH `/admin/slot/{slot}` | `admin.slots.update` | Admin | `starts_at?`, `ends_at?`, `available?`, `reason!` | 302 `/admin/slot`; V/N/C(ACTIVE_BOOKINGS) | L08 |
| GET `/admin/janji` | `admin.appointments.index` | Admin | `date?`, `doctor_id?`, `status?` | 200 proyeksi minimal operasional | L08 |
| GET `/admin/janji/{appointment}` | `admin.appointments.show` | Admin | UUID route | 200 detail operasional tanpa profil lengkap/kebiasaan; N | L08 |

Satu slot = satu janji berjalan. `quota`, TTL, pemilik dan status final bukan input pasien. Jam WIB `HH:mm`, awal < akhir. Perubahan slot yang memengaruhi janji berjalan tidak boleh memindahkan pasien diam-diam; gunakan alur usulan L09. Aturan overlap dokter/slot dan estimasi durasi layanan perlu keputusan sebelum acceptance terkait dianggap selesai.

Konfirmasi janji wajib memuat dokter, spesialisasi, tanggal/jam WIB, status, **nomor estimasi dan perkiraan jam berlabel “perkiraan”**, serta nomor final nullable sebelum check-in. Estimasi bukan urutan panggilan. Dua pemesan bersamaan: tepat satu berhasil; transaksi lain menerima konflik tanpa data parsial. L08 harus menghormati reservasi usulan L09 meski modul jawaban belum dibangun.

## 5. Usulan, tanggapan, notifikasi dan pembatalan (FR-08/09)

| Method + path | Nama route rencana | Role | Input diizinkan | Hasil HTML / galat | Pemilik |
|---|---|---|---|---|---|
| POST `/admin/janji/{appointment}/usulan` | `admin.proposals.store` | Admin | `proposed_slot_id!`, `reason!`, `response_deadline?` | 302 `/admin/janji/{appointment}`; V/N/C(SLOT_UNAVAILABLE,PROPOSAL_PENDING,INVALID_STATE) | L09 |
| POST `/admin/janji/{appointment}/batal` | `admin.appointments.cancel` | Admin | `reason!` | 302 `/admin/janji/{appointment}`; V/N/C(INVALID_STATE) | L09 |
| POST `/janji/{appointment}/batal` | `appointments.cancel` | Pasien, belum diaktifkan sebelum keputusan | `reason!` | Rencana 302 `/janji/{appointment}`; V/N/C(INVALID_STATE) | L09 |
| GET `/usulan` | `proposals.index` | Pasien | `status?` | 200 usulan sendiri | L09 |
| GET `/usulan/{proposal}` | `proposals.show` | Pasien | UUID route | 200 alasan, slot lama/baru, batas jawab, status/jawaban terdahulu; N | L09 |
| POST `/usulan/{proposal}/setujui` | `proposals.accept` | Pasien | — | 302 `/usulan/{proposal}`; N/C(PROPOSAL_EXPIRED,DUPLICATE_RESPONSE,SLOT_UNAVAILABLE) | L09 |
| POST `/usulan/{proposal}/tolak` | `proposals.reject` | Pasien | `reason?` | 302 `/usulan/{proposal}`; V/N/C(PROPOSAL_EXPIRED,DUPLICATE_RESPONSE) | L09 |
| POST `/usulan/{proposal}/pilih-slot` | `proposals.alternative` | Pasien | `slot_id!` | 302 `/usulan/{proposal}`; V/N/C(PROPOSAL_EXPIRED,DUPLICATE_RESPONSE,SLOT_UNAVAILABLE) | L09 |
| GET `/notifikasi` | `notifications.index` | Pasien | `read?`, `type?`, `from?`, `to?` | 200 notifikasi sendiri, referensi usulan/hasil jawaban | L09 |
| PATCH `/notifikasi/{notification}/dibaca` | `notifications.read` | Pasien | — | 302 `/notifikasi`; idempoten; N | L09 |

Saat usulan menunggu, slot lama **dan** slot usulan sama-sama dilindungi dari pemesanan lain dalam transaksi. Setuju memindah janji dan melepas slot lama. Tolak mempertahankan janji lama dan melepas slot usulan. Pilih alternatif tersedia **langsung** memindahkan janji secara atomik, melepas slot lama dan slot usulan, serta menyelesaikan usulan; tidak ada tahap konfirmasi admin tambahan. Penyimpanan status hasil alternatif harus ditetapkan L03/L09, bukan mengarang status yang dianggap sudah ada.

Expiry melepas slot usulan, mempertahankan janji lama, dan memberitahu admin. Proses expiry dan respons pasien mengambil locks yang sama, memeriksa waktu/status ulang. Hanya satu hasil terminal boleh menang. Request konflik tidak menghasilkan perpindahan parsial. Pembatalan menutup usulan/reservasi terkait atomik dan memberi pemberitahuan; pembatalan admin juga satu audit per perubahan.

TTL, relasinya dengan batas jawab, cutoff pembatalan dan bentuk pemberitahuan admin harus disepakati L09. Pembatalan mandiri pasien masih terbuka di DESIGN.md dan wireframe; baris route pasien di atas merupakan kandidat yang tidak boleh diaktifkan atau diberi tombol sebelum pemilik mengesahkannya. Pembatalan admin tetap wajib. `response_deadline` jika diizinkan harus dibatasi kebijakan server; client tidak menentukan TTL. Angka 12 jam/24 jam di arsip masih usulan, bukan default final. Tidak ada WhatsApp/email/push.

## 6. Kontrol berulang dan pengingat (FR-02)

| Method + path | Nama route rencana | Role | Input diizinkan | Hasil HTML / galat | Pemilik |
|---|---|---|---|---|---|
| GET `/jadwal-kontrol` | `controls.index` | Pasien | `from?`, `to?`, `status?`, `view?` (`agenda`/`bulan`) | 200 jadwal sendiri, agenda default | L10 |
| GET `/admin/aturan-kontrol` | `admin.control-rules.index` | Admin | `patient_id?`, `active?` | 200 daftar/form aturan operasional | L10 |
| POST `/admin/aturan-kontrol` | `admin.control-rules.store` | Admin | `patient_id!`, `doctor_id?`, `interval_days!`, `starts_on!`, `notes?` | 302 `/admin/aturan-kontrol`; V/N | L10 |
| PATCH `/admin/aturan-kontrol/{controlRule}` | `admin.control-rules.update` | Admin | `active?`, `notes?`, `reason!` | 302 `/admin/aturan-kontrol`; V/N | L10 |

`interval_days` hanya 7/14/30 pada rancangan sumber, tetapi “30 hari” dan contoh 31 Januari -> akhir Februari menunjukkan ambiguitas kebijakan. Keputusan pemilik tentang kalender harus ada sebelum implementasi/test tanggal dinyatakan memenuhi FR-02. Jika dipilih bulanan, clamp tidak boleh mengubah anchor asli (31 Jan -> 28/29 Feb -> 31 Mar). Jangan menyamakan otomatis dengan tambah 30 hari.

Jadwal terlewat harus ditandai dan mempunyai jadwal pengganti sesuai keputusan yang disahkan, tidak mengirim pengingat baru untuk jadwal lewat. Pengingat tiga hari sebelum jatuh tempo tepat satu, termasuk generator dipanggil dua kali. Membaca/menandai pengingat menggunakan route notifikasi **L09** di atas; L10 hanya memiliki generatornya, tanpa alias `/pengingat` kedua. L11 memanggil generator jadwal berikutnya milik L10 saat selesai, secara idempoten. Cutoff terlewat/jam tutup masih perlu keputusan.

## 7. Antrean dan check-in (FR-04)

| Method + path | Nama route rencana | Role | Input diizinkan | Hasil HTML / galat | Pemilik |
|---|---|---|---|---|---|
| GET `/antrian` | `queue.show` | Pasien | `date?`, `appointment_id?` sendiri | 200 tiket sendiri, nomor/status/posisi; N | L11 |
| POST `/janji/{appointment}/check-in` | `check-in.store` | Pasien | — | 302 `/antrian`; N/C(ALREADY_CHECKED_IN,CHECK_IN_NOT_OPEN,INVALID_STATE) | L11 |
| GET `/admin/antrian` | `admin.queue.index` | Admin | `date?`, `status?` | 200 daftar operasional minimal | L11 |
| POST `/admin/janji/{appointment}/check-in` | `admin.check-in.store` | Admin | — | 302 `/admin/antrian`; N/C(ALREADY_CHECKED_IN,CHECK_IN_NOT_OPEN,INVALID_STATE) | L11 |
| PATCH `/admin/antrian/{ticket}/status` | `admin.queue.update` | Admin | `status!`, `correction_reason?` | 302 `/admin/antrian`; V/N/C(INVALID_TRANSITION) | L11 |
| POST `/admin/antrian/tutup-hari` | `admin.queue.close-day` | Admin | `date!` | 302 `/admin/antrian`; V/C(DAY_NOT_CLOSABLE); idempoten | L11 |

Status normal: `belum_check_in` -> `menunggu` -> `diperiksa` -> `selesai`; belum check-in/menunggu dapat menjadi `tidak_hadir` sesuai kebijakan. Menunggu langsung selesai ditolak. Koreksi mundur memerlukan alasan; transisi koreksi yang diperbolehkan harus eksplisit, bukan mengizinkan semua status jika ada teks alasan. Check-in pasien bukan izin mengubah status admin lewat field `status`.

Nomor final unik per hari WIB, hanya setelah check-in, satu tiket per janji. Nomor estimasi dan final adalah dua konsep berbeda, bukan janji bahwa nilainya tak pernah kebetulan sama (kontradiksi redaksi PRD perlu dikonfirmasi). Check-in ganda ditolak, bukan membuat nomor baru. Penutupan hari menandai tidak hadir sesuai cutoff yang disetujui; belum diputuskan berarti acceptance waktu terhalang. Akses ringkasan alergi saat check-in harus minimal dan mencatat pembukaan sesuai keputusan privasi; tidak membuka profil lengkap.

## 8. Resep dan kepatuhan obat (FR-12)

| Method + path | Nama route rencana | Role | Input diizinkan | Hasil HTML / galat | Pemilik |
|---|---|---|---|---|---|
| GET `/obat` | `medications.index` | Pasien | `active?` | 200 resep/obat sendiri atau keadaan belum ada resep | L12 |
| GET `/obat/kepatuhan` | `medication-adherence.index` | Pasien | `from?`, `to?` | 200 ringkasan catatan harian sendiri; V | L12 |
| PATCH `/obat/{medication}/catatan/{date}` | `medication-days.update` | Pasien | `status!` (`sudah`/`belum`), `notes?` | 302 `/obat`; V/N/C(OUTSIDE_MEDICATION_PERIOD) | L12 |
| GET `/admin/resep` | `admin.prescriptions.index` | Admin | `patient_id?`, `from?`, `to?` | 200 daftar/form pencatatan resep; tanpa kepatuhan pasien | L12 |
| POST `/admin/resep` | `admin.prescriptions.store` | Admin | `patient_id!`, `appointment_id?`, `doctor_id?`, `prescription_number?`, `prescribed_on!`, `notes?`, `medications!` | 302 `/admin/resep`; V/N | L12 |

Item `medications`: `name!`, `dose!`, `instructions!`, `frequency_per_day!`, `starts_on!`, `ends_on!`, `fornas_reference!`, `source_retrieved_on!`. Frekuensi bilangan positif; tanggal akhir >= awal; nama/dosis berasal dari resep, tidak dihitung dari kondisi pasien. Metadata sumber/tanggal adalah kebutuhan target, **bukan klaim kolom lama sudah ada**. ID pasien/janji/dokter harus konsisten; admin pencatat berasal dari sesi. Resep dan seluruh item serta audit tersimpan atomik.

Pasien tidak mendapat route menambah/mengedit resep klinis. Daftar selalu memuat nama, dosis, aturan pakai, periode, nama pencatat, rujukan Fornas, dan label **“Catatan resep, bukan saran medis.”** Catatan pasien upsert unik pasien+obat+tanggal; `belum` lalu `sudah` memperbarui satu baris dan ringkasan. Satu catatan harian tidak membuktikan dosis individual. Denominator hari/periode aktif, perlakuan hari kosong dan rentang default disepakati L12; data belum cukup ditampilkan apa adanya. Admin tidak mengakses ringkasan kepatuhan.

## 9. Kebiasaan wajib (FR-05/FB-5)

| Method + path | Nama route rencana | Role | Input diizinkan | Hasil HTML / galat | Pemilik |
|---|---|---|---|---|---|
| GET `/kebiasaan` | `habits.index` | Pasien | `from?`, `to?` | 200 catatan/form milik sendiri | L13 |
| PATCH `/kebiasaan/{date}` | `habits.update` | Pasien | `hydration_ml?`, `sleep_hours?`, `activity_minutes?`, `notes?` | 302 `/kebiasaan`, ringkasan hasil terbaru; V | L13 |
| DELETE `/kebiasaan/{date}` | `habits.destroy` | Pasien | — | 302 `/kebiasaan`, ringkasan diperbarui; N bila tidak ada | L13 |
| GET `/kebiasaan/ringkasan` | `habit-summary.show` | Pasien | `from?`, `to?` | 200 ringkasan sendiri; V | L13 |

Satu catatan per pasien+tanggal WIB. Minimal satu nilai kebiasaan harus dikirim saat simpan; hanya field terkirim diperbarui. Tidur 0, 24 atau bukan angka ditolak sesuai acceptance sumber. Hidrasi/aktivitas angka nonnegatif; batas maksimum/pecahan tidur dan ambang penilaian memerlukan keputusan terdokumentasi, bukan rekomendasi medis baru. CRUD tidak dipotong menjadi tampilan saja.

Ringkasan memuat hari tercatat, hari kosong, runtutan hari dan hasil terhadap ambang yang disahkan. Gap tanggal 1/2/4 diuji; nilai di bawah/tepat/di atas ambang diuji untuk ketiga kebiasaan. PRG sudah menampilkan ringkasan terbaru tanpa reload manual; fetch opsional tidak menggantikan alur HTML. Tanpa keputusan ambang, acceptance penilaian **blocked**, bukan dianggap lulus dengan angka contoh. FB-5 tetap fitur wajib, bukan opsi L17.

## 10. Audit dan timeline

| Method + path | Nama route rencana | Role | Input diizinkan | Hasil HTML / galat | Pemilik |
|---|---|---|---|---|---|
| GET `/admin/audit-log` | `admin.audit.index` | Admin | `action?`, `object_type?`, `object_id?`, `from?`, `to?` | 200 log operasional tersaring | L06 |
| GET `/janji/{appointment}/perubahan` | `appointment-changes.index` | Pasien | UUID route | 200 perubahan janji sendiri, proyeksi aman; N | L06 |
| GET `/timeline` | `timeline.index` | Pasien | `type?`, `from?`, `to?`, `status?` | 200 satu riwayat terbaru, FR-11 + FR-13 | L14 |
| GET `/timeline/{type}/{entry}` | `timeline.show` | Pasien | `type` allowlist + UUID `entry` | 200 detail sendiri; N | L14 |

Audit: satu perubahan admin -> tepat satu log dalam transaksi yang sama; audit gagal -> mutasi rollback. Isi minimal aktor, waktu, aksi, objek, before/after, alasan bila wajib. Tidak ada route POST/PATCH/DELETE audit. Batch penutupan hari mencatat setiap perubahan objek sekali; replay tanpa perubahan tidak menggandakan audit. Tidak menaruh kebiasaan, password atau seluruh profil dalam snapshot admin.

Timeline jenis `appointment`, `check_in`, `visit`, `medication`, `control_schedule`, memakai identitas stabil `(type, entry UUID)`, waktu berzona, ringkasan dan tautan detail. Payload/HTML tiap jenis: janji (dokter, tanggal, status), check-in (waktu, nomor final), kunjungan (waktu/status selesai), obat (nama/periode/label resep), jadwal kontrol (tanggal/status/tautan janji jika ada). Semua query berscope pasien, urut terbaru dengan tie-break stabil, keadaan kosong mengarah ke janji pertama. Tidak ada alias `/riwayat/janji` kedua. Kontrol berikutnya muncul setelah kunjungan selesai tanpa entri duplikat.

## 11. Opsional, tidak aktif tanpa keputusan (FR-06/14)

| Method + path | Nama route rencana | Role | Input diizinkan | Hasil HTML / galat | Pemilik |
|---|---|---|---|---|---|
| GET `/konten` | `content.index` | Pasien | `category?` | 200 materi sesuai kondisi sendiri, URL/tanggal sumber | L17 |
| GET `/admin/konten` | `admin.content.index` | Admin | `category?`, `active?` | 200 daftar/form bila disetujui | L17 |
| POST `/admin/konten` | `admin.content.store` | Admin | `slug!`, `title!`, `summary!`, `body!`, `category!`, `related_condition?`, `source_url!`, `retrieved_on!` | 302 `/admin/konten`; V; audit wajib | L17 |
| GET `/aktivitas` | `activity.index` | Pasien | `type?`, `from?`, `to?` | 200 log sendiri, append-only aplikasi | L17 |

Konten hanya sumber resmi Kemenkes/WHO yang ditinjau; sanitasi/escaping isi dan sumber diuji. Log aktivitas dihasilkan server, tidak ada route tulis/ubah/hapus pengguna. Fitur yang dipotong tidak diberi link navigasi aktif. L17 tidak menggantikan audit wajib L06 atau kebiasaan wajib L13.

## 12. Keputusan dan bukti sebelum implementasi dianggap selesai

| Keputusan | Pemilik | Acceptance yang belum dapat ditutup tanpanya |
|---|---|---|
| Versi Laravel/PHP/host kompatibel, runner/config Chrome | L01 | Bootstrap, CI, hosting nyata |
| Baseline terisolasi vs adopsi skema, sessions mapping | L02 sebelum L03 | Migrasi aman, auth persistence |
| Idle 15 menit, rate limit persisten, kebijakan email/password | L04 | Replay sesi sesudah logout/idle, brute-force |
| TTL, batas jawab, expiry dan cutoff batal | L09 | Race expiry/jawaban dan pembatalan |
| Interval 30 hari vs bulanan, cutoff terlewat/pengganti | L10 | Tanggal jatuh tempo dan pengganti |
| Jendela check-in/jam tutup, privasi alergi | L11 | Check-in batas waktu/tutup hari/alergi |
| Denominator harian obat | L12 | Persentase kepatuhan yang dapat dijelaskan |
| Ambang kebiasaan dan aturan ringkasan | L13 | Penilaian FB-5 |

Setiap route punya satu pemilik pada tabel. Shared `routes/web.php` dan berkas lintas fitur dikerjakan serial. Verifikasi nanti mencakup PHPUnit HTTP + PostgreSQL terisolasi dan Playwright Chrome untuk HTML/CSRF/PRG. Kontrak ini bukan output `route:list`, hasil test, atau bukti skema Neon. Status tugas hanya di [status-tugas.md](status-tugas.md).
