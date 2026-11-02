<?php

namespace Tests\Feature;

use App\Models\FornasCatalog;
use App\Models\PatientProfile;
use App\Models\PatientReportedMedication;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    public function test_pasien_dapat_melihat_halaman_profil_mandiri(): void
    {
        $pasien = User::where('role', 'pasien')->first();

        $response = $this->actingAs($pasien)->get('/profil');

        $response->assertStatus(200);
        $response->assertSee('Profil Kesehatan Pasien');
        $response->assertSee('Informasi Pasien & Fisik');
    }

    public function test_halaman_profil_menampilkan_ajakan_melengkapi_jika_data_belum_lengkap(): void
    {
        $pasienBaru = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Pasien Belum Lengkap',
            'email' => 'pasien.belum.lengkap.'.Str::random(5).'@klinik.local',
            'role' => 'pasien',
            'password_hash' => bcrypt('PasienBaru123!'),
        ]);

        $response = $this->actingAs($pasienBaru)->get('/profil');

        $response->assertStatus(200);
        $response->assertSee('Profil Anda belum lengkap.');
    }

    public function test_pasien_dapat_memperbarui_data_profil_fisik_dan_kontak(): void
    {
        $pasien = User::where('role', 'pasien')->first();

        $payload = [
            'phone_number' => '081298765432',
            'birth_date' => '1990-05-15',
            'gender' => 'laki-laki',
            'blood_group' => 'O',
            'height_cm' => 172,
            'weight_kg' => 68,
            'health_conditions' => 'Riwayat tensi tinggi ringan',
            'allergies' => 'Alergi makanan laut',
            'emergency_contact_name' => 'Siti Aminah',
            'emergency_contact_phone' => '081311223344',
        ];

        $response = $this->actingAs($pasien)->patch('/profil', $payload);

        $response->assertRedirect('/profil');
        $response->assertSessionHas('status', 'Data profil kesehatan berhasil diperbarui.');

        $this->assertDatabaseHas('profil', [
            'user_id' => $pasien->id,
            'nomor_telepon' => '081298765432',
            'jenis_kelamin' => 'laki_laki',
            'golongan_darah' => 'O',
            'tinggi_badan' => 172,
            'berat_badan' => 68,
            'kondisi_kesehatan' => 'Riwayat tensi tinggi ringan',
            'riwayat_alergi' => 'Alergi makanan laut',
            'kontak_darurat_nama' => 'Siti Aminah',
            'kontak_darurat_telepon' => '081311223344',
        ]);
    }

    public function test_pembaruan_profil_menolak_input_nik_dan_kk_secara_tegas(): void
    {
        $pasien = User::where('role', 'pasien')->first();

        $payload = [
            'phone_number' => '081298765432',
            'nik' => '3201234567890001',
            'kk' => '3201234567890002',
        ];

        $response = $this->actingAs($pasien)->patch('/profil', $payload);

        $response->assertSessionHasErrors(['nik', 'kk']);
    }

    public function test_daftar_capture_obat_pasien_bersifat_read_only_dan_tidak_terhapus_saat_update_profil(): void
    {
        $pasien = User::where('role', 'pasien')->first();

        // Siapkan capture obat
        $medication = PatientReportedMedication::create([
            'id' => (string) Str::uuid(),
            'pasien_id' => $pasien->id,
            'nama_obat' => 'Amlodipin 5mg',
            'nama_internasional' => 'amlodipine',
            'dosis_catatan' => '1 tablet',
            'frekuensi_catatan' => '1 kali sehari pagi',
            'mulai_pada' => '2026-01-01',
            'selesai_pada' => '2026-12-31',
            'catatan' => 'Kontrol tensi harian',
        ]);

        // Perbarui data fisik profil
        $this->actingAs($pasien)->patch('/profil', [
            'phone_number' => '081122334455',
            'weight_kg' => 70,
        ]);

        // Pastikan entri obat capture tetap utuh
        $this->assertDatabaseHas('obat_pasien', [
            'id' => $medication->id,
            'nama_obat' => 'Amlodipin 5mg',
        ]);

        // Pastikan halaman profil menampilkan capture obat
        $showResponse = $this->actingAs($pasien)->get('/profil');
        $showResponse->assertStatus(200);
        $showResponse->assertSee('Amlodipin 5mg');
        $showResponse->assertSee('1 tablet');
    }

    public function test_pasien_dapat_mengosongkan_profil_dengan_konfirmasi_tepat(): void
    {
        $pasien = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Pasien Reset Profil',
            'email' => 'pasien.reset.'.Str::random(5).'@klinik.local',
            'role' => 'pasien',
            'password_hash' => bcrypt('PasienReset123!'),
        ]);

        PatientProfile::create([
            'id' => (string) Str::uuid(),
            'user_id' => $pasien->id,
            'nomor_telepon' => '08999888777',
            'kondisi_kesehatan' => 'Riwayat sementara',
        ]);

        $response = $this->actingAs($pasien)->delete('/profil', [
            'confirmation' => 'HAPUS PROFIL',
        ]);

        $response->assertRedirect('/profil');
        $response->assertSessionHas('status', 'Data profil kesehatan telah berhasil dihapus.');

        $this->assertDatabaseMissing('profil', [
            'user_id' => $pasien->id,
        ]);

        // Pastikan akun user tetap aktif
        $this->assertDatabaseHas('users', [
            'id' => $pasien->id,
        ]);
    }

    public function test_penghapusan_profil_ditolak_jika_konfirmasi_salah(): void
    {
        $pasien = User::where('role', 'pasien')->first();

        $response = $this->actingAs($pasien)->delete('/profil', [
            'confirmation' => 'hapus',
        ]);

        $response->assertSessionHasErrors(['confirmation']);
    }

    public function test_admin_ditolak_membaca_profil_penuh_pasien(): void
    {
        $admin = User::where('role', 'admin')->first();

        $response = $this->actingAs($admin)->get('/profil');

        $response->assertStatus(403);
    }

    public function test_tamu_dialihkan_ke_login(): void
    {
        $response = $this->get('/profil');

        $response->assertRedirect('/masuk');
    }

    public function test_katalog_obat_dapat_diakses_dan_disaring(): void
    {
        FornasCatalog::updateOrCreate(
            ['nama_indonesia' => 'amoksisilin'],
            [
                'id' => (string) Str::uuid(),
                'nama_internasional' => 'amoxicillin',
                'sumber' => 'Fornas Kemenkes',
                'tanggal_snapshot' => '2026-11-01',
                'cakupan_snapshot' => 'Uji Test',
                'aktif' => true,
            ]
        );

        $response = $this->get('/katalog-obat?q=amoksisilin');

        $response->assertStatus(200);
        $response->assertSee('amoksisilin');
        $response->assertSee('amoxicillin');
        $response->assertSee('Catatan Referensi Resmi, Bukan Rekomendasi Medis');
    }

    public function test_command_import_katalog_fornas_bekerja_idempoten(): void
    {
        $exitCode = Artisan::call('app:import-medicine-catalog');

        $this->assertSame(0, $exitCode);
        $this->assertDatabaseHas('katalog_obat_fornas', [
            'nama_indonesia' => 'akarbose',
            'versi_snapshot' => '2026-11-01-A',
        ]);
    }
}
