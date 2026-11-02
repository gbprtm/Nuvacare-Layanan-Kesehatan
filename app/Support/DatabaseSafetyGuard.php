<?php

namespace App\Support;

use Illuminate\Support\Str;
use RuntimeException;

class DatabaseSafetyGuard
{
    /**
     * Kata kunci atau pola hostname yang mengindikasikan database produksi.
     */
    protected const PRODUCTION_KEYWORDS = [
        'prod',
        'production',
        'live',
        'main',
    ];

    /**
     * Kata kunci yang mengindikasikan database terisolasi untuk dev/test/staging.
     */
    protected const ISOLATED_KEYWORDS = [
        'test',
        'testing',
        'dev',
        'development',
        'staging',
        'preview',
        'isolated',
        'local',
    ];

    /**
     * Periksa apakah URL database aman untuk operasi migrasi / destruktif.
     * Mengembalikan true jika terverifikasi terisolasi, melempar exception jika tidak aman.
     *
     * @throws RuntimeException
     */
    public static function assertIsolatedTarget(?string $databaseUrl = null): bool
    {
        $url = $databaseUrl ?? config('database.connections.pgsql.url') ?? env('DATABASE_URL');

        if (empty($url)) {
            // Jika tidak ada URL dan koneksi default bukan database langsung (misal testing array/sqlite memory)
            if (app()->environment('testing')) {
                return true;
            }
            throw new RuntimeException('DATABASE_URL tidak dikonfigurasi. Operasi database dihentikan.');
        }

        $parsed = parse_url($url);
        $host = strtolower($parsed['host'] ?? '');
        $path = strtolower(ltrim($parsed['path'] ?? '', '/'));

        // Cek indikator produksi pada host atau database name
        foreach (self::PRODUCTION_KEYWORDS as $keyword) {
            // Pengecualian jika mengandung kata kunci isolated, misal "test-prod-mirror"
            $hasIsolatedKeyword = Str::contains($host, self::ISOLATED_KEYWORDS) || Str::contains($path, self::ISOLATED_KEYWORDS);

            if (! $hasIsolatedKeyword && (Str::contains($host, $keyword) || Str::contains($path, $keyword))) {
                throw new RuntimeException("BAHAYA: Target database terdeteksi sebagai lingkungan PRODUKSI ({$host}/{$path}). Dilarang melakukan operasi mutasi/skema!");
            }
        }

        return true;
    }

    /**
     * Validasi kecocokan hash password bcrypt lama terhadap implementasi PHP.
     */
    public static function verifyBcryptHash(string $plainPassword, string $hash): bool
    {
        return password_verify($plainPassword, $hash);
    }

    /**
     * Validasi apakah string koneksi menggunakan koneksi langsung (unpooled) untuk migrasi/DDL.
     */
    public static function isDirectConnection(string $url): bool
    {
        $parsed = parse_url($url);
        $host = strtolower($parsed['host'] ?? '');

        // Koneksi Neon: pooled URL mengandung '-pooler'
        return ! Str::contains($host, '-pooler');
    }

    /**
     * Validasi apakah string koneksi menggunakan koneksi pooled untuk runtime aplikasi.
     */
    public static function isPooledConnection(string $url): bool
    {
        return ! self::isDirectConnection($url);
    }

    /**
     * Validasi apakah URL atau opsi mewajibkan enkripsi TLS/SSL.
     */
    public static function enforcesTls(string $url): bool
    {
        $parsed = parse_url($url);
        parse_str($parsed['query'] ?? '', $query);

        $sslMode = strtolower($query['sslmode'] ?? '');

        return in_array($sslMode, ['require', 'verify-ca', 'verify-full'], true);
    }
}
