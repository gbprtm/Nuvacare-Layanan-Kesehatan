<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuids, Notifiable;

    protected $table = 'users';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Atribut yang dapat diisi massal.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'name',
        'email',
        'password_hash',
        'role',
    ];

    /**
     * Atribut yang disembunyikan dari serialisasi JSON/array.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    /**
     * Dapatkan nama kolom kata sandi untuk autentikasi.
     */
    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    /**
     * Ambil kata sandi untuk autentikasi Laravel.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    /**
     * Konversi tipe atribut.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    /**
     * Periksa apakah pengguna memiliki peran pasien.
     */
    public function isPasien(): bool
    {
        return $this->role === 'pasien';
    }

    /**
     * Alias bahasa Inggris untuk peran pasien.
     */
    public function isPatient(): bool
    {
        return $this->isPasien();
    }

    /**
     * Periksa apakah pengguna memiliki peran admin klinik.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Relasi ke profil data pasien.
     */
    public function profile(): HasOne
    {
        return $this->hasOne(PatientProfile::class, 'user_id');
    }

    /**
     * Relasi ke janji temu pasien.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'pasien_id');
    }

    /**
     * Relasi ke tiket antrean pasien.
     */
    public function queueTickets(): HasMany
    {
        return $this->hasMany(QueueTicket::class, 'pasien_id');
    }

    /**
     * Relasi ke catatan kebiasaan harian pasien.
     */
    public function habitLogs(): HasMany
    {
        return $this->hasMany(HabitLog::class, 'pasien_id');
    }

    /**
     * Relasi ke notifikasi in-app.
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'user_id');
    }

    /**
     * Relasi ke laporan obat mandiri pasien.
     */
    public function patientMedications(): HasMany
    {
        return $this->hasMany(PatientReportedMedication::class, 'pasien_id');
    }

    /**
     * Relasi ke resep klinis yang diterbitkan untuk pasien.
     */
    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class, 'pasien_id');
    }
}
