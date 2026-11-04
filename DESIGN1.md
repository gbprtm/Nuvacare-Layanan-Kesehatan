# Web Janji Temu Kesehatan: Design System (Halaman Utama, Belum Login)

Ruang lingkup: web hanya untuk janji temu (login, pilih poli dan tanggal, riwayat, jadwal kontrol, profil). Halaman ini hanya mengarahkan pengunjung ke **Masuk**, **Daftar**, dan **Buat Janji**. Tidak ada fitur atau konten di luar itu. Data yang belum tersedia ditulis `[ISI]`, tidak dikarang.

Referensi gaya: navbar bersih dengan tombol pill, permukaan abu-abu lembut berradius 20px, input berradius 12px untuk membedakan kolom ketik dari tombol aksi, serta aksen biru untuk state aktif.

> **Design Read (Anti-Slop Part 3):**  
> *Reading this as: Halaman utama publik (belum login) untuk calon pasien dewasa dan keluarga, dengan bahasa visual permukaan abu-abu tenang (`#EEF1F6`) dan penekanan aksi gelap (`#111827`), dial **ENERGY 2 / RHYTHM 2 / MOTION 1**.*

---

## Stage (Urutan Blok)
1. Navbar (3 zona: Logo, Navigasi Utama, Pencarian Poli + Masuk/Daftar)
2. Banner (Latar biru `#DBEAFE` dengan ilustrasi/visual klinik)
3. Kartu Poli (Permukaan Stage Gray `#EEF1F6`)
4. Blok Informasi Singkat + Alur Klinik (Satu baris asimetris di desktop, permukaan Stage Gray `#EEF1F6`)
5. Teks Penjelasan (Maksimal 2 paragraf pendek, lebar baca maksimal 720px)
6. Footer (Latar putih, informasi layanan klinik & tautan cepat)

---

## Color Rule & Kontras WCAG AA (R-25, R-29, R-31)
- **Banner tetap biru (`#DBEAFE`)** sebagai satu-satunya blok pembuka berlatar biru lembut untuk memisahkan orientasi utama dari daftar layanan di bawahnya (alasan hierarki R-01, R-31).
- **Semua stage di bawah banner memakai permukaan seragam: Stage Gray (`#EEF1F6`)** (Kartu Poli, Blok Informasi Singkat, dan Alur Klinik).
- Warna wireframe lama (hijau, kuning, merah) hanya penanda fungsi blok saat perancangan awal, **bukan warna akhir**.
- Biru dipakai hanya sebagai aksen fungsional: menu aktif, ikon, langkah yang disorot, dan cincin fokus keyboard.

## Colors (Terverifikasi Kontras WCAG AA)
- **Banner Blue** (`#DBEAFE`): Latar banner utama.
- **Stage Gray** (`#EEF1F6`): Latar seragam Kartu Poli, Blok Informasi Singkat, dan Alur Klinik.
- **Stage Gray Hover** (`#E3E8F0`): State hover kartu interaktif.
- **Accent** (`#2563EB`): Ikon di atas latar putih/abu-abu, garis menu aktif, dan indikator `:focus-visible`.
- **Accent Ink** (`#1D4ED8`): Teks aksen biru di atas latar `#DBEAFE` atau `#EEF1F6` (rasio kontras `5.49:1` di atas `#DBEAFE`, lolos WCAG AA R-25; menggantikan `#2563EB` yang hanya `4.24:1` di atas `#DBEAFE`).
- **Accent Soft** (`#DBEAFE`): Latar langkah/kartu yang aktif atau di-hover.
- **Button Dark** (`#111827`): Tombol utama (`Daftar`, `Buat Janji`), teks putih (`17.74:1`).
- **Background** (`#FFFFFF`): Latar dasar halaman, navbar, dan footer.
- **Text Primary** (`#111827`): Teks utama dan judul (`17.74:1` di atas putih, `15.42:1` di atas `#EEF1F6`).
- **Text Muted** (`#4B5563`): Teks pendukung dan placeholder (rasio kontras `6.68:1` di atas `#EEF1F6`, lolos WCAG AA R-25; menggantikan `#6B7280` yang gagal di `4.27:1` di atas `#EEF1F6`).
- **Border Subtle** (`#D1D5DB`): Garis pemisah pasif (navbar, pemisah teks penjelasan, footer).
- **Border Interactive** (`#7A8494`): Tepi tombol outline dan kolom pencarian agar memenuhi kontras komponen non-teks minimal `3:1` terhadap latar putih (WCAG 1.4.11, `antislop-human`).

---

