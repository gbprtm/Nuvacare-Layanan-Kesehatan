<?php

use App\Http\Controllers\Api\Admin\AppointmentManagementController;
use App\Http\Controllers\Api\Admin\DoctorController;
use App\Http\Controllers\Api\Admin\PolyclinicController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Patient\AppointmentController;
use App\Http\Controllers\Api\Patient\ControlScheduleController;
use App\Http\Controllers\Api\Patient\HistoryController;
use App\Http\Controllers\Api\Patient\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/public-info', [AuthController::class, 'publicInfo']);

Route::middleware('throttle:15,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/master-poli', [AuthController::class, 'masterPoli']);

    Route::get('/user', function (Request $request) {
        return response()->json([
            'data' => $request->user(),
        ]);
    });

    Route::middleware('role:pasien')->group(function () {
        Route::get('/profil', [ProfileController::class, 'show']);
        Route::patch('/profil', [ProfileController::class, 'update']);

        Route::get('/janji-temu', [AppointmentController::class, 'index']);
        Route::post('/janji-temu', [AppointmentController::class, 'store']);

        Route::get('/riwayat-pemeriksaan', [HistoryController::class, 'index']);
        Route::get('/jadwal-kontrol', [ControlScheduleController::class, 'index']);
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/janji-temu', [AppointmentManagementController::class, 'index']);
        Route::patch('/janji-temu/{id}', [AppointmentManagementController::class, 'update']);
        Route::post('/jadwal-kontrol', [AppointmentManagementController::class, 'scheduleControl']);

        Route::post('/poli', [PolyclinicController::class, 'store']);
        Route::post('/dokter', [DoctorController::class, 'store']);
        Route::patch('/dokter/{id}', [DoctorController::class, 'updateStatus']);
        Route::get('/pasien', [AppointmentManagementController::class, 'patients']);
    });
});
