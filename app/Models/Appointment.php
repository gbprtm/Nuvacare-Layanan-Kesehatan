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

    public function getNomorEstimasiAttribute(): int
    {
        if (! $this->slot_id || ! $this->slot) {
            return 1;
        }

        return (int) Appointment::query()
            ->where('dokter_id', $this->dokter_id)
            ->whereHas('slot', function ($q) {
                $q->where('tanggal', $this->slot->tanggal);
            })
            ->where('created_at', '<=', $this->created_at ?? now())
            ->count();
    }

    public function getPerkiraanJamAttribute(): string
    {
        if (! $this->slot) {
            return '-';
        }

        return "{$this->slot->jam_mulai} - {$this->slot->jam_selesai} WIB";
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'aktif' => 'Aktif',
            'perubahan_diusulkan' => 'Perubahan Diusulkan',
            'selesai' => 'Selesai',
            'dibatalkan' => 'Dibatalkan',
            'tidak_hadir' => 'Tidak Hadir',
            default => ucfirst(str_replace('_', ' ', $this->status ?? 'Aktif')),
        };
    }

    public function getCanCancelAttribute(): bool
    {
        return $this->status === 'aktif';
    }
}
