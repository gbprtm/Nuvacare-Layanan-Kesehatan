<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\View\View;

class RegisterController extends Controller
{
    /**
     * Tampilkan formulir pendaftaran akun pasien.
     */
    public function create(): View|RedirectResponse
    {
        if (Auth::check()) {
            $user = Auth::user();

            return redirect($user->role === 'admin' ? '/admin' : '/beranda');
        }

        return view('auth.register');
    }

    /**
     * Simpan pendaftaran akun pasien baru.
     * Sesuai ketentuan: Role kiriman dari request diabaikan/ditolak; akun registrasi publik selalu 'pasien'.
     */
    public function store(RegisterRequest $request): RedirectResponse
    {
        User::create([
            'id' => (string) Str::uuid(),
            'name' => $request->name,
            'email' => $request->email,
            'password_hash' => Hash::make($request->password),
            'role' => 'pasien', // Mutlak ditentukan server
        ]);

        return redirect()->route('login')->with('status', 'Pendaftaran berhasil! Silakan masuk dengan akun yang telah dibuat.');
    }
}
