<?php

namespace App\Http\Middleware;

use App\Support\WibClock;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnforceIdleTimeout
{
    /**
     * Batas waktu idle tidak aktif: 15 menit (900 detik).
     */
    public const TIMEOUT_SECONDS = 900;

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $lastActivity = $request->session()->get('last_activity_time');
            $currentTime = WibClock::now()->timestamp;

            if ($lastActivity !== null && ($currentTime - $lastActivity) > self::TIMEOUT_SECONDS) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit. Silakan masuk kembali.',
                    ], 401);
                }

                return redirect()->route('login')->withErrors([
                    'session' => 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit. Silakan masuk kembali.',
                ]);
            }

            // Perbarui waktu aktivitas terakhir
            $request->session()->put('last_activity_time', $currentTime);
        }

        return $next($request);
    }
}
