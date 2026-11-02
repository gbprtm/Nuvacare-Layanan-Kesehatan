<?php

namespace App\Http\Controllers\Appointments;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Doctor;
use Illuminate\Http\Request;

class AdminAppointmentController extends Controller
{
    /**
     * Menampilkan daftar operasional janji temu pasien untuk admin loket/klinik.
     * Tidak memuat profil lengkap pasien atau kebiasaan (kepatuhan G04).
     */
    public function index(Request $request)
    {
        $date = $request->query('date') ?: $request->query('tanggal');
        $doctorId = $request->query('doctor_id') ?: $request->query('dokter_id');
        $status = $request->query('status');

        $query = Appointment::query()
            ->with(['doctor', 'slot', 'patient' => function ($q) {
                // Hanya ambil identitas dasar untuk operasional loket
                $q->select('id', 'name', 'email');
            }]);

        if ($date) {
            $query->whereHas('slot', fn ($q) => $q->where('tanggal', $date));
        }

        if ($doctorId) {
            $query->where('dokter_id', $doctorId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $appointments = $query->orderBy('created_at', 'desc')->paginate(20);

        $doctors = Doctor::query()->active()->orderBy('nama')->get();

        if ($request->wantsJson()) {
            return response()->json($appointments);
        }

        return view('admin.appointments.index', [
            'appointments' => $appointments,
            'doctors' => $doctors,
            'selectedDate' => $date,
            'selectedDoctorId' => $doctorId,
            'selectedStatus' => $status,
        ]);
    }

    /**
     * Menampilkan detail operasional janji temu tanpa memuat profil lengkap kesehatan pasien (G04).
     */
    public function show(Request $request, Appointment $appointment)
    {
        $appointment->load([
            'doctor',
            'slot',
            'patient' => function ($q) {
                $q->select('id', 'name', 'email');
            },
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'data' => $appointment,
                'nomor_estimasi' => $appointment->nomor_estimasi,
                'perkiraan_jam' => $appointment->perkiraan_jam,
            ]);
        }

        return view('admin.appointments.show', [
            'appointment' => $appointment,
        ]);
    }
}
