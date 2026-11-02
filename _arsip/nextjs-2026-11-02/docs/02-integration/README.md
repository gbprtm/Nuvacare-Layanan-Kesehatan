# Bukti Uji Integrasi (02-integration)

Folder ini menyimpan bukti hasil uji integrasi transaksi database dan skenario anti-bentrok antar pengguna:
- Anti-bentrok pemesanan slot dokter (concurrency & locking).
- Verifikasi transisi status antrian klinik.
- Transaksi database Drizzle ORM dengan PostgreSQL Neon.

## Status 2026-10-29

Belum ada bukti di folder ini. `tests/integration/slot-rebutan.test.ts` dan
`tests/integration/transisi-antrian.test.ts` masih berupa `it.todo` (kerangka
untuk D01), bukan uji yang lulus. Bukti nyata diisi oleh D01.

