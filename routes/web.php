<?php

use App\Http\Controllers\Appointments\AdminAppointmentController;
use App\Http\Controllers\Appointments\AdminDoctorController;
use App\Http\Controllers\Appointments\AdminSlotController;
use App\Http\Controllers\Appointments\AppointmentController;
use App\Http\Controllers\Appointments\DoctorController;
use App\Http\Controllers\Appointments\SlotController;
use App\Http\Controllers\Audit\AuditLogController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Profile\MedicineCatalogController;
use App\Http\Controllers\Profile\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes (Kontrak Dokumen docs/api-contract.md)
|--------------------------------------------------------------------------
*/

// Beranda Publik
Route::get('/', function () {
    return view('welcome');
})->name('home');

// Rute Tamu (Hanya dapat diakses jika belum masuk)
Route::middleware('guest')->group(function () {
    Route::get('/masuk', [LoginController::class, 'create'])->name('login');
    Route::post('/masuk', [LoginController::class, 'store'])->name('login.store');

    Route::get('/daftar', [RegisterController::class, 'create'])->name('register');
    Route::post('/daftar', [RegisterController::class, 'store'])->name('register.store');
});

// Katalog Referensi Obat (Publik, Pasien & Admin, Kontrak L07)
Route::get('/katalog-obat', [MedicineCatalogController::class, 'index'])->name('medication-catalog.index');

// Rute Terautentikasi (Pasien & Admin)
Route::middleware('auth')->group(function () {
    Route::post('/keluar', [LoginController::class, 'destroy'])->name('logout');

    // Dasbor Pasien & Fitur Mandiri Pasien (Kontrak L04, L07, L08)
    Route::middleware('role:pasien')->group(function () {
        Route::get('/beranda', [DashboardController::class, 'patient'])->name('patient.dashboard');

        // Profil Kesehatan Pasien (Kontrak L07)
        Route::get('/profil', [ProfileController::class, 'show'])->name('profile.show');
        Route::get('/profil/ubah', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profil', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profil', [ProfileController::class, 'destroy'])->name('profile.destroy');

        // Dokter, Slot & Janji Temu Pasien (Kontrak L08, FR-03, FR-08)
        Route::get('/dokter', [DoctorController::class, 'index'])->name('doctors.index');
        Route::get('/slot', [SlotController::class, 'index'])->name('slots.index');
        Route::get('/janji', [AppointmentController::class, 'index'])->name('appointments.index');
        Route::get('/janji/buat', [AppointmentController::class, 'create'])->name('appointments.create');
        Route::post('/janji', [AppointmentController::class, 'store'])->name('appointments.store');
        Route::get('/janji/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show');
        Route::post('/janji/{appointment}/batal', [AppointmentController::class, 'cancel'])->name('appointments.cancel');
    });

    // Dasbor & Operasional Admin Klinik (Kontrak L06, L08)
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin', [DashboardController::class, 'admin'])->name('admin.dashboard');

        // Audit Log (Hanya Baca, Kontrak L06)
        Route::get('/admin/audit-log', [AuditLogController::class, 'index'])->name('admin.audit.index');
        Route::get('/admin/audit-log/{auditLog}', [AuditLogController::class, 'show'])->name('admin.audit.show');

        // Pengelolaan Dokter & Spesialisasi (Kontrak L08)
        Route::get('/admin/dokter', [AdminDoctorController::class, 'index'])->name('admin.doctors.index');
        Route::post('/admin/dokter', [AdminDoctorController::class, 'store'])->name('admin.doctors.store');
        Route::patch('/admin/dokter/{doctor}', [AdminDoctorController::class, 'update'])->name('admin.doctors.update');

        // Pengelolaan Slot Praktik Dokter (Kontrak L08)
        Route::get('/admin/slot', [AdminSlotController::class, 'index'])->name('admin.slots.index');
        Route::post('/admin/slot', [AdminSlotController::class, 'store'])->name('admin.slots.store');
        Route::patch('/admin/slot/{slot}', [AdminSlotController::class, 'update'])->name('admin.slots.update');

        // Daftar Operasional Janji Temu Harian (Kontrak L08)
        Route::get('/admin/janji', [AdminAppointmentController::class, 'index'])->name('admin.appointments.index');
        Route::get('/admin/janji/{appointment}', [AdminAppointmentController::class, 'show'])->name('admin.appointments.show');
    });
});
