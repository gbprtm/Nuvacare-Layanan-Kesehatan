<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaticContent extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'konten_statis';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'slug',
        'judul',
        'ringkasan',
        'isi',
        'kategori',
        'kondisi_terkait',
        'url_sumber',
        'tanggal_pengambilan',
        'aktif',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pengambilan' => 'date:Y-m-d',
            'aktif' => 'boolean',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }
}
