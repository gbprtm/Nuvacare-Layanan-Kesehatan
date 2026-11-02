@extends('layouts.patient')

@section('title', 'Profil Kesehatan Saya')

@section('content')
<div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 class="page-title text-2xl font-bold font-serif">Profil Kesehatan Pasien</h1>
            <p class="text-sm text-muted mt-1">Data kesehatan personal dan rekaman riwayat obat yang digunakan dalam pelayanan klinik.</p>
        </div>
        <div>
            <a href="{{ route('profile.edit') }}" class="btn btn-primary text-sm">
                Perbarui Data Profil
            </a>
        </div>
    </div>

    @if(!$isComplete)
        <x-alert type="warning">
            <div class="font-medium">Profil Anda belum lengkap.</div>
            <div class="text-xs mt-1">Lengkapi tanggal lahir dan nomor telepon untuk mempermudah pencatatan saat kunjungan di loket klinik.</div>
        </x-alert>
    @endif

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {{-- Kartu Data Pribadi & Fisik --}}
        <x-card title="Informasi Pasien & Fisik">
            <dl class="divide-y text-sm" style="border-color: var(--color-line-soft);">
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">Nama Lengkap</dt>
                    <dd class="font-semibold text-ink">{{ $user->nama_lengkap ?? $user->name }}</dd>
                </div>
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">Email Akun</dt>
                    <dd class="text-ink">{{ $user->email }}</dd>
                </div>
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">Nomor Telepon</dt>
                    <dd class="text-ink">{{ $profile?->nomor_telepon ?: '(Belum diisi)' }}</dd>
                </div>
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">Tanggal Lahir</dt>
                    <dd class="text-ink">{{ $profile?->tanggal_lahir ? $profile->tanggal_lahir->format('d/m/Y') : '(Belum diisi)' }}</dd>
                </div>
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">Jenis Kelamin</dt>
                    <dd class="text-ink capitalize">{{ $profile?->jenis_kelamin ?: '(Belum diisi)' }}</dd>
                </div>
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">Golongan Darah</dt>
                    <dd class="text-ink font-bold">{{ $profile?->golongan_darah ?: '-' }}</dd>
                </div>
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">Tinggi / Berat Badan</dt>
                    <dd class="text-ink">
                        {{ $profile?->tinggi_badan ? $profile->tinggi_badan . ' cm' : '-' }} / 
                        {{ $profile?->berat_badan ? $profile->berat_badan . ' kg' : '-' }}
                    </dd>
                </div>
            </dl>
        </x-card>

        {{-- Kartu Kondisi & Kontak Darurat --}}
        <div class="space-y-6">
            <x-card title="Riwayat Medis & Alergi">
                <div class="space-y-3 text-sm">
                    <div>
                        <span class="font-medium text-muted block text-xs uppercase tracking-wider mb-1">Kondisi Kesehatan Terpantau:</span>
                        <div class="p-2.5 rounded bg-gray-50 border border-gray-200 text-ink">
                            {{ $profile?->kondisi_kesehatan ?: 'Tidak ada catatan kondisi khusus.' }}
                        </div>
                    </div>
                    <div>
                        <span class="font-medium text-muted block text-xs uppercase tracking-wider mb-1">Riwayat Alergi:</span>
                        <div class="p-2.5 rounded bg-gray-50 border border-gray-200 text-ink">
                            {{ $profile?->riwayat_alergi ?: 'Tidak ada riwayat alergi yang dilaporkan.' }}
                        </div>
                    </div>
                </div>
            </x-card>

            <x-card title="Kontak Darurat">
                <dl class="divide-y text-sm" style="border-color: var(--color-line-soft);">
                    <div class="py-2.5 flex justify-between">
                        <dt class="font-medium text-muted">Nama Kontak</dt>
                        <dd class="font-medium text-ink">{{ $profile?->kontak_darurat_nama ?: '(Belum diisi)' }}</dd>
                    </div>
                    <div class="py-2.5 flex justify-between">
                        <dt class="font-medium text-muted">Nomor Telepon</dt>
                        <dd class="font-mono text-ink">{{ $profile?->kontak_darurat_telepon ?: '(Belum diisi)' }}</dd>
                    </div>
                </dl>
            </x-card>
        </div>
    </div>

    {{-- Kartu Capture Konsumsi Obat (Read-Only Capture) --}}
    <x-card title="Rekaman Capture Konsumsi Obat">
        <p class="text-xs text-muted mb-4">
            Daftar ini adalah rekaman catatan obat yang tersimpan untuk referensi kesehatan Anda. Penyesuaian atau penambahan resep obat dilakukan melalui konsultasi dengan dokter klinik.
        </p>

        @if($capturedMedications->isEmpty())
            <x-empty-state 
                title="Belum Ada Obat yang Ter-capture" 
                description="Belum ada riwayat konsumsi obat yang tercatat pada profil kesehatan Anda." 
            />
        @else
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm" role="table">
                    <thead>
                        <tr class="border-b" style="border-color: var(--color-line-soft); background-color: var(--color-surface-hover);">
                            <th class="p-3 font-semibold">Nama Obat</th>
                            <th class="p-3 font-semibold">Nama Internasional</th>
                            <th class="p-3 font-semibold">Dosis & Aturan</th>
                            <th class="p-3 font-semibold">Periode Konsumsi</th>
                            <th class="p-3 font-semibold">Catatan</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y" style="border-color: var(--color-line-soft);">
                        @foreach($capturedMedications as $med)
                            <tr>
                                <td class="p-3 font-medium text-ink">{{ $med->nama_obat }}</td>
                                <td class="p-3 text-muted text-xs italic">{{ $med->nama_internasional ?: '-' }}</td>
                                <td class="p-3 text-xs">
                                    {{ $med->dosis_catatan ?: '-' }} {{ $med->frekuensi_catatan ? '(' . $med->frekuensi_catatan . ')' : '' }}
                                </td>
                                <td class="p-3 font-mono text-xs whitespace-nowrap">
                                    {{ $med->mulai_pada ? $med->mulai_pada->format('d/m/Y') : '-' }} s/d 
                                    {{ $med->selesai_pada ? $med->selesai_pada->format('d/m/Y') : 'Sekarang' }}
                                </td>
                                <td class="p-3 text-xs text-muted">{{ $med->catatan ?: '-' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </x-card>

    {{-- Kartu Aksi Berbahaya (Reset Profil) --}}
    <x-card title="Kosongkan Data Profil">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="text-xs text-muted max-w-xl">
                Tindakan ini akan mengosongkan seluruh data profil kesehatan mandiri Anda. Akun Anda tetap aktif dan resep medis klinik tidak akan terhapus.
            </div>
            <form method="POST" action="{{ route('profile.destroy') }}" class="flex flex-col sm:flex-row items-center gap-2">
                @csrf
                @method('DELETE')
                <input type="text" name="confirmation" placeholder="Ketik: HAPUS PROFIL" class="form-input text-xs" style="max-width: 170px;" required>
                <button type="submit" class="btn btn-secondary text-xs" style="color: var(--color-danger); border-color: var(--color-danger); min-height: 40px;">
                    Kosongkan Profil
                </button>
            </form>
        </div>
    </x-card>
</div>
@endsection

