@extends('layouts.admin')

@section('title', 'Detail Janji Temu Operasional - Admin Klinik Sehat')

@section('content')
<div style="max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
    <div>
        <a href="{{ route('admin.appointments.index') }}" class="btn btn-secondary" style="min-height: 38px; padding: 0.375rem 0.75rem; text-decoration: none;" aria-label="Kembali ke daftar janji operasional">
            &larr; Daftar Janji Operasional
        </a>
    </div>

    <div class="card" style="padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--color-line); padding-bottom: 1.25rem;">
            <div>
                <span class="text-small text-muted" style="text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                    Detail Janji Temu Operasional Loket
                </span>
                <h1 class="font-serif" style="font-size: 1.5rem; font-weight: 700; color: var(--color-ink); margin: 0.25rem 0 0 0;">
                    Pasien: {{ $appointment->patient->name ?? '-' }}
                </h1>
                <p class="text-small text-muted" style="margin: 0.125rem 0 0 0;">
                    ID Janji: <code style="font-size: 0.8125rem;">{{ $appointment->id }}</code>
                </p>
            </div>

            <span class="brand-badge" style="background-color: {{ $appointment->status === 'aktif' ? '#EFF6FF' : '#F1F5F9' }}; color: {{ $appointment->status === 'aktif' ? 'var(--color-primary)' : 'var(--color-muted)' }}; border: 1px solid {{ $appointment->status === 'aktif' ? '#BFDBFE' : 'var(--color-line)' }}; font-size: 0.875rem; padding: 0.375rem 0.75rem;">
                {{ $appointment->status_label }}
            </span>
        </div>

        <!-- Kartu Estimasi Kedatangan -->
        <div style="background-color: var(--color-canvas); border-radius: var(--radius-md); padding: 1.25rem; display: flex; justify-content: space-around; text-align: center;">
            <div>
                <span class="text-small text-muted" style="display: block;">Nomor Estimasi Kedatangan</span>
                <span class="font-serif" style="font-size: 2.25rem; font-weight: 700; color: var(--color-ink);">
                    #{{ $appointment->nomor_estimasi }}
                </span>
            </div>
            <div style="border-left: 1px solid var(--color-line); padding-left: 1.5rem;">
                <span class="text-small text-muted" style="display: block;">Perkiraan Jam Layanan</span>
                <span style="font-size: 1.25rem; font-weight: 600; color: var(--color-primary); display: block; margin-top: 0.5rem;">
                    {{ $appointment->perkiraan_jam }}
                </span>
            </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.95rem;">
            <div style="display: flex; justify-content: space-between; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-line);">
                <span class="text-muted">Dokter Pemeriksa:</span>
                <strong style="color: var(--color-ink);">{{ $appointment->doctor->nama ?? '-' }}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-line);">
                <span class="text-muted">Spesialisasi:</span>
                <strong style="color: var(--color-ink);">{{ $appointment->doctor->spesialisasi ?? '-' }}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-line);">
                <span class="text-muted">Tanggal Praktik:</span>
                <strong style="color: var(--color-ink);">
                    {{ $appointment->slot ? \Carbon\Carbon::parse($appointment->slot->tanggal)->translatedFormat('l, d F Y') : '-' }}
                </strong>
            </div>

            <div style="display: flex; justify-content: space-between; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-line);">
                <span class="text-muted">Jam Sesi:</span>
                <strong style="color: var(--color-ink);">
                    {{ $appointment->slot ? $appointment->slot->jam_mulai.' - '.$appointment->slot->jam_selesai.' WIB' : '-' }}
                </strong>
            </div>

            @if($appointment->keluhan)
                <div style="display: flex; flex-direction: column; gap: 0.25rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-line);">
                    <span class="text-muted">Keluhan Pasien:</span>
                    <span style="color: var(--color-ink); background-color: var(--color-canvas); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);">
                        {{ $appointment->keluhan }}
                    </span>
                </div>
            @endif

            @if($appointment->alasan_batal)
                <div style="display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem; background-color: #FEE2E2; border-radius: var(--radius-sm); color: #991B1B;">
                    <strong style="font-size: 0.875rem;">Alasan Pembatalan:</strong>
                    <span>{{ $appointment->alasan_batal }}</span>
                </div>
            @endif
        </div>

        <div style="padding: 0.75rem; background-color: #F8FAFC; border: 1px solid var(--color-line); border-radius: var(--radius-sm); font-size: 0.8125rem; color: var(--color-muted);">
            <em>Catatan Privasi: Sesuai aturan kepatuhan G04 & PRD §4.4, layar operasional loket tidak memuat riwayat alergi, kondisi riwayat medis lengkap, atau catatan kebiasaan pasien.</em>
        </div>
    </div>
</div>
@endsection

