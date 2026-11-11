<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class SurfaceTokenMiddleware
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

        $mode = config('surface.mode', 'combined') ?: 'combined';

        if (in_array($mode, ['pasien', 'staf'], true)) {
            $token = $user->currentAccessToken();

            if ($token instanceof PersonalAccessToken) {
                $abilities = is_array($token->abilities) ? $token->abilities : [];

                // Separated surface mode requires an explicit surface ability even when ['*'] is present.
                if (! in_array("surface:{$mode}", $abilities, true)) {
                    return response()->json([
                        'message' => 'Token tidak berlaku untuk layanan host ini.',
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
