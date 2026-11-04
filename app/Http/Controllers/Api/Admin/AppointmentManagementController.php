<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\User;
use App\Services\WhatsAppNotificationService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppointmentManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Appointment::with(['user', 'polyclinic', 'doctor'])
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'asc')
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

    public function update(Request $request, int $id, WhatsAppNotificationService $whatsApp): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['terjadwal', 'selesai', 'dibatalkan'])],
            'appointment_date' => ['nullable', 'date'],
            'appointment_time' => ['nullable', Rule::in(Appointment::TIME_SLOTS)],
            'doctor_id' => ['nullable', 'exists:doctors,id'],
            'doctor_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $nextStatus = $validated['status'] ?? $appointment->status;
        $nextDate = $validated['appointment_date'] ?? $appointment->appointment_date?->format('Y-m-d');
        $nextTime = $validated['appointment_time'] ?? ($appointment->appointment_time ?? '09:00');
        $nextDoctorId = isset($validated['doctor_id']) ? (int) $validated['doctor_id'] : (int) $appointment->doctor_id;

        if (isset($validated['doctor_id'])) {
            $doctor = Doctor::where('id', $nextDoctorId)
                ->where('polyclinic_id', $appointment->polyclinic_id)
                ->where('is_active', true)
                ->first();

            if (! $doctor) {
                return response()->json([
                    'message' => 'Dokter pengganti harus berasal dari poliklinik yang sama dan berstatus aktif.',
                ], 422);
            }
        }

        $scheduleChanged =
            $nextDate !== $appointment->appointment_date?->format('Y-m-d') ||
            $nextTime !== ($appointment->appointment_time ?? '09:00') ||
            $nextDoctorId !== (int) $appointment->doctor_id;

        $wasCancelled = $nextStatus === 'dibatalkan' && $appointment->status !== 'dibatalkan';

        if ($nextStatus === 'terjadwal') {
            $slotTaken = Appointment::where('doctor_id', $nextDoctorId)
                ->whereDate('appointment_date', $nextDate)
                ->where('appointment_time', $nextTime)
                ->where('status', 'terjadwal')
                ->where('id', '!=', $appointment->id)
                ->exists();

            if ($slotTaken) {
                $msg = 'Jadwal dokter pada tanggal dan jam tersebut sudah terisi pasien lain.';

                return response()->json([
                    'message' => $msg,
                    'errors' => [
                        'appointment_time' => [$msg],
                    ],
                ], 422);
            }
        }

        try {
            $appointment->update([
                'status' => $nextStatus,
                'appointment_date' => $nextDate,
                'appointment_time' => $nextTime,
                'doctor_id' => $nextDoctorId,
                'doctor_notes' => array_key_exists('doctor_notes', $validated)
                    ? $validated['doctor_notes']
                    : $appointment->doctor_notes,
            ]);
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'message' => 'Jadwal dokter pada tanggal dan jam tersebut sudah terisi pasien lain.',
            ], 422);
        }

        $appointment->load(['user', 'polyclinic', 'doctor']);

        $reasonType = $wasCancelled ? 'cancelled' : ($scheduleChanged ? 'rescheduled' : 'update');
        $whatsappNotification = $whatsApp->notifyScheduleUpdate($appointment, $reasonType);

        return response()->json([
            'message' => 'Data janji temu berhasil diperbarui',
            'data' => $appointment,
            'whatsapp' => $whatsappNotification,
        ]);
    }

    public function scheduleControl(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', Rule::exists('users', 'id')->where('role', 'pasien')],
            'polyclinic_id' => ['required', 'exists:polyclinics,id'],
            'doctor_id' => ['required', 'exists:doctors,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'appointment_time' => ['nullable', Rule::in(Appointment::TIME_SLOTS)],
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

        $bookedTimes = Appointment::where('doctor_id', $validated['doctor_id'])
            ->whereDate('appointment_date', $validated['appointment_date'])
            ->where('status', 'terjadwal')
            ->pluck('appointment_time')
            ->all();

        $selectedTime = $validated['appointment_time'] ?? null;

        if ($selectedTime !== null) {
            if (in_array($selectedTime, $bookedTimes, true)) {
                return response()->json([
                    'message' => 'Slot waktu kontrol pada tanggal dan jam tersebut sudah terisi.',
                    'errors' => [
                        'appointment_time' => ['Slot waktu kontrol pada tanggal dan jam tersebut sudah terisi.'],
                    ],
                ], 422);
            }
        } else {
            $availableSlots = array_values(array_diff(Appointment::TIME_SLOTS, $bookedTimes));
            if (empty($availableSlots)) {
                return response()->json([
                    'message' => 'Seluruh slot waktu dokter pada tanggal tersebut sudah penuh.',
                ], 422);
            }
            $selectedTime = $availableSlots[0];
        }

        try {
            $appointment = Appointment::create([
                'user_id' => $validated['user_id'],
                'polyclinic_id' => $validated['polyclinic_id'],
                'doctor_id' => $validated['doctor_id'],
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $selectedTime,
                'type' => 'kontrol_rutin',
                'status' => 'terjadwal',
                'doctor_notes' => $validated['doctor_notes'] ?? 'Kontrol berkala pasca pemeriksaan',
            ]);
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'message' => 'Slot waktu kontrol pada tanggal dan jam tersebut sudah terisi.',
            ], 422);
        }

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
