<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class LayoutTest extends TestCase
{
    /**
     * Uji halaman beranda memuat kerangka dasar HTML5, skip-link, dan tipografi bahasa Indonesia.
     */
    public function test_halaman_beranda_memuat_layout_aksesibel_dan_skip_link(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertSee('<html lang="id">', false);
        $response->assertSee('class="skip-link"', false);
        $response->assertSee('href="#main-content"', false);
        $response->assertSee('id="main-content"', false);
        $response->assertSee('Newsreader', false);
        $response->assertSee('Plus+Jakarta+Sans', false);
    }

    /**
     * Uji dasbor pasien memuat layout pasien dengan identitas pengguna dan navigasi yang benar.
     */
    public function test_dasbor_pasien_memuat_layout_pasien_dengan_identitas_pengguna(): void
    {
        $pasien = User::factory()->create([
            'name' => 'Budi Sudarsono',
            'role' => 'pasien',
        ]);

        $response = $this->actingAs($pasien)->get('/beranda');

        $response->assertStatus(200);
        $response->assertSee('Budi Sudarsono');
        $response->assertSee('Pasien');
        $response->assertSee('Keluar');
        $response->assertSee('/keluar');
        $response->assertSee('Tidak Ada Jadwal Hari Ini');
    }

    /**
     * Uji dasbor admin memuat layout admin operasional dengan badge dan navigasi admin.
     */
    public function test_dasbor_admin_memuat_layout_admin_operasional(): void
    {
        $admin = User::factory()->admin()->create([
            'name' => 'Staf Loket Satu',
        ]);

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertStatus(200);
        $response->assertSee('Staf Loket Satu');
        $response->assertSee('Admin');
        $response->assertSee('Dasbor Operasional');
        $response->assertSee('Keluar');
    }

    /**
     * Uji formulir autentikasi memiliki label terhubung (id & for) untuk aksesibilitas pembaca layar (screen reader).
     */
    public function test_formulir_autentikasi_memiliki_label_terhubung_untuk_aksesibilitas(): void
    {
        // 1. Form Masuk
        $loginResponse = $this->get('/masuk');
        $loginResponse->assertStatus(200);
        $loginResponse->assertSee('for="email"', false);
        $loginResponse->assertSee('id="email"', false);
        $loginResponse->assertSee('for="password"', false);
        $loginResponse->assertSee('id="password"', false);

        // 2. Form Daftar
        $registerResponse = $this->get('/daftar');
        $registerResponse->assertStatus(200);
        $registerResponse->assertSee('for="name"', false);
        $registerResponse->assertSee('id="name"', false);
        $registerResponse->assertSee('for="password_confirmation"', false);
        $registerResponse->assertSee('id="password_confirmation"', false);
    }
}
