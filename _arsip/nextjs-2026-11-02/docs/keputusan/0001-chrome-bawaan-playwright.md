# ADR 0001 — Playwright memakai Chrome bawaan sistem

- **Status**: diterima
- **Tanggal**: 2026-10-29
- **Pemilik keputusan**: pemilik proyek
- **Terkait**: tugas A08 (`playwright.config.ts`)

## Konteks

`docs/rancangan/to-do.md` §0 menulis "E2E test: Playwright — Chromium saja", dan
`docs/rancangan/yang-perlu-diinstal.md` semula menyarankan
`npx playwright install chromium`. Unduhan itu menambah ±200 MB per mesin dan
menduplikasi browser yang sudah terpasang.

## Keputusan

Pengujian E2E memakai **Google Chrome yang sudah terpasang di sistem**
(`channel: "chrome"`). Repositori **tidak** mengunduh atau menyimpan biner
Chromium.

## Alasan

1. Menghemat ruang penyimpanan dan waktu unduh di mesin pengembang.
2. Chrome stabil sudah tersedia di mesin kerja dan di runner GitHub.
3. Tidak ada kebutuhan fitur Chromium khusus yang tidak ada di Chrome.

## Konsekuensi

- `playwright.config.ts` wajib memakai `channel: "chrome"` pada `projects`.
- Prasyarat mesin: Google Chrome terpasang. Ini yang ditulis di README,
  menggantikan perintah `playwright install`.
- Bila Chrome tidak ada, `npm run test:e2e` gagal dengan pesan "Chrome is not
  found" — kegagalan itu benar, bukan alasan menambah unduhan browser.
- `ci.yml` saat ini tidak menjalankan E2E. Bila D01 menambahkannya, jangan
  menambahkan langkah `playwright install`; runner GitHub sudah menyediakan
  Chrome stabil.
- Dokumen sumber di vault (`to-do.md` §0, `saran/yang-perlu-diinstal.md` §4e)
  perlu diperbarui pemilik proyek agar sinkron berikutnya tidak mengembalikan
  instruksi unduh Chromium. Agen tidak menulis ke vault.

## Rujukan

- `playwright.config.ts` — `channel: "chrome"`
- `docs/01-laporan-unit/A08.md`
- `docs/rancangan/to-do.md` §0
