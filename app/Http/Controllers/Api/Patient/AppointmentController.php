<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\DoctorSlotRequest;
use App\Models\StatusChangeLog;
use App\Services\CancellationRequestService;
use App\Services\StatusChangeLogger;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AppointmentController extends Controller
{
    public function availableSlots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'doctor_id' => ['required', 'exists:doctors,id'],
            'date' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $allSlots = $this->resolveSlotsForDoctorDate(
            (int) $validated['doctor_id'],
            (string) $validated['date'],
        );

        $bookedTimes = Appointment::where('doctor_id', $validated['doctor_id'])
            ->whereDate('appointment_date', $validated['date'])
            ->where('status', 'terjadwal')
            ->pluck('appointment_time')
            ->all();

        $slots = array_map(fn (string $time) => [
            'time' => $time,
            'available' => ! in_array($time, $bookedTimes, true),
        ], $allSlots);

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
            'appointment_time' => ['nullable', 'date_format:H:i'],
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

        $allSlots = $this->resolveSlotsForDoctorDate(
            (int) $validated['doctor_id'],
            (string) $validated['appointment_date'],
        );

        $bookedTimes = Appointment::where('doctor_id', $validated['doctor_id'])
            ->whereDate('appointment_date', $validated['appointment_date'])
            ->where('status', 'terjadwal')
            ->pluck('appointment_time')
            ->all();

        $selectedTime = $validated['appointment_time'] ?? null;

        if ($selectedTime !== null) {
            if (! in_array($selectedTime, $allSlots, true) || in_array($selectedTime, $bookedTimes, true)) {
                return $this->slotUnavailableResponse();
            }
        } else {
            $availableSlots = array_values(array_diff($allSlots, $bookedTimes));
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

    public function cancel(
        Request $request,
        int $id,
        CancellationRequestService $cancellationService,
        StatusChangeLogger $logger,
    ): JsonResponse {
        $user = $request->user();

        $appointment = Appointment::query()
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (! $appointment) {
            return response()->json([
                'message' => 'Janji temu tidak ditemukan.',
            ], 404);
        }

        if ($appointment->status !== 'terjadwal') {
            return response()->json([
                'message' => 'Hanya janji temu berstatus terjadwal yang dapat dibatalkan.',
            ], 409);
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $reason = isset($validated['reason']) && trim((string) $validated['reason']) !== ''
            ? trim((string) $validated['reason'])
            : 'Dibatalkan mandiri oleh pasien.';

        $result = DB::transaction(function () use ($appointment, $user, $reason, $logger): array {
            $locked = Appointment::query()
                ->whereKey($appointment->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                return [
                    'status' => 404,
                    'message' => 'Janji temu tidak ditemukan.',
                ];
            }

            if ($locked->status !== 'terjadwal') {
                return [
                    'status' => 409,
                    'message' => 'Hanya janji temu berstatus terjadwal yang dapat dibatalkan.',
                ];
            }

            $locked->update([
                'status' => 'dibatalkan',
            ]);

            $logger->log(
                subjectType: StatusChangeLog::SUBJECT_APPOINTMENT,
                subjectId: $locked->id,
                actor: $user,
                fromStatus: 'terjadwal',
                toStatus: 'dibatalkan',
                reason: $reason,
            );

            return [
                'status' => 200,
                'appointment' => $locked,
            ];
        });

        if ($result['status'] !== 200) {
            return response()->json([
                'message' => $result['message'],
            ], $result['status']);
        }

        /** @var Appointment $cancelledAppointment */
        $cancelledAppointment = $result['appointment'];
        $cancelledAppointment->load(['user', 'polyclinic', 'doctor']);

        $voidedCount = $cancellationService->voidOpenRequestsForAppointment(
            $cancelledAppointment,
            $user,
            'Janji temu dibatalkan mandiri oleh pasien.',
        );

        return response()->json([
            'message' => 'Janji temu berhasil dibatalkan.',
            'data' => $cancelledAppointment,
            'voided_requests_count' => $voidedCount,
        ]);
    }

    /**
     * @return list<string>
     */
    private function resolveSlotsForDoctorDate(int $doctorId, string $date): array
    {
        $slots = Appointment::TIME_SLOTS;

        if (! class_exists(DoctorSlotRequest::class) || ! Schema::hasTable('doctor_slot_requests')) {
            return $slots;
        }

        $targetDate = Carbon::parse($date)->toDateString();

        $approvedRequests = DoctorSlotRequest::query()
            ->where('doctor_id', $doctorId)
            ->whereDate('schedule_date', $targetDate)
            ->where('status', 'disetujui')
            ->orderBy('start_time', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        foreach ($approvedRequests as $slotRequest) {
            $slots = array_merge($slots, $this->expandSlotRequestTimes($slotRequest, $targetDate));
        }

        $uniqueSlots = array_values(array_unique($slots));
        sort($uniqueSlots);

        return $uniqueSlots;
    }

    /**
     * @return list<string>
     */
    private function expandSlotRequestTimes(DoctorSlotRequest $slotRequest, string $date): array
    {
        $start = Carbon::parse("{$date} {$slotRequest->start_time}");
        $end = Carbon::parse("{$date} {$slotRequest->end_time}");

        if ($start->greaterThanOrEqualTo($end)) {
            return [];
        }

        $quota = max(1, (int) $slotRequest->quota);
        if ($quota === 1) {
            return [$start->format('H:i')];
        }

        $hourly = [];
        $cursor = $start->copy();
        while ($cursor->lessThan($end)) {
            $hourly[] = $cursor->format('H:i');
            $cursor->addHour();
        }

        if (count($hourly) >= $quota) {
            return array_slice($hourly, 0, $quota);
        }

        $totalMinutes = $start->diffInMinutes($end);
        $stepMinutes = max(1, (int) floor($totalMinutes / $quota));

        $generated = [];
        $cursor = $start->copy();
        while ($cursor->lessThan($end) && count($generated) < $quota) {
            $generated[] = $cursor->format('H:i');
            $cursor->addMinutes($stepMinutes);
        }

        return $generated;
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
