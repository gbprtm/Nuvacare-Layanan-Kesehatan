> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

# To-Do Eksekusi

Dokumen ini **menggantikan seluruh versi sebelumnya**. Perubahan besar:
tech stack sudah dikunci, biaya harus **Rp0**, dan tidak ada kerja kelompok.
Seluruh tugas dieksekusi oleh agen di bawah arahan pemilik proyek.

Daftar tugas yang bisa dibaca agen ada di `rencana-agen.md`.
Berkas ini menjelaskan **urutan, gerbang, dan batas**; berkas itu menjelaskan
**tugas satu per satu**.

---

## 0. Stack terkunci (tidak dibuka lagi)

| Bagian | Nilai | Catatan |
|---|---|---|
| Framework | Next.js (App Router) | Frontend dan backend dalam satu proyek |
| Bahasa | TypeScript strict | `strict: true`, tanpa `any` tanpa alasan |
| Backend | Route Handlers | Tidak ada server terpisah |
| Database | PostgreSQL | Wajib cloud, karena Vercel tidak bisa akses lokal |
| ORM | Drizzle ORM + drizzle-kit | Sesuai `hirarki/` |
| Validasi | zod | Dipakai server dan formulir |
| Sesi | `jose` + `bcryptjs` | Cookie httpOnly, aman di Edge |
| Tanggal | `date-fns` + `@date-fns/tz` | Satu modul `waktu-wib.ts` |
| Styling | Tailwind CSS | Bawaan scaffold, tanpa pustaka UI tambahan |
| Unit test | Vitest + Testing Library | |
| E2E test | Playwright | Chromium saja |
| Uji beban | autocannon | Bukan k6 |
| Hosting | Vercel Hobby | Free, tanpa CLI |
| Database cloud | Neon Free | Utama; Supabase Free hanya cadangan |
| Package manager | npm | Sudah terpasang |

**Tidak ada opsi lain yang dipertimbangkan.** Bila ada yang ingin mengganti,
harus lewat pemilik proyek, bukan keputusan agen.

---

## 1. Biaya: Rp0

Dicek 25 Oktober 2026. Semua di bawah **tidak memerlukan kartu kredit**.

| Layanan | Paket | Batas gratis | Cukup untuk proyek ini? |
|---|---|---|---|
| Neon | Free | 1 GB penyimpanan, 100 CU-jam/bulan, 10 branch, 5 GB transfer | **Ya.** Data demo ±10 akun jauh di bawah 1 GB |
| Vercel | Hobby | 100 GB transfer, 1 juta invokasi fungsi, 300 detik/fungsi | **Ya.** |
| GitHub | Free | Repo privat + Actions 2.000 menit/bulan | **Ya.** |
| Neon (uji) | Free | Branch `test` dalam project yang sama | **Ya.** |

Catatan yang harus diingat:

1. **Neon menidurkan database setelah 5 menit idle** dan bangun otomatis saat
   ada permintaan. Permintaan pertama setelah lama diam bisa terasa lambat.
   Sebelum presentasi, buka aplikasi sekali untuk "memanaskan" database.
2. **Vercel Hobby hanya untuk non-komersial.** Proyek mata kuliah termasuk
   kategori ini. Jangan menambahkan iklan, pembayaran, atau donasi.
3. **Batas keras, bukan tagihan.** Kalau batas terlampaui, layanan berhenti
   sementara — tidak ada tagihan kejutan.
4. **Jangan memakai Supabase Free sebagai utama** karena proyeknya
   dijeda setelah 7 hari tanpa aktivitas, dan ukurannya hanya 500 MB.

---

## 2. Kondisi repo kode saat ini

| Hal | Status |
|---|---|
| Lokasi | `C:\Users\HYPE AMD\Documents\project` |
| Isi | Hanya `index.html` 244 B dan `README.md` 25 B |
| `package.json` | **Belum ada** |
| Folder `.env` | **Ada, tetapi berupa folder** — harus dihapus, lalu dibuat berkas |
| Branch | Lokal `master`; remote `origin/HEAD` → `brach-A` (salah ketik) |
| Hosting | Belum |
| Database | Belum |

### 2.1 Jembatan ke repo kode

