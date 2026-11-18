<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CancellationRequest;
use App\Models\Doctor;
use App\Models\StatusChangeLog;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon as SupportCarbon;
use Illuminate\Support\Facades\DB;

class CancellationRequestService
{
    public function __construct(
        private readonly StatusChangeLogger $statusChangeLogger,
        private readonly WhatsAppNotificationService $whatsApp,
    ) {}

    public function computeDueAt(Appointment $appointment, ?CarbonInterface $requestedAt = null): Carbon
    {
        $slaMaxHours = (int) config('clinic.sla_max_hours', 24);
        $slaMinBeforeHours = (int) config('clinic.sla_min_before_appointment_hours', 1);

        $baseTime = $requestedAt !== null
            ? SupportCarbon::instance($requestedAt)
            : SupportCarbon::instance(now());

        $maxDueAt = $baseTime->copy()->addHours($slaMaxHours);
        $beforeAppointment = SupportCarbon::instance($appointment->appointmentDateTime())
            ->copy()
            ->subHours($slaMinBeforeHours);

        return $maxDueAt->lessThanOrEqualTo($beforeAppointment) ? $maxDueAt : $beforeAppointment;
    }

    /**
     * @return array{eligible: bool, code: ?int, reason: ?string}
     */
    public function canDoctorRequestCancellation(Appointment $appointment, Doctor $doctor): array
    {
        if ((int) $appointment->doctor_id !== (int) $doctor->id) {
            return [
                'eligible' => false,
                'code' => 403,
                'reason' => 'Anda tidak memiliki akses untuk mengajukan pembatalan pada janji temu dokter lain.',
            ];
        }

        if ($appointment->status !== 'terjadwal') {
            return [
                'eligible' => false,
                'code' => 409,
                'reason' => 'Pengajuan pembatalan hanya dapat dilakukan untuk janji temu berstatus terjadwal.',
            ];
        }

        $hasOpenRequest = $this->hasOpenCancellationRequest($appointment);
        if ($hasOpenRequest) {
            return [
                'eligible' => false,
                'code' => 409,
                'reason' => 'Janji temu ini sudah memiliki pengajuan pembatalan yang sedang diproses.',
            ];
        }

        $deadlineHours = (int) config('clinic.cancellation_deadline_hours', 2);
        $cutoff = SupportCarbon::instance(now())->addHours($deadlineHours);
        $appointmentTime = SupportCarbon::instance($appointment->appointmentDateTime());

        if (! $appointmentTime->greaterThan($cutoff)) {
            return [
                'eligible' => false,
                'code' => 422,
                'reason' => "Pengajuan pembatalan hanya dapat dilakukan minimal {$deadlineHours} jam sebelum waktu janji temu.",
            ];
        }

        return [
            'eligible' => true,
            'code' => null,
            'reason' => null,
        ];
    }

