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

    public function doctors(): HasMany
    {
        return $this->hasMany(Doctor::class, 'polyclinic_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'polyclinic_id');
    }
}
