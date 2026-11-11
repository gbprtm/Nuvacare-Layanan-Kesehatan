<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function viewAnyAsDoctor(User $user): bool
    {
        return $user->role === 'dokter'
            && ! $user->isDisabled()
            && $user->doctor !== null
            && $user->doctor->is_active;
    }

    public function viewAsDoctor(User $user, Appointment $appointment): bool
    {
        return $this->viewAnyAsDoctor($user)
            && (int) $appointment->doctor_id === (int) $user->doctor->id;
    }

    public function requestCancellation(User $user, Appointment $appointment): bool
    {
        return $this->viewAsDoctor($user, $appointment);
    }
}
