# Status Tugas

Satu-satunya tempat status 44 tugas ditulis. Spesifikasi tugas ada di vault:
`brain-project/docs/to-do/rencana-agen.md` (read-only), salinan bacanya di
`docs/rancangan/rencana-agen.md`.

Status yang sah: `todo` · `doing` · `blocked` · `done`.
Tugas `blocked` wajib punya satu kalimat sebab di kolom catatan.
Tugas `done` wajib punya hash commit dan berkas bukti.

Aturan: **satu tugas satu commit** dengan pesan `ID: judul`.
Jangan mengubah status tugas milik agen lain.

---

## F0 — Fondasi

| ID | Status | Commit | Catatan |
|---|---|---|---|
| A01 | done | f14d535 | — |
| A02 | done | 251524b | — |
| A03 | done | 14c8dbf | — |
| A04 | done | eff355a | — |
| A05 | done | b92a1d8 | — |
| A06 | done | 1707688 | — |
| A07 | done | d504eb8 | — |
| A08 | done | 53c3b62 | — |
| A09 | blocked | 90bc13e | accept hosting belum terbukti: URL Vercel dan handler login belum ada |

## F1 — Data

| ID | Status | Commit | Catatan |
|---|---|---|---|
| A10 | done | dac5b94 | — |
| A11 | done | 9b6db0d | — |
| A12 | done | 347cb12 | commit memuat berkas di luar `paths`; dicatat di A12.md |
| A13 | done | 5c1add3 | commit 8ef5fe7 hanya menambah newline, bukan bukti |
| A14 | done | 8fbe462 | — |
| A15 | done | 8fbe462 | — |
| A16 | done | 8fbe462 | — |

## F2 — Backend

| ID | Status | Commit | Catatan |
|---|---|---|---|
| B01 | done | 53f9a92 | Auth, sesi idle 15 menit, lockout, guard role, dan verifikasi selesai |
| B02 | doing | — | Endpoint profil, katalog Fornas, import snapshot A, dan tabel obat pasien selesai; capture GET profil teruji; menunggu commit B02 |
| B03 | todo | — | — |
| B04 | todo | — | — |
| B05 | todo | — | — |
| B06 | todo | — | — |
| B07 | todo | — | — |
| B08 | todo | — | — |
| B09 | todo | — | — |
| B10 | todo | — | — |
| B11 | todo | — | — |
| B12 | todo | — | — | opsional, dipotong pertama |
| B13 | todo | — | — | opsional, dipotong kedua |

## F3 — Frontend

| ID | Status | Commit | Catatan |
|---|---|---|---|
| C01 | todo | — | — |
| C02 | todo | — | — |
| C03 | todo | — | — |
| C04 | todo | — | — |
| C05 | todo | — | — |
| C06 | todo | — | — |
| C07 | todo | — | — |
| C08 | todo | — | — |
| C09 | todo | — | — | layar kebiasaan P10-P11; P12 konten tidak dibangun |

## F4 — Uji dan rilis

| ID | Status | Commit | Catatan |
|---|---|---|---|
| D01 | todo | — | — |
| D02 | todo | — | — |
| D03 | todo | — | — |
| D04 | todo | — | — |
| D05 | todo | — | — |
| D06 | todo | — | — |

---

## Ringkasan

Diperbarui: 1 November 2026 · total 44 · `todo` 25 · `doing` 1 · `blocked` 1 · `done` 16