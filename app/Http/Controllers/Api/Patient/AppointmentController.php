<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Doctor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Include 'dibatalkan' so patients can read doctor_notes when admin cancels due to a schedule conflict
        $appointments = Appointment::with(['polyclinic', 'doctor'])
            ->where('user_id', $request->user()->id)
            ->where('type', 'janji_baru')
            ->whereIn('status', ['terjadwal', 'dibatalkan'])
            ->orderBy('appointment_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'data' => $appointments,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'polyclinic_id' => ['required', 'exists:polyclinics,id'],
            'doctor_id' => ['required', 'exists:doctors,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'complaint' => ['nullable', 'string', 'max:500'],
        ]);

        $doctor = Doctor::where('id', $validated['doctor_id'])
            ->where('polyclinic_id', $validated['polyclinic_id'])
            ->where('is_active', true)
            ->first();

        if (! $doctor) {
            return response()->json([
                'message' => 'Dokter yang dipilih tidak sesuai dengan poliklinik atau sedang tidak aktif.',
            ], 422);
        }

        $appointment = Appointment::create([
            'user_id' => $request->user()->id,
            'polyclinic_id' => $validated['polyclinic_id'],
            'doctor_id' => $validated['doctor_id'],
            'appointment_date' => $validated['appointment_date'],
            'type' => 'janji_baru',
            'status' => 'terjadwal',
            'complaint' => $validated['complaint'] ?? null,
        ]);

        $appointment->load(['polyclinic', 'doctor']);

        return response()->json([
            'message' => 'Janji temu berhasil dibuat',
            'data' => $appointment,
        ], 201);
    }
}
