@extends('layouts.admin')

@section('title', 'Dasbor Operasional Admin')

@section('content')
<div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Kartu Informasi Admin -->
    <div class="card" style="border-left: 4px solid var(--color-ink);">
        <p class="text-small text-muted" style="margin-bottom: 0.25rem;">Panel Staf Loket & Administrasi</p>
        <h1 style="font-size: 1.75rem;">Dasbor Operasional Klinik</h1>
        <p class="text-muted" style="margin-top: 0.5rem; max-width: 600px;">
            Pusat pengelolaan nomor antrean loket pendaftaran, kehadiran pasien, dan ketersediaan kuota jadwal praktik dokter.
        </p>
    </div>

    <!-- Ringkasan Operasional -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
        <x-card title="Antrean Loket Pendaftaran">
            <x-empty-state 
                title="Belum Ada Pasien Check-in" 
                description="Daftar nomor antrean pasien yang telah melakukan check-in mandiri di klinik akan ditampilkan di sini."
            />
        </x-card>

        <x-card title="Ketersediaan Praktik Dokter">
            <x-empty-state 
                title="Kelola Jadwal & Kuota" 
                description="Atur kuota slot kunjungan harian per dokter untuk memastikan kelancaran alur pelayanan pasien."
            />
        </x-card>

        <x-card title="Audit & Akuntabilitas Transaksi">
            <p class="text-small text-muted" style="margin-bottom: 1rem;">
                Setiap mutasi operasional staf tercatat otomatis secara permanen (append-only) demi kepatuhan SOP klinik.
            </p>
            <a href="{{ route('admin.audit.index') }}" class="btn btn-secondary text-sm">
                Buka Riwayat Audit Log
            </a>
        </x-card>
    </div>
</div>
@endsection
