@extends('layouts.patient')

@section('title', 'Detail Janji Temu - Klinik Sehat')

@section('content')
<div style="max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Breadcrumb / Kembali -->
    <div>
        <a href="{{ route('appointments.index') }}" class="btn btn-secondary" style="min-height: 38px; padding: 0.375rem 0.75rem; text-decoration: none;" aria-label="Kembali ke daftar janji">
            &larr; Daftar Janji Temu
        </a>
    </div>

    <!-- Kartu Konfirmasi Janji Temu -->
    <div class="card" style="padding: 2rem; border-top: 6px solid var(--color-primary); display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--color-line); padding-bottom: 1.25rem;">
            <div>
                <span class="text-small text-muted" style="text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                    Konfirmasi Janji Temu
                </span>
                <h1 class="font-serif" style="font-size: 1.75rem; font-weight: 700; color: var(--color-ink); margin: 0.25rem 0 0 0;">
                    {{ $appointment->doctor->nama ?? 'Dokter Klinik' }}
                </h1>
                <p class="text-small text-muted" style="margin: 0.125rem 0 0 0;">
                    Spesialisasi: {{ $appointment->doctor->spesialisasi ?? '-' }}
                </p>
            </div>

            <span class="brand-badge" style="background-color: {{ $appointment->status === 'aktif' ? '#EFF6FF' : '#F1F5F9' }}; color: {{ $appointment->status === 'aktif' ? 'var(--color-primary)' : 'var(--color-muted)' }}; border: 1px solid {{ $appointment->status === 'aktif' ? '#BFDBFE' : 'var(--color-line)' }}; font-size: 0.875rem; padding: 0.375rem 0.75rem;">
                {{ $appointment->status_label }}
            </span>
        </div>

        <!-- Tiket Estimasi Kedatangan -->
        <div style="background-color: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: var(--radius-md); padding: 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <span class="text-small text-muted" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                Nomor Estimasi Kedatangan
            </span>
            <div class="font-serif" style="font-size: 3.5rem; font-weight: 700; color: var(--color-ink); line-height: 1;">
                #{{ $appointment->nomor_estimasi }}
            </div>
            <div style="font-size: 1.125rem; font-weight: 600; color: var(--color-primary); margin-top: 0.25rem;">
                Perkiraan Jam: {{ $appointment->perkiraan_jam }}
            </div>
            <p class="text-small text-muted" style="margin: 0.5rem 0 0 0; max-width: 440px; font-style: italic;">
                *Ini adalah <strong>nomor perkiraan kedatangan</strong>, bukan nomor urutan panggilan antrean klinik. Nomor antrean loket final diterbitkan saat check-in di klinik.
            </p>
        </div>

        <!-- Rincian Waktu & Lokasi -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.95rem;">
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

            <div style="display: flex; justify-content: space-between; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-line);">
                <span class="text-muted">Nama Pasien:</span>
                <strong style="color: var(--color-ink);">
                    {{ $appointment->patient->name ?? auth()->user()->name }}
                </strong>
            </div>

            @if($appointment->keluhan)
                <div style="display: flex; flex-direction: column; gap: 0.25rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-line);">
                    <span class="text-muted">Keluhan yang Dilaporkan:</span>
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

        <!-- Tombol Aksi -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-line);">
            <a href="{{ route('patient.dashboard') }}" class="btn btn-secondary" style="min-height: 40px; padding: 0.5rem 1rem; text-decoration: none;">
                Kembali ke Beranda
            </a>

            @if($appointment->can_cancel)
                <!-- Form Pembatalan Janji -->
                <details style="position: relative;">
                    <summary class="btn btn-danger" style="cursor: pointer; min-height: 40px; padding: 0.5rem 1rem; list-style: none;">
                        Batalkan Janji Ini
                    </summary>
                    <div style="position: absolute; right: 0; bottom: 100%; margin-bottom: 0.5rem; width: 320px; background: #FFFFFF; border: 1px solid var(--color-line-strong); border-radius: var(--radius-md); box-shadow: var(--shadow-md); padding: 1rem; z-index: 10;">
                        <h3 style="font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem 0; color: var(--color-ink);">
                            Konfirmasi Pembatalan
                        </h3>
                        <p class="text-small text-muted" style="margin: 0 0 0.75rem 0;">
                            Slot praktik ini akan dilepaskan dan dapat diambil oleh pasien lain.
                        </p>
                        <form method="POST" action="{{ route('appointments.cancel', $appointment->id) }}">
                            @csrf
                            <div class="form-group" style="margin-bottom: 0.75rem;">
                                <label for="alasan" class="form-label" style="font-size: 0.8125rem;">Alasan Batal:</label>
                                <textarea id="alasan" name="alasan" rows="2" class="form-control" style="font-size: 0.875rem;" required placeholder="Contoh: Ada keperluan mendesak"></textarea>
                            </div>
                            <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                                <button type="submit" class="btn btn-danger" style="font-size: 0.875rem; min-height: 36px; padding: 0.25rem 0.75rem;">
                                    Ya, Batalkan
                                </button>
                            </div>
                        </form>
                    </div>
                </details>
            @endif
        </div>
    </div>
</div>
@endsection

