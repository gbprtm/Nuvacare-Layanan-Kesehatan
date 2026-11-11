<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Polyclinic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PolyclinicController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('poli.kelola');
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:polyclinics,name'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $polyclinic = Polyclinic::create($validated);

        return response()->json([
            'message' => 'Poliklinik berhasil ditambahkan',
            'data' => $polyclinic,
        ], 201);
    }
}
