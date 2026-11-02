# Inventaris pengarsipan Next.js

Arsip: [`_arsip/nextjs-2026-11-02/`](../../_arsip/nextjs-2026-11-02/).
Snapshot dibuat dari isi working tree, bukan hanya commit terakhir. Karena itu
pekerjaan B03 dan perubahan lokal lain tidak dibuang melalui reset Git.

## Isi arsip

| Lokasi dalam arsip | Asal/fungsi |
|---|---|
| `src/` | Seluruh kode Next.js, schema/migration/seed Drizzle dan unit tests berdampingan |
| `tests/` | Uji integrasi, browser, security, system dan setup lama |
| `public/` | Aset aplikasi lama, belum disalin ke aplikasi Laravel |
| `package.json`, `package-lock.json` | Dependensi dan perintah npm Next.js lama |
| File konfigurasi, `next-env.d.ts`, `tsconfig.json` | Konfigurasi Next, Drizzle, ESLint, TypeScript, Vitest dan Playwright |
| `.env.example` | Contoh konfigurasi lama, termasuk perubahan lokal, bukan file `.env` |
| `.github/workflows/ci.yml` | CI Next lama, dinonaktifkan dengan dipindahkan keluar workflow aktif |
| `scripts/import-fornas-snapshot.ts` | Importer TypeScript sebagai referensi; tidak dijalankan untuk Laravel |
| `docs/` | Snapshot lengkap dokumentasi/bukti/status sebelumnya sebelum ditulis ulang |
| `AGENTS.md`, `README.md`, `DESIGN.md`, `.gitignore` | Snapshot aturan, petunjuk dan desain sebelum penyesuaian |
| `inventaris-kode.json` | Ukuran dan SHA-256 untuk 136 berkas kode/uji/aset/config sebelum diarsipkan |

Folder `src/` dan `tests/` tidak dapat di-rename langsung oleh filesystem pada
sesi ini. Keduanya disalin, seluruh checksum arsip diverifikasi, baru sumber
aktifnya dibuang. Isi tetap dipertahankan di arsip. Dokumen lama disalin agar
struktur tautan/bukti historis tetap utuh; laporan bukti lama tidak lagi di
folder bukti aktif. Tidak ada penghapusan database.

## Yang tetap di tempat

- `docs/rancangan/**` tidak dipindah atau disunting. Salinannya di arsip hanya
  bagian dari snapshot docs; sumber baca produk tetap di lokasi semula.
- `data/fornas/` dan berkas sumber publik Excel/JSON/`Indonesian Pharmaceutical/`
  dipertahankan. Impor ulang perlu tugas yang jelas dan verifikasi sumber.
- `.agents/`, konfigurasi editor/agen, `anti-slop/`, dan arsip terdahulu tidak
  dihapus. Laporan anti-slop lama bukan bukti UI Laravel.
- `scripts/sinkron-rancangan.ps1` tetap alat pemilik, bukan bagian build Laravel.
- `.env` jika ada tetap private di root dan ignored, tidak dibaca/diarsipkan
  dalam sesi ini. PHP Laravel tidak boleh otomatis menimpanya saat bootstrap.
- `node_modules/`, `.next/`, `tsconfig.tsbuildinfo` adalah cache ignored lama,
  mungkin masih ada di disk. L01 menata cache, bukan menganggapnya dependency baru.

## Cara memakai arsip

Arsip adalah bahan baca untuk menerjemahkan aturan domain, skema, fixture dan
skenario uji. Manifest/config di dalamnya bukan perintah aktif repo. Jangan
menjalankan migration/seed/import lama ke Neon, atau menjalankan Next dev yang
bisa menghasilkan ulang aturan agen. Bila perlu menjalankan versi lama, buat
lingkungan terpisah dengan konfigurasi dan database isolasi yang disetujui.

Snapshot `.env.example` bukan izin memakai kredensial; periksa keamanan sebelum
commit yang kelak diizinkan. Tidak ada commit, push, atau perubahan branch pada
sesi pengarsipan ini. Git dapat menampilkan pengarsipan sebagai delete/add;
isi file dapat dibuktikan dengan checksum, bukan diasumsikan hilang.
