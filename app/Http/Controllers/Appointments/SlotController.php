<?php

namespace App\Http\Controllers\Appointments;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Slot;
use App\Support\WibClock;
use Illuminate\Http\Request;

class SlotController extends Controller
{
    /**
     * Menampilkan daftar slot praktik yang tersedia untuk pasien.
     */
    public function index(Request $request)
    {
        $doctorId = $request->query('doctor_id') ?: $request->query('dokter_id');
        $date = $request->query('date') ?: $request->query('tanggal');
        $from = $request->query('from');
        $to = $request->query('to');

        $query = Slot::query()
            ->with(['doctor'])
            ->whereHas('doctor', fn ($q) => $q->where('aktif', true));

        if ($doctorId) {
            $query->where('dokter_id', $doctorId);
        }

        if ($date) {
            $query->where('tanggal', $date);
        } else {
            $query->where('tanggal', '>=', WibClock::today());
        }

        if ($from) {
            $query->where('tanggal', '>=', $from);
        }

        if ($to) {
            $query->where('tanggal', '<=', $to);
        }

        $slots = $query->orderBy('tanggal')
            ->orderBy('jam_mulai')
            ->get();

        $doctors = Doctor::query()->active()->orderBy('nama')->get();

        if ($request->wantsJson()) {
            return response()->json([
                'data' => $slots,
            ]);
        }

        return view('slots.index', [
            'slots' => $slots,
            'doctors' => $doctors,
            'selectedDoctorId' => $doctorId,
            'selectedDate' => $date,
        ]);
    }
}
