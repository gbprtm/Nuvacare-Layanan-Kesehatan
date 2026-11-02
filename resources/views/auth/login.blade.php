@extends('layouts.app')

@section('title', 'Masuk ke Akun')

@section('content')
<div class="auth-wrapper">
    <div class="auth-card">
        <div class="auth-header">
            <h1>Masuk</h1>
            <p class="text-muted text-small" style="margin-top: 0.5rem;">Silakan masukkan email dan kata sandi Anda.</p>
        </div>

        @if(session('status'))
            <div class="alert alert-success" role="alert">
                {{ session('status') }}
            </div>
        @endif

        @if($errors->has('session'))
            <div class="alert alert-danger" role="alert">
                {{ $errors->first('session') }}
            </div>
        @endif

        <form method="POST" action="{{ route('login.store') }}" novalidate>
            @csrf

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
                    autofocus
                    placeholder="nama@email.com"
                >
                @error('email')
                    <span class="form-error" role="alert">{{ $message }}</span>
                @enderror
            </div>

            <div class="form-group">
                <label for="password" class="form-label">Kata Sandi</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    class="form-control @error('password') is-invalid @enderror" 
                    required 
                    autocomplete="current-password"
                    placeholder="Masukkan kata sandi"
                >
                @error('password')
                    <span class="form-error" role="alert">{{ $message }}</span>
                @enderror
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.75rem;">
                Masuk
            </button>
        </form>

        <div class="auth-footer">
            <p>Belum memiliki akun? <a href="{{ route('register') }}">Daftar akun pasien</a></p>
        </div>
    </div>
</div>
@endsection

