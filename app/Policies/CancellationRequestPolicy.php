<?php

namespace App\Policies;

use App\Models\CancellationRequest;
use App\Models\User;

class CancellationRequestPolicy
{
    public function viewAsDoctor(User $user, CancellationRequest $cancellationRequest): bool
    {
        return $user->role === 'dokter'
            && ! $user->isDisabled()
            && $user->doctor !== null
            && $user->doctor->is_active
            && (int) $cancellationRequest->doctor_id === (int) $user->doctor->id;
    }

    public function withdraw(User $user, CancellationRequest $cancellationRequest): bool
    {
        return $this->viewAsDoctor($user, $cancellationRequest);
    }

    public function decide(User $user): bool
    {
        return $user->role === 'admin' && ! $user->isDisabled();
    }
}
