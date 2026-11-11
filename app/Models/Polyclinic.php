<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Polyclinic extends Model
{
    use HasFactory;

    protected $table = 'polyclinics';

    protected $fillable = [
        'name',
        'description',
    ];

    protected $appends = [
        'short_name',
        'room_label',
        'schedule_label',
    ];

    public function getShortNameAttribute(): string
    {
        return preg_replace('/^Poli\s+/i', '', $this->name ?? '');
    }

    public function getRoomLabelAttribute(): string
    {
        $floor = (($this->id % 3) ?: 3);
        $roomNum = 100 + $this->id;

        return "Lt. {$floor} • Ruang {$roomNum}";
    }

    public function getScheduleLabelAttribute(): string
    {
        return '09:00 - 17:00 WIB';
    }

    public function doctors(): HasMany
    {
        return $this->hasMany(Doctor::class, 'polyclinic_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'polyclinic_id');
    }
}
