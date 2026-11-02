# Web janji temu klinik

Aplikasi web untuk membuat janji temu pemeriksaan. **Pasien** membuat janji,
melihat riwayat pemeriksaan, jadwal kontrol, dan profil. **Admin** mengelola
poli dan dokter, menyelesaikan janji dengan catatan dokter, serta membuat
jadwal kontrol berikutnya.

Acuan utama: [RANCANGAN FINAL](docs/RANCANGANFINAL.md).

## Stack

- Laravel sebagai JSON API (`routes/api.php`) + Eloquent + PostgreSQL Neon.
- Frontend HTML, CSS, JavaScript murni di `public/` memakai `fetch()`.
- Uji: PHPUnit dan Pint.

## Keadaan saat ini

Kode di repo masih berisi implementasi Blade sebelumnya yang **belum**
sesuai RANCANGAN FINAL. Penyesuaian dilakukan bertahap T1–T5; lihat
[status tugas](docs/status-tugas.md).

## Menjalankan lokal

Prasyarat: PHP 8.4 (`pdo_pgsql`), Composer, akses database Neon terisolasi.

```powershell
composer install
php artisan migrate --seed   # hanya pada database terisolasi
php artisan serve
```

Buka `http://127.0.0.1:8000/login.html` (tersedia setelah Tahap 2).
Uji: `php artisan test` dan `vendor/bin/pint --test`.

## Dokumentasi

| Butuh | Buka |
|---|---|
| Kebutuhan, skema, endpoint, tahapan | [RANCANGAN FINAL](docs/RANCANGANFINAL.md) |
| Keputusan teknis kecil | [Catatan implementasi](docs/catatan-implementasi.md) |
| Tampilan | [DESIGN.md](DESIGN.md) |
| Status | [Status tugas](docs/status-tugas.md) |
| Aturan agen | [AGENTS.md](AGENTS.md) |
