---
name: Nuvicare Friendly Clinical Design System
version: 3.0.0
hallmark-version: 2.0.0
genre: modern-minimal
posture: Restrained
surface: tinted-paper
dials:
  energy: 2
  rhythm: 2
  motion: 1

colors:
  # Paper & Surface Hierarchy (Tinted chroma >= 0.005, Hallmark Gate 7a/7b/22)
  paper: '#F8F9FB'                  # oklch(98.2% 0.005 245)
  paper-2: '#F2F5F9'                # oklch(96.6% 0.007 245)
  paper-3: '#EAEFF5'                # oklch(94.8% 0.010 245)
  surface: '#FDFEFF'                # oklch(99.6% 0.002 245)
  surface-elevated: '#FFFFFF'       # untuk kartu/modal di atas paper

  # Ink & Text Hierarchy (Semua lulus WCAG AA >= 4.5:1 di atas paper & surface)
  ink: '#141A24'                    # oklch(21.5% 0.020 252) -> 16.57:1 di atas paper
  ink-2: '#475263'                  # oklch(43.8% 0.025 252) -> 7.51:1 di atas paper
  muted: '#586375'                  # oklch(49.8% 0.025 252) -> 5.77:1 di atas paper

  # Rules & Borders (Hallmark Gate 40: tepi kontrol wajib >= 3.0:1)
  rule: '#DCE3ED'                   # oklch(91.2% 0.012 248) -> pembatas dekoratif/kartu (1.28:1)
  control-border: '#687385'         # oklch(55.4% 0.024 252) -> border input/tombol/checkbox (4.55:1)

  # Primary Signal & Focus (Restrained posture < 5% viewport, Hallmark Gate 23/41)
  primary: '#1D4ED8'                # oklch(51.1% 0.210 263) -> 6.64:1 dengan putih
  primary-strong: '#0037B0'         # oklch(42.5% 0.198 263) -> 9.57:1 dengan putih (hover/aktif)
  on-primary: '#FFFFFF'
  primary-container: '#E6EEFF'      # oklch(94.4% 0.028 263)
  on-primary-container: '#1D4ED8'   # 5.76:1 di atas primary-container
  focus-ring: '#1D4ED8'             # oklch(51.1% 0.210 263) -> > 3.0:1 instan

  # Status Semantic Pairs (Selalu disertai label teks, WCAG AA >= 4.5:1)
  success: '#15803D'                # 5.02:1 di atas surface
  success-container: '#E7F6EC'
  on-success-container: '#14532D'   # 8.15:1 di atas success-container

  warning: '#B45309'                # 5.02:1 di atas surface
  warning-container: '#FEF3C7'
  on-warning-container: '#92400E'   # 6.37:1 di atas warning-container

  error: '#B91C1C'                  # 6.47:1 di atas surface
  error-container: '#FDECEC'
  on-error-container: '#991B1B'     # 7.28:1 di atas error-container

  disabled-bg: '#EAEFF5'
  disabled-ink: '#586375'

typography:
  font-family:
    display: '"Rethink Sans", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif'
    body: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif'
    outlier: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace'

  weights:
    regular: 400
    semibold: 600
    bold: 700

  landing:
    display:
      fontSize: 'clamp(2.25rem, 4vw, 3.25rem)' # 36px s.d. 52px
      fontWeight: 700
      lineHeight: 1.12
      letterSpacing: '-0.025em'
    headline-lg:
      fontSize: 'clamp(1.75rem, 2.8vw, 2.5rem)' # 28px s.d. 40px (Lulus Hallmark Gate 78)
      fontWeight: 700
      lineHeight: 1.18
      letterSpacing: '-0.02em'
    headline-md:
      fontSize: '1.25rem' # 20px
      fontWeight: 600
      lineHeight: 1.35
    body:
      fontSize: '1rem'    # 16px (Wajib Hallmark Floor & Gate 75)
      fontWeight: 400
      lineHeight: 1.6

  dashboard:
    headline-xl:
      fontSize: '1.5rem'     # 24px (mobile: 21px)
      fontWeight: 700
      lineHeight: 1.3
    headline-lg:
      fontSize: '1.1875rem'  # 19px (mobile: 17px)
      fontWeight: 700
      lineHeight: 1.35
    headline-md:
      fontSize: '1rem'       # 16px (mobile: 15px)
      fontWeight: 600
      lineHeight: 1.45
    body:
      fontSize: '1rem'       # 16px untuk teks bacaan utama, 14px untuk sel tabel padat
      fontWeight: 400
      lineHeight: 1.55
    label:
      fontSize: '0.875rem'   # 14px (sentence case, untracked, Gate 67)
      fontWeight: 600
      lineHeight: 1.4
    input:
      fontSize: '1rem'       # 16px di mobile (cegah auto-zoom iOS), 14px-16px di desktop
      fontWeight: 400
      lineHeight: 1.4
    button:
      fontSize: '0.875rem'   # 14px
      fontWeight: 600
      lineHeight: 1.25
    caption:
      fontSize: '0.75rem'    # 12px minimum (Hallmark Gate 75)
      fontWeight: 400
      lineHeight: 1.45

