<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileApiTest extends TestCase
{
    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $response = $this->getJson('/api/profil');
        $response->assertStatus(401);
    }

    public function test_admin_cannot_access_patient_profile(): void
    {
        $admin = User::where('role', 'admin')->first();
        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/profil');

        $response->assertStatus(403);
    }

    public function test_patient_can_view_own_profile(): void
    {
        $patient = User::where('role', 'pasien')->first();
        $token = $patient->createToken('patient-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/profil');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                    'role' => 'pasien',
                ],
            ]);
    }

    public function test_patient_can_update_profile_and_password(): void
    {
        $patient = User::where('email', 'pasien1@klinik.local')->first();
        $token = $patient->createToken('patient-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson('/api/profil', [
                'name' => 'Budi Santoso Baru',
                'phone_number' => '089988776655',
                'birth_date' => '1990-10-20',
                'address' => 'Jl. Kebon Jeruk No. 88',
                'password' => 'PasienKlinik2026!',
                'password_confirmation' => 'PasienKlinik2026!',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profil berhasil diperbarui',
                'data' => [
                    'name' => 'Budi Santoso Baru',
                    'phone_number' => '089988776655',
                    'birth_date' => '1990-10-20',
                    'address' => 'Jl. Kebon Jeruk No. 88',
                ],
            ]);

        $patient->refresh();
        $this->assertTrue(Hash::check('PasienKlinik2026!', $patient->password));
    }
}
