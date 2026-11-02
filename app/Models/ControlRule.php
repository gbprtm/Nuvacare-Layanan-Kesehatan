<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ControlRule extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'aturan_kontrol';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'pasien_id',
        'dokter_id',
        'interval_hari',
        'tanggal_mulai',
        'anchor_hari',
        'aktif',
        'catatan',
        'dibuat_oleh',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date:Y-m-d',
            'interval_hari' => 'integer',
            'anchor_hari' => 'integer',
            'aktif' => 'boolean',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pasien_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'dokter_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(ControlSchedule::class, 'aturan_kontrol_id');
    }
}
