# Status tugas

Satu-satunya papan status. Tahap dan kriteria selesai mengikuti
[RANCANGAN FINAL §5](RANCANGANFINAL.md#5-rencana-kerja-eksekusi--pengujian).

Status sah: `todo`, `doing`, `blocked`, `done`. Kerjakan berurutan. `done`
hanya bila kriteria selesai terbukti di `docs/bukti/Tn.md`.

| ID | Tahap | Status | Commit | Bukti | Catatan |
|---|---|---|---|---|---|
| T1 | Fondasi & database | done | - | `docs/bukti/T1.md` | Schema `klinik` Neon, 4 tabel, seeder, DatabaseFoundationTest passed. |
| T2 | API auth & halaman login HTML | done | - | `docs/bukti/T2.md` | Sanctum token, AuthController, login.html, auth.js, AuthApiTest passed. |
| T3 | Profil pengguna | done | - | `docs/bukti/T3.md` | GET/PATCH /api/profil, pasien/profil.html, ProfileApiTest passed. |
| T4 | Janji temu & panel admin | done | - | `docs/bukti/T4.md` | janji-temu.html, kelola-janji.html, master-data.html, AppointmentAndAdminApiTest passed. |
| T5 | Riwayat & jadwal kontrol | done | - | `docs/bukti/T5.md` | riwayat.html, jadwal-kontrol.html, HistoryAndControlApiTest passed. |
| T6 | Arsitektur dua permukaan & RBAC staf | done | - | `docs/bukti/T6.md` | Pemisahan host pasien dan staf (Opsi B), surface middleware, Gate/Policy. |
| T7 | Portal dokter, pengajuan pembatalan & audit log | done | - | `docs/bukti/T7.md` | Migrasi aditif, API dokter & inbox admin, status_change_logs, notifikasi WA, UI dokter & admin. |

Riwayat tugas L01–L08 (implementasi Blade sebelumnya) tersimpan di commit
`8244b04` dan tidak lagi menjadi target.
