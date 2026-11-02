<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class FoundationTest extends TestCase
{
    /**
     * Uji fondasi bahwa runtime PHP dan perhitungan tanggal siap.
     */
    public function test_runtime_php_dan_perhitungan_dasar_bekerja(): void
    {
        $this->assertIsString(phpversion());
        $this->assertTrue(version_compare(phpversion(), '8.3.0', '>='));
    }

    /**
     * Uji ekstensi penting terpasang.
     */
    public function test_ekstensi_php_penting_tersedia(): void
    {
        $this->assertTrue(extension_loaded('pdo_pgsql'), 'Ekstensi pdo_pgsql harus terpasang.');
        $this->assertTrue(extension_loaded('mbstring'), 'Ekstensi mbstring harus terpasang.');
        $this->assertTrue(extension_loaded('openssl'), 'Ekstensi openssl harus terpasang.');
    }
}
