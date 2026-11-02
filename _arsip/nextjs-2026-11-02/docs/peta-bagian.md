# Peta Bagian

Tujuan berkas ini: agen **tidak perlu membaca PRD 553 baris**. Cukup cari satu
baris di tabel, lalu buka potongan yang ditunjuk.

PRD kanonik: `C:\Users\HYPE AMD\Documents\brain-project\docs\produk\prd-v0.3.md`
(read-only). Tabel memakai **teks pencarian**, bukan nomor baris, supaya tidak
basi saat PRD disunting.

---

## 1. FR → potongan PRD → layar → modul kode

| FR | Nama | Cari di PRD | Layar | Modul kode | Tugas |
|---|---|---|---|---|---|
| FR-01 | Profil kesehatan | `**FR-01` | P4 | `src/modules/profil/` | B02 |
| FR-02 | Jadwal berulang + pengingat | `**FR-02` | P5 | `src/modules/jadwal-kontrol/` | B08 |
| FR-03 | Spesialis + janji anti-bentrok | `**FR-03` | P6–P8 | `src/modules/janji/` | B03 |
| FR-04 | Antrian + transisi status | `**FR-04` dan `### 3.5` | P9 | `src/modules/antrian/` | B07 |
| FR-05 | Catatan kebiasaan | `**FR-05` | P10–P11 | `src/modules/kebiasaan/` | B11, C09 |
| FR-06 | Panel konten statis | `**FR-06` | P12 | `src/modules/konten/` | B13 · UI tidak dibangun |
| FR-07 | Auth, sesi, dua role | `**FR-07`, `Session and access`, `### 4.4` | P1–P2, K1 | `src/modules/auth/` | B01 |
| FR-08 | Usulan perubahan admin | `**FR-08` dan `Open Questions` butir 15 | P13 | `src/modules/janji/` | B04 |
| FR-09 | Notifikasi + tanggapan | `**FR-09` | P13 | `src/modules/notifikasi/` | B05 |
| FR-10 | Audit log append-only | `**FR-10` | K7 | `src/modules/audit/` | B06 |
| FR-11 | Riwayat janji *(digabung ke FR-13)* | `**FR-11` | P14 | `src/modules/timeline/` | B10 |
| FR-12 | Resep + kepatuhan obat | `**FR-12` | P15 | `src/modules/resep-obat/` | B09 |
| FR-13 | Timeline kunjungan | `**FR-13` | P14 | `src/modules/timeline/` | B10 |
| FR-14 | Log aktivitas akun | `**FR-14` | P16 | `src/modules/aktivitas/` | B12 |

Contoh perintah baca (ganti `FR-03`):

```powershell
$prd = "C:\Users\HYPE AMD\Documents\brain-project\docs\produk\prd-v0.3.md"
Select-String -LiteralPath $prd -Pattern '^\*\*FR-03' -Context 0,25
```

---

## 2. Bagian PRD yang sering dipakai

| Butuh | Cari di PRD |
|---|---|
| Batasan yang diakui (termasuk yang **tidak** dikerjakan) | `### 1.4` |
| Target terukur | `### 2.3` |
| Siklus status janji | `### 3.4` |
| Siklus status antrian | `### 3.5` |
| Daftar 14 FR | `### 4.1` |
| Non-fungsional (performa, keamanan, WIB, aksesibilitas) | `### 4.2` |
| Kriteria terima per FR | `### 4.3` |
| Batas data yang boleh dilihat admin | `### 4.4` |
| Kebutuhan data / tabel | `## 6` |
| Checklist rilis | `### 7.4` |
| Pertanyaan terbuka (TTL, ambang kebiasaan) | `## 9` |

---

## 3. Layar desain

| Layar | Berkas vault | Cari |
|---|---|---|
| P1–P16 pasien | `design/02-wireframe-pasien.md` | `## P4` |
| K1–K7 admin | `design/03-wireframe-klinik.md` | `## K3` |
| State, copy, pesan galat | `design/04-state-dan-copy.md` | nama state (`kosong`, `galat`, `loading`) |
| Peta alur | `design/01-peta-alur.md` | — |

---

## 4. Letak berkas di repo ini

| Hal | Letak |
|---|---|
| Halaman dan routing | `src/app/` — jangan menaruh logika bisnis di sini |
| Logika per domain | `src/modules/<domain>/` |
| Akses database | `src/db/` (`schema/`, `migrations/`, `seed/`) |
| Utilitas lintas domain | `src/lib/` |
| Komponen UI bersama | `src/components/` |
| Uji unit | berdampingan dengan kode (`*.test.ts`) |
| Uji integration / system / security / performance / uat | `tests/` |
| Bukti uji | `docs/01-laporan-unit/` … `docs/05-bukti-performa/` |

Catatan: repo saat ini masih punya folder kosong bernama `test/` (tunggal).
Folder yang dipakai adalah `tests/` (jamak), sesuai `hirarki/hirarki yang diusulkan.md`.

---

## 5. Celah yang diketahui

Bagian ini tidak boleh diisi agen tanpa keputusan pemilik proyek.

| Celah | Dampak |
|---|---|
| Layar **P10, P11** (catatan kebiasaan) sudah punya tugas frontend `C09` | Ditutup 25 Oktober 2026; `C09` bergantung pada `C03` dan `B11` |
| Layar **P12** (panel konten statis) **sengaja tidak dibangun** | FR-06 kandidat potong kedua; backend `B13` tetap opsional. Bila dibangun, tambah tugas baru dengan `paths` `src/app/(pasien)/konten/**` |
| `design/02-wireframe-pasien.md` memuat judul ganda `## P13`, `## P14`, `## P15` | Rujukan bisa salah bagian; pakai yang memuat kode FR di judulnya |