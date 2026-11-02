# Database: pemetaan dan rencana migrasi Laravel

Tanggal: 2 November 2026. **Rancangan target Eloquent/PostgreSQL Neon, bukan skema Laravel terpasang atau hasil inspeksi database live.** Tidak ada koneksi, pembacaan env/secret, migrasi, seed, atau perubahan database pada pekerjaan dokumentasi ini.

## 1. Tiga hal yang tidak boleh disamakan

| Artefak | Arti | Bukan bukti |
|---|---|---|
| [Skema rinci arsip Next/Drizzle](../_arsip/nextjs-2026-11-02/docs/database-schema.md) | Dokumen lama 31 Oktober 2026: kolom, tipe, null/default, FK, enum, index dan riwayat migrasi | Kondisi aktual Neon saat ini |
| Dokumen ini | Kontrak pemetaan dan rencana target Laravel | DDL yang telah diterapkan |
| Inventaris L02 dan bukti L03 kelak | Hasil inspeksi berizin pada lingkungan yang disebutkan dan hasil migrasi terisolasi | Izin menghapus database lama/live |

**Skema lama rinci dipertahankan utuh sebagai referensi arsip**, bukan diganti dengan asumsi schema scaffold Laravel. Rujuk arsip §3–4 untuk tipe/enum, §5–7 untuk seluruh tabel/kolom, §8 untuk FK/on-delete, §9 untuk constraint, dan §10 untuk migrasi Drizzle. Pernyataan “saat ini” dalam arsip hanya berlaku pada dokumentasi kode saat arsip dibuat, bukan pada database live atau target Laravel.