    public function maskPhone(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) ($phone ?? '')) ?? '';
        $length = strlen($digits);

        if ($length === 0) {
            return '';
        }

        if ($length <= 4) {
            return str_repeat('*', $length);
        }

        if ($length <= 7) {
            return substr($digits, 0, 2).str_repeat('*', $length - 4).substr($digits, -2);
        }

        if (str_starts_with($digits, '62') && $length >= 11) {
            return '+62 '.substr($digits, 2, 3).'-****-'.substr($digits, -4);
        }

        if ($length >= 10) {
            return substr($digits, 0, 4).'****'.substr($digits, -4);
        }

        return substr($digits, 0, 3).'****'.substr($digits, -2);
    }

    public function formatDoctorAppointmentPayload(Appointment $appointment): array
    {
        $appointment->loadMissing(['polyclinic', 'user', 'doctor', 'openCancellationRequest']);

        $openRequest = $appointment->openCancellationRequest;
        $eligibility = $appointment->doctor !== null
            ? $this->canDoctorRequestCancellation($appointment, $appointment->doctor)
            : [
                'eligible' => false,
                'code' => 422,
                'reason' => 'Data dokter untuk janji temu ini tidak ditemukan.',
            ];

        return [
            'id' => $appointment->id,
            'polyclinic_id' => $appointment->polyclinic_id,
            'polyclinic' => $appointment->polyclinic ? [
                'id' => $appointment->polyclinic->id,
                'name' => $appointment->polyclinic->name,
            ] : null,
            'doctor_id' => $appointment->doctor_id,
            'appointment_date' => $appointment->appointment_date?->format('Y-m-d'),
            'appointment_time' => $appointment->appointment_time,
            'type' => $appointment->type,
            'status' => $appointment->status,
            'patient' => [
                'name' => $appointment->user?->name ?? 'Pasien',
                'masked_phone' => $this->maskPhone($appointment->user?->phone_number),
            ],
            'open_request' => $openRequest ? [
                'id' => $openRequest->id,
                'status' => $openRequest->status,
                'reason_category' => $openRequest->reason_category,
                'reason' => $openRequest->reason,
                'batch_id' => $openRequest->batch_id,
                'due_at' => $openRequest->due_at?->toIso8601String(),
                'created_at' => $openRequest->created_at?->toIso8601String(),
            ] : null,
            'can_request_cancellation' => $eligibility['eligible'],
            'cannot_request_reason' => $eligibility['reason'],
        ];
    }

    public function expireOverdueRequests(?int $doctorId = null): int
    {
        $now = now();

        $candidateIds = CancellationRequest::query()
            ->where('status', CancellationRequest::STATUS_PENDING)
            ->when($doctorId !== null, fn ($query) => $query->where('doctor_id', $doctorId))
            ->whereHas('appointment', fn ($query) => $query->whereDate('appointment_date', '<=', $now->toDateString()))
            ->with('appointment')
            ->orderBy('id')
            ->get()
            ->filter(fn (CancellationRequest $requestRecord): bool => $requestRecord->appointment !== null
                && SupportCarbon::instance($requestRecord->appointment->appointmentDateTime())->lessThanOrEqualTo($now))
            ->pluck('id');

        $expiredCount = 0;

        foreach ($candidateIds as $candidateId) {
            $expiredRecord = DB::transaction(function () use ($candidateId): ?CancellationRequest {
                $locked = CancellationRequest::query()
                    ->whereKey($candidateId)
                    ->lockForUpdate()
                    ->with('appointment')
                    ->first();

                if (! $locked || $locked->status !== CancellationRequest::STATUS_PENDING) {
                    return null;
                }

                if (! $locked->appointment || SupportCarbon::instance($locked->appointment->appointmentDateTime())->greaterThan(now())) {
                    return null;
                }

                $this->transitionRequestStatus(
                    $locked,
                    CancellationRequest::STATUS_EXPIRED,
                    null,
                    'Waktu janji temu telah terlewati sebelum pengajuan diputuskan admin.',
                );

                return $locked;
            });

            if ($expiredRecord !== null) {
                $this->whatsApp->notifyRequestExpired($expiredRecord);
                $expiredCount++;
            }
        }

        return $expiredCount;
    }

    public function notifyOverdueSlaRequests(): int
    {
        $now = now();

        $candidateIds = CancellationRequest::query()
            ->where('status', CancellationRequest::STATUS_PENDING)
            ->whereNotNull('due_at')
            ->where('due_at', '<=', $now)
            ->with('appointment')
            ->orderBy('id')
            ->get()
            ->filter(fn (CancellationRequest $requestRecord): bool => $requestRecord->appointment !== null
                && SupportCarbon::instance($requestRecord->appointment->appointmentDateTime())->greaterThan($now))
            ->pluck('id');

        $notifiedCount = 0;

        foreach ($candidateIds as $candidateId) {
            $notifiedRecord = DB::transaction(function () use ($candidateId): ?CancellationRequest {
                $locked = CancellationRequest::query()
                    ->whereKey($candidateId)
                    ->lockForUpdate()
                    ->with('appointment')
                    ->first();

                if (! $locked || $locked->status !== CancellationRequest::STATUS_PENDING) {
                    return null;
                }

                $currentTime = now();

                if ($locked->due_at === null || SupportCarbon::instance($locked->due_at)->greaterThan($currentTime)) {
                    return null;
                }

                if (! $locked->appointment || SupportCarbon::instance($locked->appointment->appointmentDateTime())->lessThanOrEqualTo($currentTime)) {
                    return null;
                }

                $alreadyNotified = StatusChangeLog::query()
                    ->where('subject_type', StatusChangeLog::SUBJECT_CANCELLATION_REQUEST)
                    ->where('subject_id', $locked->id)
                    ->where('actor_role', 'system')
                    ->where('from_status', CancellationRequest::STATUS_PENDING)
                    ->where('to_status', CancellationRequest::STATUS_PENDING)
                    ->exists();

                if ($alreadyNotified) {
                    return null;
                }

                $this->statusChangeLogger->log(
                    subjectType: StatusChangeLog::SUBJECT_CANCELLATION_REQUEST,
                    subjectId: $locked->id,
                    actor: null,
                    fromStatus: CancellationRequest::STATUS_PENDING,
                    toStatus: CancellationRequest::STATUS_PENDING,
                    reason: 'Batas waktu SLA keputusan admin telah terlewati.',
                    changes: ['sla_overdue_notified' => true],
                );

                return $locked;
            });

            if ($notifiedRecord !== null) {
                $this->whatsApp->notifyAdminsSlaOverdue($notifiedRecord);
                $notifiedCount++;
            }
        }

        return $notifiedCount;
    }

    public function voidOpenRequestsForAppointment(Appointment $appointment, ?User $actor, string $reason): int
    {
        $voidedRequests = DB::transaction(function () use ($appointment, $actor, $reason): array {
            $openRequests = CancellationRequest::query()
                ->where('appointment_id', $appointment->id)
                ->where('status', CancellationRequest::STATUS_PENDING)
                ->lockForUpdate()
                ->get();

            $updated = [];

            foreach ($openRequests as $requestRecord) {
                $this->transitionRequestStatus(
                    $requestRecord,
                    CancellationRequest::STATUS_VOIDED,
                    $actor,
                    $reason,
                );

                $updated[] = $requestRecord;
            }

            return $updated;
        });

        foreach ($voidedRequests as $voidedRequest) {
            $this->whatsApp->notifyRequestVoided($voidedRequest, $appointment);
        }

        return count($voidedRequests);
    }

    private function transitionRequestStatus(
        CancellationRequest $requestRecord,
        string $toStatus,
        ?User $actor,
        string $reason,
    ): void {
        $fromStatus = $requestRecord->status;
        $updates = [
            'status' => $toStatus,
            'handled_at' => now(),
        ];

        if ($actor !== null) {
            $updates['handled_by'] = $actor->id;
        }

        $requestRecord->update($updates);

        $this->statusChangeLogger->log(
            subjectType: StatusChangeLog::SUBJECT_CANCELLATION_REQUEST,
            subjectId: $requestRecord->id,
            actor: $actor,
            fromStatus: $fromStatus,
            toStatus: $toStatus,
            reason: $reason,
        );
    }

    private function hasOpenCancellationRequest(Appointment $appointment): bool
    {
        if ($appointment->relationLoaded('openCancellationRequest')) {
            return $appointment->openCancellationRequest !== null;
        }

        if ($appointment->relationLoaded('cancellationRequests')) {
            return $appointment->cancellationRequests
                ->contains('status', CancellationRequest::STATUS_PENDING);
        }

        return $appointment->cancellationRequests()
            ->where('status', CancellationRequest::STATUS_PENDING)
            ->exists();
    }
}
