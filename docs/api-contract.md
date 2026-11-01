# Kontrak API v1

Status: draft untuk implementasi backend  
Versi: `v1`  
Tanggal: 31 Oktober 2026

Pembaruan kebijakan identitas: 1 November 2026

Dokumen ini menjadi kesepakatan nama endpoint, field request, bentuk respons,
role, dan galat sebelum backend serta frontend fitur dikerjakan. Endpoint di
bawah adalah kontrak yang direncanakan. Kontrak ini bukan bukti bahwa seluruh
Route Handler sudah tersedia.

## 1. Prinsip umum

- Base path: `/api`.
- Format request mutasi: `application/json`.
- ID resource: UUID sebagai string.
- Tanggal bisnis: `YYYY-MM-DD`, dihitung dalam `Asia/Jakarta`.
- Waktu bertimestamp: ISO 8601 dengan offset atau `Z`.
- Waktu tampilan klinik memakai WIB, tetapi server tetap menyimpan timestamp
  dengan zona waktu eksplisit.
- Bahasa pesan respons: Bahasa Indonesia.
- Sesi dibaca dari cookie `httpOnly`; token tidak dikirim melalui query string.
- Semua endpoint inti memeriksa sesi di server.
- Semua endpoint admin memeriksa sesi dan role `admin` di server.
- Semua mutasi memvalidasi body dengan skema Zod di server.
- Endpoint yang menerima ID resource wajib membatasi hasil berdasarkan role dan
  kepemilikan resource.
- Tidak ada endpoint login dokter karena dokter adalah data, bukan pengguna.

## 2. Bentuk respons baku

### 2.1 Sukses

Semua respons sukses menggunakan bentuk `{ data }`, sesuai helper A07.

```json
{
  "data": {
    "id": "uuid",
    "status": "aktif"
  }
}
```

Untuk daftar, `data` berisi hasil dan metadata pagination bila diperlukan:

```json
{
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

Status yang digunakan:

- `200 OK`: membaca atau memperbarui resource.
- `201 Created`: membuat resource baru.
- `204 No Content`: operasi berhasil tanpa payload, hanya bila memang tidak
  ada data yang perlu dikembalikan.

### 2.2 Galat

Semua galat menggunakan bentuk `{ error: { code, message, fields? } }`.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirimkan tidak valid.",
    "fields": {
      "alasan": ["Alasan wajib diisi."]
    }
  }
}
```

`fields` hanya dikirim saat galat berkaitan dengan field tertentu.

| HTTP | Code | Arti |
|---:|---|---|
| 400 | `BAD_REQUEST` | Request tidak dapat diproses secara umum |
| 401 | `UNAUTHORIZED` | Sesi tidak ada atau tidak valid |
| 403 | `FORBIDDEN` | Role atau kepemilikan tidak mengizinkan aksi |
| 404 | `NOT_FOUND` | Resource tidak ditemukan atau tidak terlihat oleh pemanggil |
| 409 | `CONFLICT` | Bentrok dengan keadaan data terkini |
| 422 | `VALIDATION_ERROR` | Body atau query gagal validasi Zod |
| 500 | `INTERNAL_ERROR` | Galat tak terduga di server |

Code domain yang digunakan di samping code umum:

- `INVALID_TRANSITION`
- `SLOT_ALREADY_BOOKED`
- `CHECK_IN_NOT_OPEN`
- `ALREADY_CHECKED_IN`
- `PROPOSAL_EXPIRED`
- `DUPLICATE_RESPONSE`
- `AUDIT_WRITE_FAILED`
- `SESSION_EXPIRED`

## 3. Konvensi query dan pagination

Endpoint daftar menggunakan parameter berikut bila relevan:

| Parameter | Tipe | Keterangan |
|---|---|---|
| `page` | integer positif | Nomor halaman, default `1` |
| `pageSize` | integer 1-100 | Ukuran halaman, default `20` |
| `from` | `YYYY-MM-DD` | Batas awal tanggal, inklusif |
| `to` | `YYYY-MM-DD` | Batas akhir tanggal, inklusif |
| `status` | enum | Filter status yang diizinkan endpoint |
| `q` | string | Pencarian yang sudah dinormalisasi |

Server tidak boleh menerima query yang menggabungkan SQL secara langsung.

## 4. Endpoint per FR

### FR-01 Profil kesehatan pasien

