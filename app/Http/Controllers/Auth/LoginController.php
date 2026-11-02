<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Support\WibClock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class LoginController extends Controller
{
    /**
     * Tampilkan halaman formulir masuk.
     */
    public function create(): View|RedirectResponse
    {
        if (Auth::check()) {
            return $this->redirectBasedOnRole(Auth::user());
        }

        return view('auth.login');
    }

    /**
     * Proses autentikasi pengguna.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();
        $request->session()->put('last_activity_time', WibClock::now()->timestamp);

        $user = Auth::user();

        return redirect()->intended($this->getDashboardPath($user));
    }

    /**
     * Proses keluar dari sesi aplikasi.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('status', 'Anda telah berhasil keluar dari akun.');
    }

    /**
     * Arahkan pengguna berdasarkan peran.
     */
    protected function redirectBasedOnRole($user): RedirectResponse
    {
        return redirect($this->getDashboardPath($user));
    }

    /**
     * Dapatkan path dashboard berdasarkan peran.
     */
    protected function getDashboardPath($user): string
    {
        return $user && $user->role === 'admin' ? '/admin' : '/beranda';
    }
}
