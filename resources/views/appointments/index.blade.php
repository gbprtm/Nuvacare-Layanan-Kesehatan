@extends('layouts.patient')

@section('title', 'Janji Temu Saya - Klinik Sehat')

@section('content')
<div style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
            <h1 class="font-serif" style="font-size: 1.75rem; font-weight: 700; color: var(--color-ink); margin: 0 0 0.25rem 0;">
                Janji Temu Saya
            </h1>
            <p class="text-small text-muted" style="margin: 0;">
                Daftar jadwal kunjungan aktif dan riwayat pemeriksaan kamu di Klinik Sehat.
            </p>
        </div>

        <a href="{{ route('appointments.create') }}" class="btn btn-primary" style="text-decoration: none;">
            Buat Janji Baru
        </a>
    </div>

    <!-- Filter Status -->
    <div class="card" style="padding: 1rem 1.25rem;">
        <form method="GET" action="{{ route('appointments.index') }}" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
            <label for="status" class="text-small" style="font-weight: 600; color: var(--color-ink);">
                Filter Status:
            </label>
            <select id="status" name="status" class="form-control" style="max-width: 200px;" onchange="this.form.submit()">
                <option value="">Semua Status</option>
                <option value="aktif" {{ request('status') === 'aktif' ? 'selected' : '' }}>Aktif</option>
                <option value="selesai" {{ request('status') === 'selesai' ? 'selected' : '' }}>Selesai</option>
                <option value="dibatalkan" {{ request('status') === 'dibatalkan' ? 'selected' : '' }}>Dibatalkan</option>
            </select>
            <noscript>
                <button type="submit" class="btn btn-secondary" style="min-height: 38px;">Terapkan</button>
            </noscript>
            @if(request('status'))
                <a href="{{ route('appointments.index') }}" class="text-small" style="color: var(--color-primary); text-decoration: underline;">
                    Reset filter
                </a>
            @endif
        </form>
    </div>

    <!-- Daftar Janji -->
    @if($appointments->count() > 0)
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            @foreach($appointments as $appointment)
                <div class="card" style="display: flex; flex-direction: column; gap: 0.75rem; border-left: 4px solid {{ $appointment->status === 'aktif' ? 'var(--color-primary)' : 'var(--color-line)' }};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
                        <div>
                            <span class="text-small text-muted" style="display: block; margin-bottom: 0.25rem;">
                                {{ $appointment->slot ? \Carbon\Carbon::parse($appointment->slot->tanggal)->translatedFormat('l, d F Y') : '-' }} • {{ $appointment->slot ? $appointment->slot->jam_mulai.' - '.$appointment->slot->jam_selesai.' WIB' : '-' }}
                            </span>
                            <h2 style="font-size: 1.125rem; font-weight: 600; color: var(--color-ink); margin: 0;">
                                {{ $appointment->doctor->nama ?? 'Dokter Klinik' }}
                            </h2>
                            <p class="text-small text-muted" style="margin: 0.125rem 0 0 0;">
                                Spesialisasi: {{ $appointment->doctor->spesialisasi ?? '-' }}
                            </p>
                        </div>

                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                            <span class="brand-badge" style="background-color: {{ $appointment->status === 'aktif' ? '#EFF6FF' : '#F1F5F9' }}; color: {{ $appointment->status === 'aktif' ? 'var(--color-primary)' : 'var(--color-muted)' }}; border: 1px solid {{ $appointment->status === 'aktif' ? '#BFDBFE' : 'var(--color-line)' }};">
                                {{ $appointment->status_label }}
                            </span>
                            @if($appointment->status === 'aktif')
                                <span class="text-small" style="font-weight: 600; color: var(--color-ink);">
                                    Estimasi Kedatangan: #{{ $appointment->nomor_estimasi }}
                                </span>
                            @endif
                        </div>
                    </div>

                    @if($appointment->keluhan)
                        <div style="background-color: var(--color-canvas); padding: 0.625rem 0.875rem; border-radius: var(--radius-sm); font-size: 0.875rem; color: var(--color-ink);">
                            <strong>Keluhan:</strong> {{ $appointment->keluhan }}
                        </div>
                    @endif

                    <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--color-line);">
                        <a href="{{ route('appointments.show', $appointment->id) }}" class="btn btn-secondary" style="font-size: 0.875rem; min-height: 36px; padding: 0.375rem 0.875rem; text-decoration: none;">
                            Lihat Detail Janji
                        </a>
                    </div>
                </div>
            @endforeach
        </div>

        <div style="margin-top: 1rem;">
            {{ $appointments->links() }}
        </div>
    @else
        <x-empty-state 
            title="Belum Ada Janji Temu" 
            description="Kamu belum memiliki janji temu pemeriksaan medis di Klinik Sehat. Pilih dokter dan waktu praktik yang sesuai dengan kebutuhan kamu."
            actionText="Buat Janji Temu Sekarang"
            :actionUrl="route('appointments.create')"
        />
    @endif
</div>
@endsection

