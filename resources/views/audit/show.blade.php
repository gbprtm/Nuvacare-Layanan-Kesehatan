@extends('layouts.admin')

@section('title', 'Rincian Entri Audit')

@section('content')
<div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
        <div>
            <h1 class="page-title text-2xl font-bold font-serif">Rincian Audit Log</h1>
            <p class="text-sm text-muted mt-1">ID Log: <span class="font-mono">{{ $auditLog->id }}</span></p>
        </div>
        <div>
            <a href="{{ route('admin.audit.index') }}" class="btn btn-secondary text-sm">Kembali ke Daftar</a>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {{-- Metadata Transaksi --}}
        <x-card title="Metadata Transaksi">
            <dl class="divide-y text-sm" style="border-color: var(--color-line-soft);">
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">Waktu Pencatatan</dt>
                    <dd class="font-mono text-ink">{{ $auditLog->created_at ? $auditLog->created_at->format('d/m/Y H:i:s') : '-' }} WIB</dd>
                </div>
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">Aktor Pelaksana</dt>
                    <dd class="text-ink font-medium">{{ $auditLog->user?->nama_lengkap ?? 'Sistem' }} ({{ $auditLog->user?->email ?? 'N/A' }})</dd>
                </div>
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">Alamat IP</dt>
                    <dd class="font-mono text-ink">{{ $auditLog->ip_address ?: '-' }}</dd>
                </div>
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">Aksi Operasional</dt>
                    <dd class="font-semibold text-ink">{{ $auditLog->aksi }}</dd>
                </div>
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">Tipe Objek</dt>
                    <dd class="font-mono text-ink">{{ $auditLog->objek }}</dd>
                </div>
                <div class="py-2.5 flex justify-between">
                    <dt class="font-medium text-muted">ID Objek</dt>
                    <dd class="font-mono text-xs text-ink break-all">{{ $auditLog->objek_id }}</dd>
                </div>
                <div class="py-2.5 flex flex-col">
                    <dt class="font-medium text-muted mb-1">Alasan</dt>
                    <dd class="text-ink bg-gray-50 p-2.5 rounded border border-gray-200 text-sm whitespace-pre-wrap">{{ $auditLog->alasan ?: '(Tidak dicantumkan)' }}</dd>
                </div>
            </dl>
        </x-card>

        {{-- Snapshot Nilai Perubahan --}}
        <x-card title="Perbandingan Nilai Data">
            <div class="space-y-4">
                <div>
                    <h3 class="text-xs font-bold uppercase tracking-wider text-muted mb-1">Nilai Sebelum:</h3>
                    <div class="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                        @if($auditLog->nilai_sebelum)
                            <pre class="text-xs font-mono text-ink">{{ json_encode($auditLog->nilai_sebelum, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</pre>
                        @else
                            <span class="text-xs text-muted italic">Tidak ada (entitas baru dibuat)</span>
                        @endif
                    </div>
                </div>

                <div>
                    <h3 class="text-xs font-bold uppercase tracking-wider text-muted mb-1">Nilai Sesudah:</h3>
                    <div class="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                        @if($auditLog->nilai_sesudah)
                            <pre class="text-xs font-mono text-ink">{{ json_encode($auditLog->nilai_sesudah, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</pre>
                        @else
                            <span class="text-xs text-muted italic">Tidak ada (entitas dihapus / status kosong)</span>
                        @endif
                    </div>
                </div>
            </div>
        </x-card>
    </div>
</div>
@endsection

