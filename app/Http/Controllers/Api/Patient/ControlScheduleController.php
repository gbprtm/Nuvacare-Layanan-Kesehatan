<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ControlScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $schedules = Appointment::with(['polyclinic', 'doctor'])
            ->where('user_id', $request->user()->id)
            ->where('type', 'kontrol_rutin')
            ->where('status', 'terjadwal')
            ->orderBy('appointment_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'data' => $schedules,
        ]);
    }
}
