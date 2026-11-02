@extends('layouts.admin')

@section('title', 'Audit Log Operasional')

@section('content')
<div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 class="page-title text-2xl font-bold font-serif">Audit Log Operasional</h1>
            <p class="text-sm text-muted mt-1">Catatan riwayat transaksi dan mutasi admin yang bersifat permanen (append-only).</p>
        </div>
    </div>

    {{-- Filter Form --}}
    <x-card title="Penyaringan Log">
        <form method="GET" action="{{ route('admin.audit.index') }}" class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
                <label for="filter-action" class="form-label text-sm font-medium">Aksi</label>
                <select id="filter-action" name="action" class="form-input">
                    <option value="">-- Semua Aksi --</option>
                    @foreach($availableActions as $action)
                        <option value="{{ $action }}" @selected(request('action') === $action)>{{ $action }}</option>
                    @endforeach
                </select>
            </div>

            <div>
                <label for="filter-object" class="form-label text-sm font-medium">Objek</label>
                <select id="filter-object" name="object_type" class="form-input">
                    <option value="">-- Semua Objek --</option>
                    @foreach($availableObjects as $object)
                        <option value="{{ $object }}" @selected(request('object_type') === $object)>{{ $object }}</option>
                    @endforeach
                </select>
            </div>

            <div>
                <label for="filter-object-id" class="form-label text-sm font-medium">ID Objek</label>
                <input type="text" id="filter-object-id" name="object_id" value="{{ request('object_id') }}" placeholder="Cari ID Objek" class="form-input">
            </div>

            <div>
                <label for="filter-from" class="form-label text-sm font-medium">Dari Tanggal</label>
                <input type="date" id="filter-from" name="from" value="{{ request('from') }}" class="form-input">
            </div>

            <div>
                <label for="filter-to" class="form-label text-sm font-medium">Sampai Tanggal</label>
                <input type="date" id="filter-to" name="to" value="{{ request('to') }}" class="form-input">
            </div>

            <div class="md:col-span-5 flex items-center justify-end gap-2 mt-2">
                <a href="{{ route('admin.audit.index') }}" class="btn btn-secondary text-sm">Atur Ulang</a>
                <button type="submit" class="btn btn-primary text-sm">Terapkan Filter</button>
            </div>
        </form>
    </x-card>

    {{-- Tabel Audit Log --}}
    <x-card>
        @if($auditLogs->isEmpty())
            <x-empty-state 
                title="Tidak ada catatan audit log" 
                description="Belum ada catatan aktivitas yang cocok dengan kriteria filter yang Anda tentukan." 
            />
        @else
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm" role="table">
                    <thead>
                        <tr class="border-b" style="border-color: var(--color-line-soft); background-color: var(--color-surface-hover);">
                            <th class="p-3 font-semibold" scope="col">Waktu (WIB)</th>
                            <th class="p-3 font-semibold" scope="col">Aktor</th>
                            <th class="p-3 font-semibold" scope="col">Aksi</th>
                            <th class="p-3 font-semibold" scope="col">Objek</th>
                            <th class="p-3 font-semibold" scope="col">Alasan</th>
                            <th class="p-3 font-semibold text-right" scope="col">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y" style="border-color: var(--color-line-soft);">
                        @foreach($auditLogs as $log)
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="p-3 font-mono text-xs whitespace-nowrap">
                                    {{ $log->created_at ? $log->created_at->format('d/m/Y H:i:s') : '-' }} WIB
                                </td>
                                <td class="p-3 whitespace-nowrap">
                                    <div class="font-medium text-ink">{{ $log->user?->nama_lengkap ?? 'Sistem' }}</div>
                                    <div class="text-xs text-muted">{{ $log->user?->email ?? '-' }}</div>
                                </td>
                                <td class="p-3">
                                    <span class="inline-block px-2 py-0.5 rounded text-xs font-semibold" style="background-color: var(--color-line-soft); color: var(--color-ink);">
                                        {{ $log->aksi }}
                                    </span>
                                </td>
                                <td class="p-3 font-mono text-xs">
                                    <div><strong>{{ $log->objek }}</strong></div>
                                    <div class="text-muted truncate max-w-[150px]" title="{{ $log->objek_id }}">{{ $log->objek_id }}</div>
                                </td>
                                <td class="p-3 max-w-[200px] truncate" title="{{ $log->alasan }}">
                                    {{ $log->alasan ?: '-' }}
                                </td>
                                <td class="p-3 text-right whitespace-nowrap">
                                    <a href="{{ route('admin.audit.show', $log) }}" class="btn btn-secondary text-xs" style="min-height: 36px; padding: 0.35rem 0.75rem;">
                                        Rincian
                                    </a>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <div class="mt-4 pt-3 border-t" style="border-color: var(--color-line-soft);">
                {{ $auditLogs->links() }}
            </div>
        @endif
    </x-card>
</div>
@endsection

