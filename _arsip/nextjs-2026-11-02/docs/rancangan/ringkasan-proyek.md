> **Salinan read-only.** Berkas ini disalin dari dokumen rancangan proyek pada 2026-10-25. Jangan diubah di repo ini; usulkan perubahan ke pemilik proyek.

# Apa yang ingin saya buat

Setiap bulan, seorang pasien hipertensi mendatangi klinik kecil yang sama. Di
sana tidak ada yang tahu ia pasien siapa sampai ia menyebut namanya, jadwal
kontrolnya ditulis di buku, dan nomor antriannya baru ia ketahui saat namanya
dipanggil. Kalau dokter berhalangan dan jadwalnya bergeser, kabar itu berhenti
di telepon klinik — atau tidak sampai sama sekali. Catatan kebiasaan hariannya
— berapa gelas air, berapa jam tidur — tidak pernah tersimpan di mana pun,
jadi tidak ada yang bisa dilihat perkembangannya.

Yang ingin saya buat bukan aplikasi kesehatan. Ia tidak mendiagnosis, tidak
menyarankan obat, tidak mengingatkan lewat WhatsApp, dan tidak tersambung ke
rekam medis mana pun. Ia mengurus satu hal yang hari ini dikerjakan dengan
kertas: siapa datang kapan, di slot siapa, dan dengan alasan apa jadwalnya
berubah.

Ada dua orang yang memakainya, dan pekerjaan mereka berbeda.

**Pasien** adalah orang yang datang ke klinik — pada cerita di atas, pasien
hipertensi berusia 40 sampai 65 tahun yang membuka web dari ponselnya. Yang ia
butuhkan sederhana: tahu kapan harus datang, bisa memesan waktu, tahu posisi
antriannya, dan bisa mencatat kebiasaannya tanpa berpikir keras. Ia tidak
pernah melihat data pasien lain, dan tidak pernah melihat layar admin.

**Admin** adalah staf klinik yang hari ini memegang buku jadwal. Ia yang
mengatur slot praktik dokter, memproses kedatangan pasien, mengubah status
antrian, dan — bagian yang paling sering dipertanyakan dosen — mengusulkan
perubahan jadwal atau membatalkan janji. Setiap tindakannya wajib beralasan dan
tercatat. Ia tidak boleh membuka catatan kebiasaan pasien: untuk pekerjaannya
ia hanya perlu nama, jadwal, status, dan ringkasan alergi.

Satu hal yang sering disalahpahami: **dokter bukan pengguna aplikasi**. Dokter
hadir sebagai data — nama, spesialisasi, dan slot praktik — yang diisi admin.
Tidak ada login dokter, tidak ada dasbor dokter, tidak ada resep elektronik.
Keputusan medis tetap di luar aplikasi.

## Ini tugas mata kuliah, dan itu menjelaskan banyak hal

Aplikasi ini bukan produk yang akan dijual. Ia tugas mata kuliah Implementasi
dan Pengujian Perangkat Lunak: satu kelompok, tema kesehatan, lima fitur wajib
dan satu fitur pelengkap, dengan tenggat **hosting harus hidup pada 2 November
2026**.

Yang dinilai bukan hanya aplikasinya jadi. Hampir separuh nilainya — 45 persen —
ada pada bukti bahwa aturan-aturannya benar-benar bekerja: uji unit per fitur,
uji alur ujung ke ujung, uji keamanan, uji beban ringan, dan uji penerimaan oleh
pengguna di luar tim. Karena itu nanti akan sering muncul kalimat seperti "satu
slot hanya boleh dipakai satu pasien". Kalimat semacam itu bukan janji
pemasaran, melainkan hal yang harus ada bukti ujinya.

Satu masukan dosen membentuk hampir seluruh rancangan. Pada tema kesehatan
harus jelas bagaimana admin melihat dan mengubah jadwal, bagaimana pasien
menanggapi perubahan itu, dan bagaimana tindakan admin dapat
dipertanggungjawabkan. Tiga hal itulah yang membuat aplikasi ini punya peran
admin, alur usulan perubahan jadwal, dan audit log — bukan sekadar menambah
fitur.