Role: `pasien` untuk resource miliknya sendiri.

Identitas akun mengikuti FR-07. NIK dan nomor Kartu Keluarga (KK) tidak
menjadi field request/response profil, syarat pembuatan profil, atau syarat
menggunakan fitur kesehatan. Payload mutasi profil harus menolak field di luar
kontrak, termasuk `nik` dan `kk`, melalui validasi Zod strict di server.
Kebijakan edit nama akun dibahas terpisah; penghapusan profil bukan penghapusan
akun atau kredensial login.

| Method | Path | Tujuan |
|---|---|---|
| `GET` | `/api/profil` | Membaca profil pasien yang sedang masuk |
| `PUT` | `/api/profil` | Membuat atau memperbarui profil milik sendiri |
| `DELETE` | `/api/profil` | Menghapus profil setelah konfirmasi |

#### `GET /api/profil`

Request body: tidak ada.

Sukses `200` juga menangkap daftar obat yang dilaporkan pasien pada field
`obat`. Pasien hanya dapat membaca daftar tersebut melalui profil; mutasi obat
pasien tidak disediakan sebagai endpoint pasien. Dosis dan frekuensi adalah
catatan pasien, bukan rekomendasi medis.

Sukses `200`:

```json
{
  "data": {
    "id": "uuid",
    "nama": "Budi Santoso",
    "nomorTelepon": "081200000001",
    "tanggalLahir": "1985-04-12",
    "jenisKelamin": "laki_laki",
    "golonganDarah": "O",
    "tinggiBadan": 170,
    "beratBadan": 72,
    "kondisiKesehatan": "hipertensi",
    "riwayatAlergi": "penisilin",
    "kontakDaruratNama": "Siti Santoso",
    "kontakDaruratTelepon": "081200000002",
    "updatedAt": "2026-10-31T04:00:00.000Z",
    "obat": [
      {
        "id": "uuid",
        "katalogObatFornasId": "uuid",
        "namaObat": "abakavir",
        "namaInternasional": "abacavir",
        "dosisCatatan": "Sesuai resep dokter",
        "frekuensiCatatan": "1 kali sehari",
        "mulaiPada": "2026-11-01",
        "selesaiPada": null,
        "catatan": null,
        "sumber": "dilaporkan_pasien"
      }
    ]
  }
}
```

Jika profil belum dibuat, endpoint mengembalikan `200` dengan `data: null`.

#### `PUT /api/profil`

Request:

```json
{
  "nomorTelepon": "081200000001",
  "tanggalLahir": "1985-04-12",
  "jenisKelamin": "laki_laki",
  "golonganDarah": "O",
  "tinggiBadan": 170,
  "beratBadan": 72,
  "kondisiKesehatan": "hipertensi",
  "riwayatAlergi": "penisilin",
  "kontakDaruratNama": "Siti Santoso",
  "kontakDaruratTelepon": "081200000002"
}
```

Sukses: `200` dengan bentuk profil yang tersimpan.

Galat:

- `401 UNAUTHORIZED` jika belum masuk.
- `422 VALIDATION_ERROR` jika tanggal, enum, atau angka tidak valid.

#### `DELETE /api/profil`

Request:

```json
{
  "konfirmasi": true
}
```

Sukses: `204`.

Galat:

- `401 UNAUTHORIZED` jika belum masuk.
- `422 VALIDATION_ERROR` jika `konfirmasi` bukan `true`.

### FR-02 Jadwal kontrol berulang dan pengingat

Role membaca: `pasien` untuk miliknya. Role menulis aturan: `admin`.

| Method | Path | Role | Tujuan |
|---|---|---|---|
| `GET` | `/api/jadwal-kontrol` | pasien | Daftar jadwal kontrol pasien |
| `POST` | `/api/admin/jadwal-kontrol` | admin | Membuat aturan kontrol dan jadwal awal |
| `PATCH` | `/api/admin/jadwal-kontrol/:id` | admin | Mengubah atau menonaktifkan aturan |
| `GET` | `/api/pengingat` | pasien | Membaca pengingat dalam aplikasi |
| `PATCH` | `/api/pengingat/:id/dibaca` | pasien | Menandai pengingat telah dibaca |

#### `GET /api/jadwal-kontrol`

Query opsional: `from`, `to`, `status`, `page`, `pageSize`.

