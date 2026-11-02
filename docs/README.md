# Indeks Dokumentasi Proyek

Direktori `docs/` memuat seluruh dokumentasi aktif, bukti pengujian, laporan audit antarmuka, dan catatan keputusan arsitektur untuk **Sistem Informasi Janji Temu Klinik**.

## 1. Dokumen Aktif Utama

| Dokumen | Fungsi |
|---|---|
| **[RANCANGAN FINAL](RANCANGANFINAL.md)** | **Acuan utama (Master Reference):** fitur, arsitektur, skema 4 tabel inti, endpoint API, dan 5 tahapan pengerjaan (T1–T5). Tidak boleh diubah. |
| **[Catatan Implementasi](catatan-implementasi.md)** | Rincian teknis atas celah rancangan (akses tamu, registrasi mandiri, reset kata sandi, pengaturan status aktif dokter, aturan validasi endpoint, dan konfigurasi PostgreSQL Neon). |
| **[Arah Visual (`DESIGN.md`)](../DESIGN.md)** | Sistem desain, palet warna lolos kontras WCAG AA, tipografi `Inter`, komponen datar, dan aturan aksesibilitas halaman HTML di `public/`. |
| **[Status Tugas](status-tugas.md)** | Papan status tunggal pelaksanaan tahapan T1–T5. |
| **[Aturan Kerja Agen (`AGENTS.md`)](../AGENTS.md)** | Panduan kerja, batasan ruang lingkup, dan guardrail pengembangan. |

## 2. Bukti Pengujian Tahapan (`docs/bukti/`)

Setiap tahapan implementasi di [Status Tugas](status-tugas.md) memiliki laporan bukti pengujian di [`bukti/`](bukti/README.md):

- **[Bukti T1 — Fondasi & Database](bukti/T1.md):** Migrasi skema `klinik` di PostgreSQL Neon, model Eloquent, seeder, dan pengujian fondasi database.
- **[Bukti T2 — API Auth & Halaman Login HTML](bukti/T2.md):** Autentikasi Laravel Sanctum, registrasi pasien, lupa/reset kata sandi, dan halaman beranda/auth.
- **[Bukti T3 — Profil Pengguna](bukti/T3.md):** Endpoint `GET/PATCH /api/profil` (termasuk pembaruan kata sandi opsional) dan halaman `public/pasien/profil.html`.
- **[Bukti T4 — Janji Temu & Panel Admin](bukti/T4.md):** Pembuatan janji temu pasien, pengelolaan janji temu admin (filter tanggal/status/tipe, catatan dokter, pembatalan bentrok), serta pengelolaan master poliklinik & status aktif dokter.
- **[Bukti T5 — Riwayat Pemeriksaan & Jadwal Kontrol](bukti/T5.md):** Endpoint dan halaman riwayat pemeriksaan selesai serta jadwal kontrol rutin pasien.

## 3. Audit Kualitas Antarmuka (`docs/audit/anti-slop/`)

- **[Audit Anti-Slop 001](audit/anti-slop/audit-001-2026-11-02.md)** & **[Tindak Lanjut 001](audit/anti-slop/audit-001-tindak-lanjut-2026-11-02.md):** Audit awal aksesibilitas, kontras warna, sasaran sentuh mobile, dan penerapan font `Inter`.
- **[Audit & Tindak Lanjut 002](audit/anti-slop/audit-002-2026-11-02.md):** Penyelarasan penuh antarmuka dengan token [`DESIGN.md`](../DESIGN.md) dan **Vercel Web Interface Guidelines** (`web-design-guidelines`).

## 4. Catatan Keputusan Arsitektur (`docs/keputusan/`)

- **[ADR 0001 — Chrome Bawaan untuk Playwright](keputusan/0001-chrome-bawaan-playwright.md):** Konfigurasi uji browser opsional menggunakan Google Chrome sistem.
- **[ADR 0003 — RANCANGAN FINAL sebagai Acuan Tunggal](keputusan/0003-rancangan-final.md):** Keputusan penyederhanaan arsitektur ke HTML/CSS/JS murni + Laravel JSON API dengan 4 tabel bisnis utama.

## 5. Arsip Sejarah (`docs/rancangan/`)

- Direktori `rancangan/` berisi salinan *read-only* dari vault perencanaan awal (PRD v0.3, wireframe lama, dan rencana sebelum penyederhanaan).
- Seluruh isi `rancangan/` **telah digantikan oleh [RANCANGAN FINAL](RANCANGANFINAL.md)**, tidak mengatur implementasi saat ini, dan tidak boleh disunting.
