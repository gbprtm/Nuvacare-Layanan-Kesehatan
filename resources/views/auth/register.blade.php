@extends('layouts.app')

@section('title', 'Pendaftaran Akun Pasien')

@section('content')
<div class="auth-wrapper">
    <div class="auth-card">
        <div class="auth-header">
            <h1>Pendaftaran Pasien</h1>
            <p class="text-muted text-small" style="margin-top: 0.5rem;">Buat akun untuk mengelola janji temu dan catatan kesehatan.</p>
        </div>

        <form method="POST" action="{{ route('register.store') }}" novalidate>
            @csrf

            <div class="form-group">
                <label for="name" class="form-label">Nama Lengkap</label>
                <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value="{{ old('name') }}" 
                    class="form-control @error('name') is-invalid @enderror" 
                    required 
                    autocomplete="name" 
                    autofocus
                    placeholder="Nama sesuai identitas"
                >
                @error('name')
                    <span class="form-error" role="alert">{{ $message }}</span>
                @enderror
            </div>

            <div class="form-group">
                <label for="email" class="form-label">Alamat Email</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value="{{ old('email') }}" 
                    class="form-control @error('email') is-invalid @enderror" 
                    required 
                    autocomplete="email"
                    placeholder="nama@email.com"
                >
                @error('email')
                    <span class="form-error" role="alert">{{ $message }}</span>
                @enderror
            </div>

            <div class="form-group">
                <label for="password" class="form-label">Kata Sandi (Minimal 8 Karakter)</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    class="form-control @error('password') is-invalid @enderror" 
                    required 
                    autocomplete="new-password"
                    placeholder="Minimal 8 karakter"
                >
                @error('password')
                    <span class="form-error" role="alert">{{ $message }}</span>
                @enderror
            </div>

            <div class="form-group">
                <label for="password_confirmation" class="form-label">Konfirmasi Kata Sandi</label>
                <input 
                    type="password" 
                    id="password_confirmation" 
                    name="password_confirmation" 
                    class="form-control @error('password_confirmation') is-invalid @enderror" 
                    required 
                    autocomplete="new-password"
                    placeholder="Ulangi kata sandi"
                >
                @error('password_confirmation')
                    <span class="form-error" role="alert">{{ $message }}</span>
                @enderror
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.75rem;">
                Daftar Akun
            </button>
        </form>

        <div class="auth-footer">
            <p>Sudah memiliki akun? <a href="{{ route('login') }}">Masuk di sini</a></p>
        </div>
    </div>
</div>
@endsection

