> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

# 04 - State, Naskah, dan Peta Uji

Wireframe tanpa state adalah gambar. Berkas ini menetapkan apa yang terlihat
saat data kosong, saat permintaan gagal, dan saat akses ditolak - tiga kondisi
yang paling sering dilupakan dan paling sering muncul saat demonstrasi.

## 1. State wajib per layar

| Layar         | Kosong                                          | Memuat                              | Galat                                | Ditolak                      |
| ------------- | ----------------------------------------------- | ----------------------------------- | ------------------------------------ | ---------------------------- |
| P1 Masuk      | -                                               | tombol "Memeriksa..."               | "Email atau kata sandi tidak cocok." | -                            |
| P2 Daftar     | -                                               | tombol "Membuat akun..."            | galat per kolom                      | -                            |
| P3 Beranda    | belum ada jadwal / profil kosong                | kerangka abu-abu, bukan layar penuh | "Beranda gagal dimuat. Coba lagi."   | -                            |
| P4 Profil     | "Belum diisi" + aksi                            | -                                   | "Profil gagal disimpan."             | 403 bila ID milik orang lain |
| P5 Jadwal     | "Dokter belum menetapkan jadwal."               | daftar bertahap                     | "Jadwal gagal dimuat."               | -                            |
| P6 Spesialis  | "Belum ada spesialis tersedia."                 | -                                   | "Daftar gagal dimuat."               | -                            |
| P7 Slot       | "Tidak ada slot pada hari ini."                 | -                                   | "Slot gagal dimuat."                 | -                            |
| P8 Konfirmasi | -                                               | tombol "Mengunci slot..."           | 409 "Slot ini baru saja diambil."    | -                            |
| P9 Antrian    | belum check-in / belum ada janji                | -                                   | "Antrian gagal dimuat."              | -                            |
| P10 Catatan   | belum ada catatan hari ini                      | -                                   | galat per kolom                      | -                            |
| P11 Ringkasan | "Belum ada catatan."                            | -                                   | "Ringkasan gagal dihitung."          | -                            |
| P12 Konten    | kondisi tidak tercatat -> jalan masuk tidak ada | -                                   | "Materi gagal dimuat."               | -                            |
| K2 Pasien     | "Belum ada pasien."                             | -                                   | "Daftar gagal dimuat."               | daftar terfilter di server   |
| K3 Jadwal     | -                                               | tombol "Menyimpan..."               | "Jadwal gagal disimpan."             | -                            |
| K4 Antrian    | "Belum ada pasien check-in."                    | -                                   | "Status gagal diubah."               | transisi ilegal              |

Aturan umum:

- Setiap layar punya tiga state minimal: isi, kosong, galat. State "memuat"
  hanya boleh berbentuk kerangka di tempat isi akan muncul.
- Galat selalu menyebut apa yang gagal dan apa langkah berikutnya. Tidak ada
  "Terjadi kesalahan" tanpa aksi.
- Tombol yang memicu permintaan menjadi nonaktif dan berubah teks selama
  proses, lalu kembali. Tidak ada indikator berputar tanpa akhir.

## 2. Layar global

**403 - Tidak punya akses**

```
+------------------------------------------+
|  Halaman ini bukan untuk akunmu          |
|                                          |
|  Kamu masuk sebagai pasien. Data ini     |
|  milik akun lain.                        |
|                                          |
|  ( Kembali ke beranda )                  |
+------------------------------------------+
```

**404 - Tidak ditemukan**

```
+------------------------------------------+
|  Halaman tidak ditemukan                 |
|                                          |
|  Tautan mungkin sudah berubah.           |
|                                          |
|  ( Kembali ke beranda )                  |
+------------------------------------------+
```

**Tamu diarahkan ke P1**

```
+------------------------------------------+
|  Masuk dulu untuk membuka halaman ini.   |
|  ( Masuk )                               |
+------------------------------------------+
```

Pesan ini tampil di atas formulir P1, bukan sebagai halaman terpisah, supaya
pengguna tidak perlu menekan tombol tambahan.

**Galat server (500)** - "Halaman gagal dimuat. Coba lagi dalam beberapa saat."
+ ( Coba lagi ). Tidak menampilkan jejak teknis di layar.

## 3. Naskah

### Tombol (satu kata kerja, konsisten sampai hasilnya)

| Tombol | Muncul di | Hasil |
|---|---|---|
| Masuk | P1 | Sesi aktif |
| Buat akun | P2 | Akun dibuat, masuk otomatis |
| Lihat jadwal | P3 | P5 |
| Buka tiket | P3, P9 | P9 |
| Catat kebiasaan | P3 | P10 |
| Buat janji | P5, P8 | P8, lalu janji dibuat |
| Check-in sekarang | P9 | Tiket terbit |
| Simpan catatan | P10 | Catatan tersimpan, ringkasan diperbarui |
| Periksa / Selesai | K4 | Status berubah |

