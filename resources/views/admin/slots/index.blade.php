@extends('layouts.admin')

@section('title', 'Kelola Slot Praktik - Admin Klinik Sehat')

@section('content')
<div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <div>
        <h1 class="font-serif" style="font-size: 1.75rem; font-weight: 700; color: var(--color-ink); margin: 0 0 0.25rem 0;">
            Pengelolaan Slot Praktik Dokter
        </h1>
        <p class="text-small text-muted" style="margin: 0;">
            Atur jadwal praktik, waktu layanan konsultasi, dan ketersediaan kuota slot dokter klinik.
        </p>
    </div>

    <!-- Formulir Tambah Slot Baru -->
    <details class="card" style="padding: 1.25rem;">
        <summary style="font-weight: 600; font-size: 1rem; color: var(--color-ink); cursor: pointer;">
            + Tambah Slot Praktik Baru
        </summary>
        <form method="POST" action="{{ route('admin.slots.store') }}" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem;">
            @csrf
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div class="form-group">
                    <label for="dokter_id" class="form-label">Dokter:</label>
                    <select id="dokter_id" name="dokter_id" class="form-control" required>
                        <option value="">Pilih Dokter</option>
                        @foreach($doctors as $doc)
                            <option value="{{ $doc->id }}" {{ old('dokter_id') === $doc->id ? 'selected' : '' }}>
                                {{ $doc->nama }} ({{ $doc->spesialisasi }})
                            </option>
                        @endforeach
                    </select>
                </div>

                <div class="form-group">
                    <label for="tanggal" class="form-label">Tanggal Praktik:</label>
                    <input type="date" id="tanggal" name="tanggal" class="form-control" required min="{{ \App\Support\WibClock::today() }}" value="{{ old('tanggal', \App\Support\WibClock::today()) }}">
                </div>

                <div class="form-group">
                    <label for="jam_mulai" class="form-label">Jam Mulai (WIB):</label>
                    <input type="text" id="jam_mulai" name="jam_mulai" class="form-control" required placeholder="08:00" value="{{ old('jam_mulai', '08:00') }}">
                </div>

                <div class="form-group">
                    <label for="jam_selesai" class="form-label">Jam Selesai (WIB):</label>
                    <input type="text" id="jam_selesai" name="jam_selesai" class="form-control" required placeholder="08:30" value="{{ old('jam_selesai', '08:30') }}">
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end;">
                <button type="submit" class="btn btn-primary" style="min-height: 40px; padding: 0.5rem 1.25rem;">
                    Simpan Slot Praktik
                </button>
            </div>
        </form>
    </details>

    <!-- Tabel Daftar Slot -->
    <div class="card" style="padding: 0; overflow-x: auto;">
        <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-line); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <h2 style="font-size: 1.125rem; font-weight: 600; margin: 0; color: var(--color-ink);">
                Daftar Slot Praktik Terjadwal
            </h2>

            <form method="GET" action="{{ route('admin.slots.index') }}" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                <select name="doctor_id" class="form-control" style="font-size: 0.8125rem;">
                    <option value="">Semua Dokter</option>
                    @foreach($doctors as $doc)
                        <option value="{{ $doc->id }}" {{ $selectedDoctorId === $doc->id ? 'selected' : '' }}>{{ $doc->nama }}</option>
                    @endforeach
                </select>

                <input type="date" name="date" value="{{ $selectedDate }}" class="form-control" style="font-size: 0.8125rem; max-width: 150px;">

                <button type="submit" class="btn btn-secondary" style="font-size: 0.8125rem; min-height: 34px; padding: 0.25rem 0.625rem;">Filter</button>
            </form>
        </div>

        @if($slots->count() > 0)
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                <thead>
                    <tr style="background-color: var(--color-canvas); border-bottom: 2px solid var(--color-line-strong); color: var(--color-ink);">
                        <th style="padding: 0.75rem 1rem;">Tanggal</th>
                        <th style="padding: 0.75rem 1rem;">Jam Layanan</th>
                        <th style="padding: 0.75rem 1rem;">Dokter & Spesialisasi</th>
                        <th style="padding: 0.75rem 1rem;">Status Ketersediaan</th>
                        <th style="padding: 0.75rem 1rem;">Janji Terkait</th>
                        <th style="padding: 0.75rem 1rem; text-align: right;">Aksi Perubahan</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($slots as $slot)
                        <tr style="border-bottom: 1px solid var(--color-line);">
                            <td style="padding: 0.75rem 1rem; font-weight: 500;">
                                {{ \Carbon\Carbon::parse($slot->tanggal)->translatedFormat('d M Y') }}
                            </td>
                            <td style="padding: 0.75rem 1rem; font-weight: 600; color: var(--color-ink);">
                                {{ $slot->jam_mulai }} - {{ $slot->jam_selesai }} WIB
                            </td>
                            <td style="padding: 0.75rem 1rem;">
                                {{ $slot->doctor->nama ?? '-' }}
                                <span class="text-small text-muted" style="display: block;">
                                    {{ $slot->doctor->spesialisasi ?? '-' }}
                                </span>
                            </td>
                            <td style="padding: 0.75rem 1rem;">
                                <span class="brand-badge" style="background-color: {{ $slot->tersedia ? '#DCFCE7' : '#FEE2E2' }}; color: {{ $slot->tersedia ? '#166534' : '#991B1B' }};">
                                    {{ $slot->tersedia ? 'Tersedia' : 'Terisi' }}
                                </span>
                            </td>
                            <td style="padding: 0.75rem 1rem;">
                                {{ $slot->appointments_count }} janji
                            </td>
                            <td style="padding: 0.75rem 1rem; text-align: right;">
                                <details style="display: inline-block; position: relative;">
                                    <summary class="btn btn-secondary" style="font-size: 0.8125rem; min-height: 32px; padding: 0.25rem 0.625rem; cursor: pointer; list-style: none;">
                                        Ubah Slot
                                    </summary>
                                    <div style="position: absolute; right: 0; top: 100%; margin-top: 0.25rem; width: 320px; background: #FFFFFF; border: 1px solid var(--color-line-strong); border-radius: var(--radius-md); box-shadow: var(--shadow-md); padding: 1rem; z-index: 20; text-align: left;">
                                        <h3 style="font-size: 0.95rem; font-weight: 600; margin: 0 0 0.5rem 0;">
                                            Ubah Slot: {{ $slot->jam_mulai }} - {{ $slot->jam_selesai }}
                                        </h3>
                                        @if($slot->appointments_count > 0)
                                            <p class="text-small text-muted" style="margin: 0 0 0.5rem 0; color: #B45309;">
                                                *Slot memiliki janji aktif. Waktu dan ketersediaan tidak dapat diubah langsung.
                                            </p>
                                        @endif
                                        <form method="POST" action="{{ route('admin.slots.update', $slot->id) }}">
                                            @csrf
                                            @method('PATCH')
                                            <div class="form-group" style="margin-bottom: 0.5rem;">
                                                <label class="form-label" style="font-size: 0.75rem;">Jam Mulai:</label>
                                                <input type="text" name="jam_mulai" class="form-control" style="font-size: 0.8125rem;" value="{{ $slot->jam_mulai }}">
                                            </div>
                                            <div class="form-group" style="margin-bottom: 0.5rem;">
                                                <label class="form-label" style="font-size: 0.75rem;">Jam Selesai:</label>
                                                <input type="text" name="jam_selesai" class="form-control" style="font-size: 0.8125rem;" value="{{ $slot->jam_selesai }}">
                                            </div>
                                            <div class="form-group" style="margin-bottom: 0.75rem;">
                                                <label class="form-label" style="font-size: 0.75rem;">Alasan Audit (Wajib):</label>
                                                <textarea name="alasan" class="form-control" style="font-size: 0.8125rem;" rows="2" required placeholder="Contoh: Penyesuaian jam dokter"></textarea>
                                            </div>
                                            <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                                                <button type="submit" class="btn btn-primary" style="font-size: 0.8125rem; min-height: 32px; padding: 0.25rem 0.75rem;">
                                                    Simpan Perubahan
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </details>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div style="padding: 1rem;">
                {{ $slots->links() }}
            </div>
        @else
            <div style="padding: 2rem; text-align: center; color: var(--color-muted);">
                Belum ada data slot praktik yang sesuai dengan filter.
            </div>
        @endif
    </div>
</div>
@endsection

