<?php

namespace App\Http\Controllers\Appointments;

use App\Exceptions\ActiveBookingsException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointments\StoreDoctorRequest;
use App\Http\Requests\Appointments\UpdateDoctorRequest;
use App\Models\Doctor;
use App\Services\Appointments\DoctorManagementService;
use Illuminate\Http\Request;

class AdminDoctorController extends Controller
{
    public function __construct(
        protected DoctorManagementService $doctorService
    ) {}

    /**
     * Menampilkan daftar pengelolaan data dokter dan spesialisasi klinik.
     */
    public function index(Request $request)
    {
        $specialty = $request->query('specialty') ?: $request->query('spesialisasi');
        $active = $request->query('active');

        $query = Doctor::query()->withCount('slots');

        if ($specialty) {
            $query->where('spesialisasi', $specialty);
        }

        if ($active !== null && $active !== '') {
            $query->where('aktif', filter_var($active, FILTER_VALIDATE_BOOLEAN));
        }

        $doctors = $query->latest('created_at')->paginate(15);

        $specialties = Doctor::query()->distinct()->pluck('spesialisasi')->sort()->values();

        if ($request->wantsJson()) {
            return response()->json($doctors);
        }

        return view('admin.doctors.index', [
            'doctors' => $doctors,
            'specialties' => $specialties,
            'selectedSpecialty' => $specialty,
            'selectedActive' => $active,
        ]);
    }

    /**
     * Menyimpan data dokter baru dengan audit log atomik.
     */
    public function store(StoreDoctorRequest $request)
    {
        $doctor = $this->doctorService->createDoctor(
            admin: $request->user(),
            data: $request->validated()
        );

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Data dokter berhasil ditambahkan.',
                'data' => $doctor,
            ], 201);
        }

        return redirect()->route('admin.doctors.index')
            ->with('status', "Dokter {$doctor->nama} ({$doctor->spesialisasi}) berhasil ditambahkan.");
    }

    /**
     * Memperbarui data dokter dengan catatan audit log wajib dan validasi janji aktif.
     */
    public function update(UpdateDoctorRequest $request, Doctor $doctor)
    {
        $reason = $request->validated('alasan') ?? $request->validated('reason');

        try {
            $updated = $this->doctorService->updateDoctor(
                admin: $request->user(),
                doctor: $doctor,
                data: $request->validated(),
                reason: $reason
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Data dokter berhasil diperbarui.',
                    'data' => $updated,
                ]);
            }

            return redirect()->route('admin.doctors.index')
                ->with('status', "Data dokter {$updated->nama} berhasil diperbarui.");
        } catch (ActiveBookingsException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'code' => 'ACTIVE_BOOKINGS',
                ], 409);
            }

            return redirect()->back()
                ->withInput()
                ->withErrors(['aktif' => $e->getMessage()])
                ->with('error', $e->getMessage());
        }
    }
}
