> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

# 02 - Wireframe Pasien (P1-P16)

> **v0.3:** P13, P14, P15, P16 adalah layar baru. Detail ada di bagian akhir.
> P5, P8, P9 diperbarui. Lihat [PRD v0.3 §5](../prd-v0.3.md).

Konvensi: `[ ]` kolom isian, `( )` tombol, `->` aksi, `##` cap status.

---

## P1 - Masuk

```
+------------------------------------------+
|  Kesehatan Saya                          |
|                                          |
|  Masuk                                   |
|  Lihat jadwal kontrol dan nomor antrian. |
|                                          |
|  Email                                   |
|  [ nama@contoh.com                     ] |
|                                          |
|  Kata sandi                              |
|  [ ..............................  Lihat]|
|                                          |
|  ( Masuk )                               |
|                                          |
|  Belum punya akun?  Daftar               |
+------------------------------------------+
```

- Tujuan: membuka sesi. FR-07.
- Naskah galat: "Email atau kata sandi tidak cocok." - tidak menyebut bagian
  mana yang salah.
- State: kosong, sedang memproses (tombol jadi "Memeriksa..."), galat, dan
  pesan dari layar lain ("Masuk dulu untuk membuka halaman ini").
- Jangan tampilkan menu, jadwal, atau cuplikan data apa pun sebelum masuk.

## P2 - Daftar

```
+------------------------------------------+
|  <- Kembali                              |
|                                          |
|  Buat akun                               |
|  Untuk pasien. Akun petugas dibuat       |
|  oleh klinik.                            |
|                                          |
|  Nama lengkap                            |
|  [                                       ]|
|  Email                                   |
|  [                                       ]|
|  Kata sandi (minimal 8 karakter)         |
|  [                                       ]|
|  Ulangi kata sandi                       |
|  [                                       ]|
|                                          |
|  ( Buat akun )                           |
+------------------------------------------+
```

- FR-07. Tidak ada verifikasi email, tidak ada login pihak ketiga.
- Galat per kolom, bukan satu galat di atas: "Kata sandi belum sama."
- Setelah sukses langsung masuk ke P3, bukan kembali ke P1.

## P3 - Beranda

```
+------------------------------------------+
|  Kesehatan Saya                [A] Arya  |
+------------------------------------------+
|  Kontrol berikutnya                      |
|  3 November 2026                         |
|  12 hari lagi - dr. Sari, Sp.PD          |
|  ( Lihat jadwal )                        |
+------------------------------------------+
|  Pengingat                               |
|  ## Datang 3 hari lagi                   |
|  Bawa kartu berobat dan hasil ukur       |
|  tekanan darah terakhir.                 |
+------------------------------------------+
|  Antrian hari ini                        |
|  Nomor 14 - sedang menunggu              |
|  ( Buka tiket )                          |
+------------------------------------------+
|  Catatan hari ini                        |
|  Belum diisi                             |
|  ( Catat kebiasaan )                     |
+------------------------------------------+
| Beranda | Jadwal | Antrian | Catatan     |
+------------------------------------------+
```

- Menjawab dua pertanyaan pertama pasien dengan angka, bukan kalimat.
- State tanpa jadwal: "Belum ada jadwal kontrol. Klinik akan menetapkannya
  setelah pemeriksaan." + tombol "Lihat riwayat".
- State profil kosong: pita di atas isi, "Lengkapi profil supaya klinik tahu
  kondisimu" + ( Lengkapi profil ). Bukan galat.
- State tamu: tidak pernah sampai di layar ini.

## P4 - Profil

```
+------------------------------------------+
|  <- Kembali                              |
|  Profil                                  |
|                                          |
|  Arya Tri Utomo                          |
|  arya@contoh.com                         |
|                                          |
|  Kondisi terpantau                       |
|  Hipertensi (sejak 2024)                 |
|  ( Ubah )                                |
|                                          |
|  Alergi                                  |
|  Tidak ada yang tercatat                 |
|                                          |
|  Obat                                    |
|  Amlodipine 5 mg - 1x sehari             |
|  ( Tambah obat )                         |
|                                          |
|  ( Ubah profil )                         |
|  Hapus profil                            |
+------------------------------------------+
```

