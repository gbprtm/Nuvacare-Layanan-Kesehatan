# Eksekusi migrasi: rencana relatif 10 hari

Ruang lingkup sesi penyusunan ini hanya dokumentasi/arsip, **bukan scaffold
Laravel**. Rencana implementasi terperinci: [`rencana-agen.md`](rencana-agen.md).
Status hidup: [`status-tugas.md`](status-tugas.md). Peta produk/kode:
[`peta-bagian.md`](peta-bagian.md).

## Keputusan dan sumber kebenaran

Pemilik menyetujui Laravel + Blade HTML + CSS biasa + JavaScript vanilla;
PostgreSQL Neon tetap, Eloquent menggantikan Drizzle, validasi Laravel
menggantikan Zod, PHPUnit (bukan Pest), Pint dan Playwright **Google Chrome**.
Vite hanya membangun CSS/JS biasa. Tidak ada starter kit, React atau Tailwind.
Penyimpangan teknis terhadap rancangan lama dijelaskan dalam
`docs/keputusan/0002-migrasi-laravel.md`; migrasi bukan izin mengubah aturan produk.

`docs/rancangan/**` dan `C:\Users\HYPE AMD\Documents\brain-project` tetap
**read-only**, tidak dipindah, tidak disunting dan tidak disinkronkan balik.
PRD/wireframe tetap sumber kebutuhan produk. Rencana teknis aktif ada di
`docs/rencana-agen.md`, bukan salinan rencana Next.js di `docs/rancangan/`.

Snapshot dokumentasi Next.js, termasuk perubahan status yang belum di-commit,
tersimpan di `_arsip/nextjs-2026-11-02/docs/`. Pemindahan kode/uji/konfigurasi
lama adalah pekerjaan pengarsipan terpisah; keberadaan snapshot bukan bukti
implementasi Laravel. Jangan menghapus perubahan lokal atau mengimpor status
`done` Next.js sebagai hasil uji Laravel. Tidak ada commit dalam sesi ini.

## Titik mulai dan kalender

- PHP dan Composer tidak ditemukan di PATH pada pemeriksaan sebelumnya.
  Node 22/npm 10 tersedia; itu tidak cukup untuk menjalankan Laravel.
  Belum ada `composer.json` atau `artisan` saat rencana ini dibuat.
- Semua L01–L17 dimulai `todo`. Bila percobaan L01 masih gagal menemukan
  prasyarat, catat `blocked` dan kebutuhan runtime, jangan scaffold palsu.
- **Hari 1–10 relatif** terhadap tanggal mulai yang dikonfirmasi pemilik.
  PRD menyebut hosting 2 November 2026, sedangkan permintaan baru memberi
  10 hari. Tanggal akhir kalender belum dikonfirmasi; jangan menyatakan
  tenggat lama otomatis bergeser atau menjanjikan tanggal rilis baru.
- Ini target kerja padat, bukan kepastian durasi. Hambatan hosting, runtime,
  data atau keputusan produk memicu perencanaan ulang, bukan pengurangan uji.
  Ajak penguji UAT sejak hari 1, minta keputusan ambang/TTL sejak hari 1.

## Urutan harian dan gerbang

Tabel ini target jadwal, **bukan status**. Dependensi lengkap di rencana agen.
Tugas yang menyentuh route/config/model/runner/status bersama dikerjakan
berurutan. Tidak menjanjikan paralel hanya untuk mengejar 10 hari.

| Hari relatif | Urutan kerja | Hasil/gerbang yang harus dibuktikan |
|---|---|---|
| 1 | L01, mulai L02 setelah L01 diterima | PHP/Composer/ekstensi, scaffold bersih terkontrol, CI, aset Vite; smoke URL hosting PHP publik awal. Undang UAT dan minta keputusan produk. |
| 2 | Selesaikan L02 → L03 → mulai L04 | **G-host awal:** URL HTTPS + aset + koneksi Neon terisolasi (L01), login/cookie/logout/halaman terproteksi (bukti parsial L04). Backup/restore dan mapping sebelum migrasi. Bila login belum dapat dibuktikan, gerbang gagal; eskalasi hari ini. |
| 3 | Selesaikan L04 → L05 → L06 | Auth/idle 15 menit, layout responsif dan audit transaksi diterima sebelum membuka mutasi admin. |
| 4 | L07 → L08 | Profil/obat laporan pasien terjaga dan dokter/slot/janji melalui UI; race PostgreSQL tepat satu berhasil. |
| 5 | L09 | Usulan, setuju/tolak/slot lain, expiry, pembatalan dan notifikasi beserta UI; keputusan TTL/cutoff terdokumentasi. |
| 6 | L10 → L11 | Kontrol anchor asli/reminder idempoten; check-in/nomor final/transisi/tutup hari dan hook kontrol tepat sekali. |
| 7 | L12 → L13 | Resep/kepatuhan dan kebiasaan/ringkasan wajib; ambang resmi disetujui dan teruji. |
| 8 | L14 → mulai L15 | Timeline tunggal; skenario UI lengkap dan matriks keamanan lintas fitur. |
| 9 | Selesaikan L15 → mulai L16 | Semua regresi hijau, uji beban dan UAT nyata, rehearsal rilis/rollback. |
| 10 | Selesaikan L16 | Izin cutover pemilik, deploy, rekonsiliasi data, smoke publik dan bukti rilis. Tanpa bukti lengkap tetap blocked, bukan done. |
| Setelah rilis inti | L17 hanya bila disetujui | FR-06/14 opsional lewat persetujuan rilis terpisah, tidak menunda atau memblokir L16. |

