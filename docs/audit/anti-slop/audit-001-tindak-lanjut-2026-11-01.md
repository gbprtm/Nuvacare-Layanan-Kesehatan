# Tindak lanjut audit 001

Tanggal: 1 November 2026
Berkas yang diubah: `DESIGN.md` (ditulis ulang)
Dasar: `anti-slop/audit-001-2026-10-31.md`, ditambah `docs/rancangan/` (salinan vault) sebagai sumber kebenaran.

| # | Temuan | Status | Di mana |
|---|---|---|---|
| 1 | Dial dan Design Read | Diperbaiki, **menunggu persetujuan pemilik** (ENERGY 1 / RHYTHM 2 / MOTION 1) | §1 |
| 2 | Pola native | Diperbaiki: `dp`, biometrik, haptik, tarik-untuk-segarkan, simpan gambar, offline dikeluarkan atau diganti padanan web | §5, §8, §12, §18 |
| 3 | Kontras | Diperbaiki: `ink-3` dihapus, varian `*-ink` dan `line-strong` ditambah, tabel pasangan dihitung | §3 |
| 4 | Angka fiktif | Diperbaiki: aturan data, "Belum cukup data", statistik referensi dibuang | §1.2, §8 |
| 5 | Arah admin | Diperbaiki: keputusan dan elemen penentu per layar K1-K7 | §10 |
| 6 | Akses data dokter | Diperbaiki: klaim "dokter terkait" dan diagnosis dihapus; tabel akses | §15 |
| 7 | Status domain vs UI | Diperbaiki: tabel kontrak; "Dipanggil" ditunda | §17 |
| 8 | Kontrak waktu | Diperbaiki | §16 |
| 9 | Fitur lanjutan | Diperbaiki: label MVP, opsional, belum diputuskan, di luar rilis | §18 |
| 10 | Radius dan bayangan | Diperbaiki: radius 12 sebagai dasar, bayangan hanya 3 tempat | §5.3 |
| 11 | Pemuatan font | Diperbaiki | §4.1 |
| 12 | Acceptance per kontrol | Diperbaiki sebagian: tabel contoh untuk kontrol utama | §20.2 |

Tambahan dari frontend-design: motif identitas tunggal (kartu nomor antrian), lime dibatasi dua tempat, foto dan ilustrasi dibuang karena aset belum ada, emoji dan huruf kapital semua dibuang.

## Perlu keputusan pemilik

Lihat `DESIGN.md` §0: nama produk, jendela check-in, TTL, status "Dipanggil", ambang kebiasaan, data yang dilihat admin, pembatalan janji oleh pasien, interval polling, sapaan "kamu".

Dokumen vault yang tampak bertentangan satu sama lain dan tidak boleh saya ubah dari repo ini: `design/01-peta-alur.md` menyebut navigasi bawah 4 item, sedangkan label "Tiket antrian" dilarang di `04-state-dan-copy.md` tetapi dipakai pada tombol "Buka tiket". Wireframe K2 memuat kondisi dan obat, padahal PRD membatasi admin ke nama, jadwal, status, ringkasan alergi.

## Belum diverifikasi

Gerbang pengiriman antislop untuk UI: tidak ada UI yang dibangun, jadi R-35 (jalankan dan klik) tidak berlaku. Kontras baru dihitung dari nilai heks. Tidak ada tampilan browser yang diuji.
