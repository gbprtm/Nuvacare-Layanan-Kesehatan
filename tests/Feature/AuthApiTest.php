<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    public function test_guest_can_access_public_info(): void
    {
        $response = $this->getJson('/api/public-info');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'clinic_name',
                    'description',
                    'address',
                    'contact',
                    'polyclinics' => [
                        '*' => [
                            'id',
                            'name',
                            'doctors',
                        ],
                    ],
                ],
            ]);
    }

    public function test_patient_can_register(): void
    {
        $uniqueEmail = 'pasien_baru_'.uniqid().'@test.local';

        $response = $this->postJson('/api/register', [
            'name' => 'Pasien Baru Mandiri',
            'email' => $uniqueEmail,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'phone_number' => '081299887766',
            'birth_date' => '1995-04-12',
            'address' => 'Jl. Merdeka No. 10',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => ['id', 'name', 'email', 'role'],
            ]);

        $this->assertEquals('pasien', $response->json('user.role'));
        $this->assertDatabaseHas('klinik.users', [
            'email' => $uniqueEmail,
            'role' => 'pasien',
            'phone_number' => '081299887766',
        ]);
    }

    public function test_login_success(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'admin@klinik.local',
            'password' => 'AdminKlinik2026!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email', 'role'],
            ]);

        $this->assertEquals('admin', $response->json('user.role'));
    }

    public function test_login_invalid_credentials(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'admin@klinik.local',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_logout_revokes_token(): void
    {
        $tokenName = 'logout-token-'.uniqid();
        $user = User::where('email', 'admin@klinik.local')->first();
        $token = $user->createToken($tokenName)->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Logged out']);

        $this->assertDatabaseMissing('klinik.personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => $tokenName,
        ]);
    }

    public function test_forgot_password_sends_notification(): void
    {
        Notification::fake();

        $user = User::where('role', 'pasien')->first();

        $response = $this->postJson('/api/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message']);

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_reset_password_with_valid_token_revokes_existing_tokens(): void
    {
        $user = User::where('email', 'pasien2@klinik.local')->first();
        $oldTokenName = 'old-session-'.uniqid();
        $user->createToken($oldTokenName);

        $resetToken = Password::broker()->createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'token' => $resetToken,
            'email' => $user->email,
            'password' => 'PasienKlinik2026!',
            'password_confirmation' => 'PasienKlinik2026!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message']);

        $this->assertDatabaseMissing('klinik.personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => $oldTokenName,
        ]);

        $loginRes = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'PasienKlinik2026!',
        ]);

        $loginRes->assertStatus(200);
    }

    public function test_reset_password_with_invalid_token_returns_indonesian_error(): void
    {
        $user = User::where('role', 'pasien')->first();

        $response = $this->postJson('/api/reset-password', [
            'token' => 'token-tidak-valid',
            'email' => $user->email,
            'password' => 'PasswordBaru2026!',
            'password_confirmation' => 'PasswordBaru2026!',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Token pengaturan ulang kata sandi tidak sah atau sudah kedaluwarsa.',
            ]);
    }

    public function test_master_poli_requires_auth(): void
    {
        $response = $this->getJson('/api/master-poli');
        $response->assertStatus(401);
    }

    public function test_master_poli_returns_data_for_authenticated_user(): void
    {
        $user = User::where('role', 'pasien')->first();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/master-poli');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'description',
                        'doctors' => [
                            '*' => [
                                'id',
                                'polyclinic_id',
                                'name',
                                'is_active',
                            ],
                        ],
                    ],
                ],
            ]);
    }
}
