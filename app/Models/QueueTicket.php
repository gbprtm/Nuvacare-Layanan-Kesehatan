<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QueueTicket extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'tiket_antrian';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'janji_id',
        'pasien_id',
        'tanggal',
        'nomor_antrian_final',
        'status',
        'waktu_check_in',
        'waktu_panggil',
        'waktu_selesai',
        'alasan_koreksi',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date:Y-m-d',
            'nomor_antrian_final' => 'integer',
            'waktu_check_in' => 'immutable_datetime',
            'waktu_panggil' => 'immutable_datetime',
            'waktu_selesai' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'janji_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pasien_id');
    }
}
