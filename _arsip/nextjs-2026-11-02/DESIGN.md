# DESIGN.md: Rancangan Antarmuka Web Klinik

Dokumen arah visual dan perilaku antarmuka untuk dua pengguna: **pasien** dan **admin klinik**. Produk adalah **website di browser**, bukan aplikasi mobile atau native.

Dokumen ini menjawab satu pertanyaan: bagaimana layar harus terlihat dan berperilaku. Apa yang dibuat dan mengapa ada di `docs/rancangan/prd-v0.3.md`. Tata letak per layar ada di `docs/rancangan/design/` (salinan baca dari vault). Bila dokumen ini bertentangan dengan wireframe di sana, **vault yang benar**: laporkan ke pemilik proyek, jangan diperbaiki sendiri (lihat `AGENTS.md` §1).

Contoh nama, angka, dan tanggal pada wireframe di bawah adalah **contoh isi**, bukan data produksi.

---

## 0. Keputusan yang masih terbuka

Beberapa hal belum diputuskan pemilik. Dokumen ini memakai usulan sementara dan menandainya **(usulan)**. Jangan menyatakannya sebagai keputusan final di UI atau di uji.

| # | Hal | Usulan sementara dalam dokumen ini |
|---|---|---|
| 1 | Nama produk | Wireframe vault memakai "Kesehatan Saya" (pasien) dan "Klinik Sehat" (admin). Versi lama dokumen ini memakai "KlinikKu". Dokumen ini menulis **[Nama produk]** sampai pemilik memutuskan. |
| 2 | Jendela check-in | 60 menit sebelum sampai 15 menit sesudah jam slot, nilai dari konfigurasi server (`api-contract.md` §7 menyebut detailnya belum final) |
| 3 | TTL kunci slot dan batas jawab usulan | 12 jam atau sampai 24 jam sebelum jadwal lama, mana yang lebih dulu (PRD pertanyaan 15) |
| 4 | Status "Dipanggil" | Kolom `waktu_panggil` ada, tetapi wireframe K4 hanya punya aksi Periksa. Rilis memakai tiga langkah (Menunggu, Diperiksa, Selesai). "Dipanggil" masuk setelah admin punya aksi Panggil (lihat §17). |
| 5 | Ambang kebiasaan (hidrasi, tidur, aktivitas) | Belum ada. Layar P10 dan P11 hanya mencatat dan menampilkan angka tercatat, tanpa target dan tanpa penilaian (lihat §8). |
| 6 | Data pasien yang boleh dilihat admin | Nama, jadwal, status, ringkasan alergi (PRD menunggu konfirmasi pembimbing). Wireframe K2 dan detail kunjungan masih menampilkan kondisi dan obat. |
| 7 | Pasien membatalkan atau mengubah janji sendiri | Tidak ada di inventaris layar vault. Dokumen ini tidak merancang tombolnya. |
| 8 | Seberapa sering status antrian diperbarui | Polling tiap 15 detik selama tab terlihat, plus tombol **Muat ulang** (usulan) |
| 9 | Sapaan pasien | Wireframe vault memakai "kamu". Dokumen ini mengikutinya. |

---

## 1. Arah desain

**Design Read:** website pengelola janji dan antrian klinik kecil, untuk pasien dewasa 40-65 tahun (termasuk lansia) dan admin klinik yang bekerja di desktop, dengan bahasa visual tenang seperti loket klinik, dial **ENERGY 1 / RHYTHM 2 / MOTION 1**.

Dial ini usulan yang belum disetujui pemilik. Alasannya: pengguna sering cemas atau terburu-buru, jadi antarmuka harus tenang dan dapat diprediksi. Variasi komposisi tetap perlu supaya layar tidak menjadi tumpukan kartu yang sama.

| Dial | Nilai | Artinya di produk ini |
|---|---|---|
| ENERGY | 1 | Tenang. Satu elemen berani per layar, yaitu angka atau tanggal yang menjawab pertanyaan pengguna. |
| RHYTHM | 2 | Konsisten, dengan jeda yang disengaja: daftar polos, kartu, dan blok bertinta berganti sesuai isi (lihat §6.3). |
| MOTION | 1 | Hanya respons terhadap tindakan, dan satu momen: kartu nomor antrian muncul setelah check-in. |

### 1.1 Satu hal yang diingat

Yang berani di seluruh produk adalah **nomor antrian**: angka serif besar pada kartu bertakik seperti karcis loket (§9.7). Angka yang sama, dengan huruf yang sama, dipakai di layar pasien (P9) dan papan admin (K4). Semua yang lain sengaja diam: latar polos, daftar tanpa kartu, hampir tanpa bayangan.

Alasannya satu baris: yang paling dicari pasien di ruang tunggu dan yang paling diteriakkan di ruang tunggu adalah satu angka, jadi angka itulah yang diberi suara.

### 1.2 Referensi

Gaya awal mengambil inspirasi dari satu landing page kesehatan (UiXShuvo): latar abu-biru muda, biru, lime, tombol hitam. Palet itu dipertahankan karena pilihan pemilik. Yang **tidak** dibawa dari referensi:

| Dari referensi | Keputusan | Alasan |
|---|---|---|
| Teks deskripsi ±11px, abu muda | Minimum 14px, kontras minimal 4.5:1 | Gagal aksesibilitas; pengguna utama berusia 40-65 |
| Teks putih di biru muda (±2.8:1) | Biru diperdalam ke `#2563EB` (5.17:1 dengan putih) | Gagal WCAG AA |
| Kartu bersudut 24-32px untuk semua hal | Radius 12 sebagai dasar, 16 hanya untuk kartu nomor antrian dan dialog | Radius seragam menghapus beda antara kartu, input, dan tombol |
| Kartu mengambang dengan bayangan | Datar secara bawaan; bayangan hanya untuk kartu nomor antrian, dialog, dan toast | Bila semua mengambang, tidak ada yang menonjol |
| Statistik "12K+", "88%" | Tidak dibawa | Angka tanpa sumber dilarang (§8, aturan data) |
| Foto dokter di kartu | Tidak dipakai | Dokter adalah data (nama, spesialisasi, slot). Foto adalah aset yang belum diminta dan belum ada. |
| Ilustrasi dokter dan pasien | Tidak dipakai | Tidak ada ilustrasi orisinal yang terhubung ke produk. Layar kosong memakai teks dan satu aksi. |
| "4 Easy Steps" | Tidak dipakai sebagai komponen dekoratif | Alur janji memang berurutan, tetapi hanya tiga layar (P6, P7, P8). Cukup judul layar dan tombol kembali. |

### 1.3 Alasan keputusan besar

| Keputusan | Alasan satu baris |
|---|---|
| Latar `#EEF1F6`, permukaan putih | Dari referensi pemilik; putih memisahkan isi dari latar tanpa garis tebal. |
| Biru `#2563EB` | Satu-satunya warna inti selain tinta; menandai yang bisa ditekan, yang terpilih, dan kartu nomor antrian. |
| Lime `#D9EE4F` | Aksen tunggal; hanya dipakai di dua tempat (§3.2). Dipakai di mana-mana, ia berhenti jadi aksen. |
| Tombol utama hitam (`ink`) | Aksi utama harus tampak berbeda dari tautan biru; satu tombol hitam per layar. |
| Newsreader untuk judul dan nomor | Memberi suara manusiawi, seperti tulisan pada kartu berobat. Angkanya terbaca jelas pada ukuran besar. |
| Plus Jakarta Sans untuk isi dan kontrol | Terbaca pada 14-16px, jarak huruf lega, mendukung bahasa Indonesia. |
| Radius 12 sebagai dasar | Cukup lembut untuk layanan kesehatan, cukup tegas supaya input, tombol, dan kartu tetap berbeda dari chip status. |
| Daftar polos untuk pengingat, riwayat, obat | Isinya urutan, bukan benda terpisah; garis tipis cukup. Kartu dicadangkan untuk hal yang bisa ditindaklanjuti. |
| Tanpa mode gelap pada rilis ini | Hanya terang. Pasien memakai di ruang tunggu dan siang hari; tenggat rilis tidak memberi ruang untuk dua tema yang diuji penuh. Token memakai nama semantik agar mode gelap bisa ditambah tanpa mengubah komponen. |
| Tanpa ilustrasi dan tanpa foto | Tidak ada aset orisinal; teks yang jelas lebih baik daripada gambar generik. |
| Kamu, bukan Anda | Mengikuti naskah wireframe vault. |

