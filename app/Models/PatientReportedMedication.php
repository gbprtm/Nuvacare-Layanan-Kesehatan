<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientReportedMedication extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'obat_pasien';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'pasien_id',
        'katalog_obat_fornas_id',
        'nama_obat',
        'nama_internasional',
        'dosis_catatan',
        'frekuensi_catatan',
        'mulai_pada',
        'selesai_pada',
        'catatan',
        'sumber',
    ];

    protected function casts(): array
    {
        return [
            'mulai_pada' => 'date:Y-m-d',
            'selesai_pada' => 'date:Y-m-d',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pasien_id');
    }

    public function fornasCatalog(): BelongsTo
    {
        return $this->belongsTo(FornasCatalog::class, 'katalog_obat_fornas_id');
    }
}