Dokumentasi resmi yang diperiksa koordinator: [Laravel 13.x database](https://laravel.com/docs/13.x/database) dan [installation](https://laravel.com/docs/13.x/installation). Versi tepat dan driver/host kompatibel harus divalidasi serta dipatok di L01. PHP/Composer belum tersedia di PATH menurut inventaris migrasi; `artisan` dan `composer.json` belum ada. Contoh konfigurasi/operasi di sini hanya rencana.

## 2. Keputusan L02 wajib sebelum L03

Neon/PostgreSQL tetap dipakai. Memilih Eloquent **tidak** berarti membuat ulang database lama dengan default Laravel.

| Strategi yang harus dipilih | Cara aman | Syarat bukti |
|---|---|---|
| Baseline baru terisolasi | Buat database/branch test baru yang ditetapkan khusus, migrasi target baru, seed fiktif | Target benar-benar terisolasi; database lama tetap utuh; rencana pemindahan data terpisah jika nanti diperlukan |
| Adopsi skema lama | Inventaris berizin, petakan model, rekonsiliasi DDL dan riwayat migrasi, migrasi perubahan secara terkontrol | Backup dan restore drill terisolasi; perbedaan skema dicatat; review DDL/up/down sebelum dijalankan |

L02 mencatat inventaris tabel, index, enum, FK, migration history, kebutuhan retensi, data demo vs data lain, strategi sesi, dan target backup **tanpa menyalin isi data kesehatan/secret ke laporan**. Restore diuji ke target terisolasi, bukan menimpa database asal. Database test menggunakan kredensial dan penanda lingkungan berbeda; seed sintetis agar branch salinan data sensitif tidak dianggap fixture aman otomatis.

Keputusan baseline/adopsi dan persetujuan target wajib ada sebelum L03 menulis/menjalankan migrasi. Tidak ada keputusan tersirat bahwa semua tabel di bawah boleh di-drop atau semua data harus disalin.

**Dilarang pada database lama, existing, atau produksi:** `migrate:fresh`, `db:wipe`, `migrate:reset`, drop schema/table, reset destruktif, seed penimpa, dan pembersihan fixture massal. Jangan menjalankan scaffold/default migrations yang membuat `users`/`sessions` terhadap Neon lama. Bahkan test dengan trait reset database harus memiliki guard target PostgreSQL test terisolasi dan berhenti bila identitas target tidak cocok. Jangan mengandalkan nama environment `testing` saja.

Perintah migrasi biasa pun baru boleh dijalankan sesudah target, backup dan DDL disetujui. Koneksi TLS serta koneksi pooled/direct yang cocok untuk migrasi/locks ditetapkan L02; jangan mengubah URL lama atau menyalin secret untuk menyusun dokumen.

## 3. Inventaris arsip, bukan deklarasi kolom target/current live

Arsip mendeskripsikan **18 tabel**. Nama Indonesia dipertahankan di tabel inventaris ini agar dapat dicocokkan dengan arsip; nama class/property PHP target berbahasa Inggris dengan pemetaan eksplisit.

| Kelompok/tabel arsip | Kolom penting yang DIDOKUMENTASIKAN lama | Implikasi target | Pemilik model/migrasi fondasi |
|---|---|---|---|
| Auth: `users` | UUID `id`, `name`, `email`, `password_hash`, enum `role`, `created_at`, `updated_at` | Mapping auth UUID/password eksplisit; role server-side | L03, rancangan auth L04 |
| Auth: `sessions` | UUID `id`, `user_id`, `token_hash`, `expires_at`, `created_at` | **Tidak kompatibel langsung** dengan database session driver Laravel | L03, strategi L02/L04 |
| Klinik: `dokter` | UUID `id`, `nama`, `spesialisasi`, `nomor_izin`, `aktif`, timestamps | Model `Doctor`, bukan user login | L03 |
| Klinik: `slot` | `dokter_id`, `tanggal`, `jam_mulai`, `jam_selesai`, `kuota`, `tersedia`, `dikunci_sampai`, timestamps | Jangan anggap TTL sebagai lock; kuota lama bukan izin multi-pasien | L03 |
| Klinik: `janji` | `pasien_id`, `dokter_id`, `slot_id`, enum `status`, `keluhan`, `catatan`, `alasan_batal`, `dibatalkan_oleh`, timestamps | Model `Appointment`, state dan reservasi konsisten | L03 |
| Klinik: `usulan_perubahan` | `janji_id`, `slot_baru_id`, `alasan`, enum `status`, `batas_waktu_jawab`, `ttl_kunci_slot`, `dibuat_oleh`, timestamps | Model `RescheduleProposal`, perlu keputusan penyimpanan hasil alternatif | L03 |
| Klinik: `notifikasi` | `user_id`, `judul`, `pesan`, enum `tipe`, `dibaca`, JSONB `data_terkait`, `created_at` | In-app; referensi domain dan deduplikasi harus aman | L03 |
| Klinik: `audit_log` | `user_id`, `aksi`, `objek`, `objek_id`, JSONB before/after, `alasan`, `ip_address`, `created_at` | Tidak memiliki `updated_at`; bukan alasan mengklaim DB append-only | L03 |
| Klinik: `aturan_kontrol` | `pasien_id`, `dokter_id`, `interval_hari`, `tanggal_mulai`, `anchor_hari`, `aktif`, `catatan`, `dibuat_oleh`, timestamps | Ambiguitas 30 hari vs bulan belum diputuskan | L03 |
| Pasien: `profil` | `user_id`, `nik` nullable lama, kontak, lahir/kelamin, darah, tinggi/berat, `kondisi_kesehatan`, `riwayat_alergi`, kontak darurat, timestamps | Tidak kumpulkan/tampilkan NIK/KK; jangan ekspor kolom lama ke form | L03 |
| Pasien: `jadwal_kontrol` | `pasien_id`, `aturan_kontrol_id`, `dokter_id`, `tanggal_rencana`, enum `status`, `janji_id`, `catatan`, timestamps | Generator L10; satu hasil per periode/idempotency key yang disepakati | L03 |
| Pasien: `tiket_antrian` | `janji_id`, `pasien_id`, `tanggal`, `nomor_antrian_final`, enum `status`, waktu check-in/panggil/selesai, `alasan_koreksi`, timestamps | Nomor final setelah check-in, unik harian WIB | L03 |
| Pasien: `catatan_kebiasaan` | `pasien_id`, `tanggal`, `hidrasi_ml`, integer `jam_tidur`, `aktivitas_menit`, `catatan`, timestamps | Perlu unique pasien+tanggal dan keputusan presisi tidur/rentang | L03 |
| Pasien: `resep` | `pasien_id`, `janji_id`, `dokter_id`, `nomor_resep`, `diagnosis`, `catatan`, `dibuat_oleh`, `tanggal_resep`, timestamps | Catatan klinis admin, bukan laporan obat pasien; diagnosis bukan input target otomatis | L03 |
| Pasien: `obat` | `resep_id`, `nama_obat`, `dosis`, `aturan_pakai`, `frekuensi_per_hari`, `tanggal_mulai`, `tanggal_selesai`, `rujukan_fornas`, `keterangan`, `aktif`, timestamps | Resep klinis; tidak ada engine kondisi -> obat | L03 |
| Pasien: `catatan_minum_obat` | `pasien_id`, `obat_id`, `tanggal`, enum `status`, `waktu_minum`, `catatan`, timestamps | Catatan **harian**, bukan per dosis | L03 |
| Opsional: `log_aktivitas` | `user_id`, `jenis_aksi`, `objek`, `objek_id`, `keterangan`, `created_at` | Tanpa `updated_at`; implementasi rilis mengikuti keputusan L17 | L03 jika dipilih |
| Opsional: `konten_statis` | `slug`, `judul`, `ringkasan`, `isi`, `kategori`, `kondisi_terkait`, `url_sumber`, `tanggal_pengambilan`, `aktif`, timestamps | Sumber/peninjauan wajib jika dibangun | L03 jika dipilih |

Setiap tabel domain arsip mempunyai UUID `id`. Rincian null/default/FK tidak disalin sebagai DDL target; tetap ada pada arsip utuh. Keberadaan kolom dalam inventaris **bukan izin menerima field itu dari request**. Input target ada di [kontrak web](api-contract.md).

Enum arsip:

| Enum | Nilai lama terdokumentasi |
|---|---|
| `user_role` | `pasien`, `admin` |
| `status_janji` | `aktif`, `perubahan_diusulkan`, `dibatalkan`, `selesai`, `tidak_hadir` |
| `status_usulan` | `menunggu_tanggapan`, `disetujui`, `ditolak`, `kedaluwarsa` |
| `tipe_notifikasi` | `pengingat_janji`, `usulan_perubahan`, `pengingat_obat`, `antrian`, `sistem` |
| `status_antrian` | `belum_check_in`, `menunggu`, `diperiksa`, `selesai`, `tidak_hadir` |
| `status_jadwal_kontrol` | `terjadwal`, `selesai`, `terlewat`, `dibatalkan` |
| `jenis_kelamin` | `laki_laki`, `perempuan` |
| `status_minum_obat` | `sudah`, `belum` |

Tidak ada enum “menunggu konfirmasi admin” pada arsip, dan alur alternatif tidak membutuhkannya. Transisi target dan perubahan enum membutuhkan rancangan/migrasi/test, tidak cukup menambahkan string di controller.

## 4. Pemetaan Eloquent dan autentikasi

Semua path/class di bagian ini rencana. Untuk mengadopsi tabel lama:

- Tetapkan `$table`, primary key UUID, key type string dan non-incrementing. Jangan biarkan Eloquent mengasumsikan `doctors`, `appointments`, atau integer ID untuk tabel `dokter`/`janji` lama. Cara pembangkitan UUID (database atau aplikasi) dipilih eksplisit dan diuji konsisten pada FK.
- Model auth `User` mengimplementasikan kontrak auth Laravel dengan password column **`password_hash`**, melalui mapping/metode yang sesuai versi Laravel dipatok L01. Jangan mengasumsikan kolom `password` ada. Hash lama diverifikasi kompatibilitasnya secara aman sebelum adopsi; jangan menyalin hash/kredensial ke bukti.
- Batasi fillable/assignment, sembunyikan hash/token, cast enum role/status ke enum PHP yang cocok, boolean ke boolean, JSONB ke struktur yang ditetapkan, tanggal ke tanggal bisnis, timestamp ke immutable datetime bila dipilih.
- `created_at` dan `updated_at` eksplisit. Untuk `sessions`, `notifikasi`, `audit_log`, dan `log_aktivitas` arsip tidak ada `updated_at`: konfigurasi timestamp model agar tidak menulis kolom fiktif. Waktu audit tidak diterima dari client.
- Semua query pasien, relasi, route model binding dan agregasi harus mengikuti kepemilikan. Scope tidak boleh hanya pada daftar lalu detail mengambil objek tanpa policy. Admin memakai proyeksi minimal, bukan eager-load profil penuh/kebiasaan.
- Mapping input Inggris -> kolom lama antara lain `patient_id` -> `pasien_id`, `doctor_id` -> `dokter_id`, `appointment_id` -> `janji_id`, `name` -> `nama` pada dokter, `health_conditions` -> `kondisi_kesehatan`, `allergies` -> `riwayat_alergi`. Ini transformasi aplikasi, bukan deklarasi rename kolom telah terjadi.

### Sesi Laravel bukan tabel token lama

Arsip `sessions` menyimpan UUID + `token_hash` + `expires_at`. Driver sesi database Laravel memakai struktur payload/activity/session identifier yang berbeda; detail DDL persis mengikuti versi yang dipatok. Jangan menunjuk driver bawaan ke tabel itu atau menjalankan migrasi sesi default bernama sama.

L02/L04 harus memilih dan mendokumentasikan salah satu:

1. Tabel sesi Laravel **baru dan terisolasi**, nama dikonfigurasi khusus, FK user UUID yang kompatibel, dengan invalidasi/retensi yang disetujui; atau
2. Adapter/session handler eksplisit yang benar-benar memetakan schema token lama, termasuk persistensi, expiry, idle, rotasi dan pencabutan. Ini memerlukan test khusus, bukan klaim kompatibilitas otomatis.

Sesi lama tidak diterima sebagai sesi Laravel secara diam-diam. Rencana cutover menetapkan pencabutan dan login ulang. Cookie HttpOnly/Secure produksi/SameSite, regenerasi saat login dan invalidasi server-side saat logout/idle diuji. Store rate limit persisten/bersama juga harus tersedia; tabel cache/session scaffolding bukan izin menimpa tabel existing.

## 5. Perubahan target yang perlu dirancang, BELUM ada

| Kebutuhan target | Celah pada arsip | Rencana/keputusan sebelum migrasi |
|---|---|---|
| Obat laporan pasien (L07) | Tabel `resep`/`obat` hanya klinis | Rancang penyimpanan terpisah, misalnya tabel `patient_reported_medications` (nama kandidat, **belum ada**), relasi profil/pemilik, katalog opsional, catatan dan periode; tentukan aturan hapus profil |
| Katalog Fornas (L07) | Inventaris 18 tabel bukan inventaris seluruh katalog yang mungkin ditambahkan kemudian | Inventaris L02 atas artefak yang diizinkan; pilih format baca/import idempoten dan metadata sumber. Jangan menganggap kolom katalog sudah ada |
| Sumber resep (L12) | Arsip obat punya `rujukan_fornas`, belum mendokumentasikan tanggal pengambilan per item | Rancang metadata sumber/tanggal dan validasi tanpa mengubah data lama diam-diam |
| Klaim slot selama usulan (L08/L09) | Index lama hanya `janji.status = 'aktif'` | Pilih constraint/ledger reservasi atau strategi locks yang melindungi slot lama **dan** slot usulan secara menyeluruh; draft DDL dan race tests wajib |
| Hasil slot alternatif/pembatalan usulan (L09) | Tidak ada field alternatif/enum pembatalan khusus pada arsip | Tentukan penyimpanan hasil terminal + slot terpilih; jangan menambah konfirmasi admin |
| Idempotensi kontrol/pengingat (L10) | Index biasa tidak membuktikan satu jadwal/pengingat per periode | Tentukan unique/idempotency key, aturan pengganti terlewat, dan transaksi selesai -> jadwal berikutnya |
| Kebiasaan harian (L13) | Arsip hanya index biasa, `jam_tidur` integer | Tentukan unique pasien+tanggal, nullable/partial update, presisi dan constraint nilai sesuai acceptance |
| Append-only audit (L06) | Tidak ada updated_at/route ubah bukan proteksi database | Pilih jaminan aplikasi; jika perlu DB guarantee, privilege/trigger beserta test penolakan UPDATE/DELETE |

`data/fornas` di root **dipertahankan**. Excel/JSON publik adalah referensi yang perlu pemeriksaan sumber, lisensi, struktur, versi dan tanggal, bukan dump siap diimpor ke database lama. Tidak ada import atau perubahan katalog pada sesi ini. Katalog tidak memetakan penyakit ke obat; aplikasi tidak meresepkan.

## 6. Constraint dan transaksi yang wajib dibuktikan

### Janji/reservasi

Index arsip `janji_slot_aktif_unique_idx` pada `slot_id WHERE status = 'aktif'` tidak melindungi janji yang berstatus `perubahan_diusulkan`; tidak pula dengan sendirinya melindungi `usulan_perubahan.slot_baru_id`. `dikunci_sampai`/`ttl_kunci_slot` tidak mengunci row secara otomatis. Jangan menyatakan index lama memenuhi seluruh kebutuhan baru.

Target wajib melindungi dua klaim: slot lama tetap dimiliki saat pending, slot usulan tidak dapat dipesan pihak lain. Seluruh jalur booking, admin edit, jawaban, cancel, expiry menggunakan protokol transaksi/lock/constraint yang sama dengan urutan lock deterministik. Jangan memakai partial index berdasarkan jam `now()` untuk menganggap expiry otomatis menyelesaikan invariant.

Setuju, tolak, alternatif, cancel dan expiry masing-masing menyelesaikan state dan melepas klaim terkait secara atomik. Alternatif langsung memindahkan janji; kegagalan mengambil alternatif tidak melepas janji lama. Race TTL/jawaban dan retry hanya menghasilkan satu hasil terminal. Angka TTL dan batas jawab belum disahkan; kebijakan waktu beserta test acceptance-nya tetap terhalang sampai keputusan L09.

### Audit

Perubahan admin dan tepat satu audit per perubahan memakai koneksi/transaksi yang sama. Kegagalan insert audit membatalkan perubahan dan efek domain terkait. Uji injeksi kegagalan wajib; audit asynchronous tidak memenuhi atomicity ini. Tidak ada route ubah/hapus audit. Batch menghasilkan satu audit per objek yang benar-benar berubah, bukan duplikasi dari observer dan Action. Pembacaan alergi minimal perlu jejak akses terpisah sesuai keputusan privasi; bukan dalih menyimpan seluruh profil di audit.

### Antrean, kontrol dan catatan pasien

- `tiket_antrian.janji_id` unik; arsip juga mendokumentasikan unique partial `(tanggal, nomor_antrian_final)` ketika nomor final tidak null. Target mempertahankan invariant dan alokasi nomor serentak; satu hari memakai WIB.
- Nomor estimasi adalah turunan runtime, tidak perlu tabel nomor estimasi baru. Nomor final nullable sebelum check-in; estimasi tidak menjadi dasar panggilan.
- Selesai kunjungan dan jadwal berikutnya idempoten, dengan satu generator L10 dipanggil L11. Tidak ada dua pemilik pembentukan jadwal.
- FR-02 menyebut 7/14/30 hari tetapi contoh anchor bulanan. Pilih kebijakan sebelum migrasi/tes bergantung padanya dianggap final. Jika bulanan dipilih, 31 Jan -> 28/29 Feb -> 31 Mar, anchor tidak bergeser akibat clamp.
- `catatan_minum_obat_unique_idx` arsip: pasien+obat+tanggal. Target memperbarui satu catatan harian; tidak mengklaim pencatatan per dosis. Denominator kepatuhan perlu keputusan L12.
- Kebiasaan target unik pasien+tanggal; tidur 0/24/bukan angka ditolak menurut acceptance. Ringkasan/gap/ambang diuji, tetapi nilai ambang tidak dipilih oleh agen.
- FK/on-delete arsip tidak otomatis menjadi kebijakan retensi target. Penghapusan profil bukan penghapusan `users`, resep, kunjungan atau audit. Review cascade terhadap aturan retensi/privasi sebelum adopsi.

## 7. Rencana verifikasi aman

1. **L02:** keputusan tertulis baseline/adopsi, inventaris nonrahasia, backup dan restore drill pada target terisolasi; database lama tetap dipertahankan.
2. **L03:** migration plan per kelompok auth/sesi, klinik/reservasi/audit, pasien/obat laporan/katalog, dan fitur opsional; review urutan FK/enum serta strategi rollback non-destruktif. Seeds hanya data fiktif dan admin individual, idempoten.
3. **L04/L06–L14:** PHPUnit feature/integration memakai PostgreSQL terisolasi, bukan SQLite/mock untuk membuktikan concurrency/enum/index. Test discovery dan guard lingkungan dibangun sejak L01.
4. Bukti minimal: dua booking satu slot tepat satu sukses; slot lama dan usulan tak bisa direbut; expiry vs jawaban; rollback audit; check-in ganda/nomor unik; kunjungan selesai dua kali tanpa jadwal duplikat; obat harian upsert; round-trip profil/obat laporan; IDOR dan larangan admin kebiasaan.
5. Hasil mencantumkan commit, waktu, perintah, identitas lingkungan **nonrahasia**, dan kasus nyata yang dijalankan. Tidak ada URL koneksi, hash, cookie, payload kesehatan nyata atau password di bukti.

Belum ada database, schema Laravel, seed, PHPUnit, atau deployment yang diverifikasi pada sesi dokumentasi ini. Status implementasi hanya di [status-tugas.md](status-tugas.md), bukan diturunkan dari riwayat A10–A16 atau hasil uji Next lama.
