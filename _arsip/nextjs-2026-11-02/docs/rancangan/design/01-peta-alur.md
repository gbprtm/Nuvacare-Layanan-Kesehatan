> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

# 01 - Peta Alur dan Kerangka Layar

## 1. Peta alur pasien (skenario 10 langkah, v0.3) - lihat [PRD v0.3 bagian 3.3 UC-1](../prd-v0.3.md)

> **Perubahan v0.3:** nomor ESTIMASI saat booking (label "perkiraan"), nomor FINAL saat check-in. Nomor estimasi TIDAK dipakai sebagai urutan panggilan. Status antrian: belum check-in -> menunggu -> diperiksa -> selesai / tidak hadir. Default tampilan jadwal kontrol: agenda list + toggle bulan. Lihat [PRD v0.3 bagian 3.5](../prd-v0.3.md) untuk siklus status antrian.

```
TAMU
  |
  | buka tautan apa pun
  v
[P1 Masuk] --belum punya akun--> [P2 Daftar]
  |
  | sesi aktif
  v
[P3 Beranda] <-------------------------------+
  |  profil kosong -> ajakan lengkapi         |
  v                                           |
[P4 Profil] ---simpan--> [P3 Beranda]         |
                                              |
[P5 Jadwal kontrol]                           |
  |  ada pengingat 3 hari                     |
  v                                           |
[P6 Pilih spesialis]                          |
  v                                           |
[P7 Pilih slot]                               |
  v                                           |
[P8 Konfirmasi janji] --sukses--> [P9 Antrian]|
                                              |
[P9 Antrian] check-in -> tiket nomor          |
  |  status: menunggu -> diperiksa -> selesai |
  v                                           |
[P3 Beranda] (jadwal berikutnya muncul) ------+

[P10 Catatan kebiasaan] -> [P11 Ringkasan kepatuhan]
[P12 Panel konten]  (dari P4, bila kondisi tercatat)
```

Layar **admin** (v0.3, menggantikan "petugas"):

```
[K1 Masuk admin] -> [K2 Daftar pasien] -> [K5 Catat resep]
                                           -> [K3 Tetapkan aturan kontrol]
                -> [K4 Papan antrian] -> detail kunjungan (termasuk penutupan hari = tidak hadir)
                -> [K6 Usulan perubahan / pembatalan janji]
                -> [K7 Audit log (baca saja)]
```

Layar pasien baru v0.3: P13 Notifikasi & tanggapan usulan, P14 Timeline kunjungan, P15 Obat & kepatuhan minum, P16 Log aktivitas akun.
Layar admin baru v0.3: K5 Catat resep, K6 Usulan perubahan, K7 Audit log.
Antrian v0.3: nomor ESTIMASI saat booking, nomor FINAL saat check-in. Status: belum check-in, menunggu, diperiksa, selesai, tidak hadir.
Kontrol v0.3: default agenda list + toggle bulan (bukan kalender penuh).

## 2. Kerangka layar (shell)

Kerangka ini dipakai semua layar pasien. Judul berubah, isi berubah, kerangka
tidak.

```
+------------------------------------------+
|  Kesehatan Saya                [A] Arya  |  <- kepala, 56 px
+------------------------------------------+
|                                          |
|  Jadwal kontrol                          |  <- judul Newsreader 30 px
|  3 November 2026                         |  <- angka tabular
|                                          |
|  +------------------------------------+  |
|  | isi                                |  |
|  |                                    |  |
|  +------------------------------------+  |
|                                          |
|  [ Aksi utama, selebar layar ]           |  <- 48 px, tinta
|                                          |
+------------------------------------------+
| Beranda | Jadwal | Antrian | Catatan     |  <- navigasi bawah, 56 px
+------------------------------------------+
```

Aturan kerangka:

- Kepala selalu memuat nama produk dan satu jalan ke profil. Nama produk tidak
  dipakai sebagai judul layar.
- Judul layar adalah pertanyaan pengguna, bukan nama fitur internal.
- Navigasi bawah tidak pernah disembunyikan, kecuali di P1, P2, P8, dan P9
  tahap tiket (mode fokus).
- Layar petugas memakai kerangka berbeda: tanpa navigasi bawah, dengan
  tabel padat (lihat `03-wireframe-klinik.md`).

## 3. Inventaris layar

