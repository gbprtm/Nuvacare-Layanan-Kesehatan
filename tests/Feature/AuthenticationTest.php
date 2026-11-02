<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\WibClock;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    protected function tearDown(): void
    {
        WibClock::setTestNow(null);
        parent::tearDown();
    }

    /**
     * Uji halaman form masuk dapat dibuka oleh tamu (HTTP 200).
     */
    public function test_halaman_masuk_dapat_diakses_oleh_tamu(): void
    {
        $response = $this->get('/masuk');

        $response->assertStatus(200);
        $response->assertSee('Masuk');
        $response->assertSee('Alamat Email');
        $response->assertSee('Kata Sandi');
    }

    /**
     * Uji halaman pendaftaran pasien dapat dibuka oleh tamu (HTTP 200).
     */
    public function test_halaman_daftar_dapat_diakses_oleh_tamu(): void
    {
        $response = $this->get('/daftar');

        $response->assertStatus(200);
        $response->assertSee('Pendaftaran Pasien');
        $response->assertSee('Nama Lengkap');
        $response->assertSee('Konfirmasi Kata Sandi');
    }

    /**
     * Uji pasien dapat mendaftar dan perannya selalu disetel 'pasien' di server.
     */
    public function test_pasien_dapat_mendaftar_dan_role_selalu_pasien(): void
    {
        $email = 'pasien.baru.'.Str::random(6).'@example.com';

        // Mengirim role=admin dalam payload untuk menguji manipulasi peran
        $response = $this->post('/daftar', [
            'name' => 'Pasien Uji Coba',
            'email' => $email,
            'password' => 'PasswordAman123!',
            'password_confirmation' => 'PasswordAman123!',
            'role' => 'admin', // Harus diabaikan oleh server
        ]);

        $response->assertRedirect('/masuk');
        $response->assertSessionHas('status');

        $user = User::where('email', $email)->first();
        $this->assertNotNull($user);
        $this->assertSame('pasien', $user->role, 'Role pengguna harus selalu pasien.');
        $this->assertTrue(Hash::check('PasswordAman123!', $user->password_hash));
    }

    /**
     * Uji pendaftaran menolak kata sandi kurang dari 8 karakter.
     */
    public function test_pendaftaran_menolak_password_kurang_dari_8_karakter(): void
    {
        $response = $this->post('/daftar', [
            'name' => 'Pasien Uji',
            'email' => 'pendek@example.com',
            'password' => '1234567',
            'password_confirmation' => '1234567',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertNull(User::where('email', 'pendek@example.com')->first());
    }

    /**
     * Uji pendaftaran menolak email yang sudah terdaftar.
     */
    public function test_pendaftaran_menolak_email_duplikat(): void
    {
        $existing = User::factory()->create();

        $response = $this->post('/daftar', [
            'name' => 'Nama Lain',
            'email' => $existing->email,
            'password' => 'PasswordBaru123!',
            'password_confirmation' => 'PasswordBaru123!',
        ]);

        $response->assertSessionHasErrors('email');
    }

    /**
     * Uji pengguna dapat masuk dengan kredensial valid dan diarahkan sesuai peran.
     */
    public function test_pengguna_dapat_masuk_dan_diarahkan_ke_dashboard_sesuai_role(): void
    {
        $pasien = User::factory()->create([
            'password_hash' => Hash::make('PasswordBenar123!'),
            'role' => 'pasien',
        ]);

        $response = $this->post('/masuk', [
            'email' => $pasien->email,
            'password' => 'PasswordBenar123!',
        ]);

        $response->assertRedirect('/beranda');
        $this->assertAuthenticatedAs($pasien);

        // Uji login admin
        $admin = User::factory()->admin()->create([
            'password_hash' => Hash::make('AdminRahasia123!'),
        ]);

        $this->post('/keluar'); // Logout pasien dulu

        $adminResponse = $this->post('/masuk', [
            'email' => $admin->email,
            'password' => 'AdminRahasia123!',
        ]);

        $adminResponse->assertRedirect('/admin');
        $this->assertAuthenticatedAs($admin);
    }

    /**
     * Uji kesalahan masuk menampilkan pesan generik tanpa mengungkap informasi akun.
     */
    public function test_masuk_gagal_menampilkan_pesan_generik(): void
    {
        $response = $this->post('/masuk', [
            'email' => 'email.tidak.ada@example.com',
            'password' => 'KataSandiSalah123!',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    /**
     * Uji rate limiter membatasi percobaan masuk setelah 5 kali gagal.
     */
    public function test_rate_limiter_mengunci_setelah_percobaan_gagal(): void
    {
        $email = 'target.bruteforce@example.com';
        RateLimiter::clear(Str::transliterate(Str::lower($email).'|127.0.0.1'));

        for ($i = 0; $i < 5; $i++) {
            $this->post('/masuk', [
                'email' => $email,
                'password' => 'SalahTerus123!',
            ]);
        }

        // Percobaan ke-6 harus ditolak rate limiter
        $response = $this->post('/masuk', [
            'email' => $email,
            'password' => 'SalahTerus123!',
        ]);

        $response->assertSessionHasErrors('email');
        $errors = session('errors')->get('email');
        $this->assertStringContainsString('Terlalu banyak percobaan', $errors[0]);
    }

    /**
     * Uji pengguna dapat keluar dan sesi server diinvalidasi.
     */
    public function test_pengguna_dapat_keluar_dari_aplikasi(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/keluar');

        $response->assertRedirect('/masuk');
        $this->assertGuest();
    }

    /**
     * Uji penegakan server-side idle timeout 15 menit.
     */
    public function test_penegakan_server_side_idle_timeout_15_menit(): void
    {
        $user = User::factory()->create(['role' => 'pasien']);

        WibClock::setTestNow('2026-11-02 08:00:00');

        // Login pertama
        $this->post('/masuk', [
            'email' => $user->email,
            'password' => 'Password123!',
        ]);

        // Simulasikan aktivitas 10 menit kemudian (belum timeout)
        WibClock::setTestNow('2026-11-02 08:10:00');
        $activeResponse = $this->get('/beranda');
        $activeResponse->assertStatus(200);

        // Simulasikan 16 menit tidak aktif sejak aktivitas terakhir
        WibClock::setTestNow('2026-11-02 08:26:01');
        $timeoutResponse = $this->get('/beranda');

        // Harus diarahkan kembali ke halaman masuk dengan pesan sesi berakhir
        $timeoutResponse->assertRedirect('/masuk');
        $timeoutResponse->assertSessionHasErrors('session');
        $this->assertGuest();
    }

    /**
     * Uji proteksi peran: pasien ditolak (403) saat mengakses area admin.
     */
    public function test_pasien_ditolak_mengakses_area_admin(): void
    {
        $pasien = User::factory()->create(['role' => 'pasien']);

        $response = $this->actingAs($pasien)->get('/admin');

        $response->assertStatus(403);
    }

    /**
     * Uji tamu diarahkan ke halaman masuk saat mencoba mengakses dashboard terlindungi.
     */
    public function test_tamu_diarahkan_ke_masuk_saat_mengakses_dashboard(): void
    {
        $this->get('/beranda')->assertRedirect('/masuk');
        $this->get('/admin')->assertRedirect('/masuk');
    }

    /**
     * Uji pengguna yang sudah masuk diarahkan ke dashboard masing-masing jika membuka /masuk.
     */
    public function test_pengguna_login_diarahkan_ke_dashboard_saat_akses_auth(): void
    {
        $pasien = User::factory()->create(['role' => 'pasien']);
        $this->actingAs($pasien)->get('/masuk')->assertRedirect('/beranda');
        $this->actingAs($pasien)->get('/daftar')->assertRedirect('/beranda');

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->get('/masuk')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/daftar')->assertRedirect('/admin');
    }
}