component-radius:
  input: 8px
  button: 8px
  card: 12px
  container: 12px
  modal: 16px
  pill: 999px

spacing:
  space-3xs: 2px
  space-2xs: 4px
  space-xs: 8px
  space-sm: 12px
  space-md: 16px
  space-lg: 24px
  space-xl: 40px
  space-2xl: 64px
  space-3xl: 96px
  gutter-desktop: 24px
  gutter-mobile: 16px

layout:
  content-max-width-app: 960px
  content-max-width-landing: 1360px
  breakpoint-mobile: 768px
  tap-min: 44px
  control-height: 44px
  button-height: 44px

interaction:
  dur-micro: 120ms
  dur-short: 220ms
  dur-long: 420ms
  ease-out: 'cubic-bezier(0.16, 1, 0.3, 1)'
  ease-in-out: 'cubic-bezier(0.4, 0, 0.2, 1)'
---

# Design: Nuvicare (Friendly Clinical Modernism)

Sistem desain terkunci (*locked system*) untuk Nuvicare. Setiap pembuatan halaman, komponen, maupun perbaikan antarmuka pada permukaan `pasien` dan `staf` wajib membaca dokumen ini terlebih dahulu dan mematuhi **Hallmark v2.0.0** serta **Anti-Slop Delivery Gate**.

---

## 1. Identitas & Arah Desain (System & Dials)

- **Genre Hallmark**: `modern-minimal` (dengan sentuhan ramah dan hangat untuk pasien segala usia).
- **Karakter**: **Friendly Clinical Modernism** (tenang, ramah, jujur, tidak mengintimidasi pasien, dan efisien bagi staf klinik).
- **Axes Hallmark**: `light / grotesk-sans / cool-cobalt` · **Posture**: `Restrained` (warna aksen biru dipakai sebagai sinyal di bawah 5% area layar, bukan pengisi latar besar).
- **Anti-Slop Three Dials**:
  - **ENERGY = 2 (Balanced)**: Ramah dan berkarakter melalui skala tipografi yang jelas serta ruang bernapas yang lega, tanpa dekorasi berlebih.
  - **RHYTHM = 2 (Consistent with breaks)**: Halaman publik bervariasi mengikuti tangga permukaan (*surface ladder*), sedangkan halaman aplikasi (`pasien` dan `staf`) menjaga ritme kerja yang konsisten dan mudah dipindai.
  - **MOTION = 1 (Calm / Hover & State Only)**: Transisi hanya untuk kejelasan status (`120ms` s.d. `220ms`), tanpa animasi melayang atau *loop* tanpa henti.

---

## 2. Aturan Wajib Hallmark (The Floor: 16 Hukum Mutlak)

Aturan berikut bersifat **Floor** (tidak boleh dilanggar dan tidak boleh di-*waive* di halaman mana pun):