Mode ubah:

```
+------------------------------------------+
|  <- Batal        Ubah profil             |
|                                          |
|  Kondisi terpantau                       |
|  [ Hipertensi                         ]  |
|  Sejak tahun                             |
|  [ 2024                               ]  |
|  Alergi                                  |
|  [ Tidak ada                         ]  |
|  Obat                                    |
|  [ Amlodipine 5 mg - 1x sehari       ]  |
|  ( Tambah obat lain )                    |
|                                          |
|  ( Simpan )                              |
+------------------------------------------+
```

Hapus profil (FR-01: hapus dengan konfirmasi):

```
+------------------------------------------+
|  Hapus profil?                           |
|                                          |
|  Data kondisi, alergi, dan obat akan     |
|  dihapus. Jadwal dan riwayat kunjungan   |
|  tetap tersimpan.                        |
|                                          |
|  Ketik HAPUS untuk melanjutkan           |
|  [                                     ] |
|  ( Batal )        ( Hapus profil )       |
+------------------------------------------+
```

- Tombol hapus memakai warna `stempel` dan hanya aktif setelah kata kunci
  benar. Ini satu-satunya tempat konfirmasi ketik dipakai.
- State akses: membuka ID pasien lain lewat URL -> layar 403 (lihat
  `04-state-dan-copy.md`), bukan profil kosong.

## P5 - Jadwal kontrol

```
+------------------------------------------+
|  Jadwal                    [A] Arya      |
|                                          |
|  Kontrol berikutnya                      |
|  3 November 2026                         |
|  Senin - 09.00                           |
|  dr. Sari, Sp.PD - Penyakit Dalam        |
|  Setiap 30 hari                          |
|  ( Buat janji )                          |
+------------------------------------------+
|  Berikutnya                              |
|  3 Desember 2026        ## Terjadwal     |
|  2 Januari 2027         ## Terjadwal     |
+------------------------------------------+
|  Sudah lewat                             |
|  4 Oktober 2026         ## Terlewat      |
|  Tidak ada pengingat baru untuk jadwal   |
|  ini. Hubungi klinik untuk menjadwalkan  |
|  ulang.                                  |
+------------------------------------------+
| Beranda | Jadwal | Antrian | Catatan     |
+------------------------------------------+
```

- FR-02. Tanggal dan jam memakai angka tabular besar; cap status memakai teks,
  bukan hanya warna.
- State tanpa jadwal: "Dokter belum menetapkan jadwal kontrol." + penjelasan
  singkat, tanpa tombol palsu.
- Pengingat tidak tampil sebagai halaman sendiri; ia muncul di Beranda dan
  sebagai penanda pada baris jadwal.

## P6 - Pilih spesialis

```
+------------------------------------------+
|  <- Kembali                              |
|  Pilih spesialis                         |
|  Untuk kunjungan 3 November 2026         |
|                                          |
|  ( Penyakit Dalam )  4 slot tersedia     |
|  ( Jantung )         0 slot tersedia     |
|  ( Umum )            9 slot tersedia     |
+------------------------------------------+
```

- FR-03. Spesialis tanpa slot tetap tampil, tetapi tidak bisa dipilih dan
  keterangannya jujur ("0 slot tersedia"), bukan disembunyikan.
- Menekan baris membuka P7 dengan spesialis itu terpilih.

## P7 - Pilih slot

```
+------------------------------------------+
|  <- Kembali                              |
|  Pilih waktu                             |
|  dr. Sari, Sp.PD                         |
|                                          |
|  <  Sen 2   Sel 3   Rab 4   Kam 5  >     |
|                                          |
|  09.00  [ 09.00 ]  10.00  [ 10.00 ]      |
|  11.00  [ 11.00 ]  13.00  [ 13.00 ]      |
|  14.00  [ 14.00 ]  15.00  ## Terisi      |
|  16.00  [ 16.00 ]                        |
|                                          |
|  ( Lanjut ke konfirmasi )                |
+------------------------------------------+
```

- Slot terisi ditandai teks "Terisi" dan tidak bisa ditekan. Jangan
  menampilkannya seolah kosong lalu menolak di akhir.
