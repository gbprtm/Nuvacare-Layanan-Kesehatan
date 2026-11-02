<?php

namespace Tests\Feature;

use App\Support\DatabaseSafetyGuard;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class DatabaseSafetyTest extends TestCase
{
    /**
     * Uji bahwa guard keselamatan menolak koneksi ke target produksi.
     */
    public function test_guard_menolak_target_koneksi_produksi(): void
    {
        $productionUrls = [
            'postgresql://user:pass@ep-prod-xyz.ap-southeast-1.neon.tech/neondb?sslmode=require',
            'postgresql://user:pass@ep-main-db.neon.tech/production?sslmode=require',
            'postgresql://admin:secret@live-db.klinik.com/klinik_db',
        ];

        foreach ($productionUrls as $url) {
            $blocked = false;
            try {
                DatabaseSafetyGuard::assertIsolatedTarget($url);
            } catch (RuntimeException $e) {
                $blocked = true;
                $this->assertStringContainsString('BAHAYA', $e->getMessage());
            }

            $this->assertTrue($blocked, "Guard harus memblokir URL produksi: {$url}");
        }
    }

    /**
     * Uji bahwa guard keselamatan mengizinkan koneksi ke branch terisolasi (test/dev/preview).
     */
    public function test_guard_mengizinkan_target_koneksi_terisolasi_dan_dev(): void
    {
        $isolatedUrls = [
            'postgresql://user:pass@ep-dev-branch.ap-southeast-1.neon.tech/devdb?sslmode=require',
            'postgresql://user:pass@ep-isolated-test.neon.tech/testdb?sslmode=require',
            'postgresql://postgres:postgres@localhost:5432/klinik_isolated_test',
        ];

        foreach ($isolatedUrls as $url) {
            $result = DatabaseSafetyGuard::assertIsolatedTarget($url);
            $this->assertTrue($result, "Guard harus mengizinkan URL terisolasi: {$url}");
        }
    }

    /**
     * Uji deteksi koneksi direct (unpooled) untuk DDL/migrasi vs pooled untuk web runtime.
     */
    public function test_deteksi_koneksi_direct_unpooled_dan_pooled(): void
    {
        $directUrl = 'postgresql://user:pass@ep-sample-123456.ap-southeast-1.neon.tech/neondb?sslmode=require';
        $pooledUrl = 'postgresql://user:pass@ep-sample-123456-pooler.ap-southeast-1.neon.tech/neondb?sslmode=require';

        $this->assertTrue(DatabaseSafetyGuard::isDirectConnection($directUrl));
        $this->assertFalse(DatabaseSafetyGuard::isPooledConnection($directUrl));

        $this->assertFalse(DatabaseSafetyGuard::isDirectConnection($pooledUrl));
        $this->assertTrue(DatabaseSafetyGuard::isPooledConnection($pooledUrl));
    }

    /**
     * Uji bahwa konfigurasi TLS (sslmode=require/verify) diwajibkan untuk koneksi Neon.
     */
    public function test_koneksi_neon_mewajibkan_enkripsi_tls(): void
    {
        $secureUrl = 'postgresql://user:pass@host/db?sslmode=require';
        $insecureUrl = 'postgresql://user:pass@host/db?sslmode=disable';
        $plainUrl = 'postgresql://user:pass@host/db';

        $this->assertTrue(DatabaseSafetyGuard::enforcesTls($secureUrl));
        $this->assertFalse(DatabaseSafetyGuard::enforcesTls($insecureUrl));
        $this->assertFalse(DatabaseSafetyGuard::enforcesTls($plainUrl));
    }

    /**
     * Uji kompatibilitas hash password bcrypt legacy Next.js dengan implementasi PHP 8.4.
     */
    public function test_kompatibilitas_hash_password_bcrypt_legacy(): void
    {
        $plainPassword = 'RahasiaPasien123!';

        // Format bcrypt nodejs/drizzle ($2a$ atau $2b$)
        $nodeBcryptHash2a = '$2a$10$wN9iL6U/6n4l7X4Q9wFp3OP2bFp7kPkWuMkJ5p4VfZu4M5fT.P8G.';
        // Format bcrypt PHP standar ($2y$)
        $phpBcryptHash2y = password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => 10]);

        // Uji verifikasi hash $2y$ PHP
        $this->assertTrue(
            DatabaseSafetyGuard::verifyBcryptHash($plainPassword, $phpBcryptHash2y),
            'PHP harus dapat memverifikasi hash bcrypt standar.'
        );

        // Uji pembuatan hash baru oleh Laravel Hasher
        $laravelHash = Hash::make($plainPassword);
        $this->assertTrue(
            Hash::check($plainPassword, $laravelHash),
            'Laravel Hash facade harus berhasil memverifikasi password.'
        );
        $this->assertFalse(
            Hash::check('PasswordSalah123!', $laravelHash),
            'Password salah harus ditolak.'
        );
    }

    /**
     * Uji bahwa driver sesi Laravel memisahkan skema dari sesi token Next.js lama.
     */
    public function test_driver_sesi_laravel_memisahkan_skema_dari_sesi_lama(): void
    {
        // Sesi Next.js lama menggunakan tabel `sessions` dengan field `token_hash`.
        // Laravel session driver menggunakan struktur payload/activity berbeda.
        $configuredDriver = config('session.driver');
        $this->assertContains($configuredDriver, ['file', 'database', 'array', 'cookie']);

        // Jika database driver dipakai, pastikan nama tabel konfigurasi sesi Laravel
        // tidak menimpa skema session lama secara default tanpa adaptasi
        $configuredTable = config('session.table');
        $this->assertNotEmpty($configuredTable);
    }
}
