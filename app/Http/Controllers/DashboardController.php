<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    /**
     * Tampilkan dasbor pasien (/beranda).
     */
    public function patient(Request $request): View
    {
        $user = $request->user();

        return view('dashboards.pasien', [
            'user' => $user,
        ]);
    }

    /**
     * Tampilkan dasbor operasional admin (/admin).
     */
    public function admin(Request $request): View
    {
        $user = $request->user();

        return view('dashboards.admin', [
            'user' => $user,
        ]);
    }
}
