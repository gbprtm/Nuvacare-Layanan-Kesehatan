<?php

namespace App\Http\Controllers\Api\Admin;

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

class CancellationRequestManagementController extends Controller
{
    public function index(Request $request, CancellationRequestService $service): JsonResponse
    {
        Gate::authorize('pengajuan.putuskan');

        $service->expireOverdueRequests();

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(CancellationRequest::STATUSES)],
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
            'batch_id' => ['nullable', 'uuid'],
            'overdue' => ['nullable'],
        ]);

        $overdueOnly = $request->filled('overdue')
            && filter_var($request->query('overdue'), FILTER_VALIDATE_BOOLEAN);

        $query = CancellationRequest::query()
            ->with([
                'doctor.polyclinic',
                'appointment.user',
                'appointment.polyclinic',
                'appointment.doctor',
                'handler:id,name',
            ]);

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (! empty($validated['doctor_id'])) {
            $query->where('doctor_id', (int) $validated['doctor_id']);
        }

        if (! empty($validated['batch_id'])) {
            $query->where('batch_id', $validated['batch_id']);
        }

        if ($overdueOnly) {
            $query->where('status', CancellationRequest::STATUS_PENDING)
                ->where('due_at', '<=', now());
        }

        if ($overdueOnly || ($validated['status'] ?? null) === CancellationRequest::STATUS_PENDING) {
            $items = $query->orderBy('due_at', 'asc')->orderBy('id', 'asc')->get();
        } elseif (! empty($validated['status'])) {
            $items = $query->latest('id')->get();
        } else {
            $allItems = $query->latest('id')->get();
            $pending = $allItems
                ->where('status', CancellationRequest::STATUS_PENDING)
                ->sortBy(fn (CancellationRequest $item) => [$item->due_at?->getTimestamp() ?? PHP_INT_MAX, $item->id])
                ->values();
            $others = $allItems
                ->where('status', '!=', CancellationRequest::STATUS_PENDING)
                ->values();
            $items = $pending->concat($others)->values();
        }

        $now = now();
        $items->each(function (CancellationRequest $item) use ($now): void {
            $isOverdue = $item->status === CancellationRequest::STATUS_PENDING
                && $item->due_at !== null
                && $item->due_at->lessThanOrEqualTo($now);
            $item->setAttribute('is_overdue', $isOverdue);
        });

        $pendingCount = CancellationRequest::query()
            ->where('status', CancellationRequest::STATUS_PENDING)
            ->count();

        $overdueCount = CancellationRequest::query()
            ->where('status', CancellationRequest::STATUS_PENDING)
            ->where('due_at', '<=', $now)
            ->count();

        return response()->json([
            'data' => $items,
            'meta' => [
                'pending_count' => $pendingCount,
                'overdue_count' => $overdueCount,
            ],
        ]);
    }

    public function approve(
        Request $request,
        int $id,
        StatusChangeLogger $logger,
        WhatsAppNotificationService $whatsApp,
    ): JsonResponse {
        Gate::authorize('pengajuan.putuskan');

        $validated = $request->validate([
            'admin_note' => ['nullable', 'string', 'max:500'],
        ]);

        $adminNote = isset($validated['admin_note']) ? trim((string) $validated['admin_note']) : '';

        $result = DB::transaction(function () use ($id, $adminNote, $request, $logger): array {
            $guard = $this->lockPendingRequest($id);
            if ($guard['status'] !== 200) {
                return $guard;
            }

            /** @var CancellationRequest $lockedRequest */
            $lockedRequest = $guard['request'];

            $lockedAppointment = Appointment::query()
                ->whereKey($lockedRequest->appointment_id)
                ->lockForUpdate()
                ->first();

            if (! $lockedAppointment || $lockedAppointment->status !== 'terjadwal') {
                return [
                    'status' => 409,
                    'payload' => [
                        'message' => 'Janji temu terkait sudah tidak berstatus terjadwal dan tidak dapat dibatalkan.',
                    ],
                ];
            }

            $existingNotes = trim((string) ($lockedAppointment->doctor_notes ?? ''));
            $nextDoctorNotes = $lockedAppointment->doctor_notes;
            if ($adminNote !== '') {
                $nextDoctorNotes = $existingNotes !== ''
                    ? $existingNotes."\nCatatan pembatalan: {$adminNote}"
                    : $adminNote;
            }

            $lockedAppointment->update([
                'status' => 'dibatalkan',
                'doctor_notes' => $nextDoctorNotes,
            ]);

            $logger->log(
                subjectType: StatusChangeLog::SUBJECT_APPOINTMENT,
                subjectId: $lockedAppointment->id,
                actor: $request->user(),
                fromStatus: 'terjadwal',
                toStatus: 'dibatalkan',
                reason: $adminNote !== '' ? $adminNote : $lockedRequest->reason,
            );

            $lockedRequest->update([
                'status' => CancellationRequest::STATUS_APPROVED,
                'handled_by' => $request->user()->id,
                'handled_at' => now(),
                'admin_note' => $adminNote !== '' ? $adminNote : $lockedRequest->admin_note,
            ]);

            $logger->log(
                subjectType: StatusChangeLog::SUBJECT_CANCELLATION_REQUEST,
                subjectId: $lockedRequest->id,
                actor: $request->user(),
                fromStatus: CancellationRequest::STATUS_PENDING,
                toStatus: CancellationRequest::STATUS_APPROVED,
                reason: $adminNote !== '' ? $adminNote : 'Disetujui oleh admin.',
            );

            return [
                'status' => 200,
                'request' => $lockedRequest,
                'appointment' => $lockedAppointment,
            ];
        });

        if ($result['status'] !== 200) {
            return response()->json($result['payload'], $result['status']);
        }

        /** @var Appointment $appointment */
        $appointment = $result['appointment'];
        /** @var CancellationRequest $cancellationRequest */
        $cancellationRequest = $result['request'];

        $appointment->load(['user', 'polyclinic', 'doctor']);
        $this->loadRequestRelations($cancellationRequest);

        $whatsappNotification = $whatsApp->notifyScheduleUpdate($appointment, 'cancelled');
        $whatsApp->notifyDoctorDecision($cancellationRequest, CancellationRequest::STATUS_APPROVED);

        return response()->json([
            'message' => 'Pengajuan pembatalan disetujui dan janji temu telah dibatalkan.',
            'data' => $cancellationRequest,
            'whatsapp' => $whatsappNotification,
        ]);
    }

    public function reschedule(
        Request $request,
        int $id,
        StatusChangeLogger $logger,
        WhatsAppNotificationService $whatsApp,
    ): JsonResponse {
        Gate::authorize('pengajuan.putuskan');

        $validated = $request->validate([
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'appointment_time' => ['required', Rule::in(Appointment::TIME_SLOTS)],
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
            'admin_note' => ['nullable', 'string', 'max:500'],
        ]);

        $adminNote = isset($validated['admin_note']) ? trim((string) $validated['admin_note']) : '';

        try {
            $result = DB::transaction(function () use ($id, $validated, $adminNote, $request, $logger): array {
                $guard = $this->lockPendingRequest($id);
                if ($guard['status'] !== 200) {
                    return $guard;
                }

                /** @var CancellationRequest $lockedRequest */
                $lockedRequest = $guard['request'];

                $lockedAppointment = Appointment::query()
                    ->whereKey($lockedRequest->appointment_id)
                    ->lockForUpdate()
                    ->first();

                if (! $lockedAppointment || $lockedAppointment->status !== 'terjadwal') {
                    return [
                        'status' => 409,
                        'payload' => [
                            'message' => 'Janji temu terkait sudah tidak berstatus terjadwal dan tidak dapat dijadwalkan ulang.',
                        ],
                    ];
                }

                $oldDate = $lockedAppointment->appointment_date?->format('Y-m-d');
                $oldTime = $lockedAppointment->appointment_time ?? '09:00';
                $oldDoctorId = (int) $lockedAppointment->doctor_id;

                $nextDoctorId = isset($validated['doctor_id'])
                    ? (int) $validated['doctor_id']
                    : $oldDoctorId;

                if (isset($validated['doctor_id'])) {
                    $replacementDoctor = Doctor::query()
                        ->where('id', $nextDoctorId)
                        ->where('polyclinic_id', $lockedAppointment->polyclinic_id)
                        ->where('is_active', true)
                        ->first();

                    if (! $replacementDoctor) {
                        $msg = 'Dokter pengganti harus berasal dari poliklinik yang sama dan berstatus aktif.';

                        return [
                            'status' => 422,
                            'payload' => [
                                'message' => $msg,
                                'errors' => [
                                    'doctor_id' => [$msg],
                                ],
                            ],
                        ];
                    }
                }

                $slotTaken = Appointment::query()
                    ->where('doctor_id', $nextDoctorId)
                    ->whereDate('appointment_date', $validated['appointment_date'])
                    ->where('appointment_time', $validated['appointment_time'])
                    ->where('status', 'terjadwal')
                    ->where('id', '!=', $lockedAppointment->id)
                    ->exists();

                if ($slotTaken) {
                    $msg = 'Jadwal dokter pada tanggal dan jam tersebut sudah terisi pasien lain.';

                    return [
                        'status' => 422,
                        'payload' => [
                            'message' => $msg,
                            'errors' => [
                                'appointment_time' => [$msg],
                            ],
                        ],
                    ];
                }

                $changes = [
                    'appointment_date' => [
                        'old' => $oldDate,
                        'new' => $validated['appointment_date'],
                    ],
                    'appointment_time' => [
                        'old' => $oldTime,
                        'new' => $validated['appointment_time'],
                    ],
                    'doctor_id' => [
                        'old' => $oldDoctorId,
                        'new' => $nextDoctorId,
                    ],
                ];

                $lockedAppointment->update([
                    'appointment_date' => $validated['appointment_date'],
                    'appointment_time' => $validated['appointment_time'],
                    'doctor_id' => $nextDoctorId,
                ]);

                $logger->log(
                    subjectType: StatusChangeLog::SUBJECT_APPOINTMENT,
                    subjectId: $lockedAppointment->id,
                    actor: $request->user(),
                    fromStatus: 'terjadwal',
                    toStatus: 'terjadwal',
                    reason: $adminNote !== ''
                        ? $adminNote
                        : 'Dijadwalkan ulang oleh admin menindaklanjuti pengajuan pembatalan.',
                    changes: $changes,
                );

                $lockedRequest->update([
                    'status' => CancellationRequest::STATUS_RESCHEDULED,
                    'handled_by' => $request->user()->id,
                    'handled_at' => now(),
                    'admin_note' => $adminNote !== '' ? $adminNote : $lockedRequest->admin_note,
                ]);

                $logger->log(
                    subjectType: StatusChangeLog::SUBJECT_CANCELLATION_REQUEST,
                    subjectId: $lockedRequest->id,
                    actor: $request->user(),
                    fromStatus: CancellationRequest::STATUS_PENDING,
                    toStatus: CancellationRequest::STATUS_RESCHEDULED,
                    reason: $adminNote !== '' ? $adminNote : 'Dijadwalkan ulang oleh admin.',
                    changes: $changes,
                );

                return [
                    'status' => 200,
                    'request' => $lockedRequest,
                    'appointment' => $lockedAppointment,
                    'old_doctor_id' => $oldDoctorId,
                    'next_doctor_id' => $nextDoctorId,
                ];
            });
        } catch (UniqueConstraintViolationException) {
            $msg = 'Jadwal dokter pada tanggal dan jam tersebut sudah terisi pasien lain.';

            return response()->json([
                'message' => $msg,
                'errors' => [
                    'appointment_time' => [$msg],
                ],
            ], 422);
        }

        if ($result['status'] !== 200) {
            return response()->json($result['payload'], $result['status']);
        }

        /** @var Appointment $appointment */
        $appointment = $result['appointment'];
        /** @var CancellationRequest $cancellationRequest */
        $cancellationRequest = $result['request'];

        $appointment->load(['user', 'polyclinic', 'doctor']);
        $this->loadRequestRelations($cancellationRequest);

        $newDoctorIfChanged = $result['next_doctor_id'] !== $result['old_doctor_id']
            ? Doctor::find($result['next_doctor_id'])
            : null;

        $whatsappNotification = $whatsApp->notifyScheduleUpdate($appointment, 'rescheduled');
        $whatsApp->notifyDoctorDecision(
            $cancellationRequest,
            CancellationRequest::STATUS_RESCHEDULED,
            $newDoctorIfChanged,
        );

        return response()->json([
            'message' => 'Janji temu berhasil dijadwalkan ulang.',
            'data' => $cancellationRequest,
            'whatsapp' => $whatsappNotification,
        ]);
    }

    public function reject(
        Request $request,
        int $id,
        StatusChangeLogger $logger,
        WhatsAppNotificationService $whatsApp,
    ): JsonResponse {
        Gate::authorize('pengajuan.putuskan');

        $validated = $request->validate([
            'admin_note' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        $adminNote = trim($validated['admin_note']);

        $result = DB::transaction(function () use ($id, $adminNote, $request, $logger): array {
            $guard = $this->lockPendingRequest($id);
            if ($guard['status'] !== 200) {
                return $guard;
            }

            /** @var CancellationRequest $lockedRequest */
            $lockedRequest = $guard['request'];

            $lockedRequest->update([
                'status' => CancellationRequest::STATUS_REJECTED,
                'handled_by' => $request->user()->id,
                'handled_at' => now(),
                'admin_note' => $adminNote,
            ]);

            $logger->log(
                subjectType: StatusChangeLog::SUBJECT_CANCELLATION_REQUEST,
                subjectId: $lockedRequest->id,
                actor: $request->user(),
                fromStatus: CancellationRequest::STATUS_PENDING,
                toStatus: CancellationRequest::STATUS_REJECTED,
                reason: $adminNote,
            );

            return [
                'status' => 200,
                'request' => $lockedRequest,
            ];
        });

        if ($result['status'] !== 200) {
            return response()->json($result['payload'], $result['status']);
        }

        /** @var CancellationRequest $cancellationRequest */
        $cancellationRequest = $result['request'];
        $this->loadRequestRelations($cancellationRequest);

        $whatsApp->notifyDoctorDecision($cancellationRequest, CancellationRequest::STATUS_REJECTED);

        return response()->json([
            'message' => 'Pengajuan pembatalan ditolak dan janji temu tetap terjadwal.',
            'data' => $cancellationRequest,
        ]);
    }

    public function appointmentLogs(int $appointmentId): JsonResponse
    {
        Gate::authorize('audit.lihat');

        $appointment = Appointment::find($appointmentId);
        if (! $appointment) {
            return response()->json([
                'message' => 'Janji temu tidak ditemukan.',
            ], 404);
        }

        $requestIds = CancellationRequest::query()
            ->where('appointment_id', $appointmentId)
            ->pluck('id')
            ->all();

        $logs = StatusChangeLog::query()
            ->with('actor:id,name,role')
            ->where(function ($query) use ($appointmentId, $requestIds): void {
                $query->where(function ($appointmentQuery) use ($appointmentId): void {
                    $appointmentQuery->where('subject_type', StatusChangeLog::SUBJECT_APPOINTMENT)
                        ->where('subject_id', $appointmentId);
                });

                if (! empty($requestIds)) {
                    $query->orWhere(function ($requestQuery) use ($requestIds): void {
                        $requestQuery->where('subject_type', StatusChangeLog::SUBJECT_CANCELLATION_REQUEST)
                            ->whereIn('subject_id', $requestIds);
                    });
                }
            })
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'data' => $logs,
        ]);
    }

    /**
     * @return array{status: int, request?: CancellationRequest, payload?: array}
     */
    private function lockPendingRequest(int $id): array
    {
        $lockedRequest = CancellationRequest::query()
            ->whereKey($id)
            ->with('handler:id,name')
            ->lockForUpdate()
            ->first();

        if (! $lockedRequest) {
            return [
                'status' => 404,
                'payload' => ['message' => 'Pengajuan pembatalan tidak ditemukan.'],
            ];
        }

        if ($lockedRequest->status !== CancellationRequest::STATUS_PENDING) {
            $handlerName = $lockedRequest->handler?->name ?? 'Admin lain';

            return [
                'status' => 409,
                'payload' => [
                    'message' => "Pengajuan ini sudah ditindak oleh {$handlerName} dengan status '{$lockedRequest->status}'.",
                ],
            ];
        }

        return [
            'status' => 200,
            'request' => $lockedRequest,
        ];
    }

    private function loadRequestRelations(CancellationRequest $cancellationRequest): void
    {
        $cancellationRequest->load([
            'doctor.polyclinic',
            'doctor.user',
            'appointment.user',
            'appointment.polyclinic',
            'appointment.doctor',
            'handler:id,name',
        ]);
    }
}
