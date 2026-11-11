<?php

namespace Tests\Feature;

use App\Models\Doctor;
use App\Models\Polyclinic;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SurfaceAndRbacIsolationTest extends TestCase
{
    private array $createdUserIds = [];

    private array $createdDoctorIds = [];

    protected function tearDown(): void
    {
        foreach (array_reverse($this->createdDoctorIds) as $doctorId) {
            Doctor::whereKey($doctorId)->delete();
        }

        foreach (array_reverse($this->createdUserIds) as $userId) {
            $user = User::find($userId);
            if ($user) {
                $user->tokens()->delete();
                $user->delete();
            }
        }

        config([
            'surface.mode' => 'combined',
            'surface.allowed_staff_ips' => [],
            'features.doctor_portal' => true,
        ]);

        parent::tearDown();
    }

    public function test_pasien_surface_serves_patient_routes_and_hides_staff_routes_with_404(): void
    {
        config(['surface.mode' => 'pasien']);

        $this->get('/index.html')->assertStatus(200);
        $this->get('/login.html')->assertStatus(200);
        $this->get('/pasien/janji-temu.html')->assertStatus(200);

        $this->get('/staf/login.html')->assertStatus(404);
        $this->get('/admin/kelola-janji.html')->assertStatus(404);
        $this->get('/dokter/janji-temu.html')->assertStatus(404);

        $this->getJson('/api/public-info')->assertStatus(200);

        // Staff API endpoints are hidden (404) on pasien host even without or with token
        $this->getJson('/api/admin/janji-temu')->assertStatus(404);
        $this->getJson('/api/dokter/janji-temu')->assertStatus(404);

        $admin = User::where('email', 'admin@klinik.local')->firstOrFail();
        $stafToken = $admin->createToken('staf-token', ['surface:staf'])->plainTextToken;

        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$stafToken)
            ->getJson('/api/admin/janji-temu')
            ->assertStatus(404);

        $this->app['auth']->forgetGuards();

        // Cross-surface token rejected on pasien host (403)
        $this->withHeader('Authorization', 'Bearer '.$stafToken)
            ->getJson('/api/master-poli')
            ->assertStatus(403);

        $patient = User::where('email', 'pasien1@klinik.local')->firstOrFail();
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$stafToken)
            ->getJson('/api/janji-temu')
            ->assertStatus(403);

        // Admin & Dokter cannot log in on pasien surface
        $this->postJson('/api/login', [
            'email' => $admin->email,
            'password' => 'AdminKlinik2026!',
        ])->assertStatus(403);

        $dokter = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $this->postJson('/api/login', [
            'email' => $dokter->email,
            'password' => 'DokterKlinik2026!',
        ])->assertStatus(403);

        // Patient login succeeds and issues surface:pasien token
        $loginPatient = $this->postJson('/api/login', [
            'email' => $patient->email,
            'password' => 'PasienKlinik2026!',
        ]);

        $loginPatient->assertStatus(200)
            ->assertJsonPath('user.role', 'pasien')
            ->assertJsonPath('user.surface', 'pasien');

        $patientToken = $loginPatient->json('token');
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$patientToken)
            ->getJson('/api/janji-temu')
            ->assertStatus(200);
    }

    public function test_staf_surface_isolates_patient_routes_and_enforces_token_surface_ability(): void
    {
        config(['surface.mode' => 'staf']);

        $this->get('/')->assertRedirect('/staf/login.html');
        $this->get('/staf/login.html')->assertStatus(200);
        $this->get('/login.html')->assertStatus(200);
        $this->get('/admin/kelola-janji.html')->assertStatus(200);
        $this->get('/dokter/janji-temu.html')->assertStatus(200);

        $this->get('/index.html')->assertStatus(404);
        $this->get('/daftar.html')->assertStatus(404);
        $this->get('/pasien/janji-temu.html')->assertStatus(404);

        $this->getJson('/api/public-info')->assertStatus(404);
        $this->postJson('/api/register', [])->assertStatus(404);
        $this->postJson('/api/auth/google', [])->assertStatus(404);
        $this->getJson('/api/janji-temu')->assertStatus(404);
        $this->getJson('/api/profil')->assertStatus(404);

        // Patient cannot log in on staf host
        $patient = User::where('email', 'pasien1@klinik.local')->firstOrFail();
        $this->postJson('/api/login', [
            'email' => $patient->email,
            'password' => 'PasienKlinik2026!',
        ])->assertStatus(403);

        // Cross-surface patient token rejected on staf host (403)
        $patientToken = $patient->createToken('patient-token', ['surface:pasien'])->plainTextToken;
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$patientToken)
            ->getJson('/api/master-poli')
            ->assertStatus(403);

        // Wildcard token without explicit surface:staf is also rejected in separated staf mode
        $admin = User::where('email', 'admin@klinik.local')->firstOrFail();
        $wildcardToken = $admin->createToken('wildcard-token')->plainTextToken;
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$wildcardToken)
            ->getJson('/api/admin/janji-temu')
            ->assertStatus(403);

        // Doctor logs in via staf surface and gets surface:staf token
        $dokter = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $loginDoctor = $this->postJson('/api/login', [
            'email' => $dokter->email,
            'password' => 'DokterKlinik2026!',
        ]);

        $loginDoctor->assertStatus(200)
            ->assertJsonPath('user.role', 'dokter')
            ->assertJsonPath('user.surface', 'staf');

        $stafToken = $loginDoctor->json('token');
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$stafToken)
            ->getJson('/api/dokter/janji-temu')
            ->assertStatus(200);
    }

    public function test_staff_ip_allowlist_blocks_unauthorized_ip_on_staf_surface(): void
    {
        config([
            'surface.mode' => 'staf',
            'surface.allowed_staff_ips' => ['203.0.113.10'],
        ]);

        $admin = User::where('email', 'admin@klinik.local')->firstOrFail();
        $adminToken = $admin->createToken('staf-admin', ['surface:staf'])->plainTextToken;

        $this->get('/admin/kelola-janji.html')->assertStatus(403);

        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/admin/janji-temu')
            ->assertStatus(403);

        config(['surface.allowed_staff_ips' => ['127.0.0.1', '::1']]);

        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/admin/janji-temu')
            ->assertStatus(200);
    }

    public function test_feature_flag_off_hides_doctor_portal_and_cancellation_routes(): void
    {
        config(['features.doctor_portal' => false]);

        $admin = User::where('email', 'admin@klinik.local')->firstOrFail();
        $adminToken = $admin->createToken('admin-token', ['surface:staf'])->plainTextToken;

        $dokter = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $dokterToken = $dokter->createToken('dokter-token', ['surface:staf'])->plainTextToken;

        $this->get('/dokter/janji-temu.html')->assertStatus(404);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->getJson('/api/dokter/janji-temu')
            ->assertStatus(404);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/admin/pengajuan-pembatalan')
            ->assertStatus(404);

        $this->app['auth']->forgetGuards();
        // Existing admin & patient endpoints continue working normally
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/admin/janji-temu')
            ->assertStatus(200);
    }

    public function test_unlinked_inactive_or_disabled_doctor_account_is_rejected_with_403_and_admin_can_toggle(): void
    {
        $admin = User::where('email', 'admin@klinik.local')->firstOrFail();
        $adminToken = $admin->createToken('admin-token', ['surface:staf'])->plainTextToken;

        // 1. Unlinked user with role dokter cannot log in or access /api/dokter/*
        $unlinkedEmail = 'dokter_unlinked_'.uniqid().'@test.local';
        $unlinkedUser = User::create([
            'name' => 'dr. Belum Tertaut',
            'email' => $unlinkedEmail,
            'password' => Hash::make('DokterTest123!'),
            'role' => 'dokter',
        ]);
        $this->createdUserIds[] = $unlinkedUser->id;

        $this->postJson('/api/login', [
            'email' => $unlinkedEmail,
            'password' => 'DokterTest123!',
        ])->assertStatus(403);

        $unlinkedToken = $unlinkedUser->createToken('unlinked-token', ['surface:staf'])->plainTextToken;
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$unlinkedToken)
            ->getJson('/api/dokter/janji-temu')
            ->assertStatus(403);

        // 2. Admin provisions an account for a new doctor via POST /api/admin/dokter/{id}/akun
        $poli = Polyclinic::first();
        $newDoctor = Doctor::create([
            'polyclinic_id' => $poli->id,
            'name' => 'dr. Provision Test '.uniqid(),
            'is_active' => true,
        ]);
        $this->createdDoctorIds[] = $newDoctor->id;

        $provisionEmail = 'dokter_prov_'.uniqid().'@test.local';
        $this->app['auth']->forgetGuards();

        $provRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/dokter/{$newDoctor->id}/akun", [
                'email' => $provisionEmail,
                'password' => 'DokterBaru2026!',
                'phone_number' => '081299990000',
            ]);

        $provRes->assertStatus(201)
            ->assertJsonPath('data.has_account', true)
            ->assertJsonPath('data.account_enabled', true);

        $newDoctor->refresh();
        $this->createdUserIds[] = $newDoctor->user_id;

        // Second provision on same doctor fails with 409
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/dokter/{$newDoctor->id}/akun", [
                'email' => 'another_'.uniqid().'@test.local',
                'password' => 'DokterBaru2026!',
            ])
            ->assertStatus(409);

        // Newly provisioned doctor logs in successfully
        $docLogin = $this->postJson('/api/login', [
            'email' => $provisionEmail,
            'password' => 'DokterBaru2026!',
        ]);
        $docLogin->assertStatus(200)
            ->assertJsonPath('user.role', 'dokter')
            ->assertJsonPath('user.doctor.id', $newDoctor->id);

        $docToken = $docLogin->json('token');

        // 3. Inactive doctor row (is_active = false) is rejected with 403 on /api/dokter/*
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/dokter/{$newDoctor->id}", ['is_active' => false])
            ->assertStatus(200);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$docToken)
            ->getJson('/api/dokter/janji-temu')
            ->assertStatus(403);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/dokter/{$newDoctor->id}", ['is_active' => true])
            ->assertStatus(200);

        // 4. Admin disables doctor login account -> revokes tokens & denies login (403)
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/dokter/{$newDoctor->id}/akun", ['access_enabled' => false])
            ->assertStatus(200)
            ->assertJsonPath('data.account_enabled', false);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$docToken)
            ->getJson('/api/dokter/janji-temu')
            ->assertStatus(401);

        $this->postJson('/api/login', [
            'email' => $provisionEmail,
            'password' => 'DokterBaru2026!',
        ])->assertStatus(403);

        // Re-enabling restores login
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/dokter/{$newDoctor->id}/akun", ['access_enabled' => true])
            ->assertStatus(200)
            ->assertJsonPath('data.account_enabled', true);

        $this->postJson('/api/login', [
            'email' => $provisionEmail,
            'password' => 'DokterBaru2026!',
        ])->assertStatus(200);
    }
}
