@extends('layouts.patient')

@section('title', 'Jadwal Slot Praktik - Klinik Sehat')

@section('content')
<div style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
    <div>
        <h1 class="font-serif" style="font-size: 1.75rem; font-weight: 700; color: var(--color-ink); margin: 0 0 0.25rem 0;">
            Jadwal Slot Praktik Dokter
        </h1>
        <p class="text-small text-muted" style="margin: 0;">
            Informasi ketersediaan waktu konsultasi dokter di Klinik Sehat.
        </p>
    </div>

    <!-- Filter Slot -->
    <div class="card" style="padding: 1rem 1.25rem;">
        <form method="GET" action="{{ route('slots.index') }}" style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <label for="dokter_id" class="text-small" style="font-weight: 600; color: var(--color-ink);">
                    Dokter:
                </label>
                <select id="dokter_id" name="dokter_id" class="form-control" style="min-width: 200px;">
                    <option value="">Semua Dokter</option>
                    @foreach($doctors as $doc)
                        <option value="{{ $doc->id }}" {{ $selectedDoctorId === $doc->id ? 'selected' : '' }}>
                            {{ $doc->nama }} ({{ $doc->spesialisasi }})
                        </option>
                    @endforeach
                </select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <label for="tanggal" class="text-small" style="font-weight: 600; color: var(--color-ink);">
                    Tanggal:
                </label>
                <input type="date" id="tanggal" name="tanggal" value="{{ $selectedDate }}" class="form-control" style="min-width: 160px;">
            </div>

            <button type="submit" class="btn btn-secondary" style="min-height: 38px;">
                Cari Slot
            </button>

            @if($selectedDoctorId || $selectedDate)
                <a href="{{ route('slots.index') }}" class="text-small" style="color: var(--color-primary); text-decoration: underline; margin-bottom: 0.5rem;">
                    Reset filter
                </a>
            @endif
        </form>
    </div>

    <!-- Daftar Slot Praktik -->
    @if($slots->count() > 0)
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;">
            @foreach($slots as $slot)
                <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem; padding: 1.25rem; border-left: 4px solid {{ $slot->tersedia ? 'var(--color-primary)' : 'var(--color-line)' }};">
                    <div>
                        <span class="text-small text-muted" style="display: block;">
                            {{ \Carbon\Carbon::parse($slot->tanggal)->translatedFormat('l, d F Y') }}
                        </span>
                        <h2 style="font-size: 1.1rem; font-weight: 700; color: var(--color-ink); margin: 0.25rem 0;">
                            {{ $slot->jam_mulai }} - {{ $slot->jam_selesai }} WIB
                        </h2>
                        <p class="text-small" style="font-weight: 600; color: var(--color-ink); margin: 0;">
                            {{ $slot->doctor->nama ?? '-' }}
                        </p>
                        <p class="text-small text-muted" style="margin: 0.125rem 0 0 0;">
                            {{ $slot->doctor->spesialisasi ?? '-' }}
                        </p>
                    </div>

                    <div style="border-top: 1px solid var(--color-line); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                        @if($slot->tersedia)
                            <span class="text-small" style="color: #16A34A; font-weight: 600;">Tersedia</span>
                            <a href="{{ route('appointments.create', ['spesialisasi' => $slot->doctor->spesialisasi, 'tanggal' => $slot->tanggal->format('Y-m-d'), 'slot_id' => $slot->id]) }}" class="btn btn-primary" style="font-size: 0.8125rem; min-height: 32px; padding: 0.25rem 0.625rem; text-decoration: none;">
                                Pesan Slot
                            </a>
                        @else
                            <span class="text-small text-muted" style="font-weight: 500;">Sudah Terisi</span>
                            <button type="button" class="btn btn-secondary" disabled style="opacity: 0.6; cursor: not-allowed; font-size: 0.8125rem; min-height: 32px; padding: 0.25rem 0.625rem;">
                                Terisi
                            </button>
                        @endif
                    </div>
                </div>
            @endforeach
        </div>
    @else
        <x-empty-state 
            title="Tidak Ada Slot Praktik" 
            description="Tidak ditemukan jadwal slot praktik yang cocok dengan kriteria pencarian kamu."
            actionText="Tampilkan Semua Slot Mendatang"
            :actionUrl="route('slots.index')"
        />
    @endif
</div>
@endsection

