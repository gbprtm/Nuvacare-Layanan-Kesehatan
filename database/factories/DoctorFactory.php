<?php

namespace Database\Factories;

use App\Models\Doctor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Doctor>
 */
class DoctorFactory extends Factory
{
    protected $model = Doctor::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'nama' => 'dr. '.fake()->name(),
            'spesialisasi' => fake()->randomElement(['Dokter Umum', 'Spesialis Penyakit Dalam', 'Spesialis Anak', 'Spesialis Jantung']),
            'nomor_izin' => 'SIP.'.fake()->numerify('###/####/2026'),
            'aktif' => true,
        ];
    }
}
