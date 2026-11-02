<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\DashboardController;
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

// Rute Terautentikasi (Pasien & Admin)
Route::middleware('auth')->group(function () {
    Route::post('/keluar', [LoginController::class, 'destroy'])->name('logout');

    // Dasbor Pasien
    Route::middleware('role:pasien')->group(function () {
        Route::get('/beranda', [DashboardController::class, 'patient'])->name('patient.dashboard');
    });

    // Dasbor Admin Klinik
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin', [DashboardController::class, 'admin'])->name('admin.dashboard');
    });
});
