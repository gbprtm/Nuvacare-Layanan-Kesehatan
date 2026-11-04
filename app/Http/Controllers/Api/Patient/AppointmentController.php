<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Doctor;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    public function availableSlots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'doctor_id' => ['required', 'exists:doctors,id'],
            'date' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $bookedTimes = Appointment::where('doctor_id', $validated['doctor_id'])
            ->whereDate('appointment_date', $validated['date'])
            ->where('status', 'terjadwal')
            ->pluck('appointment_time')
            ->all();

        $slots = array_map(fn (string $time) => [
            'time' => $time,
            'available' => ! in_array($time, $bookedTimes, true),
        ], Appointment::TIME_SLOTS);

        return response()->json([
            'data' => $slots,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        // Include 'dibatalkan' so patients can read doctor_notes when admin cancels due to a schedule conflict
        $appointments = Appointment::with(['polyclinic', 'doctor'])
            ->where('user_id', $request->user()->id)
            ->where('type', 'janji_baru')
            ->whereIn('status', ['terjadwal', 'dibatalkan'])
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
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
            'appointment_time' => ['nullable', Rule::in(Appointment::TIME_SLOTS)],
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

        $bookedTimes = Appointment::where('doctor_id', $validated['doctor_id'])
            ->whereDate('appointment_date', $validated['appointment_date'])
            ->where('status', 'terjadwal')
            ->pluck('appointment_time')
            ->all();

        $selectedTime = $validated['appointment_time'] ?? null;

        if ($selectedTime !== null) {
            if (in_array($selectedTime, $bookedTimes, true)) {
                return $this->slotUnavailableResponse();
            }
        } else {
            $availableSlots = array_values(array_diff(Appointment::TIME_SLOTS, $bookedTimes));
            if (empty($availableSlots)) {
                return $this->slotUnavailableResponse();
            }
            $selectedTime = $availableSlots[0];
        }

        try {
            $appointment = Appointment::create([
                'user_id' => $request->user()->id,
                'polyclinic_id' => $validated['polyclinic_id'],
                'doctor_id' => $validated['doctor_id'],
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $selectedTime,
                'type' => 'janji_baru',
                'status' => 'terjadwal',
                'complaint' => $validated['complaint'] ?? null,
            ]);
        } catch (UniqueConstraintViolationException) {
            return $this->slotUnavailableResponse();
        }

        $appointment->load(['polyclinic', 'doctor']);

        return response()->json([
            'message' => 'Janji temu berhasil dibuat',
            'data' => $appointment,
        ], 201);
    }

    private function slotUnavailableResponse(): JsonResponse
    {
        $msg = 'Jadwal dokter pada tanggal dan jam tersebut sudah terisi. Silakan pilih jam atau jadwal lain.';

        return response()->json([
            'message' => $msg,
            'errors' => [
                'appointment_time' => [$msg],
            ],
        ], 422);
    }
}
