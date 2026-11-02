@extends('layouts.base')

@section('body')
<header class="site-header" style="border-bottom: 2px solid var(--color-line-strong);">
    <div class="header-container">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <a href="{{ route('admin.dashboard') }}" class="brand-link" aria-label="Dasbor Operasional Klinik Sehat">
                Klinik Sehat
            </a>
            <span class="brand-badge" style="background-color: var(--color-ink); color: #FFFFFF;">
                Admin
            </span>
        </div>

        <nav aria-label="Navigasi Pengguna Admin" style="display: flex; align-items: center; gap: 1rem;">
            <a href="{{ route('admin.dashboard') }}" class="text-small" style="font-weight: 500; color: {{ request()->routeIs('admin.dashboard') ? 'var(--color-ink)' : 'var(--color-muted)' }}; text-decoration: none;">
                Dasbor
            </a>
            <a href="{{ route('admin.appointments.index') }}" class="text-small" style="font-weight: 500; color: {{ request()->routeIs('admin.appointments.*') ? 'var(--color-ink)' : 'var(--color-muted)' }}; text-decoration: none;">
                Janji Temu
            </a>
            <a href="{{ route('admin.doctors.index') }}" class="text-small hide-on-mobile" style="font-weight: 500; color: {{ request()->routeIs('admin.doctors.*') ? 'var(--color-ink)' : 'var(--color-muted)' }}; text-decoration: none;">
                Dokter
            </a>
            <a href="{{ route('admin.slots.index') }}" class="text-small hide-on-mobile" style="font-weight: 500; color: {{ request()->routeIs('admin.slots.*') ? 'var(--color-ink)' : 'var(--color-muted)' }}; text-decoration: none;">
                Slot Praktik
            </a>
            <a href="{{ route('admin.audit.index') }}" class="text-small" style="font-weight: 500; color: {{ request()->routeIs('admin.audit.*') ? 'var(--color-ink)' : 'var(--color-muted)' }}; text-decoration: none;">
                Audit Log
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
            Portal Administrasi & Operasional Loket Klinik Sehat
        </p>
    </div>
</footer>
@endsection

