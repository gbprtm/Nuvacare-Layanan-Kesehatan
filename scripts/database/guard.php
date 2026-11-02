<?php

/**
 * scripts/database/guard.php
 *
 * Verifikasi keamanan target sebelum menjalankan skrip database/migrasi.
 * Menolak eksekusi jika target terdeteksi sebagai produksi.
 */

require_once __DIR__.'/../../vendor/autoload.php';

use App\Support\DatabaseSafetyGuard;

$targetUrl = $argv[1] ?? getenv('DATABASE_URL') ?: getenv('DATABASE_URL_UNPOOLED');

if (! $targetUrl) {
    fwrite(STDERR, "Error: Parameter DATABASE_URL tidak diberikan.\n");
    exit(1);
}

try {
    DatabaseSafetyGuard::assertIsolatedTarget($targetUrl);

    $isDirect = DatabaseSafetyGuard::isDirectConnection($targetUrl);
    $hasTls = DatabaseSafetyGuard::enforcesTls($targetUrl);

    echo "[DATABASE SAFETY GUARD]: Target database terverifikasi terisolasi.\n";
    echo '  - Mode Koneksi: '.($isDirect ? 'DIRECT (unpooled - cocok untuk DDL/migrasi)' : 'POOLED (cocok untuk runtime web)')."\n";
    echo '  - Enkripsi TLS: '.($hasTls ? 'AKTIF (sslmode=require/verify)' : 'PERINGATAN: sslmode belum mewajibkan enkripsi')."\n";
    exit(0);
} catch (RuntimeException $e) {
    fwrite(STDERR, '[DATABASE SAFETY GUARD ERROR]: '.$e->getMessage()."\n");
    exit(2);
}
