# ADR 0003 — RANCANGAN FINAL sebagai acuan tunggal

- **Status**: diterima
- **Tanggal**: 2026-11-02
- **Pemilik keputusan**: pemilik proyek
- **Menggantikan**: ADR 0002 (Laravel + Blade)

## Konteks

Dokumentasi dan rencana sebelumnya (PRD v0.3, kontrak route Blade, 21 tabel,
17 tugas L01–L17, gerbang backend G01–G10) terlalu kompleks untuk tujuan
proyek. Pemilik menyusun [RANCANGAN FINAL](../RANCANGANFINAL.md) versi ramping.

## Keputusan

- RANCANGAN FINAL menjadi satu-satunya acuan kebutuhan dan tahapan.
- Arsitektur: HTML/CSS/JS murni di `public/` + Laravel JSON API, tanpa Blade.
- Skema: 4 tabel (`users`, `polyclinics`, `doctors`, `appointments`).
- Rencana kerja: 5 tahap (T1–T5).
- Fitur di RANCANGAN FINAL §1.3 dihapus dan tidak dibangun kembali.

## Konsekuensi

- Dokumen lama yang digantikan dihapus dari `docs/`; tetap ada di riwayat git
  (`8244b04`).
- Kode Blade L01–L08 dibersihkan pada Tahap 1.
- `docs/rancangan/` tidak diubah (salinan read-only vault). Pemilik perlu
  memperbarui vault `brain-project` agar sinkron berikutnya konsisten.
- Uji wajib cukup PHPUnit feature test API + Pint; Playwright opsional.

