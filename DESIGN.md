---
name: Nuvicare Color & Style System
version: 2.0

colors:
  # Base
  background: '#F9F9F9'
  on-background: '#1A1C1C'
  surface: '#FFFFFF'
  on-surface: '#1A1C1C'
  on-surface-variant: '#5C5F61'

  # Surface hierarchy
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#F3F3F4'
  surface-container: '#EEEEEE'
  surface-container-high: '#E8E8E8'
  surface-container-highest: '#E2E2E2'

  # Primary
  primary: '#1D4ED8'
  on-primary: '#FFFFFF'
  primary-container: '#E6EEFF'
  on-primary-container: '#1D4ED8'
  inverse-primary: '#B7C4FF'

  # Secondary
  secondary: '#5C5F61'
  on-secondary: '#FFFFFF'
  secondary-container: '#E0E3E5'
  on-secondary-container: '#434655'

  # Tertiary
  tertiary: '#3E454C'
  on-tertiary: '#FFFFFF'
  tertiary-container: '#DCE3EC'
  on-tertiary-container: '#40484F'

  # Status
  success: '#15803D'
  on-success: '#FFFFFF'
  success-container: '#E7F6EC'
  on-success-container: '#14532D'

  error: '#BA1A1A'
  on-error: '#FFFFFF'
  error-container: '#FFEBE9'
  on-error-container: '#93000A'

  # Borders
  outline: '#747686'
  outline-variant: '#C4C5D7'

  # Additional
  inverse-surface: '#2F3131'
  inverse-on-surface: '#F0F1F1'
  slate-dark: '#0F172A'

typography:
  font-family:
    display: 'Plus Jakarta Sans'
    body: 'Plus Jakarta Sans'
    fallback: '-apple-system, BlinkMacSystemFont, sans-serif'

  landing:
    headline-xl:
      fontSize: 36px
      fontWeight: 700
      lineHeight: 44px
    headline-lg:
      fontSize: 26px
      fontWeight: 700
      lineHeight: 34px
    headline-md:
      fontSize: 20px
      fontWeight: 600
      lineHeight: 28px
    body:
      fontSize: 14px
      fontWeight: 400
      lineHeight: 22px

  dashboard:
    headline-xl:
      fontSize: 24px
      fontWeight: 700
      lineHeight: 32px
    headline-lg:
      fontSize: 19px
      fontWeight: 700
      lineHeight: 27px
    headline-md:
      fontSize: 16px
      fontWeight: 600
      lineHeight: 24px
    body:
      fontSize: 14px
      fontWeight: 400
      lineHeight: 22px
    body-sm:
      fontSize: 13px
      fontWeight: 400
      lineHeight: 20px
    label:
      fontSize: 13px
      fontWeight: 600
      lineHeight: 18px
    input:
      fontSize: 14px
      fontWeight: 400
      lineHeight: 20px
    button:
      fontSize: 13px
      fontWeight: 600
      lineHeight: 18px
    caption:
      fontSize: 11px
      fontWeight: 500
      lineHeight: 16px

  mobile:
    landing:
      headline-xl:
        fontSize: 28px
        lineHeight: 36px
      headline-lg:
        fontSize: 22px
        lineHeight: 30px
      headline-md:
        fontSize: 18px
        lineHeight: 26px
      body:
        fontSize: 14px
        lineHeight: 22px

    dashboard:
      headline-xl:
        fontSize: 21px
        lineHeight: 28px
      headline-lg:
        fontSize: 17px
        lineHeight: 24px
      headline-md:
        fontSize: 15px
        lineHeight: 22px
      body:
        fontSize: 13px
        lineHeight: 20px
      body-sm:
        fontSize: 12px
        lineHeight: 18px
      label:
        fontSize: 12px
        lineHeight: 18px
      input:
        fontSize: 14px
        lineHeight: 20px
      button:
        fontSize: 13px
        lineHeight: 18px
      caption:
        fontSize: 11px
        lineHeight: 16px

rounded:
  sm: 0.5rem
  DEFAULT: 0.75rem
  md: 1rem
  lg: 1.5rem
  full: 9999px

component-radius:
  input: 8px
  button: 8px
  card: 12px
  container: 12px
  modal: 16px
  badge: 999px

spacing:
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem

  gutter-desktop: 1.5rem
  gutter-mobile: 1rem

layout:
  content-max-width: 960px
  breakpoint-mobile: 768px
  tap-min: 44px
  control-height: 44px
  button-height: 44px

interaction:
  transition-duration: 150ms
  transition-timing: ease-in-out
---

# Nuvicare Color & Style System

## 1. Design Direction

**Warm Clinical Modernism**

Nuvicare menggunakan pendekatan visual yang bersih, tenang, profesional, dan mudah digunakan.

Karakter desain:
- Minimalis dan fungsional.
- Dominasi warna netral dengan aksen biru.
- Tipografi compact dan konsisten.
- Komponen sederhana tanpa dekorasi berlebihan.
- Mengutamakan keterbacaan dan efisiensi ruang.

