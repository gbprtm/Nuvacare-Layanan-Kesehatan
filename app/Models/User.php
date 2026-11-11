<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'email',
        'google_id',
        'password',
        'role',
        'disabled_at',
        'phone_number',
        'phone_verified_at',
        'birth_date',
        'gender',
        'address',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'disabled_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'birth_date' => 'date:Y-m-d',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function hasVerifiedPhone(): bool
    {
        return ! empty($this->phone_number) && $this->phone_verified_at !== null;
    }

    public function isDisabled(): bool
    {
        return $this->disabled_at !== null;
    }

    public function isStaff(): bool
    {
        return in_array($this->role, ['admin', 'dokter'], true);
    }

    public function doctor(): HasOne
    {
        return $this->hasOne(Doctor::class, 'user_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'user_id');
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
