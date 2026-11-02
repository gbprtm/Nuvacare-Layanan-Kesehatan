@extends('layouts.admin')

@section('title', 'Kelola Data Dokter - Admin Klinik Sehat')

@section('content')
<div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
            <h1 class="font-serif" style="font-size: 1.75rem; font-weight: 700; color: var(--color-ink); margin: 0 0 0.25rem 0;">
                Pengelolaan Tenaga Medis (Dokter)
            </h1>
            <p class="text-small text-muted" style="margin: 0;">
                Kelola daftar dokter aktif, spesialisasi, dan nomor izin praktik klinik.
            </p>
        </div>
    </div>

    <!-- Formulir Tambah Dokter Baru -->
    <details class="card" style="padding: 1.25rem;">
        <summary style="font-weight: 600; font-size: 1rem; color: var(--color-ink); cursor: pointer;">
            + Tambah Dokter Baru
        </summary>
        <form method="POST" action="{{ route('admin.doctors.store') }}" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem;">
            @csrf
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
                <div class="form-group">
                    <label for="nama" class="form-label">Nama Lengkap Dokter:</label>
                    <input type="text" id="nama" name="nama" class="form-control" required placeholder="dr. Budi Santoso, Sp.PD" value="{{ old('nama') }}">
                </div>

                <div class="form-group">
                    <label for="spesialisasi" class="form-label">Spesialisasi:</label>
                    <input type="text" id="spesialisasi" name="spesialisasi" class="form-control" required placeholder="Penyakit Dalam" value="{{ old('spesialisasi') }}">
                </div>

                <div class="form-group">
                    <label for="nomor_izin" class="form-label">Nomor Izin Praktik (SIP):</label>
                    <input type="text" id="nomor_izin" name="nomor_izin" class="form-control" placeholder="SIP-2026-001" value="{{ old('nomor_izin') }}">
                </div>

                <div class="form-group">
                    <label for="aktif" class="form-label">Status Awal:</label>
                    <select id="aktif" name="aktif" class="form-control">
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                    </select>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end;">
                <button type="submit" class="btn btn-primary" style="min-height: 40px; padding: 0.5rem 1.25rem;">
                    Simpan Dokter Baru
                </button>
            </div>
        </form>
    </details>

    <!-- Tabel Daftar Dokter -->
    <div class="card" style="padding: 0; overflow-x: auto;">
        <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-line); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <h2 style="font-size: 1.125rem; font-weight: 600; margin: 0; color: var(--color-ink);">
                Daftar Dokter Terdaftar
            </h2>

            <form method="GET" action="{{ route('admin.doctors.index') }}" style="display: flex; gap: 0.5rem; align-items: center;">
                <select name="specialty" class="form-control" style="font-size: 0.875rem;" onchange="this.form.submit()">
                    <option value="">Semua Spesialisasi</option>
                    @foreach($specialties as $sp)
                        <option value="{{ $sp }}" {{ $selectedSpecialty === $sp ? 'selected' : '' }}>{{ $sp }}</option>
                    @endforeach
                </select>
            </form>
        </div>

        @if($doctors->count() > 0)
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                <thead>
                    <tr style="background-color: var(--color-canvas); border-bottom: 2px solid var(--color-line-strong); color: var(--color-ink);">
                        <th style="padding: 0.75rem 1rem;">Nama Dokter</th>
                        <th style="padding: 0.75rem 1rem;">Spesialisasi</th>
                        <th style="padding: 0.75rem 1rem;">Nomor SIP</th>
                        <th style="padding: 0.75rem 1rem;">Status</th>
                        <th style="padding: 0.75rem 1rem;">Slot Praktik</th>
                        <th style="padding: 0.75rem 1rem; text-align: right;">Aksi Perubahan</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($doctors as $doctor)
                        <tr style="border-bottom: 1px solid var(--color-line);">
                            <td style="padding: 0.75rem 1rem; font-weight: 600; color: var(--color-ink);">
                                {{ $doctor->nama }}
                            </td>
                            <td style="padding: 0.75rem 1rem;">
                                {{ $doctor->spesialisasi }}
                            </td>
                            <td style="padding: 0.75rem 1rem; color: var(--color-muted);">
                                {{ $doctor->nomor_izin ?? '-' }}
                            </td>
                            <td style="padding: 0.75rem 1rem;">
                                <span class="brand-badge" style="background-color: {{ $doctor->aktif ? '#DCFCE7' : '#F1F5F9' }}; color: {{ $doctor->aktif ? '#166534' : 'var(--color-muted)' }};">
                                    {{ $doctor->aktif ? 'Aktif' : 'Nonaktif' }}
                                </span>
                            </td>
                            <td style="padding: 0.75rem 1rem;">
                                {{ $doctor->slots_count }} slot
                            </td>
                            <td style="padding: 0.75rem 1rem; text-align: right;">
                                <details style="display: inline-block; position: relative;">
                                    <summary class="btn btn-secondary" style="font-size: 0.8125rem; min-height: 32px; padding: 0.25rem 0.625rem; cursor: pointer; list-style: none;">
                                        Ubah Data
                                    </summary>
                                    <div style="position: absolute; right: 0; top: 100%; margin-top: 0.25rem; width: 340px; background: #FFFFFF; border: 1px solid var(--color-line-strong); border-radius: var(--radius-md); box-shadow: var(--shadow-md); padding: 1rem; z-index: 20; text-align: left;">
                                        <h3 style="font-size: 0.95rem; font-weight: 600; margin: 0 0 0.75rem 0;">
                                            Ubah Dokter: {{ $doctor->nama }}
                                        </h3>
                                        <form method="POST" action="{{ route('admin.doctors.update', $doctor->id) }}">
                                            @csrf
                                            @method('PATCH')
                                            <div class="form-group" style="margin-bottom: 0.5rem;">
                                                <label class="form-label" style="font-size: 0.75rem;">Nama:</label>
                                                <input type="text" name="nama" class="form-control" style="font-size: 0.8125rem;" value="{{ $doctor->nama }}" required>
                                            </div>
                                            <div class="form-group" style="margin-bottom: 0.5rem;">
                                                <label class="form-label" style="font-size: 0.75rem;">Spesialisasi:</label>
                                                <input type="text" name="spesialisasi" class="form-control" style="font-size: 0.8125rem;" value="{{ $doctor->spesialisasi }}" required>
                                            </div>
                                            <div class="form-group" style="margin-bottom: 0.5rem;">
                                                <label class="form-label" style="font-size: 0.75rem;">Status:</label>
                                                <select name="aktif" class="form-control" style="font-size: 0.8125rem;">
                                                    <option value="1" {{ $doctor->aktif ? 'selected' : '' }}>Aktif</option>
                                                    <option value="0" {{ ! $doctor->aktif ? 'selected' : '' }}>Nonaktif</option>
                                                </select>
                                            </div>
                                            <div class="form-group" style="margin-bottom: 0.75rem;">
                                                <label class="form-label" style="font-size: 0.75rem;">Alasan Audit (Wajib):</label>
                                                <textarea name="alasan" class="form-control" style="font-size: 0.8125rem;" rows="2" required placeholder="Contoh: Pembaruan spesialisasi"></textarea>
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
                {{ $doctors->links() }}
            </div>
        @else
            <div style="padding: 2rem; text-align: center; color: var(--color-muted);">
                Belum ada data dokter yang sesuai dengan filter.
            </div>
        @endif
    </div>
</div>
@endsection

