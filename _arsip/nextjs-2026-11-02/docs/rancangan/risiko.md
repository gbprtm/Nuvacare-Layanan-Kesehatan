> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

# Risiko dan Tindak Lanjut

## Poin terbuka dari Final Ide

| Poin terbuka di Final Ide | Penanganan di plan ini | Kapan dituntaskan |
|---|---|---|
| Pembagian tugas lima anggota belum ada | **Tidak berlaku lagi.** Seluruh pekerjaan dikerjakan agen; peran ada di `04-pembagian-tugas.md` | Selesai |
| Sumber resmi konten statis (Kemenkes/WHO) belum dicari | **Ditunda**: FR-06 kandidat dipotong, disiapkan sebagai slide | Bila FR-06 dibangun |
| Pertanyaan bimbingan: modul antrian digabung draf klinik lama atau produk terpisah | Ditetapkan berdiri sendiri; menunggu konfirmasi pembimbing hanya untuk presentasi | Sebelum UAT |
| Tanggal hosting "akhir bulan" belum pasti | Sudah dikonfirmasi: 02/11/2026 menjadi patokan jadwal | Selesai |
| Node "Final ide" di kanvas sudah terisi | Tidak perlu tindakan | Selesai |

## Risiko dua pekan dan mitigasinya

| Risiko | Dampak bila terjadi | Mitigasi |
|---|---|---|
| Agen berhenti di tengah tugas | Fitur kehilangan progres | Status `blocked` wajib disertai sebab; agen berikutnya melanjutkan dari tugas yang sama |
| Uji security dan reliability sulit dirancang | Uji slot bersaing dan uji ID URL menjadi pekerjaan di hari terakhir | Kontrak uji ditulis dulu sebagai tabel harapan, kode dibaca ulang untuk memenuhinya |
| Hosting gagal saat hari H | Presentasi tanpa tautan hidup | Deploy uji coba paling lambat 31 Oktober, bukan 2 November |
| Database gratis tertidur saat presentasi | Permintaan pertama lambat | Buka aplikasi sekali sebelum presentasi untuk memanaskan Neon |
| Batas gratis Neon habis | Database berhenti sampai bulan berikutnya | Data demo kecil; pantau pemakaian; jangan menjalankan uji beban berulang |
| Fungsi melebar (ide baru masuk) | Semua target bergeser dan kualitas uji menurun | Pemilik proyek menolak pekerjaan di luar PRD; ide baru ke backlog |
| Dua agen menyentuh berkas yang sama | Konflik dan pekerjaan hilang | Aturan `paths` tidak beririsan di `rencana-agen.md` |

## Kepemilikan keputusan

| Keputusan | Siapa memutus | Status |
|---|---|---|
| Tech stack | Pemilik proyek | **Ditutup 25 Okt**: Next.js + TypeScript + PostgreSQL + Drizzle |
| Hosting dan database | Pemilik proyek | **Ditutup 25 Okt**: Vercel Hobby + Neon Free |
| Antrian gabungan atau terpisah | Pemilik proyek | Berdiri sendiri (ASUMSI PRD) |
| Angka ambang batas kebiasaan | Pemilik proyek + Agen Backend | Terbuka, batas 28 Okt |
| Memotong bagian pekerjaan | Pemilik proyek | Kapan saja, dicatat di action log |

## Kapan plan ini perlu diubah

- Tenggat berubah dari 02/11/2026: pangkas fitur, bukan uji kurangi.
  Urutan potong ada di `to-do.md` §5.
- Bimbingan memutuskan arah lain untuk modul antrian: sesuaikan tugas B07
  dan C04, bukan menambah modul baru.
---

## Tautan

- [03 Fitur dan Rencana Uji](rencana-uji.md)
- [04 Pembagian Tugas](peran.md)
- [PRD v0.3 (kanonik)](prd-v0.3.md)
- [To-Do Eksekusi](to-do.md)