Sukses: daftar agenda pasien dalam urutan tanggal menaik untuk agenda mendatang.
Setiap item minimal memiliki:

```json
{
  "id": "uuid",
  "tanggalRencana": "2026-11-28",
  "status": "terjadwal",
  "intervalHari": 30,
  "anchorHari": 31,
  "dokter": {
    "id": "uuid",
    "nama": "dr. Contoh",
    "spesialisasi": "Penyakit Dalam"
  },
  "janjiId": null
}
```

#### `POST /api/admin/jadwal-kontrol`

Request:

```json
{
  "pasienId": "uuid",
  "dokterId": "uuid",
  "intervalHari": 30,
  "tanggalMulai": "2026-01-31",
  "catatan": "Kontrol sesuai anjuran dokter"
}
```

`intervalHari` hanya menerima `7`, `14`, atau `30`. Tanggal berikutnya memakai
anchor tanggal asli dan di-clamp saat bulan tujuan lebih pendek.

Sukses: `201` dengan aturan dan jadwal pertama.

Galat:

- `403 FORBIDDEN` jika bukan admin.
- `404 NOT_FOUND` jika pasien atau dokter tidak ditemukan.
- `422 VALIDATION_ERROR` jika interval atau tanggal tidak valid.

#### `PATCH /api/admin/jadwal-kontrol/:id`

Request:

```json
{
  "aktif": false,
  "catatan": "Aturan dihentikan oleh klinik"
}
```

Sukses: `200` dengan aturan terbaru dan satu catatan audit.

#### `GET /api/pengingat`

Query: `dibaca`, `from`, `to`, `page`, `pageSize`.

Sukses: daftar notifikasi milik pasien yang masuk. Endpoint tidak mengirim
notifikasi push, email, atau WhatsApp.

#### `PATCH /api/pengingat/:id/dibaca`

Request body: tidak ada.

Sukses: `200` dengan:

```json
{
  "data": {
    "id": "uuid",
    "dibaca": true
  }
}
```

Pengguna tidak boleh menandai notifikasi pengguna lain.

### FR-03 Spesialis, slot, dan janji anti-bentrok

Role membaca dan membuat janji: `pasien`. Role mengelola dokter dan slot:
`admin`.

| Method | Path | Role | Tujuan |
|---|---|---|---|
| `GET` | `/api/dokter` | pasien, admin | Daftar dokter aktif dan filter spesialisasi |
| `GET` | `/api/slot` | pasien, admin | Daftar slot yang dapat dilihat |
| `POST` | `/api/janji` | pasien | Membuat janji secara atomik |
| `GET` | `/api/janji` | pasien, admin | Daftar janji sesuai batas akses |
| `GET` | `/api/janji/:id` | pasien, admin | Detail janji yang boleh dilihat |
| `PATCH` | `/api/janji/:id/batal` | pasien, admin | Membatalkan janji sesuai aturan |
| `POST` | `/api/admin/dokter` | admin | Membuat data dokter |
| `POST` | `/api/admin/slot` | admin | Membuat slot praktik |
| `PATCH` | `/api/admin/slot/:id` | admin | Mengubah slot praktik |

#### `GET /api/dokter`

Query: `spesialisasi`, `q`, `aktif`, `page`, `pageSize`.

Sukses: daftar dokter tanpa kredensial login dan tanpa data sensitif pasien.

#### `GET /api/slot`

Query wajib minimal: `tanggal`, opsional `dokterId`, `spesialisasi`, `tersedia`.

Sukses: daftar slot dengan `statusKetersediaan` yang dapat berupa
`tersedia`, `terisi`, atau `milik_sendiri`. Nomor estimasi, bila disediakan,
harus diberi label perkiraan dan tidak dianggap nomor panggilan final.

#### `POST /api/janji`

Request:

```json
{
  "slotId": "uuid",
  "keluhan": "Kontrol tekanan darah"
}
```

Sukses: `201` dengan janji, dokter, slot, dan nomor estimasi bila tersedia.

Galat:

- `401 UNAUTHORIZED` jika belum masuk.
- `404 NOT_FOUND` jika slot tidak ditemukan.
- `409 SLOT_ALREADY_BOOKED` jika janji aktif lain sudah mengambil slot.
- `422 VALIDATION_ERROR` jika request tidak valid.

Constraint database tetap menjadi pengaman terakhir untuk dua request serentak.

