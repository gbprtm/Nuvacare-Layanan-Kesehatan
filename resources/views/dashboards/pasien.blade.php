@extends('layouts.app')

@section('title', 'Beranda Pasien')

@section('content')
<div class="container" style="margin-top: 2rem;">
    <div class="card" style="margin-bottom: 1.5rem;">
        <span class="badge badge-success" style="width: fit-content; margin-bottom: 0.75rem;">Area Pasien</span>
        <h1>Halo, {{ $user->name }}</h1>
        <p class="text-muted" style="margin-top: 0.25rem;">Selamat datang di layanan kesehatan personal Anda.</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
        <div class="card">
            <h3>Jadwal & Kunjungan</h3>
            <p class="text-muted text-small" style="margin-top: 0.5rem;">Belum ada jadwal kunjungan aktif untuk hari ini.</p>
        </div>

        <div class="card">
            <h3>Pengingat Obat</h3>
            <p class="text-muted text-small" style="margin-top: 0.5rem;">Semua catatan minum obat telah diperbarui.</p>
        </div>
    </div>
</div>
@endsection

