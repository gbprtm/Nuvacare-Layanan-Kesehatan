> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

# Yang Perlu Diinstal

Hasil pengecekan `saran/pertimbangan.md` terhadap rancangan yang ada
(PRD v0.3, `design/`, `plan/`, `to-do`, `hirarki/`, dan isi repo kode).

> **Berkas ini hanya daftar.** Tidak ada paket, alat, database, atau layanan
> yang dipasang saat berkas ini dibuat. Semua perintah di bagian 4
> **belum dijalankan** dan jangan dijalankan sebelum keputusan di bagian 6
> diambil.

---

## 0. Ringkasan

`pertimbangan.md` menjawab pertanyaan yang paling lama menggantung: **tech stack**.
Tapi adopsinya belum tercatat di dokumen mana pun, dan masih menyisakan
celah yang tidak dibahas di dalamnya.

| Temuan                                                    | Jumlah             |
| --------------------------------------------------------- | ------------------ |
| Keputusan yang sudah dijawab `pertimbangan.md`            | 7                  |
| Dokumen wajib (bagian 7 `pertimbangan.md`) yang belum ada | **4 dari 6**       |
| Keputusan teknis yang **tidak** dibahas `pertimbangan.md` | **8**              |
| Paket wajib dipasang                                      | 27                 |
| Paket opsional                                            | 7                  |
| Layanan eksternal yang harus dipilih                      | 3, semuanya gratis |
| Bug struktur repo yang harus dibereskan lebih dulu        | 3                  |

Kesimpulan singkat: **stack-nya sudah jelas, tapi belum bisa langsung dipasang.**
Tiga hal memblokir: pemilihan database terkelola, cara autentikasi, dan
kontrak API. Tanpa ketiganya, instalasi akan menghasilkan proyek yang jalan
tetapi tidak sesuai PRD (sesi, peran, dan WIB belum ada tempatnya).

---

## 1. Yang sudah dijawab `pertimbangan.md`

| Keputusan | Isi `pertimbangan.md` | Status di rancangan sekarang |
|---|---|---|
| Framework | Next.js (satu proyek, frontend + backend) | PRD bagian 6 masih "belum diputuskan"; open question 1 masih **Terlambat** |
| Bahasa | TypeScript di semua lapisan | Belum tertulis di PRD |
| Backend | Next.js Route Handlers | Cocok dengan `hirarki/` yang sudah punya `src/app/api/` |
| Database + ORM | PostgreSQL + Drizzle ORM | `hirarki/` sudah punya `src/db/schema`, `migrations`, `seed` dan `drizzle.config.ts` - **konsisten** |
| Unit test | Vitest | `plan/03` baru menyebut "runner test", belum memilih |
| E2E test | Playwright | `plan/03` menyebut "system test" tanpa alat |
| Hosting | Vercel | open question 9 masih **Terlambat**; `to-do` butir 19 belum |

Artinya: `hirarki yang diusulkan.md` **sudah sejalan** dengan `pertimbangan.md`.
Yang belum ada adalah catatan resminya. PRD bagian 6 dan open question 1/9
harus ditutup dengan merujuk berkas ini, bukan dibiarkan "belum diputuskan".

---

## 2. Yang kurang dan belum ada di rancangan

### 2a. Dokumen wajib menurut bagian 7 `pertimbangan.md`

| Dokumen | Kondisi sekarang | Dampak bila dibiarkan |
|---|---|---|
| `AGENTS.md` (repo kode) | **Tidak ada.** Yang ada hanya `AGENTS.md` di repo dokumen ini, isinya aturan menulis dokumen, bukan aturan menulis kode | Agen coding tidak punya batas folder dan aturan commit |
| `docs/requirements.md` | **Tidak ada di repo kode.** Kebutuhannya ada, tetapi di repo lain (`docs/produk/prd-v0.3.md`) | Dua sumber kebenaran; agen coding tidak melihat PRD |
| `docs/database-schema.md` | **Tidak ada.** `to-do` butir 5 menyebut "skema data" sebagai pekerjaan, bukan dokumen | Tahap 2 `pertimbangan.md` tidak punya keluaran tertulis |
| `docs/api-contract.md` | **Tidak ada sama sekali** - tidak disebut di PRD, `plan/`, `design/`, maupun `to-do` | Frontend dan backend tidak bisa dikerjakan paralel; ini celah proses terbesar |
| `docs/architecture.md` | **Tidak ada.** `docs/adr/` ada tetapi kosong | Keputusan "kenapa Next.js/Vercel" tidak punya jejak |
| `docs/testing.md` | **Tidak ada.** `plan/03` berisi *apa* yang diuji, bukan *cara menjalankan* | Penguji luar tim tidak bisa menjalankan test sendiri |

