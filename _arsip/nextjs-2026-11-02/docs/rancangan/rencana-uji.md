> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

# Fitur dan Rencana Uji

Lima fitur sudah dikunci di Final Ide (keputusan 19 Oktober 2026).
Berkas ini menerjemahkan tanda "Bahan uji" di sana menjadi pekerjaan
uji konkret, dipetakan ke komponen bobot mata kuliah:

Sejak PRD v0.3 (24 Oktober 2026) cakupan uji bertambah: **FR-12** (catatan
resep + kepatuhan obat), **FR-13** (timeline kunjungan), dan **FR-14** (log
aktivitas akun) - FR-11 dilebur ke FR-13. Uji juga mengikuti aturan lintas
fitur v0.3: zona waktu **WIB**, **anchor tanggal** pada jadwal berulang,
**TTL kunci slot** pada usulan perubahan, aksesibilitas terukur, dan
pembatasan sesi/percobaan login. Rujukan kanonik: `docs/produk/prd-v0.3.md`.

| Komponen penilaian | Bobot |
|---|---|
| Unit + integration test | 15% |
| System, performance, reliability, security | 15% |
| UAT | 15% |
| Presentasi final | 30% |

## Fitur 1 - Profil kesehatan pasien

Isi: kondisi terpantau, alergi, daftar obat. Menjadi dasar aturan fitur
lain dan dasar pembatasan akses.

| Jenis uji             | Pekerjaan konkret                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Static review         | Permit cek kode: kredensial tidak di-hardcode, query parametrik, tidak ada fake admin    |
| Access test per peran | Unit test: pasien tidak boleh baca profil pasien lain; dokter/klinik boleh; tamu ditolak |

Definisi selesai: CRUD profil jalan + minimal 3 unit test akses peran lulus.

## Fitur 2 - Jadwal berobat rutin berulang + pengingat

Aturan pengikat: interval berulang, penandaan jadwal terlewat, larangan pengingat ganda.

| Jenis uji | Pekerjaan konkret |
|---|---|
| Unit (aritmetika tanggal) | Interval 7/14/30 hari; batas akhir bulan: 31 Jan -> 28/29 Feb; tahun kabisat |
| Unit (penandaan terlewat) | Jadwal hari ini lewat jam X -> status terlewat, tidak memicu pengingat baru |
| Unit (anti ganda) | Dua kali panggilan pembuat pengingat untuk jadwal sama -> hanya 1 pengingat |

Definisi selesai: jadwal terbentuk otomatis + seluruh kasus batas
tanggal lulus di runner test.

## Fitur 3 - Pilih spesialis + janji dengan pencegahan bentrok

Aturan pengikat: satu slot dokter hanya boleh punya satu janji aktif.

| Jenis uji | Pekerjaan konkret |
|---|---|
| Reliability | Simulasi dua pasien menyimpan janji di slot yang sama hampir bersamaan -> tepat satu sukses, lainnya ditolak jelas |
| Security | Pasien mengubah ID di URL untuk janji/pasien lain -> ditolak, bukan data bocor |
| Integration | Janji sukses -> slot terkunci -> muncul di antrian |

Definisi selesai: skenario rebutan slot lulus + pengujian ID URL tercatat.

## Fitur 4 - Antrian kunjungan dengan transisi status

Aturan pengikat: alur status menunggu -> diperiksa -> selesai.

| Jenis uji | Pekerjaan konkret |
|---|---|
| Unit (mesin status) | Transisi legal lulus; transisi illegal (menunggu->selesai tanpa diperiksa) ditolak |
| Integration | Check-in -> nomor antrian terbit -> status bergerak sampai selesai -> jadwal kontrol berikutnya terbentuk |

Definisi selesai: tabel transisi lengkap uji, alur penuh berjalan otomatis.

## Fitur 5 - Catatan kebiasaan harian + ringkasan kepatuhan

Aturan pengikat: ambang batas eksplisit - hidrasi, rentang jam tidur,
aktivitas, runtutan hari.

| Jenis uji | Pekerjaan konkret |
|---|---|
| Unit (batas ambang) | Nilai < batas, tepat batas, di atas batas; jam tidur 0, 24, non-angka |
| Unit (runtutan hari) | Input tanggal bolong -> runtutan terhitung benar, tidak error |
| Integration | Catatan harian -> ringkasan kepatuhan diperbarui otomatis |

Definisi selesai: ringkasan menunjukkan angka kepatuhan yang benar
untuk data uji tetap (fixture) yang dirancang sekali dan dipakai semua.

## Pelengkap di luar 5 fitur - Panel konten statis

- Konten hanya dari sumber resmi (Kemenkes atau WHO) + dicatat URL dan
  tanggal pengambilannya.
- Hanya tampil bila kondisi terkait benar-benar tercatat di profil.
- Bukan bahan uji otomatis; cukup review statis dan screen capture.

## Sistem ujung ke ujung (system test, pekan kedua)

Skenario resmi ditarik dari Cerita Presentasi final ide:

1. Login pasien hipertensi.
2. Dokter menetapkan kontrol bulanan -> jadwal terbentuk.
3. Pengingat muncul 3 hari sebelum jatuh tempo.
4. Pasien memilih spesialis dan membuat janji.
5. Datang, check-in, mendapat nomor antrian.
6. Status antrian menunggu -> diperiksa -> selesai.
7. Jadwal kontrol berikutnya terbentuk otomatis.
8. Di antara kunjungan: catat kebiasaan, buka ringkasan kepatuhan.

Setiap langkah punya hasil yang diharapkan tertulis - dokumen uji system
tinggal mengisi tabel lulus/gagal.

## UAT (sebelum hari H, kolom paling akhir di platform pekerjaan)

- Daftar skrip UAT = skenario system di atas plus akses per peran.
- Bentuk: skrip langkah + tabel harapan vs faktanya + kolom tanda tangan.
- Penguat: minta minimal 1 orang di luar tim mengikuti skrip agar
  bukti UAT tidak sekadar catatan anggota sendiri.

## Performance test

Bobot menyebut performance, dan kebutuhannya paling sederhana dari semua:
- Uji beban ringan: 50-100 permintaan bersamaan pada janji dan antrian,
  catat waktu respon p95.
- Hanya butuh satu skrip load dengan alat curl/autocannon/k6 - bukan
  tuning infrastruktur.

## Produksi bukti dokumentasi

Semua keluaran di atas masuk folder `docs/` repositori proyek:
`01-laporan-unit`, `02-integration`, `03-system-uat`, `04-bukti-security`
agar presentasi final (bobot 30%) tidak bermain tebak-tebakan mencari jejak.
---

## Tautan

- [PRD v0.3 (kanonik)](prd-v0.3.md)
- [04 Pembagian Tugas](peran.md)
- [05 Risiko dan Tindak Lanjut](risiko.md)
- [02 Wireframe Pasien](design/02-wireframe-pasien.md)
