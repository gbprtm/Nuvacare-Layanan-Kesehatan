> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

# 03 - Wireframe Klinik (K1-K7)

> **v0.3:** K5, K6, K7 adalah layar admin baru. K3, K4 diperbarui.
> "Petugas" diganti "admin". Lihat [PRD v0.3 §4.1](../prd-v0.3.md).

Layar admin dipakai di desktop, bukan ponsel. Kepadatan lebih tinggi dan
aksinya selalu berupa tindakan pada satu baris tabel yang jelas.

Konvensi: `[ ]` kolom isian, `( )` tombol, `##` cap status.

---

## Kerangka layar admin

```
+----------+--------------------------------------------------+
| Klinik   |  Daftar pasien                    Arya [keluar]  |
| Sehat    |--------------------------------------------------|
|          |                                                  |
| Pasien   |  isi                                             |
| Jadwal   |                                                  |
| Antrian  |                                                  |
|          |                                                  |
+----------+--------------------------------------------------+
```

- Navigasi kiri tetap, 220 px. Tidak ada navigasi bawah.
- Nama petugas dan tombol keluar selalu terlihat: ini akun bersama di satu
  ruang praktik, jadi sesi harus mudah ditutup.

## K1 - Masuk admin

```
+------------------------------------------+
|  Klinik Sehat - Masuk petugas            |
|                                          |
|  Email                                   |
|  [                                       ]|
|  Kata sandi                              |
|  [                                       ]|
|  ( Masuk )                               |
+------------------------------------------+
```

- FR-07. Akun dibuat lewat seed, bukan pendaftaran. Tidak ada tautan "Daftar"
  di layar ini.
- Galat sama dengan P1, tanpa membocorkan bagian mana yang salah.
- Setelah masuk, petugas mendarat di K4 bila ada antrian hari ini, selain itu
  di K2.

## K2 - Daftar pasien

```
+----------+--------------------------------------------------+
| Klinik   |  Daftar pasien          [ cari nama atau email  ]|
|          |--------------------------------------------------|
| Pasien   |  Nama             Kondisi       Jadwal berikutnya |
| Jadwal   |  Arya Tri Utomo   Hipertensi    3 Nov 2026       |
| Antrian  |  Dita             -             belum ditetapkan  |
|          |  Ibnu Zaki        Hipertensi    5 Nov 2026       |
|          |--------------------------------------------------|
|          |  Menampilkan 3 dari 3                            |
+----------+--------------------------------------------------+
```

- FR-01, FR-02. Kolom "Kondisi" kosong ditulis "belum diisi", bukan tanda
  hubung tanpa arti.
- Baris menekan membuka detail pasien: profil ringkas, riwayat kunjungan,
  dan tombol ( Tetapkan jadwal ), ( Lihat antrian ).
- Bila aturan akses dokter hanya untuk pasien tanggungan, daftar ini sudah
  terfilter di server, bukan disaring di layar. Layar tetap menampilkan
  keterangan "Menampilkan pasien yang menjadi tanggunganmu".
- State kosong: "Belum ada pasien yang terdaftar." + ( Tambah pasien ) bila
  pendaftaran pasien oleh petugas termasuk lingkup.

## K3 - Tetapkan jadwal kontrol

```
+----------+--------------------------------------------------+
| Klinik   |  Tetapkan jadwal - Arya Tri Utomo                |
|          |--------------------------------------------------|
|          |  Kondisi         Hipertensi                      |
|          |  Tanggal mulai   [ 3 November 2026 ]             |
|          |  Jam             [ 09.00 ]                       |
|          |  Ulangi setiap   ( 7 hari ) ( 14 hari ) ( 30 hari)|
|          |  Jumlah jadwal   [ 3 ]                           |
|          |                                                  |
|          |  Yang akan dibuat:                               |
|          |  3 Nov 2026, 3 Des 2026, 2 Jan 2027              |
|          |                                                  |
|          |  ( Simpan jadwal )                               |
+----------+--------------------------------------------------+
```

