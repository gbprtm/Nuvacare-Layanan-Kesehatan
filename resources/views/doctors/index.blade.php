@extends('layouts.patient')

@section('title', 'Daftar Dokter & Spesialisasi - Klinik Sehat')

@section('content')
<div style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
    <div>
        <h1 class="font-serif" style="font-size: 1.75rem; font-weight: 700; color: var(--color-ink); margin: 0 0 0.25rem 0;">
            Dokter & Spesialisasi Klinik
        </h1>
        <p class="text-small text-muted" style="margin: 0;">
            Daftar tenaga medis profesional dan jadwal praktik aktif di Klinik Sehat.
        </p>
    </div>

    <!-- Filter Spesialisasi -->
    <div class="card" style="padding: 1rem 1.25rem;">
        <form method="GET" action="{{ route('doctors.index') }}" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
            <label for="spesialisasi" class="text-small" style="font-weight: 600; color: var(--color-ink);">
                Spesialisasi:
            </label>
            <select id="spesialisasi" name="spesialisasi" class="form-control" style="max-width: 250px;" onchange="this.form.submit()">
                <option value="">Semua Spesialisasi</option>
                @foreach($specialties as $sp)
                    <option value="{{ $sp }}" {{ $selectedSpecialty === $sp ? 'selected' : '' }}>
                        {{ $sp }}
                    </option>
                @endforeach
            </select>
            <noscript>
                <button type="submit" class="btn btn-secondary" style="min-height: 38px;">Filter</button>
            </noscript>
            @if($selectedSpecialty)
                <a href="{{ route('doctors.index') }}" class="text-small" style="color: var(--color-primary); text-decoration: underline;">
                    Reset filter
                </a>
            @endif
        </form>
    </div>

    <!-- Grid Dokter -->
    @if($doctors->count() > 0)
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
            @foreach($doctors as $doctor)
                <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; padding: 1.25rem;">
                    <div>
                        <span class="brand-badge" style="background-color: #EFF6FF; color: var(--color-primary); margin-bottom: 0.5rem; display: inline-block;">
                            {{ $doctor->spesialisasi }}
                        </span>
                        <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--color-ink); margin: 0 0 0.25rem 0;">
                            {{ $doctor->nama }}
                        </h2>
                        @if($doctor->nomor_izin)
                            <p class="text-small text-muted" style="margin: 0;">
                                SIP: {{ $doctor->nomor_izin }}
                            </p>
                        @endif
                        <p class="text-small" style="margin: 0.5rem 0 0 0; color: var(--color-muted);">
                            {{ $doctor->slots_count }} slot praktik tersedia
                        </p>
                    </div>

                    <div style="border-top: 1px solid var(--color-line); padding-top: 0.75rem;">
                        <a href="{{ route('appointments.create', ['spesialisasi' => $doctor->spesialisasi]) }}" class="btn btn-primary" style="width: 100%; text-decoration: none; text-align: center; min-height: 38px; padding: 0.375rem 0.75rem; font-size: 0.875rem;">
                            Buat Janji Praktik
                        </a>
                    </div>
                </div>
            @endforeach
        </div>
    @else
        <x-empty-state 
            title="Dokter Tidak Ditemukan" 
            description="Tidak ada dokter aktif yang terdaftar untuk filter spesialisasi ini."
            actionText="Tampilkan Semua Dokter"
            :actionUrl="route('doctors.index')"
        />
    @endif
</div>
@endsection

