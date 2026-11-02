<?php

namespace Tests\Feature;

use Tests\TestCase;

class FoundationTest extends TestCase
{
    /**
     * Uji halaman utama publik merespons dengan HTTP 200.
     */
    public function test_halaman_publik_beranda_dapat_diakses(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertSee('Layanan Kesehatan Personal');
    }

    /**
     * Uji endpoint health check aplikasi merespons HTTP 200.
     */
    public function test_health_check_endpoint_tersedia(): void
    {
        $response = $this->get('/up');

        $response->assertStatus(200);
    }

    /**
     * Uji konfigurasi zona waktu terdaftar sebagai Asia/Jakarta.
     */
    public function test_konfigurasi_zona_waktu_adalah_asia_jakarta(): void
    {
        $this->assertSame('Asia/Jakarta', config('app.timezone'));
    }
}
