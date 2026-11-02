# Arsip Next.js, bukan aplikasi aktif

Snapshot 2 November 2026 sebelum migrasi Laravel. Isi mencakup perubahan lokal
yang belum di-commit, sehingga sebagian berkas berbeda dari Git HEAD.

Instruksi `AGENTS.md`, README, perintah npm, migration, seed, konfigurasi dan
status tugas di folder ini hanya sejarah. Instruksi agen aktif berada di
`project/AGENTS.md`; rencana baru di `project/docs/rencana-agen.md`.
Jangan menjalankan CI/migrasi/import dari arsip terhadap database lama/live.

Inventaris dan batas pengarsipan:
[docs/migrasi/arsip.md](../../docs/migrasi/arsip.md).
`inventaris-kode.json` menyimpan SHA-256 isi 136 berkas sebelum pemindahan.
File `.env` private dan backup database tidak termasuk snapshot.