1. **Token Tunggal (Gate 48)**: Setiap warna dan `font-family` wajib melalui variabel CSS di `:root`. Dilarang menulis hex/RGB/nama font literal di luar blok `:root`.
2. **Properti Transisi Eksplisit (Gate 10a)**: Dilarang menggunakan `transition: all`. Dilarang menganimasikan `width`, `height`, `top`, atau `left`. Hanya animasikan `transform`, `opacity`, `background-color`, `border-color`, atau `color`.
3. **Konsistensi Heading (Gate 38i & 38iii)**: Dilarang memiringkan (*italic*) atau memberi warna/stabilo berbeda pada satu kata di tengah judul (*heading*). Satu judul hanya memiliki satu berat, satu gaya, dan satu warna.
4. **Kunci Overflow Horizontal (Gate 34)**: Terapkan `overflow-x: clip` pada `html` dan `body`. Dilarang memakai `100vw` untuk lebar kontainer.
5. **Keamanan Grid & Heading Panjang (Gate 50)**: Kolom CSS Grid yang memuat gambar atau konten dinamis wajib memakai `minmax(0, 1fr)`. Heading besar wajib memiliki `overflow-wrap: break-word; min-width: 0; text-wrap: balance`.
6. **Fokus Keyboard Instan (Gate 15 & 26a)**: Setiap elemen interaktif wajib memiliki `:focus-visible` dengan rasio kontras minimal `3:1` terhadap latar di sekitarnya, dan muncul **instan** (`transition: none` pada `outline`).
7. **Reduced Motion & Ketahanan Tanpa JS (Gate 27 & 62)**: Semua transisi/animasi wajib dimatikan di dalam `@media (prefers-reduced-motion: reduce)`. Konten utama tidak boleh disembunyikan dengan `opacity: 0` yang bergantung penuh pada JavaScript agar tampil.
8. **Kejujuran Data (Gate 46a & 70 · Anti-Slop R-17/R-18/R-36)**: Dilarang mengarang angka statistik (misalnya *"10.000+ pasien puas"*), testimoni fiktif, deretan logo mitra palsu, atau menampilkan pesan sukses palsu pada formulir yang belum terhubung ke endpoint nyata.
9. **Larangan Eyebrow & Tracked-Caps Label (Gate 54 & 67)**:
   - **Tanpa Eyebrow**: Dilarang menaruh teks kecil atau *pill badge* dekoratif di atas `h1`/`h2` yang hanya mengumumkan judul di bawahnya.
   - **Tanpa Tracked Caps**: Label formulir, kepala tabel (`th`), *caption*, *badge*, *chip*, dan tautan navigasi wajib menggunakan huruf normal (*sentence case*), **bukan** `text-transform: uppercase` dengan *letter-spacing* lebar.
10. **Tanpa Tanda Baca Template & Em Dash (Gate 19 & 63 · Anti-Slop R-02)**: Dilarang menggunakan karakter *em dash* atau *en dash* pada teks UI maupun dokumentasi (gunakan koma, titik dua, titik, atau tanda kurung). Dilarang merangkai metadata dengan banyak titik tengah (`A · B · C`), menempelkan panah `→` pada setiap tombol, atau memasang titik lampu berkedip dekoratif yang tidak mewakili status langsung (*live state*).
11. **Larangan Klise Visual AI (Gate 2a, 4, 30a, 47a)**: Dilarang memakai gradien ungu-ke-biru, kartu di dalam kartu (*card inside a card*), emoji sebagai pengganti ikon UI, atau bingkai jendela browser/OS buatan tangan.
12. **Keterlihatan Fold Hero (Gate 44b)**: Pada halaman publik (`1280 x 800`), judul utama, satu kalimat penjelas, dan tombol aksi utama harus langsung terlihat utuh tanpa menggulir layar.
13. **Anggaran Kata per Layar (Gate 58)**: Halaman publik dibatasi sekitar 80 kata per jendela pandang (`900px` tinggi); teks hero hanya terdiri dari judul (maksimal 7 kata), satu kalimat penjelas (maksimal 12 kata), dan tombol aksi.
14. **Batas Lebar Kontainer (Gate 44d)**: Kontainer terpusat dan dibatasi (`960px` pada aplikasi/dashboard, maksimal `1360px` pada landing page). Pada layar lebar (`1920px`), margin samping (*gutter*) yang melebar, bukan jumlah kolom atau panjang baris teks (`max-width: 65ch` untuk paragraf, Gate 25).
15. **Kestabilan Input & Kontrol Sejajar (Gate 39a & 39b)**: Ketebalan `border` input tidak boleh berubah antar-state (`1px` tetap `1px`; saat fokus gunakan `outline`, bukan menebalkan `border` menjadi `2px`). Input dan tombol yang berdampingan wajib memiliki tinggi yang sama persis (`44px`).
16. **Invarian Halaman (Finish F15)**: Maksimal 3 bobot font (`400`, `600`, `700`) di seluruh halaman (Finish F19), satu gaya tombol utama per layar (Finish F4), dan angka yang dibandingkan (jam slot, tanggal, batas waktu SLA, harga/kuota) wajib memakai `font-variant-numeric: tabular-nums` (Finish F6).

