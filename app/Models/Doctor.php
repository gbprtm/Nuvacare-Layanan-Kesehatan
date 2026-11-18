<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Doctor extends Model
{
    use HasFactory;

    protected $table = 'doctors';

    protected $fillable = [
        'user_id',
        'polyclinic_id',
        'name',
        'is_active',
        'available_dates',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'available_dates' => 'array',
        ];
    }

    protected $appends = [
        'schedule_label',
    ];

    public function getScheduleLabelAttribute(): string
    {
        return '09:00 - 17:00 WIB';
    }

    /**
     * Normalize explicit practice dates (Y-m-d), or return null for regular schedule.
     *
     * @return list<string>|null
     */
    public function normalizedAvailableDates(): ?array
    {
        if ($this->available_dates === null) {
            return null;
        }

        $dates = array_values(array_unique(array_filter(array_map(
            static fn ($date): string => trim((string) $date),
            (array) $this->available_dates
        ), static fn (string $date): bool => (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $date))));

        sort($dates);

        return $dates;
    }

    public function isAvailableOnDate(string $date): bool
    {
        $configured = $this->normalizedAvailableDates();
        if ($configured === null || $configured === []) {
            return false;
        }

        $targetDate = Carbon::parse($date)->toDateString();

        return in_array($targetDate, $configured, true);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function polyclinic(): BelongsTo
    {
        return $this->belongsTo(Polyclinic::class, 'polyclinic_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }

    public function cancellationRequests(): HasMany
    {
        return $this->hasMany(CancellationRequest::class, 'doctor_id');
    }

    public function slotRequests(): HasMany
    {
        return $this->hasMany(DoctorSlotRequest::class, 'doctor_id');
    }
}
