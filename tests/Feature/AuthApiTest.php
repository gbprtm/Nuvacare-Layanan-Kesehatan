<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WhatsappOtp;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
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
        $rawPhone = '0812'.random_int(10000000, 99999999);
        $normalizedPhone = '62'.substr($rawPhone, 1);

        $response = $this->postJson('/api/register', [
            'name' => 'Pasien Baru Mandiri',
            'email' => $uniqueEmail,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'phone_number' => $rawPhone,
            'birth_date' => '1995-04-12',
            'address' => 'Jl. Merdeka No. 10',
        ]);

        try {
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
                'phone_number' => $normalizedPhone,
            ]);
        } finally {
            $createdUser = User::where('email', $uniqueEmail)->first();
            if ($createdUser) {
                $createdUser->tokens()->delete();
                $createdUser->delete();
            }
        }
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

    public function test_register_with_whatsapp_otp_flow_and_expiration_validation(): void
    {
        Http::fake([
            '*' => Http::response(['status' => true], 200),
        ]);

        config([
            'services.whatsapp.url' => 'https://api.fonnte.com/send',
            'services.whatsapp.token' => 'test-fonnte-token',
        ]);

        $uniqueEmail = 'otp_pasien_'.uniqid().'@test.local';
        $rawPhone = '0813'.random_int(10000000, 99999999);
        $normalizedPhone = '62'.substr($rawPhone, 1);

        $sendRes = $this->postJson('/api/auth/register/send-otp', [
            'name' => 'Pasien OTP WA',
            'email' => $uniqueEmail,
            'phone_number' => $rawPhone,
            'birth_date' => '1992-08-17',
            'address' => 'Jl. Melati No. 12',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $sendRes->assertStatus(200)
            ->assertJsonPath('data.phone_number', $normalizedPhone)
            ->assertJsonPath('data.sent_via_gateway', true);

        Http::assertSent(function ($request) use ($normalizedPhone) {
            return $request['target'] === $normalizedPhone
                && str_contains($request['message'], 'Kode OTP');
        });

        $otpRecord = WhatsappOtp::where('phone_number', $normalizedPhone)
            ->where('purpose', 'register')
            ->firstOrFail();

        $otpRecord->update(['code_hash' => Hash::make('6543')]);

        $wrongAttempt = $this->postJson('/api/auth/register/verify-otp', [
            'phone_number' => $rawPhone,
            'otp' => '1111',
        ]);
        $wrongAttempt->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        $otpRecord->update(['expires_at' => now()->subMinute()]);
        $expiredAttempt = $this->postJson('/api/auth/register/verify-otp', [
            'phone_number' => $rawPhone,
            'otp' => '6543',
        ]);
        $expiredAttempt->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        WhatsappOtp::create([
            'phone_number' => $normalizedPhone,
            'purpose' => 'register',
            'code_hash' => Hash::make('2468'),
            'payload' => [
                'name' => 'Pasien OTP WA',
                'email' => $uniqueEmail,
                'phone_number' => $normalizedPhone,
                'birth_date' => '1992-08-17',
                'address' => 'Jl. Melati No. 12',
                'password_hash' => Hash::make('Password123!'),
            ],
            'attempts' => 0,
            'expires_at' => now()->addMinutes(5),
            'last_sent_at' => now(),
        ]);

        $verifyRes = $this->postJson('/api/auth/register/verify-otp', [
            'phone_number' => $rawPhone,
            'otp' => '2468',
        ]);

        $verifyRes->assertStatus(201)
            ->assertJsonPath('requires_phone_verification', false)
            ->assertJsonPath('user.email', $uniqueEmail)
            ->assertJsonPath('user.phone_verified', true);

        $createdUser = User::where('email', $uniqueEmail)->firstOrFail();
        $this->assertNotNull($createdUser->phone_verified_at);

        $createdUser->tokens()->delete();
        $createdUser->delete();
    }

    public function test_google_login_and_whatsapp_phone_verification_flow(): void
    {
        Http::fake([
            '*' => Http::response(['status' => true], 200),
        ]);

        config([
            'services.whatsapp.url' => 'https://api.fonnte.com/send',
            'services.whatsapp.token' => 'test-fonnte-token',
        ]);

        $googleEmail = 'google_user_'.uniqid().'@gmail.com';
        $rawPhone = '0812'.random_int(10000000, 99999999);
        $normalizedPhone = '62'.substr($rawPhone, 1);

        $googleLogin = $this->postJson('/api/auth/google', [
            'email' => $googleEmail,
            'name' => 'Pengguna Google Baru',
            'google_id' => 'gid-'.uniqid(),
        ]);

        $googleLogin->assertStatus(200)
            ->assertJsonPath('requires_phone_verification', true)
            ->assertJsonPath('user.email', $googleEmail)
            ->assertJsonPath('user.phone_verified', false);

        $token = $googleLogin->json('token');

        $sendPhoneOtp = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/phone/send-otp', [
                'phone_number' => $rawPhone,
            ]);

        $sendPhoneOtp->assertStatus(200)
            ->assertJsonPath('data.phone_number', $normalizedPhone);

        $otpRecord = WhatsappOtp::where('phone_number', $normalizedPhone)
            ->where('purpose', 'verify_phone')
            ->firstOrFail();

        $otpRecord->update(['code_hash' => Hash::make('8899')]);

        $verifyPhoneOtp = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/phone/verify-otp', [
                'phone_number' => $rawPhone,
                'otp' => '8899',
            ]);

        $verifyPhoneOtp->assertStatus(200)
            ->assertJsonPath('requires_phone_verification', false)
            ->assertJsonPath('user.phone_number', $normalizedPhone)
            ->assertJsonPath('user.phone_verified', true);

        $secondGoogleLogin = $this->postJson('/api/auth/google', [
            'email' => $googleEmail,
            'name' => 'Pengguna Google Baru',
        ]);

        $secondGoogleLogin->assertStatus(200)
            ->assertJsonPath('requires_phone_verification', false)
            ->assertJsonPath('user.phone_verified', true);

        $user = User::where('email', $googleEmail)->first();
        if ($user) {
            $user->tokens()->delete();
            $user->delete();
        }
    }

    public function test_generated_otp_works_across_62_08_and_other_phone_formats(): void
    {
        Http::fake([
            '*' => Http::response(['status' => true], 200),
        ]);

        config([
            'services.whatsapp.url' => 'https://api.fonnte.com/send',
            'services.whatsapp.token' => 'test-fonnte-token',
            'app.debug' => true,
        ]);

        $baseDigits = '813'.random_int(10000000, 99999999);
        $canonicalPhone = '62'.$baseDigits;
        $variants = [
            '0'.$baseDigits,
            '62'.$baseDigits,
            '+62'.$baseDigits,
            $baseDigits,
            '620'.$baseDigits,
            '+62 0'.substr($baseDigits, 0, 3).'-'.substr($baseDigits, 3, 4).'-'.substr($baseDigits, 7),
            '+6262'.$baseDigits,
        ];

        foreach ($variants as $idx => $inputFormat) {
            $email = "format_{$idx}_".uniqid().'@test.local';

            try {
                $sendRes = $this->postJson('/api/auth/register/send-otp', [
                    'name' => 'Pasien Format Uji',
                    'email' => $email,
                    'phone_number' => $inputFormat,
                    'password' => 'Password123!',
                    'password_confirmation' => 'Password123!',
                ]);

                $sendRes->assertStatus(200)
                    ->assertJsonPath('data.phone_number', $canonicalPhone);

                $generatedOtp = $sendRes->json('data.debug_otp');
                $this->assertNotEmpty($generatedOtp);

                // Verify using a different format variant (e.g. 08... vs 62...)
                $verifyPhoneInput = $variants[($idx + 1) % count($variants)];
                $verifyRes = $this->postJson('/api/auth/register/verify-otp', [
                    'phone_number' => $verifyPhoneInput,
                    'otp' => $generatedOtp,
                ]);

                $verifyRes->assertStatus(201)
                    ->assertJsonPath('user.phone_number', $canonicalPhone)
                    ->assertJsonPath('user.phone_verified', true);
            } finally {
                WhatsappOtp::where('phone_number', $canonicalPhone)->delete();
                $u = User::where('email', $email)->first();
                if ($u) {
                    $u->tokens()->delete();
                    $u->delete();
                }
            }
        }
    }

    public function test_already_registered_phone_returns_clear_message_across_formats_and_endpoints(): void
    {
        Http::fake([
            '*' => Http::response(['status' => true], 200),
        ]);

        $baseDigits = '812'.random_int(10000000, 99999999);
        $localPhone = '0'.$baseDigits;
        $canonicalPhone = '62'.$baseDigits;
        $existingEmail = 'existing_'.uniqid().'@test.local';

        $existingUser = User::create([
            'name' => 'Pasien Terdaftar',
            'email' => $existingEmail,
            'password' => Hash::make('Password123!'),
            'role' => 'pasien',
            'phone_number' => $localPhone,
            'phone_verified_at' => now(),
        ]);

        $otherUser = User::create([
            'name' => 'Pasien Kedua',
            'email' => 'other_'.uniqid().'@test.local',
            'password' => Hash::make('Password123!'),
            'role' => 'pasien',
            'phone_number' => null,
            'phone_verified_at' => null,
        ]);
        $otherToken = $otherUser->createToken('other-token')->plainTextToken;

        try {
            $formatsToTest = [
                $localPhone,
                $canonicalPhone,
                '+'.$canonicalPhone,
                $baseDigits,
                '620'.$baseDigits,
                '+62 0'.$baseDigits,
            ];

            foreach ($formatsToTest as $format) {
                $resRegisterOtp = $this->postJson('/api/auth/register/send-otp', [
                    'name' => 'Calon Pasien Baru',
                    'email' => 'calon_'.uniqid().'@test.local',
                    'phone_number' => $format,
                    'password' => 'Password123!',
                    'password_confirmation' => 'Password123!',
                ]);

                $resRegisterOtp->assertStatus(422)
                    ->assertJsonValidationErrors(['phone_number']);
                $this->assertStringContainsString(
                    'sudah terdaftar',
                    $resRegisterOtp->json('errors.phone_number.0')
                );

                $resPhoneOtp = $this->withHeader('Authorization', 'Bearer '.$otherToken)
                    ->postJson('/api/auth/phone/send-otp', [
                        'phone_number' => $format,
                    ]);

                $resPhoneOtp->assertStatus(422)
                    ->assertJsonValidationErrors(['phone_number']);
                $this->assertStringContainsString(
                    'sudah terdaftar',
                    $resPhoneOtp->json('errors.phone_number.0')
                );
            }

            // Even if email is ALSO already registered, phone_number error must still be reported
            $resBothDup = $this->postJson('/api/auth/register/send-otp', [
                'name' => 'Calon Pasien Duplikat',
                'email' => $existingEmail,
                'phone_number' => $canonicalPhone,
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
            ]);
            $resBothDup->assertStatus(422)
                ->assertJsonValidationErrors(['email', 'phone_number']);

            // Direct POST /api/register must also reject already-registered phone
            $resDirectReg = $this->postJson('/api/register', [
                'name' => 'Pasien Langsung',
                'email' => 'direct_'.uniqid().'@test.local',
                'phone_number' => $canonicalPhone,
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
            ]);
            $resDirectReg->assertStatus(422)
                ->assertJsonValidationErrors(['phone_number']);

            // PATCH /api/profil must also reject updating phone to another user's registered phone
            $resProfileUpdate = $this->withHeader('Authorization', 'Bearer '.$otherToken)
                ->patchJson('/api/profil', [
                    'name' => 'Pasien Kedua',
                    'phone_number' => $canonicalPhone,
                ]);
            $resProfileUpdate->assertStatus(422)
                ->assertJsonValidationErrors(['phone_number']);
        } finally {
            $otherUser->tokens()->delete();
            $otherUser->delete();
            $existingUser->tokens()->delete();
            $existingUser->delete();
        }
    }
}
