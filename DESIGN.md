# DESIGN.md: Tampilan Web Janji Temu Klinik

Arah visual untuk halaman HTML di `public/`. Kebutuhan dan alur mengikuti
[RANCANGAN FINAL](docs/RANCANGANFINAL.md); dokumen ini hanya mengatur
tampilan. Bila bertentangan, RANCANGAN FINAL yang berlaku.

Nama produk belum diputuskan; sementara "Klinik Sehat".

---

## 1. Prinsip

1. **Tenang dan jelas.** Pengguna utama dewasa 40–65 tahun. Satu tombol utama
   per halaman, teks minimal 14px.
2. **Status selalu terlihat** dengan teks, bukan hanya warna.
3. **Tidak ada jalan buntu.** Daftar kosong dan galat menyebut sebabnya dan
   satu langkah berikutnya.
4. **Tidak menjanjikan yang tidak ada.** Aplikasi mencatat janji dan hasil
   pemeriksaan, bukan memberi diagnosis.
5. **Sederhana.** Tanpa ilustrasi, foto, gradien, kaca buram, atau animasi
   dekoratif.

## 2. Warna

| Token | Hex | Dipakai untuk |
|---|---|---|
| `--color-bg` | `#EEF1F6` | Latar halaman |
| `--color-surface` | `#FFFFFF` | Kartu, tabel, input |
| `--color-line` | `#E3E7EE` | Pemisah dan tepi kartu |
| `--color-line-strong` | `#7A8494` | Tepi input dan tombol sekunder |
| `--color-ink` | `#111418` | Teks utama, tombol utama |
| `--color-ink-2` | `#5B6472` | Teks sekunder, placeholder |
| `--color-primary` | `#2563EB` | Tautan, menu aktif, fokus |
| `--color-primary-ink` | `#1D4ED8` | Teks di atas `primary-soft` |
| `--color-primary-soft` | `#E6EEFF` | Latar chip terjadwal/terpilih |
| `--color-success-ink` | `#14532D` | Teks chip selesai |
| `--color-success-soft` | `#E7F6EC` | Latar chip selesai, pesan berhasil |
| `--color-danger-ink` | `#991B1B` | Teks chip dibatalkan, pesan galat |
| `--color-danger-soft` | `#FDECEC` | Latar chip dibatalkan, pesan galat |
| `--color-disabled-bg` | `#E3E7EE` | Kontrol nonaktif |

Aturan:
- Teks di atas latar `*-soft` memakai varian `*-ink` (kontras ≥ 4.5:1).
- Satu tombol utama (hitam `ink`) per halaman. Biru untuk tautan dan menu aktif.
- Pasangan yang lolos kontras: `ink`/`surface` 18.47, `ink-2`/`surface` 5.98,
  `primary`/`surface` 5.17, `primary-ink`/`primary-soft` 5.76,
  `success-ink`/`success-soft` 8.15, `danger-ink`/`danger-soft` 7.28.

## 3. Tipografi

| Gaya | Ukuran / tinggi baris | Bobot | Keluarga |
|---|---|---|---|
| H1 (judul halaman) | 30 / 38 | 700 | Inter, -apple-system, sans-serif |
| H2 (judul bagian) | 22 / 30 | 600 | Inter, -apple-system, sans-serif |
| Isi | 15 / 24 | 400 | Inter, -apple-system, sans-serif |
| Isi kecil | 14 / 22 | 400 | Inter, -apple-system, sans-serif |
| Label, tombol, kepala tabel | 14 / 20 | 600 | Inter, -apple-system, sans-serif |

Font utama menggunakan **Inter** (Google Fonts dengan fallback system sans-serif). Tidak ada teks di bawah 14px. Target sentuh minimal 44×44 px. Kontras teks lolos WCAG AA (≥ 4.5:1).

## 4. Tata letak

- Spasi kelipatan 4: `4, 8, 12, 16, 24, 32, 48`.
- Radius: 8 (kecil), **12 (dasar: tombol, input, kartu)**, 999 (chip status).
- Kartu datar: latar putih, tepi `line` 1px, tanpa bayangan.
- Sasaran sentuh minimal 44×44 px; tinggi tombol utama dan input 48 px.
- Lebar isi maksimal 960 px, terpusat. Pada lebar < 768 px satu kolom dan
  tabel boleh digulir horizontal di dalam wadahnya (halaman tidak meluap).

## 5. Kerangka halaman

Semua halaman memakai kepala yang sama:

```text
+---------------------------------------------------------------+
| Klinik Sehat   [menu 1] [menu 2] ...        Nama   [Keluar]    |
+---------------------------------------------------------------+
| H1 judul halaman                                               |
| isi                                                            |
+---------------------------------------------------------------+
```

