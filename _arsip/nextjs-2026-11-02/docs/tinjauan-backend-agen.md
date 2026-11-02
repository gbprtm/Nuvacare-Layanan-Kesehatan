# Tinjauan kesiapan backend untuk agen

Tanggal tinjauan: 1 November 2026. Cakupan: B01–B13 dan fondasi yang dipakai.
Ini daftar tindak lanjut hasil inspeksi kode/dokumen, bukan izin memperluas
`paths`, perubahan PRD, atau bukti bahwa backend sudah selesai. Status resmi
setiap tugas tetap di [status-tugas.md](status-tugas.md).

## Prosedur sebelum implementasi

1. Baca baris tugas di status, detail `depends`/`paths`/`accept`/`verify` pada
   rencana agen, dan potongan PRD yang ditunjuk peta bagian.
   **Selesai bila:** dependensi tugas telah diverifikasi dan scope berkas jelas.
2. Cari ID tugas di tabel pemicu berikut. Baca hanya temuan yang dipicu, lalu
   periksa ulang sumber kode karena kondisi dapat berubah setelah tinjauan ini.
   **Selesai bila:** setiap temuan terkait diklasifikasikan masih berlaku atau
   sudah ditutup dengan rujukan bukti.
3. Untuk perubahan yang melampaui `paths`, ajukan daftar berkas dan alasan ke
   pemilik proyek. Perubahan rancangan dilakukan pemilik di vault lalu disinkron;
   salinan `docs/rancangan/` tetap read-only.
   **Selesai bila:** scope tambahan disetujui atau tugas dilaporkan terhalang.
4. Kerjakan satu tugas dalam scope yang disetujui, jalankan verifikasi, dan tulis
   hasil pada berkas `evidence` tugas. Ikuti aturan status dan commit di AGENTS.
   **Selesai bila:** setiap acceptance criterion memiliki bukti aktual; hal yang
   belum diuji disebutkan terpisah, termasuk kebutuhan akses database test.

## Pemicu bacaan

| Saat mengerjakan | Baca temuan |
|---|---|
| Kontrak A15 atau pembagian route backend | BE-03, BE-04, BE-06, BE-10 |
| B01 autentikasi | BE-01, BE-02, BE-06, BE-09 |
| B02 profil | BE-06 |
| B03 pemesanan | BE-03, BE-05, BE-09, BE-10 |
| B04 usulan, B05 tanggapan | BE-03, BE-04, BE-05, BE-07, BE-09 |
| B06 audit | BE-03, BE-07 |
| B07 antrean | BE-07, BE-09, BE-10 |
| B08 kontrol berulang | BE-03, BE-07, BE-08, BE-09 |
| B09 obat, B10 timeline | BE-03, BE-07, BE-10 |
| B11 kebiasaan | BE-09, BE-10 |
| B12/B13 opsional | BE-03, BE-10; konfirmasi keputusan rilis |

## Temuan dan kriteria penutupan

### BE-01 · Tinggi · Middleware memblokir login API publik

**Bukti:** `src/middleware.ts`, `PUBLIC_PATHS` dan cabang redirect tamu.
Pengecualian API saat ini hanya `/api/public`; `/api/auth/masuk` akan terkena
redirect tanpa sesi. API terproteksi juga belum dijamin mengembalikan JSON 401.

**Tindak lanjut:** bedakan autentikasi halaman dan API; izinkan route auth yang
memang publik. Guard handler tetap memeriksa sesi dan role. Perubahan middleware
memerlukan persetujuan scope karena berada di luar `paths` B01.

**Tutup bila:** request login tanpa cookie mencapai handler; endpoint inti tanpa
sesi menghasilkan JSON 401 sesuai A07; pasien ke endpoint admin menghasilkan
403; halaman terproteksi tetap mengarahkan tamu ke halaman masuk. Uji jalur
middleware bersama handler, bukan hanya memanggil fungsi guard secara langsung.

### BE-02 · Tinggi · Sesi belum dicabut di server

**Bukti:** `src/lib/session.ts`, `getSession`, `clearSessionCookie`,
`SESSION_MAX_AGE`; tabel `sessions` di `src/db/schema/auth.ts`.
Verifikasi saat ini hanya JWT; logout menghapus cookie, dan expiry tetap tujuh
hari belum membuktikan batas tidak aktif pada PRD §4.2.

