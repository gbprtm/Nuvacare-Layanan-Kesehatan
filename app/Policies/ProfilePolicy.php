<?php

namespace App\Policies;

use App\Models\PatientProfile;
use App\Models\User;

class ProfilePolicy
{
    /**
     * Tentukan apakah pengguna dapat melihat profil kesehatan.
     * Catatan Guardrail: Admin klinik DILARANG membaca profil penuh pasien.
     */
    public function view(User $user, PatientProfile $profile): bool
    {
        return $user->role === 'pasien' && $user->id === $profile->user_id;
    }

    /**
     * Tentukan apakah pengguna dapat memperbarui profil kesehatan.
     */
    public function update(User $user, PatientProfile $profile): bool
    {
        return $user->role === 'pasien' && $user->id === $profile->user_id;
    }

    /**
     * Tentukan apakah pengguna dapat menghapus profil kesehatan.
     */
    public function delete(User $user, PatientProfile $profile): bool
    {
        return $user->role === 'pasien' && $user->id === $profile->user_id;
    }
}
