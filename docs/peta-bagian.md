# Peta kebutuhan produk ke target Laravel

Peta ini membantu membaca potongan PRD yang diperlukan, bukan seluruh dokumen.
Spesifikasi tugas aktif: [`rencana-agen.md`](rencana-agen.md). Urutan/gerbang:
[`to-do.md`](to-do.md). Status hidup hanya [`status-tugas.md`](status-tugas.md).

## Sumber dan batas

PRD kanonik: `C:\Users\HYPE AMD\Documents\brain-project\docs\produk\prd-v0.3.md`.
Salinan baca: `docs/rancangan/prd-v0.3.md`. Keduanya **read-only**; gunakan
teks pencarian di tabel agar tidak bergantung nomor baris. Bila berbeda,
vault benar dan perbedaannya dilaporkan, bukan diperbaiki dari repo kode.

Migrasi teknis disetujui pemilik dan dirujuk oleh
`docs/keputusan/0002-migrasi-laravel.md`: Laravel/Blade/CSS biasa/vanilla JS,
Eloquent, validasi Laravel, PostgreSQL Neon, PHPUnit/Pint dan Playwright Chrome.
Aturan produk, kepemilikan data, dua role dan privasi tidak ikut diganti.
Rencana teknis Next.js dalam `docs/rancangan/` tetap snapshot read-only;
peta/status Next.js terdahulu ada di `_arsip/nextjs-2026-11-02/docs/`.

**Semua lokasi kode di bawah adalah target rencana, belum klaim tersedia.**
Tidak ada scaffold Laravel yang dijalankan oleh penyusunan dokumentasi ini.

## FR → potongan PRD → layar → modul → tugas

Untuk setiap FR baca baris di §4.1, blok `**FR-xx` di §4.3, lalu tambahan
rujukan di kolom ketiga. ID layar mengikuti wireframe, bukan route Laravel.

| FR | Kebutuhan | Tambahan pencarian PRD | Layar | Target modul Laravel | Tugas |
|---|---|---|---|---|---|
| FR-01 | Profil kesehatan, obat laporan sendiri | `### 4.4`; `Privacy` | P4 | `app/Services/Profile/`, `app/Services/Medicines/`, `resources/views/profile/` | L07 |
| FR-02 | Kontrol berulang, H-3, pengganti terlewat | `anchor tanggal asli`; `### 3.5`; `Jadwal kontrol (v0.3)` | P5 | `app/Services/Controls/`, `resources/views/controls/` | L10; integrasi L11 |
| FR-03 | Spesialis/slot dan janji anti-bentrok | `### 3.4`; `Availability and Reliability` | P6–P8 | `app/Services/Appointments/`, `resources/views/appointments/`, `resources/views/doctors/`, `resources/views/slots/` | L08 |
| FR-04 | Check-in, nomor estimasi/final, status/tutup hari | `### 3.5`; `Timezone`; `### 4.4` | P9, K5 | `app/Services/Queue/`, `resources/views/queue/` | L11, bergantung L10 |
| FR-05 | Kebiasaan, kepatuhan dan runtutan hari (FB-5 wajib) | `## 9` butir 4; `### 4.4` | P10–P11 | `app/Services/Habits/`, `config/habits.php`, `resources/views/habits/` | L13 |
| FR-06 | Konten resmi sesuai kondisi (opsional) | `## 9` butir 5; `Konten statis ditinjau` | P12 bila disetujui | `app/Services/Content/`, `resources/views/content/` | L17, rilis terpisah |
| FR-07 | Registrasi/login/logout, sesi dan dua role | `Session and access`; `### 4.4`; `US-01` | P1–P2, K1 | `app/Http/Controllers/Auth/`, `app/Http/Middleware/`, `resources/views/auth/` | L04; fondasi L01–L03; layout L05 |
| FR-08 | Admin dokter/slot, usulan dan pembatalan beralasan | `### 3.4`; `## 9` butir 11/15/17; `### 1.4` | K2–K4, P13 | `app/Services/Appointments/`, `app/Http/Controllers/Rescheduling/`, `resources/views/rescheduling/` | L08–L09; audit L06 |
| FR-09 | Notifikasi in-app dan setuju/tolak/slot lain | `### 1.4`; `## 9` butir 17 | P13 | `app/Services/Notifications/`, `resources/views/notifications/` | L09 |
| FR-10 | Audit append-only, atomik dengan mutasi admin | `### 4.4`; `Accountability` | K7; riwayat perubahan janji pasien | `app/Services/Audit/`, `resources/views/audit/` | L06, dipakai L08–L12 |
| FR-11 | Riwayat janji, digabung ke FR-13 | `**FR-13`; `## 9` butir 13 | P14, bukan halaman kedua | `app/Services/Timeline/`, `resources/views/timeline/` | L14 |
| FR-12 | Resep dokter, label Fornas, kepatuhan obat | `Halaman obat (v0.3)`; `## 9` butir 14; `### 2.3` | P15, K6 | `app/Services/Prescriptions/`, `resources/views/prescriptions/` | L12; katalog L07 |
| FR-13 | Timeline terpadu milik pasien | `**FR-11`; `### 4.4` | P14 | `app/Services/Timeline/`, `resources/views/timeline/` | L14 |
| FR-14 | Log akun append-only (opsional) | `## 9` butir 8; bedakan dari audit FR-10 | P16 bila disetujui | `app/Services/AccountActivity/`, `resources/views/account-activity/` | L17, rilis terpisah |

