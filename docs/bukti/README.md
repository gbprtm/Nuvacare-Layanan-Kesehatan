# Bukti tahap

Setiap tahap di [status tugas](../status-tugas.md) punya satu berkas
`Tn.md` (misal `T1.md`). Isinya singkat dan faktual:

1. **Tahap dan tanggal.**
2. **Berkas yang diubah.**
3. **Perintah dan hasil aktual** — minimal `php artisan test` dan
   `vendor/bin/pint --test`. Tempel ringkasan keluaran, bukan klaim.
4. **Pemeriksaan browser** — halaman yang dibuka dan hasilnya.
5. **Kriteria selesai** dari RANCANGAN FINAL §5: terpenuhi atau tidak.
6. **Blocker** bila ada.

Jangan menulis rahasia (`.env`, token, kata sandi) di bukti. Perintah yang
gagal, dilewati, atau tidak menemukan tes tidak disebut lulus.
