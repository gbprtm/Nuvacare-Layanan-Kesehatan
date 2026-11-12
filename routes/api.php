<?php

use App\Http\Controllers\Api\Admin\AppointmentManagementController;
use App\Http\Controllers\Api\Admin\CancellationRequestManagementController;
use App\Http\Controllers\Api\Admin\DoctorController;
use App\Http\Controllers\Api\Admin\DoctorSlotApprovalController;
use App\Http\Controllers\Api\Admin\PolyclinicController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Doctor\CancellationRequestController as DoctorCancellationRequestController;
use App\Http\Controllers\Api\Doctor\DoctorAppointmentController;
use App\Http\Controllers\Api\Doctor\DoctorSlotRequestController;
use App\Http\Controllers\Api\Patient\AppointmentController;
use App\Http\Controllers\Api\Patient\ControlScheduleController;
use App\Http\Controllers\Api\Patient\HistoryController;
use App\Http\Controllers\Api\Patient\ProfileController;
use Illuminate\Support\Facades\Route;

Route::middleware('surface.route:pasien')->group(function () {
    Route::get('/public-info', [AuthController::class, 'publicInfo']);
});

Route::middleware('throttle:15,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('surface.route:pasien')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/auth/register/send-otp', [AuthController::class, 'sendRegisterOtp']);
        Route::post('/auth/register/verify-otp', [AuthController::class, 'verifyRegisterOtp']);
        Route::post('/auth/google', [AuthController::class, 'googleLogin']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
        Route::post('/auth/forgot-password/send-otp', [AuthController::class, 'sendForgotPasswordOtp']);
        Route::post('/auth/forgot-password/verify-otp', [AuthController::class, 'verifyForgotPasswordOtp']);
        Route::post('/auth/forgot-password/reset', [AuthController::class, 'resetPasswordWithOtp']);
    });
});

Route::middleware(['auth:sanctum', 'surface.token'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/master-poli', [AuthController::class, 'masterPoli']);
    Route::get('/slot-tersedia', [AppointmentController::class, 'availableSlots']);
});

Route::middleware(['surface.route:pasien', 'auth:sanctum', 'surface.token', 'role:pasien'])->group(function () {
    Route::post('/auth/phone/send-otp', [AuthController::class, 'sendPhoneOtp']);
    Route::post('/auth/phone/verify-otp', [AuthController::class, 'verifyPhoneOtp']);

    Route::get('/profil', [ProfileController::class, 'show']);
    Route::patch('/profil', [ProfileController::class, 'update']);

    Route::get('/janji-temu', [AppointmentController::class, 'index']);
    Route::post('/janji-temu', [AppointmentController::class, 'store']);
    Route::post('/janji-temu/{id}/batal', [AppointmentController::class, 'cancel'])->whereNumber('id');

    Route::get('/riwayat-pemeriksaan', [HistoryController::class, 'index']);
    Route::get('/jadwal-kontrol', [ControlScheduleController::class, 'index']);
});

Route::middleware(['surface.route:staf', 'staff.ip', 'auth:sanctum', 'surface.token', 'role:admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/janji-temu', [AppointmentManagementController::class, 'index']);
        Route::patch('/janji-temu/{id}', [AppointmentManagementController::class, 'update'])->whereNumber('id');
        Route::post('/jadwal-kontrol', [AppointmentManagementController::class, 'scheduleControl']);

        Route::post('/poli', [PolyclinicController::class, 'store']);
        Route::get('/dokter', [DoctorController::class, 'index']);
        Route::post('/dokter', [DoctorController::class, 'store']);
        Route::patch('/dokter/{id}', [DoctorController::class, 'updateStatus'])->whereNumber('id');
        Route::get('/pasien', [AppointmentManagementController::class, 'patients']);
        Route::get('/slot-tambahan', [DoctorSlotApprovalController::class, 'index']);
        Route::post('/slot-tambahan/{id}/setujui', [DoctorSlotApprovalController::class, 'approve'])->whereNumber('id');
        Route::post('/slot-tambahan/{id}/tolak', [DoctorSlotApprovalController::class, 'reject'])->whereNumber('id');

        Route::middleware('feature:doctor_portal')->group(function () {
            Route::get('/dokter-akun', [DoctorController::class, 'index']);
            Route::post('/dokter/{id}/akun', [DoctorController::class, 'provisionAccount'])->whereNumber('id');
            Route::patch('/dokter/{id}/akun', [DoctorController::class, 'toggleAccountAccess'])->whereNumber('id');

            Route::get('/pengajuan-pembatalan', [CancellationRequestManagementController::class, 'index']);
            Route::post('/pengajuan-pembatalan/{id}/setujui', [CancellationRequestManagementController::class, 'approve'])->whereNumber('id');
            Route::post('/pengajuan-pembatalan/{id}/jadwalkan-ulang', [CancellationRequestManagementController::class, 'reschedule'])->whereNumber('id');
            Route::post('/pengajuan-pembatalan/{id}/tolak', [CancellationRequestManagementController::class, 'reject'])->whereNumber('id');

            Route::get('/janji-temu/{id}/log', [CancellationRequestManagementController::class, 'appointmentLogs'])->whereNumber('id');
        });
    });

Route::middleware(['surface.route:staf', 'staff.ip', 'feature:doctor_portal', 'auth:sanctum', 'surface.token', 'role:dokter', 'doctor.account'])
    ->prefix('dokter')
    ->group(function () {
        Route::get('/janji-temu', [DoctorAppointmentController::class, 'index']);
        Route::get('/janji-temu/{id}', [DoctorAppointmentController::class, 'show'])->whereNumber('id');
        Route::post('/janji-temu/{id}/batal-cepat', [DoctorCancellationRequestController::class, 'quickCancel'])->whereNumber('id');
        Route::post('/janji-temu/{id}/selesai', [DoctorAppointmentController::class, 'complete'])->whereNumber('id');
        Route::post('/janji-temu/{id}/pengajuan-pembatalan', [DoctorCancellationRequestController::class, 'store'])->whereNumber('id');

        Route::get('/pengajuan-pembatalan', [DoctorCancellationRequestController::class, 'index']);
        Route::post('/pengajuan-pembatalan/massal', [DoctorCancellationRequestController::class, 'storeBatch']);
        Route::post('/pengajuan-pembatalan/{id}/tarik', [DoctorCancellationRequestController::class, 'withdraw'])->whereNumber('id');

        Route::get('/slot-tambahan', [DoctorSlotRequestController::class, 'index']);
        Route::post('/slot-tambahan', [DoctorSlotRequestController::class, 'store']);
    });