G-host boleh menggunakan bukti L04 yang masih `doing`; jangan melompati
`depends` L02/L03 atau menandai seluruh L04 selesai untuk memenuhi jadwal.
Hosting dipilih dan dicoba awal, bukan baru ditemukan tak mendukung PHP di
hari ke-10. Perlu scheduler yang benar-benar berjalan untuk expiry/reminder,
TLS Neon dan storage Laravel; Vercel lama tidak otomatis menjadi solusi.
Biaya Rp0 tetap kendala yang harus diverifikasi, bukan klaim paket terkini.

## Gerbang penerimaan implementasi

1. **G-fondasi (L01–L04):** runtime dan dependency lock benar, guard DB uji,
   backup/restore isolasi dan pemetaan legacy, auth serta smoke hosting awal.
2. **G-integritas (L06–L11):** audit atomik sebelum mutasi admin, race slot
   aktif/reservasi dengan koneksi PostgreSQL berbeda, nomor final unik WIB,
   retry tidak menggandakan kontrol/reminder. SQLite bukan bukti yang sah.
3. **G-produk (L07–L14):** lima fitur wajib FB-1–5, resep dan timeline tersedia
   lewat UI nyata, bukan endpoint saja. Profil, jadwal, janji, antrian dan
   kebiasaan **semuanya wajib**. Tidak memotong kebiasaan/ringkasannya demi waktu.
4. **G-rilis (L15–L16):** G global, skenario Chrome lengkap, security/IDOR,
   beban, UAT, backup, izin cutover dan URL produksi terbukti. FR-06/14 bukan
   prasyarat gerbang ini; audit admin FR-10 tetap wajib.

Setelah bootstrap, G global per tugas adalah:

```sh
composer validate --strict
vendor/bin/pint --test
php artisan test
npm ci && npm run build
```

Ini kontrak **perintah target**, belum tersedia/lulus saat dokumentasi disusun.
Tambahkan perintah spesifik class PHPUnit milik tugas dan Playwright skenario
fitur yang sudah dibangun sesuai `docs/rencana-agen.md`. L01 mengonfigurasi
`--project=chrome` dengan kanal Google Chrome. Jangan memakai hasil uji Vitest
lama sebagai bukti PHPUnit, atau menyatakan filter nol tes sebagai lulus.

## Keselamatan bootstrap dan data

- Root tidak kosong: generate Laravel di staging `_bootstrap/laravel/` dalam
  repo ini, inventaris, lalu salin hanya target yang disetujui. Lindungi `.git`, `.env`,
  `.agents`, `AGENTS.md`, `DESIGN.md`, `data/`, dokumentasi dan perubahan lokal.
  `.gitignore` digabung setelah dibaca, bukan ditimpa scaffold.
- L02 inventaris dan backup dahulu, restore ke branch Neon terisolasi,
  tetapkan reuse/adapt/transfer dan rollback. L03 baru membangun migrasi dan
  model. Default Laravel tidak boleh menimpa tabel `users`/`sessions` lama.
  Catat UUID, `password_hash`, enum/index/FK, sesi Next.js yang tidak kompatibel,
  dan constraint gabungan reservasi/janji. Tidak ada produksi dimutasi di L02/L03.
- Uji memakai database PostgreSQL dev/test terisolasi dan guard penolak
  produksi. Data fiktif tanpa NIK/KK; backup tidak masuk Git dan dilindungi.
  Jangan menyalin rahasia, password atau data sensitif ke bukti.
- Rilis produksi L16 perlu izin cutover eksplisit setelah rehearsal backup dan
  rollback; persetujuan migrasi stack bukan persetujuan menghapus data.

## Keputusan yang perlu dibuka sejak awal

| Keputusan/kebutuhan | Dampak bila belum tersedia |
|---|---|
| PHP/Composer/ekstensi dan hosting PHP dengan batas biaya yang diterima | L01 terhenti; G-host hari 2 gagal tanpa URL dan sesi nyata. |
| Akses read-only DB, branch dev/test dan backup/restore | L02 tidak dapat diterima, L03 tidak boleh dimulai. |
| Tanggal mulai/akhir 10 hari dan kesiapan penguji UAT | Jadwal kalender/rilis belum dapat dijanjikan; UAT tidak boleh direkayasa. |
| TTL reservasi, cutoff respons dan usulan dekat jadwal; mitigasi notifikasi in-app | Accept L09 terkait blocked sampai pemilik memutuskan. |
| Makna interval 30 hari vs contoh anchor kalender bulanan PRD | L10 perlu keputusan sebelum mengunci perhitungan dan uji. |
| Ambang resmi kebiasaan, satuan, sumber dan penilaian | Accept ringkasan L13 blocked; fitur tetap wajib. |
| Batas alergi saat check-in dan akses admin pada data sensitif | Pakai batas paling sempit PRD §4.4; jangan perluas tanpa izin. |

## Bukti dan status

`docs/status-tugas.md` satu-satunya status hidup. Rencana, peta, arsip dan
tabel harian tidak memelihara salinan status. Setiap tugas menulis
`docs/bukti/Lxx.md`: accept → tes, perintah/exit code/jumlah tes, runtime,
DB terisolasi tersamarkan, hasil UI dan hambatan. Jangan membuat bukti lulus
sebelum eksekusi. Commit hanya dengan izin pemilik, tidak otomatis.
