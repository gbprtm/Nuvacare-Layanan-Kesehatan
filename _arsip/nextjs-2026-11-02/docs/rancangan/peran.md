> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

# Peran Eksekusi

Berkas ini **menggantikan** pembagian tugas lima anggota. Tidak ada kerja
kelompok, tidak ada pemilik per orang, tidak ada sprint tim.

Seluruh pekerjaan teknis dikerjakan agen. Pemilik proyek hanya memberi arahan,
menyetujui keputusan, dan memeriksa hasil.

Daftar tugas lengkap ada di `docs/to-do/rencana-agen.md`.

## Peran

| Peran | Sifat | Cakupan tugas |
|---|---|---|
| **Pemilik proyek** | Manusia | Menyetujui keputusan, memeriksa hasil, menandatangani UAT |
| **Agen Fondasi** | Agen | A01–A09 (repo, scaffold, env, database, auth, test runner, CI, deploy) |
| **Agen Data** | Agen | A10–A16 (skema, constraint, seed, WIB, kontrak API, dokumen skema) |
| **Agen Backend** | Agen | B01–B13 (endpoint dan uji per FR) |
| **Agen Frontend** | Agen | C01-C09 (15 layar pasien dan 7 layar admin; P12 tidak dibangun) |
| **Agen QA** | Agen | D01–D06 (integration, security, e2e, beban, UAT, bukti) |

Satu tugas hanya dikerjakan **satu agen**. Peran boleh berpindah agen, tetapi
tidak boleh dikerjakan bersamaan oleh dua agen pada berkas yang sama.

## Aturan kolaborasi antar agen

1. Kontrak API (`docs/api-contract.md`, tugas A15) harus selesai sebelum
   Agen Backend dan Agen Frontend bekerja pada fitur yang sama.
2. Dua agen boleh paralel hanya bila daftar `paths` tidak beririsan.
3. Setiap agen membaca `docs/to-do/rencana-agen.md` bagian 1 (kontrak kerja)
   sebelum mulai.
4. Agen tidak boleh mengubah status tugas milik agen lain.
5. Bila menemukan blocker, status diubah menjadi `blocked` dengan alasan
   satu kalimat — bukan dikerjakan dengan menebak.
6. Pemilik proyek memeriksa `git diff` sebelum menerima hasil.

## Urutan serah terima

| Dari | Ke | Syarat |
|---|---|---|
| Agen Fondasi | Agen Data | G0 lulus: skeleton hosting hidup, `npm test` hijau |
| Agen Data | Agen Backend | G1 lulus: migrasi lengkap, seed jalan, kontrak API tertulis |
| Agen Backend | Agen Frontend | Endpoint FR terkait sudah lulus uji sendiri |
| Agen Backend + Frontend | Agen QA | G3 lulus: alur inti selesai lewat UI |
| Agen QA | Pemilik proyek | G4 lulus: bukti lengkap, UAT bertanda tangan |

## Yang tidak berlaku lagi

- Pembagian lima anggota berdasarkan nama
- Peran "Penjaga Ruang Lingkup" dan "Pembuka Hambatan"
- Kartu tugas di papan platform tim
- Rapat kick-off penentuan tech stack
- Anggota cadangan atau rotasi tugas

Bila ada kebutuhan peran manusia, hanya dua: **pemberi arahan** dan
**penguji UAT dari luar tim** (satu orang, untuk bukti UAT).

---

## Tautan

- [To-Do Eksekusi](to-do.md)
- [Rencana Kerja Agen](rencana-agen.md)
- [03 Fitur dan Rencana Uji](rencana-uji.md)
- [05 Risiko dan Tindak Lanjut](risiko.md)
- [PRD v0.3 (kanonik)](prd-v0.3.md)
