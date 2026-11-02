<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'janji';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'pasien_id',
        'dokter_id',
        'slot_id',
        'status',
        'keluhan',
        'catatan',
        'alasan_batal',
        'dibatalkan_oleh',
    ];

    protected function casts(): array
    {
        return [
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

    public function slot(): BelongsTo
    {
        return $this->belongsTo(Slot::class, 'slot_id');
    }

    public function queueTicket(): HasOne
    {
        return $this->hasOne(QueueTicket::class, 'janji_id');
    }

    public function rescheduleProposals(): HasMany
    {
        return $this->hasMany(RescheduleProposal::class, 'janji_id');
    }

    public function prescription(): HasOne
    {
        return $this->hasOne(Prescription::class, 'janji_id');
    }
}
