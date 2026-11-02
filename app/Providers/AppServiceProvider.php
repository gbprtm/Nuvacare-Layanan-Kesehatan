<?php

namespace App\Providers;

use App\Models\Appointment;
use App\Models\AuditLog;
use App\Policies\AppointmentPolicy;
use App\Policies\AuditLogPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Appointment::class, AppointmentPolicy::class);
        Gate::policy(AuditLog::class, AuditLogPolicy::class);
    }
}
