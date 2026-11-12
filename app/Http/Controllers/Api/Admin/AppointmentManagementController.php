<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CancellationRequest;
use App\Models\Doctor;
use App\Models\StatusChangeLog;
use App\Models\User;
use App\Services\CancellationRequestService;
use App\Services\StatusChangeLogger;
use App\Services\WhatsAppNotificationService;
use Carbon\CarbonInterface;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class AppointmentManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('janji.lihat_semua');

        $query = Appointment::with(['user', 'polyclinic', 'doctor', 'openCancellationRequest'])
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

        $now = now();
        $appointments = $query->get();
        $totalCompletedCount = Appointment::query()->where('status', 'selesai')->count();

        $formatted = $appointments->map(
            fn (Appointment $appointment): array => $this->formatAdminAppointmentPayload($appointment, $now)
        )->values();

        return response()->json([
            'data' => $formatted,
            'meta' => [
                'total_count' => $formatted->count(),
                'completed_count' => $formatted->where('status', 'selesai')->count(),
                'total_completed_count' => $totalCompletedCount,
                'scheduled_count' => $formatted->where('status', 'terjadwal')->count(),
                'cancelled_count' => $formatted->where('status', 'dibatalkan')->count(),
            ],
        ]);
    }

    public function update(
        Request $request,
        int $id,
        WhatsAppNotificationService $whatsApp,
        StatusChangeLogger $logger,
        CancellationRequestService $cancellationService,
    ): JsonResponse {
        Gate::authorize('janji.ubah');

        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['terjadwal', 'selesai', 'dibatalkan'])],
            'appointment_date' => ['nullable', 'date'],
            'appointment_time' => ['nullable', Rule::in(Appointment::TIME_SLOTS)],
            'doctor_id' => ['nullable', 'exists:doctors,id'],
            'doctor_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if (($validated['status'] ?? null) === 'selesai') {
            $msg = 'Status selesai hanya dapat ditetapkan oleh dokter pemeriksa.';

            return response()->json([
                'message' => $msg,
                'errors' => [
                    'status' => [$msg],
                ],
            ], 403);
        }

        try {
            $result = DB::transaction(function () use ($appointment, $validated, $request, $logger): array {
                $locked = Appointment::query()
                    ->whereKey($appointment->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $oldStatus = $locked->status;
                $oldDate = $locked->appointment_date?->format('Y-m-d');
                $oldTime = $locked->appointment_time ?? '09:00';
                $oldDoctorId = (int) $locked->doctor_id;

                $nextStatus = $validated['status'] ?? $oldStatus;
                $nextDate = $validated['appointment_date'] ?? $oldDate;
                $nextTime = $validated['appointment_time'] ?? $oldTime;
                $nextDoctorId = isset($validated['doctor_id']) ? (int) $validated['doctor_id'] : $oldDoctorId;

                if ($nextStatus === 'dibatalkan' && $oldStatus !== 'dibatalkan') {
                    $hasCancellationRequest = CancellationRequest::query()
                        ->where('appointment_id', $locked->id)
                        ->whereIn('status', [
                            CancellationRequest::STATUS_PENDING,
                            CancellationRequest::STATUS_APPROVED,
                        ])
                        ->exists();

                    if (! $hasCancellationRequest) {
                        $msg = 'Pembatalan janji temu sepihak oleh admin tidak diperbolehkan tanpa pengajuan pembatalan dokter.';

                        return [
                            'error' => true,
                            'status_code' => 403,
                            'payload' => [
                                'message' => $msg,
                                'errors' => [
                                    'status' => [$msg],
                                ],
                            ],
                        ];
                    }
                }

                if (isset($validated['doctor_id'])) {
                    $doctor = Doctor::query()
                        ->where('id', $nextDoctorId)
                        ->where('polyclinic_id', $locked->polyclinic_id)
                        ->where('is_active', true)
                        ->first();

                    if (! $doctor) {
                        return [
                            'error' => true,
                            'status_code' => 422,
                            'payload' => [
                                'message' => 'Dokter pengganti harus berasal dari poliklinik yang sama dan berstatus aktif.',
                            ],
                        ];
                    }
                }

                if ($nextStatus === 'terjadwal') {
                    $slotTaken = Appointment::query()
                        ->where('doctor_id', $nextDoctorId)
                        ->whereDate('appointment_date', $nextDate)
                        ->where('appointment_time', $nextTime)
                        ->where('status', 'terjadwal')
                        ->where('id', '!=', $locked->id)
                        ->exists();

                    if ($slotTaken) {
                        $msg = 'Jadwal dokter pada tanggal dan jam tersebut sudah terisi pasien lain.';

                        return [
                            'error' => true,
                            'status_code' => 422,
                            'payload' => [
                                'message' => $msg,
                                'errors' => [
                                    'appointment_time' => [$msg],
                                ],
                            ],
                        ];
                    }
                }

                $scheduleChanged =
                    $nextDate !== $oldDate ||
                    $nextTime !== $oldTime ||
                    $nextDoctorId !== $oldDoctorId;

                $wasCancelled = $nextStatus === 'dibatalkan' && $oldStatus !== 'dibatalkan';

                $locked->update([
                    'status' => $nextStatus,
                    'appointment_date' => $nextDate,
                    'appointment_time' => $nextTime,
                    'doctor_id' => $nextDoctorId,
                    'doctor_notes' => array_key_exists('doctor_notes', $validated)
                        ? $validated['doctor_notes']
                        : $locked->doctor_notes,
                ]);

                if ($oldStatus !== $nextStatus || $scheduleChanged) {
                    $changes = $scheduleChanged ? [
                        'appointment_date' => [
                            'old' => $oldDate,
                            'new' => $nextDate,
                        ],
                        'appointment_time' => [
                            'old' => $oldTime,
                            'new' => $nextTime,
                        ],
                        'doctor_id' => [
                            'old' => $oldDoctorId,
                            'new' => $nextDoctorId,
                        ],
                    ] : null;

                    $reasonNote = array_key_exists('doctor_notes', $validated)
                        ? trim((string) ($validated['doctor_notes'] ?? ''))
                        : '';

                    $logger->log(
                        subjectType: StatusChangeLog::SUBJECT_APPOINTMENT,
                        subjectId: $locked->id,
                        actor: $request->user(),
                        fromStatus: $oldStatus,
                        toStatus: $nextStatus,
                        reason: $reasonNote !== '' ? $reasonNote : 'Pembaruan oleh admin',
                        changes: $changes,
                    );
                }

                return [
                    'error' => false,
                    'appointment' => $locked,
                    'old_doctor_id' => $oldDoctorId,
                    'next_doctor_id' => $nextDoctorId,
                    'next_status' => $nextStatus,
                    'schedule_changed' => $scheduleChanged,
                    'was_cancelled' => $wasCancelled,
                ];
            });
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'message' => 'Jadwal dokter pada tanggal dan jam tersebut sudah terisi pasien lain.',
            ], 422);
        }

        if ($result['error']) {
            return response()->json($result['payload'], $result['status_code'] ?? 422);
        }

        /** @var Appointment $updatedAppointment */
        $updatedAppointment = $result['appointment'];
        $nextStatus = $result['next_status'];
        $scheduleChanged = $result['schedule_changed'];
        $doctorChanged = $result['next_doctor_id'] !== $result['old_doctor_id'];

        if ($nextStatus !== 'terjadwal' || $doctorChanged || $scheduleChanged) {
            $voidReason = match (true) {
                $nextStatus === 'dibatalkan' => 'Janji temu telah dibatalkan oleh admin secara langsung.',
                $nextStatus === 'selesai' => 'Janji temu telah diselesaikan oleh admin secara langsung.',
                default => 'Janji telah dijadwalkan ulang oleh admin secara langsung.',
            };

            $cancellationService->voidOpenRequestsForAppointment(
                $updatedAppointment,
                $request->user(),
                $voidReason,
            );
        }

        $updatedAppointment->load(['user', 'polyclinic', 'doctor']);

        $reasonType = $result['was_cancelled']
            ? 'cancelled'
            : ($scheduleChanged ? 'rescheduled' : 'update');

        $whatsappNotification = $whatsApp->notifyScheduleUpdate($updatedAppointment, $reasonType);

        return response()->json([
            'message' => 'Data janji temu berhasil diperbarui',
            'data' => $updatedAppointment,
            'whatsapp' => $whatsappNotification,
        ]);
    }

    public function scheduleControl(Request $request, StatusChangeLogger $logger): JsonResponse
    {
        Gate::authorize('janji.buat_kontrol');

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
            $appointment = DB::transaction(function () use ($validated, $selectedTime, $request, $logger): Appointment {
                $created = Appointment::create([
                    'user_id' => $validated['user_id'],
                    'polyclinic_id' => $validated['polyclinic_id'],
                    'doctor_id' => $validated['doctor_id'],
                    'appointment_date' => $validated['appointment_date'],
                    'appointment_time' => $selectedTime,
                    'type' => 'kontrol_rutin',
                    'status' => 'terjadwal',
                    'doctor_notes' => $validated['doctor_notes'] ?? 'Kontrol berkala pasca pemeriksaan',
                ]);

                $logger->log(
                    subjectType: StatusChangeLog::SUBJECT_APPOINTMENT,
                    subjectId: $created->id,
                    actor: $request->user(),
                    fromStatus: null,
                    toStatus: 'terjadwal',
                    reason: 'Jadwal kontrol dibuat oleh admin.',
                );

                return $created;
            });
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
        Gate::authorize('janji.lihat_semua');

        $patients = User::where('role', 'pasien')
            ->orderBy('name', 'asc')
            ->select(['id', 'name', 'email', 'phone_number'])
            ->get();

        return response()->json([
            'data' => $patients,
        ]);
    }

    private function formatAdminAppointmentPayload(Appointment $appointment, CarbonInterface $now): array
    {
        $openRequest = $appointment->openCancellationRequest;
        $openRequestPayload = null;
        if ($openRequest !== null) {
            $openRequestPayload = [
                'id' => $openRequest->id,
                'appointment_id' => $openRequest->appointment_id,
                'doctor_id' => $openRequest->doctor_id,
                'reason_category' => $openRequest->reason_category,
                'reason' => $openRequest->reason,
                'status' => $openRequest->status,
                'batch_id' => $openRequest->batch_id,
                'due_at' => $openRequest->due_at?->toIso8601String(),
                'is_overdue' => $openRequest->due_at !== null && $openRequest->due_at->lessThanOrEqualTo($now),
                'created_at' => $openRequest->created_at?->toIso8601String(),
            ];
        }

        $sanitizedUser = $this->formatAdminUserPrivacy($appointment->user);

        return [
            'id' => $appointment->id,
            'user_id' => $appointment->user_id,
            'polyclinic_id' => $appointment->polyclinic_id,
            'doctor_id' => $appointment->doctor_id,
            'appointment_date' => $appointment->appointment_date?->format('Y-m-d'),
            'appointment_time' => $appointment->appointment_time,
            'type' => $appointment->type,
            'status' => $appointment->status,
            'complaint' => $appointment->complaint,
            'doctor_notes' => $appointment->doctor_notes,
            'created_at' => $appointment->created_at?->toIso8601String(),
            'updated_at' => $appointment->updated_at?->toIso8601String(),
            'user' => $sanitizedUser,
            'patient' => $sanitizedUser,
            'polyclinic' => $appointment->polyclinic ? [
                'id' => $appointment->polyclinic->id,
                'name' => $appointment->polyclinic->name,
            ] : null,
            'doctor' => $appointment->doctor ? [
                'id' => $appointment->doctor->id,
                'polyclinic_id' => $appointment->doctor->polyclinic_id,
                'name' => $appointment->doctor->name,
                'is_active' => $appointment->doctor->is_active,
                'schedule_label' => $appointment->doctor->schedule_label,
            ] : null,
            'open_cancellation_request' => $openRequestPayload,
        ];
    }

    private function formatAdminUserPrivacy(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        $initialName = $this->formatInitialName($user->name);
        $medicalRecordId = 'RM-'.str_pad((string) $user->id, 4, '0', STR_PAD_LEFT);

        return [
            'id' => $user->id,
            'medical_record_id' => $medicalRecordId,
            'name' => $initialName,
            'initial_name' => $initialName,
        ];
    }

    private function formatInitialName(?string $name): string
    {
        $trimmed = trim((string) ($name ?? ''));
        if ($trimmed === '') {
            return 'Pasien';
        }

        $parts = preg_split('/\s+/', $trimmed) ?: [];
        if (count($parts) <= 1) {
            return $parts[0] ?? 'Pasien';
        }

        $first = array_shift($parts);
        $initials = array_map(
            fn (string $part): string => mb_strtoupper(mb_substr($part, 0, 1)).'.',
            $parts,
        );

        return trim($first.' '.implode(' ', $initials));
    }
}
