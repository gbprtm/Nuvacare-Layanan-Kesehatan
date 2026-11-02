<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientProfile extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'profil';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'nik',
        'nomor_telepon',
        'tanggal_lahir',
        'jenis_kelamin',
        'golongan_darah',
        'tinggi_badan',
        'berat_badan',
        'kondisi_kesehatan',
        'riwayat_alergi',
        'kontak_darurat_nama',
        'kontak_darurat_telepon',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_lahir' => 'date:Y-m-d',
            'tinggi_badan' => 'integer',
            'berat_badan' => 'integer',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
