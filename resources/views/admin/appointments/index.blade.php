@extends('layouts.admin')

@section('title', 'Daftar Janji Temu Operasional - Admin Klinik Sehat')

@section('content')
<div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <div>
        <h1 class="font-serif" style="font-size: 1.75rem; font-weight: 700; color: var(--color-ink); margin: 0 0 0.25rem 0;">
            Daftar Janji Temu Pasien
        </h1>
        <p class="text-small text-muted" style="margin: 0;">
            Proyeksi operasional loket pendaftaran dan jadwal kunjungan pasien Klinik Sehat.
        </p>
    </div>

    <!-- Filter Janji Operasional -->
    <div class="card" style="padding: 1rem 1.25rem;">
        <form method="GET" action="{{ route('admin.appointments.index') }}" style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <label for="date" class="text-small" style="font-weight: 600; color: var(--color-ink);">
                    Tanggal Praktik:
                </label>
                <input type="date" id="date" name="date" value="{{ $selectedDate }}" class="form-control" style="min-width: 160px;">
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <label for="doctor_id" class="text-small" style="font-weight: 600; color: var(--color-ink);">
                    Dokter:
                </label>
                <select id="doctor_id" name="doctor_id" class="form-control" style="min-width: 200px;">
                    <option value="">Semua Dokter</option>
                    @foreach($doctors as $doc)
                        <option value="{{ $doc->id }}" {{ $selectedDoctorId === $doc->id ? 'selected' : '' }}>
                            {{ $doc->nama }}
                        </option>
                    @endforeach
                </select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <label for="status" class="text-small" style="font-weight: 600; color: var(--color-ink);">
                    Status:
                </label>
                <select id="status" name="status" class="form-control" style="min-width: 150px;">
                    <option value="">Semua Status</option>
                    <option value="aktif" {{ $selectedStatus === 'aktif' ? 'selected' : '' }}>Aktif</option>
                    <option value="selesai" {{ $selectedStatus === 'selesai' ? 'selected' : '' }}>Selesai</option>
                    <option value="dibatalkan" {{ $selectedStatus === 'dibatalkan' ? 'selected' : '' }}>Dibatalkan</option>
                </select>
            </div>

            <button type="submit" class="btn btn-secondary" style="min-height: 38px;">
                Terapkan Filter
            </button>

            @if($selectedDate || $selectedDoctorId || $selectedStatus)
                <a href="{{ route('admin.appointments.index') }}" class="text-small" style="color: var(--color-primary); text-decoration: underline; margin-bottom: 0.5rem;">
                    Reset filter
                </a>
            @endif
        </form>
    </div>

    <!-- Tabel Janji Operasional -->
    <div class="card" style="padding: 0; overflow-x: auto;">
        @if($appointments->count() > 0)
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                <thead>
                    <tr style="background-color: var(--color-canvas); border-bottom: 2px solid var(--color-line-strong); color: var(--color-ink);">
                        <th style="padding: 0.75rem 1rem;">Tanggal & Jam WIB</th>
                        <th style="padding: 0.75rem 1rem;">Pasien</th>
                        <th style="padding: 0.75rem 1rem;">Dokter & Spesialisasi</th>
                        <th style="padding: 0.75rem 1rem;">Estimasi Kedatangan</th>
                        <th style="padding: 0.75rem 1rem;">Status</th>
                        <th style="padding: 0.75rem 1rem; text-align: right;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($appointments as $apt)
                        <tr style="border-bottom: 1px solid var(--color-line);">
                            <td style="padding: 0.75rem 1rem; font-weight: 500;">
                                {{ $apt->slot ? \Carbon\Carbon::parse($apt->slot->tanggal)->translatedFormat('d M Y') : '-' }}
                                <span class="text-small text-muted" style="display: block;">
                                    {{ $apt->slot ? $apt->slot->jam_mulai.' - '.$apt->slot->jam_selesai.' WIB' : '-' }}
                                </span>
                            </td>
                            <td style="padding: 0.75rem 1rem; font-weight: 600; color: var(--color-ink);">
                                {{ $apt->patient->name ?? 'Pasien' }}
                            </td>
                            <td style="padding: 0.75rem 1rem;">
                                {{ $apt->doctor->nama ?? '-' }}
                                <span class="text-small text-muted" style="display: block;">
                                    {{ $apt->doctor->spesialisasi ?? '-' }}
                                </span>
                            </td>
                            <td style="padding: 0.75rem 1rem; font-weight: 600;">
                                #{{ $apt->nomor_estimasi }}
                            </td>
                            <td style="padding: 0.75rem 1rem;">
                                <span class="brand-badge" style="background-color: {{ $apt->status === 'aktif' ? '#EFF6FF' : '#F1F5F9' }}; color: {{ $apt->status === 'aktif' ? 'var(--color-primary)' : 'var(--color-muted)' }};">
                                    {{ $apt->status_label }}
                                </span>
                            </td>
                            <td style="padding: 0.75rem 1rem; text-align: right;">
                                <a href="{{ route('admin.appointments.show', $apt->id) }}" class="btn btn-secondary" style="font-size: 0.8125rem; min-height: 32px; padding: 0.25rem 0.625rem; text-decoration: none;">
                                    Detail
                                </a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div style="padding: 1rem;">
                {{ $appointments->links() }}
            </div>
        @else
            <div style="padding: 2rem; text-align: center; color: var(--color-muted);">
                Belum ada data janji temu yang terdaftar untuk filter ini.
            </div>
        @endif
    </div>
</div>
@endsection

