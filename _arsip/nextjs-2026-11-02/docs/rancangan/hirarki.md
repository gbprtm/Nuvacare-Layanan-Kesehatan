> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

`web-health-ipl-project/`
`├── .github/`
`│   ├── workflows/ci.yml              # lint, unit, integration, build`
`│   ├── ISSUE_TEMPLATE/`
`│   └── pull_request_template.md`
`├── docs/`
`│   ├── produk/                       # prd-v0.3.md, mvp`
`│   ├── desain/                       # wireframe, peta alur, skema data (Mermaid)`
`│   ├── 01-laporan-unit/`
`│   ├── 02-integration/`
`│   ├── 03-system-uat/`
`│   ├── 04-bukti-security/`
`│   ├── 05-bukti-performa/            # keluaran k6, p95`
`│   └── to-do/`
`├── plan/                             # rencana uji, pembagian tugas, risiko`
`├── _arsip/2026-10-24/                # beku, jangan diubah`
`├── src/`
`│   ├── app/                          # routing dan halaman saja, tanpa logika bisnis`
`│   │   ├── (publik)/                 # beranda, masuk, daftar`
`│   │   ├── (pasien)/                 # profil, jadwal-kontrol, janji, antrian,`
`│   │   │                             # kebiasaan, obat, timeline, notifikasi,`
`│   │   │                             # aktivitas, konten`
`│   │   ├── (admin)/admin/            # janji, antrian, slot, usulan, resep,`
`│   │   │                             # aturan-kontrol, audit-log`
`│   │   └── api/`
`│   ├── modules/                      # satu folder = satu domain`
`│   │   ├── auth/                     # FR-07: sesi, hash, guard role`
`│   │   ├── profil/                   # FR-01`
`│   │   ├── jadwal-kontrol/           # FR-02: aturan, pembangkit jadwal, pengingat`
`│   │   ├── janji/                    # FR-03 dan FR-08: slot, janji, usulan, kunci TTL`
`│   │   ├── antrian/                  # FR-04: nomor estimasi/final, transisi status`
`│   │   ├── notifikasi/               # FR-09`
`│   │   ├── audit/                    # FR-10: append-only`
`│   │   ├── resep-obat/               # FR-12: resep, catatan minum`
`│   │   ├── timeline/                 # FR-13: agregasi baca saja`
`│   │   ├── kebiasaan/                # FR-05`
`│   │   ├── aktivitas/                # FR-14 (kandidat dipotong)`
`│   │   └── konten/                   # FR-06 (kandidat dipotong)`
`│   ├── db/`
`│   │   ├── schema/                   # definisi tabel per domain`
`│   │   ├── migrations/               # additive saja`
`│   │   └── seed/                     # akun admin individual, data demo fiktif`
`│   ├── lib/`
`│   │   ├── waktu-wib.ts              # satu-satunya titik perhitungan tanggal`
`│   │   ├── errors.ts`
`│   │   └── validasi.ts`
`│   ├── components/                   # UI bersama (tombol, kartu, status kosong)`
`│   └── middleware.ts                 # gerbang sesi dan role`
`├── tests/`
`│   ├── integration/                  # per FR, termasuk rebutan slot`
`│   ├── system/                       # skenario hipertensi 10 langkah`
`│   ├── security/                     # ID di URL, lintas peran, tamu`
`│   ├── performance/                  # skrip k6`
`│   └── uat/                          # skrip UAT dan kuesioner SUS`
`├── .env.example`
`├── drizzle.config.ts`
`├── package.json`
`└── README.md`


`modules/janji/`
`├── janji.service.ts       # aturan bisnis dan transaksi`
`├── janji.repository.ts    # satu-satunya akses ke database`
`├── janji.policy.ts        # otorisasi: siapa boleh apa`
`├── janji.schema.ts        # validasi input`
`└── janji.service.test.ts  # unit test berdampingan dengan kodenya`
---

## Tautan

- [PRD v0.3 (kanonik)](prd-v0.3.md)
- [Rencana Uji](rencana-uji.md)
- [02 Wireframe Pasien](design/02-wireframe-pasien.md)
