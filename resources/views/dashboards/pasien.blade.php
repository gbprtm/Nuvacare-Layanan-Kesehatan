@extends('layouts.patient')

@section('title', 'Beranda Pasien')

@section('content')
<div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Kartu Pengenal Pasien -->
    <div class="card" style="border-left: 4px solid var(--color-primary);">
        <p class="text-small text-muted" style="margin-bottom: 0.25rem;">Selamat Datang Kembali</p>
        <h1 style="font-size: 1.75rem;">Halo, {{ $user->name }}</h1>
        <p class="text-muted" style="margin-top: 0.5rem; max-width: 600px;">
            Halaman beranda untuk memantau jadwal kontrol kesehatan, antrean klinik, dan catatan minum obat harian Anda.
        </p>
    </div>

    <!-- Ringkasan Grid Dua Kolom -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
        <!-- Kolom 1: Jadwal & Antrean -->
        <x-card title="Jadwal Kontrol & Antrean Hari Ini">
            <x-empty-state 
                title="Tidak Ada Jadwal Hari Ini" 
                description="Anda tidak memiliki janji temu dokter atau jadwal kontrol yang terdaftar untuk hari ini."
            />
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; justify-content: center;">
                <a href="{{ route('appointments.create') }}" class="btn btn-primary text-sm" style="text-decoration: none;">
                    Buat Janji Temu
                </a>
                <a href="{{ route('appointments.index') }}" class="btn btn-secondary text-sm" style="text-decoration: none;">
                    Janji Temu Saya
                </a>
            </div>
        </x-card>

        <!-- Kolom 2: Catatan Kebiasaan & Obat -->
        <x-card title="Ringkasan Kebiasaan Sehat">
            <x-empty-state 
                title="Belum Ada Catatan Tercatat" 
                description="Catatan hidrasi, aktivitas, dan waktu tidur harian akan tampil di sini untuk membantu pemantauan kesehatan Anda."
            />
        </x-card>

        <!-- Kolom 3: Profil Kesehatan & Obat Mandiri -->
        <x-card title="Profil Kesehatan & Catatan Obat">
            <p class="text-small text-muted" style="margin-bottom: 1rem;">
                Kelola data kondisi kesehatan fisik, riwayat alergi, serta pantau rekaman obat konsumsi Anda.
            </p>
            <a href="{{ route('profile.show') }}" class="btn btn-secondary text-sm">
                Lihat & Lengkapi Profil
            </a>
        </x-card>
    </div>
</div>
@endsection