#### `GET /api/janji`

Query: `status`, `from`, `to`, `page`, `pageSize`.

Pasien hanya menerima janji miliknya. Admin menerima field operasional yang
diizinkan, bukan catatan kebiasaan atau ringkasan kepatuhan.

#### `GET /api/janji/:id`

Sukses: detail janji yang dapat dilihat pemanggil.
Jika ID valid tetapi milik pasien lain, gunakan `404 NOT_FOUND` agar tidak
membocorkan keberadaan resource.

#### `PATCH /api/janji/:id/batal`

Request pasien:

```json
{
  "alasan": "Ada keperluan lain"
}
```

Request admin wajib menyertakan alasan dan dapat menyertakan `dibatalkanOleh`
berdasarkan sesi server, bukan nilai dari client.

Sukses: `200` dengan janji berstatus `dibatalkan` dan notifikasi pasien jika
aksi dilakukan admin.

### FR-04 Antrean dan transisi status

Role check-in: `pasien`. Role status dan tutup hari: `admin`.

| Method | Path | Role | Tujuan |
|---|---|---|---|
| `GET` | `/api/antrian` | pasien, admin | Membaca antrean sesuai batas akses |
| `POST` | `/api/antrian/:janjiId/check-in` | pasien | Menerbitkan nomor final |
| `PATCH` | `/api/admin/antrian/:id/status` | admin | Mengubah status antrean |
| `POST` | `/api/admin/antrian/tutup-hari` | admin | Menandai pasien yang tidak hadir |

#### `GET /api/antrian`

Query pasien: `tanggal`, `janjiId`. Query admin: `tanggal`, `status`, `page`,
`pageSize`.

Sukses memuat `nomorAntrianFinal` hanya bila sudah diterbitkan. Nomor estimasi
adalah nilai turunan yang harus diberi label `perkiraan`.

#### `POST /api/antrian/:janjiId/check-in`

Request body: tidak ada.

Sukses: `200` dengan tiket:

```json
{
  "data": {
    "id": "uuid",
    "janjiId": "uuid",
    "tanggal": "2026-10-31",
    "nomorAntrianFinal": 14,
    "status": "menunggu",
    "waktuCheckIn": "2026-10-31T02:30:00.000Z"
  }
}
```

Galat:

- `403 FORBIDDEN` jika janji bukan milik pasien.
- `404 NOT_FOUND` jika janji tidak ditemukan.
- `409 ALREADY_CHECKED_IN` jika sudah check-in.
- `409 CHECK_IN_NOT_OPEN` jika di luar jendela check-in.
- `409` jika janji batal, selesai, atau tidak hadir.

#### `PATCH /api/admin/antrian/:id/status`

Request:

```json
{
  "status": "diperiksa",
  "alasanKoreksi": null
}
```

Status yang disimpan hanya:

- `belum_check_in`
- `menunggu`
- `diperiksa`
- `selesai`
- `tidak_hadir`

Transisi ilegal ditolak. Koreksi status yang mundur atau tidak normal wajib
menyertakan `alasanKoreksi`. Setiap perubahan berhasil menghasilkan tepat satu
audit log.

Sukses: `200` dengan tiket terbaru.

Galat:

- `403 FORBIDDEN` jika bukan admin.
- `404 NOT_FOUND` jika tiket tidak ditemukan.
- `409 INVALID_TRANSITION` jika transisi tidak diizinkan.
- `422 VALIDATION_ERROR` jika alasan wajib tetapi kosong.

#### `POST /api/admin/antrian/tutup-hari`

Request:

```json
{
  "tanggal": "2026-10-31"
}
```

Sukses: `200` dengan jumlah tiket yang ditandai `tidak_hadir`.
Operasi idempoten untuk tanggal yang sama.

### FR-05 Catatan kebiasaan dan ringkasan

Role: `pasien` untuk data miliknya sendiri. Admin tidak dapat mengakses endpoint
ini.

| Method | Path | Tujuan |
|---|---|---|
| `GET` | `/api/kebiasaan` | Membaca catatan harian |
| `PUT` | `/api/kebiasaan/:tanggal` | Membuat atau memperbarui catatan tanggal |
| `GET` | `/api/kebiasaan/ringkasan` | Membaca ringkasan kepatuhan |

#### `GET /api/kebiasaan`

