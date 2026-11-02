@extends('layouts.base')

@section('body')
<header class="site-header">
    <div class="header-container">
        <a href="/" class="brand-link" aria-label="Halaman Beranda Klinik Sehat">
            Klinik Sehat
            @auth
                @if(auth()->user()->isAdmin())
                    <span class="brand-badge">Admin</span>
                @else
                    <span class="brand-badge">Pasien</span>
                @endif
            @endauth
        </a>

        <nav aria-label="Navigasi Utama">
            @auth
                <form method="POST" action="{{ route('logout') }}" style="display: inline;">
                    @csrf
                    <button type="submit" class="btn btn-secondary" style="min-height: 38px; padding: 0.375rem 0.875rem;">Keluar</button>
                </form>
            @else
                <a href="/masuk" class="btn btn-secondary" style="min-height: 38px; padding: 0.375rem 0.875rem; text-decoration: none; margin-right: 0.5rem;">Masuk</a>
                <a href="/daftar" class="btn btn-primary" style="min-height: 38px; padding: 0.375rem 0.875rem; text-decoration: none;">Daftar</a>
            @endauth
        </nav>
    </div>
</header>

<main id="main-content">
    @yield('content')
</main>
@endsection
