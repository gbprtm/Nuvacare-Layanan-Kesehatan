<?php

namespace App\Http\Controllers\Appointments;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    /**
     * Menampilkan daftar dokter aktif (dan filter spesialisasi) untuk pasien.
     */
    public function index(Request $request)
    {
        $specialty = $request->query('specialty') ?: $request->query('spesialisasi');

        $doctors = Doctor::query()
            ->active()
            ->bySpecialty($specialty)
            ->withCount(['slots' => function ($q) {
                $q->available();
            }])
            ->orderBy('nama')
            ->get();

        $allSpecialties = Doctor::query()
            ->active()
            ->distinct()
            ->pluck('spesialisasi')
            ->sort()
            ->values();

        if ($request->wantsJson()) {
            return response()->json([
                'data' => $doctors,
                'specialties' => $allSpecialties,
            ]);
        }

        return view('doctors.index', [
            'doctors' => $doctors,
            'specialties' => $allSpecialties,
            'selectedSpecialty' => $specialty,
        ]);
    }
}
