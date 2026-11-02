<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HabitLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'catatan_kebiasaan';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'pasien_id',
        'tanggal',
        'hidrasi_ml',
        'jam_tidur',
        'aktivitas_menit',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date:Y-m-d',
            'hidrasi_ml' => 'integer',
            'jam_tidur' => 'integer',
            'aktivitas_menit' => 'integer',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pasien_id');
    }
}
