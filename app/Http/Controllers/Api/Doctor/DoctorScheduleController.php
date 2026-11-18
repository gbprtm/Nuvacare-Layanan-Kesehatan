<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DoctorScheduleController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        Gate::authorize('jadwal.kelola');

        $doctor = $this->resolveDoctor($request);
        $doctor->loadMissing('polyclinic');

        return response()->json([
            'data' => [
                'doctor_id' => $doctor->id,
                'doctor_name' => $doctor->name,
                'polyclinic' => $doctor->polyclinic?->only(['id', 'name']),
                'available_dates' => $doctor->normalizedAvailableDates() ?? [],
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        Gate::authorize('jadwal.kelola');

        $doctor = $this->resolveDoctor($request);

        $validated = $request->validate([
            'available_dates' => ['present', 'array'],
            'available_dates.*' => ['date_format:Y-m-d'],
        ]);

        $normalizedDates = collect($validated['available_dates'])
            ->map(fn ($date): string => trim((string) $date))
            ->filter(fn (string $date): bool => (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $date))
            ->unique()
            ->sort()
            ->values()
            ->all();

        $doctor->update([
            'available_dates' => $normalizedDates,
        ]);

        $doctor->loadMissing('polyclinic');

        return response()->json([
            'message' => empty($normalizedDates)
                ? 'Semua tanggal praktik dokter ditutup sementara.'
                : 'Jadwal tanggal praktik Anda berhasil disimpan.',
            'data' => [
                'doctor_id' => $doctor->id,
                'doctor_name' => $doctor->name,
                'polyclinic' => $doctor->polyclinic?->only(['id', 'name']),
                'available_dates' => $normalizedDates,
            ],
        ]);
    }

    private function resolveDoctor(Request $request): Doctor
    {
        $doctor = $request->attributes->get('doctor') ?? $request->user()?->doctor;
        abort_if(! $doctor instanceof Doctor, 403, 'Akun dokter belum terhubung dengan data dokter klinik.');

        return $doctor;
    }
}
