<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\DoctorSlotRequest;
use DateTimeInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class DoctorSlotRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('pengajuan.lihat_milik');

        $doctor = $this->resolveDoctor($request);

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['diajukan', 'disetujui', 'ditolak'])],
        ]);

        $slotRequests = DoctorSlotRequest::query()
            ->where('doctor_id', $doctor->id)
            ->when(! empty($validated['status']), fn ($query) => $query->where('status', $validated['status']))
            ->latest('id')
            ->get();

        return response()->json([
            'data' => $slotRequests->map(
                fn (DoctorSlotRequest $slotRequest): array => $this->formatPayload($slotRequest),
            )->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('pengajuan.ajukan');

        $doctor = $this->resolveDoctor($request);

        $validated = $request->validate([
            'schedule_date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'quota' => ['required', 'integer', 'min:1', 'max:50'],
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        $slotRequest = DoctorSlotRequest::create([
            'doctor_id' => $doctor->id,
            'schedule_date' => $validated['schedule_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'quota' => (int) $validated['quota'],
            'reason' => trim($validated['reason']),
            'status' => 'diajukan',
        ]);

        return response()->json([
            'message' => 'Pengajuan slot tambahan berhasil dikirim ke admin klinik.',
            'data' => $this->formatPayload($slotRequest),
        ], 201);
    }

    private function formatPayload(DoctorSlotRequest $slotRequest): array
    {
        return [
            'id' => $slotRequest->id,
            'doctor_id' => $slotRequest->doctor_id,
            'schedule_date' => $slotRequest->schedule_date instanceof DateTimeInterface
                ? $slotRequest->schedule_date->format('Y-m-d')
                : (string) $slotRequest->schedule_date,
            'start_time' => substr((string) $slotRequest->start_time, 0, 5),
            'end_time' => substr((string) $slotRequest->end_time, 0, 5),
            'quota' => (int) $slotRequest->quota,
            'reason' => $slotRequest->reason,
            'status' => $slotRequest->status,
            'admin_note' => $slotRequest->admin_note,
            'created_at' => $slotRequest->created_at?->toIso8601String(),
            'updated_at' => $slotRequest->updated_at?->toIso8601String(),
        ];
    }

    private function resolveDoctor(Request $request): Doctor
    {
        $doctor = $request->attributes->get('doctor') ?? $request->user()?->doctor;
        abort_if(! $doctor instanceof Doctor, 403, 'Akun dokter belum terhubung dengan data dokter klinik.');

        return $doctor;
    }
}
