<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Doctor extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'dokter';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'nama',
        'spesialisasi',
        'nomor_izin',
        'aktif',
    ];

    protected function casts(): array
    {
        return [
            'aktif' => 'boolean',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function slots(): HasMany
    {
        return $this->hasMany(Slot::class, 'dokter_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'dokter_id');
    }

    public function scopeActive($query)
    {
        return $query->where('aktif', true);
    }

    public function scopeBySpecialty($query, ?string $specialty)
    {
        return $query->when($specialty, fn ($q) => $q->where('spesialisasi', $specialty));
    }
}
