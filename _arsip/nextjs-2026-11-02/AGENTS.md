# AGENTS.md — web-health-ipl-project

Website pengelola kesehatan personal berbasis browser (pasien + klinik), bukan aplikasi mobile/native.
Stack terkunci: Next.js App Router, TypeScript strict, PostgreSQL (Neon), Drizzle,
zod, Tailwind, Vitest, Playwright. Bahasa antarmuka: Indonesia.

Berkas ini untuk sesi yang dibuka di **repo kode**. Sesi di vault memakai
`brain-project/AGENTS.md`.

---

## 1. Dua folder, dua peran

| Folder | Peran | Boleh ditulis? |
|---|---|---|
| `C:\Users\HYPE AMD\Documents\project` — di sini | kode, uji, status, bukti | **ya** |
| `C:\Users\HYPE AMD\Documents\brain-project` | rancangan: PRD, wireframe, rencana tugas | **tidak** |
| `docs/rancangan/` — di repo ini | salinan baca dari vault | **tidak** — hasil generate |

Vault tetap sumber kebenaran. Salinan di `docs/rancangan/` ada supaya repo bisa
dipahami orang lain tanpa akses ke vault. Keduanya dibuat dan diperbarui oleh
`scripts/sinkron-rancangan.ps1` — jangan menyuntingnya manual.

Alasan tidak menyalin seluruh vault: satu artefak satu rumah. Yang disalin hanya
dokumen yang dibaca orang luar; sisanya (log, backlog, arsip) tetap di vault.

Kalau salinan dan vault berbeda isi, **vault yang benar** — laporkan, jangan
memperbaiki sendiri.

---

## 2. Perintah

```
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm test           # Vitest
npm run test:e2e   # Playwright chromium
npm run build
```

Skrip `lint`, `typecheck`, `test`, `test:e2e` baru ada setelah tugas **A02** dan
**A08** selesai. Sebelum itu, jangan mengarang skrip baru di luar `paths` tugas.

---

## 3. Ambil satu tugas

**Backend:** sebelum B01–B13 atau koreksi kontrak API, baca tabel pemicu di
`docs/tinjauan-backend-agen.md`, lalu temuan yang terkait dengan tugas.

1. Buka `docs/status-tugas.md`. Pilih ID berstatus `todo` yang seluruh
   `depends`-nya sudah `done`.
2. Baca **hanya dua hal**:
   - `brain-project/docs/to-do/rencana-agen.md` → cari baris `- id: B03`
     (dependensi, `paths`, `accept`, `verify`, `evidence`)
   - `docs/peta-bagian.md` → baris FR terkait (potongan PRD mana yang dibaca,
     modul kode mana yang dipakai)
3. Baca potongan PRD yang ditunjuk peta itu **saja**.
   **Jangan baca `prd-v0.3.md` penuh** (553 baris) kecuali memang diminta.
4. Ubah status tugas menjadi `doing` di `docs/status-tugas.md`.
5. Kerjakan **hanya** berkas yang tercantum di `paths`.
6. Jalankan `verify`. Semua harus lulus.
7. Tulis bukti di berkas `evidence` (di dalam repo ini).
8. Ubah status menjadi `done`, isi kolom commit, commit dengan pesan
   `B03: slot dan janji`.

Bila `accept` tidak tercapai: status `blocked` + satu kalimat sebab, lalu
berhenti. **Jangan menandai `done`.**

---

## 4. Aturan keras

1. Vault rancangan **read-only**. Jangan menulis, memindahkan, atau menghapus
   apa pun di `brain-project`.
2. Jangan menambah dependensi di luar daftar
   `brain-project/saran/yang-perlu-diinstal.md`.
3. TypeScript `strict`. `any` hanya dengan komentar `// alasan: ...`.
4. Setiap mutasi divalidasi `zod` di server.
5. Setiap handler memeriksa sesi **dan** peran di server, bukan hanya di UI.
6. Titik nol kredensial: semua env lewat `src/lib/env.ts`, `.env` tidak di-commit.
7. Semua perhitungan tanggal lewat `src/lib/waktu-wib.ts` (Asia/Jakarta).
8. Setiap tugas menambah atau memperbarui uji. Uji tidak boleh dilunakkan agar
   hijau.
9. Jangan `push --force`, `reset --hard`, atau menghapus branch.
10. Teks antarmuka bahasa Indonesia; nama variabel dan fungsi bahasa Inggris.

---

## 5. Selesai berarti

- seluruh `accept` terbukti, bukan diasumsikan;
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` hijau;
- bukti tertulis di `docs/<folder>/<ID>.md`;
- `docs/status-tugas.md` diperbarui;
- satu commit `ID: judul`;
- `git status` bersih selain berkas di `paths`.

---

## 6. Laporan ke pemilik proyek

```
TUGAS: B03
STATUS: done
PERUBAHAN: 4 berkas (daftar)
UJI: lint OK, typecheck OK, unit 6/6 OK, build OK
BUKTI: docs/02-integration/B03.md
CATATAN: -
```

Bila terhalang:

```
TUGAS: B04
STATUS: blocked
SEBAB: <satu kalimat>
BUTUH: <keputusan atau berkas>
```

---

## 7. Rujukan cepat

| Butuh | Buka |
|---|---|
| Ringkasan produk 1 halaman | `docs/rancangan/ringkasan-proyek.md` |
| Aturan & gerbang | `docs/rancangan/to-do.md` |
| Detail 44 tugas | `docs/rancangan/rencana-agen.md` |
| Potongan PRD per FR | `docs/peta-bagian.md` |
| Status tugas | `docs/status-tugas.md` |
| Kontrak API | `docs/api-contract.md` (dibuat tugas A15) |
| Skema database | `docs/database-schema.md` (dibuat tugas A16) |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
