<?php

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

    // Dasbor Pasien & Profil Mandiri
    Route::middleware('role:pasien')->group(function () {
        Route::get('/beranda', [DashboardController::class, 'patient'])->name('patient.dashboard');

        // Profil Kesehatan Pasien (Kontrak L07)
        Route::get('/profil', [ProfileController::class, 'show'])->name('profile.show');
        Route::get('/profil/ubah', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profil', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profil', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });

    // Dasbor & Operasional Admin Klinik
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin', [DashboardController::class, 'admin'])->name('admin.dashboard');

        // Audit Log (Hanya Baca, Kontrak L06)
        Route::get('/admin/audit-log', [AuditLogController::class, 'index'])->name('admin.audit.index');
        Route::get('/admin/audit-log/{auditLog}', [AuditLogController::class, 'show'])->name('admin.audit.show');
    });
});