**Tindak lanjut:** putuskan idle timeout dan batas percobaan login bersama
pemilik. Integrasikan sesi persisten/pencabutan dengan guard dan logout; validasi
payload sesi secara runtime. Semua konfigurasi rahasia tetap melalui env resmi.
Rate limit harus menjelaskan penyimpanan dan perilakunya pada instance Vercel
berbeda, bukan mengklaim jaminan lintas instance dari Map lokal.

**Tutup bila:** token yang disimpan sebelum logout ditolak setelah logout;
sesi kedaluwarsa dan melewati idle timeout ditolak; payload invalid ditolak;
percobaan login melewati batas menghasilkan penolakan terdokumentasi dan teruji.
Uji waktu memakai clock terkendali, bukan menunggu timeout sungguhan.

### BE-03 · Tinggi · Kontrak route melampaui pemilik tugas

**Bukti:** `docs/api-contract.md`, tabel endpoint; `rencana-agen.md`, `paths`
B03–B06, B08, B10, B13.

| Konflik | Kontrak sekarang | Scope tugas |
|---|---|---|
| B08 | `/api/jadwal-kontrol`, `/api/pengingat`, route admin | `/api/jadwal/**` |
| B06 | `/api/admin/audit-log`, audit janji pasien | `/api/admin/audit/**` |
| B04/B05 | `/api/usulan-perubahan/**` untuk pasien | route usulan admin/janji dan `/api/notifikasi/**` |
| B03 | dokter dan pengelolaan slot admin | `/api/slot/**`, `/api/janji/**` |
| B10 | `/api/riwayat/janji` | `/api/timeline/**` |
| B13 | pengelolaan konten admin | `/api/konten/**` |

**Tindak lanjut:** tentukan satu path dan satu tugas pemilik setiap endpoint,
termasuk GET/POST dokter, perubahan dokter, slot, tanggapan pasien, dan audit
janji pasien. FR-11 dapat ditelusuri ke timeline FR-13 tanpa menambah alias.
Pisahkan B04 sebagai pemilik transaksi tanggapan dan B05 sebagai penghubung
notifikasi, atau dokumentasikan pembagian lain yang disetujui.

**Tutup bila:** setiap endpoint aktif memiliki pemilik, `paths` yang disetujui,
role, request, response, dan galat; tidak ada aksi wajib tanpa pemilik atau
implementasi ganda. Simpan hasil endpoint di kontrak API, bukan menyalinnya ke
panduan ini.

### BE-04 · Tinggi · Slot alternatif salah menunggu konfirmasi admin

**Bukti:** `api-contract.md`, bagian FR-09 `pilih-slot`; PRD FR-08 acceptance
meminta janji langsung berpindah ke slot tersedia. `status_usulan` di
`src/db/schema/klinik.ts` tidak memiliki status menunggu konfirmasi admin.

**Tindak lanjut:** koreksi kontrak mengikuti PRD: jawaban memindahkan janji
secara atomik dan menyelesaikan usulan dengan status yang didukung. Definisikan
pelepasan slot lama, slot usulan, dan hasil jika slot pilihan direbut pihak lain.

**Tutup bila:** setuju, tolak, dan pilih-slot masing-masing memiliki test;
jawaban kedua ditolak; usulan kedaluwarsa ditolak; kegagalan perebutan slot
meninggalkan data konsisten tanpa perpindahan parsial.

### BE-05 · Tinggi · Index tidak melindungi slot lama selama usulan

**Bukti:** `src/db/schema/klinik.ts`, `janji_slot_aktif_unique_idx`, dan migrasi
`0003_keen_chamber.sql`. Predikat hanya `status = 'aktif'`, sedangkan PRD
mempertahankan slot lama saat status menjadi `perubahan_diusulkan`.

**Tindak lanjut:** sepakati strategi reservasi slot yang melindungi slot lama
dan slot usulan dalam transaksi. Perluas constraint/migrasi jika dipilih sebagai
pengaman. Kolom TTL sendiri bukan penguncian transaksi dan tidak otomatis
menghalangi pemesanan. Perubahan skema/migrasi memerlukan scope tambahan.

**Tutup bila:** PostgreSQL test menunjukkan janji lain tidak dapat mengambil
slot lama selama usulan; dua pemesan slot sama tepat satu berhasil; reservasi
usulan menghalangi pemesanan lain sampai dilepas; TTL dan tanggapan serentak
tidak menghasilkan dua penghuni atau kehilangan janji lama. Terapkan urutan
penguncian konsisten untuk mengurangi deadlock.

