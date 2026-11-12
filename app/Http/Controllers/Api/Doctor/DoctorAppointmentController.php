<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CancellationRequest;
use App\Models\Doctor;
use App\Models\StatusChangeLog;
use App\Services\CancellationRequestService;
use App\Services\StatusChangeLogger;
use App\Services\WhatsAppNotificationService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class DoctorAppointmentController extends Controller
{
    public function index(Request $request, CancellationRequestService $service): JsonResponse
    {
        Gate::authorize('viewAnyAsDoctor', Appointment::class);

        $doctor = $this->resolveDoctor($request);
        $service->expireOverdueRequests($doctor->id);

        $validated = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => [
                'nullable',
                'date',
                Rule::when($request->filled('date_from'), ['after_or_equal:date_from']),
            ],
            'status' => ['nullable', Rule::in(['terjadwal', 'selesai', 'dibatalkan'])],
            'all' => ['nullable'],
        ]);

        $showAll = $request->filled('all')
            && filter_var($request->query('all'), FILTER_VALIDATE_BOOLEAN);
        $hasDateFilter = $request->filled('date_from') || $request->filled('date_to');

        if (! $hasDateFilter && ! $showAll) {
            $dateFrom = now()->toDateString();
            $dateTo = now()->addDays(7)->toDateString();
        } else {
            $dateFrom = $validated['date_from'] ?? null;
            $dateTo = $validated['date_to'] ?? null;
        }

        $appointments = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->with(['polyclinic', 'user', 'doctor', 'openCancellationRequest'])
            ->when($dateFrom !== null, fn ($query) => $query->whereDate('appointment_date', '>=', $dateFrom))
            ->when($dateTo !== null, fn ($query) => $query->whereDate('appointment_date', '<=', $dateTo))
            ->when(! empty($validated['status']), fn ($query) => $query->where('status', $validated['status']))
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $doctor->loadMissing('polyclinic');

        return response()->json([
            'data' => $appointments->map(
                fn (Appointment $appointment): array => $this->formatDoctorAppointmentWithQuickCancel($appointment, $service)
            )->values(),
            'meta' => [
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'polyclinic_id' => $doctor->polyclinic_id,
                    'polyclinic' => $doctor->polyclinic ? [
                        'id' => $doctor->polyclinic->id,
                        'name' => $doctor->polyclinic->name,
                    ] : null,
                ],
            ],
        ]);
    }

    public function show(Request $request, int $id, CancellationRequestService $service): JsonResponse
    {
        Gate::authorize('viewAnyAsDoctor', Appointment::class);

        $doctor = $this->resolveDoctor($request);
        $service->expireOverdueRequests($doctor->id);

        $appointment = Appointment::query()
            ->where('id', $id)
            ->where('doctor_id', $doctor->id)
            ->with([
                'polyclinic',
                'user',
                'doctor',
                'openCancellationRequest',
                'cancellationRequests' => fn ($query) => $query->latest('id'),
            ])
            ->first();

        if (! $appointment) {
            return response()->json([
                'message' => 'Janji temu tidak ditemukan.',
            ], 404);
        }

        Gate::authorize('viewAsDoctor', $appointment);

        $cancellationRequests = $appointment->cancellationRequests->map(
            fn (CancellationRequest $cancellationRequest): array => [
                'id' => $cancellationRequest->id,
                'status' => $cancellationRequest->status,
                'reason_category' => $cancellationRequest->reason_category,
                'reason' => $cancellationRequest->reason,
                'batch_id' => $cancellationRequest->batch_id,
                'admin_note' => $cancellationRequest->admin_note,
                'due_at' => $cancellationRequest->due_at?->toIso8601String(),
                'handled_at' => $cancellationRequest->handled_at?->toIso8601String(),
                'created_at' => $cancellationRequest->created_at?->toIso8601String(),
            ]
        )->values();

        return response()->json([
            'data' => array_merge(
                $this->formatDoctorAppointmentWithQuickCancel($appointment, $service),
                ['cancellation_requests' => $cancellationRequests],
            ),
        ]);
    }

    public function complete(
        Request $request,
        int $id,
        CancellationRequestService $cancellationService,
        StatusChangeLogger $logger,
        WhatsAppNotificationService $whatsApp,
    ): JsonResponse {
        Gate::authorize('viewAnyAsDoctor', Appointment::class);

        $user = $request->user();
        $doctor = $this->resolveDoctor($request);

        $appointment = Appointment::query()
            ->where('id', $id)
            ->where('doctor_id', $doctor->id)
            ->first();

        if (! $appointment) {
            return response()->json([
                'message' => 'Janji temu tidak ditemukan.',
            ], 404);
        }

        Gate::authorize('viewAsDoctor', $appointment);

        if ($appointment->status !== 'terjadwal') {
            return response()->json([
                'message' => 'Hanya janji temu berstatus terjadwal yang dapat diselesaikan.',
            ], 409);
        }

        $validated = $request->validate([
            'doctor_notes' => ['required', 'string', 'min:5', 'max:2000'],
            'follow_up_date' => ['nullable', 'date', 'after_or_equal:today'],
            'follow_up_doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
            'follow_up_time' => ['nullable', Rule::in(Appointment::TIME_SLOTS)],
        ]);

        $doctorNotes = trim($validated['doctor_notes']);
        $followUpDate = $validated['follow_up_date'] ?? null;
        $followUpDoctor = null;

        if ($followUpDate !== null) {
            $followUpDoctorId = ! empty($validated['follow_up_doctor_id'])
                ? (int) $validated['follow_up_doctor_id']
                : $doctor->id;

            $followUpDoctor = Doctor::query()
                ->where('id', $followUpDoctorId)
                ->where('is_active', true)
                ->first();

            if (! $followUpDoctor) {
                return response()->json([
                    'message' => 'Dokter kontrol yang dipilih tidak aktif atau tidak ditemukan.',
                ], 422);
            }
        }

        try {
            $result = DB::transaction(function () use (
                $appointment,
                $doctor,
                $user,
                $doctorNotes,
                $followUpDate,
                $followUpDoctor,
                $validated,
                $logger,
            ): array {
                $locked = Appointment::query()
                    ->whereKey($appointment->id)
                    ->where('doctor_id', $doctor->id)
                    ->lockForUpdate()
                    ->first();

                if (! $locked) {
                    return [
                        'status' => 404,
                        'payload' => ['message' => 'Janji temu tidak ditemukan.'],
                    ];
                }

                if ($locked->status !== 'terjadwal') {
                    return [
                        'status' => 409,
                        'payload' => ['message' => 'Hanya janji temu berstatus terjadwal yang dapat diselesaikan.'],
                    ];
                }

                $locked->update([
                    'status' => 'selesai',
                    'doctor_notes' => $doctorNotes,
                ]);

                $logger->log(
                    subjectType: StatusChangeLog::SUBJECT_APPOINTMENT,
                    subjectId: $locked->id,
                    actor: $user,
                    fromStatus: 'terjadwal',
                    toStatus: 'selesai',
                    reason: $doctorNotes,
                );

                $followUpAppointment = null;

                if ($followUpDate !== null && $followUpDoctor !== null) {
                    $bookedTimes = Appointment::query()
                        ->where('doctor_id', $followUpDoctor->id)
                        ->whereDate('appointment_date', $followUpDate)
                        ->where('status', 'terjadwal')
                        ->pluck('appointment_time')
                        ->all();

                    $requestedTime = $validated['follow_up_time'] ?? null;

                    if ($requestedTime !== null) {
                        if (in_array($requestedTime, $bookedTimes, true)) {
                            $msg = 'Slot waktu kontrol pada tanggal dan jam tersebut sudah terisi.';

                            return [
                                'status' => 422,
                                'payload' => [
                                    'message' => $msg,
                                    'errors' => ['follow_up_time' => [$msg]],
                                ],
                            ];
                        }
                        $selectedTime = $requestedTime;
                    } else {
                        $availableSlots = array_values(array_diff(Appointment::TIME_SLOTS, $bookedTimes));
                        if (empty($availableSlots)) {
                            return [
                                'status' => 422,
                                'payload' => [
                                    'message' => 'Seluruh slot waktu dokter pada tanggal kontrol tersebut sudah penuh.',
                                ],
                            ];
                        }
                        $selectedTime = $availableSlots[0];
                    }

                    $followUpAppointment = Appointment::create([
                        'user_id' => $locked->user_id,
                        'polyclinic_id' => $followUpDoctor->polyclinic_id,
                        'doctor_id' => $followUpDoctor->id,
                        'appointment_date' => $followUpDate,
                        'appointment_time' => $selectedTime,
                        'type' => 'kontrol_rutin',
                        'status' => 'terjadwal',
                        'doctor_notes' => 'Kontrol rutin lanjutan pasca pemeriksaan.',
                    ]);

                    $logger->log(
                        subjectType: StatusChangeLog::SUBJECT_APPOINTMENT,
                        subjectId: $followUpAppointment->id,
                        actor: $user,
                        fromStatus: null,
                        toStatus: 'terjadwal',
                        reason: 'Jadwal kontrol rutin dibuat oleh dokter pemeriksa.',
                    );
                }

                return [
                    'status' => 200,
                    'appointment' => $locked,
                    'follow_up_appointment' => $followUpAppointment,
                ];
            });
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'message' => 'Slot waktu kontrol pada tanggal tersebut sudah terisi.',
            ], 422);
        }

        if ($result['status'] !== 200) {
            return response()->json($result['payload'], $result['status']);
        }

        /** @var Appointment $completedAppointment */
        $completedAppointment = $result['appointment'];
        /** @var Appointment|null $followUpAppointment */
        $followUpAppointment = $result['follow_up_appointment'];

        $cancellationService->voidOpenRequestsForAppointment(
            $completedAppointment,
            $user,
            'Janji temu telah diselesaikan oleh dokter pemeriksa.',
        );

        $completedAppointment->load(['user', 'polyclinic', 'doctor']);
        $whatsappNotification = $whatsApp->notifyScheduleUpdate($completedAppointment, 'update');

        if ($followUpAppointment !== null) {
            $followUpAppointment->load(['user', 'polyclinic', 'doctor']);
            $whatsApp->notifyScheduleUpdate($followUpAppointment, 'update');
        }

        return response()->json([
            'message' => 'Pemeriksaan berhasil diselesaikan.',
            'data' => [
                'id' => $completedAppointment->id,
                'status' => $completedAppointment->status,
                'doctor_notes' => $completedAppointment->doctor_notes,
                'follow_up_appointment' => $followUpAppointment ? [
                    'id' => $followUpAppointment->id,
                    'user_id' => $followUpAppointment->user_id,
                    'polyclinic_id' => $followUpAppointment->polyclinic_id,
                    'doctor_id' => $followUpAppointment->doctor_id,
                    'appointment_date' => $followUpAppointment->appointment_date?->format('Y-m-d'),
                    'appointment_time' => $followUpAppointment->appointment_time,
                    'type' => $followUpAppointment->type,
                    'status' => $followUpAppointment->status,
                ] : null,
            ],
            'whatsapp' => $whatsappNotification,
        ]);
    }

    private function formatDoctorAppointmentWithQuickCancel(
        Appointment $appointment,
        CancellationRequestService $service,
    ): array {
        $createdAt = $appointment->created_at;
        $quickCancelDeadline = $createdAt?->copy()->addMinutes(15);
        $canQuickCancel = $appointment->status === 'terjadwal'
            && $quickCancelDeadline !== null
            && now()->lessThanOrEqualTo($quickCancelDeadline);

        return array_merge(
            $service->formatDoctorAppointmentPayload($appointment),
            [
                'created_at' => $createdAt?->toIso8601String(),
                'can_quick_cancel' => $canQuickCancel,
                'quick_cancel_deadline_at' => $quickCancelDeadline?->toIso8601String(),
            ],
        );
    }

    private function resolveDoctor(Request $request): Doctor
    {
        $doctor = $request->attributes->get('doctor') ?? $request->user()?->doctor;
        abort_if(! $doctor instanceof Doctor, 403, 'Akun dokter belum terhubung dengan data dokter klinik.');

        return $doctor;
    }
}
