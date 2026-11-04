<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\User;
use Tests\TestCase;

class HistoryAndControlApiTest extends TestCase
{
    public function test_patient_can_view_completed_examination_history(): void
    {
        $patient = User::where('role', 'pasien')->first();
        $doctor = Doctor::first();
        $token = $patient->createToken('patient-token')->plainTextToken;

        // 1. Buat data appointment selesai
        $completedApp = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->subDays(5)->format('Y-m-d'),
            'appointment_time' => '08:00',
            'type' => 'janji_baru',
            'status' => 'selesai',
            'complaint' => 'Sakit kepala sebelah',
            'doctor_notes' => 'Migrain ringan, hindari begadang dan konsumsi obat teratur.',
        ]);

        // 2. Buat data appointment terjadwal (tidak boleh muncul di riwayat)
        $scheduledApp = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->addDays(20)->format('Y-m-d'),
            'appointment_time' => '10:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
            'complaint' => 'Checkup rutin',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/riwayat-pemeriksaan');

        $response->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($completedApp->id, $ids);
        $this->assertNotContains($scheduledApp->id, $ids);

        $completedApp->delete();
        $scheduledApp->delete();
    }

    public function test_patient_can_view_routine_control_schedules(): void
    {
        $patient = User::where('role', 'pasien')->first();
        $doctor = Doctor::first();
        $token = $patient->createToken('patient-token')->plainTextToken;

        // 1. Buat jadwal kontrol rutin (terjadwal)
        $controlApp = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->addDays(21)->format('Y-m-d'),
            'appointment_time' => '11:00',
            'type' => 'kontrol_rutin',
            'status' => 'terjadwal',
            'doctor_notes' => 'Kontrol cek tekanan darah ulang.',
        ]);

        // 2. Buat janji temu biasa (tidak boleh muncul di jadwal kontrol)
        $newApp = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->addDays(22)->format('Y-m-d'),
            'appointment_time' => '13:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
            'complaint' => 'Keluhan flu',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/jadwal-kontrol');

        $response->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($controlApp->id, $ids);
        $this->assertNotContains($newApp->id, $ids);

        $controlApp->delete();
        $newApp->delete();
    }

    public function test_patient_cannot_view_other_patients_history(): void
    {
        $patient1 = User::where('role', 'pasien')->first();
        $patient2 = User::where('role', 'pasien')->where('id', '!=', $patient1->id)->first();
        $doctor = Doctor::first();

        // Buat data milik pasien 2
        $otherApp = Appointment::create([
            'user_id' => $patient2->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->subDay()->format('Y-m-d'),
            'appointment_time' => '14:00',
            'type' => 'janji_baru',
            'status' => 'selesai',
            'complaint' => 'Sakit perut',
            'doctor_notes' => 'Gastritis',
        ]);

        $token1 = $patient1->createToken('patient-token-1')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->getJson('/api/riwayat-pemeriksaan');

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertNotContains($otherApp->id, $ids);

        $otherApp->delete();
    }

    public function test_endpoints_require_patient_role(): void
    {
        // 1. Unauthenticated
        $this->getJson('/api/riwayat-pemeriksaan')->assertStatus(401);
        $this->getJson('/api/jadwal-kontrol')->assertStatus(401);

        // 2. Admin cannot access patient history/control endpoints
        $admin = User::where('role', 'admin')->first();
        $adminToken = $admin->createToken('admin-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/riwayat-pemeriksaan')
            ->assertStatus(403);

        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/jadwal-kontrol')
            ->assertStatus(403);
    }
}