Catatan penting: sekarang ada **dua folder `docs/`** - satu di repo dokumen ini
(perencanaan) dan satu di repo kode (kosong). Harus ditetapkan mana pemilik
`requirements.md`, `database-schema.md`, `api-contract.md`, `architecture.md`,
dan `testing.md`. Usulan: kelimanya di **repo kode**, dan PRD v0.3 disalin
ke sana sebagai `docs/requirements.md` agar satu arah: PRD kanonik tetap di
repo dokumen, salinan di repo kode untuk dipakai agen.

### 2b. Keputusan teknis yang tidak dibahas `pertimbangan.md`

| # | Celah | Kenapa penting untuk proyek ini | Usulan |
|---|---|---|---|
| T1 | **Pustaka autentikasi** | PRD butuh 2 role, batas sesi tidak aktif, batas percobaan login, hash kata sandi, tanpa reset password | Sesi sendiri: `jose` (JWT di cookie httpOnly) + `bcryptjs` + tabel `sesi`. Lebih kecil dari Auth.js dan tidak menambah dependensi besar |
| T2 | **Validasi input** | `pertimbangan.md` minta "validasi di sisi server" tanpa menyebut alat | `zod`, dipakai bersama untuk Route Handler dan formulir |
| T3 | **Styling / komponen UI** | 16 layar pasien + 7 layar admin di `design/` butuh dasar visual | Tailwind (ikut `create-next-app`) atau CSS Modules bawaan. Harus dipilih sebelum scaffold |
| T4 | **Driver PostgreSQL** | Drizzle butuh driver; pilihan menentukan bisa/tidaknya jalan di Vercel | `postgres` (postgres.js) untuk Node runtime; `@neondatabase/serverless` bila memakai Neon dan butuh Edge |
| T5 | **Database terkelola** | Vercel **tidak bisa** menjalankan PostgreSQL lokal. Ini konsekuensi yang tidak tertulis di `pertimbangan.md` | Neon / Supabase / Vercel Postgres. Neon paling sedikit langkah karena tidak perlu Docker |
| T6 | **Perhitungan WIB** | PRD mewajibkan satu "hari" mulai 00:00 WIB; nomor antrian dan pengingat bergantung padanya | Simpan `timestamptz`, hitung dengan `date-fns` + `@date-fns/tz`, satu modul `lib/waktu-wib.ts` seperti di `hirarki/` |
| T7 | **Database untuk test** | Uji "rebutan slot" butuh database nyata, bukan tiruan | Satu database uji terpisah + migrasi dijalankan sebelum test; bersihkan dengan transaksi per test |
| T8 | **Alat uji beban** | `plan/03` mewajibkan p95 untuk 50-100 permintaan | `autocannon` (npm, tanpa instalasi biner) daripada k6 (butuh unduh biner terpisah) |

### 2c. Konsekuensi stack yang belum tercatat di rancangan

1. **Vercel + PostgreSQL lokal tidak kompatibel.** Semua dokumen masih
   mengasumsikan database bisa lokal. Harus diganti menjadi database terkelola
   sejak hari pertama, atau pengembangan lokal memakai salinan database cloud.
2. **Middleware Next.js berjalan di Edge runtime secara default.** Edge tidak
   bisa memakai driver Postgres biasa. Pemeriksaan sesi di middleware harus
   memakai cookie bertanda tangan (JWT), bukan `SELECT` ke tabel `sesi`.
   Nama berkasnya (`middleware.ts` atau `proxy.ts`) berbeda antar versi Next -
   harus dicek saat scaffold, `hirarki/` masih menulis `middleware.ts`.
3. **Pooling koneksi.** Vercel membuat banyak instance fungsi; koneksi
   database bisa habis. URL database harus memakai koneksi ber-pooling.
4. **`index.html` 244 baris di repo kode** akan bertabrakan dengan Next.js.
   Harus dipindahkan ke `_arsip/` atau dihapus sebelum scaffold.
5. **`.env` di repo kode adalah folder kosong, bukan berkas.** Ini akan
   membingungkan `dotenv` dan `create-next-app`. Harus dihapus, lalu dibuat
   berkas `.env` dan `.env.example`.
6. **Branch default belum benar.** Remote `origin/HEAD` menunjuk `brach-A`
   (salah ketik), lokal di `master`. Harus dirapikan sebelum mengundang agen
   bekerja di branch terpisah seperti aturan bagian 6 `pertimbangan.md`.

---

## 3. Yang perlu diinstal

### 3a. Prasyarat mesin (status di laptop ini, 25 Okt 2026)

