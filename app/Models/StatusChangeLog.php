<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StatusChangeLog extends Model
{
    public const UPDATED_AT = null;

    public const SUBJECT_APPOINTMENT = 'appointment';

    public const SUBJECT_CANCELLATION_REQUEST = 'cancellation_request';

    protected $table = 'status_change_logs';

    protected $fillable = [
        'subject_type',
        'subject_id',
        'actor_user_id',
        'actor_role',
        'from_status',
        'to_status',
        'changes',
        'reason',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