Tidak menggunakan gradien dekoratif, glassmorphism, bayangan berlebihan, atau animasi yang tidak memiliki fungsi.

## 2. Color Palette

### Primary Color

Warna utama menggunakan `#1D4ED8`.

Digunakan untuk:
- Tombol CTA utama.
- Tautan.
- Navigasi aktif.
- Indikator fokus.
- Elemen interaktif penting.

### Neutral Color

Warna netral digunakan untuk latar halaman, kartu, tabel, formulir, dan teks.

Gunakan hierarki surface untuk membedakan area tanpa harus menambahkan terlalu banyak warna.

### Status Color

| Status | Warna teks | Warna latar |
|---|---|---|
| Success | `#14532D` | `#E7F6EC` |
| Error | `#93000A` | `#FFEBE9` |
| Scheduled | `#1D4ED8` | `#E6EEFF` |

Status harus selalu disertai teks. Jangan mengandalkan warna sebagai satu-satunya indikator.

## 3. Typography

Gunakan Plus Jakarta Sans sebagai keluarga font utama untuk seluruh antarmuka.

Sistem tipografi dibedakan menjadi dua konteks:

- **Landing Page:** memberikan hierarki visual dan identitas produk.
- **Dashboard:** mengutamakan kepadatan informasi dan efisiensi penggunaan.

### Aturan tipografi

1. Hindari judul berukuran besar secara berlebihan.
2. Gunakan ukuran compact pada dashboard.
3. Prioritaskan keterbacaan informasi penting.
4. Jangan menggunakan variasi ukuran font tanpa tujuan hierarki yang jelas.
5. Gunakan line-height yang proporsional.
6. Hindari teks dekoratif yang tidak memberikan informasi.

## 4. Border Radius

Gunakan radius secara konsisten berdasarkan jenis komponen.

| Komponen | Radius |
|---|---:|
| Input | 8px |
| Tombol | 8px |
| Kartu | 12px |
| Container | 12px |
| Modal | 16px |
| Badge | 999px |

Hindari radius besar pada seluruh komponen. Bentuk pill hanya digunakan untuk elemen yang memang membutuhkannya, seperti badge atau chip.

## 5. Spacing & Layout

Gunakan sistem spacing berbasis kelipatan 4px.

| Token | Ukuran |
|---|---:|
| XS | 4px |
| SM | 8px |
| MD | 12px |
| LG | 16px |
| XL | 24px |
| 2XL | 32px |
| 3XL | 40px |

Aturan layout:
- Lebar konten maksimal 960px untuk dashboard.
- Layout terpusat dengan gutter responsif.
- Gunakan satu kolom pada layar mobile.
- Hindari margin dan padding besar yang tidak diperlukan.
- Pastikan tidak terjadi horizontal overflow.

## 6. Component Guidelines

### Buttons
- Tinggi minimum 44px.
- Radius 8px.
- Font 13px.
- Satu tombol utama per halaman jika memungkinkan.
- Tombol utama menggunakan warna primary.
- Tombol sekunder menggunakan latar netral dan border.

### Inputs
- Tinggi minimum 44px.
- Font 14px.
- Label diletakkan di atas input.
- Border terlihat jelas.
- Pesan validasi diletakkan di bawah input.

### Cards
- Background putih.
- Border tipis menggunakan outline-variant.
- Radius 12px.
- Hindari shadow dekoratif.

### Badges
- Bentuk pill.
- Font 11px.
- Menggunakan pasangan warna status yang sesuai.
- Selalu menyertakan label teks.

## 7. Interaction & Motion

Interaksi harus sederhana dan memberikan feedback yang jelas.

- Hover hanya diterapkan pada elemen interaktif.
- Gunakan perubahan warna atau posisi ikon secara minor.
- Durasi transisi sekitar 150ms.
- Hindari fade-in dan animasi dekoratif.
- Hormati preferensi `prefers-reduced-motion`.
- Fokus keyboard harus terlihat jelas.

## 8. Accessibility

- Pastikan kontras teks memenuhi WCAG AA.
- Target kontras teks normal minimal 4.5:1.
- Target sentuh minimal 44×44px.
- Jangan menggunakan warna sebagai satu-satunya penanda status.
- Pastikan layout tetap dapat digunakan saat zoom 200%.
- Jangan menghilangkan indikator fokus keyboard.

## 9. Implementation Rules

1. Gunakan token warna, tipografi, radius, dan spacing sebagai sumber acuan utama.
2. Hindari hardcode nilai desain yang sudah tersedia dalam token.
3. Jangan membuat variasi visual baru tanpa kebutuhan yang jelas.
4. Terapkan breakpoint secara konsisten.
5. Landing page dan dashboard harus menggunakan identitas visual yang sama, tetapi boleh memiliki skala tipografi berbeda.
6. Perubahan desain harus mempertahankan konsistensi ant halaman.

**Prinsip akhir:** Nuvicare harus terlihat profesional dan modern tanpa membuat elemen visual mendominasi informasi. Prioritaskan fungsi, keterbacaan, dan konsistensi.