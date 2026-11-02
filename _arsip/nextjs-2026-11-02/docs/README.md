# docs/ — dokumen kerja repo kode

Folder ini berisi dokumen yang **hidup bersama kode**. Rancangan (PRD, wireframe,
risiko) tidak disalin ke sini; letaknya di vault
`C:\Users\HYPE AMD\Documents\brain-project`.

| Berkas | Isi | Diperbarui oleh |
|---|---|---|
| `rancangan/` | salinan read-only dokumen rancangan (PRD, wireframe, rencana tugas) | `scripts/sinkron-rancangan.ps1` |
| `peta-bagian.md` | FR → potongan PRD → layar → modul kode | pemilik proyek |
| `panduan-arsitektur.md` | pembagian struktur: Frontend, Backend, dan Testing | pemilik proyek |
| `status-tugas.md` | status 44 tugas | agen, setiap tugas |
| `keputusan/` | catatan keputusan (ADR) yang menyimpang dari rancangan | pemilik proyek + agen |
| `api-contract.md` | kontrak API v1 | tugas A15, lalu tiap tugas backend |
| `database-schema.md` | skema tabel + diagram | tugas A16, lalu tiap tugas data |
| `01-laporan-unit/` | bukti unit test per FR | tugas A* dan B* |
| `02-integration/` | bukti integration test | tugas B* dan D01 |
| `03-system-uat/` | bukti e2e, skrip UAT, SUS | tugas C*, D03, D05 |
| `04-bukti-security/` | bukti uji keamanan | tugas D02 |
| `05-bukti-performa/` | skrip autocannon + p95 | tugas D04 |

Aturan: satu berkas satu pemilik. Status tugas **hanya** ditulis di
`status-tugas.md`, bukan di vault.