Query: `from`, `to`, `page`, `pageSize`.

Sukses: catatan hidrasi, tidur, aktivitas, dan catatan tambahan milik pasien.

#### `PUT /api/kebiasaan/:tanggal`

Request:

```json
{
  "hidrasiMl": 1200,
  "jamTidur": 7,
  "aktivitasMenit": 30,
  "catatan": "Jalan pagi"
}
```

Sukses: `200` dengan catatan terbaru.

Validasi menolak jam tidur di luar rentang domain dan tanggal yang bukan format
`YYYY-MM-DD`.

#### `GET /api/kebiasaan/ringkasan`

Query wajib: `from`, `to`.

Sukses memuat jumlah hari tercatat, runtutan hari, dan penilaian terhadap
ambang yang sudah diputuskan. Endpoint tidak memberikan diagnosis atau saran
medis.

### FR-06 Panel konten statis terverifikasi

Status: fitur pelengkap, endpoint tetap dicatat untuk konsistensi kontrak.

| Method | Path | Role | Tujuan |
|---|---|---|---|
| `GET` | `/api/konten` | pasien | Membaca konten yang relevan dengan profil |
| `GET` | `/api/admin/konten` | admin | Meninjau metadata konten bila fitur dibangun |
| `POST` | `/api/admin/konten` | admin | Menambah konten bersumber resmi bila fitur dibangun |

#### `GET /api/konten`

Query: `kategori`, `kondisi`, `page`, `pageSize`.

Hanya konten dengan kondisi terkait yang tercatat pada profil pasien yang boleh
ditampilkan. Setiap item wajib memuat `urlSumber` dan `tanggalPengambilan`.

#### `POST /api/admin/konten`

Request:

```json
{
  "slug": "hipertensi-dasar",
  "judul": "Mengenal hipertensi",
  "isi": "Konten yang telah ditinjau.",
  "kategori": "hipertensi",
  "kondisiTerkait": "hipertensi",
  "urlSumber": "https://www.who.int/",
  "tanggalPengambilan": "2026-10-31"
}
```

Sumber yang diizinkan dan proses peninjauan harus diputuskan sebelum endpoint
ini diaktifkan.

### FR-07 Auth, sesi, dan dua role

Keputusan pemilik, 1 November 2026: login memakai email dan kata sandi saja.
NIK dan nomor Kartu Keluarga (KK) tidak dikumpulkan untuk autentikasi maupun
profil kesehatan. UUID tetap digunakan secara internal untuk kepemilikan data,
bukan nomor identitas kependudukan. Endpoint login hanya menerima `email` dan
`password`; field tambahan ditolak melalui validasi Zod strict.

Keputusan ini tidak menambahkan endpoint registrasi. Pemilik tugas registrasi,
field selain kredensial, dan perilaku setelah registrasi masih perlu ditetapkan.

| Method | Path | Role | Tujuan |
|---|---|---|---|
| `POST` | `/api/auth/masuk` | publik | Membuat sesi pasien/admin |
| `POST` | `/api/auth/keluar` | pengguna masuk | Menghapus sesi saat ini |
| `GET` | `/api/auth/saya` | pengguna masuk | Membaca identitas dan role sesi |

#### `POST /api/auth/masuk`

Request:

```json
{
  "email": "pasien@example.test",
  "password": "password-rahasia"
}
```

Sukses: `200` dengan identitas minimum. Token tidak dikembalikan dalam JSON;
session disimpan di cookie `httpOnly`.

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "nama": "Budi Santoso",
      "email": "pasien@example.test",
      "role": "pasien"
    }
  }
}
```

Galat login tidak membedakan email tidak ditemukan dan password salah:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Email atau kata sandi tidak benar."
  }
}
```

#### `POST /api/auth/keluar`

Request body: tidak ada.

Sukses: `204`, cookie sesi dihapus atau dibuat kedaluwarsa.

#### `GET /api/auth/saya`

Sukses: identitas sesi aktif tanpa password atau token mentah.

Galat: `401 SESSION_EXPIRED` jika sesi tidak valid.

### FR-08 Pengelolaan admin dan usulan perubahan

Role: `admin` untuk membuat perubahan; `pasien` untuk merespons usulan.

