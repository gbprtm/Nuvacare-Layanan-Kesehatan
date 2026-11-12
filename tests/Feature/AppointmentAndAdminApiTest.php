<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CancellationRequest;
use App\Models\Doctor;
use App\Models\Polyclinic;
use App\Models\StatusChangeLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AppointmentAndAdminApiTest extends TestCase
{
    private array $createdAppointmentIds = [];

    protected function tearDown(): void
    {
        if (! empty($this->createdAppointmentIds)) {
            $this->deleteAppointmentsSafely($this->createdAppointmentIds);
        }

        parent::tearDown();
    }

    private function deleteAppointmentsSafely(array $appointmentIds): void
    {
        $ids = array_values(array_unique(array_filter($appointmentIds)));
        if (empty($ids)) {
            return;
        }

        DB::transaction(function () use ($ids): void {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('SET LOCAL search_path TO klinik, public');
            }

            $requestIds = CancellationRequest::whereIn('appointment_id', $ids)->pluck('id')->all();
            if (! empty($requestIds)) {
                StatusChangeLog::where('subject_type', StatusChangeLog::SUBJECT_CANCELLATION_REQUEST)
                    ->whereIn('subject_id', $requestIds)
                    ->delete();

                CancellationRequest::whereIn('id', $requestIds)->delete();
            }

            StatusChangeLog::where('subject_type', StatusChangeLog::SUBJECT_APPOINTMENT)
                ->whereIn('subject_id', $ids)
                ->delete();

            Appointment::whereIn('id', $ids)->delete();
        });
    }

    private function cleanupDoctorDateAppointments(int $doctorId, string $date): void
    {
        $ids = Appointment::where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $date)
            ->pluck('id')
            ->all();

        $this->deleteAppointmentsSafely($ids);
    }

    public function test_patient_can_create_appointment(): void
    {
        $patient = User::where('role', 'pasien')->first();
        $token = $patient->createToken('patient-token')->plainTextToken;

        $doctor = Doctor::where('is_active', true)->first();
        $targetDate = now()->addDays(15)->format('Y-m-d');
        $this->cleanupDoctorDateAppointments($doctor->id, $targetDate);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/janji-temu', [
                'polyclinic_id' => $doctor->polyclinic_id,
                'doctor_id' => $doctor->id,
                'appointment_date' => $targetDate,
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

        $this->createdAppointmentIds[] = $response->json('data.id');
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

        $this->cleanupDoctorDateAppointments($doctor->id, $targetDate);

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
        $this->createdAppointmentIds[] = $appointmentId;

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

        // Pembatalan sepihak oleh admin tanpa pengajuan dokter ditolak (403)
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/janji-temu/{$appointmentId}", [
                'status' => 'dibatalkan',
                'doctor_notes' => 'Dibatalkan untuk pengujian slot',
            ])
            ->assertStatus(403);

        $this->app['auth']->forgetGuards();

        // Pasien membatalkan mandiri untuk mengosongkan slot
        $this->withHeader('Authorization', 'Bearer '.$token1)
            ->postJson("/api/janji-temu/{$appointmentId}/batal", [
                'reason' => 'Pasien berhalangan hadir pada jam tersebut.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'dibatalkan');

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
        $this->createdAppointmentIds[] = $rebookAfterCancel->json('data.id');
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

        $this->cleanupDoctorDateAppointments($doctor->id, $targetDate);

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
        $this->createdAppointmentIds[] = $appointment->id;

        $response = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/janji-temu/{$appointment->id}", [
                'appointment_time' => '14:00',
                'doctor_notes' => 'Jadwal digeser ke pukul 14:00 karena dokter ada rapat medis pagi.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.appointment_time', '14:00')
            ->assertJsonPath('whatsapp.sent', true);

        $userPayload = $response->json('data.user');
        $this->assertIsArray($userPayload);
        $this->assertArrayHasKey('medical_record_id', $userPayload);
        $this->assertArrayHasKey('initial_name', $userPayload);
        $this->assertArrayNotHasKey('phone_number', $userPayload);
        $this->assertArrayNotHasKey('email', $userPayload);

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

        $patient = User::where('email', 'pasien1@klinik.local')->first();
        $doctor = Doctor::where('is_active', true)->first();
        $targetDate = now()->addDays(17)->format('Y-m-d');
        $this->cleanupDoctorDateAppointments($doctor->id, $targetDate);

        $appointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '09:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
            'complaint' => 'Kontrol filter tanggal',
        ]);
        $this->createdAppointmentIds[] = $appointment->id;

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
                        'user' => ['id', 'medical_record_id', 'name', 'initial_name'],
                        'polyclinic',
                        'doctor',
                    ],
                ],
                'meta' => [
                    'total_count',
                    'completed_count',
                    'scheduled_count',
                    'cancelled_count',
                ],
            ]);

        $item = collect($response->json('data'))->firstWhere('id', $appointment->id);
        $this->assertNotNull($item);
        $this->assertArrayNotHasKey('phone_number', $item['user']);
        $this->assertArrayNotHasKey('email', $item['user']);
    }

    public function test_admin_can_update_appointment_status_and_notes(): void
    {
        $admin = User::where('role', 'admin')->first();
        $token = $admin->createToken('admin-token', ['surface:staf'])->plainTextToken;

        $patient = User::where('role', 'pasien')->first();
        $doctor = Doctor::where('is_active', true)
            ->whereNotNull('user_id')
            ->whereHas('user', fn ($q) => $q->whereNull('disabled_at'))
            ->firstOrFail();
        $dokterUser = $doctor->user()->firstOrFail();
        $dokterToken = $dokterUser->createToken('dokter-token', ['surface:staf'])->plainTextToken;

        $targetDate = now()->addDays(19)->format('Y-m-d');
        $this->cleanupDoctorDateAppointments($doctor->id, $targetDate);

        $appointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '15:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
            'complaint' => 'Demam tinggi',
        ]);
        $this->createdAppointmentIds[] = $appointment->id;

        // Admin tetap dapat menyesuaikan jadwal (tanggal/jam/dokter) sambil menjaga privasi kontak pasien
        $rescheduleResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson("/api/admin/janji-temu/{$appointment->id}", [
                'appointment_time' => '16:00',
                'doctor_notes' => 'Jadwal digeser ke pukul 16:00 oleh admin.',
            ]);

        $rescheduleResponse->assertStatus(200)
            ->assertJsonPath('data.id', $appointment->id)
            ->assertJsonPath('data.appointment_time', '16:00')
            ->assertJsonPath('data.status', 'terjadwal');

        $adminUserPayload = $rescheduleResponse->json('data.user');
        $this->assertIsArray($adminUserPayload);
        $this->assertArrayHasKey('medical_record_id', $adminUserPayload);
        $this->assertArrayNotHasKey('phone_number', $adminUserPayload);
        $this->assertArrayNotHasKey('email', $adminUserPayload);

        // Admin ditolak 403 bila mencoba menetapkan status 'selesai' secara sepihak
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson("/api/admin/janji-temu/{$appointment->id}", [
                'status' => 'selesai',
                'doctor_notes' => 'Pasien diberikan paracetamol 500mg, istirahat cukup.',
            ])
            ->assertStatus(403);

        $this->assertSame('terjadwal', $appointment->fresh()->status);

        $this->app['auth']->forgetGuards();

        // Dokter pemeriksa menyelesaikan janji temu dan menyimpan catatan medis
        $completeResponse = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$appointment->id}/selesai", [
                'doctor_notes' => 'Pasien diberikan paracetamol 500mg, istirahat cukup.',
            ]);

        $completeResponse->assertStatus(200)
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
