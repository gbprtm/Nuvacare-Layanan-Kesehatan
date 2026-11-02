# Bukti Uji Keamanan (04-bukti-security)

Folder ini menyimpan bukti hasil uji celah keamanan:
- Pencegahan Role Bypass (pasien dilarang membuka `/admin/*`).
- Pencegahan IDOR (Insecure Direct Object References) pada data rekam medis pasien.
- Verifikasi perlindungan sesi dan validasi skema server-side.

## Status 2026-10-29

Belum ada bukti. `tests/security/role-bypass.spec.ts` dan `tests/security/idor.spec.ts`
masih ditandai `test.skip` (kerangka untuk D02), jadi bukan bukti keamanan.
Bukti diisi oleh D02.

