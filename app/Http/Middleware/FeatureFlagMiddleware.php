<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FeatureFlagMiddleware
{
    public function handle(Request $request, Closure $next, string $flag): Response
    {
        if (! config("features.{$flag}", false)) {
            return response()->json([
                'message' => 'Fitur belum diaktifkan.',
            ], 404);
        }

        return $next($request);
    }
}