---

## 2. Prinsip desain

1. **Satu layar, satu pertanyaan.** Judul layar adalah pertanyaan pengguna ("Kapan kontrol berikutnya?"), bukan nama fitur internal.
2. **Status selalu terlihat.** Janji, antrian, dan usulan jadwal dapat dipahami dalam 3 detik, dengan teks dan ikon, tidak hanya warna.
3. **Tidak ada jalan buntu.** Setiap kondisi kosong, gagal, atau penuh menyebut sebabnya dan memberi satu langkah berikutnya.
4. **Bahasa sederhana.** Pakai kata dari tabel istilah di §13.
5. **Aksesibel sejak awal.** Pengguna lansia dan pengguna dengan penglihatan terbatas adalah pengguna utama.
6. **Tidak menjanjikan yang tidak ada.** Pemberitahuan hanya tampil di dalam website. Dokter bukan pengguna. Aplikasi mencatat, tidak menyarankan. UI tidak boleh mengesankan sebaliknya.

---

## 3. Sistem warna

Semua pasangan di bawah dihitung dengan rumus kontras WCAG 2.2, bukan diperkirakan.

### 3.1 Token

| Token | Hex | Dipakai untuk |
|---|---|---|
| `--color-bg` | `#EEF1F6` | Latar halaman |
| `--color-surface` | `#FFFFFF` | Kartu, sheet, dialog, input |
| `--color-line` | `#E3E7EE` | Pemisah dan tepi kartu (dekoratif, bukan batas kendali) |
| `--color-line-strong` | `#7A8494` | Tepi kendali: input, chip slot, tombol sekunder, kotak centang |
| `--color-ink` | `#111418` | Teks utama, tombol utama |
| `--color-ink-2` | `#5B6472` | Teks sekunder dan placeholder |
| `--color-primary` | `#2563EB` | Tautan, pilihan aktif, kartu nomor antrian, cincin fokus di atas latar terang |
| `--color-primary-ink` | `#1D4ED8` | Teks biru di atas `primary-soft` |
| `--color-primary-soft` | `#E6EEFF` | Latar chip terpilih, baris yang disorot |
| `--color-accent` | `#D9EE4F` | Aksen tunggal (§3.2) |
| `--color-success` | `#15803D` | Ikon dan latar solid status berhasil |
| `--color-success-ink` | `#14532D` | Teks di atas `success-soft` |
| `--color-success-soft` | `#E7F6EC` | Latar status berhasil |
| `--color-warning` | `#B45309` | Ikon dan latar solid status perlu tindakan |
| `--color-warning-ink` | `#7C2D12` | Teks di atas `warning-soft` |
| `--color-warning-soft` | `#FFF4E0` | Latar peringatan |
| `--color-danger` | `#DC2626` | Ikon dan latar solid status gagal atau batal |
| `--color-danger-ink` | `#991B1B` | Teks di atas `danger-soft` dan tombol teks hapus |
| `--color-danger-soft` | `#FDECEC` | Latar galat |
| `--color-disabled-fg` | `#8A93A1` | Teks dan ikon kontrol nonaktif (dikecualikan dari syarat kontras WCAG, tetap disertai penjelasan teks) |
| `--color-disabled-bg` | `#E3E7EE` | Latar kontrol nonaktif |

Palet inti: netral (`bg`, `surface`), tinta (`ink`), biru (`primary`). Aksen: lime. Hijau, oranye, dan merah adalah **warna status**, bukan warna merek, dan tidak dipakai sebagai hiasan.

`--color-ink-3` (`#8A93A1`, kontras 3.1:1) dari versi lama **dihapus**: terlalu pucat untuk teks. Placeholder memakai `ink-2`.

### 3.2 Aturan pemakaian

- Proporsi kasar: 60% netral, 30% tinta, 10% biru dan aksen.
- **Lime hanya di dua tempat:** (1) penanda "Sekarang" pada langkah antrian yang aktif, (2) sorotan jadwal usulan pada perbandingan lama dan baru di P13. Selalu sebagai latar dengan teks `ink`, tidak pernah sebagai teks atau garis di atas putih.
- Satu layar punya **satu tombol utama** (hitam). Biru adalah warna "bisa ditekan atau sedang dipilih": tautan, slot terpilih, tab aktif.
- Makna tidak boleh hanya lewat warna: setiap status punya teks, dan ikon bila ruang cukup.
- Teks berwarna di atas latar `*-soft` memakai varian `*-ink`, bukan warna solid.
- Tidak ada gradien, tidak ada kilau (glow), tidak ada kaca buram (blur).

### 3.3 Pasangan kontras yang diverifikasi

| Teks | Latar | Rasio | Lolos teks biasa (4.5) |
|---|---|---|---|
| `ink` | `surface` | 18.47 | ya |
| `ink` | `bg` | 16.31 | ya |
| `ink` | `accent` | 14.33 | ya |
| `ink-2` | `surface` | 5.98 | ya |
| `ink-2` | `bg` | 5.28 | ya |
| `primary` | `surface` | 5.17 | ya |
| `primary` | `bg` | 4.57 | ya (tipis; jangan dipakai di atas latar lain) |
| `surface` | `primary` | 5.17 | ya |
| `surface` | `success` | 5.02 | ya |
| `surface` | `warning` | 5.02 | ya |
| `surface` | `danger` | 4.83 | ya |
| `primary-ink` | `primary-soft` | 5.76 | ya |
| `success-ink` | `success-soft` | 8.15 | ya |
| `warning-ink` | `warning-soft` | 8.60 | ya |
| `danger-ink` | `danger-soft` | 7.28 | ya |
| `danger-ink` | `surface` | 8.31 | ya |

Kombinasi yang **gagal** dan karena itu dilarang: `primary` di atas `primary-soft` (4.44), `success` di atas `success-soft` (4.49), `danger` di atas `danger-soft` (4.23), `primary` di atas `accent` (4.01).

Tepi kendali memakai `line-strong`: 3.78:1 di atas putih dan 3.34:1 di atas `bg`, memenuhi 3:1 untuk komponen non-teks. `line` (1.24:1) hanya untuk pemisah dan tepi kartu yang tidak berfungsi sebagai kendali.

Setiap token baru wajib dihitung ulang sebelum dipakai. Hasil ukur pada CSS yang berjalan belum ada; dokumen ini baru memverifikasi nilai heks.

### 3.4 Warna dan ikon status

Status ditentukan oleh kontrak di §17; tabel ini hanya soal tampilan.

| Label UI | Latar | Teks | Ikon |
|---|---|---|---|
| Belum check-in | `bg` dengan tepi `line-strong` | `ink-2` | jam |
| Menunggu | `primary-soft` | `primary-ink` | jam pasir |
| Giliran berikutnya (turunan) | `warning-soft` | `warning-ink` | lonceng |
| Sedang diperiksa | `primary` solid | `surface` | stetoskop |
| Selesai | `success-soft` | `success-ink` | centang |
| Tidak hadir, Dibatalkan | `danger-soft` | `danger-ink` | silang |
| Terjadwal | `bg` dengan tepi `line-strong` | `ink` | kalender |
| Menunggu jawabanmu | `warning-soft` | `warning-ink` | tanda seru |

Chip status adalah satu-satunya elemen berbentuk pil.

---

## 4. Tipografi

| Peran | Keluarga | Alasan |
|---|---|---|
| Judul layar, nomor antrian, tanggal besar | **Newsreader** | Suara manusiawi; angka besar terbaca jelas |
| Isi, label, tombol, tabel | **Plus Jakarta Sans** | Terbaca pada 14-16px, cocok untuk teks Indonesia |

Cadangan: Georgia untuk Newsreader; system-ui untuk Plus Jakarta Sans.

| Gaya | Ukuran / tinggi baris | Bobot | Keluarga | Dipakai untuk |
|---|---|---|---|---|
| Nomor antrian | 56 / 56 (44 / 44 pada lebar 320px) | 600 | Newsreader | Hanya nomor pada kartu nomor antrian dan papan K4 |
| H1 | 30 / 38 | 600 | Newsreader | Judul layar |
| H2 | 22 / 30 | 600 | Newsreader | Judul bagian |
| H3 | 18 / 26 | 600 | Plus Jakarta Sans | Judul kartu atau baris |
| Isi | 16 / 26 | 400 | Plus Jakarta Sans | Teks utama |
| Isi kecil | 14 / 22 | 400 | Plus Jakarta Sans | Keterangan, teks sekunder |
| Label | 14 / 20 | 600 | Plus Jakarta Sans | Tombol, label kolom isian, kepala tabel |