## Yang bisa dilakukan pasien

1. **Mengisi profil kesehatannya** — kondisi yang dipantau (misalnya
   hipertensi), alergi, dan obat yang sedang diminum. Bisa diubah, dan bisa
   dihapus dengan konfirmasi.
2. **Melihat jadwal kontrol yang terbentuk sendiri** — admin mencatat anjuran
   dokter ("kontrol setiap 30 hari"), lalu jadwal berikutnya muncul otomatis.
   Pengingat muncul tiga hari sebelum jatuh tempo.
3. **Memilih spesialis dan jam praktik, lalu membuat janji** — satu slot hanya
   bisa dipakai satu pasien. Kalau dua orang menekan tombol hampir bersamaan,
   tepat satu berhasil dan yang lain diberi tahu dengan jelas.
4. **Check-in saat datang** — sebelum datang ia hanya melihat nomor perkiraan;
   setelah check-in barulah nomor antrian final terbit dan dipakai memanggil.
5. **Menanggapi perubahan jadwal dari klinik** — menyetujui, menolak, atau
   memilih slot lain. Janji lamanya tetap berlaku sampai ia menjawab.
6. **Mencatat kebiasaan harian** — hidrasi, jam tidur, dan aktivitas, lalu
   melihat ringkasan seberapa konsisten ia beberapa hari terakhir.
7. **Melihat obat yang diresepkan dan menandai sudah minum**, ditambah satu
   halaman riwayat yang menggabungkan janji, kunjungan, obat, dan jadwal
   berikutnya dalam satu urutan waktu.

Dua hal kecil yang sering disalahpahami. **Nomor perkiraan bukan urutan
panggilan** — ia hanya membantu pasien menebak kapan harus berangkat. Dan daftar
obat adalah **catatan resep, bukan saran medis**: aplikasi tidak pernah
memilihkan obat, dan setiap kartu obat membawa label itu.

## Yang bisa dilakukan admin

Pekerjaan admin berurutan, bukan sekadar kumpulan tombol. Ia mulai dengan
mengisi data dokter dan slot praktiknya. Pada hari kunjungan ia melihat janji
yang masuk, memproses kedatangan pasien, lalu menggerakkan status: menunggu,
diperiksa, selesai — atau tidak hadir bila pasien tidak datang sampai klinik
tutup. Kalau ia salah menekan status, koreksi hanya boleh dengan alasan, dan
alasannya ikut tercatat.

Di luar hari kunjungan, admin yang mengusulkan perubahan jadwal ketika dokter
berhalangan, atau membatalkan janji — keduanya wajib beralasan, dan pasien
mendapat pemberitahuan. Ia juga yang mencatat anjuran kontrol berulang dan
mencatat obat dari resep dokter.

Semua tindakan yang mengubah data masuk ke **audit log**: siapa, kapan, apa yang
diubah, nilai sebelum dan sesudah, dan alasannya. Log itu hanya bisa ditambah —
tidak ada tombol ubah atau hapus, bahkan untuk admin sendiri.

Batasnya tegas: admin tidak membuka catatan kebiasaan pasien. Untuk pekerjaannya
ia hanya perlu nama, jadwal, status, dan ringkasan alergi.

## Yang sengaja tidak dibuat

Daftar ini sama pentingnya dengan daftar fitur, karena di sinilah aplikasi
kesehatan biasanya melebar.

- **Rekomendasi atau saran medis** — tidak ada saran gaya hidup personal, tidak
  ada pemilihan obat.
- **Resep elektronik, farmasi, dan pembayaran** — aplikasi hanya mencatat apa
  yang sudah diresepkan dokter.
- **Notifikasi push, email, atau WhatsApp** — pemberitahuan hanya tampil di
  dalam aplikasi.
