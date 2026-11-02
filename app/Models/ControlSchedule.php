<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ControlSchedule extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'jadwal_kontrol';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'pasien_id',
        'aturan_kontrol_id',
        'dokter_id',
        'tanggal_rencana',
        'status',
        'janji_id',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_rencana' => 'date:Y-m-d',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pasien_id');
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(ControlRule::class, 'aturan_kontrol_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'dokter_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'janji_id');
    }
}