### Label

| Pakai | Jangan pakai |
|---|---|
| Jadwal kontrol | Entitas jadwal, jadwal kontrol berulang |
| Nomor antrian | Tiket antrian, queue number |
| Slot | Time slot, ketersediaan |
| Kondisi terpantau | Diagnosis, penyakit |
| Catatan kebiasaan | Log harian, tracking |

### Pesan galat (bentuk baku)

| Kejadian | Naskah |
|---|---|
| Kata sandi salah | Email atau kata sandi tidak cocok. |
| Kolom kosong | Isi dulu kolom ini. |
| Kata sandi pendek | Kata sandi minimal 8 karakter. |
| Kata sandi beda | Kata sandi belum sama. |
| Slot diambil orang lain | Slot ini baru saja diambil pasien lain. Pilih waktu lain. |
| Check-in kedua | Kamu sudah check-in. Nomor 14 tetap berlaku. |
| Transisi ilegal | Status tidak bisa dilompati. Periksa pasien dulu. |
| Jam tidur di luar rentang | Jam harus antara 00.00 dan 23.59. |
| Jam bukan angka | Isi jam dengan angka, contoh 22.30. |
| Akses data orang lain | Halaman ini bukan untuk akunmu. |

## 4. Aksesibilitas

- Kontras teks minimal 4.5:1. `tinta` di atas `kertas` jauh di atas ambang;
  `tinta-lemah` dipakai hanya untuk teks 16 px ke atas dan diverifikasi saat
  implementasi.
- Status tidak boleh bergantung pada warna saja: selalu teks ("Terlewat",
  "Terisi", "Selesai") di samping warnanya.
- Fokus keyboard terlihat: garis 2 px `tinta` dengan jarak 2 px dari kendali.
- Sasaran sentuh minimal 44 x 44 px, termasuk tombol +/- di P10.
- Setiap kolom isian punya label yang benar-benar terhubung, bukan hanya
  placeholder.
- Nomor antrian dibacakan dengan teks lengkap: "Nomor antrian 14, sedang
  menunggu", bukan hanya angka.
- Gerak: satu momen saja, yaitu tiket antrian muncul saat check-in berhasil.
  Dengan `prefers-reduced-motion`, tiket langsung tampil tanpa animasi.

## 5. Responsif

| Lebar | Perilaku |
|---|---|
| 360-767 px | Satu kolom, navigasi bawah, aksi utama selebar layar |
| 768-1023 px | Satu kolom dengan lebar maksimal 62 karakter, tetap navigasi bawah |
| 1024 px ke atas | Layar pasien tetap satu kolom terpusat; layar petugas memakai navigasi kiri 220 px dan tabel |
| 320 px | Tetap berfungsi: nomor antrian mengecil ke 44 px, tombol tetap 44 px |

## 6. Peta wireframe ke pengujian

| Layar      | Uji yang dibantu                                                                          |
| ---------- | ----------------------------------------------------------------------------------------- |
| P1, P2, P4 | Uji akses per peran: tamu ditolak, pasien tidak bisa membuka profil pasien lain           |
| P3, P5, K3 | Unit aritmetika tanggal dan pratinjau jadwal; system test langkah 2-4                     |
| P6, P7, P8 | Reliability rebutan slot; state 409 harus bisa ditunjukkan di layar, bukan hanya di log   |
| P9, K4     | Unit mesin status; integration check-in sampai jadwal berikutnya; system test langkah 5-7 |
| P10, P11   | Unit batas ambang dan runtutan hari; fixture yang sama dipakai di layar ringkasan         |
| P12        | Review statis: sumber dan tanggal tampil di layar                                         |
| Semua      | UAT: penguji luar tim mengikuti skrip tanpa dibantu anggota                               |

## 7. Definisi selesai satu layar

1. Tiga state ada: isi, kosong, galat (ditambah state ditolak bila layar
   menampilkan data milik orang lain).
2. Naskah memakai kata dari tabel di bagian 3, bukan istilah baru.
3. Nomor fitur (FR) yang dilayani tertulis di berkas wireframe.
4. Bisa dipakai dengan keyboard dan pembaca layar pada jalur utama.
5. Tampil benar pada 360 px dan 1024 px.
---

## Tautan

- [01 Peta Alur](01-peta-alur.md)
- [02 Wireframe Pasien](02-wireframe-pasien.md)
- [03 Wireframe Admin](03-wireframe-klinik.md)
- [Rencana Uji](../rencana-uji.md)