- State hari tanpa slot: "Tidak ada slot pada hari ini. Pilih tanggal lain."
- Tanggal yang tampil adalah tanggal lokal perangkat, ditulis eksplisit
  (Senin, 2 November 2026) supaya tidak ambigu.

## P8 - Konfirmasi janji

```
+------------------------------------------+
|  <- Kembali                              |
|  Konfirmasi janji                        |
|                                          |
|  Spesialis     dr. Sari, Sp.PD           |
|  Tanggal       Senin, 3 November 2026    |
|  Jam           10.00                     |
|  Lokasi        Klinik Sehat, lantai 1    |
|                                          |
|  Slot dikunci setelah kamu menekan       |
|  tombol di bawah.                        |
|                                          |
|  ( Buat janji )                          |
+------------------------------------------+
```

Setelah sukses:

```
+------------------------------------------+
|  Janji dibuat                            |
|                                          |
|  Senin, 3 November 2026 - 10.00          |
|  dr. Sari, Sp.PD                         |
|                                          |
|  Datang 15 menit lebih awal, lalu        |
|  check-in lewat menu Antrian.            |
|                                          |
|  ( Buka tiket antrian )                  |
|  ( Kembali ke beranda )                  |
+------------------------------------------+
```

- FR-03. State rebutan slot (409): "Slot ini baru saja diambil pasien lain.
  Pilih waktu lain." + tombol "Pilih waktu lain" yang kembali ke P7 dengan
  slot tersebut sudah ditandai terisi.

## P9 - Antrian

Belum check-in:

```
+------------------------------------------+
|  <- Kembali                              |
|  Antrian                                 |
|                                          |
|  Hari ini, Senin 3 November 2026         |
|  dr. Sari, Sp.PD - 10.00                 |
|                                          |
|  Sudah sampai di klinik?                 |
|  ( Check-in sekarang )                   |
+------------------------------------------+
```

Sudah check-in (tiket):

```
+------------------------------------------+
|  Nomor antrian                           |
|                                          |
|      +--------------------------+        |
|      |  . . . . . . . . . . . . |        |
|      |                          |        |
|      |           14             |        |
|      |                          |        |
|      |  dr. Sari - 10.00        |        |
|      |  . . . . . . . . . . . . |        |
|      +--------------------------+        |
|                                          |
|  ## Sedang menunggu                      |
|  Sekitar 25 menit lagi                   |
|                                          |
|  1 menunggu  ->  2 diperiksa  ->  3 selesai
|             ^ sekarang                   |
+------------------------------------------+
```

- FR-04. Nomor 56 px tabular, satu-satunya elemen berani di aplikasi.
- State check-in kedua: tombol hilang, diganti teks "Kamu sudah check-in.
  Nomor 14 tetap berlaku." - tidak ada galat merah.
- State selesai: "Kunjungan selesai. Jadwal kontrol berikutnya sudah dibuat."
  + ( Lihat jadwal ).
- Papan status memakai teks dan bentuk, bukan hanya warna.

## P10 - Catatan kebiasaan

```
+------------------------------------------+
|  Catatan                 [A] Arya        |
|  Senin, 3 November 2026                  |
|                                          |
|  Air minum                               |
|  ( - )        6 gelas        ( + )       |
|  Target 8 gelas                          |
|                                          |
|  Tidur                                   |
|  Mulai  [ 22.30 ]   Bangun [ 06.00 ]     |
|  Durasi 7 jam 30 menit                   |
|                                          |
|  Aktivitas                               |
|  ( - )       30 menit        ( + )       |
|  Target 30 menit                         |
|                                          |
|  ( Simpan catatan )                      |
+------------------------------------------+
```

- FR-05. Kolom tidur menerima 0 dan 24? Tidak: di luar 00.00-23.59 ditolak
  dengan pesan "Jam harus antara 00.00 dan 23.59". Bukan angka -> "Isi jam
  dengan angka, contoh 22.30".
- Pengatur +/- dipakai supaya tidak perlu mengetik di ruang tunggu.
- Tanggal hanya hari ini; mengubah hari lampau lewat "Riwayat" (bukan di
  layar ini).

