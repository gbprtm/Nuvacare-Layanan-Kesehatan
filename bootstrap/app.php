<?php

use App\Http\Middleware\EnsureActiveDoctorMiddleware;
use App\Http\Middleware\FeatureFlagMiddleware;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\StaffIpAllowlistMiddleware;
use App\Http\Middleware\SurfaceRouteMiddleware;
use App\Http\Middleware\SurfaceTokenMiddleware;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'surface.route' => SurfaceRouteMiddleware::class,
            'surface.token' => SurfaceTokenMiddleware::class,
            'feature' => FeatureFlagMiddleware::class,
            'doctor.account' => EnsureActiveDoctorMiddleware::class,
            'staff.ip' => StaffIpAllowlistMiddleware::class,
        ]);

        $middleware->prependToPriorityList(AuthenticatesRequests::class, SurfaceRouteMiddleware::class);
        $middleware->prependToPriorityList(AuthenticatesRequests::class, FeatureFlagMiddleware::class);
        $middleware->prependToPriorityList(AuthenticatesRequests::class, StaffIpAllowlistMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