Aturan:
- Teks isi tidak boleh di bawah 14px. Tidak ada gaya 12px.
- Angka waktu dan nomor memakai `font-variant-numeric: tabular-nums`. Verifikasi saat implementasi bahwa Newsreader menyediakan angka tabular; bila tidak, nomor antrian memakai Plus Jakarta Sans.
- Panjang baris isi 45-75 karakter. Teks harus tetap utuh saat diperbesar 200%.
- Huruf kapital semua tidak dipakai. Judul bagian memakai huruf kapital kalimat biasa.
- Judul tidak memakai satu kata berwarna atau miring sebagai hiasan.

### 4.1 Pemuatan font

- Muat font lewat mekanisme font bawaan Next.js (diunduh saat build dan disajikan dari domain yang sama). Cek `node_modules/next/dist/docs/` untuk API versi yang terpasang sebelum menulis kode.
- Subset `latin`, `font-display: swap`, dan hanya bobot yang dipakai (Newsreader 600, Plus Jakarta Sans 400, 600).
- Fallback harus memakai penyesuaian metrik supaya tulisan tidak bergeser besar saat font utama tiba.
- Uji tampilan tanpa font utama: semua layar harus tetap terbaca dan tidak terpotong.

---

## 5. Layout dan grid

### 5.1 Breakpoint (lebar viewport, bukan jenis perangkat)

Mengikuti `design/04-state-dan-copy.md` §5.

| Lebar viewport | Layar pasien | Layar admin |
|---|---|---|
| 320 px | Tetap berfungsi: nomor antrian 44 px, tombol tetap 44 px | Tidak ditargetkan |
| 360-767 px | Satu kolom, margin 16, navigasi bawah, aksi utama selebar layar | Tidak ditargetkan |
| 768-1023 px | Satu kolom, lebar isi maksimal 62 karakter, navigasi bawah | Navigasi kiri 220 px (usulan; wireframe vault belum menetapkan) |
| 1024 px ke atas | Satu kolom terpusat, lebar maksimal 640 px; navigasi tampil sebagai baris tab di bawah kepala (usulan) | Navigasi kiri 220 px, tabel padat, lebar isi maksimal 1200 px |

Layar admin dipakai di desktop. Pada lebar di bawah 768 px, admin tetap harus bisa dipakai dan tidak meluap, tetapi tidak dioptimalkan.

### 5.2 Spasi (kelipatan 4)

`4, 8, 12, 16, 24, 32, 48`

Spasi tidak seragam, ia bagian dari struktur:
- Dalam satu kelompok (label dan isinya): **4-8**.
- Antar baris dalam satu daftar: **12-16**.
- Antar kelompok pada satu layar: **24**.
- Sebelum bagian baru yang berbeda sifat (mis. dari pengingat ke riwayat): **48**.

### 5.3 Radius dan bayangan

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `radius-sm` | 8 | Kotak centang, tag kecil |
| `radius-md` | 12 | **Dasar:** tombol, input, kartu, chip slot |
| `radius-lg` | 16 | Kartu nomor antrian, dialog, sheet |
| `radius-full` | 999 | Chip status dan avatar inisial saja |
| `shadow-raised` | `0 8px 24px rgba(37,99,235,.18)` | Hanya kartu nomor antrian |
| `shadow-overlay` | `0 8px 32px rgba(17,20,24,.18)` | Dialog, sheet, toast |

Kartu biasa datar: latar putih, tepi `line` 1px, tanpa bayangan. Tombol datar. Bayangan hanya penanda "berada di atas halaman".

### 5.4 Ukuran kendali

- Sasaran sentuh minimum **44 x 44 px** (mengikuti wireframe vault dan PRD), jarak antar sasaran minimal 8px. Aksi utama 48px.
- Tinggi tombol utama 48, tombol sekunder 44. Tinggi input 48.
- Tinggi kepala 56. Tinggi navigasi bawah 56 ditambah area aman.
- Satuan implementasi: `px` untuk garis dan radius, `rem` untuk teks dan spasi supaya mengikuti pembesaran teks pengguna.

---

## 6. Struktur halaman

### 6.1 Kerangka pasien

```text
+------------------------------------------+
|  [Nama produk]                 [A] Arya  |  kepala 56 px, avatar = ke Profil
+------------------------------------------+
|  Judul layar (pertanyaan pengguna)       |
|  isi                                     |
|  [ Aksi utama, selebar layar ]           |
+------------------------------------------+
| Beranda | Jadwal | Antrian | Catatan     |  navigasi bawah 56 px
+------------------------------------------+
```

- Navigasi: **Beranda, Jadwal, Antrian, Catatan**. Profil dibuka dari avatar di kepala. Pemberitahuan (P13), Obat (P15), dan Riwayat (P14) dibuka dari Beranda.
- Nama produk tidak pernah menjadi judul layar.
- Navigasi bawah disembunyikan hanya pada P1, P2, P8, dan P9 tahap kartu nomor antrian (mode fokus).
- Setiap layar bertingkat (P6-P8) punya tombol kembali di kiri atas.

### 6.2 Kerangka admin

Mengikuti `03-wireframe-klinik.md`.

```text
+----------+--------------------------------------------------+
| [Nama    |  Judul layar                     Arya [Keluar]   |
|  produk] |--------------------------------------------------|
| Pasien   |                                                  |
| Jadwal   |  isi                                             |
| Antrian  |                                                  |
| Usulan   |                                                  |
| Audit    |                                                  |
+----------+--------------------------------------------------+
```

Nama admin dan tombol **Keluar** selalu terlihat, karena akun dipakai bersama di satu ruang praktik.

### 6.3 Ritme: apa yang kartu, apa yang daftar

| Isi | Bentuk | Alasan |
|---|---|---|
| Nomor antrian aktif | Kartu nomor antrian biru, bertakik | Satu-satunya elemen berani |
| Janji atau kontrol terdekat | Kartu putih dengan tanggal besar | Ada tindakan (buat janji, check-in) |
| Usulan jadwal dari klinik | Blok berlatar `warning-soft` | Butuh jawaban sebelum batas waktu |
| Pengingat, riwayat, obat, jadwal berikutnya | Daftar polos, baris dipisah garis `line` | Urutan, bukan benda terpisah |
| Catatan hari ini | Baris dengan kolom isian langsung | Diisi cepat, tanpa membuka layar lain |

Pada Beranda, urutan mengikuti tindakan yang paling mendesak: (1) usulan jadwal bila ada, (2) antrian hari ini bila ada, (3) kontrol berikutnya, (4) pengingat, (5) catatan hari ini.

---

## 7. Alur utama pasien

```text
Masuk (P1) atau Daftar (P2)
  -> Beranda (P3)
  -> Jadwal (P5) -> Pilih spesialis (P6) -> Pilih waktu (P7) -> Konfirmasi (P8)
  -> [hari kunjungan] Antrian (P9): Check-in sekarang
  -> kartu nomor antrian (nomor final)
  -> Menunggu -> Sedang diperiksa -> Selesai
  -> Beranda: jadwal kontrol berikutnya sudah dibuat
```

Cabang:
- **Klinik mengusulkan ubah jadwal:** blok di Beranda dan di Pemberitahuan (P13), lalu Setuju, Tolak, atau Pilih slot lain. Janji lama tetap aktif sampai pasien menjawab atau batas waktu lewat.
- **Slot terambil orang lain saat konfirmasi:** pesan 409 jelas, kembali ke P7 dengan slot itu sudah ditandai Terisi.
- **Check-in belum dibuka:** tombol nonaktif disertai teks kapan akan aktif.
- **Nomor perkiraan bukan urutan panggilan.** Sebelum check-in, pasien hanya melihat nomor perkiraan berlabel "perkiraan". Nomor final terbit saat check-in dan tidak berubah.

---

## 8. Spesifikasi layar pasien