- **Menu pasien:** Janji Temu, Riwayat, Jadwal Kontrol, Profil.
- **Menu admin:** Kelola Janji, Master Data.
- Nama pengguna dan tombol **Keluar** selalu terlihat.
- `auth.js` mengarahkan ke `login.html` bila token tidak ada atau role tidak
  sesuai halaman.

## 6. Halaman

| Berkas | Isi utama | Kosong |
|---|---|---|
| `login.html` | Form email + kata sandi, tombol **Masuk**, pesan galat di atas form. Tanpa tautan daftar. | – |
| `pasien/janji-temu.html` | Form buat janji: pilih poli → dokter (terfilter per poli) → tanggal → keluhan; tombol **Buat janji**. Di bawahnya daftar janji terjadwal. | "Belum ada janji. Buat janji pertamamu." |
| `pasien/riwayat.html` | Tabel: tanggal, poli, dokter, catatan dokter. | "Belum ada pemeriksaan yang selesai." |
| `pasien/jadwal-kontrol.html` | Daftar kontrol terjadwal: tanggal besar, poli, dokter. | "Belum ada jadwal kontrol dari dokter." |
| `pasien/profil.html` | Form nama, nomor telepon, tanggal lahir, alamat, kata sandi baru (opsional); tombol **Simpan profil**. | – |
| `admin/kelola-janji.html` | Filter tanggal & status; tabel janji (pasien, poli, dokter, tanggal, tipe, status). Aksi per baris: **Selesaikan** (isi catatan dokter), **Batalkan**, **Buat jadwal kontrol** (form tanggal/poli/dokter untuk pasien yang sama). | "Belum ada janji pada filter ini." |
| `admin/master-data.html` | Dua bagian: daftar poli + form **Tambah poli**; daftar dokter + form **Tambah dokter** (pilih poli). | "Belum ada poli/dokter." |

## 7. Komponen

- **Tombol utama:** latar `ink`, teks putih, tinggi 48, radius 12. Selama
  request: nonaktif, teks berganti ("Menyimpan..."), lalu kembali.
- **Tombol sekunder:** tepi `line-strong`, latar transparan, teks `ink`.
- **Input:** tinggi 48, radius 12, tepi `line-strong`, `<label for>` di atas,
  pesan galat di bawah kolom.
- **Chip status** (tidak dapat ditekan):

  | Nilai | Label | Latar / teks |
  |---|---|---|
  | `terjadwal` | Terjadwal | `primary-soft` / `primary-ink` |
  | `selesai` | Selesai | `success-soft` / `success-ink` |
  | `dibatalkan` | Dibatalkan | `danger-soft` / `danger-ink` |
  | `janji_baru` | Janji baru | `bg` + tepi `line-strong` / `ink` |
  | `kontrol_rutin` | Kontrol rutin | `bg` + tepi `line-strong` / `ink` |

- **Pesan:** kotak berhasil (`success-soft`) atau galat (`danger-soft`) di atas
  isi, diumumkan dengan `role="status"` / `role="alert"`.

## 8. Naskah

- Sapaan "kamu", kalimat pendek, kata kerja jelas: **Masuk**, **Buat janji**,
  **Simpan profil**, **Selesaikan**, **Batalkan**, **Tambah poli**,
  **Tambah dokter**, **Keluar**.
- Tanggal: `Senin, 3 November 2026`.
- Galat menyebut apa yang gagal dan langkah berikutnya, misal "Gagal memuat
  data. Coba muat ulang halaman."
- 401: kembali ke `login.html` dengan pesan "Sesi berakhir. Silakan masuk lagi."
  403: "Halaman ini bukan untuk akunmu."

## 9. Aksesibilitas

- `<html lang="id">`, `<title>` unik, landmark `header`/`nav`/`main`, satu `h1`.
- Aksi memakai `<button>`, navigasi memakai `<a href>`.
- Semua kendali terjangkau keyboard; cincin fokus 2px terlihat
  (`outline: none` tanpa pengganti dilarang).
- Teks tetap utuh saat diperbesar 200%.
- Hormati `prefers-reduced-motion`.

## 10. Token CSS (`public/css/style.css`)

```css
:root {
  --color-bg: #EEF1F6;
  --color-surface: #FFFFFF;
  --color-line: #E3E7EE;
  --color-line-strong: #7A8494;
  --color-ink: #111418;
  --color-ink-2: #5B6472;
  --color-primary: #2563EB;
  --color-primary-ink: #1D4ED8;
  --color-primary-soft: #E6EEFF;
  --color-success-ink: #14532D;
  --color-success-soft: #E7F6EC;
  --color-danger-ink: #991B1B;
  --color-danger-soft: #FDECEC;
  --color-disabled-bg: #E3E7EE;

  --font-display: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px;

  --radius-sm: 8px; --radius-md: 12px; --radius-full: 999px;

  --tap-min: 44px;
  --control-h: 48px;
}
```
