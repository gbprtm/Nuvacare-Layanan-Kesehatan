<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    use HasFactory;

    protected $table = 'appointments';

    protected $fillable = [
        'user_id',
        'polyclinic_id',
        'doctor_id',
        'appointment_date',
        'type',
        'status',
        'complaint',
        'doctor_notes',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date:Y-m-d',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function patient(): BelongsTo
    {
        return $this->user();
    }

    public function polyclinic(): BelongsTo
    {
        return $this->belongsTo(Polyclinic::class, 'polyclinic_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }
}
