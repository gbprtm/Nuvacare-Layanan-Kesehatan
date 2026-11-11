<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveDoctorMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Sesi autentikasi diperlukan.',
            ], 401);
        }

        if ($user->isDisabled()) {
            return response()->json([
                'message' => 'Akun Anda dinonaktifkan. Hubungi admin klinik.',
            ], 403);
        }

        if ($user->role !== 'dokter') {
            return response()->json([
                'message' => 'Akses ditolak. Peran Anda tidak memiliki izin untuk fitur ini.',
            ], 403);
        }

        $doctor = $user->doctor;

        if (! $doctor) {
            return response()->json([
                'message' => 'Akun dokter belum terhubung dengan data dokter klinik.',
            ], 403);
        }

        if (! $doctor->is_active) {
            return response()->json([
                'message' => 'Data dokter sedang tidak aktif.',
            ], 403);
        }

        $request->attributes->set('doctor', $doctor);

        return $next($request);
    }
}