| Alat | Status | Perlu tindakan | Catatan |
|---|---|---|---|
| Node.js | **Ada** v22.19.0 | tidak | Memenuhi syarat Next.js terbaru |
| npm | **Ada** | tidak | Dipakai sebagai package manager; pnpm tidak perlu |
| Git | **Ada** v2.51.0 | tidak | |
| Docker | Tidak ada | **tidak perlu** | Hanya bila memaksa PostgreSQL lokal; rencana memakai database cloud |
| psql | Tidak ada | tidak perlu | Cukup pakai GUI Neon/Supabase |
| Vercel CLI | Tidak ada | **tidak perlu** | Deploy lewat integrasi GitHub; CLI dicoret dari daftar |
| MongoDB | **Ada** (lokal) | **tidak dipakai** | Proyek memakai PostgreSQL. Port berbeda (27017 vs 5432), tidak bentrok, tidak perlu di-uninstall |
| k6 | Tidak ada | tidak perlu | Diganti `autocannon` |
| Browser Playwright | Belum | **perlu** | Diunduh per proyek, ±150 MB |

### 3b. Paket runtime (wajib)

| Paket | Untuk apa |
|---|---|
| `next` | Framework + Route Handlers |
| `react`, `react-dom` | Antarmuka |
| `drizzle-orm` | Akses database |
| `postgres` | Driver PostgreSQL |
| `zod` | Validasi input bersama |
| `jose` | Tanda tangan cookie sesi (aman di Edge) |
| `bcryptjs` | Hash kata sandi tanpa build native |
| `date-fns` + `@date-fns/tz` | Aritmetika tanggal dan WIB |

### 3c. Paket pengembangan (wajib)

| Paket | Untuk apa |
|---|---|
| `typescript`, `@types/node`, `@types/react`, `@types/react-dom` | Tipe |
| `drizzle-kit` | Membuat dan menjalankan migrasi |
| `tsx` | Menjalankan skrip seed/migrasi |
| `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths` | Unit + integration test |
| `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` | Uji komponen |
| `@playwright/test` | Uji end-to-end |
| `eslint`, `eslint-config-next`, `prettier` | Standar kode |

### 3d. Paket opsional (hanya bila dipilih)

| Paket | Kapan dipakai |
|---|---|
| `tailwindcss` + `@tailwindcss/postcss` | Bila keputusan T3 memilih Tailwind |
| `@neondatabase/serverless` | Bila memakai Neon dan butuh akses dari Edge |
| `autocannon` | Uji beban (pengganti k6) |
| `clsx`, `tailwind-merge` | Bila memakai Tailwind dan komponen bersama |
| `@types/bcryptjs` | Hanya bila `bcryptjs` tidak membawa tipe sendiri - cek saat install |

### 3e. Layanan eksternal (bukan paket)

| Layanan | Wajib? | Catatan |
|---|---|---|
| Neon Free | **Wajib** | 1 GB, 100 CU-jam/bulan, tidur setelah 5 menit idle. Dipilih 25 Okt |
| Vercel Hobby | **Wajib** | Gratis untuk non-komersial. Cukup integrasi GitHub, tanpa CLI |
| GitHub Actions | Opsional untuk rilis, tetapi `hirarki/` sudah merencanakannya | Butuh service container PostgreSQL di runner |

### 3f. Yang **tidak** perlu diinstal

Supaya tidak menambah beban tanpa manfaat:

- **Prisma** - bertabrakan dengan Drizzle, pilih satu
- **Jest** - duplikat Vitest
- **Cypress** - duplikat Playwright
- **Express / Fastify** - Route Handlers sudah cukup
- **Supabase client SDK** - cukup `DATABASE_URL`, tidak perlu SDK
- **Axios** - `fetch` sudah ada
- **dotenv** - Next.js memuat `.env` otomatis
- **nodemon** - `next dev` sudah memuat ulang otomatis
- **bcrypt** (bukan `bcryptjs`) - butuh build native, sering gagal di Windows
- **Redux / Zustand** - belum ada kebutuhan state global
- **Mongoose / driver MongoDB** - MongoDB tidak dipakai; jangan tambahkan paketnya
- **SDK SATUSEHAT** - sudah diputuskan di luar rilis

### 3g. Biaya

Total **Rp0**. Tidak ada layanan berbayar, tidak ada kartu kredit, dan tidak
ada tagihan kejutan karena semua layanan memakai batas keras.

Rincian batas gratis, alasan memilih Neon, dan peringatan kuota ada di
`to-do.md` §1.

---

## 4. Perintah (belum dijalankan)

