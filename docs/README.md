# Dokumentasi aktif migrasi Laravel

Dokumentasi ini membedakan **target Laravel**, **kebutuhan produk read-only**,
dan **sejarah Next.js**. Aplikasi Laravel belum dibuat; status implementasi
hanya di [status-tugas.md](status-tugas.md).

## Urutan mulai

1. [ADR migrasi](keputusan/0002-migrasi-laravel.md): keputusan stack dan batasnya.
2. [Bootstrap L01](migrasi/bootstrap.md): prasyarat dan cara memulai dengan aman.
3. [Rencana 10 hari](to-do.md): urutan, gerbang, keputusan tertunda.
4. [Rencana agen](rencana-agen.md): `depends`, `paths`, `accept`, `verify`, `evidence`.
5. [Peta bagian](peta-bagian.md): hanya potongan PRD/layar yang terkait tugas.

## Kontrak teknis aktif

| Dokumen | Fungsi |
|---|---|
| [Arsitektur](panduan-arsitektur.md) | Controller, Form Request, policy, service, Eloquent, Blade |
| [Kontrak route](api-contract.md) | HTML/form, PRG, CSRF, galat, satu pemilik tiap route |
| [Rencana data](database-schema.md) | Inventaris lama, Eloquent dan strategi isolasi sebelum migrasi |
| [Gerbang backend](tinjauan-backend-agen.md) | Risiko transaksi, privasi, sesi dan kalender yang wajib dibuktikan |
| [Sistem dan use case](tinjauan-sistem-dan-use-case.md) | Batas produk dan skenario yang tetap wajib |
| [Arah visual](../DESIGN.md) | Identitas/perilaku; usulan yang belum disetujui tetap usulan |
| [Kebijakan bukti](bukti/README.md) | Format hasil aktual per tugas, bukan bukti uji palsu |
| [Inventaris arsip](migrasi/arsip.md) | Apa yang dipindahkan dan cara memeriksa isinya |
| [Bukti penataan](migrasi/00-penataan.md) | Validasi dokumentasi dan integritas arsip sesi ini |

## Dokumen yang sengaja tidak diubah

- `rancangan/`: salinan generate dari vault, **read-only**, termasuk PRD,
  wireframe dan rencana lama. Stack/alat/perintah Next.js di sana sudah tidak
  mengatur implementasi baru, sesuai ADR migrasi. Aturan produk tetap berlaku.
- `C:\Users\HYPE AMD\Documents\brain-project`: vault read-only dari sesi ini.
  Pemilik memperbarui ketentuan teknis di sumber sebelum sinkron berikutnya.
- [ADR Chrome](keputusan/0001-chrome-bawaan-playwright.md): keputusan browser
  tetap berlaku; nama tugas dan konfigurasi Next.js di dalamnya adalah sejarah.
- Laporan dan bukti Next.js lama ada di
  [`_arsip/nextjs-2026-11-02/docs/`](../_arsip/nextjs-2026-11-02/docs/).
  Jangan mengubah bukti historis menjadi seolah-olah hasil Laravel.

Skrip `scripts/sinkron-rancangan.ps1` tetap alat sinkron pemilik. Ia bukan
langkah bootstrap Laravel; jangan menjalankannya otomatis untuk mengubah
salinan read-only atau menutupi perbedaan vault dengan keputusan stack baru.
