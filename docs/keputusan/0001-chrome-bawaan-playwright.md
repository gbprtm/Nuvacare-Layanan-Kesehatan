# ADR 0001 — Playwright memakai Chrome bawaan sistem

> Masih berlaku. Sejak [ADR 0003](0003-rancangan-final.md), uji browser
> Playwright bersifat **opsional**; uji wajib adalah PHPUnit + Pint.

- **Status**: diterima
- **Tanggal**: 2026-10-29

## Keputusan

Bila uji E2E dijalankan, Playwright memakai **Google Chrome yang terpasang di
sistem** (`channel: "chrome"`). Repositori tidak mengunduh biner Chromium.

## Alasan

1. Menghemat ruang dan waktu unduh (±200 MB per mesin).
2. Chrome stabil sudah tersedia di mesin kerja dan runner GitHub.

## Konsekuensi

- `playwright.config.ts` memakai `channel: "chrome"`.
- Jangan menambahkan langkah `playwright install`. Bila Chrome tidak ada,
  kegagalan "Chrome is not found" adalah hasil yang benar.
