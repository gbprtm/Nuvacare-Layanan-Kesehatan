<?php

use App\Http\Middleware\EnforceIdleTimeout;
use App\Http\Middleware\EnsureUserRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Daftarkan penegakan idle timeout pada web middleware group
        $middleware->web(append: [
            EnforceIdleTimeout::class,
        ]);

        // Alias middleware untuk proteksi role
        $middleware->alias([
            'role' => EnsureUserRole::class,
        ]);

        // Arahkan tamu yang belum login ke form login
        $middleware->redirectGuestsTo(fn () => route('login'));

        // Arahkan pengguna terautentikasi yang mencoba mengakses form login/register
        $middleware->redirectUsersTo(fn (Request $request) => $request->user()?->role === 'admin' ? '/admin' : '/beranda');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
