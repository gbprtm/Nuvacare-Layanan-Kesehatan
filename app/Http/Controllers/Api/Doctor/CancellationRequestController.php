<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CancellationRequest;
use App\Models\Doctor;
use App\Models\StatusChangeLog;
use App\Models\User;
use App\Services\CancellationRequestService;
use App\Services\StatusChangeLogger;
use App\Services\WhatsAppNotificationService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CancellationRequestController extends Controller
{
    public function index(Request $request, CancellationRequestService $service): JsonResponse
    {
        Gate::authorize('pengajuan.lihat_milik');

        $doctor = $this->resolveDoctor($request);
        $service->expireOverdueRequests($doctor->id);

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(CancellationRequest::STATUSES)],
        ]);

        $requests = CancellationRequest::query()
            ->where('doctor_id', $doctor->id)
            ->with(['appointment.polyclinic', 'appointment.user', 'handler:id,name'])
            ->when(! empty($validated['status']), fn ($query) => $query->where('status', $validated['status']))
            ->latest('id')
            ->get();

        return response()->json([
            'data' => $requests->map(
                fn (CancellationRequest $cancellationRequest): array => $this->formatCancellationRequestPayload($cancellationRequest, $service)
            )->values(),
        ]);
    }

    public function store(
        Request $request,
        int $appointmentId,
        CancellationRequestService $service,
        StatusChangeLogger $logger,
        WhatsAppNotificationService $whatsApp,
    ): JsonResponse {
        Gate::authorize('pengajuan.ajukan');

        $user = $request->user();
        $doctor = $this->resolveDoctor($request);

        $appointment = Appointment::query()
            ->where('id', $appointmentId)
            ->where('doctor_id', $doctor->id)
            ->first();

        if (! $appointment) {
            return response()->json([
                'message' => 'Janji temu tidak ditemukan.',
            ], 404);
        }

        Gate::authorize('requestCancellation', $appointment);

        $validated = $request->validate([
            'reason_category' => ['required', Rule::in(CancellationRequest::REASON_CATEGORIES)],
            'reason' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        $service->expireOverdueRequests($doctor->id);

        $eligibility = $service->canDoctorRequestCancellation($appointment, $doctor);
        if (! $eligibility['eligible']) {
            return response()->json([
                'message' => $eligibility['reason'],
            ], $eligibility['code'] ?? 422);
        }

        try {
            $result = DB::transaction(function () use ($appointment, $doctor, $user, $validated, $service, $logger): array {
                $lockedAppointment = Appointment::query()
                    ->whereKey($appointment->id)
                    ->where('doctor_id', $doctor->id)
                    ->lockForUpdate()
                    ->first();

                if (! $lockedAppointment) {
                    return [
                        'eligible' => false,
                        'code' => 404,
                        'reason' => 'Janji temu tidak ditemukan.',
                    ];
                }

                return $this->createPendingRequestInTransaction(
                    $lockedAppointment,
                    $doctor,
                    $user,
                    $validated['reason_category'],
                    trim($validated['reason']),
                    null,
                    $service,
                    $logger,
                );
            });
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'message' => 'Janji temu ini sudah memiliki pengajuan pembatalan yang sedang diproses.',
            ], 409);
        }

        if (! ($result['eligible'] ?? false)) {
            return response()->json([
                'message' => $result['reason'],
            ], $result['code'] ?? 409);
        }

        /** @var CancellationRequest $createdRequest */
        $createdRequest = $result['request'];
        $createdRequest->load(['appointment.polyclinic', 'appointment.user', 'handler:id,name']);

        $whatsApp->notifyAdminsNewRequest($doctor, [$createdRequest]);

        return response()->json([
            'message' => 'Pengajuan pembatalan berhasil dikirim ke admin klinik.',
            'data' => $this->formatCancellationRequestPayload($createdRequest, $service),
        ], 201);
    }

    public function storeBatch(
        Request $request,
        CancellationRequestService $service,
        StatusChangeLogger $logger,
        WhatsAppNotificationService $whatsApp,
    ): JsonResponse {
        Gate::authorize('pengajuan.ajukan');

        $user = $request->user();
        $doctor = $this->resolveDoctor($request);

        $validated = $request->validate([
            'date_from' => ['required', 'date', 'after_or_equal:today'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'reason_category' => ['required', Rule::in(CancellationRequest::REASON_CATEGORIES)],
            'reason' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        $maxDays = (int) config('clinic.batch_max_days', 14);
        $fromDate = Carbon::parse($validated['date_from'])->startOfDay();
        $toDate = Carbon::parse($validated['date_to'])->startOfDay();

        if ($fromDate->diffInDays($toDate) > $maxDays) {
            throw ValidationException::withMessages([
                'date_to' => ["Rentang pengajuan massal maksimal {$maxDays} hari dari tanggal mulai."],
            ]);
        }

        $service->expireOverdueRequests($doctor->id);

        $appointments = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', '>=', $fromDate->toDateString())
            ->whereDate('appointment_date', '<=', $toDate->toDateString())
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $batchId = (string) Str::uuid();
        $reasonText = trim($validated['reason']);
        $createdModels = [];
        $skipped = [];

        foreach ($appointments as $appointment) {
            try {
                $result = DB::transaction(function () use (
                    $appointment,
                    $doctor,
                    $user,
                    $validated,
                    $reasonText,
                    $batchId,
                    $service,
                    $logger,
                ): array {
                    $lockedAppointment = Appointment::query()
                        ->whereKey($appointment->id)
                        ->where('doctor_id', $doctor->id)
                        ->lockForUpdate()
                        ->first();

                    if (! $lockedAppointment) {
                        return [
                            'eligible' => false,
                            'code' => 404,
                            'reason' => 'Janji temu tidak ditemukan.',
                        ];
                    }

                    return $this->createPendingRequestInTransaction(
                        $lockedAppointment,
                        $doctor,
                        $user,
                        $validated['reason_category'],
                        $reasonText,
                        $batchId,
                        $service,
                        $logger,
                    );
                });
            } catch (UniqueConstraintViolationException) {
                $skipped[] = [
                    'id' => $appointment->id,
                    'appointment_date' => $appointment->appointment_date?->format('Y-m-d'),
                    'appointment_time' => $appointment->appointment_time,
                    'reason' => 'Janji temu ini sudah memiliki pengajuan pembatalan yang sedang diproses.',
                ];

                continue;
            }

            if ($result['eligible'] ?? false) {
                $createdRequest = $result['request'];
                $createdRequest->load(['appointment.polyclinic', 'appointment.user', 'handler:id,name']);
                $createdModels[] = $createdRequest;
            } else {
                $skipped[] = [
                    'id' => $appointment->id,
                    'appointment_date' => $appointment->appointment_date?->format('Y-m-d'),
                    'appointment_time' => $appointment->appointment_time,
                    'reason' => $result['reason'],
                ];
            }
        }

        if (count($createdModels) > 0) {
            $whatsApp->notifyAdminsNewRequest($doctor, $createdModels, $batchId);
        }

        $createdPayloads = array_map(
            fn (CancellationRequest $createdRequest): array => $this->formatCancellationRequestPayload($createdRequest, $service),
            $createdModels,
        );

        return response()->json([
            'message' => count($createdPayloads) > 0
                ? 'Pengajuan pembatalan massal berhasil diproses.'
                : 'Tidak ada janji temu yang memenuhi syarat untuk diajukan pembatalan.',
            'data' => [
                'batch_id' => $batchId,
                'created' => $createdPayloads,
                'skipped' => $skipped,
            ],
        ], 201);
    }

    public function withdraw(
        Request $request,
        int $id,
        CancellationRequestService $service,
        StatusChangeLogger $logger,
    ): JsonResponse {
        Gate::authorize('pengajuan.tarik_milik');

        $user = $request->user();
        $doctor = $this->resolveDoctor($request);

        $cancellationRequest = CancellationRequest::query()
            ->where('id', $id)
            ->where('doctor_id', $doctor->id)
            ->first();

        if (! $cancellationRequest) {
            return response()->json([
                'message' => 'Pengajuan pembatalan tidak ditemukan.',
            ], 404);
        }

        Gate::authorize('withdraw', $cancellationRequest);

        $result = DB::transaction(function () use ($cancellationRequest, $doctor, $user, $logger): array {
            $locked = CancellationRequest::query()
                ->whereKey($cancellationRequest->id)
                ->where('doctor_id', $doctor->id)
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                return ['status' => 404, 'message' => 'Pengajuan pembatalan tidak ditemukan.'];
            }

            if ($locked->status !== CancellationRequest::STATUS_PENDING) {
                return [
                    'status' => 409,
                    'message' => 'Pengajuan ini sudah ditindak dan tidak dapat ditarik lagi.',
                ];
            }

            $locked->update([
                'status' => CancellationRequest::STATUS_WITHDRAWN,
                'handled_by' => null,
                'handled_at' => now(),
            ]);

            $logger->log(
                subjectType: StatusChangeLog::SUBJECT_CANCELLATION_REQUEST,
                subjectId: $locked->id,
                actor: $user,
                fromStatus: CancellationRequest::STATUS_PENDING,
                toStatus: CancellationRequest::STATUS_WITHDRAWN,
                reason: 'Ditarik kembali oleh dokter.',
            );

            return ['status' => 200, 'request' => $locked];
        });

        if ($result['status'] !== 200) {
            return response()->json([
                'message' => $result['message'],
            ], $result['status']);
        }

        /** @var CancellationRequest $withdrawnRequest */
        $withdrawnRequest = $result['request'];
        $withdrawnRequest->load(['appointment.polyclinic', 'appointment.user', 'handler:id,name']);

        return response()->json([
            'message' => 'Pengajuan pembatalan berhasil ditarik.',
            'data' => $this->formatCancellationRequestPayload($withdrawnRequest, $service),
        ]);
    }

    public function quickCancel(
        Request $request,
        int $id,
        CancellationRequestService $service,
        StatusChangeLogger $logger,
        WhatsAppNotificationService $whatsApp,
    ): JsonResponse {
        Gate::authorize('pengajuan.ajukan');

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

        Gate::authorize('requestCancellation', $appointment);

        if ($appointment->status !== 'terjadwal') {
            return response()->json([
                'message' => 'Pembatalan cepat hanya dapat dilakukan untuk janji temu berstatus terjadwal.',
            ], 409);
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $graceDeadline = $appointment->created_at?->copy()->addMinutes(15);
        if ($graceDeadline === null || now()->greaterThan($graceDeadline)) {
            return response()->json([
                'message' => 'Jendela pembatalan cepat (15 menit pertama) telah berakhir. Silakan gunakan pengajuan pembatalan resmi.',
            ], 422);
        }

        $reason = isset($validated['reason']) && trim((string) $validated['reason']) !== ''
            ? trim((string) $validated['reason'])
            : 'Pembatalan cepat oleh dokter dalam jendela 15 menit pertama.';

        $result = DB::transaction(function () use ($appointment, $doctor, $user, $reason, $logger): array {
            $lockedAppointment = Appointment::query()
                ->whereKey($appointment->id)
                ->where('doctor_id', $doctor->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedAppointment) {
                return [
                    'status' => 404,
                    'message' => 'Janji temu tidak ditemukan.',
                ];
            }

            if ($lockedAppointment->status !== 'terjadwal') {
                return [
                    'status' => 409,
                    'message' => 'Pembatalan cepat hanya dapat dilakukan untuk janji temu berstatus terjadwal.',
                ];
            }

            $lockedDeadline = $lockedAppointment->created_at?->copy()->addMinutes(15);
            if ($lockedDeadline === null || now()->greaterThan($lockedDeadline)) {
                return [
                    'status' => 422,
                    'message' => 'Jendela pembatalan cepat (15 menit pertama) telah berakhir. Silakan gunakan pengajuan pembatalan resmi.',
                ];
            }

            $lockedAppointment->update([
                'status' => 'dibatalkan',
            ]);

            $logger->log(
                subjectType: StatusChangeLog::SUBJECT_APPOINTMENT,
                subjectId: $lockedAppointment->id,
                actor: $user,
                fromStatus: 'terjadwal',
                toStatus: 'dibatalkan',
                reason: $reason,
                changes: ['quick_cancel' => true],
            );

            return [
                'status' => 200,
                'appointment' => $lockedAppointment,
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

        $service->voidOpenRequestsForAppointment(
            $cancelledAppointment,
            $user,
            'Janji temu dibatalkan cepat oleh dokter dalam jendela 15 menit.',
        );

        $whatsappNotification = $whatsApp->notifyScheduleUpdate($cancelledAppointment, 'cancelled');
        $whatsApp->notifyAdminsNewRequest($doctor, [$cancelledAppointment]);

        return response()->json([
            'message' => 'Janji temu berhasil dibatalkan dalam jendela pembatalan cepat 15 menit.',
            'data' => $service->formatDoctorAppointmentPayload($cancelledAppointment),
            'whatsapp' => $whatsappNotification,
        ]);
    }

    /**
     * @return array{eligible: bool, code?: ?int, reason?: ?string, request?: CancellationRequest}
     */
    private function createPendingRequestInTransaction(
        Appointment $lockedAppointment,
        Doctor $doctor,
        User $user,
        string $reasonCategory,
        string $reason,
        ?string $batchId,
        CancellationRequestService $service,
        StatusChangeLogger $logger,
    ): array {
        $eligibility = $service->canDoctorRequestCancellation($lockedAppointment, $doctor);
        if (! $eligibility['eligible']) {
            return $eligibility;
        }

        $created = CancellationRequest::create([
            'appointment_id' => $lockedAppointment->id,
            'doctor_id' => $doctor->id,
            'requested_by' => $user->id,
            'reason_category' => $reasonCategory,
            'reason' => $reason,
            'status' => CancellationRequest::STATUS_PENDING,
            'batch_id' => $batchId,
            'due_at' => $service->computeDueAt($lockedAppointment),
        ]);

        $logger->log(
            subjectType: StatusChangeLog::SUBJECT_CANCELLATION_REQUEST,
            subjectId: $created->id,
            actor: $user,
            fromStatus: null,
            toStatus: CancellationRequest::STATUS_PENDING,
            reason: $reason,
        );

        return [
            'eligible' => true,
            'request' => $created,
        ];
    }

    private function formatCancellationRequestPayload(
        CancellationRequest $cancellationRequest,
        CancellationRequestService $service,
    ): array {
        $appointment = $cancellationRequest->appointment;

        return [
            'id' => $cancellationRequest->id,
            'appointment_id' => $cancellationRequest->appointment_id,
            'doctor_id' => $cancellationRequest->doctor_id,
            'status' => $cancellationRequest->status,
            'reason_category' => $cancellationRequest->reason_category,
            'reason' => $cancellationRequest->reason,
            'admin_note' => $cancellationRequest->admin_note,
            'batch_id' => $cancellationRequest->batch_id,
            'handled_by' => $cancellationRequest->handler ? [
                'id' => $cancellationRequest->handler->id,
                'name' => $cancellationRequest->handler->name,
            ] : null,
            'due_at' => $cancellationRequest->due_at?->toIso8601String(),
            'handled_at' => $cancellationRequest->handled_at?->toIso8601String(),
            'created_at' => $cancellationRequest->created_at?->toIso8601String(),
            'is_overdue' => $cancellationRequest->status === CancellationRequest::STATUS_PENDING
                && $cancellationRequest->due_at !== null
                && $cancellationRequest->due_at->lessThanOrEqualTo(now()),
            'appointment' => $appointment ? [
                'id' => $appointment->id,
                'appointment_date' => $appointment->appointment_date?->format('Y-m-d'),
                'appointment_time' => $appointment->appointment_time,
                'type' => $appointment->type,
                'status' => $appointment->status,
                'polyclinic' => $appointment->polyclinic ? [
                    'id' => $appointment->polyclinic->id,
                    'name' => $appointment->polyclinic->name,
                ] : null,
                'patient' => [
                    'name' => $appointment->user?->name ?? 'Pasien',
                    'masked_phone' => $service->maskPhone($appointment->user?->phone_number),
                ],
            ] : null,
        ];
    }

    private function resolveDoctor(Request $request): Doctor
    {
        $doctor = $request->attributes->get('doctor') ?? $request->user()?->doctor;
        abort_if(! $doctor instanceof Doctor, 403, 'Akun dokter belum terhubung dengan data dokter klinik.');

        return $doctor;
    }
}
