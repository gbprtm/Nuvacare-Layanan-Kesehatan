<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CancellationRequest;
use App\Models\Doctor;
use App\Models\StatusChangeLog;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AdminPrivacyAndReassignmentTest extends TestCase
{
    private array $createdAppointmentIds = [];

    private array $createdRequestIds = [];

    private array $createdDoctorIds = [];

    private array $createdUserIds = [];

    protected function tearDown(): void
    {
        $allRequestIds = array_unique(array_merge(
            $this->createdRequestIds,
            ! empty($this->createdAppointmentIds)
                ? CancellationRequest::whereIn('appointment_id', $this->createdAppointmentIds)->pluck('id')->all()
                : [],
        ));

        if (! empty($allRequestIds)) {
            StatusChangeLog::where('subject_type', StatusChangeLog::SUBJECT_CANCELLATION_REQUEST)
                ->whereIn('subject_id', $allRequestIds)
                ->delete();

            CancellationRequest::whereIn('id', $allRequestIds)->delete();
        }

        if (! empty($this->createdAppointmentIds)) {
            StatusChangeLog::where('subject_type', StatusChangeLog::SUBJECT_APPOINTMENT)
                ->whereIn('subject_id', $this->createdAppointmentIds)
                ->delete();

            Appointment::whereIn('id', $this->createdAppointmentIds)->delete();
        }

        foreach (array_reverse($this->createdDoctorIds) as $doctorId) {
            Doctor::whereKey($doctorId)->delete();
        }

        foreach (array_reverse($this->createdUserIds) as $userId) {
            $user = User::find($userId);
            if ($user) {
                $user->tokens()->delete();
                $user->delete();
            }
        }

        parent::tearDown();
    }

    public function test_admin_appointments_index_masks_patient_contact_and_includes_rm_and_summary(): void
    {
        $admin = User::where('role', 'admin')->firstOrFail();
        $adminToken = $admin->createToken('admin-privacy-test', ['surface:staf'])->plainTextToken;

        $patient = User::create([
            'name' => 'Budi Santoso',
            'email' => 'privasi.budi.'.uniqid().'@klinik.local',
            'password' => Hash::make('PasienTest2026!'),
            'role' => 'pasien',
            'phone_number' => '081299887766',
        ]);
        $this->createdUserIds[] = $patient->id;

        $doctor = Doctor::where('is_active', true)->firstOrFail();
        $targetDate = now()->addDays(21)->format('Y-m-d');

        $scheduled = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '09:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
            'complaint' => 'Pemeriksaan kontrol privasi',
        ]);
        $this->createdAppointmentIds[] = $scheduled->id;

        $completed = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '10:00',
            'type' => 'janji_baru',
            'status' => 'selesai',
            'doctor_notes' => 'Selesai diperiksa oleh dokter.',
        ]);
        $this->createdAppointmentIds[] = $completed->id;

        $response = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/admin/janji-temu?date='.$targetDate);

        $response->assertStatus(200)
            ->assertJsonPath('meta.completed_count', 1);

        $rawContent = $response->getContent() ?: '';
        $this->assertStringNotContainsString('081299887766', $rawContent);
        $this->assertStringNotContainsString('phone_number', $rawContent);
        $this->assertStringNotContainsString('whatsapp', $rawContent);
        $this->assertStringNotContainsString('Budi Santoso', $rawContent);
        $this->assertStringNotContainsString($patient->email, $rawContent);

        $item = collect($response->json('data'))->firstWhere('id', $scheduled->id);
        $this->assertNotNull($item);

        $expectedRm = 'RM-'.str_pad((string) $patient->id, 4, '0', STR_PAD_LEFT);
        $this->assertSame($expectedRm, $item['user']['medical_record_id'] ?? null);
        $this->assertSame('Budi S.', $item['user']['initial_name'] ?? null);
        $this->assertSame('Budi S.', $item['user']['name'] ?? null);
        $this->assertSame($expectedRm, $item['patient']['medical_record_id'] ?? null);
        $this->assertSame('Budi S.', $item['patient']['initial_name'] ?? null);
        $this->assertArrayNotHasKey('phone_number', $item['user']);
        $this->assertArrayNotHasKey('email', $item['user']);
    }

    public function test_admin_cannot_mark_completed_or_unilaterally_cancel_appointment(): void
    {
        $admin = User::where('role', 'admin')->firstOrFail();
        $adminToken = $admin->createToken('admin-guard-test', ['surface:staf'])->plainTextToken;

        $patient = User::where('role', 'pasien')->firstOrFail();
        $doctor = Doctor::where('is_active', true)->firstOrFail();
        $targetDate = now()->addDays(22)->format('Y-m-d');

        Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $targetDate)
            ->delete();

        $appointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '11:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
            'complaint' => 'Keluhan pemeriksaan awal',
        ]);
        $this->createdAppointmentIds[] = $appointment->id;

        $completeAttempt = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/janji-temu/{$appointment->id}", [
                'status' => 'selesai',
                'doctor_notes' => 'Mencoba menyelesaikan dari sisi admin.',
            ]);

        $completeAttempt->assertStatus(403);
        $this->assertSame('terjadwal', $appointment->fresh()->status);

        $cancelAttempt = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/janji-temu/{$appointment->id}", [
                'status' => 'dibatalkan',
                'doctor_notes' => 'Mencoba membatalkan sepihak tanpa pengajuan.',
            ]);

        $cancelAttempt->assertStatus(403);
        $this->assertSame('terjadwal', $appointment->fresh()->status);
    }

    public function test_admin_reject_requires_substitute_doctor_in_same_polyclinic_and_reassigns_with_notifications(): void
    {
        Http::fake([
            'https://api.wa-gateway.test/*' => Http::response(['status' => true], 200),
        ]);
        config([
            'services.whatsapp.url' => 'https://api.wa-gateway.test/send',
            'services.whatsapp.token' => 'secret-wa-token',
        ]);

        $admin = User::where('role', 'admin')->firstOrFail();
        $adminToken = $admin->createToken('admin-reassign-test', ['surface:staf'])->plainTextToken;

        $dokterUser = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $originDoctor = $dokterUser->doctor()->firstOrFail();

        $subUser = User::create([
            'name' => 'dr. Pengganti Poli Sama',
            'email' => 'dokter.pengganti.'.uniqid().'@klinik.local',
            'password' => Hash::make('DokterKlinik2026!'),
            'role' => 'dokter',
            'phone_number' => '081277778888',
        ]);
        $this->createdUserIds[] = $subUser->id;

        $substituteDoctor = Doctor::create([
            'polyclinic_id' => $originDoctor->polyclinic_id,
            'user_id' => $subUser->id,
            'name' => 'dr. Pengganti Poli Sama',
            'is_active' => true,
        ]);
        $this->createdDoctorIds[] = $substituteDoctor->id;

        $inactiveDoctor = Doctor::create([
            'polyclinic_id' => $originDoctor->polyclinic_id,
            'name' => 'dr. Nonaktif Poli Sama',
            'is_active' => false,
        ]);
        $this->createdDoctorIds[] = $inactiveDoctor->id;

        $otherPoliDoctor = Doctor::where('polyclinic_id', '!=', $originDoctor->polyclinic_id)
            ->where('is_active', true)
            ->firstOrFail();

        $patient = User::create([
            'name' => 'Siti Aisyah',
            'email' => 'siti.reassign.'.uniqid().'@klinik.local',
            'password' => Hash::make('PasienTest2026!'),
            'role' => 'pasien',
            'phone_number' => '081255556666',
        ]);
        $this->createdUserIds[] = $patient->id;

        $targetDate = now()->addDays(23)->format('Y-m-d');

        $appointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $originDoctor->polyclinic_id,
            'doctor_id' => $originDoctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '13:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
            'complaint' => 'Konsultasi lanjutan',
        ]);
        $this->createdAppointmentIds[] = $appointment->id;

        $cancellationRequest = CancellationRequest::create([
            'appointment_id' => $appointment->id,
            'doctor_id' => $originDoctor->id,
            'requested_by' => $dokterUser->id,
            'reason_category' => 'tugas_darurat',
            'reason' => 'Ada tindakan gawat darurat mendadak.',
            'status' => CancellationRequest::STATUS_PENDING,
            'due_at' => now()->addHours(6),
        ]);
        $this->createdRequestIds[] = $cancellationRequest->id;

        // Missing substitute_doctor_id -> 422
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/pengajuan-pembatalan/{$cancellationRequest->id}/tolak", [
                'admin_note' => 'Ditolak tanpa memilih dokter pengganti.',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['substitute_doctor_id']);

        // Same doctor -> 422
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/pengajuan-pembatalan/{$cancellationRequest->id}/tolak", [
                'substitute_doctor_id' => $originDoctor->id,
                'admin_note' => 'Mengalihkan ke dokter asal yang sama.',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['substitute_doctor_id']);

        // Different polyclinic -> 422
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/pengajuan-pembatalan/{$cancellationRequest->id}/tolak", [
                'substitute_doctor_id' => $otherPoliDoctor->id,
                'admin_note' => 'Mengalihkan ke dokter poliklinik lain.',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['substitute_doctor_id']);

        // Inactive doctor -> 422
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/pengajuan-pembatalan/{$cancellationRequest->id}/tolak", [
                'substitute_doctor_id' => $inactiveDoctor->id,
                'admin_note' => 'Mengalihkan ke dokter nonaktif.',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['substitute_doctor_id']);

        // Valid substitute doctor -> 200
        $rejectResponse = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/pengajuan-pembatalan/{$cancellationRequest->id}/tolak", [
                'substitute_doctor_id' => $substituteDoctor->id,
                'admin_note' => 'Dialihkan ke dr. Pengganti Poli Sama agar pelayanan tetap berjalan.',
            ]);

        $rejectResponse->assertStatus(200)
            ->assertJsonPath('data.status', CancellationRequest::STATUS_REJECTED)
            ->assertJsonPath('data.appointment.doctor_id', $substituteDoctor->id);

        $freshAppointment = $appointment->fresh();
        $this->assertSame('terjadwal', $freshAppointment->status);
        $this->assertSame($substituteDoctor->id, (int) $freshAppointment->doctor_id);

        $this->assertDatabaseHas('klinik.status_change_logs', [
            'subject_type' => StatusChangeLog::SUBJECT_APPOINTMENT,
            'subject_id' => $appointment->id,
            'from_status' => 'terjadwal',
            'to_status' => 'terjadwal',
        ]);

        $this->assertDatabaseHas('klinik.status_change_logs', [
            'subject_type' => StatusChangeLog::SUBJECT_CANCELLATION_REQUEST,
            'subject_id' => $cancellationRequest->id,
            'from_status' => CancellationRequest::STATUS_PENDING,
            'to_status' => CancellationRequest::STATUS_REJECTED,
        ]);

        Http::assertSent(fn ($req) => str_contains((string) $req['target'], '6281255556666'));
        Http::assertSent(fn ($req) => str_contains((string) $req['target'], '6281277778888')
            && str_contains((string) $req['message'], 'dokter pengganti'));
    }
}
