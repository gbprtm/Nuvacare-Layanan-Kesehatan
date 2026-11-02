<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $history = Appointment::with(['polyclinic', 'doctor'])
            ->where('user_id', $request->user()->id)
            ->where('status', 'selesai')
            ->orderBy('appointment_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'data' => $history,
        ]);
    }
}