### BE-06 · Tinggi · Registrasi dan obat profil belum memiliki kontrak lengkap

**Bukti:** PRD US-01/FR-01; `api-contract.md`, FR-01/FR-07; `users` di
`auth.ts` dan `profil` di `pasien.ts`.

**Tindak lanjut:**

- Identitas: ikuti keputusan pemilik pada FR-07 di `api-contract.md`: login
  memakai email/password; NIK dan KK bukan data yang dikumpulkan. Kolom `nik`
  masih ada pada skema lama; keberadaannya bukan izin mengeksposnya lewat API.
  Penghapusan kolom dan penyesuaian seed memerlukan scope migrasi terpisah.
- Registrasi: tetapkan pemilik tugas, field selain kredensial bila diperlukan,
  respons email duplikat, dan apakah sesi langsung dibuat. Role registrasi
  publik selalu pasien; kebutuhan registrasi bukan bagian otomatis B02.
- Profil: pisahkan obat yang dilaporkan pasien dari catatan resep admin;
  sepakati field, penyimpanan, aturan required/nullable, dan kebijakan edit nama.
  Kontrak serta skema sekarang belum menyediakan daftar obat laporan pasien.
  Sebelum B02, minta persetujuan perubahan `src/db/schema/pasien.ts`,
  `src/db/migrations/**`, dan penemuan test profil di `vitest.db.config.ts`,
  selain `paths` tugas. Selesai bila kontrak dan persistensi dapat menyimpan
  kondisi, alergi, serta obat tanpa memakai tabel resep admin.

**Tutup bila:** registrasi dan role escalation diuji; kondisi, alergi, serta
obat profil dapat disimpan/dibaca kembali sesuai FR-01; penghapusan profil
memiliki hasil yang jelas; pasien tetap tidak dapat menambah resep dokter atau
mengakses profil pasien lain. Perubahan persistensi mengikuti scope disetujui.

### BE-07 · Tinggi · Mutasi admin dan audit harus atomik

**Bukti:** `src/modules/audit/audit.service.ts` menulis dengan `db` sendiri,
belum menerima transaksi pemanggil. B06 dijadwalkan setelah B04, tetapi B04 sudah
melakukan mutasi admin yang wajib diaudit. B07/B08 juga perlu handoff saat
kunjungan selesai memicu jadwal berikutnya.

**Tindak lanjut:** usulkan pekerjaan fondasi audit sebelum mutasi admin pertama,
atau perluasan scope yang disetujui. Helper menerima transaksi yang sama dengan
mutasi. Tetapkan pemilik pembuatan jadwal setelah selesai agar B07 dan B08 tidak
saling menggandakan pemanggilan. Route baca audit dapat dikerjakan terpisah.

**Tutup bila:** mutasi sukses menghasilkan tepat satu audit; audit gagal
membatalkan mutasi; mutasi ditolak tidak mengubah data; kunjungan selesai
menghasilkan satu jadwal berikutnya meski proses dipanggil ulang. Log hanya
memiliki operasi aplikasi yang sesuai PRD. Trigger append-only database adalah
penguatan terpisah yang memerlukan keputusan, bukan diasumsikan wajib oleh
kriteria tidak adanya endpoint ubah/hapus.

### BE-08 · Sedang · Perhitungan kontrol kehilangan anchor berulang

**Bukti:** `src/lib/waktu-wib.ts`, `addControlIntervalWib` memakai hari dari
input sebelumnya. Pemanggilan berulang menghasilkan 31 Jan → 28 Feb → 28 Mar,
bukan kembali ke 31 Mar seperti aturan anchor PRD FR-02.

**Tindak lanjut:** terima anchor asli atau hitung periode dari tanggal awal.
Pertahankan penambahan hari kalender umum sebagai operasi terpisah.

**Tutup bila:** test tahun biasa/kabisat mencakup minimal Jan–Apr, perpindahan
tahun, interval 7/14 hari, dan jam WIB tetap. Clamp bulan pendek tidak mengubah
anchor tersimpan.

### BE-09 · Tinggi · Runner integrasi database belum mencakup lokasi tugas

**Bukti:** `vitest.config.ts` mengecualikan `*.db.test.ts` dan memasang database
mock; `vitest.db.config.ts` hanya memasukkan `src/**/*.db.test.ts`.
Lokasi backend yang direncanakan adalah `tests/integration/**`.