| ID  | Layar               | FR           | Tujuan                          | Kunci utama                                    |
| --- | ------------------- | ------------ | ------------------------------- | ---------------------------------------------- |
| P1  | Masuk               | FR-07        | Pasien membuka sesi             | Email, kata sandi, jalan ke daftar             |
| P2  | Daftar              | FR-07        | Membuat akun pasien             | Nama, email, kata sandi, konfirmasi            |
| P3  | Beranda             | FR-02, FR-04 | Menjawab "apa berikutnya"       | Jadwal terdekat, pengingat, antrian aktif      |
| P4  | Profil              | FR-01        | Melihat dan mengubah data dasar | Kondisi, alergi, obat; hapus dengan konfirmasi |
| P5  | Jadwal kontrol      | FR-02        | Melihat jadwal berulang         | Tanggal besar, status, pengingat, **toggle bulan** |
| P6  | Pilih spesialis     | FR-03        | Memilih tujuan kunjungan        | Daftar spesialis, slot terdekat                |
| P7  | Pilih slot          | FR-03        | Memilih waktu                   | Slot kosong vs terisi, tanpa menipu            |
| P8  | Konfirmasi janji    | FR-03        | Mengunci slot + **nomor ESTIMASI**  | Ringkasan, tombol "Buat janji", label "perkiraan |
| P9  | Antrian             | FR-04        | Tahu posisi dan status             | **Nomor FINAL** (check-in), status, tidak hadir  |
| P10 | Catatan kebiasaan   | FR-05        | Mencatat hari ini               | Hidrasi, tidur, aktivitas                      |
| P11 | Ringkasan kepatuhan | FR-05        | Melihat pola                    | Angka kepatuhan, runtutan hari                 |
| P12 | Panel konten        | FR-06        | Membaca materi resmi            | Sumber + tanggal pengambilan (kandidat dipotong)|
| **P13 | Notifikasi & tanggapan pasien|FR-09,Sator| Meliha usulan, setuju/tolak/timeline  | Penjelasaan, slot lama vs baru, setujui, tolak, pilih lain|
| P14 | Timeline kunjungan  | FR-13        | Melihat satu alur kronologis     | Janji + kunjungan + obat + jadwal berikutnya    |
| P15 | Obat & kepatuhan    | FR-12        | Membaca dan menandai minum      | Nama,dosis,atruran, label "bukan saran medis",Fornas |
| P16 | Log aktivitas       | FR-14        | Jejak aksi sendiri              | Append-only, hanya miliknya (kandidat dipotong) |
| K1  | Masuk admin         | FR-07        | Membuka sesi admin              | Email, kata sandi                              |
| K2  | Daftar pasien       | FR-01, FR-02 | Memilih pasien                  | Cari, daftar, status profil                    |
| K3  | Tetapkan aturan kontro | FR-02     | Membuat aturan kontrol          | Interval, mul, jumlah; **anchor tanggal**         |
| K4  | Papan antrian       | FR-04        | Memproses kunjungan             | Kolom status (5 status), aksi transisi, **tutup hari** |
| K5  | Catat resep         | FR-12        | Mencatat obat dari resep dokter | Nama,Fornas,dosis,atruran pakai,periode; bukan saran |
| K6  | Usulan perubahan    | FR-08        | Mengusulkan/menbataljanji       | Alasanwajib, sllot baru, TTL kunci              |
| K7  | Audit log           | FR-10        | Melihat log (baca)              | Append-only, delta sebelum-sesudah, alasan      |

## 4. Aturan navigasi

1. Tamu yang membuka layar mana pun selain P1 dan P2 langsung diarahkan ke P1,
   dengan pesan "Masuk dulu untuk membuka halaman ini".
2. Pasien tidak pernah melihat menu admin, dan sebaliknya. Menu dibentuk dari
   peran yang tersimpan di sesi, bukan disembunyikan dengan CSS.
3. Jalan kembali selalu ada: panah di kepala pada layar bertingkat (P6-P8),
   navigasi bawah pada layar utama.
4. Setelah aksi berhasil, pengguna mendarat di layar yang menunjukkan hasilnya,
   bukan kembali ke formulir kosong.
5. Satu tujuan maksimal lima layar dari Beranda. Alur terpanjang: Beranda ->
   Jadwal -> Spesialis -> Slot -> Konfirmasi = 5 layar, masih memenuhi syarat.
6. Admin tidak memiliki navigasi bawah; navigasi admin berupa daftar tautan
   di panel kiri atau atas, bergantung lebar layar.
7. Layar admin K6 (usulan perubahan) memuat daftar janji yang menunggu jawaban
   pasien, termasuk status "belum dibaca" dan sisa waktu TTL kunci slot.

## 5. Hubungan ke kode

Repo kode tidak menyimpan wireframe ini sebagai gambar. Yang dipindahkan ke
sana hanya keputusan: token, ukuran, urutan layar, dan naskah dari
`04-state-dan-copy.md`. Bila tampilan di kode berbeda dari berkas ini, salah
satunya harus diperbaiki dalam satu commit yang sama.

**Versi dokumen:** mengikuti PRD v0.3 (`docs/produk/prd-v0.3.md`).
**Arsip versi sebelumnya:** `_arsip/2026-10-24/design/01-peta-alur.md`.
---

## Tautan

- [02 Wireframe Pasien](02-wireframe-pasien.md)
- [03 Wireframe Admin](03-wireframe-klinik.md)
- [04 State dan Naskah](04-state-dan-copy.md)
- [PRD v0.3 (kanonik)](../prd-v0.3.md)