- FR-02. Pratinjau tanggal dihitung langsung saat interval diubah, memakai
  aturan batas akhir bulan yang sama dengan kode (31 Jan -> 28/29 Feb).
- Bila tanggal jatuh pada hari Minggu atau tanggal merah, tanggal **tidak**
  digeser otomatis pada versi ini (keputusan sederhana); keterangan
  "Jadwal tetap pada tanggal ini" ditampilkan supaya tidak mengejutkan.
- Setelah simpan: "3 jadwal dibuat. Pasien akan melihatnya di halaman Jadwal."
- State jadwal sudah ada: peringatan "Pasien sudah punya jadwal berulang
  aktif. Menyimpan akan menambah rangkaian baru." - mencegah dua rangkaian
  tanpa sadar.

## K4 - Papan antrian

```
+----------+--------------------------------------------------+
| Klinik   |  Antrian - Senin, 3 November 2026                |
|          |--------------------------------------------------|
|          |  Menunggu (2)      Diperiksa (1)    Selesai (3)  |
|          |  +-------------+   +------------+   +----------+ |
|          |  | 14 Arya     |   | 13 Dita    |   | 12 Ibnu  | |
|          |  | 10.00       |   | 09.30      |   | 09.00    | |
|          |  | ( Periksa ) |   | ( Selesai )|   |          | |
|          |  +-------------+   +------------+   +----------+ |
|          |  | 15 Vigo     |                                | |
|          |  | 10.30       |                                | |
|          |  | ( Periksa ) |                                | |
|          |  +-------------+                                | |
+----------+--------------------------------------------------+
```

- FR-04. Tiga kolom adalah tiga status sah; tidak ada tombol yang melompati
  status. Dari "Menunggu" hanya ada ( Periksa ); dari "Diperiksa" hanya ada
  ( Selesai ).
- Nomor antrian besar dan tebal karena inilah yang diteriakkan di ruang
  tunggu.
- Tombol transisi meminta konfirmasi ringan untuk "Selesai", karena aksi itu
  memicu pembuatan jadwal kontrol berikutnya.
- State kosong: "Belum ada pasien check-in hari ini." + keterangan jam buka.
- State galat transisi (menunggu -> selesai): pesan "Status tidak bisa
  dilompati. Periksa pasien dulu." dan kartu tidak berpindah kolom.

## Detail kunjungan (dibuka dari kartu K4)

```
+----------+--------------------------------------------------+
| Klinik   |  Kunjungan - Arya Tri Utomo                      |
|          |--------------------------------------------------|
|          |  Nomor 14 - 10.00 - dr. Sari, Sp.PD              |
|          |  Status: sedang diperiksa                        |
|          |                                                  |
|          |  Kondisi   Hipertensi                            |
|          |  Alergi    tidak ada                             |
|          |  Obat      Amlodipine 5 mg                       |
|          |                                                  |
|          |  Setelah selesai, jadwal kontrol berikutnya      |
|          |  dibuat otomatis bila rangkaian aktif.           |
|          |                                                  |
|          |  ( Tandai selesai )                              |
+----------+--------------------------------------------------+
```

- FR-04, bagian "selesai memicu jadwal berikutnya". Keterangan ini ditulis
  terang-terangan supaya petugas tidak mengira jadwal dibuat manual.

## Aturan akses di layar petugas

1. Menu dan tombol dibentuk dari peran di sesi. Menyembunyikan tombol dengan
   CSS bukan pengamanan - endpoint tetap memeriksa peran.
2. Petugas tidak punya jalan ke layar pasien (P3-P12). Bila membuka tautan
   pasien langsung, hasilnya 403.
3. Nomor antrian dan status hanya bisa diubah petugas; pasien hanya membaca.
---

## Tautan

- [01 Peta Alur](01-peta-alur.md)
- [02 Wireframe Pasien](02-wireframe-pasien.md)
- [04 State dan Naskah](04-state-dan-copy.md)
- [PRD v0.3 (kanonik)](../prd-v0.3.md)
