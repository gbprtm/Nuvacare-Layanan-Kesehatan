<?php

namespace App\Http\Controllers\Audit;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AuditLogController extends Controller
{
    /**
     * Tampilkan daftar audit log operasional untuk admin.
     */
    public function index(Request $request): View
    {
        $this->authorize('viewAny', AuditLog::class);

        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if ($request->filled('action')) {
            $query->where('aksi', $request->query('action'));
        }

        if ($request->filled('object_type')) {
            $query->where('objek', $request->query('object_type'));
        }

        if ($request->filled('object_id')) {
            $query->where('objek_id', $request->query('object_id'));
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->query('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->query('to'));
        }

        $auditLogs = $query->paginate(20)->withQueryString();

        // Opsi unik untuk form filter
        $availableActions = AuditLog::distinct()->pluck('aksi')->sort()->values();
        $availableObjects = AuditLog::distinct()->pluck('objek')->sort()->values();

        return view('audit.index', compact('auditLogs', 'availableActions', 'availableObjects'));
    }

    /**
     * Tampilkan rincian entri audit log tertentu.
     */
    public function show(AuditLog $auditLog): View
    {
        $this->authorize('view', $auditLog);

        return view('audit.show', compact('auditLog'));
    }
}