| Method | Path | Role | Tujuan |
|---|---|---|---|
| `POST` | `/api/admin/janji/:id/usulan-perubahan` | admin | Mengusulkan slot baru dengan alasan |
| `POST` | `/api/admin/janji/:id/batal` | admin | Membatalkan janji dengan alasan |
| `GET` | `/api/usulan-perubahan` | pasien | Membaca usulan milik sendiri |
| `GET` | `/api/usulan-perubahan/:id` | pasien | Membaca detail usulan sendiri |

#### `POST /api/admin/janji/:id/usulan-perubahan`

Request:

```json
{
  "slotBaruId": "uuid",
  "alasan": "Dokter berhalangan pada jadwal semula",
  "batasWaktuJawab": "2026-11-02T10:00:00+07:00"
}
```

Server menghitung dan memvalidasi TTL kunci slot. Client tidak boleh
memperpanjang TTL melewati batas kebijakan.

Sukses: `201` dengan usulan, janji lama tetap aktif, dan slot baru terkunci
sesuai TTL. Satu aksi berhasil menghasilkan satu audit log dan satu notifikasi.

Galat:

- `403 FORBIDDEN` jika bukan admin.
- `404 NOT_FOUND` jika janji atau slot tidak ditemukan.
- `409 SLOT_ALREADY_BOOKED` jika slot tidak dapat dikunci.
- `422 VALIDATION_ERROR` jika alasan kosong.

#### `POST /api/admin/janji/:id/batal`

Request:

```json
{
  "alasan": "Dokter berhalangan dan tidak ada slot pengganti"
}
```

Sukses: `200` dengan janji dibatalkan, notifikasi pasien, dan audit log.

#### `GET /api/usulan-perubahan`

Query: `status`, `page`, `pageSize`.

Pasien hanya melihat usulan untuk janji miliknya.

#### `GET /api/usulan-perubahan/:id`

ID milik pasien lain dikembalikan sebagai `404 NOT_FOUND`.

### FR-09 Notifikasi dan tanggapan pasien

| Method | Path | Role | Tujuan |
|---|---|---|---|
| `POST` | `/api/usulan-perubahan/:id/setujui` | pasien | Menyetujui slot usulan |
| `POST` | `/api/usulan-perubahan/:id/tolak` | pasien | Menolak usulan |
| `POST` | `/api/usulan-perubahan/:id/pilih-slot` | pasien | Memilih slot alternatif |
| `GET` | `/api/notifikasi` | pasien | Membaca pusat notifikasi |
| `PATCH` | `/api/notifikasi/:id/dibaca` | pasien | Menandai notifikasi dibaca |

#### `POST /api/usulan-perubahan/:id/setujui`

Request body: tidak ada.

Sukses: `200` dengan usulan berstatus `disetujui` dan janji pada slot baru.
Operasi kedua kali ditolak dengan `409 DUPLICATE_RESPONSE`.

#### `POST /api/usulan-perubahan/:id/tolak`

Request opsional:

```json
{
  "alasan": "Tidak dapat hadir pada waktu tersebut"
}
```

Sukses: `200` dengan usulan `ditolak`, janji lama tetap aktif, dan slot usulan
dilepas.

#### `POST /api/usulan-perubahan/:id/pilih-slot`

Request:

```json
{
  "slotId": "uuid"
}
```

Sukses: `200` dengan usulan berstatus menunggu konfirmasi admin dan slot yang
dipilih. Slot tetap tunduk pada pencegahan bentrok.

Semua aksi respons memeriksa batas waktu. Usulan kedaluwarsa menghasilkan
`409 PROPOSAL_EXPIRED`.

### FR-10 Audit log tindakan admin

| Method | Path | Role | Tujuan |
|---|---|---|---|
| `GET` | `/api/admin/audit-log` | admin | Membaca audit log operasional |
| `GET` | `/api/audit-log/janji/:id` | pasien | Membaca perubahan janji miliknya |

Audit log dibuat oleh server dari konteks sesi dan nilai sebelum/sesudah.
Client tidak boleh mengirim `userId`, `createdAt`, atau nilai audit final sebagai
sumber kebenaran.

#### `GET /api/admin/audit-log`

Query: `aksi`, `objek`, `objekId`, `from`, `to`, `page`, `pageSize`.

Sukses: daftar log sesuai hak admin. Endpoint ini tidak menyediakan `POST`,
`PATCH`, atau `DELETE` untuk mengubah log.

#### `GET /api/audit-log/janji/:id`

