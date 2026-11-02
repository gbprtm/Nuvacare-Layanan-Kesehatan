<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RescheduleProposal extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'usulan_perubahan';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'janji_id',
        'slot_baru_id',
        'alasan',
        'status',
        'batas_waktu_jawab',
        'ttl_kunci_slot',
        'dibuat_oleh',
    ];

    protected function casts(): array
    {
        return [
            'batas_waktu_jawab' => 'immutable_datetime',
            'ttl_kunci_slot' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'janji_id');
    }

    public function targetSlot(): BelongsTo
    {
        return $this->belongsTo(Slot::class, 'slot_baru_id');
    }

    public function proposer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }
}
