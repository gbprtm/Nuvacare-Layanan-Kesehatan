# ADR 0002: Ganti Next.js dengan Laravel dan halaman HTML

Status: diterima oleh pemilik melalui percakapan, 2 November 2026.

Pemilik memilih Laravel karena lebih ingin mengerjakan HTML/CSS dan JavaScript
seperlunya daripada React/Next.js, dengan sisa waktu yang disebut 10 hari.
Targetnya satu aplikasi Laravel server-rendered: Blade sebagai template HTML,
CSS biasa, JavaScript vanilla, dan PostgreSQL di Neon. Migrasi ini mengulang
backend, bukan sekadar mengganti tampilan; hasil uji Next.js tidak diwariskan.

## Konsekuensi teknis

| Sebelumnya | Target |
|---|---|
| Next.js App Router, React, TypeScript aplikasi | Laravel/PHP dan Blade HTML |
| Tailwind | CSS biasa |
| Drizzle | Eloquent dan migration Laravel |
| Zod server | Form Request / Validator Laravel |
| Vitest backend | PHPUnit |
| Playwright | Tetap, Google Chrome bawaan sesuai ADR 0001 |
| PostgreSQL Neon | Tetap, dengan dev/test terisolasi dan migrasi terkontrol |
| Vercel untuk Next.js | Hosting PHP perlu dipilih dan dibuktikan L01 |

PHPUnit dipilih sebagai baseline sederhana dari opsi Pest/PHPUnit yang dibahas.
Pint untuk format PHP, Vite untuk build CSS/JS, bukan alasan menambah React,
Inertia, Livewire, Tailwind, atau starter kit. Vitest/Zod tidak ditambahkan
kembali tanpa kebutuhan JavaScript nyata dan perubahan rencana yang disetujui.
Versi PHP/Laravel/dependensi dipatok saat L01 setelah memeriksa runtime/hosting;
tidak ada versi terpasang yang diasumsikan dari dokumentasi.

## Pengecualian terhadap rancangan lama

Keputusan terbaru pemilik menggantikan ketentuan teknis stack, toolchain,
struktur kode, perintah, dan ID tugas Next.js di aturan repo sebelumnya.
Rujukan kerja baru adalah `AGENTS.md`, `docs/to-do.md`, `docs/rencana-agen.md`,
dan `docs/status-tugas.md` (L01–L17), dengan kontrak teknis aktif di `docs/`.

PRD, wireframe, dua role, privasi dan lima fitur wajib tetap berlaku. Dokter
bukan pengguna. Pergantian stack bukan persetujuan mengurangi scope produk,
mengarang ambang kesehatan, menghapus data, atau mengubah deadline kalender.

Vault dan `docs/rancangan/**` tetap read-only. Perbedaan teknis dengan sumber
lama dicatat terbuka di sini; pemilik perlu memperbarui vault dan melakukan
sinkron terkontrol. Salinan tidak diedit manual untuk pura-pura sinkron.

## Pengarsipan dan keselamatan

Kode/uji/konfigurasi/CI Next.js serta snapshot dokumen disimpan di
`_arsip/nextjs-2026-11-02/`, termasuk isi working tree yang belum di-commit.
Arsip bukan backup database atau aplikasi Laravel yang dapat dijalankan.
Tidak ada reset Git, penghapusan branch atau commit pada sesi ini.

Database lama dan `.env` tidak diubah. L02 harus menginventaris, membackup,
melatih restore terisolasi dan menetapkan adopsi skema versus baseline baru
sebelum L03. Default migration Laravel tidak boleh dijalankan ke Neon existing.
Cutover produksi membutuhkan izin terpisah pada L16.

Alternatif React/Inertia atau frontend/API terpisah tidak dipilih agar tidak
menambah beban belajar dan integrasi. Laravel tetap menuntut belajar PHP;
rencana 10 hari adalah target kerja yang perlu dievaluasi, bukan jaminan.