## Typography (R-06, R-39, R-40)
- **Keluarga Font Tunggal**: **DM Sans** (Google Fonts, bobot 400, 500, 700), cadangan `system-ui, -apple-system, sans-serif`.
- **Alasan Pemilihan (R-06, R-31)**: Bentuk huruf terbuka dengan proporsi geometris yang ramah dibaca pasien dewasa pada ukuran 14px ke atas. Penggunaan font kedua (`Cantarell`) untuk H5/H6 ditiadakan agar tidak menambah beban unduhan font ketiga (R-40) dan menjaga kesatuan suara tipografi.
- **Batas Ukuran & Semantik Heading (R-39)**: Tidak ada teks di bawah `14px`. Urutan heading wajib berjenjang (`H1` -> `H2` -> `H3` -> `H4`) tanpa melompati level; judul kolom footer menggunakan kelas `.footer-heading` pada elemen semantik yang sesuai.

| Level / Kelas | Font | Ukuran | Bobot | Dipakai untuk |
|---|---|---|---|---|
| H1 | DM Sans | 40px (mobile 28px) | 700 (Bold) | Judul banner utama |
| H2 | DM Sans | 28px (mobile 22px) | 700 (Bold) | Judul section (Pilih Poliklinik, Alur Klinik, Tentang Layanan) |
| H3 | DM Sans | 20px | 500 (Medium) | Nama poli pada kartu |
| H4 | DM Sans | 18px | 500 (Medium) | Judul langkah pada Alur Klinik |
| `.footer-heading` | DM Sans | 14px | 700 (Bold) | Judul kolom pada footer dan penanda langkah |
| Body | DM Sans | 16px, line-height 1.6 | 400 (Regular) | Paragraf dan teks penjelasan |
| Caption | DM Sans | 14px, line-height 1.5 | 400 (Regular) | Teks pendukung, informasi footer, dan placeholder |

Logo (`Klinik Sehat`): DM Sans, 20px, Bold (`700`).

---

## Layout & Hierarki Radius (R-03, R-11, R-31)
- Lebar konten maksimal `1200px`, di tengah, padding samping `24px` (mobile `16px`).
- Jarak antar stage `64px` (tablet `48px`, mobile `40px`); jarak antar kartu `16px`.
- **Hierarki Radius (R-11, R-31)**:
  - `20px`: Permukaan kontainer dan kartu (`Banner`, `Kartu Poli`, `Blok Informasi Singkat`, `Alur Klinik`).
  - `12px`: Kolom input pencarian (`Search`) agar pengguna dapat membedakan kolom ketik dari tombol klik.
  - `999px` (pill): Tombol aksi (`Buat Janji`, `Daftar`, `Masuk`) untuk menonjolkan target interaktif.
- **Reflow 3 Rentang Layar (R-03)**:
  - Desktop (`>= 1024px`): Grid penuh (Banner 2 kolom, Kartu Poli 3-4 kolom, Stage 4 berdampingan `1fr 2fr`).
  - Tablet (`640px - 1023px`): Kartu Poli `2x2`, langkah Alur Klinik `2x2`, Stage 4 bertumpuk proporsional.
  - Mobile (`< 640px`): Satu kolom penuh tanpa *horizontal overflow*, navigasi sekunder masuk ke panel menu mobile yang berlabel jelas.

---

## Components

- **Navbar**: Latar putih (`rgba(255, 255, 255, 0.92)` dengan `backdrop-filter: blur(8px)` sebagai satu-satunya elemen transparan di halaman sesuai batas dosis R-10 untuk menjaga orientasi saat menggulir), tinggi minimal `72px`, sticky, border bawah `1px solid #D1D5DB`. Tiga zona:
  - **Kiri**: Logo **Klinik Sehat**
  - **Tengah**: Menu **Beranda** (aktif: teks `#1D4ED8` + garis bawah `2px solid #2563EB`) dan **Buat Janji**
  - **Kanan**: Kolom search poli (latar `#EEF1F6`, border `1px solid #7A8494`, radius `12px`, tinggi `44px`, `<label class="sr-only">` + placeholder `"Cari poli..."`), tombol **Masuk** (pill outline, border `1px solid #7A8494`, teks `#111827`), tombol **Daftar** (pill dark `#111827`, teks putih)
  - **Mobile (`< 768px`)**: Logo + tombol menu berlabel (`Menu` + ikon garis tiga, tinggi `44px`, `aria-expanded`); saat dibuka menampilkan pencarian poli, tautan navigasi, serta tombol Masuk dan Daftar.
- **Search**: Menyaring kartu poliklinik secara langsung (*real-time filter*) pada `#publicPoliList`. Bila tidak ada yang cocok, menampilkan pesan ramah `"Poli tidak ditemukan"` beserta tombol `"Tampilkan Semua Poli"` (R-26, R-27).
- **Buttons**:
  - Primary pill dark: latar `#111827`, teks `#FFFFFF`, tinggi minimal `44px`, padding `8px 18px`, ukuran teks `14px`, radius `999px` (proporsional dan ringkas, satu baris tanpa membungkus teks panjang).
  - Outline pill: latar transparan/putih, border `1px solid #7A8494`, teks `#111827`, tinggi minimal `44px`, padding `8px 18px`, ukuran teks `14px`, radius `999px`.
  - Fokus keyboard: `:focus-visible` berupa `outline: 2px solid #2563EB` dengan `outline-offset: 2px` (R-32).
