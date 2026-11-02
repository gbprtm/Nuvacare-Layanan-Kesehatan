> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

# Rencana Kerja Agen

Berkas ini ditulis untuk dieksekusi **agen coding**, bukan untuk dibaca manusia
saja. Setiap tugas punya batas berkas, dependensi, dan kriteria terima yang
dapat diperiksa.

Ringkasan urutan dan gerbang ada di `to-do.md`.

> **Berkas ini spesifikasi, bukan papan status.**
> Field `status` di bawah adalah snapshot 25 Oktober 2026 dan tidak diperbarui
> lagi. Status hidup ada di repo kode:
> `C:\Users\HYPE AMD\Documents\project\docs\status-tugas.md`.
> Agen yang bekerja di repo kode **tidak menulis ke berkas ini**.

---

## 0. Cara memakai berkas ini

1. Baca `to-do.md` bagian 0–3 untuk aturan yang mengikat.
2. Cari tugas yang `depends`-nya sudah `done` di
   `project/docs/status-tugas.md`.
3. Ubah status tugas itu menjadi `doing` di berkas status repo kode.
4. Kerjakan **hanya** berkas di `paths`.
5. Jalankan `verify`. Semua harus lulus.
6. Tulis bukti di `evidence` (di dalam repo kode).
7. Ubah status menjadi `done` dan isi hash commit di repo kode.
8. Bila tidak bisa memenuhi `accept`, ubah status menjadi `blocked`,
   tulis satu kalimat sebab, lalu berhenti. **Jangan menandai done.**

Nilai `status`: `todo` · `doing` · `blocked` · `done`.
Satu tugas = satu commit. Format pesan: `A01: rapikan repo`.

---

## 1. Kontrak kerja (mengikat)

