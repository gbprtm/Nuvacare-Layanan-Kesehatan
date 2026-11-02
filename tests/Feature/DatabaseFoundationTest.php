<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Polyclinic;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseFoundationTest extends TestCase
{
    public function test_required_tables_exist(): void
    {
        $this->assertTrue(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasTable('polyclinics'));
        $this->assertTrue(Schema::hasTable('doctors'));
        $this->assertTrue(Schema::hasTable('appointments'));
        $this->assertTrue(Schema::hasTable('personal_access_tokens'));
    }

    public function test_seeded_users_exist(): void
    {
        $admin = User::where('role', 'admin')->first();
        $this->assertNotNull($admin);
        $this->assertEquals('admin', $admin->role);

        $patient = User::where('role', 'pasien')->first();
        $this->assertNotNull($patient);
        $this->assertEquals('pasien', $patient->role);
    }

    public function test_seeded_polyclinics_and_doctors_exist(): void
    {
        $this->assertGreaterThanOrEqual(3, Polyclinic::count());
        $this->assertGreaterThanOrEqual(4, Doctor::count());

        $doctor = Doctor::with('polyclinic')->first();
        $this->assertNotNull($doctor);
        $this->assertNotNull($doctor->polyclinic);
    }

    public function test_relationships_work(): void
    {
        $appointment = Appointment::with(['patient', 'doctor.polyclinic'])->first();
        $this->assertNotNull($appointment);
        $this->assertEquals('pasien', $appointment->patient->role);
        $this->assertNotNull($appointment->doctor);
        $this->assertNotNull($appointment->doctor->polyclinic);
    }
}
