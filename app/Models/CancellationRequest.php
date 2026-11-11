<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CancellationRequest extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'diajukan';

    public const STATUS_APPROVED = 'disetujui';

    public const STATUS_RESCHEDULED = 'dijadwalkan_ulang';

    public const STATUS_REJECTED = 'ditolak';

    public const STATUS_WITHDRAWN = 'ditarik';

    public const STATUS_VOIDED = 'gugur';

    public const STATUS_EXPIRED = 'kedaluwarsa';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_APPROVED,
        self::STATUS_RESCHEDULED,
        self::STATUS_REJECTED,
        self::STATUS_WITHDRAWN,
        self::STATUS_VOIDED,
        self::STATUS_EXPIRED,
    ];

    public const REASON_CATEGORIES = [
        'cuti_mendadak',
        'sakit',
        'tugas_darurat',
        'bentrok_jadwal',
        'lainnya',
    ];

    protected $table = 'cancellation_requests';

    protected $fillable = [
        'appointment_id',
        'doctor_id',
        'requested_by',
        'reason_category',
        'reason',
        'status',
        'batch_id',
        'admin_note',
        'handled_by',
        'handled_at',
        'due_at',
    ];

    protected function casts(): array
    {
        return [
            'handled_at' => 'datetime',
            'due_at' => 'datetime',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
