<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Medication extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'obat';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'resep_id',
        'nama_obat',
        'dosis',
        'aturan_pakai',
        'frekuensi_per_hari',
        'tanggal_mulai',
        'tanggal_selesai',
        'rujukan_fornas',
        'keterangan',
        'aktif',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date:Y-m-d',
            'tanggal_selesai' => 'date:Y-m-d',
            'frekuensi_per_hari' => 'integer',
            'aktif' => 'boolean',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class, 'resep_id');
    }

    public function intakeLogs(): HasMany
    {
        return $this->hasMany(MedicationIntakeLog::class, 'obat_id');
    }
}
