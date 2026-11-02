<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\User;

class AuditLogPolicy
{
    /**
     * Tentukan apakah pengguna dapat melihat daftar audit log operasional.
     */
    public function viewAny(User $user): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Tentukan apakah pengguna dapat melihat rincian suatu entri audit log.
     */
    public function view(User $user, AuditLog $auditLog): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'pasien') {
            // Pasien hanya boleh melihat perubahan yang terkait langsung dengan janjinya sendiri
            if ($auditLog->objek === 'janji') {
                $appointment = Appointment::find($auditLog->objek_id);

                return $appointment !== null && $appointment->pasien_id === $user->id;
            }
        }

        return false;
    }

    /**
     * Audit log append-only dan tidak boleh dibuat melalui route/endpoint HTTP publik/admin.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Audit log append-only dan tidak boleh diubah.
     */
    public function update(User $user, AuditLog $auditLog): bool
    {
        return false;
    }

    /**
     * Audit log append-only dan tidak boleh dihapus.
     */
    public function delete(User $user, AuditLog $auditLog): bool
    {
        return false;
    }
}
