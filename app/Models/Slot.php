<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Slot extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'slot';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'dokter_id',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'kuota',
        'tersedia',
        'dikunci_sampai',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date:Y-m-d',
            'kuota' => 'integer',
            'tersedia' => 'boolean',
            'dikunci_sampai' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'dokter_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'slot_id');
    }

    public function scopeAvailable($query)
    {
        return $query->where('tersedia', true);
    }

    public function scopeForDoctor($query, ?string $doctorId)
    {
        return $query->when($doctorId, fn ($q) => $q->where('dokter_id', $doctorId));
    }

    public function scopeOnDate($query, ?string $date)
    {
        return $query->when($date, fn ($q) => $q->where('tanggal', $date));
    }
}