Vault ini **rancangan**; repo kode **kerja**. Keduanya disambung tanpa
menyalin dokumen, supaya tidak ada dua versi yang melenceng.

| Lapisan | Berkas | Fungsi |
|---|---|---|
| Akses | `project/opencode.jsonc` → reference `rancangan` | Agen di repo kode bisa membaca vault lewat path absolut |
| Instruksi | `project/AGENTS.md` (133 baris) | Aturan, perintah, loop tugas, larangan |
| Peta | `project/docs/peta-bagian.md` | FR → potongan PRD → layar → modul kode |
| Status | `project/docs/status-tugas.md` | Status 44 tugas, ikut commit tiap tugas |
| Salinan baca | `project/docs/rancangan/` (13 berkas) | Agar repo bisa dipahami orang lain tanpa akses ke vault; dibuat oleh `scripts/sinkron-rancangan.ps1` |

Aturan satu arah:

1. **Vault read-only** dari sisi repo kode. Agen tidak menulis ke sini.
2. **Status hanya di repo kode.** Field `status` di `rencana-agen.md` adalah
   snapshot dan tidak diperbarui.
3. Dokumen yang lahir dari kode (kontrak API, skema database, bukti uji)
   tinggal di repo kode, tidak disalin balik ke vault.
4. PRD dan wireframe dibaca dari vault, atau dari salinan baca di
   `docs/rancangan/` bila repo dibuka orang lain. Agen tetap membaca potongan
   yang ditunjuk `peta-bagian.md`, bukan seluruh berkas.

Efek pada konteks: satu tugas butuh ±3.000 token (AGENTS.md + satu blok tugas +
satu baris peta + satu potongan PRD), bukan ±30.000 token untuk membaca PRD,
rencana, dan wireframe sekaligus.

---

## 3. Aturan eksekusi

1. **Satu tugas, satu agen.** Tidak ada pembagian tugas antar anggota, tidak
   ada sprint kelompok, tidak ada papan tugas tim.
2. Pemilik proyek memberi arahan, menyetujui keputusan, dan memeriksa hasil.
   Pemilik proyek **tidak mengerjakan tugas teknis**.
3. Agen hanya boleh mengubah berkas yang tercantum di `paths` pada
   `rencana-agen.md`.
4. Tidak ada dependensi baru tanpa persetujuan. Daftar paket yang diizinkan
   ada di `saran/yang-perlu-diinstal.md`.
5. PRD v0.3 adalah sumber kebenaran. Bila tugas bertentangan dengan PRD,
   agen berhenti dan melapor — tidak menebak.
