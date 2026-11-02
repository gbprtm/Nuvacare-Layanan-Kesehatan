<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'pasien_id' => User::factory(),
            'dokter_id' => Doctor::factory(),
            'slot_id' => Slot::factory(),
            'status' => 'aktif',
            'keluhan' => 'Pemeriksaan rutin kesehatan',
            'catatan' => null,
            'alasan_batal' => null,
            'dibatalkan_oleh' => null,
        ];
    }
}
