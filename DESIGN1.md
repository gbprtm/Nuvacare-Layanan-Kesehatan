# Nuvicare: Visual Design System & Layout

## 1. Identitas Visual
- **Tipografi:** Plus Jakarta Sans.
  - Headline: H1 48px/56px (Bold), H2 32px/40px (SemiBold).
  - Body: 16px/24px (Regular), warna slate gelap untuk legibilitas maksimal.
- **Radius Sudut (Border Radius):** 
  - Tombol CTA: `9999px` (Pill shape).
  - Kartu & Gambar: `24px`.
- **Interaksi:** Transisi *hover* hanya pada tombol aksi dan *link* (pergeseran ikon atau perubahan warna minor), tanpa animasi masuk (*fade-in*) berlebihan pada saat gulir halaman.

## 2. Struktur Halaman (Berdasarkan Wireframe)

### A. Navigasi Global (Header)
- Latar transparan atau putih solid.
- Elemen kiri: Logo teks Nuvicare dengan ikon medis minimalis.
- Elemen kanan: Tautan "Home", "Service", tombol sekunder "Buat Janji", ikon Profil.

### B. Hero Section
- Latar: `#F8FAFC`.
- Sisi Kiri (Teks): 
  - Label kecil: "Layanan Kesehatan Terpadu".
  - Headline Utama: "Temukan layanan kesehatan terbaik untuk Anda."
  - Paragraf ringkas.
  - CTA: Tombol biru pekat "Buat Janji Sekarang".
- Sisi Kanan (Visual):
  - Mengabaikan kotak kaku di wireframe. Gunakan komposisi gambar membulat yang menampilkan tenaga medis dan pasien dengan sudut asimetris.

### C. Rekomendasi Poliklinik
- Latar: `#EFF6FF` (Memisahkan seksi secara visual tanpa garis horizontal).
- Header: "Rekomendasi Poliklinik" rata kiri.
- Layout Kartu: 3 kolom.
- Desain Kartu: Latar putih murni `#FFFFFF`, tanpa bayangan. Dilengkapi ikon dalam lingkaran berlatar warna pastel, judul, deskripsi 2 baris, dan tautan teks "Baca selengkapnya ->".

### D. Informasi & Cara Pakai
- Latar: `#F8FAFC`.
- Sisi Kiri: Gambar aplikasi/ilustrasi proses.
- Sisi Kanan: Daftar bernomor atau langkah (*stepper*). Desain titik poin membulat dengan warna aksen untuk menuntun mata pengguna membaca urutan pendaftaran.

### E. Komentar Ahli & Footer
- Testimoni: Kartu tunggal besar dengan kutipan menonjol, nama, dan avatar, diletakkan di tengah dengan latar pastel.
- Footer: Bersih, berisi tautan penting, kontak, dan hak cipta. Rata kiri, dibagi dalam 4 kolom grid.