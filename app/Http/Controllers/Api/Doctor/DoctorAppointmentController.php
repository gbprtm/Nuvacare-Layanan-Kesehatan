<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CancellationRequest;
use App\Models\Doctor;
use App\Services\CancellationRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
                fn (Appointment $appointment): array => $service->formatDoctorAppointmentPayload($appointment)
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
                $service->formatDoctorAppointmentPayload($appointment),
                ['cancellation_requests' => $cancellationRequests],
            ),
        ]);
    }

    private function resolveDoctor(Request $request): Doctor
    {
        $doctor = $request->attributes->get('doctor') ?? $request->user()?->doctor;
        abort_if(! $doctor instanceof Doctor, 403, 'Akun dokter belum terhubung dengan data dokter klinik.');

        return $doctor;
    }
}