**Tindak lanjut:** sepakati penamaan dan konfigurasi yang benar-benar menemukan
test PostgreSQL backend, dengan environment node dan database test terisolasi.
Unit test tetap dapat memakai mock; bukti concurrency/constraint memakai DB
sungguhan. Penyesuaian config perlu scope tambahan jika tugas tidak mengizinkan.

**Tutup bila:** perintah eksplisit menemukan test di lokasi tugas; output
menunjukkan skenario yang dijalankan; fixture dibersihkan; akses DB yang tidak
tersedia dilaporkan sebagai belum terverifikasi, bukan hasil hijau. Kredensial
hanya di env lokal/CI aman dan tidak dicetak. Verifikasi database live belum
dilakukan pada tinjauan ini; konfirmasi target test sebelum menjalankan mutasi.

### BE-10 · Sedang · Bentuk data dan perilaku kontrak belum lengkap

**Bukti:** `api-contract.md`, FR-03/04/05/09/12/13 dan rencana B11.
Sebagian endpoint hanya dijelaskan lewat prosa; perkiraan janji masih opsional;
CRUD kebiasaan belum memiliki DELETE. Catatan obat disimpan per hari, bukan per
dosis.

**Tindak lanjut:** lengkapi kontrak hanya untuk endpoint yang akan dibangun:

- Respons janji/antrean: field wajib nomor estimasi dan perkiraan jam pada
  konfirmasi, dibedakan dari nomor final.
- Notifikasi: referensi usulan, status dibaca, dan hasil tanggapan terdahulu.
- Timeline: discriminator jenis, ID stabil, timestamp, dan payload tiap jenis.
- Kebiasaan: operasi hapus, kepemilikan, hasil record hilang, dan pembaruan
  ringkasan; ambang perlu persetujuan sebelum penilaian diaktifkan.
- Obat: denominator kepatuhan mengikuti catatan harian yang tersedia. Jumlah
  dosis tidak boleh diklaim terukur tanpa model pencatatan per dosis.

**Tutup bila:** seluruh endpoint tugas memiliki schema request/response,
required/nullable field, pagination, dan contoh galat konsisten A07; test
memeriksa field kontrak dan penolakan akses lintas pasien.

## Urutan tindak lanjut

1. Tutup konflik kontrak dan persetujuan scope yang menghalangi B01–B03.
2. Kerjakan B01, lalu B02 dan B03 sesuai dependensi resmi.
3. Sebelum B04, siapkan fondasi transaksi audit dan reservasi yang disetujui.
4. Lanjutkan tugas turunan sesuai `depends`; baca temuan melalui tabel pemicu.
   B11 dapat dikerjakan setelah B02 bila keputusan ambang tersedia.
5. B12/B13 mengikuti keputusan rilis pemilik. A09 tetap membutuhkan bukti hosting
   dan login di hosting; keberhasilan B01 lokal saja tidak menutup A09.

Urutan ini rekomendasi perbaikan, bukan perubahan dependensi resmi. Gerbang
serah-terima pada rancangan tetap berlaku; bila bertentangan dengan kesiapan
per tugas, minta keputusan pemilik alih-alih menyatakan gerbang telah lulus.

## Format bukti penutupan temuan

Cantumkan di laporan tugas pemilik, tanpa membuat ledger status kedua:

```text
TEMUAN: BE-xx
KEPUTUSAN/SCOPE: rujukan persetujuan bila diperlukan
PERUBAHAN: berkas dan alasan
BUKTI: perintah, skenario, hasil aktual
SISA: keputusan atau verifikasi yang belum tersedia
```

Untuk penutupan administratif A14–A16, periksa ulang ringkasan status terhadap
tabel, metadata bukti, dan riwayat commit. Tinjauan menemukan ringkasan tertinggal
serta commit gabungan meskipun aturan meminta satu tugas satu commit. Catat
penyimpangan tanpa menulis ulang riwayat Git. A16 juga perlu verifikasi render
Mermaid aktual; pemeriksaan teks sintaks saja belum membuktikan render.

## Batas tinjauan

Sumber: inspeksi rencana B01–B13, kontrak API, skema, middleware, sesi,
service awal, util WIB, dan konfigurasi test. Service janji/antrean yang hanya
mengembalikan objek sukses belum dianggap mutasi selesai. Tinjauan tidak
menjalankan build, test, rendering Mermaid, atau inspeksi database live.