- **Banner**: Latar Banner Blue (`#DBEAFE`), tinggi minimal `360px` (mobile `auto`, padding proporsional), radius `20px`. Berisi H1 (`#111827`), satu kalimat pendukung (`#111827` / `#4B5563`), dan tombol pill dark **"Buat Janji"** di sisi kiri, serta ilustrasi layanan klinik di sisi kanan.
- **Kartu Poli**: Latar Stage Gray (`#EEF1F6`), radius `20px`, padding `20px`. Susunan baris responsif (desktop 3-4 kolom menyesuaikan jumlah poli aktif, tablet 2 kolom, mobile 1 kolom). Isi: ikon minimalis beraksen biru (`#2563EB`), nama poli (`H3`) dari tabel `polyclinics`, daftar dokter aktif, serta tombol aksi pill dark default **"Buat Janji"** yang diletakkan di posisi tengah kartu. Hover: latar `#E3E8F0` + naik `3px`. Tombol mengarah ke alur Buat Janji dengan poli terpilih (`?poli=<id>`).
- **Stage 4 (Blok Informasi Singkat + Alur Klinik dalam Satu Baris)**:
  - **Blok Informasi Singkat (Kiri)**: Latar Stage Gray (`#EEF1F6`), radius `20px`, padding `24px`. Berisi informasi faktual pengingat jadwal dan verifikasi OTP melalui WhatsApp beserta tautan langsung memilih poliklinik.
  - **Alur Klinik (Kanan)**: Latar Stage Gray (`#EEF1F6`), radius `20px`, padding `24px`. Judul `H2` `"Alur Klinik"`, diikuti 4 langkah. Tiap langkah memiliki penanda kotak kecil + judul langkah (`H4`) + satu baris penjelasan singkat. Langkah pertama/aktif atau langkah yang di-hover disorot dengan latar Accent Soft (`#DBEAFE`) dan teks `#1D4ED8`.
- **Teks Penjelasan**: Maksimal 2 paragraf pendek, lebar baca maksimal `720px`, dipisahkan garis `1px solid #D1D5DB`.
- **Footer**: Latar putih (`#FFFFFF`), border atas `1px solid #D1D5DB`. Menampilkan informasi layanan (nama klinik, alamat, jam layanan, kontak) dengan judul kolom `.footer-heading`, tautan cepat yang aktif, dan hak cipta.

---

## Motion (R-19, R-39)
- Dial gerak adalah **MOTION 1**: transisi halus `200ms ease` hanya pada perubahan status hover dan fokus.
- Tanpa animasi masuk bertahap (*staggered entrance*) agar konten langsung terbaca tanpa jeda oleh pasien dewasa.
- Wajib menghormati `@media (prefers-reduced-motion: reduce)` dengan mematikan seluruh transisi gerak.

## UX Rules
- Satu tujuan utama: pengunjung langsung memahami bahwa web ini adalah layanan pendaftaran janji temu rawat jalan.
- CTA konsisten: **"Buat Janji"** dan **"Daftar"** memakai gaya tombol pill dark (`#111827`); **"Masuk"** memakai gaya pill outline.
- Bila pengunjung belum login lalu menekan **Buat Janji** atau memilih **Kartu Poli**, arahkan ke `/login.html?next=...`, lalu kembalikan ke `/pasien/janji-temu.html?poli=<id>` dengan poliklinik tetap terpilih.
- Tidak ada jalan buntu: setiap status kosong atau pencarian tanpa hasil menyediakan langkah pemulihan (R-27).
- Tanpa kalimat promosi berlebihan (*buzzword* AI), tanpa *em dash* (R-02), dan tanpa *eyebrow badge* yang mengulang judul di atas H1/H2 (R-09).

## Accessibility (R-03, R-25, R-32, R-39)
- Kontras teks normal minimal `4.5:1` dan kontras tepi kontrol interaktif minimal `3.0:1`.
- Semua gambar memiliki atribut `alt`, `width`, dan `height` eksplisit (R-40); ikon dekoratif pendamping teks memakai `aria-hidden="true"`.
- Semua elemen interaktif dapat dioperasikan penuh dengan keyboard (`Tab`, `Enter`, `Escape` untuk menutup menu mobile).
- Target sentuh minimal `44x44px` dengan jarak antar-target minimal `8px`.
- Hirarki heading berurutan (`H1` -> `H2` -> `H3` -> `H4`) dan landmark semantik lengkap (`header`, `nav`, `main`, `section`, `footer`).
