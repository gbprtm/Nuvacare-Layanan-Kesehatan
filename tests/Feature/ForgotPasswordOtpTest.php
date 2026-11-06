<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WhatsappOtp;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ForgotPasswordOtpTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            '*' => Http::response(['status' => true], 200),
        ]);

        config([
            'services.whatsapp.url' => 'https://api.fonnte.com/send',
            'services.whatsapp.token' => 'test-whatsapp-token',
        ]);
    }

    public function test_cannot_send_otp_if_user_not_found(): void
    {
        $response = $this->postJson('/api/auth/forgot-password/send-otp', [
            'identifier' => 'tidak.ada.'.uniqid().'@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['identifier']);
    }

    public function test_send_otp_success_using_email_and_phone_identifiers(): void
    {
        $rawPhone = '0812'.random_int(10000000, 99999999);
        $normalizedPhone = '62'.substr($rawPhone, 1);
        $uniqueEmail = 'pasien_lupa_'.uniqid().'@example.com';

        $user = User::create([
            'name' => 'Pasien Lupa Sandi',
            'email' => $uniqueEmail,
            'password' => Hash::make('Password123!'),
            'role' => 'pasien',
            'phone_number' => $normalizedPhone,
            'phone_verified_at' => now(),
        ]);

        try {
            // 1. Using Email
            $resByEmail = $this->postJson('/api/auth/forgot-password/send-otp', [
                'identifier' => $user->email,
            ]);

            $resByEmail->assertStatus(200)
                ->assertJsonPath('data.phone_number', $normalizedPhone)
                ->assertJsonPath('data.expires_in', 300)
                ->assertJsonPath('data.resend_in', 60);

            $this->assertDatabaseHas('whatsapp_otps', [
                'phone_number' => $normalizedPhone,
                'purpose' => 'reset_password',
            ]);

            // 2. Cooldown check
            $cooldownAttempt = $this->postJson('/api/auth/forgot-password/send-otp', [
                'identifier' => $user->email,
            ]);
            $cooldownAttempt->assertStatus(429);

            // Reset OTP record for next send
            WhatsappOtp::where('phone_number', $normalizedPhone)->delete();

            // 3. Using Phone
            $resByPhone = $this->postJson('/api/auth/forgot-password/send-otp', [
                'identifier' => $rawPhone,
            ]);
            $resByPhone->assertStatus(200)
                ->assertJsonPath('data.phone_number', $normalizedPhone);
        } finally {
            WhatsappOtp::where('phone_number', $normalizedPhone)->delete();
            $user->tokens()->delete();
            $user->delete();
        }
    }

    public function test_send_otp_success_when_user_phone_is_stored_with_leading_zero(): void
    {
        $rawPhone = '0813'.random_int(10000000, 99999999);
        $uniqueEmail = 'pasien_nol_'.uniqid().'@example.com';

        $user = User::create([
            'name' => 'Pasien Format Nol',
            'email' => $uniqueEmail,
            'password' => Hash::make('Password123!'),
            'role' => 'pasien',
            'phone_number' => $rawPhone,
            'phone_verified_at' => now(),
        ]);

        try {
            $res = $this->postJson('/api/auth/forgot-password/send-otp', [
                'identifier' => $rawPhone,
            ]);

            $res->assertStatus(200);
        } finally {
            WhatsappOtp::where('phone_number', '62'.substr($rawPhone, 1))->delete();
            WhatsappOtp::where('phone_number', $rawPhone)->delete();
            $user->tokens()->delete();
            $user->delete();
        }
    }

    public function test_verify_otp_fails_with_invalid_code_and_locks_out_after_5_attempts(): void
    {
        $rawPhone = '0812'.random_int(10000000, 99999999);
        $normalizedPhone = '62'.substr($rawPhone, 1);
        $user = User::create([
            'name' => 'Pasien Salah OTP',
            'email' => 'pasien_salah_'.uniqid().'@example.com',
            'password' => Hash::make('Password123!'),
            'role' => 'pasien',
            'phone_number' => $normalizedPhone,
            'phone_verified_at' => now(),
        ]);

        WhatsappOtp::create([
            'phone_number' => $normalizedPhone,
            'purpose' => 'reset_password',
            'code_hash' => Hash::make('4321'),
            'payload' => [
                'user_id' => $user->id,
                'phone_number' => $normalizedPhone,
            ],
            'attempts' => 0,
            'expires_at' => now()->addMinutes(5),
            'last_sent_at' => now(),
        ]);

        try {
            // Attempt 1: wrong
            $res1 = $this->postJson('/api/auth/forgot-password/verify-otp', [
                'phone_number' => $normalizedPhone,
                'otp' => '0000',
            ]);
            $res1->assertStatus(422)
                ->assertJsonValidationErrors(['otp']);

            $otpRecord = WhatsappOtp::where('phone_number', $normalizedPhone)->first();
            $this->assertEquals(1, $otpRecord->attempts);

            // Fast-forward to 4 attempts
            $otpRecord->update(['attempts' => 4]);

            // Attempt 5: should lock out and delete record
            $res5 = $this->postJson('/api/auth/forgot-password/verify-otp', [
                'phone_number' => $normalizedPhone,
                'otp' => '0000',
            ]);
            $res5->assertStatus(422)
                ->assertJsonValidationErrors(['otp']);

            $this->assertDatabaseMissing('whatsapp_otps', [
                'phone_number' => $normalizedPhone,
                'purpose' => 'reset_password',
            ]);
        } finally {
            WhatsappOtp::where('phone_number', $normalizedPhone)->delete();
            $user->tokens()->delete();
            $user->delete();
        }
    }

    public function test_verify_otp_success_and_complete_password_reset(): void
    {
        $rawPhone = '0812'.random_int(10000000, 99999999);
        $normalizedPhone = '62'.substr($rawPhone, 1);
        $user = User::create([
            'name' => 'Pasien Reset Sukses',
            'email' => 'pasien_reset_'.uniqid().'@example.com',
            'password' => Hash::make('OldPassword123!'),
            'role' => 'pasien',
            'phone_number' => $normalizedPhone,
            'phone_verified_at' => now(),
        ]);

        try {
            // Create initial token
            $initialToken = $user->createToken('test-session')->plainTextToken;
            $this->assertNotEmpty($user->tokens()->get());

            WhatsappOtp::create([
                'phone_number' => $normalizedPhone,
                'purpose' => 'reset_password',
                'code_hash' => Hash::make('7890'),
                'payload' => [
                    'user_id' => $user->id,
                    'phone_number' => $normalizedPhone,
                ],
                'attempts' => 0,
                'expires_at' => now()->addMinutes(5),
                'last_sent_at' => now(),
            ]);

            // Step 2: Verify OTP
            $verifyRes = $this->postJson('/api/auth/forgot-password/verify-otp', [
                'phone_number' => $normalizedPhone,
                'otp' => '7890',
            ]);

            $verifyRes->assertStatus(200)
                ->assertJsonStructure([
                    'message',
                    'data' => [
                        'reset_token',
                        'phone_number',
                    ],
                ]);

            $resetToken = $verifyRes->json('data.reset_token');
            $this->assertNotEmpty($resetToken);

            // Step 3: Reset Password with invalid token -> fails
            $badTokenAttempt = $this->postJson('/api/auth/forgot-password/reset', [
                'phone_number' => $normalizedPhone,
                'reset_token' => 'invalid-token-value',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ]);
            $badTokenAttempt->assertStatus(422)
                ->assertJsonValidationErrors(['reset_token']);

            // Re-create valid OTP state for valid reset
            $verifyRes2 = $this->postJson('/api/auth/forgot-password/send-otp', [
                'identifier' => $normalizedPhone,
            ]);
            $verifyRes2->assertStatus(200);

            $otpRecord = WhatsappOtp::where('phone_number', $normalizedPhone)->firstOrFail();
            $otpRecord->update(['code_hash' => Hash::make('9988')]);

            $verifyRes3 = $this->postJson('/api/auth/forgot-password/verify-otp', [
                'phone_number' => $normalizedPhone,
                'otp' => '9988',
            ]);
            $validToken = $verifyRes3->json('data.reset_token');

            // Step 3: Valid reset
            $resetRes = $this->postJson('/api/auth/forgot-password/reset', [
                'phone_number' => $normalizedPhone,
                'reset_token' => $validToken,
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ]);

            $resetRes->assertStatus(200)
                ->assertJsonPath('message', 'Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.');

            // User password should be updated
            $user->refresh();
            $this->assertTrue(Hash::check('NewPassword123!', $user->password));

            // All Sanctum tokens should be revoked
            $this->assertEmpty($user->tokens()->get());

            // OTP record should be deleted
            $this->assertDatabaseMissing('whatsapp_otps', [
                'phone_number' => $normalizedPhone,
                'purpose' => 'reset_password',
            ]);
        } finally {
            WhatsappOtp::where('phone_number', $normalizedPhone)->delete();
            $user->tokens()->delete();
            $user->delete();
        }
    }
}
