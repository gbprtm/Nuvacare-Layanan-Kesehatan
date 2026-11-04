<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Polyclinic;
use App\Models\User;
use App\Models\WhatsappOtp;
use App\Services\WhatsAppNotificationService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    private const OTP_TTL_MINUTES = 5;

    private const OTP_COOLDOWN_SECONDS = 60;

    private const OTP_MAX_ATTEMPTS = 5;

    public function publicInfo(): JsonResponse
    {
        $polyclinics = Polyclinic::with(['doctors' => function ($query) {
            $query->where('is_active', true)->orderBy('name', 'asc');
        }])->orderBy('name', 'asc')->get();

        return response()->json([
            'data' => [
                'clinic_name' => 'Nuvacare',
                'description' => 'Layanan kesehatan terpercaya untuk Anda dan keluarga dengan dokter spesialis profesional.',
                'address' => 'Jl. Kesehatan Raya No. 45, Jakarta Pusat',
                'contact' => '+62 21 555-0199',
                'google_client_id' => config('services.google.client_id'),
                'polyclinics' => $polyclinics,
            ],
        ]);
    }

    public function sendRegisterOtp(Request $request, WhatsAppNotificationService $whatsApp): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone_number' => ['required', 'string', 'min:9', 'max:30'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'address' => ['nullable', 'string', 'max:1000'],
            'password' => ['required', 'string', PasswordRule::min(8), 'confirmed'],
        ]);

        $normalizedPhone = $whatsApp->normalizePhone($validated['phone_number']);
        if (strlen($normalizedPhone) < 10) {
            throw ValidationException::withMessages([
                'phone_number' => ['Masukkan nomor WhatsApp yang valid (contoh: 081234567890).'],
            ]);
        }

        if ($this->isPhoneTaken($normalizedPhone)) {
            throw ValidationException::withMessages([
                'phone_number' => ['Nomor WhatsApp ini sudah terdaftar pada akun lain.'],
            ]);
        }

        $existingOtp = WhatsappOtp::where('phone_number', $normalizedPhone)
            ->where('purpose', 'register')
            ->first();

        if ($existingOtp && $existingOtp->last_sent_at && $existingOtp->last_sent_at->diffInSeconds(now()) < self::OTP_COOLDOWN_SECONDS) {
            $waitSeconds = (int) ceil(self::OTP_COOLDOWN_SECONDS - $existingOtp->last_sent_at->diffInSeconds(now()));

            return response()->json([
                'message' => "Tunggu {$waitSeconds} detik sebelum meminta kode OTP baru.",
                'retry_after' => $waitSeconds,
            ], 429);
        }

        $otpCode = (string) random_int(100000, 999999);

        WhatsappOtp::updateOrCreate(
            [
                'phone_number' => $normalizedPhone,
                'purpose' => 'register',
            ],
            [
                'code_hash' => Hash::make($otpCode),
                'payload' => [
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone_number' => $normalizedPhone,
                    'birth_date' => $validated['birth_date'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'password_hash' => Hash::make($validated['password']),
                ],
                'attempts' => 0,
                'expires_at' => now()->addMinutes(self::OTP_TTL_MINUTES),
                'last_sent_at' => now(),
            ]
        );

        $dispatch = $whatsApp->sendOtp($normalizedPhone, $otpCode, 'register');

        return response()->json([
            'message' => 'Kode OTP 6 digit telah dikirim ke nomor WhatsApp Anda.',
            'data' => [
                'phone_number' => $normalizedPhone,
                'masked_phone' => $this->maskPhone($normalizedPhone),
                'expires_in' => self::OTP_TTL_MINUTES * 60,
                'resend_in' => self::OTP_COOLDOWN_SECONDS,
                'sent_via_gateway' => $dispatch['sent'],
            ],
        ]);
    }

    public function verifyRegisterOtp(Request $request, WhatsAppNotificationService $whatsApp): JsonResponse
    {
        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'max:30'],
            'otp' => ['required', 'digits:6'],
        ]);

        $normalizedPhone = $whatsApp->normalizePhone($validated['phone_number']);

        $otpRecord = WhatsappOtp::where('phone_number', $normalizedPhone)
            ->where('purpose', 'register')
            ->first();

        $this->validateOtpAttempt($otpRecord, $validated['otp']);

        $payload = $otpRecord->payload ?? [];
        if (empty($payload['email']) || empty($payload['name']) || empty($payload['password_hash'])) {
            $otpRecord->delete();
            throw ValidationException::withMessages([
                'otp' => ['Data pendaftaran tidak ditemukan. Silakan ulangi pengisian formulir.'],
            ]);
        }

        if (User::where('email', $payload['email'])->exists()) {
            $otpRecord->delete();
            throw ValidationException::withMessages([
                'email' => ['Alamat email ini sudah terdaftar. Silakan masuk.'],
            ]);
        }

        if ($this->isPhoneTaken($normalizedPhone)) {
            $otpRecord->delete();
            throw ValidationException::withMessages([
                'phone_number' => ['Nomor WhatsApp ini sudah terdaftar pada akun lain.'],
            ]);
        }

        $user = new User([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'role' => 'pasien',
            'phone_number' => $normalizedPhone,
            'phone_verified_at' => now(),
            'birth_date' => $payload['birth_date'] ?? null,
            'address' => $payload['address'] ?? null,
        ]);
        $user->password = $payload['password_hash'];
        $user->save();

        $otpRecord->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Nomor WhatsApp terverifikasi dan pendaftaran akun berhasil.',
            'token' => $token,
            'requires_phone_verification' => false,
            'user' => $this->formatUserPayload($user),
        ], 201);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', PasswordRule::min(8), 'confirmed'],
            'phone_number' => ['nullable', 'string', 'max:30'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'address' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'pasien',
            'phone_number' => $validated['phone_number'] ?? null,
            'phone_verified_at' => ! empty($validated['phone_number']) ? now() : null,
            'birth_date' => $validated['birth_date'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Pendaftaran akun berhasil',
            'token' => $token,
            'requires_phone_verification' => ! $user->hasVerifiedPhone(),
            'user' => $this->formatUserPayload($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial yang diberikan tidak cocok dengan data kami.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'requires_phone_verification' => $user->role === 'pasien' && ! $user->hasVerifiedPhone(),
            'user' => $this->formatUserPayload($user),
        ]);
    }

    public function googleLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'credential' => ['nullable', 'string'],
            'email' => ['nullable', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'google_id' => ['nullable', 'string', 'max:255'],
        ]);

        $googleProfile = $this->resolveGoogleProfile($validated);

        $user = User::where('google_id', $googleProfile['google_id'])
            ->orWhere('email', $googleProfile['email'])
            ->first();

        if (! $user) {
            $user = User::create([
                'name' => $googleProfile['name'],
                'email' => $googleProfile['email'],
                'google_id' => $googleProfile['google_id'],
                'password' => Hash::make(Str::random(32)),
                'role' => 'pasien',
                'phone_number' => null,
                'phone_verified_at' => null,
            ]);
        } elseif (empty($user->google_id)) {
            $user->update(['google_id' => $googleProfile['google_id']]);
        }

        $token = $user->createToken('google-auth-token')->plainTextToken;
        $requiresPhone = $user->role === 'pasien' && ! $user->hasVerifiedPhone();

        return response()->json([
            'message' => $requiresPhone
                ? 'Berhasil masuk dengan Google. Silakan verifikasi nomor WhatsApp Anda.'
                : 'Berhasil masuk dengan akun Google.',
            'token' => $token,
            'requires_phone_verification' => $requiresPhone,
            'user' => $this->formatUserPayload($user),
        ]);
    }

    public function sendPhoneOtp(Request $request, WhatsAppNotificationService $whatsApp): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'min:9', 'max:30'],
        ]);

        $normalizedPhone = $whatsApp->normalizePhone($validated['phone_number']);
        if (strlen($normalizedPhone) < 10) {
            throw ValidationException::withMessages([
                'phone_number' => ['Masukkan nomor WhatsApp yang valid (contoh: 081234567890).'],
            ]);
        }

        if ($this->isPhoneTaken($normalizedPhone, $user->id)) {
            throw ValidationException::withMessages([
                'phone_number' => ['Nomor WhatsApp ini sudah digunakan oleh akun lain.'],
            ]);
        }

        $existingOtp = WhatsappOtp::where('phone_number', $normalizedPhone)
            ->where('purpose', 'verify_phone')
            ->first();

        if ($existingOtp && $existingOtp->last_sent_at && $existingOtp->last_sent_at->diffInSeconds(now()) < self::OTP_COOLDOWN_SECONDS) {
            $waitSeconds = (int) ceil(self::OTP_COOLDOWN_SECONDS - $existingOtp->last_sent_at->diffInSeconds(now()));

            return response()->json([
                'message' => "Tunggu {$waitSeconds} detik sebelum meminta kode OTP baru.",
                'retry_after' => $waitSeconds,
            ], 429);
        }

        $otpCode = (string) random_int(100000, 999999);

        WhatsappOtp::updateOrCreate(
            [
                'phone_number' => $normalizedPhone,
                'purpose' => 'verify_phone',
            ],
            [
                'code_hash' => Hash::make($otpCode),
                'payload' => [
                    'user_id' => $user->id,
                    'phone_number' => $normalizedPhone,
                ],
                'attempts' => 0,
                'expires_at' => now()->addMinutes(self::OTP_TTL_MINUTES),
                'last_sent_at' => now(),
            ]
        );

        $dispatch = $whatsApp->sendOtp($normalizedPhone, $otpCode, 'verify_phone');

        return response()->json([
            'message' => 'Kode OTP verifikasi telah dikirim ke WhatsApp Anda.',
            'data' => [
                'phone_number' => $normalizedPhone,
                'masked_phone' => $this->maskPhone($normalizedPhone),
                'expires_in' => self::OTP_TTL_MINUTES * 60,
                'resend_in' => self::OTP_COOLDOWN_SECONDS,
                'sent_via_gateway' => $dispatch['sent'],
            ],
        ]);
    }

    public function verifyPhoneOtp(Request $request, WhatsAppNotificationService $whatsApp): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'max:30'],
            'otp' => ['required', 'digits:6'],
        ]);

        $normalizedPhone = $whatsApp->normalizePhone($validated['phone_number']);

        $otpRecord = WhatsappOtp::where('phone_number', $normalizedPhone)
            ->where('purpose', 'verify_phone')
            ->first();

        $this->validateOtpAttempt($otpRecord, $validated['otp']);

        $payloadUserId = $otpRecord->payload['user_id'] ?? null;
        if ($payloadUserId !== null && (int) $payloadUserId !== (int) $user->id) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP ini tidak berlaku untuk akun Anda.'],
            ]);
        }

        if ($this->isPhoneTaken($normalizedPhone, $user->id)) {
            $otpRecord->delete();
            throw ValidationException::withMessages([
                'phone_number' => ['Nomor WhatsApp ini sudah digunakan oleh akun lain.'],
            ]);
        }

        $user->update([
            'phone_number' => $normalizedPhone,
            'phone_verified_at' => now(),
        ]);

        $otpRecord->delete();

        return response()->json([
            'message' => 'Nomor WhatsApp berhasil diverifikasi dan disimpan.',
            'requires_phone_verification' => false,
            'user' => $this->formatUserPayload($user->fresh()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out',
        ]);
    }

    public function masterPoli(): JsonResponse
    {
        $polyclinics = Polyclinic::with(['doctors' => function ($query) {
            $query->orderBy('name', 'asc');
        }])->orderBy('name', 'asc')->get();

        return response()->json([
            'data' => $polyclinics,
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        try {
            $status = Password::sendResetLink($request->only('email'));
        } catch (Throwable) {
            return response()->json([
                'message' => 'Gagal mengirim email reset kata sandi. Pastikan konfigurasi SMTP aktif.',
            ], 503);
        }

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Tautan untuk mengatur ulang kata sandi telah dikirim ke email Anda.',
            ]);
        }

        throw ValidationException::withMessages([
            'email' => [$this->translatePasswordStatus($status)],
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', PasswordRule::min(8), 'confirmed'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                // Revoke all active tokens so compromised sessions are terminated immediately.
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Kata sandi berhasil diatur ulang. Silakan masuk menggunakan kata sandi baru Anda.',
            ]);
        }

        throw ValidationException::withMessages([
            'email' => [$this->translatePasswordStatus($status)],
        ]);
    }

    private function validateOtpAttempt(?WhatsappOtp $otpRecord, string $otpInput): void
    {
        if (! $otpRecord) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP tidak ditemukan. Silakan minta pengiriman kode OTP baru.'],
            ]);
        }

        if ($otpRecord->expires_at->isPast()) {
            $otpRecord->delete();
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP sudah kedaluwarsa (melebihi 5 menit). Silakan kirim ulang kode OTP.'],
            ]);
        }

        if ($otpRecord->attempts >= self::OTP_MAX_ATTEMPTS) {
            $otpRecord->delete();
            throw ValidationException::withMessages([
                'otp' => ['Terlalu banyak percobaan OTP yang salah. Silakan kirim ulang kode OTP baru.'],
            ]);
        }

        if (! Hash::check($otpInput, $otpRecord->code_hash)) {
            $otpRecord->increment('attempts');
            $remaining = self::OTP_MAX_ATTEMPTS - $otpRecord->attempts;

            if ($remaining <= 0) {
                $otpRecord->delete();
                throw ValidationException::withMessages([
                    'otp' => ['Kode OTP salah 5 kali. Demi keamanan, silakan kirim ulang kode OTP baru.'],
                ]);
            }

            throw ValidationException::withMessages([
                'otp' => ["Kode OTP tidak sesuai. Sisa kesempatan percobaan: {$remaining} kali."],
            ]);
        }
    }

    private function resolveGoogleProfile(array $validated): array
    {
        if (! empty($validated['credential'])) {
            try {
                $response = Http::timeout(5)->get('https://oauth2.googleapis.com/tokeninfo', [
                    'id_token' => $validated['credential'],
                ]);

                if (! $response->successful()) {
                    throw ValidationException::withMessages([
                        'google' => ['Token autentikasi Google tidak sah atau sudah kedaluwarsa.'],
                    ]);
                }

                $tokenInfo = $response->json();
                $configuredClientId = config('services.google.client_id');

                if (! empty($configuredClientId) && ($tokenInfo['aud'] ?? '') !== $configuredClientId) {
                    throw ValidationException::withMessages([
                        'google' => ['Client ID Google tidak cocok dengan konfigurasi aplikasi.'],
                    ]);
                }

                return [
                    'email' => $tokenInfo['email'],
                    'name' => $tokenInfo['name'] ?? explode('@', $tokenInfo['email'])[0],
                    'google_id' => $tokenInfo['sub'],
                ];
            } catch (ValidationException $e) {
                throw $e;
            } catch (Throwable) {
                throw ValidationException::withMessages([
                    'google' => ['Gagal memverifikasi akun Google. Periksa koneksi internet Anda.'],
                ]);
            }
        }

        if (app()->environment(['local', 'testing']) && ! empty($validated['email'])) {
            return [
                'email' => $validated['email'],
                'name' => $validated['name'] ?? explode('@', $validated['email'])[0],
                'google_id' => $validated['google_id'] ?? 'google-'.md5($validated['email']),
            ];
        }

        throw ValidationException::withMessages([
            'google' => ['Kredensial akun Google diperlukan untuk melanjutkan.'],
        ]);
    }

    private function isPhoneTaken(string $normalizedPhone, ?int $ignoreUserId = null): bool
    {
        $localFormat = str_starts_with($normalizedPhone, '62')
            ? '0'.substr($normalizedPhone, 2)
            : $normalizedPhone;

        return User::where(function ($query) use ($normalizedPhone, $localFormat) {
            $query->where('phone_number', $normalizedPhone)
                ->orWhere('phone_number', $localFormat);
        })
            ->when($ignoreUserId !== null, fn ($q) => $q->where('id', '!=', $ignoreUserId))
            ->exists();
    }

    private function maskPhone(string $phone): string
    {
        $len = strlen($phone);
        if ($len <= 6) {
            return $phone;
        }

        return substr($phone, 0, 5).'••••'.substr($phone, -3);
    }

    private function formatUserPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone_number' => $user->phone_number,
            'phone_verified' => $user->hasVerifiedPhone(),
        ];
    }

    private function translatePasswordStatus(string $status): string
    {
        return match ($status) {
            Password::INVALID_USER => 'Kami tidak dapat menemukan pengguna dengan alamat email tersebut.',
            Password::INVALID_TOKEN => 'Token pengaturan ulang kata sandi tidak sah atau sudah kedaluwarsa.',
            Password::RESET_THROTTLED => 'Harap tunggu beberapa saat sebelum mencoba mengirim ulang permintaan.',
            default => 'Permintaan pengaturan ulang kata sandi tidak dapat diproses.',
        };
    }
}
