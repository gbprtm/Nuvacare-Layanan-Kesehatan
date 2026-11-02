<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Services\Medicines\MedicineCatalogService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class MedicineCatalogController extends Controller
{
    public function __construct(
        protected MedicineCatalogService $catalogService
    ) {}

    /**
     * Tampilkan katalog referensi obat Formularium Nasional (Fornas).
     */
    public function index(Request $request): View
    {
        $search = $request->query('q');
        $medicines = $this->catalogService->searchCatalog($search);

        return view('medicines.catalog', compact('medicines', 'search'));
    }
}
