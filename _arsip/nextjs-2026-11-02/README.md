# web-health-ipl-project

Aplikasi web pengelola kesehatan personal untuk pasien dan klinik.
Proyek dibangun dengan arsitektur modular, TypeScript strict, dan Next.js App Router.

## Stack Teknologi

- **Framework**: Next.js (App Router)
- **Bahasa**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database & ORM**: PostgreSQL (Neon) & Drizzle ORM
- **Validasi**: Zod
- **Autentikasi**: Sesi mandiri (JWT `jose` di cookie `httpOnly` + `bcryptjs`)
- **Testing**: Vitest (Unit/Integration) & Playwright (E2E)
- **Zona Waktu**: Asia/Jakarta (WIB) via modul tersentralisasi

## Prasyarat

- Node.js >= 20.x (disarankan v22.x)
- npm (package manager standar)

## Cara Menjalankan

1. **Klon atau buka repositori**
   ```bash
   git clone https://github.com/gbprtm/web-health-ipl-project.git
   cd web-health-ipl-project
   ```

2. **Siapkan berkas environment**
   Salin berkas `.env.example` menjadi `.env` lalu sesuaikan kredensial database dan rahasia sesi:
   ```bash
   cp .env.example .env
   ```

3. **Pasang dependensi**
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Jalankan server pengembangan**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di peramban.

## Perintah Pengujian & Kualitas Kode

Perintah berikut tersedia mulai fase fondasi (A02 & A08):

```bash
npm run dev        # Menjalankan dev server pada port 3000
npm run lint       # Memeriksa linting kode (ESLint)
npm run typecheck  # Memeriksa tipe data TypeScript (tsc --noEmit)
npm test           # Menjalankan unit test (Vitest)
npm run test:e2e   # Menjalankan end-to-end test (Playwright)
npm run build      # Menghasilkan build produksi Next.js
```

## Continuous Integration (CI) & Deployment

### 1. GitHub Actions CI
Setiap `push` dan `pull_request` ke cabang `main` atau `master` diverifikasi secara otomatis oleh GitHub Actions (`.github/workflows/ci.yml`), mencakup:
- Pemeriksaan linting ESLint
- Pengecekan tipe TypeScript strict
- Eksekusi unit test Vitest
- Kompilasi build Next.js

### 2. Deployment Vercel (Rp0)
Deployment ke lingkungan cloud dilakukan tanpa Vercel CLI (zero configuration), dengan menghubungkan repositori GitHub langsung ke Vercel Dashboard:
1. Hubungkan repositori GitHub `web-health-ipl-project` di dashboard Vercel.
2. Atur Environment Variables di project settings Vercel:
   - `DATABASE_URL`: Connection string PostgreSQL Neon (Pooled)
   - `DATABASE_URL_UNPOOLED`: Connection string PostgreSQL Neon (Direct)
   - `SESSION_SECRET`: Kunci rahasia minimal 32 karakter untuk enkripsi token JWT
   - `APP_URL`: Domain publik Vercel Anda (misal `https://web-health-ipl-project.vercel.app`)
3. Setiap commit baru yang masuk ke branch utama akan memicu deployment produksi secara otomatis.

## Struktur & Dokumentasi Kerja

- `docs/status-tugas.md`: Papan status resmi 44 tugas proyek
- `docs/peta-bagian.md`: Peta FR, modul kode, dan rujukan rancangan
- `docs/rancangan/`: Salinan baca rancangan PRD v0.3, wireframe, dan arsitektur
- `docs/01-laporan-unit/` s.d. `05-bukti-performa/`: Arsip bukti verifikasi tugas
- `_arsip/`: Berkas statis lama yang diarsipkan
