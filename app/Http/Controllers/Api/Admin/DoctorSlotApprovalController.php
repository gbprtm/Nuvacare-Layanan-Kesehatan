<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DoctorSlotRequest;
use App\Services\StatusChangeLogger;
use DateTimeInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class DoctorSlotApprovalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('pengajuan.putuskan');

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(DoctorSlotRequest::STATUSES)],
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
            'date' => ['nullable', 'date'],
        ]);

        $query = DoctorSlotRequest::query()
            ->with(['doctor.polyclinic'])
            ->when(! empty($validated['status']), fn ($q) => $q->where('status', $validated['status']))
            ->when(! empty($validated['doctor_id']), fn ($q) => $q->where('doctor_id', (int) $validated['doctor_id']))
            ->when(! empty($validated['date']), fn ($q) => $q->whereDate('schedule_date', $validated['date']))
            ->orderByRaw("CASE WHEN status = '".DoctorSlotRequest::STATUS_PENDING."' THEN 0 ELSE 1 END")
            ->orderBy('schedule_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->orderBy('id', 'desc');

        $items = $query->get()
            ->map(fn (DoctorSlotRequest $slotRequest): array => $this->formatPayload($slotRequest))
            ->values();

        $pendingCount = DoctorSlotRequest::query()
            ->where('status', DoctorSlotRequest::STATUS_PENDING)
            ->count();

        return response()->json([
            'data' => $items,
            'meta' => [
                'pending_count' => $pendingCount,
            ],
        ]);
    }

    public function approve(
        Request $request,
        int $id,
        StatusChangeLogger $logger,
    ): JsonResponse {
        Gate::authorize('pengajuan.putuskan');

        $validated = $request->validate([
            'admin_note' => ['nullable', 'string', 'max:500'],
        ]);

        $adminNote = isset($validated['admin_note']) ? trim((string) $validated['admin_note']) : '';

        $result = DB::transaction(function () use ($id, $adminNote, $request, $logger): array {
            $locked = DoctorSlotRequest::query()
                ->whereKey($id)
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                return [
                    'status' => 404,
                    'payload' => [
                        'message' => 'Pengajuan slot tambahan tidak ditemukan.',
                    ],
                ];
            }

            if ($locked->status !== DoctorSlotRequest::STATUS_PENDING) {
                return [
                    'status' => 409,
                    'payload' => [
                        'message' => "Pengajuan slot tambahan ini sudah berstatus '{$locked->status}' dan tidak dapat diproses ulang.",
                    ],
                ];
            }

            $locked->update([
                'status' => DoctorSlotRequest::STATUS_APPROVED,
                'admin_note' => $adminNote !== '' ? $adminNote : $locked->admin_note,
            ]);

            $logger->log(
                subjectType: 'doctor_slot_request',
                subjectId: $locked->id,
                actor: $request->user(),
                fromStatus: DoctorSlotRequest::STATUS_PENDING,
                toStatus: DoctorSlotRequest::STATUS_APPROVED,
                reason: $adminNote !== '' ? $adminNote : 'Pengajuan slot tambahan disetujui admin.',
                changes: [
                    'schedule_date' => $this->formatDate($locked->schedule_date),
                    'start_time' => $this->formatTime($locked->start_time),
                    'end_time' => $this->formatTime($locked->end_time),
                    'quota' => (int) $locked->quota,
                ],
            );

            return [
                'status' => 200,
                'slot_request' => $locked,
            ];
        });

        if ($result['status'] !== 200) {
            return response()->json($result['payload'], $result['status']);
        }

        /** @var DoctorSlotRequest $slotRequest */
        $slotRequest = $result['slot_request'];
        $slotRequest->load('doctor.polyclinic');

        return response()->json([
            'message' => 'Pengajuan slot tambahan dokter disetujui dan jadwal aktif ditambahkan.',
            'data' => $this->formatPayload($slotRequest),
        ]);
    }

    public function reject(
        Request $request,
        int $id,
        StatusChangeLogger $logger,
    ): JsonResponse {
        Gate::authorize('pengajuan.putuskan');

        $validated = $request->validate([
            'admin_note' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        $adminNote = trim($validated['admin_note']);

        $result = DB::transaction(function () use ($id, $adminNote, $request, $logger): array {
            $locked = DoctorSlotRequest::query()
                ->whereKey($id)
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                return [
                    'status' => 404,
                    'payload' => [
                        'message' => 'Pengajuan slot tambahan tidak ditemukan.',
                    ],
                ];
            }

            if ($locked->status !== DoctorSlotRequest::STATUS_PENDING) {
                return [
                    'status' => 409,
                    'payload' => [
                        'message' => "Pengajuan slot tambahan ini sudah berstatus '{$locked->status}' dan tidak dapat diproses ulang.",
                    ],
                ];
            }

            $locked->update([
                'status' => DoctorSlotRequest::STATUS_REJECTED,
                'admin_note' => $adminNote,
            ]);

            $logger->log(
                subjectType: 'doctor_slot_request',
                subjectId: $locked->id,
                actor: $request->user(),
                fromStatus: DoctorSlotRequest::STATUS_PENDING,
                toStatus: DoctorSlotRequest::STATUS_REJECTED,
                reason: $adminNote,
            );

            return [
                'status' => 200,
                'slot_request' => $locked,
            ];
        });

        if ($result['status'] !== 200) {
            return response()->json($result['payload'], $result['status']);
        }

        /** @var DoctorSlotRequest $slotRequest */
        $slotRequest = $result['slot_request'];
        $slotRequest->load('doctor.polyclinic');

        return response()->json([
            'message' => 'Pengajuan slot tambahan dokter ditolak.',
            'data' => $this->formatPayload($slotRequest),
        ]);
    }

    private function formatPayload(DoctorSlotRequest $slotRequest): array
    {
        $doctor = $slotRequest->doctor;

        return [
            'id' => $slotRequest->id,
            'doctor_id' => $slotRequest->doctor_id,
            'doctor' => $doctor ? [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'polyclinic_id' => $doctor->polyclinic_id,
                'polyclinic' => $doctor->polyclinic ? [
                    'id' => $doctor->polyclinic->id,
                    'name' => $doctor->polyclinic->name,
                ] : null,
            ] : null,
            'schedule_date' => $this->formatDate($slotRequest->schedule_date),
            'start_time' => $this->formatTime($slotRequest->start_time),
            'end_time' => $this->formatTime($slotRequest->end_time),
            'quota' => (int) $slotRequest->quota,
            'reason' => $slotRequest->reason,
            'status' => $slotRequest->status,
            'admin_note' => $slotRequest->admin_note,
            'created_at' => $slotRequest->created_at?->toIso8601String(),
            'updated_at' => $slotRequest->updated_at?->toIso8601String(),
        ];
    }

    private function formatDate(mixed $date): ?string
    {
        if ($date instanceof DateTimeInterface) {
            return $date->format('Y-m-d');
        }

        return $date !== null ? substr((string) $date, 0, 10) : null;
    }

    private function formatTime(mixed $time): ?string
    {
        if ($time instanceof DateTimeInterface) {
            return $time->format('H:i');
        }

        return $time !== null ? substr((string) $time, 0, 5) : null;
    }
}
