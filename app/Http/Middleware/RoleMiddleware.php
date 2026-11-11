<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
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

        if (! in_array($user->role, $roles, true)) {
            return response()->json([
                'message' => 'Akses ditolak. Peran Anda tidak memiliki izin untuk fitur ini.',
            ], 403);
        }

        return $next($request);
    }
}
