<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prescription extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'resep';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'pasien_id',
        'janji_id',
        'dokter_id',
        'nomor_resep',
        'diagnosis',
        'catatan',
        'dibuat_oleh',
        'tanggal_resep',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_resep' => 'date:Y-m-d',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pasien_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'janji_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'dokter_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function medications(): HasMany
    {
        return $this->hasMany(Medication::class, 'resep_id');
    }
}