> Jangan salin apa pun di bawah ini sebelum bagian 6 selesai.
> Urutannya sengaja: fondasi dulu, fitur belakangan.

### 4a. Bereskan repo sebelum scaffold

```bash
# di C:\Users\HYPE AMD\Documents\project
git branch -m master main
git remote set-head origin -a
# pindahkan index.html ke _arsip/ lalu hapus folder .env yang salah tipe
```

### 4b. Scaffold Next.js

Pilih **satu** cara. Cara B lebih aman karena repo sudah berisi berkas.

```bash
# Cara A - scaffold di folder sementara, lalu salin isinya ke repo
npx create-next-app@latest tmp-next --ts --app --src-dir --eslint --import-alias "@/*" --use-npm --no-tailwind

# Cara B - scaffold langsung setelah index.html dan .env dibersihkan
npx create-next-app@latest . --ts --app --src-dir --eslint --import-alias "@/*" --use-npm --no-tailwind
```

Hapus `--no-tailwind` bila keputusan T3 memilih Tailwind.

### 4c. Paket runtime

```bash
npm install drizzle-orm postgres zod jose bcryptjs date-fns @date-fns/tz
```

### 4d. Paket pengembangan

```bash
npm install -D drizzle-kit tsx vitest @vitejs/plugin-react vite-tsconfig-paths \
  jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  @playwright/test prettier
```

### 4e. Browser untuk Playwright

Tidak perlu mengunduh biner Chromium terpisah (`npx playwright install chromium`).
Playwright dikonfigurasi untuk langsung menggunakan browser Chromium bawaan sistem (seperti Google Chrome / Arc / Edge) melalui opsi `channel: "chrome"` pada `playwright.config.ts`. Hal ini menghemat ruang disk (~200 MB) dan mempercepat setup.

### 4f. Deploy tanpa Vercel CLI

Tidak ada perintah tambahan. Hubungkan repo GitHub ke project Vercel, lalu
setiap push ke `main` memicu build. Vercel CLI tidak dipasang.

> Status 25 Okt: database cloud sudah dipilih (Neon Free). Langkah 4c–4f
> memakai `DATABASE_URL` dari project Neon yang sama.

### 4g. Opsional

```bash
npm install -D autocannon          # uji beban
npm install -D tailwindcss @tailwindcss/postcss   # bila memilih Tailwind
```

---

## 5. Variabel lingkungan yang harus ada

Belum ada `.env.example`. Isi minimalnya:

| Variabel | Contoh bentuk | Dipakai oleh |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | Drizzle |
| `DATABASE_URL_UNPOOLED` | versi tanpa pooling | `drizzle-kit` (migrasi) |
| `SESSION_SECRET` | 32+ karakter acak | `jose` |
| `APP_URL` | `http://localhost:3000` / domain Vercel | redirect autentikasi |

Aturan: `.env` tidak pernah di-commit, `.env.example` selalu di-commit.
Pastikan `.gitignore` memuat `.env*` tetapi mengecualikan `.env.example`.

---

## 6. Keputusan sebelum mengetik perintah

Delapan hal ini harus dijawab lebih dulu. Tanpa jawaban, instalasi akan
diulang dua kali.

| # | Keputusan | Pilihan | Rekomendasi untuk proyek ini |
|---|---|---|---|
| 1 | Database terkelola | Neon Free | **Ditutup 25 Okt.** Supabase Free hanya cadangan: dijeda setelah 7 hari, 500 MB |
| 2 | Driver | `postgres` / `@neondatabase/serverless` | **`postgres`** untuk Node runtime; tambah versi serverless hanya bila perlu Edge |
| 3 | Autentikasi | Auth.js / Better Auth / sesi sendiri | **Sesi sendiri** (`jose` + `bcryptjs`) karena PRD tidak butuh reset password atau penyedia luar |
| 4 | Styling | Tailwind / CSS Modules | **Tailwind** bila waktu sempit; CSS Modules bila ingin nol dependensi |
| 5 | Package manager | npm / pnpm | **npm** - sudah terpasang, prinsip nomor 7 `pertimbangan.md` |
| 6 | Database uji | cloud terpisah / Docker lokal | **cloud terpisah** (branch database Neon) agar tidak perlu Docker |
| 7 | Alat uji beban | autocannon / k6 | **autocannon** |
| 8 | Dua folder `docs/` | mana pemilik dokumen teknis | **repo kode** untuk 5 dokumen teknis, repo dokumen tetap pemilik PRD |

---

## 7. Urutan kerja dan perkiraan waktu

