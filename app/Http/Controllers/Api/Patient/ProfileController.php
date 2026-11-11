<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\WhatsAppNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password as PasswordRule;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone_number' => $user->phone_number,
                'birth_date' => $user->birth_date?->format('Y-m-d'),
                'gender' => $user->gender,
                'address' => $user->address,
            ],
        ]);
    }

    public function update(Request $request, WhatsAppNotificationService $whatsApp): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone_number' => [
                'nullable',
                'string',
                'max:30',
                function (string $attribute, mixed $value, \Closure $fail) use ($whatsApp, $user) {
                    if ($value === null || trim((string) $value) === '') {
                        return;
                    }

                    $normalized = $whatsApp->normalizePhone((string) $value);
                    if (strlen($normalized) < 10) {
                        $fail('Masukkan nomor WhatsApp yang valid (contoh: 081234567890).');

                        return;
                    }

                    $core = str_starts_with($normalized, '62') ? substr($normalized, 2) : ltrim($normalized, '0');
                    $variants = array_values(array_unique(array_filter([
                        $normalized,
                        '+'.$normalized,
                        '0'.$core,
                        $core,
                        '620'.$core,
                    ])));

                    $taken = User::whereIn('phone_number', $variants)
                        ->where('id', '!=', $user->id)
                        ->exists();

                    if ($taken) {
                        $fail('Nomor WhatsApp ini sudah terdaftar pada akun lain.');
                    }
                },
            ],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', 'in:Laki-laki,Perempuan'],
            'address' => ['nullable', 'string', 'max:1000'],
            'password' => ['nullable', 'string', PasswordRule::min(8), 'confirmed'],
        ]);

        $normalizedPhone = ! empty($validated['phone_number'])
            ? $whatsApp->normalizePhone($validated['phone_number'])
            : null;

        $payload = [
            'name' => $validated['name'],
            'phone_number' => $normalizedPhone,
            'birth_date' => $validated['birth_date'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'address' => $validated['address'] ?? null,
        ];

        if (! empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        $user->update($payload);

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone_number' => $user->phone_number,
                'birth_date' => $user->birth_date?->format('Y-m-d'),
                'gender' => $user->gender,
                'address' => $user->address,
            ],
        ]);
    }
}