Riwayat (bagian bawah layar yang sama, setelah tersimpan):

```
|  7 hari terakhir                         |
|  Sen ##lengkap  Sel ##lengkap  Rab ##kosong
|  Kam ##lengkap  Jum ##lengkap  Sab ##lengkap
```

## P11 - Ringkasan kepatuhan

```
+------------------------------------------+
|  <- Kembali                              |
|  Ringkasan                               |
|                                          |
|      4 dari 5 hari lengkap               |
|      ####################----  80%       |
|                                          |
|  Runtutan saat ini       3 hari          |
|  Runtutan terpanjang     7 hari          |
|                                          |
|  Rincian 7 hari terakhir                 |
|  Air minum       5 dari 7 hari           |
|  Tidur           6 dari 7 hari           |
|  Aktivitas       4 dari 7 hari           |
|                                          |
|  Catatan: kepatuhan dihitung dari batas  |
|  yang tertulis di halaman bantuan.       |
+------------------------------------------+
```

- FR-05. Semua angka harus bisa dihitung ulang dari data yang tampil; fixture
  uji memakai data yang sama.
- State belum ada data: "Belum ada catatan. Mulai dari hari ini." + tombol.

## P12 - Panel konten statis

```
+------------------------------------------+
|  <- Kembali                              |
|  Untuk hipertensimu                      |
|                                          |
|  Mengukur tekanan darah di rumah         |
|  4 menit baca - Kemenkes                 |
|  --------------------------------------  |
|  Garam dan tekanan darah                 |
|  6 menit baca - WHO                      |
|                                          |
|  Sumber: kemkes.go.id/... (diambil       |
|  21 Oktober 2026)                        |
+------------------------------------------+
```

- FR-06. Panel hanya muncul bila kondisi terkait tercatat di profil. Bila
  tidak, jalan masuknya tidak ada sama sekali - bukan halaman kosong.
- Setiap kartu wajib menampilkan sumber dan tanggal pengambilan. Isi panjang
  memakai Newsreader 17 px, lebar maksimal 62 karakter.

## P13 - Notifikasi & Tanggapan Pasien

```
+------------------------------------------+
|  <- Pemberitahuan                        |
|                                          |
|  ! Perubahan jadwal dari admin           |
|                                          |
|  Dokter Andi berhalangan pada            |
|  28 Oktober 2026 pukul 10.00.            |
|  Klinik mengusulkan:                     |
|                                          |
|  Slot baru: 29 Okt 2026 pukul 09.00       |
|  Alasan:   Dokter Andi diganti dr.Budi  |
|                                          |
|  Janji lama tetap aktif sampai          |
|  kamu menjawab.                            |
|                                          |
|  ( Setuju )  ( Tolak ) ( Pilih lain )|
|                                          |
+------------------------------------------+
```

- FR-09. Pasien melihat alasan + perbandingan jadwal lama vs baru.
- Tombol setuju, tolak, pilih slot lain. Setelah menjawab: tampilkan status jawaban.
- State kosong: "Tidak ada pemberitahuan baru."
- Batas waktu: 24 jam sebelum janji lama atau TTL kunci habis.

## P14 - Timeline Kunjungan

```
+------------------------------------------+------+--------------------------+
|  Kesehatan Saya        [A] Arya                  |
+------------------------------------------+----------+
|  30 Oktober 2026                                |
+------------------------------------------+
|  09.00 Check-in       ## Selesai                      +---.
+------------------------------------------------------|
|  Obat: Amlodipin 5 mg minum setiap pagi            |   |
|  (Sudah minum hari ini) (Belum)                    |   |
+------------------------------------------------------+
|  Obat: Metformin 500 mg malam hari senin  |  
+------------------------------------------------------+
|  Kontrol: Kunjungan kontrol. harus Minum4 mingg    |   
+------------------------------------------------------+
|  Jadwal kontrol berikutnya:                         |
|  26 November 2026                                  |
+------------------------------------------------------+--------------------------------------------------
|  15 Oktober 2026                                |
+--------------------------------------------------+
|  09.00 Janji terdahulu terlewat                  |
+--------------------------------------------------+
```

