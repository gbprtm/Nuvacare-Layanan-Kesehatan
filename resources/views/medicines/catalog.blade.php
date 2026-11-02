@extends(auth()->check() && auth()->user()->role === 'admin' ? 'layouts.admin' : (auth()->check() ? 'layouts.patient' : 'layouts.app'))

@section('title', 'Katalog Referensi Obat (Fornas)')

@section('content')
<div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 class="page-title text-2xl font-bold font-serif">Katalog Obat Referensi Fornas</h1>
            <p class="text-sm text-muted mt-1">Daftar obat rujukan Formularium Nasional (Fornas) Kementerian Kesehatan RI.</p>
        </div>
    </div>

    {{-- Disclaimer Etis --}}
    <x-alert type="info">
        <div class="font-medium">Catatan Referensi Resmi, Bukan Rekomendasi Medis</div>
        <div class="text-xs mt-1">Informasi katalog obat ini disediakan sebagai rujukan standar nomenklatur obat dan bukan merupakan saran, anjuran pengobatan mandiri, atau resep dokter. Penggunaan obat harus selalu atas instruksi dokter atau tenaga medis berwenang.</div>
    </x-alert>

    {{-- Form Pencarian --}}
    <x-card title="Pencarian Nama Obat">
        <form method="GET" action="{{ route('medication-catalog.index') }}" class="flex flex-col sm:flex-row items-center gap-3">
            <div class="flex-1 w-full">
                <input 
                    type="text" 
                    name="q" 
                    value="{{ $search }}" 
                    placeholder="Cari berdasarkan nama obat Indonesia atau nama internasional (contoh: parasetamol, amoksisilin)..." 
                    class="form-input text-sm"
                >
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto">
                <button type="submit" class="btn btn-primary text-sm w-full sm:w-auto" style="min-width: 100px;">
                    Cari Obat
                </button>
                @if($search)
                    <a href="{{ route('medication-catalog.index') }}" class="btn btn-secondary text-sm">
                        Reset
                    </a>
                @endif
            </div>
        </form>
    </x-card>

    {{-- Tabel Hasil Katalog --}}
    <x-card>
        @if($medicines->isEmpty())
            <x-empty-state 
                title="Obat Tidak Ditemukan" 
                description="Tidak ada entri obat di dalam snapshot katalog Fornas yang cocok dengan kata kunci pencarian Anda." 
            />
        @else
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm" role="table">
                    <thead>
                        <tr class="border-b" style="border-color: var(--color-line-soft); background-color: var(--color-surface-hover);">
                            <th class="p-3 font-semibold" scope="col">Nama Obat (Indonesia)</th>
                            <th class="p-3 font-semibold" scope="col">Nama Internasional</th>
                            <th class="p-3 font-semibold" scope="col">Sumber Rujukan</th>
                            <th class="p-3 font-semibold" scope="col">Cakupan Snapshot</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y" style="border-color: var(--color-line-soft);">
                        @foreach($medicines as $med)
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="p-3 font-semibold text-ink">
                                    {{ $med->nama_indonesia }}
                                </td>
                                <td class="p-3 italic text-muted">
                                    {{ $med->nama_internasional ?: '-' }}
                                </td>
                                <td class="p-3 text-xs">
                                    <div>{{ $med->sumber }}</div>
                                    <div class="font-mono text-muted">{{ $med->tanggal_snapshot ? $med->tanggal_snapshot->format('d/m/Y') : '-' }}</div>
                                </td>
                                <td class="p-3 text-xs text-muted">
                                    {{ $med->cakupan_snapshot ?: 'Katalog Standar' }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <div class="mt-4 pt-3 border-t" style="border-color: var(--color-line-soft);">
                {{ $medicines->links() }}
            </div>
        @endif
    </x-card>
</div>
@endsection