Kode layar mengikuti `docs/rancangan/design/02-wireframe-pasien.md`. Bagian ini menambahkan keputusan visual dan perilaku; tata letak rinci ada di wireframe itu.

### Aturan data dan angka (berlaku untuk semua layar)

- Setiap angka di UI berasal dari data nyata atau dihitung dari catatan pengguna. Tidak ada angka hiasan, tidak ada persentase tanpa dasar, tidak ada tanda naik atau turun tanpa periode pembanding yang disebut.
- Persentase kepatuhan = dosis tercatat diminum / dosis yang dijadwalkan dalam 7 hari terakhir. Bila data kurang dari 3 hari **(usulan)**, tampilkan "Belum cukup data", bukan persentase.
- Data contoh untuk pengembangan harus berlabel "data contoh" dan tidak boleh muncul di produksi.
- Kolom kosong ditulis "Belum diisi", bukan tanda hubung tanpa arti.

### P1 Masuk dan P2 Daftar (FR-07)

- P1: email, kata sandi (tombol **Lihat** untuk menampilkan), tombol **Masuk**, tautan ke Daftar. Galat: "Email atau kata sandi tidak cocok." tanpa menyebut bagian mana yang salah.
- P2: nama lengkap, email, kata sandi (minimal 8 karakter, aturan tampil sebelum pengguna salah), ulangi kata sandi. Tidak ada verifikasi email, login pihak ketiga, atau masuk dengan biometrik. NIK dan nomor KK tidak dikumpulkan.
- Galat tampil **di bawah kolom** dengan ikon dan teks, dan fokus pindah ke kolom yang bermasalah.
- Tombol berubah menjadi "Memeriksa..." atau "Membuat akun..." dan nonaktif selama proses.
- Pesan dari layar lain ("Masuk dulu untuk membuka halaman ini") tampil di atas formulir P1.
- Tidak ada layar sambut terpisah dan tidak ada ilustrasi; P1 adalah pintu masuk.

### P3 Beranda

Urutan di §6.3. Judul: "Halo, Arya." Tanggal hari ini ditulis penuh dengan hari dan WIB.

```text
+------------------------------------------+
|  [Nama produk]                 [A] Arya  |
+------------------------------------------+
|  Klinik mengusulkan jadwal baru          |  warning-soft, hanya bila ada
|  Batas menjawab: 2 November 2026, 17.00  |
|  ( Tinjau usulan )                       |
+------------------------------------------+
|  Antrian hari ini                        |
|  Nomor 14, sedang menunggu               |
|  ( Buka kartu nomor )                    |
+------------------------------------------+
|  Kontrol berikutnya                      |
|  3 November 2026                         |  Newsreader, tabular
|  12 hari lagi, dr. Sari, Sp.PD           |
|  ( Lihat jadwal )                        |
|                                          |
|  Pengingat                               |
|  Datang 3 hari lagi                      |  daftar polos
|  Obat pagi belum ditandai                |
|                                          |
|  Catatan hari ini: belum diisi           |
|  ( Catat kebiasaan )                     |
+------------------------------------------+
| Beranda | Jadwal | Antrian | Catatan     |
+------------------------------------------+
```

- Profil kosong: pita "Lengkapi profil supaya klinik tahu kondisimu" dengan tombol **Lengkapi profil**. Bukan galat.
- Tanpa jadwal: "Belum ada jadwal kontrol. Klinik akan menetapkannya setelah pemeriksaan." dengan tombol **Lihat riwayat**.

### P4 Profil (FR-01)

- Bagian: Kondisi terpantau (dengan tahun sejak), Alergi, Obat.
- Alergi: nama dan tingkat (Ringan, Sedang, Berat). Tingkat Berat memakai label teks tegas, bukan hanya warna.
- Obat di profil adalah **catatan sendiri** dan dipisahkan jelas dari **Resep dari klinik** (P15, hanya baca).
- Ubah: simpan lewat tombol **Simpan**; setelah berhasil, tampil toast "Profil tersimpan" dan tanggal "Terakhir diperbarui".
- Hapus profil: dialog dengan kolom ketik **HAPUS**; tombol baru aktif setelah kata kunci benar. Teks tombol: "Hapus profil". Ini satu-satunya konfirmasi ketik.
- Membuka profil orang lain lewat URL menampilkan layar 403, bukan profil kosong.
- Penjelasan siapa yang bisa melihat data: lihat §15.

### P5 Jadwal kontrol (FR-02)

- Tampilan bawaan **agenda**: satu baris per tanggal dengan tanggal, status, dan aksi. Tombol **Bulan** beralih ke tampilan bulan. Kalender penuh 7 kolom tidak dipakai pada 360 px karena sasaran sentuh turun di bawah 44 px (keputusan PRD).
- Kartu teratas: "Kontrol berikutnya", tanggal dan jam besar, dokter, interval, tombol **Buat janji** yang membuka P6 dengan spesialis dan tanggal terisi.
- Jadwal yang lewat berlabel **Terlewat** dengan keterangan: "Tidak ada pengingat baru untuk jadwal ini. Hubungi klinik untuk menjadwalkan ulang."
- Pengingat jatuh tempo (3 hari sebelumnya) tampil di Beranda dan sebagai penanda pada baris, bukan halaman sendiri.
- Tanggal diperhitungkan di server dengan aturan akhir bulan (31 Januari berikutnya 28 atau 29 Februari) dan anchor tanggal asli.

### P6 Pilih spesialis dan P7 Pilih waktu (FR-03)

- P6 berbentuk daftar baris: nama spesialisasi dan jumlah slot tersedia. Spesialisasi tanpa slot tetap tampil dengan "0 slot tersedia" dan tidak bisa dipilih.
- Tidak ada foto dokter, tidak ada kartu dokter. Nama dokter dan spesialisasi adalah data teks.
- P7: strip tanggal yang dapat digeser **dan** punya tombol panah (tidak hanya geser); grid slot:

| Status slot | Tampilan | Perilaku |
|---|---|---|
| Tersedia | Putih, tepi `line-strong`, jam | Dapat dipilih |
| Dipilih | `primary` solid, teks putih, ikon centang | Dapat dibatalkan pilihannya |
| Terisi | `disabled-bg`, label teks "Terisi" | Tidak dapat ditekan, tidak diberi kesan kosong |
| Dikunci sementara | Sama dengan Terisi, label "Ditahan" | Tidak dapat ditekan |

- Tanggal ditulis eksplisit ("Senin, 2 November 2026") dan memakai WIB.
- Hari tanpa slot: "Tidak ada slot pada hari ini. Pilih tanggal lain."

### P8 Konfirmasi janji

- Ringkasan: spesialis atau dokter, tanggal, jam, lokasi. Teks: "Slot dikunci setelah kamu menekan tombol di bawah."
- Nomor yang tampil di sini adalah **nomor perkiraan** dan berlabel "perkiraan". Pasien diberi tahu nomor ini bukan urutan panggilan.
- Keluhan singkat (opsional, maksimal 200 karakter) dimuat bila FR-03 memuatnya; skema `janji` punya kolom keluhan, wireframe vault belum menampilkannya.
- Tombol utama: **Buat janji** (hitam). Berubah menjadi "Mengunci slot..." selama proses.
- Rebutan slot (409): "Slot ini baru saja diambil pasien lain. Pilih waktu lain." dengan tombol **Pilih waktu lain** yang kembali ke P7 dengan slot itu sudah Terisi.
- Setelah berhasil: layar ringkasan dengan teks, **Buka kartu nomor antrian** dan **Kembali ke beranda**. Tanpa animasi centang.

### P9 Antrian (FR-04)

Dua tahap pada satu layar.

Sebelum check-in: tanggal, dokter, jam, dan tombol **Check-in sekarang**.
- Di luar jendela check-in, tombol nonaktif dengan teks "Check-in dibuka pukul 08.30." (waktu dihitung server dari jendela terkonfigurasi).
- Gagal: "Check-in belum berhasil. Coba lagi atau tunjukkan layar ini ke resepsionis." dengan tombol **Coba lagi**.

Setelah check-in: kartu nomor antrian (§9.7), lalu status.

