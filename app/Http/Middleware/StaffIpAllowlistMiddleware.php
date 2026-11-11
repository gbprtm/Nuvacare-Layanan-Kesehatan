<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffIpAllowlistMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if ((config('surface.mode', 'combined') ?: 'combined') === 'staf') {
            $allowedIps = config('surface.allowed_staff_ips', []);

            if (! empty($allowedIps) && ! in_array($request->ip(), $allowedIps, true)) {
                return response()->json([
                    'message' => 'Akses ditolak dari alamat IP ini.',
                ], 403);
            }
        }

        return $next($request);
    }
}
