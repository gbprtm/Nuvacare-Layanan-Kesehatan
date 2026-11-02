<?php

namespace App\Console\Commands;

use App\Models\FornasCatalog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ImportMedicineCatalog extends Command
{
    /**
     * Nama dan tanda tangan perintah console.
     *
     * @var string
     */
    protected $signature = 'app:import-medicine-catalog {--file=data/fornas/2026-11-01-A.json : Jalur berkas JSON snapshot Fornas}';

    /**
     * Deskripsi perintah console.
     *
     * @var string
     */
    protected $description = 'Mengimpor katalog referensi obat Formularium Nasional (Fornas) dengan pencatatan metadata snapshot';

    /**
     * Eksekusi perintah console.
     */
    public function handle(): int
    {
        $filePath = base_path($this->option('file'));

        if (! File::exists($filePath)) {
            $this->error("Berkas snapshot Fornas tidak ditemukan di: {$filePath}");

            return self::FAILURE;
        }

        $content = File::get($filePath);
        $data = json_decode($content, true);

        if (! is_array($data)) {
            $this->error('Format data JSON snapshot Fornas tidak valid.');

            return self::FAILURE;
        }

        $this->info("Memulai impor katalog Fornas dari {$filePath} (".count($data).' entri)...');

        $imported = 0;
        foreach ($data as $item) {
            if (! is_array($item) || count($item) < 2) {
                continue;
            }

            $namaIndonesia = trim($item[0]);
            $namaInternasional = trim($item[1]);

            if ($namaIndonesia === '') {
                continue;
            }

            FornasCatalog::updateOrCreate(
                ['nama_indonesia' => $namaIndonesia],
                [
                    'id' => (string) Str::uuid(),
                    'nama_internasional' => $namaInternasional,
                    'sumber' => 'Formularium Nasional (Fornas) Kemenkes',
                    'sumber_url' => 'https://e-fornas.kemkes.go.id',
                    'versi_snapshot' => '2026-11-01-A',
                    'tanggal_snapshot' => '2026-11-01',
                    'cakupan_snapshot' => 'Parsial Huruf A (Bukan Katalog Lengkap)',
                    'aktif' => true,
                ]
            );

            $imported++;
        }

        $this->info("Berhasil mengimpor/memperbarui {$imported} entri katalog obat Fornas.");

        return self::SUCCESS;
    }
}
