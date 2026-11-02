<?php

namespace App\Models;

use App\Support\WibClock;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class AuditLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'audit_log';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'id',
        'user_id',
        'aksi',
        'objek',
        'objek_id',
        'nilai_sebelum',
        'nilai_sesudah',
        'alasan',
        'ip_address',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'nilai_sebelum' => 'array',
            'nilai_sesudah' => 'array',
            'created_at' => 'immutable_datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $model): void {
            if (empty($model->created_at)) {
                $model->created_at = WibClock::now();
            }
        });

        static::updating(function (): void {
            throw new LogicException('AuditLog bersifat append-only dan tidak dapat diubah.');
        });

        static::deleting(function (): void {
            throw new LogicException('AuditLog bersifat append-only dan tidak dapat dihapus.');
        });
    }

    public function update(array $attributes = [], array $options = []): bool
    {
        throw new LogicException('AuditLog bersifat append-only dan tidak dapat diubah.');
    }

    public function delete(): ?bool
    {
        throw new LogicException('AuditLog bersifat append-only dan tidak dapat dihapus.');
    }

    public function forceDelete(): ?bool
    {
        throw new LogicException('AuditLog bersifat append-only dan tidak dapat dihapus.');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