Pasien hanya menerima perubahan pada janji miliknya. Nilai yang mengandung data
pasien lain harus disaring atau tidak dikembalikan.

### FR-11 Riwayat janji

FR-11 digabungkan ke timeline FR-13, tetapi endpoint alias ini dicatat agar
nama kebutuhan tetap dapat ditelusuri.

| Method | Path | Role | Tujuan |
|---|---|---|---|
| `GET` | `/api/riwayat/janji` | pasien | Membaca riwayat janji milik sendiri |

Query: `from`, `to`, `status`, `page`, `pageSize`.

Sukses: item janji yang sudah selesai, dibatalkan, atau tidak hadir. Data pasien
lain tidak pernah dikembalikan.

### FR-12 Resep dan kepatuhan minum obat

Role pencatatan resep: `admin`. Role membaca resep dan mencatat minum:
`pasien` untuk miliknya sendiri.

| Method | Path | Role | Tujuan |
|---|---|---|---|
| `GET` | `/api/obat` | pasien | Membaca resep dan obat sendiri |
| `POST` | `/api/admin/resep` | admin | Mencatat resep dokter |
| `GET` | `/api/admin/resep` | admin | Membaca resep untuk pekerjaan admin |
| `PUT` | `/api/obat/:obatId/catatan-harian/:tanggal` | pasien | Menyimpan status minum |
| `GET` | `/api/obat/kepatuhan` | pasien | Membaca ringkasan kepatuhan |

#### `GET /api/obat`

Sukses memuat nama obat, dosis, aturan pakai, periode, nama pencatat, dan
rujukan Fornas. Respons wajib menyertakan label:

```text
Catatan resep, bukan saran medis.
```

Pasien tidak mendapat endpoint untuk menambah atau mengubah resep.

#### `POST /api/admin/resep`

Request:

```json
{
  "pasienId": "uuid",
  "janjiId": "uuid",
  "dokterId": "uuid",
  "nomorResep": "RSP-2026-001",
  "tanggalResep": "2026-10-31",
  "catatan": "Sesuai resep dokter",
  "obat": [
    {
      "namaObat": "Contoh obat",
      "dosis": "500 mg",
      "aturanPakai": "1x sehari sesudah makan",
      "frekuensiPerHari": 1,
      "tanggalMulai": "2026-10-31",
      "tanggalSelesai": "2026-11-30",
      "rujukanFornas": "https://e-fornas.kemkes.go.id/"
    }
  ]
}
```

Sukses: `201` dengan resep dan obat yang tercatat. `dibuatOleh` berasal dari
sesi admin.

#### `PUT /api/obat/:obatId/catatan-harian/:tanggal`

Request:

```json
{
  "status": "sudah",
  "catatan": null
}
```

`status` menerima `sudah` atau `belum`. Operasi bersifat upsert untuk kombinasi
pasien, obat, dan tanggal. Sukses: `200` dengan catatan terbaru.

#### `GET /api/obat/kepatuhan`

Query wajib: `from`, `to`.

Sukses memuat jumlah dosis tercatat, jumlah `sudah`, jumlah `belum`, dan
persentase yang dihitung dari data nyata. Jika data belum cukup, respons harus
menyatakan data belum cukup, bukan membuat angka contoh.

### FR-13 Timeline kunjungan

| Method | Path | Role | Tujuan |
|---|---|---|---|
| `GET` | `/api/timeline` | pasien | Membaca timeline milik sendiri |
| `GET` | `/api/timeline/:id` | pasien | Membaca detail item milik sendiri |

#### `GET /api/timeline`

Query: `jenis`, `from`, `to`, `page`, `pageSize`.

Jenis item dapat berupa `janji`, `check_in`, `kunjungan`, `obat`, atau
`jadwal_kontrol`. Respons diurutkan terbaru dan tidak mencampur resource pasien
lain.

#### `GET /api/timeline/:id`

Sukses: detail item sesuai tipe dan kepemilikan pasien. ID milik pasien lain
menghasilkan `404 NOT_FOUND`.

### FR-14 Log aktivitas akun

Status: opsional dan kandidat pemotongan pertama sesuai status tugas.

| Method | Path | Role | Tujuan |
|---|---|---|---|
| `GET` | `/api/aktivitas` | pasien | Membaca aktivitas akun sendiri |

Query: `jenis`, `from`, `to`, `page`, `pageSize`.

