<?php

namespace App\Providers;

use App\Models\Appointment;
use App\Models\CancellationRequest;
use App\Models\PersonalAccessToken;
use App\Models\User;
use App\Policies\AppointmentPolicy;
use App\Policies\CancellationRequestPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        Gate::policy(Appointment::class, AppointmentPolicy::class);
        Gate::policy(CancellationRequest::class, CancellationRequestPolicy::class);

        $adminAbilities = [
            'janji.lihat_semua',
            'janji.ubah',
            'janji.buat_kontrol',
            'poli.kelola',
            'dokter.kelola',
            'pengajuan.putuskan',
            'audit.lihat',
        ];

        foreach ($adminAbilities as $ability) {
            Gate::define($ability, fn (User $user): bool => $user->role === 'admin' && ! $user->isDisabled());
        }

        $doctorAbilities = [
            'janji.lihat_milik',
            'pengajuan.ajukan',
            'pengajuan.lihat_milik',
            'pengajuan.tarik_milik',
        ];

        foreach ($doctorAbilities as $ability) {
            Gate::define(
                $ability,
                fn (User $user): bool => $user->role === 'dokter'
                    && ! $user->isDisabled()
                    && $user->doctor !== null
                    && $user->doctor->is_active,
            );
        }
    }
}
