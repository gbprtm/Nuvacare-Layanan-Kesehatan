<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'polyclinic_id' => ['required', 'exists:polyclinics,id'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        $doctor = Doctor::create([
            'polyclinic_id' => $validated['polyclinic_id'],
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $doctor->load('polyclinic');

        return response()->json([
            'message' => 'Dokter berhasil ditambahkan',
            'data' => $doctor,
        ], 201);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $doctor = Doctor::findOrFail($id);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $doctor->update([
            'is_active' => $validated['is_active'],
        ]);

        $doctor->load('polyclinic');

        return response()->json([
            'message' => 'Status ketersediaan dokter berhasil diperbarui',
            'data' => $doctor,
        ]);
    }
}