```text
+------------------------------------------+
|  Nomor antrian                           |
|   +----------------------------------+   |
|  (                                    )  |  biru, takik kiri-kanan
|   |              14                   |   |  Newsreader 56
|   | . . . . . . . . . . . . . . . .  |   |  garis putus-putus
|   |  dr. Sari, 10.00      FINAL       |   |
|   +----------------------------------+   |
|                                          |
|  Menunggu                                |
|  Sekitar 25 menit lagi                   |
|                                          |
|  1 Menunggu  >  2 Diperiksa  >  3 Selesai|
|       Sekarang                           |
|  Diperbarui 10 detik lalu  ( Muat ulang )|
+------------------------------------------+
```

- Label **Final** tampil jelas: nomor tidak akan berubah. Estimasi waktu tunggu ditulis "sekitar" dan hanya bila dapat dihitung dari data nyata; bila tidak, bagian itu tidak ditampilkan.
- Check-in kedua: tombol hilang, diganti "Kamu sudah check-in. Nomor 14 tetap berlaku." Tanpa galat merah.
- Selesai: "Kunjungan selesai. Jadwal kontrol berikutnya sudah dibuat." dengan tombol **Lihat jadwal**.
- Tidak hadir: tampil sebagai status akhir dengan penjelasan dan jalan ke Jadwal.
- Pembaruan: polling berkala selama tab terlihat (§0 #8) dan tombol **Muat ulang**. Tidak ada tarik-untuk-segarkan, tidak ada haptik, tidak ada penyimpanan sebagai gambar.
- Jika pembaruan gagal: tampil data terakhir dengan teks "Tidak bisa memperbarui. Data per 10.42." dan **Coba lagi**. Tidak ada mode offline penuh.
- Pembaca layar mengumumkan perubahan status lewat *live region* dengan kalimat lengkap: "Nomor antrian 14, sedang menunggu."

### P10 Catatan kebiasaan dan P11 Ringkasan (FR-05)

- P10: tiga bagian: **Air minum** (tombol tambah 250 ml dan kurang, plus kolom isian), **Tidur** (jam tidur dan bangun), **Aktivitas** (menit dan jenis). Setiap kolom punya label dan satuan.
- Tombol tambah dan kurang berukuran 44 x 44 px.
- Satu "hari" dihitung mulai 00.00 WIB.
- P11: runtutan hari tercatat dan ringkasan beberapa hari terakhir, dalam batang sederhana dengan nilai tertulis di tiap batang.
- **Tidak ada target, tidak ada cincin progres, tidak ada kalimat menilai** ("kurang minum", "yuk tambah satu lagi") sampai ambang resmi ditetapkan (§0 #5). Aplikasi tidak memberi saran gaya hidup personal. Naskah netral: "Hari ini tercatat 3 gelas."
- Ringkasan P11 hanya dibaca pasien sendiri. Admin tidak dapat membukanya.

### P12 Panel konten statis (kandidat dipotong)

Memuat materi dengan sumber dan tanggal pengambilan yang tampil di layar. Jika tidak ada peninjau tenaga kesehatan, layar ini dipotong dan tidak ditampilkan di navigasi.

### P13 Pemberitahuan dan tanggapan usulan (FR-09)

- Daftar pemberitahuan; yang belum dibaca memakai teks tebal dan penanda teks "Baru", bukan hanya titik.
- Layar usulan menampilkan perbandingan **jadwal lama** dan **jadwal usulan**:

```text
+------------------------------------------+
|  Perubahan jadwal dari klinik            |
|  Alasan: Dokter berhalangan              |
|                                          |
|  Jadwal lama (dicoret)                   |
|  Senin, 3 November 2026, 09.30           |
|                                          |
|  Jadwal usulan                           |
|  Selasa, 4 November 2026, 10.00          |  sorotan lime
|                                          |
|  Janji lama tetap aktif sampai kamu      |
|  menjawab.                               |
|  Jawab sebelum 2 November 2026, 17.00    |
|                                          |
|  ( Setuju )   ( Pilih slot lain )        |
|  Tolak                                   |
+------------------------------------------+
```

- **Setuju** (tombol utama hitam): janji diperbarui, slot lama dilepas, tampil status jawaban.
- **Pilih slot lain**: membuka P7 dengan spesialis yang sama. Hasilnya dikirim ke admin dan statusnya ditulis "Menunggu konfirmasi admin".
- **Tolak** (tombol teks `danger-ink`): dialog konfirmasi yang menjelaskan akibat sesuai aturan klinik ("Janji lama tetap berlaku" atau "Janji dibatalkan"), dengan alasan opsional. Akibat yang tepat belum diputuskan, jadi teks dialog harus mengikuti keputusan itu.
- Setelah dijawab, tombol nonaktif dan jawaban terlihat. Tidak bisa menjawab dua kali.
- Batas waktu menjawab tampil jelas. Jika TTL habis: "Usulan ini sudah berakhir. Janji lamamu tetap berlaku." (usulan naskah; sesuai PRD, usulan dibatalkan dengan pemberitahuan).
- Dapat dicapai maksimal 3 ketukan dari pemberitahuan (kriteria PRD).
- Pemberitahuan hanya di dalam website. Tidak ada janji bunyi, getar, atau pesan di luar situs.

### P14 Timeline kunjungan (FR-13)

- Satu urutan kronologis terbalik berisi janji, check-in, kunjungan, catatan obat, dan jadwal berikutnya. Bagian paling atas **Berikutnya** dipisah garis putus-putus.
- Filter: **Semua, Janji, Kunjungan, Obat, Jadwal berikutnya**.
- Hanya milik pasien yang masuk. Item dibuka untuk detail yang **sudah tersimpan di sistem** (waktu, status, dokter, obat tercatat). Tidak ada diagnosis atau catatan dokter, karena tidak ada sumber datanya.
- Pemuatan: tombol **Muat lebih banyak** (20 item per tahap), bukan gulir tanpa akhir, supaya fokus keyboard dan tombol kembali browser tetap terduga. Skeleton hanya pada tahap pemuatan.
- Kosong: "Belum ada riwayat. Buat janji pertama." dengan tombol ke P6.

### P15 Obat dan kepatuhan (FR-12)

- Satu baris per obat: nama, dosis, aturan pakai, periode, nama pencatat. Pasien **hanya membaca**: tidak ada tambah, ubah, atau hapus.
- Setiap obat membawa label **"Catatan resep, bukan saran medis."** dan tautan rujukan Fornas dengan tanggal pengambilan.
- Hari ini: tombol **Sudah diminum** dan **Belum diminum** per waktu minum; status memakai teks (Diminum, Belum diminum), bukan hanya warna. Tidak ada tombol Lewati yang bermakna medis.
- Ringkasan 7 hari mengikuti aturan angka di atas.
- Peringatan alergi hanya bila ada pemetaan nyata antara obat dan alergi yang tercatat pasien. Aplikasi **tidak** memetakan kondisi ke obat.
- Kosong: "Belum ada resep. Catatan obat diisi oleh klinik."

### P16 Log aktivitas akun (kandidat dipotong)

Daftar hanya-baca aktivitas milik sendiri: masuk, buat janji, ubah janji, check-in, tandai obat. Dipotong bila gerbang G2 gagal.

---

## 9. Komponen

### 9.1 Tombol

| Jenis | Tampilan | Dipakai untuk |
|---|---|---|
| Utama | Latar `ink`, teks putih, tinggi 48, radius 12 | **Satu per layar**: Masuk, Buat janji, Check-in sekarang, Setuju |
| Sekunder | Tepi `line-strong` 1px, latar transparan, teks `ink`, tinggi 44 | Aksi lain yang setara pentingnya |
| Teks | Tanpa latar, teks `primary` atau `danger-ink` | Tolak, Batal, Hapus profil (bila destruktif) |

- Teks tombol kata kerja yang menyebut hasilnya: **Buat janji**, bukan "Kirim". Nama yang sama dipakai sepanjang alur (tombol "Buat janji" menghasilkan toast "Janji dibuat").
- Selama proses: nonaktif dan teks berganti ("Mengunci slot..."), lalu kembali. Tanpa pemutar tak berujung.
- Tanda panah di tombol **tidak dipakai**, kecuali tombol kembali di kepala.
- Setiap kendali yang bisa ditekan memakai `cursor: pointer`; yang nonaktif `cursor: not-allowed`. Hover, active, focus, dan disabled berbeda satu sama lain tanpa bergantung pada warna saja.

### 9.2 Kolom isian

Tinggi 48, radius 12, tepi `line-strong` 1px, label **di atas** dan terhubung (`label[for]`), bantuan dan galat di bawah. Fokus: garis 2px `ink` dengan jarak 2px. Placeholder memakai `ink-2` dan tidak menggantikan label.

### 9.3 Kartu

Latar putih, radius 12, padding 16 (24 pada ≥1024 px), tepi `line` 1px, datar. Tanpa garis warna di tepi kiri sebagai hiasan; tepi kiri berwarna hanya untuk menandai keadaan nyata dan harus disertai teks.

### 9.4 Chip status

Bentuk pil, tinggi 28 (bukan sasaran sentuh), teks 14/600, ikon 16 bila ada, warna dari §3.4. Tidak dapat ditekan.

### 9.5 Dialog

Radius 16, lebar 280-560, `shadow-overlay`. Dapat ditutup dengan **Escape**, fokus terkunci di dalam dialog dan kembali ke pemicunya saat ditutup. Tombol aksi ditumpuk pada lebar sempit. Dialog destruktif memakai teks tombol yang menyebut akibatnya ("Ya, hapus profil").

### 9.6 Toast, skeleton, dan indikator

- Toast: di atas navigasi bawah, 4 detik, dapat ditutup, dibacakan lewat live region `polite`. Tidak dipakai untuk informasi yang harus dibaca ulang.
- Skeleton: bentuknya sama dengan isi yang akan datang, latar `line`, tanpa kilau. Tidak menggantikan layar penuh.
- Tidak ada indikator berputar tanpa akhir.

### 9.7 Kartu nomor antrian (motif identitas)

```text
 .------------------------------------.
(  Nomor antrian                       )
 |                                     |
 |               14                    |   Newsreader 600, 56 px, putih
 |                                     |
 | . . . . . . . . . . . . . . . . . . |   garis putus-putus, takik di kiri dan kanan
 |  dr. Sari, 10.00          FINAL     |
 '------------------------------------'
```

- Latar `primary`, teks putih (5.17:1), radius 16, `shadow-raised`. Dua takik setengah lingkaran pada garis putus-putus, dibuat dengan CSS (mask), bukan gambar.
- Nomor antrian dibacakan penuh oleh pembaca layar: "Nomor antrian 14, sedang menunggu."
- Cincin fokus di atas kartu ini berwarna putih agar tetap terlihat di atas biru.
- Satu-satunya momen bergerak di produk: kartu muncul saat check-in berhasil. Dengan `prefers-reduced-motion`, kartu langsung tampil.
- Dipakai di P9 dan, dalam bentuk datar tanpa takik, nomor yang sama (Newsreader 600) menjadi penanda utama kartu di papan admin K4.

### 9.8 Ikon dan ilustrasi

- Ikon dipilih karena **relevan** (jam, kalender, stetoskop, pil, lonceng, centang, silang), bukan karena sebuah pustaka. Pilih satu set dengan garis 1.75-2px dan putuskan saat implementasi; bila tidak ada ikon relevan, pakai teks saja.
- Ikon penghias diberi `aria-hidden="true"`; tombol ikon saja wajib punya nama aksesibel.
- Tidak ada emoji di UI, tidak ada ilustrasi, tidak ada foto.

---

## 10. Antarmuka admin (K1-K7)

Admin punya pekerjaan yang berbeda, bukan versi padat dari layar pasien. Tata letak ada di `03-wireframe-klinik.md`; bagian ini menetapkan keputusan yang harus dibuat tiap layar dan bagaimana tampilannya mendukungnya.

Aturan umum admin:
- Sistem desain sama (token, huruf, kontras). Kepadatan lebih tinggi: tinggi baris tabel 44, isi 14-16px.
- Setiap tindakan yang mengubah data **wajib alasan** dan tercatat di audit log. Alasan diminta di dialog, bukan di kolom tersembunyi.
- Nomor antrian memakai gaya yang sama dengan layar pasien: besar, tebal, Newsreader.
- Tabel: kolom dipilih dari keputusan yang diambil di layar itu, dan kolom penentu ditaruh paling kiri. Menu tiga titik per baris dilarang; aksi yang ada ditulis sebagai tombol bertulisan.
- Admin tidak memiliki jalan ke layar pasien (hasilnya 403) dan **tidak membuka catatan kebiasaan pasien**.

| Layar | Keputusan admin | Isi utama | Kolom atau elemen penentu |
|---|---|---|---|
| K1 Masuk | Membuka sesi | Email, kata sandi | Tanpa tautan Daftar |
| K2 Daftar pasien | Memilih pasien | Pencarian, tabel | Nama, jadwal berikutnya, status profil. Kondisi, alergi, obat ditampilkan hanya bila diputuskan (§0 #6). |
| K3 Aturan kontrol | Menetapkan jadwal berulang | Interval 7, 14, atau 30 hari; jumlah; pratinjau tanggal | Pratinjau tanggal dihitung langsung; peringatan bila pasien sudah punya rangkaian aktif |
| K4 Papan antrian | Memajukan pasien ke status berikutnya | Kolom Menunggu, Diperiksa, Selesai (dan Tidak hadir) | Nomor antrian besar; hanya aksi transisi yang sah per kartu |
| K5 Catat resep | Mencatat obat dari resep dokter | Nama (rujukan Fornas), dosis, aturan pakai, periode | Label "bukan saran medis" ikut tercatat |
| K6 Usulan perubahan | Mengusulkan atau membatalkan janji | Daftar janji menunggu jawaban pasien | Alasan wajib, slot baru, sisa TTL kunci, penanda belum dibaca |
| K7 Audit log | Menelusuri tindakan | Tabel hanya-baca | Waktu, pelaku, aksi, nilai sebelum dan sesudah, alasan |

Perilaku K4:
- Dari Menunggu hanya ada **Periksa**; dari Diperiksa hanya ada **Selesai**. Tidak ada tombol yang melompati status.
- **Selesai** meminta konfirmasi ringan karena memicu pembuatan jadwal kontrol berikutnya, dan keterangannya ditulis terang-terangan.
- Salah menekan status: koreksi hanya dengan alasan, dan alasannya tercatat.
- Tutup hari: aksi terpisah yang menandai semua tiket yang belum selesai sebagai **Tidak hadir**; hasilnya menampilkan jumlah, dan dapat diulang untuk tanggal yang sama tanpa efek ganda.
- Transisi ilegal: "Status tidak bisa dilompati. Periksa pasien dulu." dan kartu tidak berpindah.
- Kosong: "Belum ada pasien check-in hari ini." dengan keterangan jam buka.

Kartu yang sedang diperiksa diberi penanda teks "Sedang diperiksa" dan tepi `primary`; tepi itu hanya boleh muncul bersama teksnya.

Tidak ada dasbor angka, grafik, atau kartu statistik di layar admin. Tidak ada angka ringkasan yang tidak dipakai untuk mengambil keputusan di layar itu.

---

## 11. Keadaan antarmuka

Setiap layar yang menampilkan data punya tiga keadaan minimal: **isi, kosong, galat**. Tambahan **ditolak** bila layar memuat data milik orang lain. Daftar naskah per layar ada di `04-state-dan-copy.md` §1; aturan umum di sini.

| Keadaan | Aturan |
|---|---|
| Memuat | Skeleton di tempat isi akan muncul. Tombol pemicu nonaktif dan berganti teks. |
| Kosong | Sebab + satu aksi yang mengisinya. Pertama kali, hasil filter, dan akses ditolak adalah tiga layar yang berbeda. |
| Galat jaringan | Banner di atas isi: "Tidak bisa terhubung. Data terakhir tampil di bawah." (bila ada) + tombol **Coba lagi**. |
| Galat validasi | Pesan di bawah kolom, fokus pindah ke kolom bermasalah. |
| Galat server (500) | "Halaman gagal dimuat. Coba lagi dalam beberapa saat." + **Coba lagi**. Tanpa jejak teknis. |
| Konflik (409) | Pesan jelas dan jalan keluar (P8: Pilih waktu lain). |
| Ditolak (403) | "Halaman ini bukan untuk akunmu" + **Kembali ke beranda**. |
| Tidak ditemukan (404) | "Halaman tidak ditemukan" + **Kembali ke beranda**. |
| Sesi berakhir | Diarahkan ke P1 dengan pesan di atas formulir. Isian yang sedang dikerjakan dipertahankan bila memungkinkan; bila tidak, pengguna diberi tahu. |
| Berhasil | Layar hasil atau toast, dengan teks. Pengguna mendarat di layar yang menunjukkan hasilnya, bukan formulir kosong. |

---

## 12. Gerak

Dial MOTION 1.

- Gerak hanya menjawab tindakan: membuka dialog, berganti status, tombol berubah saat proses. Durasi 150 ms untuk perubahan kecil, 250 ms untuk dialog.
- Satu momen yang berdiri sendiri: kartu nomor antrian muncul setelah check-in (§9.7).
- Tidak ada animasi masuk pada tiap bagian, tidak ada gerak berulang tanpa pemicu, tidak ada animasi pada kartu saat disorot.
- `prefers-reduced-motion: reduce` menggantikan semua gerak dengan perubahan langsung atau fade pendek.
- Gestur geser selalu punya padanan tombol. Tidak ada tarik-untuk-segarkan dan tidak ada haptik (tidak ada di semua browser).

---

## 13. Bahasa dan naskah

Mengikuti `04-state-dan-copy.md` §3. Nada: hangat, jelas, tenang. Kalimat aktif dan pendek, huruf kapital kalimat biasa, hindari istilah medis tanpa penjelasan.

### 13.1 Kata baku

| Pakai | Jangan pakai |
|---|---|
| Jadwal kontrol | Entitas jadwal, jadwal kontrol berulang |
| Nomor antrian | Tiket antrian, queue number |
| Slot | Time slot, ketersediaan |
| Kondisi terpantau | Diagnosis, penyakit |
| Catatan kebiasaan | Log harian, tracking |
| Check-in | Absen, daftar ulang |

### 13.2 Tombol (satu kata kerja, konsisten sampai hasilnya)

| Tombol | Hasil |
|---|---|
| Masuk, Buat akun | Sesi aktif, akun dibuat |
| Lihat jadwal | P5 |
| Buat janji | P8, lalu janji dibuat |
| Check-in sekarang | Nomor final terbit |
| Simpan catatan | Catatan tersimpan, ringkasan diperbarui |
| Periksa, Selesai | Status berubah (admin) |
| Setuju, Pilih slot lain, Tolak | Jawaban atas usulan |

Tombol umum seperti "Lanjut", "Kirim", dan "Selengkapnya" tidak dipakai bila ada kata kerja yang lebih jelas.

### 13.3 Contoh naskah

| Konteks | Naskah |
|---|---|
| Beranda | "Halo, Arya." |
| Kosong janji | "Belum ada janji. Buat janji pertamamu." |
| Check-in dikunci | "Check-in dibuka pukul 08.30." |
| Slot terambil | "Slot ini baru saja diambil pasien lain. Pilih waktu lain." |
| Usulan jadwal | "Klinik mengusulkan jadwal baru. Kamu bisa setuju, menolak, atau memilih waktu lain." |
| Obat belum ditandai | "Obat pagi belum ditandai. Jika sudah diminum, tandai sekarang." |
| Gagal | "Halaman gagal dimuat. Coba lagi dalam beberapa saat." |
| Catatan obat | "Catatan resep, bukan saran medis." |

Galat tidak meminta maaf dan tidak samar: sebut apa yang gagal dan langkah berikutnya.

### 13.4 Tanggal dan waktu

`Senin, 3 November 2026`, jam 24 jam dengan titik: `09.30`. Semua waktu bisnis dalam WIB; tampilkan "WIB" pada layar yang bisa membingungkan (jam slot, batas jawab, jendela check-in). Semua perhitungan lewat `src/lib/waktu-wib.ts`.

---

## 14. Aksesibilitas (WCAG 2.2 AA)

- Kontras: lihat §3.3. Teks besar dan komponen non-teks minimal 3:1.
- **Keyboard:** semua kendali dapat dijangkau dengan Tab dan Shift+Tab sesuai urutan visual, dapat diaktifkan dengan Enter atau Spasi, dialog menutup dengan Escape. Cincin fokus terlihat (2px `ink`, jarak 2px; putih di atas biru). `outline: none` dilarang tanpa pengganti.
- Aksi adalah `<button>`, navigasi adalah `<a href>` ke tujuan nyata. Tidak ada `div` atau `span` yang bisa ditekan.
- Setiap kendali punya nama aksesibel; setiap gambar bermakna punya `alt`; setiap kolom punya `<label>` yang terlihat.
- Status berubah diumumkan lewat live region dengan kalimat lengkap.
- Teks dapat diperbesar sampai 200% tanpa terpotong; tombol ditumpuk bila perlu. Halaman tidak mematikan zoom.
- Setiap halaman memiliki `<html lang="id">`, `<title>` unik, landmark (`header`, `nav`, `main`), dan satu `h1`.
- Batas waktu (jawaban usulan) ditampilkan jelas dan tidak memaksa tindakan cepat tanpa peringatan.
- Uji juga: tombol kembali browser, muat ulang halaman, dan tautan langsung ke layar dalam alur.

---

## 15. Privasi dan keamanan di UI

| Pihak | Boleh melihat | Tidak boleh |
|---|---|---|
| Pasien | Datanya sendiri | Data pasien lain, layar admin |
| Admin | Nama, jadwal, status, ringkasan alergi **(usulan; menunggu konfirmasi, §0 #6)** | Catatan kebiasaan pasien |
| Dokter | Tidak menjadi pengguna. Hadir hanya sebagai data (nama, spesialisasi, slot). | Tidak ada login, tidak ada dasbor |

- UI **tidak** boleh menyatakan data dibagikan ke dokter. Pada layar profil, penjelasan yang benar: "Data ini bisa dilihat olehmu dan oleh admin klinik sesuai batas akses." Naskah final mengikuti keputusan §0 #6.
- Tidak ada pratinjau notifikasi di layar kunci, kunci aplikasi biometrik, atau PIN: produk tidak mengirim notifikasi di luar website.
- Menu dibentuk dari peran di sesi. Menyembunyikan tombol dengan CSS bukan pengamanan; setiap handler memeriksa sesi dan peran di server.
- Tindakan sensitif (hapus profil) meminta konfirmasi sesuai §9.5.
- Admin: nama dan tombol Keluar selalu terlihat; sesi harus mudah ditutup karena akun dipakai bersama.

---

## 16. Kontrak waktu

- Semua aturan bisnis memakai **Asia/Jakarta (WIB)**. Server adalah sumber waktu resmi; browser hanya menampilkan waktu yang sudah diformat dari server.
- Satu "hari" untuk nomor antrian dan catatan kebiasaan mulai 00.00 WIB.
- Jendela check-in, TTL kunci slot, dan batas jawab usulan berasal dari konfigurasi server, bukan angka di kode UI. Nilai pada dokumen ini adalah usulan (§0 #2, #3).
- Pengingat hanya di dalam website: pengingat jatuh tempo 3 hari sebelum jadwal kontrol; pengingat janji dihitung dari janji aktif. Tidak ada janji pemberitahuan di luar situs.
- Usulan perubahan: TTL kunci slot lebih pendek dari batas jawab pasien. Bila TTL habis, slot dilepas dan usulan berstatus `kedaluwarsa` dengan pemberitahuan.
- Tanggal diuji pada batas tengah malam dan batas akhir bulan.

---

## 17. Kontrak status

UI menampilkan status domain dan beberapa status turunan. Turunan **tidak disimpan** di database dan harus dihitung dengan aturan tertulis supaya frontend dan backend tidak berbeda.

### 17.1 Status antrian (`status_antrian`)

| Status domain | Label UI | Jenis |
|---|---|---|
| `belum_check_in` | Belum check-in | Disimpan |
| `menunggu` | Menunggu | Disimpan |
| `menunggu` dan nomor terkecil di antara yang menunggu | Giliran berikutnya | Turunan (hilang saat nomor lain lebih kecil muncul atau status berubah) |
| `menunggu` dan `waktu_panggil` terisi | Dipanggil | Turunan; **ditunda** sampai admin punya aksi Panggil (§0 #4) |
| `diperiksa` | Sedang diperiksa | Disimpan |
| `selesai` | Selesai | Disimpan |
| `tidak_hadir` | Tidak hadir | Disimpan |

Bila data terlambat diperbarui, UI menampilkan status terakhir yang diketahui dengan waktu pembaruannya, tidak menebak status baru.

### 17.2 Status janji (`status_janji`)

| Status domain | Label UI |
|---|---|
| `aktif` | Terjadwal |
| `perubahan_diusulkan` | Menunggu jawabanmu |
| `dibatalkan` | Dibatalkan |
| `selesai` | Selesai |
| `tidak_hadir` | Tidak hadir |

"Sudah check-in" adalah keadaan tiket antrian (§17.1), bukan status janji.

### 17.3 Status usulan (`status_usulan`)

| Status domain | Label UI |
|---|---|
| `menunggu_tanggapan` | Menunggu jawabanmu (pasien), Menunggu pasien (admin) |
| `disetujui` | Disetujui |
| `ditolak` | Ditolak |
| `kedaluwarsa` | Berakhir |

Satu keadaan dua nama dilarang. "Menunggu konfirmasi admin" setelah pasien memilih slot lain adalah keadaan baru yang belum punya status domain; kontrak harus memutuskan penyimpanannya sebelum tampil.

---

## 18. Cakupan rilis

Setiap perilaku diberi label supaya acceptance criteria jelas.

| Label | Isi |
|---|---|
| **MVP** | Masuk dan daftar, profil, slot dan janji, check-in dan antrian, usulan perubahan jadwal dan tanggapannya, jadwal kontrol (agenda + bulan), catatan kebiasaan dan ringkasan, obat dan kepatuhan, timeline, layar admin K1-K7, semua state dan aksesibilitas dasar |
| **Opsional (dipotong lebih dulu bila waktu habis)** | P12 panel konten, P16 log aktivitas |
| **Belum diputuskan** | Pasien membatalkan atau mengubah janji sendiri; status "Dipanggil"; ambang kebiasaan |
| **Di luar rilis** | Mode gelap dan kontras tinggi, biometrik dan PIN, haptik, tarik-untuk-segarkan, simpan nomor sebagai gambar, QR dan lokasi untuk check-in, mode offline penuh, gulir tanpa akhir, peta interaktif, jam tenang pengingat, persetujuan data terpisah, notifikasi push, email, atau WhatsApp, foto dokter, ilustrasi |

Fitur di luar rilis tidak boleh tampil sebagai tombol atau menu. Bila muncul di UI, harus berlabel "Segera hadir" dan punya komentar `// TODO` di kode.

---

## 19. Token CSS

Nama semantik, supaya mode gelap bisa ditambah kemudian tanpa mengubah komponen. Nilai lama `--color-ink-3` dihapus.

```css
:root {
  /* Warna */
  --color-bg: #EEF1F6;
  --color-surface: #FFFFFF;
  --color-line: #E3E7EE;
  --color-line-strong: #7A8494;
  --color-ink: #111418;
  --color-ink-2: #5B6472;
  --color-primary: #2563EB;
  --color-primary-ink: #1D4ED8;
  --color-primary-soft: #E6EEFF;
  --color-accent: #D9EE4F;
  --color-success: #15803D;
  --color-success-ink: #14532D;
  --color-success-soft: #E7F6EC;
  --color-warning: #B45309;
  --color-warning-ink: #7C2D12;
  --color-warning-soft: #FFF4E0;
  --color-danger: #DC2626;
  --color-danger-ink: #991B1B;
  --color-danger-soft: #FDECEC;
  --color-disabled-fg: #8A93A1;
  --color-disabled-bg: #E3E7EE;

  /* Tipografi */
  --font-display: "Newsreader", Georgia, serif;
  --font-sans: "Plus Jakarta Sans", system-ui, sans-serif;

  /* Spasi */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px;

  /* Radius */
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-full: 999px;

  /* Bayangan */
  --shadow-raised: 0 8px 24px rgba(37, 99, 235, .18);
  --shadow-overlay: 0 8px 32px rgba(17, 20, 24, .18);

  /* Ukuran */
  --tap-min: 44px;
  --button-h: 48px;
  --input-h: 48px;
}
```

---

## 20. Daftar layar dan perilaku yang harus diuji

### 20.1 Layar

| Kode | Layar | FR |
|---|---|---|
| P1, P2 | Masuk, Daftar | FR-07 |
| P3 | Beranda | FR-02, FR-04 |
| P4 | Profil | FR-01 |
| P5 | Jadwal kontrol | FR-02 |
| P6, P7, P8 | Pilih spesialis, Pilih waktu, Konfirmasi | FR-03 |
| P9 | Antrian | FR-04 |
| P10, P11 | Catatan, Ringkasan | FR-05 |
| P12 | Panel konten (opsional) | FR-06 |
| P13 | Pemberitahuan dan tanggapan | FR-09 |
| P14 | Timeline | FR-13 |
| P15 | Obat dan kepatuhan | FR-12 |
| P16 | Log aktivitas (opsional) | FR-14 |
| K1-K7 | Masuk admin, Daftar pasien, Aturan kontrol, Papan antrian, Catat resep, Usulan, Audit log | FR-01, 02, 04, 07, 08, 10, 12 |

Urutan pengerjaan yang disarankan: token dan komponen, lalu P1-P2, P3, P6-P8, P9 dan K4, P13 dan K6, P4 dan P5, P10-P11, P15, P14, K lain.

### 20.2 Perilaku yang harus bisa diuji

Tiap kontrol dianggap selesai bila punya semua kolom ini. Contoh yang harus dipenuhi:

| Kontrol | Tujuan atau perubahan | Nonaktif bila | Umpan balik sukses | Galat dan ulang | Keyboard |
|---|---|---|---|---|---|
| Check-in sekarang (P9) | Tiket terbit, kartu nomor tampil | Di luar jendela check-in | Kartu muncul, live region membacakan nomor | "Check-in belum berhasil..." + Coba lagi | Enter atau Spasi |
| Pilih slot (P7) | Slot terpilih | Slot Terisi atau Ditahan | Tombol lanjut aktif | 409: "Slot ini baru saja diambil..." | Panah dan Enter |
| Buat janji (P8) | Janji dibuat, slot terkunci | Selama proses | Layar "Janji dibuat" | 409 kembali ke P7 | Enter |
| Setuju, Tolak, Pilih slot lain (P13) | Jawaban tersimpan | Setelah dijawab atau TTL habis | Status jawaban tampil | Gagal: pesan + coba lagi | Enter |
| Sudah diminum (P15) | Satu catatan per obat per tanggal | Belum waktunya | Status berubah jadi Diminum | Gagal: pesan + coba lagi | Enter atau Spasi |
| Periksa, Selesai (K4) | Status maju satu langkah | Transisi tidak sah | Kartu pindah kolom, audit log bertambah | "Status tidak bisa dilompati..." | Enter |
| Muat lebih banyak (P14) | 20 item berikutnya | Tidak ada lagi | Item bertambah, fokus tetap | Pesan galat + Coba lagi | Enter |
| Hapus profil (P4) | Data profil terhapus | Kata kunci belum benar | Toast dan pengalihan | Pesan galat | Escape menutup dialog |

Setiap perilaku di atas dibuktikan dengan uji (Vitest untuk aturan, Playwright untuk alur), bukan diasumsikan.

---

## 21. Pengujian usability

Skenario (5-8 partisipan di luar tim, termasuk minimal 2 pengguna berusia di atas 50 tahun), mengikuti PRD:

1. Membuat akun dan mengisi profil dengan satu alergi.
2. Membuat janji dengan spesialis tertentu. Target median di bawah 3 menit (angka sementara PRD).
3. Check-in dan menyebutkan nomor antrian tanpa bantuan.
4. Menanggapi usulan perubahan jadwal dalam maksimal 3 ketukan dari pemberitahuan.
5. Menandai obat hari ini dan menyebutkan ringkasan 7 hari.

Metrik: tingkat keberhasilan tugas, waktu penyelesaian, jumlah kesalahan, dan skor SUS minimal 68 (angka sementara PRD). Angka target mengikuti PRD, bukan dokumen ini.

---

## 22. Yang tidak dibuktikan dokumen ini

Dokumen ini hanya rancangan. Belum terbukti: tampilan sebenarnya di browser, kontras pada CSS yang berjalan (baru nilai heks yang dihitung), kemampuan Newsreader menyediakan angka tabular, perilaku keyboard dan pembaca layar, kinerja font, dan kecocokan dengan database serta `.env`. Semua itu harus diuji setelah layar diimplementasikan.
