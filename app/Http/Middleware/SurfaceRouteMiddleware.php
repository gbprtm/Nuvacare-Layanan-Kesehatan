<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SurfaceRouteMiddleware
{
    public function handle(Request $request, Closure $next, string $targetSurface): Response
    {
        $mode = config('surface.mode', 'combined') ?: 'combined';

        if ($mode === 'combined' || $mode === $targetSurface) {
            return $next($request);
        }

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'message' => 'Endpoint tidak tersedia pada host ini.',
            ], 404);
        }

        abort(404);
    }
}
