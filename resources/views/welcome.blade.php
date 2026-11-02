@extends('layouts.app')

@section('title', 'Layanan Kesehatan Personal')

@section('content')
<div class="container" style="padding-top: 3.5rem; padding-bottom: 3.5rem;">
    <div class="card" style="text-align: center; max-width: 680px; margin: 0 auto; padding: 2.5rem 2rem;">
        <div style="margin-bottom: 1.5rem;">
            <span class="badge badge-success" style="font-size: 0.8125rem;">Portal Layanan Kesehatan & Loket Klinik</span>
        </div>
        <h1 style="margin-bottom: 1rem;">
            Layanan Kesehatan Personal
        </h1>
        <p class="text-muted" style="font-size: 1.0625rem; margin-bottom: 2rem;">
            Sistem pengelolaan jadwal kontrol berkala, reservasi slot praktik dokter, dan pemantauan nomor antrian klinik terintegrasi.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <a href="/masuk" class="btn btn-primary">Masuk ke Akun</a>
            <a href="/daftar" class="btn btn-secondary">Pendaftaran Pasien Baru</a>
        </div>
    </div>
</div>
@endsection
