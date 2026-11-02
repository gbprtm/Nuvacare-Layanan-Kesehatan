<?php

namespace App\Http\Controllers\Appointments;

use App\Exceptions\ActiveBookingsException;
use App\Exceptions\SlotOverlapException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointments\StoreSlotRequest;
use App\Http\Requests\Appointments\UpdateSlotRequest;
use App\Models\Doctor;
use App\Models\Slot;
use App\Services\Appointments\SlotManagementService;
use Illuminate\Http\Request;

class AdminSlotController extends Controller
{
    public function __construct(
        protected SlotManagementService $slotService
    ) {}

    /**
     * Menampilkan daftar slot praktik dokter untuk kebutuhan operasional admin.
     */
    public function index(Request $request)
    {
        $doctorId = $request->query('doctor_id') ?: $request->query('dokter_id');
        $date = $request->query('date') ?: $request->query('tanggal');
        $available = $request->query('available') ?? $request->query('tersedia');

        $query = Slot::query()->with(['doctor'])->withCount('appointments');

        if ($doctorId) {
            $query->where('dokter_id', $doctorId);
        }

        if ($date) {
            $query->where('tanggal', $date);
        }

        if ($available !== null && $available !== '') {
            $query->where('tersedia', filter_var($available, FILTER_VALIDATE_BOOLEAN));
        }

        $slots = $query->latest('created_at')
            ->paginate(20);

        $doctors = Doctor::query()->active()->orderBy('nama')->get();

        if ($request->wantsJson()) {
            return response()->json($slots);
        }

        return view('admin.slots.index', [
            'slots' => $slots,
            'doctors' => $doctors,
            'selectedDoctorId' => $doctorId,
            'selectedDate' => $date,
            'selectedAvailable' => $available,
        ]);
    }

    /**
     * Menambahkan slot praktik baru dengan audit log atomik dan validasi bentrok.
     */
    public function store(StoreSlotRequest $request)
    {
        try {
            $slot = $this->slotService->createSlot(
                admin: $request->user(),
                data: $request->validated()
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Slot praktik dokter berhasil dibuat.',
                    'data' => $slot->load('doctor'),
                ], 201);
            }

            return redirect()->route('admin.slots.index')
                ->with('status', "Slot praktik dokter pada tanggal {$slot->tanggal->format('d/m/Y')} ({$slot->jam_mulai} - {$slot->jam_selesai} WIB) berhasil ditambahkan.");
        } catch (SlotOverlapException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'code' => 'SLOT_OVERLAP',
                ], 409);
            }

            return redirect()->back()
                ->withInput()
                ->withErrors(['jam_mulai' => $e->getMessage()])
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Memperbarui slot praktik dengan proteksi janji aktif dan audit log atomik.
     */
    public function update(UpdateSlotRequest $request, Slot $slot)
    {
        $reason = $request->validated('alasan') ?? $request->validated('reason');

        try {
            $updated = $this->slotService->updateSlot(
                admin: $request->user(),
                slot: $slot,
                data: $request->validated(),
                reason: $reason
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Slot praktik berhasil diperbarui.',
                    'data' => $updated,
                ]);
            }

            return redirect()->route('admin.slots.index')
                ->with('status', 'Slot praktik dokter berhasil diperbarui.');
        } catch (ActiveBookingsException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'code' => 'ACTIVE_BOOKINGS',
                ], 409);
            }

            return redirect()->back()
                ->withInput()
                ->withErrors(['tersedia' => $e->getMessage()])
                ->with('error', $e->getMessage());
        } catch (SlotOverlapException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'code' => 'SLOT_OVERLAP',
                ], 409);
            }

            return redirect()->back()
                ->withInput()
                ->withErrors(['jam_mulai' => $e->getMessage()])
                ->with('error', $e->getMessage());
        }
    }
}