---

## 3. Sistem Token CSS (`:root`)

Blok berikut menyatukan standar token Hallmark (OKLCH + Hex) dengan nama variabel yang digunakan di [style.css](file:///c:/Users/HYPE%20AMD/Documents/project/public/css/style.css):

```css
/* Hallmark · v2.0.0 · genre: modern-minimal · posture: Restrained · surface: tinted-paper */
:root {
  /* 1. Paper & Surface Ladder (Tinted toward cool-cobalt 245deg, chroma >= 0.005) */
  --color-paper: #F8F9FB;            /* oklch(98.2% 0.005 245) - latar halaman utama */
  --color-paper-2: #F2F5F9;          /* oklch(96.6% 0.007 245) - tinted well / seksi sekunder */
  --color-paper-3: #EAEFF5;          /* oklch(94.8% 0.010 245) - header tabel / area pasif */
  --color-surface: #FDFEFF;          /* oklch(99.6% 0.002 245) - permukaan kartu & input */
  --color-surface-elevated: #FFFFFF; /* permukaan modal & dialog */

  /* 2. Ink & Text (Lulus WCAG AA >= 4.5:1 di atas semua paper/surface) */
  --color-ink: #141A24;              /* oklch(21.5% 0.020 252) - 16.57:1 */
  --color-ink-2: #475263;            /* oklch(43.8% 0.025 252) - 7.51:1 */
  --color-muted: #586375;            /* oklch(49.8% 0.025 252) - 5.77:1 */

  /* 3. Rules & Control Edges (Gate 40: control-border wajib >= 3.0:1) */
  --color-rule: #DCE3ED;             /* 1px hairline pembatas bagian/kartu */
  --color-control-border: #687385;   /* 4.55:1 untuk border input, select, checkbox, tombol sekunder */

  /* 4. Accent & Focus Signal */
  --color-accent: #1D4ED8;           /* 6.64:1 dengan teks putih */
  --color-accent-strong: #0037B0;    /* 9.57:1 untuk hover/active & portal staf */
  --color-accent-ink: #FFFFFF;
  --color-accent-soft: #E6EEFF;
  --color-on-accent-soft: #1D4ED8;   /* 5.76:1 di atas accent-soft */
  --color-focus: #1D4ED8;

  /* 5. Status Semantic Pairs (Wajib disertai label teks) */
  --color-success-ink: #14532D;      /* 8.15:1 di atas success-soft */
  --color-success-soft: #E7F6EC;
  --color-warning-ink: #92400E;      /* 6.37:1 di atas warning-soft */
  --color-warning-soft: #FEF3C7;
  --color-danger-ink: #991B1B;       /* 7.28:1 di atas danger-soft */
  --color-danger-soft: #FDECEC;

  /* 6. Alias Kompatibilitas public/css/style.css */
  --color-bg: var(--color-paper);
  --color-line: var(--color-rule);
  --color-line-strong: var(--color-control-border);
  --color-primary: var(--color-accent-strong);
  --color-primary-ink: var(--color-accent-strong);
  --color-primary-soft: var(--color-accent-soft);
  --color-disabled-bg: var(--color-paper-3);

  /* 7. Font Roles */
  --font-display: "Rethink Sans", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-sans: var(--font-body);
  --font-outlier: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

  /* 8. Motion & Timing (Hallmark Craft §5) */
  --dur-micro: 120ms;
  --dur-short: 220ms;
  --dur-long: 420ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 4. Tipografi & Opsi Penambahan Font (Hallmark Craft §1 & `fonts.md`)

Untuk menghadirkan kesan **ramah, hangat, dan modern** sekaligus menghindari tampilan generik, sistem tipografi dibagi menjadi maksimal **3 peran** (`--font-display`, `--font-body`, dan `--font-outlier`) dengan maksimal **3 ketebalan** (`400`, `600`, `700`).

### 4.1 Opsi Pasangan Font (Telah Lulus Uji `theme.mjs check --face`)

Anda dapat mempertahankan pasangan bawaan atau memilih salah satu dari **3 paket kombinasi font ramah & modern** berikut yang telah terverifikasi bersih di Hallmark:

#### Opsi A (Rekomendasi Utama: Friendly Neo-Grotesk + Warm Humanist)
Memberikan kesan klinik modern yang hangat, lugas, dan bersahabat tanpa terlihat kaku.
- **Display (`--font-display`)**: `Rethink Sans` (bobot `600`, `700`) dari Google Fonts.
- **Body (`--font-body`)**: `Plus Jakarta Sans` atau `Figtree` (bobot `400`, `600`) dari Google Fonts.
- **Outlier / Angka Slot & Kode (`--font-outlier`)**: `JetBrains Mono` (bobot `400`, khusus kode rujukan/ID slot).

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&family=Plus+Jakarta+Sans:wght@400;600;700&family=Rethink+Sans:wght@600;700&display=swap" rel="stylesheet">
```

#### Opsi B (Keterbacaan Inklusif Tinggi / Ramah Lansia & Pasien)
Dirancang khusus untuk kenyamanan baca maksimal bagi pasien lintas usia dan pengguna berkacamata.
- **Display (`--font-display`)**: `Lexend` (bobot `600`, `700`) dari Google Fonts.
- **Body (`--font-body`)**: `Onest` atau `Figtree` (bobot `400`, `600`) dari Google Fonts.
- **Outlier (`--font-outlier`)**: `DM Mono` (bobot `400`).

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400&family=Figtree:wght@400;600&family=Lexend:wght@600;700&display=swap" rel="stylesheet">
```

#### Opsi C (Foundry-Grade Modern Warmth via Fontshare + Google)
Menggunakan tipografi kelas *foundry* yang bersih untuk kesan klinik premium namun tetap akrab.
- **Display (`--font-display`)**: `Afacad` (Google Fonts) atau `Satoshi` (Fontshare, bobot `700`).
- **Body (`--font-body`)**: `General Sans` (Fontshare, bobot `400`, `600`).
- **Wordmark / Outlier (`--font-outlier`)**: `Gambetta` (Fontshare, serif hangat khusus logo `.wordmark` di navigasi).

```html
<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@700&f[]=general-sans@400,600&f[]=gambetta@600&display=swap" rel="stylesheet">
```

### 4.2 Aturan Pemuatan & Perilaku Font (Wajib)
1. **Hanya muat bobot yang dipakai**: Maksimal 3 bobot (`400`, `600`, `700`) dengan `display=swap` dan `<link rel="preconnect">`.
2. **Tanpa sintesis font palsu**: Terapkan `font-synthesis: none;` pada `body` agar browser tidak memalsukan *bold* atau *italic*.
3. **Keterbacaan Body & Input (Gate 75)**:
   - Teks paragraf utama (`body`) wajib minimal **`16px`** (`1rem`) dengan `line-height: 1.55` s.d. `1.65` dan panjang baris `45ch` s.d. `65ch`.
   - Input formulir pada layar mobile wajib **`16px`** agar browser iOS/Android tidak melakukan *auto-zoom* paksa saat pengguna mengetik.
   - Ukuran teks terkecil di seluruh aplikasi (`caption` / `badge`) adalah **`12px`** (`0.75rem`).
4. **Angka Sejajar (`tabular-nums`, Finish F6)**:
   - Semua jam slot (`08:00 - 08:30`), tanggal, penghitung karakter (`10/500`), dan penanda batas SLA (`due_at`) wajib menerapkan `font-variant-numeric: tabular-nums`.
5. **Aturan Peran `--font-outlier` (Gate 64 & Finish F13)**:
   - Font monospace (`--font-outlier`) **hanya** boleh dipakai pada satu peran spesifik (misalnya kode booking/ID atau angka jam teknis). Dilarang memakai font monospace untuk label formulir, kepala tabel, atau *badge* status.

---

## 5. Tangga Permukaan, Spasi, & Layout (Surface Ladder)

### 5.1 Tangga Permukaan (Hallmark Craft §3 & Gate 4 / Gate 9 / Finish F24)
Untuk membedakan area tanpa menumpuk kotak di dalam kotak, gunakan 4 anak tangga permukaan berikut secara bergantian:
1. **Ruang Kosong (*Whitespace*)**: Pemisah utama antar-kelompok informasi pada permukaan yang sama (`--color-paper`).
2. **Garis Rambut (*Hairline Rule*)**: Garis `1px solid var(--color-rule)` untuk memisahkan baris daftar janji, baris tabel, atau seksi berurutan.
3. **Lembah Berwarna (*Tinted Well*)**: Latar `--color-paper-2` (`#F2F5F9`) **tanpa border** untuk area ringkasan, filter bar, atau blok informasi pendukung.
4. **Kartu (*Card*)**: Latar `--color-surface` (`#FDFEFF`) dengan `1px solid var(--color-rule)` **atau** bayangan halus (`0 1px 2px oklch(20% 0.01 250 / 0.05)`), **tidak boleh keduanya sekaligus (Finish F24)**.
   - **Dilarang membuat kartu di dalam kartu (Gate 4)**: Di dalam sebuah kartu, gunakan *hairline rule* atau *tinted well* بدون border untuk mengelompokkan sub-item.

### 5.2 Cara Membuka Seksi Tanpa Eyebrow (Gate 54 & Craft §7)
Jangan pernah menaruh *pill badge* atau label huruf besar kecil di atas judul. Gunakan salah satu dari 3 cara berikut:
1. **Judul langsung berbicara**: Dua kata pertama pada `h2` langsung menyebutkan subjeknya (contoh: *"Jadwal praktik dokter minggu ini"*, bukan eyebrow `JADWAL` di atas *"Pilih waktu kunjungan Anda"*).
2. **Garis pembatas atas (*Top Rule*)**: Satu garis `1px solid var(--color-rule)` di atas seksi baru dengan jarak `var(--space-xl)`.
3. **Pergantian kertas (*Paper Shift*)**: Berpindah dari `--color-paper` ke `--color-paper-2`.

### 5.3 Skala Spasi & Radius Konsentris
- Gunakan token spasi secara ketat (`--space-2xs: 4px`, `--space-xs: 8px`, `--space-sm: 12px`, `--space-md: 16px`, `--space-lg: 24px`, `--space-xl: 40px`, `--space-2xl: 64px`). Dilarang menulis angka `margin`/`padding`/`gap` mentah di luar skala (Gate 24a).
- **Radius Konsentris**: Jika kartu luar memiliki `border-radius: 12px` dan `padding: 4px`, elemen di dalamnya menggunakan `border-radius: 8px` (`inner = outer - padding`).
  - Input & Tombol: `8px`
  - Kartu & Kontainer: `12px`
  - Modal / Dialog: `16px`
  - Lencana Status (*Status Badge*): `999px` (hanya untuk lencana status dan chip filter, maksimal pada 4 selektor di luar kontrol, Finish F7).

---

## 6. Komponen, 8 State Kontrol, & Gerak (Motion)

### 6.1 Delapan State Wajib pada Kontrol Interaktif (Gate 26b & 39a)
Setiap tombol, input, select, dan tab wajib mendefinisikan perilaku visual yang jelas:
1. **Default (Rest)**: Border kontrol menggunakan `--color-control-border` (`#687385`, rasio `4.55:1`), tinggi minimal **`44px`**, dan `cursor: pointer` pada semua elemen aktif.
2. **Hover**: Perubahan warna latar satu tingkat (misalnya `--color-accent` ke `--color-accent-strong` pada tombol utama, atau latar `--color-paper-2` pada tombol sekunder) dalam `var(--dur-micro)` (`120ms`). Gambar tidak boleh membesar/berputar saat hover (Gate 11).
3. **Focus-Visible**: `outline: 2px solid var(--color-focus); outline-offset: 2px;` (atau `outline-offset: -2px` pada input), muncul **instan tanpa animasi fade** (Gate 15 & 26a).
4. **Active (Pressed)**: `transform: translateY(1px)` atau warna satu tingkat lebih gelap dalam `120ms`.
5. **Disabled**: Kombinasi tiga kanal sekaligus (Gate 39a): atribut native `disabled`, `opacity: 0.55`, dan `cursor: not-allowed` dengan latar `--color-disabled-bg`.
6. **Loading**: Tombol tetap mempertahankan lebarnya, menampilkan indikator pemuatan bersama label teks (misalnya *"Menyimpan..."*), dan mencegah pengiriman ganda.
7. **Invalid / Error**: Border input tetap `1px` namun berubah warna ke `--color-danger-ink` (`#991B1B`), disertai pesan teks jelas di bawah input.
8. **Valid / Selected**: Indikator terpilih menggunakan kombinasi warna, ikon/tanda centang, dan atribut `aria-selected` / `aria-checked`.

### 6.2 Aturan Formulir & Pesan Bantuan (Finish F14)
- Setiap input wajib memiliki `<label for="...">` yang terlihat jelas di atasnya (sentence case, `14px`, `font-weight: 600`, tanpa *letter-spacing* lebar).
- Slot pesan validasi/bantuan di bawah input wajib mencadangkan tinggi minimal `min-height: 1.25rem` (`1lh`) atau dikelola secara terstruktur agar kemunculan pesan error tidak menggeser tombol di bawahnya secara mendadak.

### 6.3 Permukaan Browser Bertema (Finish F16)
Terapkan aturan dasar berikut pada `base` layer di CSS:
```css
html, body {
  overflow-x: clip;
  background-color: var(--color-paper);
  color: var(--color-ink);
  font-synthesis: none;
  caret-color: var(--color-accent);
  scrollbar-color: var(--color-control-border) var(--color-paper-2);
}

::selection {
  background-color: var(--color-accent-soft);
  color: var(--color-accent-strong);
}
```

---

## 7. Pola Antarmuka Staf & Pasien (Kepatuhan Domain Klinik)

Area pasien (`surfaces/pasien/`) dan area staf (`surfaces/staf/`) berbagi sistem token yang sama di atas, dengan penegakan aturan domain berikut:

### 7.1 Lencana Status WCAG AA (Wajib Disertai Label Teks & Sentence Case)
Jangan gunakan huruf kapital berjarak (*tracked uppercase*) pada lencana status. Gunakan huruf normal (*sentence case*):
- **Menunggu / Peringatan** (`Diajukan`, mendekati batas SLA): teks `--color-warning-ink` (`#92400E`) pada latar `--color-warning-soft` (`#FEF3C7`), rasio **`6.37:1`**.
- **Selesai / Disetujui** (`Selesai`, `Disetujui`, `Dijadwalkan ulang`): teks `--color-success-ink` (`#14532D`) pada latar `--color-success-soft` (`#E7F6EC`), rasio **`8.15:1`**.
- **Ditolak / Lewat SLA / Dibatalkan** (`Ditolak`, lewat `due_at`, `Dibatalkan`, `Gugur`, `Kedaluwarsa`): teks `--color-danger-ink` (`#991B1B`) pada latar `--color-danger-soft` (`#FDECEC`), rasio **`7.28:1`**.
- **Terjadwal** (`Terjadwal`): teks `--color-on-accent-soft` (`#1D4ED8`) pada latar `--color-accent-soft` (`#E6EEFF`), rasio **`5.76:1`**.

### 7.2 Pola Layar Utama Staf (`/hallmark --scope app`)
- **Kepadatan App Screen & Pemangkasan Padding**: Khusus portal operasional staf (`admin/*` dan `dokter/*`), aturan padding halaman publik dilepas dan diganti kepadatan aplikasi (`/hallmark --scope app`):
  - **Top Header Bar (`.staff-topbar`)**: Tinggi `56px` berisi identitas brand + peran, **Search Bar** terpadu, indikator notifikasi antrean pending, serta profil/keluar di desktop (atau tombol pemicu `MENU` di mobile `<= 960px`).
  - **Padding Kanvas & Kartu**: Area utama `.staff-main` memakai `padding: 12px 16px` (`12px` di mobile) dengan `gap: 12px`; kartu operasional memakai `padding: 12px 16px` dengan radius `8px` (`--radius-sm`); sel tabel memakai `8px 10px` dengan format tanggal 2 baris ringkas.
  - **Kontrol Tabel & Filter Desktop vs Mobile**: Input/tombol pada bilah *organizer* dan baris tabel desktop memakai tinggi visual `36px` (`--control-app-h: 36px`) dengan perluasan area klik `44px` (`::after` inset), dan kembali ke `min-height: 44px` penuh pada mobile (`<= 960px`) serta perangkat sentuh (*coarse pointer*).
  - **Navigasi Mobile (`<= 960px`)**: Sidebar statis disembunyikan pada layar mobile dan digantikan oleh **Slide-Over Drawer Kanan (`.patient-drawer*`)** yang identik dengan halaman pasien (daftar menu berpemisah garis rambut, item expandable `+` untuk *Filter Cepat*, stempel `NC`, serta CTA kapsul penuh di bagian bawah drawer).
- **Login Staf (`staf/login.html`)**: Satu kartu terpusat dengan satu fokus formulir email dan kata sandi staf. Tanpa tautan daftar akun pasien, tombol Google, maupun alur OTP pasien. Menampilkan umpan balik jelas saat akun tidak aktif, bukan akun staf, atau dokter belum terhubung ke profil dokter.
- **Portal Dokter (`dokter/janji-temu.html`)**: Tiga tab (`Janji Saya`, `Pengajuan Saya`, `Slot Tambahan`), pencarian cepat pasien, filter *organizer* (rentang tanggal default hari ini s.d. +7 hari, status, jenis kunjungan, urutkan), serta pintasan `Ajukan cuti terjadwal` dan `Ajukan slot tambahan`. Baris janji menampilkan tanggal ringkas + jam slot (`tabular-nums`), nama pasien, poli, jenis, status janji, dan lencana status pengajuan tanpa kontrol ubah jadwal. Panel detail samping (`#appointmentDetailPanel`) hanya memuat data minimal dan kontak pasien tersamar (tanpa `complaint` maupun `doctor_notes`).
- **Admin (`admin/kelola-janji.html` & `admin/master-data.html`)**: Memisahkan relasi **Fokus Pasien / Kontrol Cepat** dan **Antrean Pengajuan Dokter** di atas **Organizer + Tabel `Daftar Janji & Kontrol`**, dilengkapi panel kanan (`Ringkasan Hari Ini` dari data API nyata) pada desktop lebar. Halaman `admin/master-data.html` menyediakan pencarian, filter status praktik & status akun, pengurutan, kontrol buat akun login dokter, dan sakelar aktif/nonaktif praktik maupun akses dokter.

### 7.3 Tiga State Wajib & Penanganan Galat (Anti-Slop R-27)
- **Memuat**: Indikator pemuatan jelas beserta teks konteks pada daftar janji dokter, daftar pengajuan, inbox admin, dan riwayat log.
- **Kosong**: Teks jujur tanpa angka fiktif, misalnya `"Belum ada janji pada rentang ini."` untuk dokter dan `"Tidak ada pengajuan yang menunggu."` untuk inbox admin.
- **Gagal & Konflik**: Pesan ringkas disertai tombol `Coba lagi` untuk galat jaringan (`"Gagal memuat data. Coba lagi."`), pesan konflik 409 (`"Pengajuan ini sudah ditindak oleh admin lain. Muat ulang untuk melihat hasilnya."`), serta pesan batas waktu 422 (`"Batas pengajuan sudah lewat. Hubungi admin secara langsung."`).
