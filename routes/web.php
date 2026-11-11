<?php

use Illuminate\Support\Facades\Route;

$serveHtml = static function (string $surfaceRelativePath, ?string $legacyPublicPath = null) {
    $surfacePath = base_path('surfaces/'.$surfaceRelativePath);

    if (! is_file($surfacePath) && $legacyPublicPath !== null) {
        $fallbackPath = public_path($legacyPublicPath);
        if (is_file($fallbackPath)) {
            $surfacePath = $fallbackPath;
        }
    }

    abort_unless(is_file($surfacePath), 404);

    return response()->file($surfacePath, [
        'Content-Type' => 'text/html; charset=UTF-8',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
        'Pragma' => 'no-cache',
        'Expires' => '0',
    ]);
};

Route::get('/', function () use ($serveHtml) {
    $mode = config('surface.mode', 'combined') ?: 'combined';

    if ($mode === 'staf') {
        return redirect('/staf/login.html');
    }

    return $serveHtml('pasien/index.html', 'index.html');
});

Route::get('/login.html', function () use ($serveHtml) {
    $mode = config('surface.mode', 'combined') ?: 'combined';

    if ($mode === 'staf') {
        return $serveHtml('staf/staf/login.html');
    }

    return $serveHtml('pasien/login.html', 'login.html');
});

Route::middleware('surface.route:pasien')->group(function () use ($serveHtml) {
    Route::get('/index.html', fn () => $serveHtml('pasien/index.html', 'index.html'));
    Route::get('/daftar.html', fn () => $serveHtml('pasien/daftar.html', 'daftar.html'));
    Route::get('/lupa-password.html', fn () => $serveHtml('pasien/lupa-password.html', 'lupa-password.html'));
    Route::get('/reset-password.html', fn () => $serveHtml('pasien/reset-password.html', 'reset-password.html'));

    Route::get('/pasien/{page}.html', fn (string $page) => $serveHtml("pasien/pasien/{$page}.html", "pasien/{$page}.html"))
        ->whereIn('page', ['janji-temu', 'riwayat', 'jadwal-kontrol', 'profil']);
});

Route::middleware(['surface.route:staf', 'staff.ip'])->group(function () use ($serveHtml) {
    Route::get('/staf/login.html', fn () => $serveHtml('staf/staf/login.html'));

    Route::get('/admin/{page}.html', fn (string $page) => $serveHtml("staf/admin/{$page}.html", "admin/{$page}.html"))
        ->whereIn('page', ['kelola-janji', 'master-data']);

    Route::get('/dokter/{page}.html', fn (string $page) => $serveHtml("staf/dokter/{$page}.html"))
        ->whereIn('page', ['janji-temu'])
        ->middleware('feature:doctor_portal');
});
