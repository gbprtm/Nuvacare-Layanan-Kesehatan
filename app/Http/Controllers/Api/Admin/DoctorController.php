<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\User;
use App\Services\WhatsAppNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;

class DoctorController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::authorize('dokter.kelola');

        $doctors = Doctor::query()
            ->with(['polyclinic', 'user:id,name,email,phone_number,disabled_at'])
            ->orderBy('name', 'asc')
            ->get()
            ->map(fn (Doctor $doctor): array => $this->formatAdminDoctorPayload($doctor))
            ->values();

        return response()->json([
            'data' => $doctors,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('dokter.kelola');

        $validated = $request->validate([
            'polyclinic_id' => ['required', 'exists:polyclinics,id'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        $doctor = Doctor::create([
            'polyclinic_id' => $validated['polyclinic_id'],
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $doctor->load('polyclinic');

        return response()->json([
            'message' => 'Dokter berhasil ditambahkan',
            'data' => $doctor,
        ], 201);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        Gate::authorize('dokter.kelola');

        $doctor = Doctor::findOrFail($id);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $doctor->update([
            'is_active' => $validated['is_active'],
        ]);

        $doctor->load('polyclinic');

        return response()->json([
            'message' => 'Status ketersediaan dokter berhasil diperbarui',
            'data' => $doctor,
        ]);
    }

    public function provisionAccount(
        Request $request,
        int $id,
        WhatsAppNotificationService $whatsApp,
    ): JsonResponse {
        Gate::authorize('dokter.kelola');

        $doctor = Doctor::findOrFail($id);

        if ($doctor->user_id !== null) {
            return response()->json([
                'message' => 'Dokter ini sudah memiliki akun login yang terhubung.',
            ], 409);
        }

        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone_number' => ['nullable', 'string', 'max:30'],
        ]);

        $normalizedPhone = ! empty($validated['phone_number'])
            ? $whatsApp->normalizePhone($validated['phone_number'])
            : null;

        if ($normalizedPhone === '') {
            $normalizedPhone = null;
        }

        $result = DB::transaction(function () use ($doctor, $validated, $normalizedPhone): array {
            $lockedDoctor = Doctor::query()
                ->whereKey($doctor->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedDoctor->user_id !== null) {
                return ['conflict' => true];
            }

            $user = User::create([
                'name' => $lockedDoctor->name,
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'dokter',
                'phone_number' => $normalizedPhone,
            ]);

            $lockedDoctor->update([
                'user_id' => $user->id,
            ]);

            return [
                'conflict' => false,
                'doctor' => $lockedDoctor,
            ];
        });

        if ($result['conflict']) {
            return response()->json([
                'message' => 'Dokter ini sudah memiliki akun login yang terhubung.',
            ], 409);
        }

        /** @var Doctor $provisionedDoctor */
        $provisionedDoctor = $result['doctor'];
        $provisionedDoctor->load(['polyclinic', 'user:id,name,email,phone_number,disabled_at']);

        return response()->json([
            'message' => 'Akun login dokter berhasil dibuat dan ditautkan.',
            'data' => $this->formatAdminDoctorPayload($provisionedDoctor),
        ], 201);
    }

    public function toggleAccountAccess(Request $request, int $id): JsonResponse
    {
        Gate::authorize('dokter.kelola');

        $doctor = Doctor::with(['polyclinic', 'user'])->findOrFail($id);

        if (! $doctor->user) {
            return response()->json([
                'message' => 'Dokter ini belum memiliki akun login yang terhubung.',
            ], 422);
        }

        $validated = $request->validate([
            'access_enabled' => ['required', 'boolean'],
        ]);

        $enabled = (bool) $validated['access_enabled'];

        DB::transaction(function () use ($doctor, $enabled): void {
            $doctor->user->update([
                'disabled_at' => $enabled ? null : now(),
            ]);

            if (! $enabled) {
                $doctor->user->tokens()->delete();
            }
        });

        $doctor->load(['polyclinic', 'user:id,name,email,phone_number,disabled_at']);

        return response()->json([
            'message' => $enabled
                ? 'Akses akun dokter berhasil diaktifkan.'
                : 'Akses akun dokter berhasil dinonaktifkan.',
            'data' => $this->formatAdminDoctorPayload($doctor),
        ]);
    }

    private function formatAdminDoctorPayload(Doctor $doctor): array
    {
        $account = $doctor->user;

        return [
            'id' => $doctor->id,
            'user_id' => $doctor->user_id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'name' => $doctor->name,
            'is_active' => $doctor->is_active,
            'polyclinic' => $doctor->polyclinic ? [
                'id' => $doctor->polyclinic->id,
                'name' => $doctor->polyclinic->name,
            ] : null,
            'has_account' => $account !== null,
            'account_enabled' => $account !== null && ! $account->isDisabled(),
            'access_enabled' => $account !== null && ! $account->isDisabled(),
            'account_email' => $account?->email,
            'disabled_at' => $account?->disabled_at?->toIso8601String(),
            'user' => $account ? [
                'id' => $account->id,
                'email' => $account->email,
                'phone_number' => $account->phone_number,
                'disabled_at' => $account->disabled_at?->toIso8601String(),
            ] : null,
            'account' => $account ? [
                'id' => $account->id,
                'email' => $account->email,
                'phone_number' => $account->phone_number,
                'disabled_at' => $account->disabled_at?->toIso8601String(),
                'access_enabled' => ! $account->isDisabled(),
            ] : null,
        ];
    }
}