| Langkah | Pekerjaan | Perkiraan | Selesai bila |
|---|---|---|---|
| 1 | Bereskan repo (branch, `.env`, `index.html`) | 20 menit | `git branch` bersih, tidak ada folder `.env` |
| 2 | Putuskan 8 hal di bagian 6 | 30 menit | Tertulis, bukan lisan |
| 3 | Scaffold + pasang paket | 30 menit | `npm run dev` hidup |
| 4 | `drizzle.config.ts` + skema awal + migrasi | 60 menit | Tabel pertama ada di database |
| 5 | Vitest jalan + 1 test hijau | 20 menit | `npm test` hijau |
| 6 | Playwright jalan + 1 test hijau | 30 menit | `npm run test:e2e` hijau |
| 7 | Seed admin + `.env.example` | 30 menit | Admin bisa login lokal |
| 8 | Deploy skeleton ke Vercel | 30 menit | Tautan hidup dari perangkat lain |
| 9 | `docs/api-contract.md` versi pertama | 45 menit | Minimal 1 endpoint tertulis |
| 10 | `docs/database-schema.md` versi pertama | 45 menit | Semua tabel PRD terpetakan |

Total ± 5 jam kerja satu orang, belum termasuk penulisan fitur.
Langkah 1-8 **menutup P0** di `perbaikan-selanjutnya.md` (ditambah seed dan deploy).
Langkah 9-10 belum ada di backlog mana pun dan sebaiknya ditambahkan.

---

## 8. Risiko khusus instalasi

| Risiko | Gejala | Pencegahan |
|---|---|---|
| Database lokal dipakai lalu pindah ke Vercel | Aplikasi jalan lokal, gagal di hosting | Pakai database terkelola sejak hari pertama |
| Koneksi database habis | Galat "too many connections" saat uji beban | Pakai URL pooled; batasi pool |
| Middleware tidak bisa akses database | Galat runtime saat cek sesi | Sesi dari cookie JWT, bukan query database |
| Migrasi Drizzle tidak mendukung indeks unik parsial | Aturan "satu slot satu janji aktif" tidak terjaga | Tulis SQL migrasi manual bila perlu; uji dengan dua permintaan serentak |
| Zona waktu salah di server | Nomor antrian berganti sehari terlalu cepat/lambat | Semua perhitungan lewat satu modul `waktu-wib.ts`; uji di 23:59 dan 00:01 WIB |
| Playwright gagal unduh browser | Test e2e tidak jalan di komputer anggota lain | Catat langkah `npx playwright install` di `docs/testing.md` |
| Uji e2e saling menimpa data | Test lulus sendiri, gagal bersama | Satu database uji + data fiktif berawalan unik per test |
| Dua folder `docs/` | Dokumen teknis terbelah, tautan mati | Tetapkan kepemilikan di bagian 6 nomor 8 |

---

## 9. Checklist

**Sebelum instalasi**

- [ ] Tech stack `pertimbangan.md` dicatat di PRD bagian 6 dan open question 1/9 ditutup
- [ ] Delapan keputusan bagian 6 dijawab dan ditulis
- [ ] Branch default `main`, `.env` folder dihapus, `index.html` dipindahkan
- [ ] Dipastikan tidak ada paket MongoDB/Mongoose di `package.json`
- [ ] Pemilik lima dokumen teknis ditetapkan

**Setelah instalasi**

- [ ] `package.json` ada dengan skrip `dev`, `build`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `db:seed`
- [ ] `.env.example` lengkap dan `.env` diabaikan Git
- [ ] `vitest.config.ts` dan `playwright.config.ts` ada
- [ ] Satu unit test dan satu e2e test hijau
- [ ] Migrasi awal jalan di database terkelola
- [ ] Seed admin berhasil, login lokal berhasil
- [ ] Deploy skeleton hidup di Vercel
- [ ] `docs/database-schema.md` dan `docs/api-contract.md` versi pertama ada
- [ ] `AGENTS.md` di repo kode memuat batas folder per agen

---

## 10. Satu hal yang perlu ditegaskan

`pertimbangan.md` memakai istilah "Proyek IPL", sedangkan PRD v0.3 berbicara
tentang aplikasi kesehatan pasien hipertensi. Isi teknisnya tetap cocok -
yang perlu dipastikan hanya bahwa keduanya merujuk produk yang sama, supaya
tidak ada dua arah pengembangan yang berjalan sendiri.

---

## Tautan

- Pertimbangan (Development Guidelines)
- [PRD v0.3 (kanonik)](prd-v0.3.md)
- [To-Do Eksekusi](to-do.md)
- Perbaikan Selanjutnya
- [Hirarki Folder Kode](hirarki.md)
- [Fitur dan Rencana Uji](rencana-uji.md)