6. Setiap tugas wajib menambah atau memperbarui uji.
7. Sebelum menyatakan selesai, empat perintah ini wajib hijau:
   `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
8. Gerbang tidak boleh dilewati. Bila gerbang gagal, **potong fitur**, jangan
   kurangi uji.
9. Tidak ada `commit` langsung ke `main` selama fase 2 dan 3.
10. Semua tanggal dihitung WIB melalui `src/lib/waktu-wib.ts`. Tidak ada
    perhitungan tanggal di tempat lain.

---

## 4. Gelombang dan gerbang

| Gelombang | Tugas | Isi | Gerbang |
|---|---|---|---|
| **F0 Fondasi** | A01–A09 | Repo, scaffold, env, Drizzle, auth, runner test, CI, deploy skeleton | **G0**: aplikasi skeleton hidup di Vercel, `npm test` hijau |
| **F1 Data** | A10–A16 | Skema lengkap, constraint, seed, modul WIB, kontrak API, dokumen skema | **G1**: migrasi jalan, seed admin bisa login, kontrak API tertulis |
| **F2 Backend** | B01–B13 | Semua endpoint FR-01…FR-14 + uji per fitur | **G2**: uji rebutan slot dan uji ID URL lulus |
| **F3 Frontend** | C01-C09 | 15 layar pasien + 7 layar admin + state + aksesibilitas; P12 konten tidak dibangun | **G3**: seluruh alur inti bisa diselesaikan lewat UI |
| **F4 Uji & rilis** | D01–D06 | Integration, security, e2e 10 langkah, beban, UAT, bukti, deploy final | **G4**: deploy final hidup, bukti uji lengkap |

Urutan rinci tiap tugas, dependensi, dan kriteria terima ada di
`rencana-agen.md` bagian 4.

### Aturan paralel

Dua agen boleh bekerja bersamaan **hanya bila**:

- `depends` keduanya sudah `done`, dan
- daftar `paths` keduanya **tidak beririsan**.

Beririsan dengan tugas yang sudah `done` tidak dihitung, karena berkas itu tidak
akan disentuh lagi. Tiga berkas dipakai hampir semua tugas dan **tidak boleh
paralel** meski satu fase: `package.json`, `src/db/schema/index.ts`, dan
`src/db/migrations/**`.

Contoh yang aman: agen backend mengerjakan B03 (folder `src/modules/janji/`)
sementara agen frontend mengerjakan C02 (folder `src/app/(publik)/`).
Contoh yang tidak aman: dua agen menyentuh `src/db/schema/` bersamaan.

---

## 5. Urutan pemangkasan (bila G2 atau G3 gagal)

1. **B12 - FR-14 log aktivitas akun.** Dihentikan.
2. **B13 - FR-06 panel konten statis.** Dihentikan, jadi slide presentasi.
3. **B11 - FR-05 catatan kebiasaan.** Diringkas jadi hidrasi + tidur saja;
   C09 ikut diringkas ke dua jenis itu.
4. Bila masih kurang: B11 dan C09 dipotong seluruhnya, cerita presentasi ditulis
   ulang tanpa kebiasaan.

**FR-06 (P12 panel konten statis) tidak dibangun sejak awal.** Layar itu tidak
punya tugas frontend; bila nanti dibangun, tambahkan tugas baru dengan `paths`
`src/app/(pasien)/konten/**`. Pemotongannya tidak mengubah jumlah tugas C.

**Tidak boleh dipotong dalam keadaan apa pun:** B01, B03, B04, B05, B06, B09,
B10 (FR-07, FR-03, FR-08, FR-09, FR-10, FR-12, FR-13).

---

## 6. Bukti uji yang wajib ada

| Folder | Isi minimal |
|---|---|
| `docs/01-laporan-unit/` | Keluaran Vitest per FR + kasus batas tanggal dan WIB |
| `docs/02-integration/` | Check-in → jadwal berikutnya, alur usulan, kepatuhan obat |
| `docs/03-system-uat/` | Tabel 10 langkah, skrip UAT bertanda tangan, SUS |
| `docs/04-bukti-security/` | Percobaan ID URL, akses tamu, otorisasi peran |
| `docs/05-bukti-performa/` | Skrip autocannon + tabel p95 |

---

## 7. Larangan

Tidak boleh masuk pekerjaan tanpa persetujuan pemilik proyek:

- Integrasi SATUSEHAT
- Push notification, email, WhatsApp
- Rekomendasi obat otomatis
- Akun dokter dengan login
- Pembayaran, farmasi, resep elektronik
- Aplikasi mobile native
- Pustaka UI pihak ketiga (shadcn, MUI, Chakra)
- Prisma, Mongoose, Jest, Cypress
- Pnpm, Yarn, Docker
- Vercel CLI

Ide baru ditulis di `perbaikan-selanjutnya.md` bagian "Ide Baru".

---

## 8. Lima tugas pertama

Agen yang baru mulai mengerjakan urutan ini, tanpa bertanya:

1. **A01** — rapikan repo (branch `main`, hapus folder `.env`, arsipkan `index.html`)
2. **A02** — scaffold Next.js + Tailwind + TypeScript strict
3. **A03** — `.env.example` dan pembacaan env yang tervalidasi
4. **A04** — Drizzle + koneksi Neon + migrasi kosong pertama
5. **A05** — skema `users` dan `sessions`

Setelah A05 selesai, lanjut ke A06–A09 untuk menutup gerbang **G0**.

---

## Tautan

- [Rencana Kerja Agen](rencana-agen.md) - daftar tugas yang bisa dieksekusi
- [PRD v0.3 (kanonik)](prd-v0.3.md)
- Perbaikan Selanjutnya
- [Fitur dan Rencana Uji](rencana-uji.md)
- [Risiko dan Tindak Lanjut](risiko.md)
- [Hirarki Folder Kode](hirarki.md)
