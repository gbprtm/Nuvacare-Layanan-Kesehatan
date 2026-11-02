@extends('layouts.patient')

@section('title', 'Buat Janji Temu - Klinik Sehat')

@section('content')
<div style="max-width: 768px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Tombol Kembali dan Header Alur -->
    <div style="display: flex; align-items: center; gap: 0.75rem;">
        <a href="{{ route('appointments.index') }}" class="btn btn-secondary" style="min-height: 38px; padding: 0.375rem 0.75rem; text-decoration: none;" aria-label="Kembali ke daftar janji">
            &larr; Kembali
        </a>
        <div>
            <h1 class="font-serif" style="font-size: 1.75rem; font-weight: 700; color: var(--color-ink); margin: 0;">
                Buat Janji Temu
            </h1>
            <p class="text-small text-muted" style="margin: 0.125rem 0 0 0;">
                Tiga langkah mudah: pilih spesialisasi, pilih waktu slot praktik, dan konfirmasi.
            </p>
        </div>
    </div>

    @if(session('conflict'))
        <x-alert type="warning">
            <strong>Terjadi Bentrok Slot:</strong> {{ session('conflict') }}
        </x-alert>
    @endif

    <!-- STEP 1 (P6): Pilih Spesialisasi -->
    <div class="card" style="padding: 1.25rem 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--color-line); padding-bottom: 0.75rem;">
            <h2 style="font-size: 1.125rem; font-weight: 600; color: var(--color-ink); margin: 0;">
                1. Pilih Spesialisasi Kunjungan
            </h2>
            @if($selectedSpecialty)
                <a href="{{ route('appointments.create') }}" class="text-small" style="color: var(--color-primary); text-decoration: underline;">
                    Ganti Spesialisasi
                </a>
            @endif
        </div>

        @if(! $selectedSpecialty)
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                @forelse($specialties as $sp)
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 1rem; border: 1px solid var(--color-line); border-radius: var(--radius-md); background-color: {{ $sp->bisa_dipilih ? '#FFFFFF' : 'var(--color-canvas)' }};">
                        <div>
                            <span style="font-weight: 600; font-size: 1rem; color: {{ $sp->bisa_dipilih ? 'var(--color-ink)' : 'var(--color-muted)' }}; display: block;">
                                {{ $sp->nama }}
                            </span>
                            <span class="text-small" style="color: {{ $sp->slot_tersedia_count > 0 ? 'var(--color-primary)' : 'var(--color-muted)' }};">
                                {{ $sp->slot_tersedia_count }} slot tersedia
                            </span>
                        </div>

                        @if($sp->bisa_dipilih)
                            <a href="{{ route('appointments.create', ['spesialisasi' => $sp->nama]) }}" class="btn btn-secondary" style="min-height: 36px; padding: 0.375rem 0.875rem; text-decoration: none; font-size: 0.875rem;">
                                Pilih Spesialisasi
                            </a>
                        @else
                            <button type="button" class="btn btn-secondary" disabled style="opacity: 0.6; cursor: not-allowed; min-height: 36px; font-size: 0.875rem;">
                                Tidak Ada Slot
                            </button>
                        @endif
                    </div>
                @empty
                    <p class="text-muted" style="margin: 0; font-size: 0.875rem;">
                        Belum ada spesialisasi dokter aktif yang terdaftar di klinik.
                    </p>
                @endforelse
            </div>
        @else
            <div style="background-color: var(--color-canvas); padding: 0.75rem 1rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span class="text-small text-muted" style="display: block;">Spesialisasi Terpilih:</span>
                    <strong style="color: var(--color-ink); font-size: 1.05rem;">{{ $selectedSpecialty }}</strong>
                </div>
                <span class="brand-badge" style="background-color: #EFF6FF; color: var(--color-primary);">Terpilih</span>
            </div>
        @endif
    </div>

    <!-- STEP 2 (P7): Pilih Waktu & Slot Praktik (Hanya jika spesialisasi dipilih) -->
    @if($selectedSpecialty)
        <div class="card" style="padding: 1.25rem 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--color-line); padding-bottom: 0.75rem;">
                <h2 style="font-size: 1.125rem; font-weight: 600; color: var(--color-ink); margin: 0;">
                    2. Pilih Waktu Praktik
                </h2>
                <span class="text-small text-muted">Waktu Indonesia Barat (WIB)</span>
            </div>

            <!-- Pemilih Tanggal -->
            <form method="GET" action="{{ route('appointments.create') }}" style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap;">
                <input type="hidden" name="spesialisasi" value="{{ $selectedSpecialty }}">
                <label for="tanggal" class="text-small" style="font-weight: 600; color: var(--color-ink);">
                    Tanggal Praktik:
                </label>
                <input type="date" id="tanggal" name="tanggal" value="{{ $selectedDate }}" min="{{ \App\Support\WibClock::today() }}" class="form-control" style="max-width: 200px;">
                <button type="submit" class="btn btn-secondary" style="min-height: 38px;">Cari Slot</button>
            </form>

            <!-- Grid Slot Praktik -->
            @if($availableSlots->count() > 0)
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.875rem;">
                    @foreach($availableSlots as $slot)
                        @php
                            $isBooked = ! $slot->tersedia;
                            $isSelected = $selectedSlot && $selectedSlot->id === $slot->id;
                        @endphp

                        <div style="border: 2px solid {{ $isSelected ? 'var(--color-primary)' : ($isBooked ? 'var(--color-line)' : 'var(--color-line-strong)') }}; border-radius: var(--radius-md); padding: 0.875rem; background-color: {{ $isSelected ? '#EFF6FF' : ($isBooked ? 'var(--color-canvas)' : '#FFFFFF') }}; display: flex; flex-direction: column; justify-content: space-between; gap: 0.5rem;">
                            <div>
                                <span class="text-small" style="font-weight: 600; color: var(--color-ink); display: block;">
                                    {{ $slot->doctor->nama ?? 'Dokter' }}
                                </span>
                                <span style="font-size: 1.125rem; font-weight: 700; color: {{ $isBooked ? 'var(--color-muted)' : 'var(--color-ink)' }}; display: block; margin-top: 0.25rem;">
                                    {{ $slot->jam_mulai }} - {{ $slot->jam_selesai }} WIB
                                </span>
                            </div>

                            <div style="margin-top: 0.5rem;">
                                @if($isBooked)
                                    <span class="text-small text-muted" style="display: block; font-weight: 500; background-color: #F1F5F9; text-align: center; padding: 0.25rem; border-radius: var(--radius-sm);">
                                        Terisi
                                    </span>
                                @elseif($isSelected)
                                    <span class="text-small" style="display: block; font-weight: 600; color: var(--color-primary); text-align: center; padding: 0.25rem; background-color: #DBEAFE; border-radius: var(--radius-sm);">
                                        ✓ Slot Dipilih
                                    </span>
                                @else
                                    <a href="{{ route('appointments.create', ['spesialisasi' => $selectedSpecialty, 'tanggal' => $selectedDate, 'slot_id' => $slot->id]) }}" class="btn btn-secondary" style="width: 100%; min-height: 36px; padding: 0.25rem; font-size: 0.875rem; text-decoration: none; text-align: center; display: block;">
                                        Pilih Jam Ini
                                    </a>
                                @endif
                            </div>
                        </div>
                    @endforeach
                </div>
            @else
                <p class="text-muted" style="margin: 0; padding: 1rem; background-color: var(--color-canvas); border-radius: var(--radius-md); font-size: 0.875rem; text-align: center;">
                    Tidak ada jadwal slot praktik pada hari ini ({{ \Carbon\Carbon::parse($selectedDate)->translatedFormat('l, d F Y') }}). Silakan pilih tanggal lain di atas.
                </p>
            @endif
        </div>
    @endif

    <!-- STEP 3 (P8): Formulir Konfirmasi Janji Temu (Hanya jika slot dipilih) -->
    @if($selectedSlot)
        <div class="card" style="padding: 1.5rem; border: 2px solid var(--color-primary);">
            <div style="margin-bottom: 1.25rem; border-bottom: 1px solid var(--color-line); padding-bottom: 0.75rem;">
                <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--color-ink); margin: 0 0 0.25rem 0;">
                    3. Konfirmasi Janji Temu
                </h2>
                <p class="text-small text-muted" style="margin: 0;">
                    Periksa kembali data kunjungan kamu sebelum mengunci jadwal slot praktik.
                </p>
            </div>

            <div style="background-color: var(--color-canvas); padding: 1rem 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="display: flex; justify-content: space-between;">
                    <span class="text-small text-muted">Dokter:</span>
                    <strong style="color: var(--color-ink);">{{ $selectedSlot->doctor->nama ?? '-' }}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span class="text-small text-muted">Spesialisasi:</span>
                    <strong style="color: var(--color-ink);">{{ $selectedSlot->doctor->spesialisasi ?? '-' }}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span class="text-small text-muted">Hari & Tanggal:</span>
                    <strong style="color: var(--color-ink);">{{ \Carbon\Carbon::parse($selectedSlot->tanggal)->translatedFormat('l, d F Y') }}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span class="text-small text-muted">Jam Layanan:</span>
                    <strong style="color: var(--color-ink);">{{ $selectedSlot->jam_mulai }} - {{ $selectedSlot->jam_selesai }} WIB</strong>
                </div>
            </div>

            <div style="padding: 0.75rem 1rem; background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: var(--radius-sm); margin-bottom: 1.25rem; font-size: 0.875rem; color: #92400E;">
                <strong>Perhatian:</strong> Slot praktik dikunci secara resmi setelah kamu menekan tombol di bawah. Nomor estimasi yang diterbitkan adalah perkiraan kedatangan, bukan nomor urutan panggilan antrean klinik. Nomor antrean loket final akan dicetak saat check-in langsung di klinik.
            </div>

            <form method="POST" action="{{ route('appointments.store') }}">
                @csrf
                <input type="hidden" name="slot_id" value="{{ $selectedSlot->id }}">
                <input type="hidden" name="spesialisasi" value="{{ $selectedSpecialty }}">
                <input type="hidden" name="tanggal" value="{{ $selectedDate }}">

                <div class="form-group" style="margin-bottom: 1.25rem;">
                    <label for="keluhan" class="form-label">
                        Keluhan Singkat (Opsional, Maks. 200 karakter):
                    </label>
                    <textarea 
                        id="keluhan" 
                        name="keluhan" 
                        rows="2" 
                        maxlength="200" 
                        class="form-control" 
                        placeholder="Contoh: Sakit tenggorokan sejak 2 hari yang lalu">{{ old('keluhan') }}</textarea>
                    <span class="form-hint">Informasi ini membantu dokter mempersiapkan sesi konsultasi Anda.</span>
                </div>

                <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                    <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0.625rem 1.5rem; font-weight: 600;">
                        Buat Janji Temu
                    </button>
                    <a href="{{ route('appointments.create', ['spesialisasi' => $selectedSpecialty, 'tanggal' => $selectedDate]) }}" class="btn btn-secondary" style="min-height: 44px; padding: 0.625rem 1.25rem; text-decoration: none;">
                        Batalkan Pilihan
                    </a>
                </div>
            </form>
        </div>
    @endif
</div>
@endsection

