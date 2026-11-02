<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\Slot;
use App\Support\WibClock;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Slot>
 */
class SlotFactory extends Factory
{
    protected $model = Slot::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'dokter_id' => Doctor::factory(),
            'tanggal' => WibClock::todayString(),
            'jam_mulai' => '09:00',
            'jam_selesai' => '09:30',
            'kuota' => 1,
            'tersedia' => true,
            'dikunci_sampai' => null,
        ];
    }
}
