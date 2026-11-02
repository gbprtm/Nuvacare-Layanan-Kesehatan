<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FornasCatalog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'katalog_obat_fornas';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'nama_indonesia',
        'nama_internasional',
        'kode_resmi',
        'sumber',
        'sumber_url',
        'versi_snapshot',
        'tanggal_snapshot',
        'cakupan_snapshot',
        'aktif',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_snapshot' => 'date:Y-m-d',
            'aktif' => 'boolean',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function reportedMedications(): HasMany
    {
        return $this->hasMany(PatientReportedMedication::class, 'katalog_obat_fornas_id');
    }
}
