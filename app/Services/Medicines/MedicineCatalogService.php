<?php

namespace App\Services\Medicines;

use App\Models\FornasCatalog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MedicineCatalogService
{
    /**
     * Cari entri katalog obat referensi Fornas.
     */
    public function searchCatalog(?string $search, int $perPage = 15): LengthAwarePaginator
    {
        $query = FornasCatalog::query()->where('aktif', true);

        if ($search !== null && trim($search) !== '') {
            $keyword = '%'.trim($search).'%';
            $query->where(function ($q) use ($keyword) {
                $q->where('nama_indonesia', 'ilike', $keyword)
                    ->orWhere('nama_internasional', 'ilike', $keyword);
            });
        }

        return $query->orderBy('nama_indonesia', 'asc')
            ->paginate($perPage)
            ->withQueryString();
    }
}
