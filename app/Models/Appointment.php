<?php

namespace App\Models;

use DateTimeInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

class Appointment extends Model
{
    use HasFactory;

    public const TIME_SLOTS = [
        '08:00',
        '09:00',
        '10:00',
        '11:00',
        '13:00',
        '14:00',
        '15:00',
        '16:00',
    ];

    protected $table = 'appointments';

    protected $fillable = [
        'user_id',
        'polyclinic_id',
        'doctor_id',
        'appointment_date',
        'appointment_time',
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

    public function cancellationRequests(): HasMany
    {
        return $this->hasMany(CancellationRequest::class, 'appointment_id');
    }

    public function openCancellationRequest(): HasOne
    {
        return $this->hasOne(CancellationRequest::class, 'appointment_id')
            ->where('status', CancellationRequest::STATUS_PENDING);
    }

    public function appointmentDateTime(): Carbon
    {
        $timezone = config('app.timezone', 'Asia/Jakarta') ?: 'Asia/Jakarta';
        $date = $this->appointment_date instanceof DateTimeInterface
            ? $this->appointment_date->format('Y-m-d')
            : Carbon::parse((string) $this->appointment_date, $timezone)->format('Y-m-d');
        $time = $this->appointment_time ?: '09:00';

        return Carbon::parse("{$date} {$time}", $timezone);
    }
}
