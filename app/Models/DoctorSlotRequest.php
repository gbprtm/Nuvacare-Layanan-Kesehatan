<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DoctorSlotRequest extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'diajukan';

    public const STATUS_APPROVED = 'disetujui';

    public const STATUS_REJECTED = 'ditolak';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_APPROVED,
        self::STATUS_REJECTED,
    ];

    protected $table = 'doctor_slot_requests';

    protected $fillable = [
        'doctor_id',
        'schedule_date',
        'start_time',
        'end_time',
        'quota',
        'reason',
        'status',
        'admin_note',
    ];

    protected function casts(): array
    {
        return [
            'schedule_date' => 'date:Y-m-d',
            'quota' => 'integer',
        ];
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }
}