- FR-13. Satu urutan kronologis. Hanya milik pasien yang masuk.
- State kosong: "Belum ada riwayat. Buat janji pertama." + tombol
- Tautan ke P9, P15, P5.
- Data tidak bisa dihitung ulang dari beberapa sumber FR; tidak diaccess dari luar.

---
**Layar baru v0.3: P13, P14, P15, P16** — lihat PRD v0.3 §4.1 (FR-09, FR-12, FR-13, FR-14).

## P13 - Notifikasi & Tanggapan (FR-09)

- Daftar pemberitahuan usulan perubahan / pembatalan janji.
- Setiap notifikasi: alasan, slot lama, slot baru, sisa waktu menjawab.
- Tiga tombol: **Setuju**, **Tolak**, **Pilih slot lain**. Tidak ada tindakan lain.
- Setelah dijawab: status jawaban tampil; tombol tidak aktif. Tidak bisa menjawab dua kali.
- Janji lama tetap aktif sampai pasien menjawab atau batas waktu lewat.
- State kosong: "Tidak ada pemberitahuan baru."

## P14 - Timeline Kunjungan (FR-13)

- Satu tampilan kronologis: janji, check-in, kunjungan, catatan obat, jadwal kontrol berikutnya.
- Urut terbaru di atas. Setiap entri bisa diklik ke detail.
- Hanya menampilkan data milik pengguna sendiri.
- State kosong: "Belum ada riwayat. Buat janji pertama." + tombol ke P6.

## P15 - Obat & Kepatuhan Minum (FR-12)

- Satu kartu per obat: nama, dosis, aturan pakai, periode, nama pencatat.
- Label wajib pada setiap kartu: **"catatan resep, bukan saran medis"**.
- Tautan ke `e-fornas.kemkes.go.id` + tanggal pengambilan pada setiap kartu.
- Kontrol **sudah / belum minum** untuk hari ini; ringkasan 7 hari terakhir.
- **Tidak ada** tombol tambah, ubah, atau hapus obat. Pasien tidak bisa mengelola obat.
- Tidak ada fungsi yang memetakan kondisi ke obat (ditegakkan di kode dan data).
- State kosong: "Belum ada resep. Catatan obat diisi oleh klinik."

## P16 - Log Aktivitas Akun (FR-14)

- Daftar kronologis aktivitas sendiri: masuk, buat janji, ubah janji, check-in, tandai obat.
- Append-only, tidak bisa diubah atau dihapus.
- Hanya data milik pengguna yang masuk.
- State kosong: "Belum ada aktivitas." (kandidat dipotong bila gerbang G2 gagal)

## Contoh hipertensi:

1. Aturan tanggal (31 (31 Jan 31 → 28/29 Feb ) anchor.
2. Anchor tanggal: 31, kembali ke 31 bulan berikutnya.

## P15 - Obat & Kepatuhan Minum

```
+------------------------------------------+
|  <- Obat                              |
|  Obat saya                            |
|  --------------------------------------|
|  Amlodipin 5 mg             Cataatan   |
|  Minum setiap pagi          Resep Dokter
|  Setiap pagi
  1 kali setiap hari           21 September 2026 -|
|  21 September 2026 - 21             - dokter |
|                                          |
|  Hari ini: (Sudah) (Belum)                 |
|  --------- --------------                |
|  Minminggu: BBBLBBL                      |
|                                          |
|  Catatan obat, bukan saran medis.        |
|  Rujukan: e-fornas.kemkes.go.id          |
|  (diambil 24 Oktober 2026)               |
+------------------------------------------+
```

- FR-12. Pasien hanya membaca — tidak bisa menambah atau mengubah obat.
- Setiap nama, dosis, aturan pakai, periode, nama pencatat.
- Label "catatan resep, bukan saran medis" di setiap kartu.
- Tautan Fornas + tanggal pengambilan.
- Tidak ada fungsi yang memetakan kondisi ke obat.
---

## Tautan

- [01 Peta Alur](01-peta-alur.md)
- [03 Wireframe Admin](03-wireframe-klinik.md)
- [04 State dan Naskah](04-state-dan-copy.md)
- [PRD v0.3 (kanonik)](../prd-v0.3.md)