- **Integrasi SATUSEHAT atau rekam medis mana pun** — disebut hanya sebagai
  rencana pengembangan lanjutan di presentasi.
- **Aplikasi mobile native** — bentuknya website di browser.
- **Login dokter** — dokter adalah data, bukan pengguna.
- **Reset kata sandi, verifikasi email, login pihak ketiga, dan pendaftaran
  admin sendiri** — akun admin dibuat lewat seed.
- **Panel konten statis dan log aktivitas akun** — dua fitur paling akhir
  prioritasnya, dan yang pertama dipotong bila waktu habis.

## Bagaimana dibangun, dan kenapa tanpa biaya

| Bagian | Pilihan |
|---|---|
| Kerangka aplikasi | Next.js (App Router) — halaman dan API dalam satu proyek |
| Bahasa | TypeScript |
| Database | PostgreSQL |
| Akses database | Drizzle ORM |
| Validasi | zod |
| Sesi pengguna | cookie httpOnly + token bertanda tangan |
| Tampilan | Tailwind CSS |
| Pengujian | Vitest, Playwright (satu browser), autocannon untuk beban |
| Hosting aplikasi | Vercel Hobby |
| Database cloud | Neon Free |
| Total biaya | **Rp0** |

Tidak ada server terpisah: halaman dan endpoint API hidup di proyek yang sama.
Tidak ada layanan berbayar: Vercel Hobby gratis untuk proyek non-komersial, dan
Neon Free memberi 1 GB penyimpanan dengan batas keras — kalau kuota habis,
layanan berhenti sementara, bukan menagih.

Dua konsekuensi yang perlu diketahui sejak awal. Database Neon **tidur setelah
lima menit tanpa aktivitas** dan bangun sendiri saat dibuka, jadi permintaan
pertama setelah lama diam bisa terasa lambat — sebelum presentasi aplikasinya
dibuka sekali. Dan seluruh perhitungan tanggal memakai WIB; satu "hari" untuk
nomor antrian dan catatan harian mulai pukul 00.00 WIB.

## Yang sudah pasti dan yang masih terbuka

Yang sudah diputuskan dan tidak dibuka lagi: teknologi di atas, hosting gratis,
dua peran saja (pasien dan admin), dokter bukan pengguna, dan SATUSEHAT di luar
rilis ini.

| Yang belum diputuskan                                        | Usulan sementara                                                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Berapa lama slot dikunci saat admin mengusulkan perubahan    | 12 jam, atau sampai 24 jam sebelum jadwal lama — mana yang lebih dulu                                                    |
| Angka ambang batas kebiasaan (hidrasi, jam tidur, aktivitas) | Memakai rujukan resmi, ditetapkan paling lambat 28 Oktober                                                               |
| Apakah pemberitahuan di dalam aplikasi sudah cukup           | Diakui sebagai titik lemah; usulnya penanda "belum dibaca" untuk admin dan ringkasan "sejak terakhir masuk" untuk pasien |
| Data apa saja yang boleh dilihat admin                       | Nama, jadwal, status, ringkasan alergi — menunggu konfirmasi pembimbing                                                  |
| Bukti masalah masih sebatas pengamatan                       | Wawancara satu sampai dua orang sebelum 28 Oktober; kalau gagal, klaimnya diperlunak                                     |
| Panel konten statis perlu peninjau tenaga kesehatan          | Kalau tidak ada peninjau, fitur dipotong                                                                                 |

---

## Bacaan lanjutan

- [PRD v0.3 (kanonik)](prd-v0.3.md) — dokumen lengkap: 14 kebutuhan fungsional,
  kriteria terima, dan risiko
- [To-Do Eksekusi](to-do.md) — urutan pengerjaan dan gerbang
- [Wireframe pasien](design/02-wireframe-pasien.md) dan
  [Wireframe klinik](design/03-wireframe-klinik.md)
