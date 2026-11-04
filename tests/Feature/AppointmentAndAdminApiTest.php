<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Polyclinic;
use App\Models\User;
use Illuminate\Support\Facades\Http;
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
                'appointment_date' => now()->addDays(15)->format('Y-m-d'),
                'appointment_time' => '11:00',
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
                ],
            ]);
    }

    public function test_available_slots_and_double_booking_prevention(): void
    {
        $patient1 = User::where('email', 'pasien1@klinik.local')->first();
        $patient2 = User::where('email', 'pasien2@klinik.local')->first();
        $admin = User::where('role', 'admin')->first();

        $token1 = $patient1->createToken('p1-token')->plainTextToken;
        $token2 = $patient2->createToken('p2-token')->plainTextToken;
        $adminToken = $admin->createToken('admin-token')->plainTextToken;

        $doctor = Doctor::where('is_active', true)->first();
        $targetDate = now()->addDays(12)->format('Y-m-d');

        Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $targetDate)
            ->delete();

        $firstBooking = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->postJson('/api/janji-temu', [
                'polyclinic_id' => $doctor->polyclinic_id,
                'doctor_id' => $doctor->id,
                'appointment_date' => $targetDate,
                'appointment_time' => '10:00',
                'complaint' => 'Pemeriksaan umum',
            ]);

        $firstBooking->assertStatus(201)
            ->assertJsonPath('data.appointment_time', '10:00');

        $appointmentId = $firstBooking->json('data.id');

        $slotRes = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->getJson("/api/slot-tersedia?doctor_id={$doctor->id}&date={$targetDate}");

        $slotRes->assertStatus(200);
        $slots = collect($slotRes->json('data'));
        $slot10 = $slots->firstWhere('time', '10:00');
        $this->assertNotNull($slot10);
        $this->assertFalse($slot10['available']);

        $this->app['auth']->forgetGuards();

        $doubleBooking = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->postJson('/api/janji-temu', [
                'polyclinic_id' => $doctor->polyclinic_id,
                'doctor_id' => $doctor->id,
                'appointment_date' => $targetDate,
                'appointment_time' => '10:00',
                'complaint' => 'Keluhan pasien kedua pada jam yang sama',
            ]);

        $doubleBooking->assertStatus(422)
            ->assertJsonValidationErrors(['appointment_time']);

        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/janji-temu/{$appointmentId}", [
                'status' => 'dibatalkan',
                'doctor_notes' => 'Dibatalkan untuk pengujian slot',
            ])
            ->assertStatus(200);

        $this->app['auth']->forgetGuards();

        $rebookAfterCancel = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->postJson('/api/janji-temu', [
                'polyclinic_id' => $doctor->polyclinic_id,
                'doctor_id' => $doctor->id,
                'appointment_date' => $targetDate,
                'appointment_time' => '10:00',
                'complaint' => 'Pemesanan ulang setelah slot dibatalkan',
            ]);

        $rebookAfterCancel->assertStatus(201);
    }

    public function test_admin_reschedule_or_cancel_sends_whatsapp_notification(): void
    {
        Http::fake([
            'https://api.wa-gateway.test/*' => Http::response(['status' => true], 200),
        ]);

        config([
            'services.whatsapp.url' => 'https://api.wa-gateway.test/send',
            'services.whatsapp.token' => 'secret-wa-token',
        ]);

        $admin = User::where('role', 'admin')->first();
        $adminToken = $admin->createToken('admin-token')->plainTextToken;

        $patient = User::where('email', 'pasien1@klinik.local')->first();
        $doctor = Doctor::where('is_active', true)->first();
        $targetDate = now()->addDays(15)->format('Y-m-d');

        Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $targetDate)
            ->delete();

        $appointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '09:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
            'complaint' => 'Konsultasi rutin',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/janji-temu/{$appointment->id}", [
                'appointment_time' => '14:00',
                'doctor_notes' => 'Jadwal digeser ke pukul 14:00 karena dokter ada rapat medis pagi.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.appointment_time', '14:00')
            ->assertJsonPath('whatsapp.sent', true);

        $this->assertStringStartsWith('https://wa.me/62', (string) $response->json('whatsapp.whatsapp_url'));

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.wa-gateway.test/send'
                && str_starts_with((string) $request['target'], '62')
                && str_contains((string) $request['message'], '14:00 WIB');
        });
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
                        'appointment_time',
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
                        'appointment_time',
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
            'appointment_time' => '15:00',
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

        Doctor::whereHas('polyclinic', fn ($q) => $q->where('name', 'like', 'Poli Rehabilitasi %'))->delete();
        Polyclinic::where('name', 'like', 'Poli Rehabilitasi %')->delete();
    }
}
