@extends('layouts.base')

@section('body')
<header class="site-header">
    <div class="header-container">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <a href="{{ route('patient.dashboard') }}" class="brand-link" aria-label="Beranda Pasien Klinik Sehat">
                Klinik Sehat
            </a>
            <span class="brand-badge">Pasien</span>
        </div>

        <nav aria-label="Navigasi Pengguna Pasien" style="display: flex; align-items: center; gap: 1rem;">
            <a href="{{ route('patient.dashboard') }}" class="text-small" style="font-weight: 500; color: {{ request()->routeIs('patient.dashboard') ? 'var(--color-ink)' : 'var(--color-muted)' }}; text-decoration: none;">
                Beranda
            </a>
            <a href="{{ route('appointments.index') }}" class="text-small" style="font-weight: 500; color: {{ request()->routeIs('appointments.*') ? 'var(--color-ink)' : 'var(--color-muted)' }}; text-decoration: none;">
                Janji Temu
            </a>
            <a href="{{ route('profile.show') }}" class="text-small" style="font-weight: 500; color: {{ request()->routeIs('profile.*') ? 'var(--color-ink)' : 'var(--color-muted)' }}; text-decoration: none;">
                Profil Saya
            </a>
            <a href="{{ route('medication-catalog.index') }}" class="text-small hide-on-mobile" style="font-weight: 500; color: {{ request()->routeIs('medication-catalog.*') ? 'var(--color-ink)' : 'var(--color-muted)' }}; text-decoration: none;">
                Katalog Obat
            </a>
            <span class="text-small text-muted hide-on-mobile" style="font-weight: 500;">
                {{ auth()->user()->nama_lengkap ?? auth()->user()->name }}
            </span>
            <form method="POST" action="{{ route('logout') }}" style="display: inline;">
                @csrf
                <button type="submit" class="btn btn-secondary" style="min-height: 38px; padding: 0.375rem 0.875rem;">
                    Keluar
                </button>
            </form>
        </nav>
    </div>
</header>

<main id="main-content" class="container" style="flex: 1; padding-top: 2rem; padding-bottom: 3rem;">
    @if(session('status'))
        <x-alert type="success" :message="session('status')" />
    @endif

    @if($errors->any())
        <x-alert type="danger">
            <ul style="padding-left: 1.25rem; margin: 0;">
                @foreach($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </x-alert>
    @endif

    @yield('content')
</main>

<footer class="site-footer">
    <div class="container" style="padding-top: 1.5rem; padding-bottom: 1.5rem; text-align: center;">
        <p class="text-small text-muted">
            Klinik Sehat — Layanan Kesehatan Personal & Pengelolaan Janji Temu
        </p>
    </div>
</footer>
@endsection

