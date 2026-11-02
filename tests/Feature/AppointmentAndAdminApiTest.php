<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\User;
use Tests\TestCase;

class AppointmentAndAdminApiTest extends TestCase
{
    public function test_patient_can_create_appointment(): void
    {
        $patient = User::where('role', 'pasien')->first();
        $token = $patient->createToken('patient-token')->plainTextToken;

        $doctor = Doctor::where('is_active', true)->first();

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/janji-temu', [
                'polyclinic_id' => $doctor->polyclinic_id,
                'doctor_id' => $doctor->id,
                'appointment_date' => now()->addDays(2)->format('Y-m-d'),
                'complaint' => 'Batuk dan flu sejak 3 hari lalu',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Janji temu berhasil dibuat',
                'data' => [
                    'user_id' => $patient->id,
                    'polyclinic_id' => $doctor->polyclinic_id,
                    'doctor_id' => $doctor->id,
                    'type' => 'janji_baru',
                    'status' => 'terjadwal',
                    'complaint' => 'Batuk dan flu sejak 3 hari lalu',
                ],
            ]);
    }

    public function test_patient_cannot_book_inactive_doctor(): void
    {
        $admin = User::where('role', 'admin')->first();
        $adminToken = $admin->createToken('admin-token')->plainTextToken;

        $patient = User::where('role', 'pasien')->first();
        $patientToken = $patient->createToken('patient-token')->plainTextToken;

        $doctor = Doctor::first();

        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/dokter/{$doctor->id}", [
                'is_active' => false,
            ])
            ->assertStatus(200);

        $this->app['auth']->forgetGuards();

        $response = $this->withHeader('Authorization', 'Bearer '.$patientToken)
            ->postJson('/api/janji-temu', [
                'polyclinic_id' => $doctor->polyclinic_id,
                'doctor_id' => $doctor->id,
                'appointment_date' => now()->addDays(3)->format('Y-m-d'),
                'complaint' => 'Pemeriksaan rutin',
            ]);

        $response->assertStatus(422);

        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/dokter/{$doctor->id}", [
                'is_active' => true,
            ])
            ->assertStatus(200);
    }

    public function test_patient_can_list_own_appointments_including_cancelled_notes(): void
    {
        $patient = User::where('role', 'pasien')->first();
        $token = $patient->createToken('patient-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/janji-temu');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'appointment_date',
                        'type',
                        'status',
                        'complaint',
                        'polyclinic',
                        'doctor',
                    ],
                ],
            ]);
    }

    public function test_patient_cannot_access_admin_endpoints(): void
    {
        $patient = User::where('role', 'pasien')->first();
        $token = $patient->createToken('patient-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/admin/janji-temu');

        $response->assertStatus(403);
    }

    public function test_admin_can_view_and_filter_appointments_by_date(): void
    {
        $admin = User::where('role', 'admin')->first();
        $token = $admin->createToken('admin-token')->plainTextToken;

        $targetDate = now()->addDays(2)->format('Y-m-d');

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/admin/janji-temu?date='.$targetDate);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'user_id',
                        'appointment_date',
                        'type',
                        'status',
                        'user',
                        'polyclinic',
                        'doctor',
                    ],
                ],
            ]);
    }

    public function test_admin_can_update_appointment_status_and_notes(): void
    {
        $admin = User::where('role', 'admin')->first();
        $token = $admin->createToken('admin-token')->plainTextToken;

        $patient = User::where('role', 'pasien')->first();
        $doctor = Doctor::where('is_active', true)->first();

        $appointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->addDay()->format('Y-m-d'),
            'type' => 'janji_baru',
            'status' => 'terjadwal',
            'complaint' => 'Demam tinggi',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson("/api/admin/janji-temu/{$appointment->id}", [
                'status' => 'selesai',
                'doctor_notes' => 'Pasien diberikan paracetamol 500mg, istirahat cukup.',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $appointment->id,
                    'status' => 'selesai',
                    'doctor_notes' => 'Pasien diberikan paracetamol 500mg, istirahat cukup.',
                ],
            ]);

        $this->assertDatabaseHas('klinik.appointments', [
            'id' => $appointment->id,
            'status' => 'selesai',
            'doctor_notes' => 'Pasien diberikan paracetamol 500mg, istirahat cukup.',
        ]);
    }

    public function test_admin_schedule_control_validates_patient_role_and_doctor_polyclinic(): void
    {
        $admin = User::where('role', 'admin')->first();
        $token = $admin->createToken('admin-token')->plainTextToken;
        $doctor = Doctor::where('is_active', true)->first();

        $resNonPatient = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/admin/jadwal-kontrol', [
                'user_id' => $admin->id,
                'polyclinic_id' => $doctor->polyclinic_id,
                'doctor_id' => $doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'doctor_notes' => 'Kontrol evaluasi',
            ]);

        $resNonPatient->assertStatus(422)
            ->assertJsonValidationErrors(['user_id']);
    }

    public function test_admin_can_create_polyclinic_and_doctor(): void
    {
        $admin = User::where('role', 'admin')->first();
        $token = $admin->createToken('admin-token')->plainTextToken;

        $uniqueName = 'Poli Rehabilitasi '.uniqid();

        $resPoli = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/admin/poli', [
                'name' => $uniqueName,
                'description' => 'Layanan fisioterapi dan pemulihan fisik',
            ]);

        $resPoli->assertStatus(201)
            ->assertJson([
                'data' => [
                    'name' => $uniqueName,
                ],
            ]);

        $poliId = $resPoli->json('data.id');

        $resDoc = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/admin/dokter', [
                'polyclinic_id' => $poliId,
                'name' => 'dr. Fajar Pratama, Sp.KFR',
                'is_active' => true,
            ]);

        $resDoc->assertStatus(201)
            ->assertJson([
                'data' => [
                    'polyclinic_id' => $poliId,
                    'name' => 'dr. Fajar Pratama, Sp.KFR',
                    'is_active' => true,
                ],
            ]);

        $this->assertDatabaseHas('klinik.polyclinics', ['id' => $poliId, 'name' => $uniqueName]);
        $this->assertDatabaseHas('klinik.doctors', ['name' => 'dr. Fajar Pratama, Sp.KFR']);
    }
}
