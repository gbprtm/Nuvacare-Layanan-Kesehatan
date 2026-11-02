<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    /**
     * Menentukan apakah pengguna dapat melihat daftar janji.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Menentukan apakah pengguna dapat melihat detail janji tertentu (IDOR protection).
     */
    public function view(User $user, Appointment $appointment): bool
    {
        if ($user->isPatient()) {
            return $appointment->pasien_id === $user->id;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return false;
    }

    /**
     * Menentukan apakah pengguna dapat membuat janji baru.
     */
    public function create(User $user): bool
    {
        return $user->isPatient();
    }

    /**
     * Menentukan apakah pengguna dapat membatalkan janji temu.
     */
    public function cancel(User $user, Appointment $appointment): bool
    {
        if ($appointment->status !== 'aktif') {
            return false;
        }

        if ($user->isPatient()) {
            return $appointment->pasien_id === $user->id;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return false;
    }
}
