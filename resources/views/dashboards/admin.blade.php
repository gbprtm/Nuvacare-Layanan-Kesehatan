@extends('layouts.app')

@section('title', 'Dasbor Operasional Admin')

@section('content')
<div class="container" style="margin-top: 2rem;">
    <div class="card" style="margin-bottom: 1.5rem;">
        <span class="badge badge-success" style="width: fit-content; margin-bottom: 0.75rem; background-color: var(--color-primary-soft); color: var(--color-primary-ink);">Administrasi Klinik</span>
        <h1>Dasbor Operasional</h1>
        <p class="text-muted" style="margin-top: 0.25rem;">Pengelolaan antrean, jadwal dokter, dan verifikasi kunjungan.</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
        <div class="card">
            <h3>Antrean Hari Ini</h3>
            <p class="text-muted text-small" style="margin-top: 0.5rem;">Lihat dan kelola alur check-in pasien di loket.</p>
        </div>

        <div class="card">
            <h3>Jadwal Dokter</h3>
            <p class="text-muted text-small" style="margin-top: 0.5rem;">Kelola ketersediaan kuota slot janji temu klinik.</p>
        </div>
    </div>
</div>
@endsection

