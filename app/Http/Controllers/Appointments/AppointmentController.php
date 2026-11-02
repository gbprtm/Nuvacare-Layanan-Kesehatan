<?php

namespace App\Http\Controllers\Appointments;

use App\Exceptions\SlotUnavailableException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointments\BookAppointmentRequest;
use App\Http\Requests\Appointments\CancelAppointmentRequest;
use App\Models\Appointment;
use App\Models\Slot;
use App\Services\Appointments\AppointmentBookingService;
use App\Support\WibClock;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function __construct(
        protected AppointmentBookingService $bookingService
    ) {}

    /**
     * Menampilkan riwayat dan daftar janji temu milik pasien.
     */
    public function index(Request $request)
    {
        $status = $request->query('status');
        $from = $request->query('from');
        $to = $request->query('to');

        $query = Appointment::query()
            ->where('pasien_id', $request->user()->id)
            ->with(['doctor', 'slot']);

        if ($status) {
            $query->where('status', $status);
        }

        if ($from) {
            $query->whereHas('slot', fn ($q) => $q->where('tanggal', '>=', $from));
        }

        if ($to) {
            $query->whereHas('slot', fn ($q) => $q->where('tanggal', '<=', $to));
        }

        $appointments = $query->latest('created_at')->paginate(10);

        if ($request->wantsJson()) {
            return response()->json($appointments);
        }

        return view('appointments.index', [
            'appointments' => $appointments,
            'selectedStatus' => $status,
        ]);
    }

    /**
     * Menampilkan alur pembuatan janji temu pasien (P6: Pilih spesialis, P7: Pilih slot, P8: Konfirmasi).
     */
    public function create(Request $request)
    {
        $specialties = $this->bookingService->getSpecialtiesWithSlotCounts();
        $selectedSpecialty = $request->query('spesialisasi') ?: $request->query('specialty');
        $selectedDate = $request->query('tanggal') ?: $request->query('date') ?: WibClock::today();
        $selectedSlotId = $request->query('slot_id');

        $availableSlots = collect();
        $selectedSlot = null;

        if ($selectedSpecialty) {
            $availableSlots = $this->bookingService->getSlotsForBooking(
                specialty: $selectedSpecialty,
                date: $selectedDate
            );
        }

        if ($selectedSlotId) {
            $selectedSlot = Slot::with('doctor')->find($selectedSlotId);
        }

        return view('appointments.create', [
            'specialties' => $specialties,
            'selectedSpecialty' => $selectedSpecialty,
            'selectedDate' => $selectedDate,
            'availableSlots' => $availableSlots,
            'selectedSlot' => $selectedSlot,
        ]);
    }

    /**
     * Mengunci slot praktik dan membuat janji temu baru secara transaksional anti-race.
     */
    public function store(BookAppointmentRequest $request)
    {
        $slotId = $request->validated('slot_id');
        $complaint = $request->validated('keluhan') ?? $request->validated('complaint');

        try {
            $appointment = $this->bookingService->bookAppointment(
                patient: $request->user(),
                slotId: $slotId,
                complaint: $complaint
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Janji temu berhasil dibuat.',
                    'data' => $appointment->load(['doctor', 'slot']),
                ], 201);
            }

            return redirect()->route('appointments.show', $appointment->id)
                ->with('status', 'Janji temu berhasil dikonfirmasi. Perhatikan nomor estimasi dan perkiraan jam layanan Anda.');
        } catch (SlotUnavailableException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'code' => 'SLOT_UNAVAILABLE',
                ], 409);
            }

            return redirect()->back()
                ->withInput()
                ->withErrors(['slot_id' => $e->getMessage()])
                ->with('conflict', $e->getMessage());
        }
    }

    /**
     * Menampilkan detail konfirmasi janji temu dengan kartu nomor estimasi.
     */
    public function show(Request $request, Appointment $appointment)
    {
        $this->authorize('view', $appointment);

        $appointment->load(['doctor', 'slot', 'patient']);

        if ($request->wantsJson()) {
            return response()->json([
                'data' => $appointment,
                'nomor_estimasi' => $appointment->nomor_estimasi,
                'perkiraan_jam' => $appointment->perkiraan_jam,
            ]);
        }

        return view('appointments.show', [
            'appointment' => $appointment,
        ]);
    }

    /**
     * Membatalkan janji temu oleh pasien.
     */
    public function cancel(CancelAppointmentRequest $request, Appointment $appointment)
    {
        $this->authorize('cancel', $appointment);

        $reason = $request->validated('alasan') ?? $request->validated('reason');

        $this->bookingService->cancelAppointment(
            actor: $request->user(),
            appointment: $appointment,
            reason: $reason
        );

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Janji temu berhasil dibatalkan.',
                'data' => $appointment->fresh(),
            ]);
        }

        return redirect()->route('appointments.show', $appointment->id)
            ->with('status', 'Janji temu berhasil dibatalkan.');
    }
}