| Kode | Aturan |
|---|---|
| K01 | Hanya ubah berkas yang ada di `paths` tugas. Berkas lain **read-only**. |
| K02 | Semua pekerjaan hanya di repo kode `C:\Users\HYPE AMD\Documents\project`. |
| K03 | PRD v0.3 read-only. Jangan pernah mengubahnya dari repo kode. |
| K04 | Tanpa dependensi baru di luar daftar `saran/yang-perlu-diinstal.md`. |
| K05 | TypeScript `strict`. `any` hanya dengan komentar `// alasan:`. |
| K06 | Setiap mutasi divalidasi `zod` di server. |
| K07 | Setiap handler memeriksa sesi **dan** peran di server, bukan hanya di UI. |
| K08 | Tidak ada kredensial di kode. Semua env lewat `src/lib/env.ts`. |
| K09 | Semua tanggal lewat `src/lib/waktu-wib.ts`. Tidak ada `new Date()` liar. |
| K10 | Setiap tugas menambah atau memperbarui uji. |
| K11 | Sebelum `done`: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` hijau. |
| K12 | Bukti ditulis ke `docs/<folder>/<ID>.md` di repo kode. |
| K13 | Perbarui status tugas di berkas ini. |
| K14 | Jangan `push --force`, `reset --hard`, atau hapus branch tanpa izin. |
| K15 | Jangan menambah pustaka UI baru. Pakai komponen di `src/components/`. |
| K16 | Teks antarmuka bahasa Indonesia. Nama variabel dan fungsi bahasa Inggris. |
| K17 | Angka dan tanggal tampil format Indonesia (`id-ID`). |
| K18 | Bila `accept` tidak tercapai, `blocked`. Dilarang mengarang hasil uji. |

---

## 2. Skema tugas

| Field | Arti |
|---|---|
`id` | Kode unik, dipakai di commit dan bukti |
`fase` | F0 fondasi, F1 data, F2 backend, F3 frontend, F4 uji |
`area` | `ops`, `db`, `auth`, `api`, `lib`, `ui`, `test`, `doc` |
`judul` | Satu baris, kata kerja di depan |
`depends` | ID yang harus `done` lebih dulu |
`paths` | Daftar berkas/folder yang boleh diubah |
`input` | Rujukan PRD atau berkas desain |
`langkah` | Urutan kerja ringkas |
`accept` | Kriteria terima yang dapat diperiksa |
`verify` | Perintah yang wajib lulus |
`evidence` | Berkas bukti |
`status` | `todo` / `doing` / `blocked` / `done` |

**Aturan `paths`.** Dua tugas yang boleh berjalan bersamaan tidak boleh punya
`paths` yang beririsan; kalau beririsan, kerjakan berurutan. Karena itu `paths`
ditulis sepersempit mungkin: satu tugas tidak boleh memegang folder akar
(`src/app/**`) hanya karena ia membuat foldernya. Beririsan dengan tugas yang
sudah `done` tidak dihitung, sebab berkas itu sudah tidak akan disentuh lagi.

**Berkas bersama.** Tiga berkas ini dipakai hampir semua tugas, jadi tugas yang
menyentuhnya **tidak boleh paralel** meski satu fase: `package.json`,
`src/db/schema/index.ts`, dan `src/db/migrations/**`. Tugas yang hanya membaca
tidak perlu menyentuhnya.

---

## 3. Daftar tugas

| ID  | Judul                                     | Depends       | Status |
| --- | ----------------------------------------- | ------------- | ------ |
| A01 | Rapikan repo kode                         | —             | todo   |
| A02 | Scaffold Next.js + Tailwind + TS strict   | A01           | todo   |
| A03 | Env tervalidasi + `.env.example`          | A02           | todo   |
| A04 | Drizzle + koneksi + migrasi awal          | A03           | todo   |
| A05 | Skema `users` dan `sessions`              | A04           | todo   |
| A06 | Auth inti + cookie sesi + guard           | A05           | todo   |
| A07 | Format respons API baku                   | A06           | todo   |
| A08 | Runner Vitest + Playwright                | A02           | todo   |
| A09 | CI + deploy skeleton                      | A06, A08      | todo   |
| A10 | Skema domain klinik                       | A05           | todo   |
| A11 | Skema domain pasien                       | A10           | todo   |
| A12 | Indeks, constraint, append-only           | A11           | todo   |
| A13 | Seed admin + data fiktif                  | A12           | todo   |
| A14 | Modul waktu WIB + uji                     | A04           | todo   |
| A15 | Kontrak API v1                            | A07, A12      | todo   |
| A16 | Dokumen skema database                    | A12           | todo   |
| B01 | FR-07 API auth + guard peran              | A06, A15      | todo   |
| B02 | FR-01 profil pasien                       | B01           | todo   |
| B03 | FR-03 slot + janji + anti-bentrok         | B02, A14      | todo   |
| B04 | FR-08 usulan + TTL + pembatalan           | B03           | todo   |
| B05 | FR-09 notifikasi + jawaban                | B04           | todo   |
| B06 | FR-10 audit log append-only               | B04           | todo   |
| B07 | FR-04 antrian estimasi/final + tutup hari | B03, B06      | todo   |
| B08 | FR-02 jadwal berulang + pengingat         | B03, A14      | todo   |
| B09 | FR-12 resep + kepatuhan obat              | B03, A15      | todo   |
| B10 | FR-13 timeline kunjungan                  | B07, B09      | todo   |
| B11 | FR-05 kebiasaan + ringkasan               | B02           | todo   |
| B12 | FR-14 log aktivitas (opsional)            | B01           | todo   |
| B13 | FR-06 panel konten statis (opsional)      | B02           | todo   |
| C01 | Layout + token + komponen dasar           | A02           | todo   |
| C02 | Layar publik + masuk + daftar             | C01, B01      | todo   |
| C03 | Profil + jadwal kontrol                   | C02, B02, B08 | todo   |
| C04 | Janji + antrian                           | C03, B03, B07 | todo   |
| C05 | Obat + timeline + notifikasi + aktivitas  | C04, B09, B10 | todo   |
| C06 | Admin K1–K4                               | C02, B04, B07 | todo   |
| C07 | Admin K5-K7                               | C06, B06, B09 | todo   |
| C08 | State, aksesibilitas, responsif           | C02-C07, C09  | todo   |
| C09 | Kebiasaan harian + ringkasan kepatuhan    | C03, B11      | todo   |
| D01 | Integration test per FR                   | B01-B11       | todo   |
| D02 | Security test                             | B01–B11       | todo   |
| D03 | E2E 10 langkah                            | C08, D01      | todo   |
| D04 | Uji beban autocannon                      | D03           | todo   |
| D05 | UAT + SUS                                 | D03           | todo   |
| D06 | Bukti uji + deploy final                  | D01-D05       | todo   |

> **P12 (panel konten statis) tidak dibangun.** Layar itu satu-satunya wujud
> FR-06, dan FR-06 adalah kandidat potong kedua di `to-do.md` bagian 5. Tugas
> backend `B13` tetap ada sebagai opsional, tetapi tidak ada tugas frontend
> untuk P12. Bila nanti dibangun, tambahkan tugas baru dengan `paths`
> `src/app/(pasien)/konten/**`; jangan menyelipkannya ke C09.

---

## 4. Detail tugas

```yaml
tasks:

  # ================= F0 — FONDASI =================

  - id: A01
    fase: F0
    area: ops
    judul: Rapikan repo kode sebelum scaffold
    depends: []
    paths: [".gitignore", "README.md", "_arsip/**"]
    input: ["to-do.md §2", "saran/yang-perlu-diinstal.md §2c"]
    langkah:
      - Ganti branch lokal menjadi main dan arahkan HEAD remote ke main
      - Hapus folder .env yang salah tipe
      - Pindahkan index.html ke _arsip/2026-10-25/
      - Buat .gitignore untuk Node, Next, .env, coverage
      - Tulis README cara menjalankan proyek
    accept:
      - Branch aktif bernama main
      - Tidak ada folder bernama .env
      - index.html tidak lagi di akar
      - git status bersih setelah commit A01
    verify: ["git branch --show-current", "git status --short"]
    evidence: "docs/01-laporan-unit/A01.md"
    status: todo

  - id: A02
    fase: F0
    area: ops
    judul: Scaffold Next.js App Router dengan Tailwind dan TypeScript strict
    depends: [A01]
    paths: ["package.json", "package-lock.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs", "eslint.config.mjs", "src/app/layout.tsx", "src/app/page.tsx", "src/app/globals.css"]
    input: ["saran/yang-perlu-diinstal.md §4b"]
    langkah:
      - Jalankan create-next-app dengan App Router, src dir, alias @/*, npm, Tailwind
      - Set strict true dan noUncheckedIndexedAccess true
      - Hapus boilerplate yang tidak dipakai
      - Boleh membuat folder kosong di bawah src/app, tetapi tidak mengisi berkas di luar paths ini
      - Warna, token, dan komponen dasar bukan milik tugas ini; itu C01
    accept:
      - npm run dev hidup di port 3000
      - npm run build sukses
      - tsconfig strict aktif
    verify: ["npm run build"]
    evidence: "docs/01-laporan-unit/A02.md"
    status: todo

  - id: A03
    fase: F0
    area: ops
    judul: Validasi environment dan contoh env
    depends: [A02]
    paths: [".env.example", "src/lib/env.ts", "src/lib/errors.ts"]
    input: ["saran/yang-perlu-diinstal.md §5"]
    langkah:
      - Buat skema zod untuk DATABASE_URL, DATABASE_URL_UNPOOLED, SESSION_SECRET, APP_URL
      - Lempar galat jelas bila variabel hilang
      - Tulis .env.example tanpa nilai rahasia
    accept:
      - Aplikasi menolak start bila env kurang, dengan pesan jelas
      - .env.example lengkap
      - .env diabaikan git
    verify: ["npm run build"]
    evidence: "docs/01-laporan-unit/A03.md"
    status: todo

  - id: A04
    fase: F0
    area: db
    judul: Drizzle, koneksi Neon, dan migrasi awal
    depends: [A03]
    paths: ["drizzle.config.ts", "src/db/client.ts", "src/db/migrations/**", "package.json"]
    input: ["prd-v0.3 §6"]
    langkah:
      - Pasang drizzle-orm, postgres, drizzle-kit
      - Buat klien dengan pola singleton untuk serverless
      - Arahkan drizzle-kit ke DATABASE_URL_UNPOOLED
      - Hasilkan migrasi kosong pertama
    accept:
      - npm run db:generate dan npm run db:migrate berhasil
      - Koneksi ke Neon terbukti dari skrip sederhana
    verify: ["npm run db:migrate"]
    evidence: "docs/01-laporan-unit/A04.md"
    status: todo

  - id: A05
    fase: F0
    area: db
    judul: Skema users dan sessions
    depends: [A04]
    paths: ["src/db/schema/auth.ts", "src/db/schema/index.ts", "src/db/migrations/**"]
    input: ["prd-v0.3 FR-07", "prd-v0.3 §4.4"]
    langkah:
      - Tabel users dengan peran pasien dan admin
      - Tabel sessions menyimpan hash token dan waktu kedaluwarsa
      - Indeks unik pada email
    accept:
      - Migrasi membuat kedua tabel
      - Email duplikat ditolak database
      - Peran hanya boleh pasien atau admin
    verify: ["npm run db:migrate", "npm test"]
    evidence: "docs/01-laporan-unit/A05.md"
    status: todo

  - id: A06
    fase: F0
    area: auth
    judul: Autentikasi inti dan gerbang sesi
    depends: [A05]
    paths: ["src/modules/auth/**", "src/lib/session.ts", "src/middleware.ts", "src/app/(publik)/**"]
    input: ["prd-v0.3 FR-07", "prd-v0.3 §4.2"]
    langkah:
      - Hash kata sandi dengan bcryptjs
      - Terbitkan JWT jose di cookie httpOnly, sameSite lax, secure di produksi
      - Middleware menolak tamu dari rute inti tanpa menyentuh database
      - Fungsi guard peran untuk Route Handler
    accept:
      - Tamu diarahkan ke halaman masuk
      - Cookie tidak dapat dibaca JavaScript
      - Sesi kedaluwarsa sesuai batas
    verify: ["npm test", "npm run build"]
    evidence: "docs/01-laporan-unit/A06.md"
    status: todo

  - id: A07
    fase: F0
    area: api
    judul: Format respons API baku
    depends: [A06]
    paths: ["src/lib/api.ts", "src/lib/http.ts"]
    input: ["to-do.md §3"]
    langkah:
      - "Bentuk sukses { data } dan galat { error: { code, message, fields? } }"
      - Pemetaan galat zod ke 422
      - Helper 401, 403, 404, 409
    accept:
      - Semua handler memakai helper ini
      - Galat validasi menampilkan field yang salah
    verify: ["npm test"]
    evidence: "docs/01-laporan-unit/A07.md"
    status: todo

  - id: A08
    fase: F0
    area: test
    judul: Runner Vitest dan Playwright
    depends: [A02]
    paths: ["vitest.config.ts", "playwright.config.ts", "tests/**", "package.json", ".github/**"]
    input: ["saran/yang-perlu-diinstal.md §4d"]
    langkah:
      - Konfigurasi Vitest dengan jsdom dan alias tsconfig
      - Konfigurasi Playwright chromium, webServer npm run dev
      - Skrip test, test:e2e, typecheck, lint
      - Satu unit test dan satu e2e test contoh
    accept:
      - npm test hijau
      - npm run test:e2e hijau
      - npm run typecheck hijau
    verify: ["npm test", "npm run typecheck"]
    evidence: "docs/01-laporan-unit/A08.md"
    status: todo

  - id: A09
    fase: F0
    area: ops
    judul: CI dan deploy skeleton
    depends: [A06, A08]
    paths: [".github/workflows/ci.yml", "README.md"]
    input: ["to-do.md §1"]
    langkah:
      - Workflow lint, typecheck, unit test, build
      - Hubungkan repo GitHub ke project Vercel
      - Set env produksi di dashboard Vercel
    accept:
      - CI hijau pada push
      - URL Vercel dapat dibuka dari perangkat lain
      - Login skeleton berhasil di lingkungan hosting
    verify: ["npm run build"]
    evidence: "docs/01-laporan-unit/A09.md"
    status: todo

  # ================= F1 — DATA =================

  - id: A10
    fase: F1
    area: db
    judul: Skema domain klinik
    depends: [A05]
    paths: ["src/db/schema/klinik.ts", "src/db/schema/index.ts", "src/db/migrations/**"]
    input: ["prd-v0.3 §6 Data Requirements"]
    langkah:
      - Tabel dokter, slot, janji, usulan_perubahan, notifikasi, audit_log, aturan_kontrol
      - Status janji sesuai siklus PRD §3.4
    accept:
      - Migrasi berhasil
      - Semua entitas PRD terwakili
    verify: ["npm run db:migrate"]
    evidence: "docs/01-laporan-unit/A10.md"
    status: todo

  - id: A11
    fase: F1
    area: db
    judul: Skema domain pasien
    depends: [A10]
    paths: ["src/db/schema/pasien.ts", "src/db/schema/index.ts", "src/db/migrations/**"]
    input: ["prd-v0.3 §6"]
    langkah:
      - Tabel profil, jadwal_kontrol, tiket_antrian, catatan_kebiasaan
      - Tabel resep, obat, catatan_minum_obat
      - Tabel log_aktivitas dan konten_statis
    accept:
      - Migrasi berhasil
      - Nomor estimasi tidak disimpan sebagai kolom (turunan)
    verify: ["npm run db:migrate"]
    evidence: "docs/01-laporan-unit/A11.md"
    status: todo

  - id: A12
    fase: F1
    area: db
    judul: Indeks, constraint, dan aturan append-only
    depends: [A11]
    paths: ["src/db/schema/**", "src/db/migrations/**"]
    input: ["prd-v0.3 §6", "prd-v0.3 §4.3"]
    langkah:
      - Indeks unik parsial satu janji aktif per slot
      - Unik nomor antrian per tanggal
      - Unik catatan minum per pasien, obat, tanggal
      - Tidak ada kolom updated_at pada audit_log
    accept:
      - Dua janji aktif pada slot sama ditolak database
      - Uji constraint lulus
    verify: ["npm test", "npm run db:migrate"]
    evidence: "docs/01-laporan-unit/A12.md"
    status: todo

  - id: A13
    fase: F1
    area: db
    judul: Seed admin individual dan data fiktif
    depends: [A12]
    paths: ["src/db/seed/admin.ts", "src/db/seed/klinik.ts", "src/db/seed/pasien.ts", "src/db/seed/index.ts", "package.json"]
    input: ["prd-v0.3 §4.2 Privacy"]
    langkah:
      - Dua akun admin terpisah
      - Dokter dan slot contoh
      - Pasien fiktif dengan riwayat, tanpa data nyata
      - Tidak membuat src/db/seed/konten.ts; berkas itu milik B13
    accept:
      - npm run db:seed idempoten
      - Admin bisa login setelah seed
      - Tidak ada NIK atau nama orang nyata
    verify: ["npm run db:seed"]
    evidence: "docs/01-laporan-unit/A13.md"
    status: todo

  - id: A14
    fase: F1
    area: lib
    judul: Modul waktu WIB dan util tanggal
    depends: [A04]
    paths: ["src/lib/waktu-wib.ts", "src/lib/waktu-wib.test.ts"]
    input: ["prd-v0.3 §4.2 Timezone"]
    langkah:
      - Fungsi awal hari, akhir hari, tambah hari, format id-ID
      - Semua memakai zona Asia/Jakarta
    accept:
      - 23:59 dan 00:01 WIB menghasilkan hari berbeda
      - 31 Jan plus 30 hari menghasilkan 28/29 Feb sesuai tahun
      - Uji lulus
    verify: ["npm test"]
    evidence: "docs/01-laporan-unit/A14.md"
    status: todo

  - id: A15
    fase: F1
    area: doc
    judul: Kontrak API v1
    depends: [A07, A12]
    paths: ["docs/api-contract.md"]
    input: ["prd-v0.3 §3.3", "prd-v0.3 §4.1"]
    langkah:
      - "Daftar endpoint per FR: method, path, peran, request, response, galat"
      - Sepakati nama field sebelum frontend mulai
    accept:
      - Setiap FR punya minimal satu endpoint tertulis
      - Bentuk respons sama dengan helper A07
    verify: []
    evidence: "docs/api-contract.md"
    status: todo

  - id: A16
    fase: F1
    area: doc
    judul: Dokumen skema database
    depends: [A12]
    paths: ["docs/database-schema.md"]
    input: ["prd-v0.3 §6"]
    langkah:
      - Tabel, kolom, tipe, kunci, relasi
      - Diagram Mermaid
      - Catatan constraint dan alasan
    accept:
      - Semua tabel di kode tercantum
      - Diagram dapat dirender
    verify: []
    evidence: "docs/database-schema.md"
    status: todo

  # ================= F2 — BACKEND =================

  - id: B01
    fase: F2
    area: api
    judul: FR-07 endpoint auth dan guard peran
    depends: [A06, A15]
    paths: ["src/app/api/auth/**", "src/modules/auth/**", "tests/integration/auth/**"]
    input: ["prd-v0.3 FR-07"]
    langkah:
      - POST masuk, POST keluar, GET saya
      - Batas percobaan login gagal
      - Guard peran pada setiap endpoint
    accept:
      - Tamu ditolak 401
      - Pasien ke endpoint admin ditolak 403
      - Uji lulus
    verify: ["npm test"]
    evidence: "docs/02-integration/B01.md"
    status: todo

  - id: B02
    fase: F2
    area: api
    judul: FR-01 profil kesehatan pasien
    depends: [B01]
    paths: ["src/app/api/profil/**", "src/modules/profil/**", "tests/integration/profil/**"]
    input: ["prd-v0.3 FR-01"]
    langkah:
      - GET dan PUT profil milik sendiri
      - Tolak ID pasien lain
      - Hapus profil dengan konfirmasi
    accept:
      - Pasien A tidak bisa membaca profil B
      - Data kembali persis seperti disimpan
    verify: ["npm test"]
    evidence: "docs/02-integration/B02.md"
    status: todo

  - id: B03
    fase: F2
    area: api
    judul: FR-03 slot dan janji dengan pencegahan bentrok
    depends: [B02, A14]
    paths: ["src/app/api/slot/**", "src/app/api/janji/**", "src/modules/janji/**", "tests/integration/janji/**"]
    input: ["prd-v0.3 FR-03", "prd-v0.3 §6"]
    langkah:
      - Daftar slot tersedia
      - Buat janji dengan transaksi dan tangkap pelanggaran indeks unik
      - Batalkan janji oleh pasien
    accept:
      - Dua permintaan serentak pada slot sama, tepat satu berhasil
      - Pesan galat jelas untuk yang kalah
    verify: ["npm test"]
    evidence: "docs/02-integration/B03.md"
    status: todo

  - id: B04
    fase: F2
    area: api
    judul: FR-08 usulan perubahan, TTL, dan pembatalan admin
    depends: [B03]
    paths: ["src/app/api/admin/usulan/**", "src/app/api/admin/janji/**", "src/modules/janji/**", "tests/integration/usulan/**"]
    input: ["prd-v0.3 FR-08", "prd-v0.3 open question 15"]
    langkah:
      - Admin mengusulkan slot baru dengan alasan wajib
      - Kunci slot sementara dengan expires_at
      - Pasien setuju, tolak, atau pilih slot lain
      - TTL habis melepas slot dan membatalkan usulan
    accept:
      - Usulan tanpa alasan ditolak
      - Tepat satu janji aktif setelah pasien setuju
      - TTL habis melepas slot
    verify: ["npm test"]
    evidence: "docs/02-integration/B04.md"
    status: todo

  - id: B05
    fase: F2
    area: api
    judul: FR-09 notifikasi dan tanggapan pasien
    depends: [B04]
    paths: ["src/app/api/notifikasi/**", "src/modules/notifikasi/**", "tests/integration/notifikasi/**"]
    input: ["prd-v0.3 FR-09"]
    langkah:
      - Daftar notifikasi milik sendiri
      - Tandai dibaca
      - Jawab usulan sekali saja
    accept:
      - Notifikasi pasien lain tidak terlihat
      - Jawaban kedua ditolak
    verify: ["npm test"]
    evidence: "docs/02-integration/B05.md"
    status: todo

  - id: B06
    fase: F2
    area: api
    judul: FR-10 audit log append-only
    depends: [B04]
    paths: ["src/modules/audit/**", "src/app/api/admin/audit/**", "tests/integration/audit/**"]
    input: ["prd-v0.3 FR-10"]
    langkah:
      - Helper catatAudit dipanggil pada setiap mutasi admin
      - Endpoint baca khusus admin
      - Tidak ada endpoint ubah atau hapus
    accept:
      - Setiap perubahan admin menghasilkan tepat satu catatan
      - Tidak ada rute DELETE
      - Pasien hanya melihat perubahan janjinya
    verify: ["npm test"]
    evidence: "docs/02-integration/B06.md"
    status: todo

  - id: B07
    fase: F2
    area: api
    judul: FR-04 antrian estimasi, final, dan tutup hari
    depends: [B03, B06]
    paths: ["src/app/api/antrian/**", "src/app/api/admin/antrian/**", "src/modules/antrian/**", "tests/integration/antrian/**"]
    input: ["prd-v0.3 FR-04", "prd-v0.3 §3.5"]
    langkah:
      - Nomor estimasi dihitung saat janji dibuat
      - Nomor final terbit saat check-in, unik per hari WIB
      - Transisi status divalidasi mesin status
      - Tutup hari menandai tidak hadir
    accept:
      - Check-in kedua ditolak
      - Transisi menunggu ke selesai langsung ditolak
      - Tidak hadir tercatat di audit
    verify: ["npm test"]
    evidence: "docs/02-integration/B07.md"
    status: todo

  - id: B08
    fase: F2
    area: api
    judul: FR-02 jadwal berulang, anchor, dan pengingat
    depends: [B03, A14]
    paths: ["src/app/api/jadwal/**", "src/modules/jadwal-kontrol/**", "tests/integration/jadwal/**"]
    input: ["prd-v0.3 FR-02"]
    langkah:
      - Aturan interval 7, 14, 30 hari dengan anchor tanggal
      - Pembangkit jadwal berikutnya saat kunjungan selesai
      - Pengingat idempoten tiga hari sebelum
    accept:
      - 31 Jan plus 30 hari benar untuk tahun kabisat
      - Pemanggilan ganda tidak menggandakan pengingat
    verify: ["npm test"]
    evidence: "docs/02-integration/B08.md"
    status: todo

  - id: B09
    fase: F2
    area: api
    judul: FR-12 catatan resep dan kepatuhan obat
    depends: [B03, A15]
    paths: ["src/app/api/obat/**", "src/app/api/admin/resep/**", "src/modules/resep-obat/**", "tests/integration/obat/**"]
    input: ["prd-v0.3 FR-12"]
    langkah:
      - Admin mencatat resep dengan sumber Fornas
      - Pasien menandai diminum, satu catatan per hari
      - Ringkasan kepatuhan dihitung
    accept:
      - Pasien tidak bisa menambah obat
      - Penandaan ganda tidak menggandakan baris
      - Label bukan saran medis tersedia di respons
    verify: ["npm test"]
    evidence: "docs/02-integration/B09.md"
    status: todo

  - id: B10
    fase: F2
    area: api
    judul: FR-13 timeline kunjungan
    depends: [B07, B09]
    paths: ["src/app/api/timeline/**", "src/modules/timeline/**", "tests/integration/timeline/**"]
    input: ["prd-v0.3 FR-13"]
    langkah:
      - Gabungkan janji, kunjungan, dan catatan obat
      - Urut terbaru, hanya milik pasien
    accept:
      - Tidak ada data pasien lain
      - Urutan kronologis benar
    verify: ["npm test"]
    evidence: "docs/02-integration/B10.md"
    status: todo

  - id: B11
    fase: F2
    area: api
    judul: FR-05 catatan kebiasaan dan ringkasan
    depends: [B02]
    paths: ["src/app/api/kebiasaan/**", "src/modules/kebiasaan/**", "tests/integration/kebiasaan/**"]
    input: ["prd-v0.3 FR-05"]
    langkah:
      - "CRUD catatan harian: hidrasi, tidur, aktivitas"
      - Validasi ambang dan jam tidur 0–24
      - Runtutan hari dan ringkasan kepatuhan
    accept:
      - Nilai batas bawah, tepat, dan atas dinilai benar
      - Tanggal bolong tidak menimbulkan galat
    verify: ["npm test"]
    evidence: "docs/02-integration/B11.md"
    status: todo

  - id: B12
    fase: F2
    area: api
    judul: FR-14 log aktivitas akun (opsional, dipotong pertama)
    depends: [B01]
    paths: ["src/app/api/aktivitas/**", "src/modules/aktivitas/**", "tests/integration/aktivitas/**"]
    input: ["prd-v0.3 FR-14"]
    langkah:
      - Catat masuk, keluar, ubah profil
      - Tampilkan hanya milik sendiri
    accept:
      - Append-only
      - Pasien lain tidak melihat
    verify: ["npm test"]
    evidence: "docs/02-integration/B12.md"
    status: todo

  - id: B13
    fase: F2
    area: api
    judul: FR-06 panel konten statis (opsional)
    depends: [B02]
    paths: ["src/app/api/konten/**", "src/modules/konten/**", "src/db/seed/konten.ts"]
    input: ["prd-v0.3 FR-06"]
    langkah:
      - Data konten dengan URL sumber dan tanggal ambil
      - Tampil hanya bila kondisi terkait ada di profil
    accept:
      - Konten tanpa kondisi tidak muncul
      - Setiap entri punya sumber
    verify: ["npm test"]
    evidence: "docs/02-integration/B13.md"
    status: todo

  # ================= F3 — FRONTEND =================

  - id: C01
    fase: F3
    area: ui
    judul: Layout, token desain, dan komponen dasar
    depends: [A02]
    paths: ["src/app/layout.tsx", "src/app/globals.css", "src/components/**", "src/styles/**"]
    input: ["design/02-wireframe-pasien.md", "design/04-state-dan-copy.md"]
    langkah:
      - Token warna, jarak, tipografi 16 px dasar
      - Tombol, input, kartu, badge status, dialog
      - Target sentuh minimal 44 px, kontras 4.5:1
    accept:
      - Komponen dapat dipakai ulang
      - Fokus keyboard terlihat
    verify: ["npm run build"]
    evidence: "docs/03-system-uat/C01.md"
    status: todo

  - id: C02
    fase: F3
    area: ui
    judul: Layar publik, masuk, dan daftar
    depends: [C01, B01]
    paths: ["src/app/(publik)/**", "src/app/(pasien)/layout.tsx"]
    input: ["design/02-wireframe-pasien.md P1–P4"]
    langkah:
      - Beranda, masuk, daftar
      - Galat login jelas, loading, redirect sesuai peran
    accept:
      - Tamu tidak bisa masuk area pasien
      - Admin diarahkan ke area admin
    verify: ["npm run build", "npm run test:e2e"]
    evidence: "docs/03-system-uat/C02.md"
    status: todo

  - id: C03
    fase: F3
    area: ui
    judul: Profil dan jadwal kontrol
    depends: [C02, B02, B08]
    paths: ["src/app/(pasien)/profil/**", "src/app/(pasien)/jadwal-kontrol/**"]
    input: ["design/02-wireframe-pasien.md P5–P8"]
    accept:
      - Profil tampil dan dapat disimpan
      - Agenda list default, toggle bulan berfungsi
      - Status kosong memberi langkah berikutnya
    verify: ["npm run build", "npm run test:e2e"]
    evidence: "docs/03-system-uat/C03.md"
    status: todo

  - id: C04
    fase: F3
    area: ui
    judul: Janji dan antrian
    depends: [C03, B03, B07]
    paths: ["src/app/(pasien)/janji/**", "src/app/(pasien)/antrian/**"]
    input: ["design/02-wireframe-pasien.md P9"]
    accept:
      - Nomor estimasi berlabel perkiraan
      - Nomor final tampil setelah check-in
      - Pesan slot terisi jelas
    verify: ["npm run build", "npm run test:e2e"]
    evidence: "docs/03-system-uat/C04.md"
    status: todo

  - id: C05
    fase: F3
    area: ui
    judul: Obat, timeline, notifikasi, aktivitas
    depends: [C04, B09, B10]
    paths: ["src/app/(pasien)/obat/**", "src/app/(pasien)/timeline/**", "src/app/(pasien)/notifikasi/**", "src/app/(pasien)/aktivitas/**"]
    input: ["design/02-wireframe-pasien.md P13–P16"]
    accept:
      - Label catatan resep bukan saran medis terlihat
      - Timeline urut terbaru
      - Tombol jawab usulan maksimal 3 ketukan
    verify: ["npm run build", "npm run test:e2e"]
    evidence: "docs/03-system-uat/C05.md"
    status: todo

  - id: C06
    fase: F3
    area: ui
    judul: Area admin K1–K4
    depends: [C02, B04, B07]
    paths: ["src/app/(admin)/admin/layout.tsx", "src/app/(admin)/admin/page.tsx", "src/app/(admin)/admin/janji/**", "src/app/(admin)/admin/antrian/**", "src/app/(admin)/admin/slot/**", "src/app/(admin)/admin/aturan-kontrol/**"]
    input: ["design/03-wireframe-klinik.md K1–K4"]
    accept:
      - Pasien ditolak dari seluruh rute admin
      - Antrian punya lima status termasuk tidak hadir
      - Tutup hari berfungsi
    verify: ["npm run build", "npm run test:e2e"]
    evidence: "docs/03-system-uat/C06.md"
    status: todo

  - id: C07
    fase: F3
    area: ui
    judul: Area admin K5–K7
    depends: [C06, B06, B09]
    paths: ["src/app/(admin)/admin/resep/**", "src/app/(admin)/admin/usulan/**", "src/app/(admin)/admin/audit-log/**"]
    input: ["design/03-wireframe-klinik.md K5–K7"]
    accept:
      - Catat resep tanpa tombol saran obat
      - Usulan wajib beralasan
      - Audit log hanya baca
    verify: ["npm run build", "npm run test:e2e"]
    evidence: "docs/03-system-uat/C07.md"
    status: todo

  - id: C08
    fase: F3
    area: ui
    judul: State, aksesibilitas, dan responsif
    depends: [C02, C03, C04, C05, C06, C07, C09]
    paths: ["src/components/**", "src/styles/**", "src/app/(publik)/**", "src/app/(pasien)/**", "src/app/(admin)/**"]
    input: ["design/04-state-dan-copy.md"]
    accept:
      - Loading, galat, kosong, sukses ada di semua layar inti
      - Kontras 4.5:1, target 44 px, teks 16 px
      - Alur inti selesai dengan keyboard
      - Lebar 360 px tidak rusak
    verify: ["npm run build", "npm run test:e2e"]
    evidence: "docs/03-system-uat/C08.md"
    status: todo

  - id: C09
    fase: F3
    area: ui
    judul: Layar kebiasaan harian dan ringkasan kepatuhan
    depends: [C03, B11]
    paths: ["src/app/(pasien)/kebiasaan/**"]
    input: ["design/02-wireframe-pasien.md P10-P11", "prd-v0.3 FR-05"]
    langkah:
      - Form catatan hari ini dengan pengatur tambah/kurang untuk air minum dan aktivitas
      - Jam tidur mulai dan bangun, durasi dihitung di layar
      - Riwayat 7 hari di bagian bawah layar yang sama
      - Layar ringkasan di kebiasaan/ringkasan: persentase, runtutan, rincian per jenis
      - Tanggal hanya hari ini; hari lampau dibaca lewat riwayat, bukan isian bebas
    accept:
      - Jam di luar 00.00-23.59 ditolak dengan naskah "Jam harus antara 00.00 dan 23.59"
      - Isian bukan angka ditolak dengan naskah "Isi jam dengan angka, contoh 22.30"
      - Semua angka ringkasan dapat dihitung ulang dari data yang tampil
      - State kosong menampilkan "Belum ada catatan. Mulai dari hari ini." beserta tombolnya
      - Tidak membuat layar konten statis; P12 tidak dibangun
    verify: ["npm run build", "npm run test:e2e"]
    evidence: "docs/03-system-uat/C09.md"
    status: todo

  # ================= F4 - UJI & RILIS =================

  - id: D01
    fase: F4
    area: test
    judul: Integration test per FR
    depends: [B01, B02, B03, B04, B05, B06, B07, B08, B09, B10, B11]
    paths: ["tests/integration/**"]
    input: ["plan/03-fitur-dan-rencana-uji.md"]
    accept:
      - Setiap FR punya minimal satu berkas uji
      - Uji rebutan slot dan TTL lulus
    verify: ["npm test"]
    evidence: "docs/02-integration/D01.md"
    status: todo

  - id: D02
    fase: F4
    area: test
    judul: Security test
    depends: [B01, B02, B03, B04, B05, B06, B07, B08, B09, B10, B11]
    paths: ["tests/security/**"]
    input: ["prd-v0.3 §4.2 Security"]
    accept:
      - ID URL lintas pasien ditolak
      - Tamu ditolak
      - Pasien ke endpoint admin ditolak
      - Tidak ada kredensial di kode
    verify: ["npm test"]
    evidence: "docs/04-bukti-security/D02.md"
    status: todo

  - id: D03
    fase: F4
    area: test
    judul: E2E 10 langkah
    depends: [C08, D01]
    paths: ["tests/system/**", "playwright.config.ts"]
    input: ["plan/03-fitur-dan-rencana-uji.md system test"]
    accept:
      - Sepuluh langkah lulus berurutan
      - Bukti tangkapan layar tersimpan
    verify: ["npm run test:e2e"]
    evidence: "docs/03-system-uat/D03.md"
    status: todo

  - id: D04
    fase: F4
    area: test
    judul: Uji beban autocannon
    depends: [D03]
    paths: ["tests/performance/**", "package.json"]
    input: ["prd-v0.3 4.2 Performance"]
    accept:
      - 50-100 permintaan bersamaan pada janji dan antrian
      - p95 di bawah 2 detik tercatat
    verify: ["npx autocannon --help"]
    evidence: "docs/05-bukti-performa/D04.md"
    status: todo

  - id: D05
    fase: F4
    area: test
    judul: UAT dan kuesioner SUS
    depends: [D03]
    paths: ["tests/uat/**", "docs/03-system-uat/**"]
    input: ["prd-v0.3 7.4", "design/01-peta-alur.md"]
    accept:
      - Skrip UAT bertanda tangan minimal satu penguji luar
      - Skor SUS dihitung
    verify: []
    evidence: "docs/03-system-uat/D05.md"
    status: todo

  - id: D06
    fase: F4
    area: ops
    judul: Bukti uji lengkap dan deploy final
    depends: [D01, D02, D03, D04, D05]
    paths: ["docs/**", "README.md"]
    input: ["prd-v0.3 7.4"]
    accept:
      - Lima folder bukti terisi
      - Hosting final hidup 2 Nov 2026
      - Checklist PRD §7.4 tercentang
    verify: ["npm run build"]
    evidence: "docs/03-system-uat/D06.md"
    status: todo
```

---

## 5. Gerbang

| Gerbang | Syarat | Tugas penutup |
|---|---|---|
| **G0** | Skeleton hidup di Vercel, `npm test` hijau, admin bisa login | A09 |
| **G1** | Migrasi lengkap, seed jalan, kontrak API tertulis | A16 |
| **G2** | Uji rebutan slot lulus, uji ID URL lulus, audit log terbukti | D01 + D02 |
| **G3** | Seluruh alur inti selesai lewat UI | C01-C09 |
| **G4** | Deploy final, bukti lengkap, UAT bertanda tangan | D06 |

Bila gerbang gagal: potong sesuai urutan di `to-do.md` §5. Jangan kurangi uji.

---

## 6. Definisi selesai universal

Sebuah tugas `done` hanya bila:

1. Seluruh `accept` terbukti, bukan diasumsikan.
2. `verify` dijalankan dan lulus.
3. Bukti ditulis di berkas `evidence`.
4. Status dan tanggal di berkas ini diperbarui.
5. Satu commit dengan pesan `ID: judul`.
6. Tidak ada berkas di luar `paths` yang berubah (`git status` bersih selain itu).

---

## 7. Larangan

Agen tidak boleh:

- Mengubah PRD v0.3 atau dokumen di repo perencanaan.
- Menambah dependensi di luar daftar.
- Membuat komponen desain baru di luar `src/components/`.
- Memakai `any` tanpa alasan tertulis.
- Menonaktifkan uji agar lulus.
- Menyimpan kredensial di kode atau commit `.env`.
- Menjalankan `push --force` atau `reset --hard`.
- Menganggap UI sudah aman tanpa pemeriksaan server.

---

## 8. Format laporan akhir tugas

Setiap laporan ke pemilik proyek memakai bentuk ini:

```
TUGAS: A03
STATUS: done
PERUBAHAN: 3 berkas (daftar)
UJI: lint OK, typecheck OK, unit 4/4 OK, build OK
BUKTI: docs/01-laporan-unit/A03.md
CATATAN: <kosong atau satu baris>
```

Bila `blocked`:

```
TUGAS: B04
STATUS: blocked
SEBAB: <satu kalimat>
BUTUH: <keputusan atau berkas yang diperlukan>
```

---

## Tautan

- [To-Do Eksekusi](to-do.md) - urutan dan gerbang
- [PRD v0.3 (kanonik)](prd-v0.3.md)
- [Yang Perlu Diinstal](yang-perlu-diinstal.md)
- [Hirarki Folder Kode](hirarki.md)
- [Fitur dan Rencana Uji](rencana-uji.md)