Lima fitur wajib FB-1–5 adalah profil, kontrol rutin, janji, antrian dan
kebiasaan. Label P2 FR-05 di snapshot tidak mengizinkan pemotongan fitur wajib
pada rencana migrasi ini. FR-06 dan FR-14 opsional, tidak menghalangi L16.
Audit admin, resep dan timeline tetap lingkup inti, bukan pengganti FB-5.

## Potongan lintas fitur

| Kebutuhan | Cari di PRD | Tugas utama |
|---|---|---|
| Batas produk/notifikasi, bukan keputusan medis | `### 1.4`, `### 2.2` | L07–L13, L17 |
| Target UAT, beban, UX dan bukti | `### 2.3` | L15–L16 |
| Skenario ujung ke ujung 10 langkah | `### 3.3` | L15–L16 |
| Performa, privasi, role, WIB, aksesibilitas | `### 4.2` | L01–L16 sesuai domain |
| Kriteria terima domain | `### 4.3`, lalu satu `**FR-xx` | Tugas domain pada tabel |
| Batas admin: profil penuh/kebiasaan terlarang | `### 4.4` | L04, L07, L11–L13, L15 |
| Data dan relasi | `## 6` | L02–L03, domain terkait |
| Checklist rilis | `### 7.4` | L15–L16 |
| Ambang kebiasaan, TTL, asumsi yang belum diputus | `## 9` butir 3/4/11/15/17 | L09–L13; jangan mengarang keputusan |

Baca hanya potongan yang diperlukan. Jadwal PRD masih mencantumkan 2 November
2026; permintaan terbaru menetapkan rencana relatif 10 hari dengan tanggal
akhir belum dikonfirmasi, bukan izin menyunting tenggat di salinan PRD.

## Wireframe dan perilaku UI

| Rujukan read-only | Cara mencari | Dipakai |
|---|---|---|
| `docs/rancangan/design/01-peta-alur.md` | alur pasien/admin | L04–L15 |
| `docs/rancangan/design/02-wireframe-pasien.md` | `## P4`, atau ID layar pada tabel | L04–L14, L17 |
| `docs/rancangan/design/03-wireframe-klinik.md` | ID K1–K7 | L04, L06, L08–L12 |
| `docs/rancangan/design/04-state-dan-copy.md` | nama fitur; kosong/galat/loading | L05 dan setiap UI domain |

Judul P13/P14/P15 dalam snapshot ada yang ganda: pilih bagian yang memuat FR
terkait, jangan hanya mengambil judul pertama. Arah visual dari `DESIGN.md`
bila tersedia; migrasi stack tidak berarti mengganti identitas desain.

## Konvensi target kode dan verifikasi

| Bagian | Target |
|---|---|
| Routing web dan scheduler | `routes/web.php`, `routes/console.php`, perubahan diserialkan |
| Handler tipis dan validasi server | `app/Http/Controllers/<Domain>/`, `app/Http/Requests/<Domain>/` |
| Otorisasi | `app/Policies/`, `app/Http/Middleware/`, ownership pada query |
| Transaksi/logika bisnis | `app/Services/<Domain>/` |
| ORM/skema/fixture | `app/Models/`, `database/migrations/`, `database/factories/`, `database/seeders/` |
| Konfigurasi dan rahasia | `config/`, env Laravel; `.env` tidak di-commit |
| Waktu WIB | `app/Support/WibClock.php`, satu sumber yang dapat dibekukan |
| UI server dan aset | `resources/views/`, `resources/css/`, `resources/js/`, Vite |
| Uji backend | `tests/Unit/`, `tests/Feature/`, PHPUnit, PostgreSQL isolasi untuk integrasi |
| Uji browser/beban | `tests/e2e/`, Playwright Chrome; `tests/load/` |
| Bukti tugas | `docs/bukti/L01.md` sampai `docs/bukti/L17.md` |

L02 mendahului migrasi L03: inventaris DB aktual dan arsip, backup/restore
terisolasi, pemetaan UUID/`password_hash` dan keputusan tabel/sesi terlebih
dahulu. Default Laravel tidak boleh mengganti tabel lama. L06 mendahului
mutasi admin; L11 bergantung L10 agar penyelesaian kunjungan memanggil pembuat
kontrol berikutnya secara idempoten.

Ambang kebiasaan belum ditetapkan: penerimaan ringkasan L13 terhalang sampai
angka/sumber disetujui, tetapi tugas tetap wajib. TTL/cutoff L09 dan makna
interval 30 hari vs anchor kalender L10 juga perlu keputusan eksplisit.
Gunakan batas privasi paling sempit: admin tak melihat profil penuh, kebiasaan
atau ringkasan kepatuhan; akses ringkasan alergi hanya konteks check-in dengan
pencatatan. Obat laporan pasien bukan resep admin. Tidak ada NIK/KK pada data
profil/demo/uji dan tidak ada rekomendasi obat otomatis.