Aktivitas minimal: masuk, keluar, membuat atau mengubah janji, check-in, dan
menandai obat. Tidak ada endpoint publik untuk mengubah atau menghapus log.

Jika FR-14 dipotong dari rilis, endpoint tidak boleh dimasukkan ke navigasi atau
kontrak implementasi aktif tanpa keputusan baru.

## 5. Aturan akses lintas role

| Kondisi | Hasil |
|---|---|
| Tamu mengakses endpoint inti | `401 UNAUTHORIZED` |
| Pasien mengakses endpoint admin | `403 FORBIDDEN` |
| Pasien meminta resource pasien lain | `404 NOT_FOUND` tanpa membocorkan keberadaan |
| Admin membuka catatan kebiasaan pasien | `403 FORBIDDEN` |
| Dokter mencoba login | Tidak ada endpoint dokter |
| Client mengirim role atau user ID berbeda dari sesi | Nilai diabaikan atau ditolak |
| Mutasi tanpa validasi Zod | Tidak boleh diimplementasikan |

## 6. Aturan audit

Operasi berikut wajib membuat tepat satu audit log jika berhasil:

- perubahan janji oleh admin;
- pembatalan janji oleh admin;
- pembuatan atau perubahan slot oleh admin;
- perubahan status antrean oleh admin;
- koreksi status dengan alasan;
- pembuatan atau perubahan aturan kontrol;
- pembuatan resep oleh admin;
- keputusan admin lain yang mengubah data domain.

Audit log minimal berisi:

```json
{
  "userId": "uuid-admin",
  "aksi": "ubah_status_antrian",
  "objek": "tiket_antrian",
  "objekId": "uuid",
  "nilaiSebelum": {
    "status": "menunggu"
  },
  "nilaiSesudah": {
    "status": "diperiksa"
  },
  "alasan": null,
  "createdAt": "2026-10-31T02:30:00.000Z"
}
```

Tidak ada endpoint aplikasi untuk mengubah atau menghapus audit log.

## 7. Ketentuan yang belum menjadi keputusan final

Hal berikut masih harus dikonfirmasi sebelum implementasi endpoint terkait:

- TTL kunci slot pada usulan perubahan: usulan saat ini 12 jam atau sampai 24
  jam sebelum jadwal lama, mana yang lebih dulu.
- Batas waktu pasien menjawab usulan perubahan.
- Apakah FR-06 benar-benar dibangun pada rilis ini.
- Apakah FR-14 dibangun atau dipotong.
- Nilai ambang ringkasan kebiasaan.
- Detail jendela check-in.

Endpoint yang bergantung pada keputusan terbuka harus memakai konfigurasi atau
status `draft`, bukan mengunci angka baru diam-diam di handler.

## 8. Traceability FR ke endpoint

| FR | Endpoint utama |
|---|---|
| FR-01 | `/api/profil` |
| FR-02 | `/api/jadwal-kontrol`, `/api/pengingat` |
| FR-03 | `/api/dokter`, `/api/slot`, `/api/janji` |
| FR-04 | `/api/antrian` |
| FR-05 | `/api/kebiasaan` |
| FR-06 | `/api/konten` |
| FR-07 | `/api/auth/masuk`, `/api/auth/keluar`, `/api/auth/saya` |
| FR-08 | `/api/admin/janji/:id/usulan-perubahan` |
| FR-09 | `/api/usulan-perubahan/:id/*`, `/api/notifikasi` |
| FR-10 | `/api/admin/audit-log`, `/api/audit-log/janji/:id` |
| FR-11 | `/api/riwayat/janji` |
| FR-12 | `/api/obat`, `/api/admin/resep` |
| FR-13 | `/api/timeline` |
| FR-14 | `/api/aktivitas` |

## 9. Kriteria penerimaan A15

- Setiap FR-01 sampai FR-14 memiliki minimal satu endpoint tertulis.
- Setiap endpoint mencantumkan method, path, role, request, respons, dan galat
  yang relevan.
- Respons sukses menggunakan `{ data }`.
- Respons galat menggunakan `{ error: { code, message, fields? } }`.
- Nama field menggunakan camelCase dan konsisten dengan domain TypeScript.
- Batas pasien, admin, dan resource milik sendiri tertulis.
- Endpoint dokter sebagai pengguna tidak dibuat.
