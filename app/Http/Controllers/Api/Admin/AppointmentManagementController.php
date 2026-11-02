<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppointmentManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Appointment::with(['user', 'polyclinic', 'doctor'])
            ->orderBy('appointment_date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('date')) {
            $query->whereDate('appointment_date', $request->query('date'));
        }

        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->query('doctor_id'));
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['terjadwal', 'selesai', 'dibatalkan'])],
            'doctor_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $appointment->update(array_filter([
            'status' => $validated['status'] ?? null,
            'doctor_notes' => $validated['doctor_notes'] ?? null,
        ], fn ($val) => ! is_null($val)));

        $appointment->load(['user', 'polyclinic', 'doctor']);

        return response()->json([
            'message' => 'Data janji temu berhasil diperbarui',
            'data' => $appointment,
        ]);
    }

    public function scheduleControl(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', Rule::exists('users', 'id')->where('role', 'pasien')],
            'polyclinic_id' => ['required', 'exists:polyclinics,id'],
            'doctor_id' => ['required', 'exists:doctors,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'doctor_notes' => ['nullable', 'string', 'max:2000'],
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
            'user_id' => $validated['user_id'],
            'polyclinic_id' => $validated['polyclinic_id'],
            'doctor_id' => $validated['doctor_id'],
            'appointment_date' => $validated['appointment_date'],
            'type' => 'kontrol_rutin',
            'status' => 'terjadwal',
            'doctor_notes' => $validated['doctor_notes'] ?? 'Kontrol berkala pasca pemeriksaan',
        ]);

        $appointment->load(['user', 'polyclinic', 'doctor']);

        return response()->json([
            'message' => 'Jadwal kontrol berhasil dibuat',
            'data' => $appointment,
        ], 201);
    }

    public function patients(): JsonResponse
    {
        $patients = User::where('role', 'pasien')
            ->orderBy('name', 'asc')
            ->select(['id', 'name', 'email', 'phone_number'])
            ->get();

        return response()->json([
            'data' => $patients,
        ]);
    }
}
