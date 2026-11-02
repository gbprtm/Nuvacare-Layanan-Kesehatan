<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Polyclinic;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    public function publicInfo(): JsonResponse
    {
        $polyclinics = Polyclinic::with(['doctors' => function ($query) {
            $query->where('is_active', true)->orderBy('name', 'asc');
        }])->orderBy('name', 'asc')->get();

        return response()->json([
            'data' => [
                'clinic_name' => 'Klinik Sehat',
                'description' => 'Layanan kesehatan terpercaya untuk Anda dan keluarga dengan dokter spesialis profesional.',
                'address' => 'Jl. Kesehatan Raya No. 45, Jakarta Pusat',
                'contact' => '+62 21 555-0199',
                'polyclinics' => $polyclinics,
            ],
        ]);
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
            'birth_date' => $validated['birth_date'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Pendaftaran akun berhasil',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
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
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
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
