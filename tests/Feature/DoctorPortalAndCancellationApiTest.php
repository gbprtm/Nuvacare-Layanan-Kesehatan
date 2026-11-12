<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CancellationRequest;
use App\Models\Doctor;
use App\Models\Polyclinic;
use App\Models\StatusChangeLog;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DoctorPortalAndCancellationApiTest extends TestCase
{
    private array $createdAppointmentIds = [];

    private array $createdRequestIds = [];

    private array $createdDoctorIds = [];

    private array $createdUserIds = [];

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        DB::transaction(function (): void {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('SET LOCAL search_path TO klinik, public');
            }

            $allRequestIds = array_unique(array_merge(
                $this->createdRequestIds,
                ! empty($this->createdAppointmentIds)
                    ? CancellationRequest::whereIn('appointment_id', $this->createdAppointmentIds)->pluck('id')->all()
                    : []
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
        });

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

    private function cleanupAppointmentsForDoctorsDates(array $doctorIds, array $dates): void
    {
        $ids = Appointment::whereIn('doctor_id', $doctorIds)
            ->whereIn('appointment_date', $dates)
            ->pluck('id')
            ->all();

        $this->deleteAppointmentsSafely($ids);
    }

    public function test_doctor_rbac_minimal_read_isolation_and_read_only_table_snapshot(): void
    {
        Http::fake([
            'https://api.wa-gateway.test/*' => Http::response(['status' => true], 200),
        ]);
        config([
            'services.whatsapp.url' => 'https://api.wa-gateway.test/send',
            'services.whatsapp.token' => 'test-token',
        ]);

        // Unauthenticated returns 401
        $this->getJson('/api/dokter/janji-temu')->assertStatus(401);

        $dokterUser = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $doctor1 = $dokterUser->doctor()->firstOrFail();
        $otherDoctor = Doctor::where('id', '!=', $doctor1->id)->where('is_active', true)->firstOrFail();
        $patient = User::where('role', 'pasien')->firstOrFail();

        $targetDate = now()->addDays(4)->format('Y-m-d');

        $this->cleanupAppointmentsForDoctorsDates([$doctor1->id, $otherDoctor->id], [$targetDate]);

        $ownAppointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor1->polyclinic_id,
            'doctor_id' => $doctor1->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '10:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
            'complaint' => 'Keluhan rahasia medis pasien',
            'doctor_notes' => 'Catatan pemeriksaan internal rahasia',
        ]);
        $this->createdAppointmentIds[] = $ownAppointment->id;

        $otherAppointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $otherDoctor->polyclinic_id,
            'doctor_id' => $otherDoctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '11:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
            'complaint' => 'Keluhan dokter lain',
        ]);
        $this->createdAppointmentIds[] = $otherAppointment->id;

        $dokterLogin = $this->postJson('/api/login', [
            'email' => 'dokter1@klinik.local',
            'password' => 'DokterKlinik2026!',
        ]);
        $dokterLogin->assertStatus(200)
            ->assertJsonPath('user.role', 'dokter');
        $dokterToken = $dokterLogin->json('token');

        // Doctor cannot access patient or admin routes (403)
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->getJson('/api/janji-temu')
            ->assertStatus(403);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->getJson('/api/admin/janji-temu')
            ->assertStatus(403);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->getJson("/api/admin/janji-temu/{$ownAppointment->id}/log")
            ->assertStatus(403);

        // Snapshot appointments, doctors, polyclinics, users before doctor read & request actions (Criterion 7)
        $snapshotBefore = [
            'appointments' => DB::table('appointments')->orderBy('id')->get()->map(fn ($r) => (array) $r)->all(),
            'doctors' => DB::table('doctors')->orderBy('id')->get()->map(fn ($r) => (array) $r)->all(),
            'polyclinics' => DB::table('polyclinics')->orderBy('id')->get()->map(fn ($r) => (array) $r)->all(),
            'users' => DB::table('users')->orderBy('id')->get()->map(fn ($r) => (array) $r)->all(),
        ];

        // Criterion 2: Doctor sees only own appointments with minimal fields & masked phone, NO complaint/doctor_notes
        $this->app['auth']->forgetGuards();
        $listRes = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->getJson("/api/dokter/janji-temu?date_from={$targetDate}&date_to={$targetDate}");

        $listRes->assertStatus(200);
        $listData = collect($listRes->json('data'));
        $this->assertTrue($listData->pluck('id')->contains($ownAppointment->id));
        $this->assertFalse($listData->pluck('id')->contains($otherAppointment->id));

        $ownItem = $listData->firstWhere('id', $ownAppointment->id);
        $this->assertArrayNotHasKey('complaint', $ownItem);
        $this->assertArrayNotHasKey('doctor_notes', $ownItem);
        $this->assertArrayNotHasKey('user_id', $ownItem);
        $this->assertArrayNotHasKey('phone_number', $ownItem['patient']);
        $this->assertArrayNotHasKey('email', $ownItem['patient']);
        $this->assertStringContainsString('****', $ownItem['patient']['masked_phone']);
        $this->assertNotEquals($patient->phone_number, $ownItem['patient']['masked_phone']);

        // Criterion 3: Viewing or requesting cancellation on another doctor's appointment returns 404
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->getJson("/api/dokter/janji-temu/{$otherAppointment->id}")
            ->assertStatus(404);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$otherAppointment->id}/pengajuan-pembatalan", [
                'reason_category' => 'sakit',
                'reason' => 'Alasan percobaan untuk janji dokter lain.',
            ])
            ->assertStatus(404);

        // Criterion 4: Doctor submits single cancellation request -> 201, appointment stays terjadwal, log written
        $this->app['auth']->forgetGuards();
        $createRes = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$ownAppointment->id}/pengajuan-pembatalan", [
                'reason_category' => 'tugas_darurat',
                'reason' => 'Ada tindakan gawat darurat di IGD.',
            ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('data.status', 'diajukan')
            ->assertJsonPath('data.reason_category', 'tugas_darurat');

        $reqId = $createRes->json('data.id');
        $this->createdRequestIds[] = $reqId;

        $this->assertDatabaseHas('klinik.status_change_logs', [
            'subject_type' => StatusChangeLog::SUBJECT_CANCELLATION_REQUEST,
            'subject_id' => $reqId,
            'to_status' => CancellationRequest::STATUS_PENDING,
        ]);

        // Criterion 5: Duplicate second open request on same appointment returns 409
        $beforeCount = CancellationRequest::where('appointment_id', $ownAppointment->id)->count();
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$ownAppointment->id}/pengajuan-pembatalan", [
                'reason_category' => 'sakit',
                'reason' => 'Pengajuan ganda yang harus ditolak sistem.',
            ])
            ->assertStatus(409);
        $this->assertEquals($beforeCount, CancellationRequest::where('appointment_id', $ownAppointment->id)->count());

        // Withdraw request -> 200
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/pengajuan-pembatalan/{$reqId}/tarik")
            ->assertStatus(200)
            ->assertJsonPath('data.status', CancellationRequest::STATUS_WITHDRAWN);

        // Verify Criterion 7 snapshot: core domain tables remain 100% untouched by doctor actions
        $snapshotAfter = [
            'appointments' => DB::table('appointments')->orderBy('id')->get()->map(fn ($r) => (array) $r)->all(),
            'doctors' => DB::table('doctors')->orderBy('id')->get()->map(fn ($r) => (array) $r)->all(),
            'polyclinics' => DB::table('polyclinics')->orderBy('id')->get()->map(fn ($r) => (array) $r)->all(),
            'users' => DB::table('users')->orderBy('id')->get()->map(fn ($r) => (array) $r)->all(),
        ];
        $this->assertEquals($snapshotBefore, $snapshotAfter);
    }

    public function test_cancellation_deadline_and_non_scheduled_appointment_rules(): void
    {
        Carbon::setTestNow(Carbon::create(2030, 5, 10, 8, 0, 0, 'Asia/Jakarta'));

        $dokterUser = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $doctor = $dokterUser->doctor()->firstOrFail();
        $patient = User::where('role', 'pasien')->firstOrFail();
        $dokterToken = $dokterUser->createToken('dokter-token', ['surface:staf'])->plainTextToken;

        $baseDate = '2030-05-10';
        $this->cleanupAppointmentsForDoctorsDates([$doctor->id], [$baseDate]);

        // < 2 hours before appointment (08:00 now vs 09:00 appointment = 1 hour -> 422)
        $tooCloseApp = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $baseDate,
            'appointment_time' => '09:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);
        $this->createdAppointmentIds[] = $tooCloseApp->id;

        // Already completed appointment -> 409
        $completedApp = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $baseDate,
            'appointment_time' => '15:00',
            'type' => 'janji_baru',
            'status' => 'selesai',
        ]);
        $this->createdAppointmentIds[] = $completedApp->id;

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$tooCloseApp->id}/pengajuan-pembatalan", [
                'reason_category' => 'sakit',
                'reason' => 'Kondisi kurang fit untuk praktik pagi.',
            ])
            ->assertStatus(422);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$completedApp->id}/pengajuan-pembatalan", [
                'reason_category' => 'sakit',
                'reason' => 'Tidak boleh diajukan untuk janji selesai.',
            ])
            ->assertStatus(409);
    }

    public function test_admin_approve_reschedule_reject_and_concurrency_conflict_flows(): void
    {
        Http::fake([
            'https://api.wa-gateway.test/*' => Http::response(['status' => true], 200),
        ]);
        config([
            'services.whatsapp.url' => 'https://api.wa-gateway.test/send',
            'services.whatsapp.token' => 'test-token',
        ]);

        $dokterUser = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $doctor1 = $dokterUser->doctor()->firstOrFail();
        $admin = User::where('role', 'admin')->firstOrFail();
        $patient1 = User::where('email', 'pasien1@klinik.local')->firstOrFail();
        $patient2 = User::where('email', 'pasien2@klinik.local')->firstOrFail();

        // Create second doctor in SAME polyclinic with linked user so replacement WA can be verified
        $repUserEmail = 'dokter_rep_'.uniqid().'@test.local';
        $repUser = User::create([
            'name' => 'dr. Pengganti Poli Umum',
            'email' => $repUserEmail,
            'password' => Hash::make('DokterTest123!'),
            'role' => 'dokter',
            'phone_number' => '6281277778888',
        ]);
        $this->createdUserIds[] = $repUser->id;

        $repDoctor = Doctor::create([
            'user_id' => $repUser->id,
            'polyclinic_id' => $doctor1->polyclinic_id,
            'name' => 'dr. Pengganti Poli Umum',
            'is_active' => true,
        ]);
        $this->createdDoctorIds[] = $repDoctor->id;

        $dokterToken = $dokterUser->createToken('dokter-token', ['surface:staf'])->plainTextToken;
        $adminToken = $admin->createToken('admin-token', ['surface:staf'])->plainTextToken;

        $dayApprove = now()->addDays(25)->format('Y-m-d');
        $dayResched = now()->addDays(26)->format('Y-m-d');
        $dayReject = now()->addDays(27)->format('Y-m-d');

        $this->cleanupAppointmentsForDoctorsDates([$doctor1->id], [$dayApprove, $dayResched, $dayReject]);
        $this->cleanupAppointmentsForDoctorsDates([$repDoctor->id], [$dayResched, $dayReject]);

        $appApprove = Appointment::create([
            'user_id' => $patient1->id,
            'polyclinic_id' => $doctor1->polyclinic_id,
            'doctor_id' => $doctor1->id,
            'appointment_date' => $dayApprove,
            'appointment_time' => '09:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);
        $appResched = Appointment::create([
            'user_id' => $patient1->id,
            'polyclinic_id' => $doctor1->polyclinic_id,
            'doctor_id' => $doctor1->id,
            'appointment_date' => $dayResched,
            'appointment_time' => '10:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);
        $appBusySlot = Appointment::create([
            'user_id' => $patient2->id,
            'polyclinic_id' => $repDoctor->polyclinic_id,
            'doctor_id' => $repDoctor->id,
            'appointment_date' => $dayResched,
            'appointment_time' => '14:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);
        $appReject = Appointment::create([
            'user_id' => $patient1->id,
            'polyclinic_id' => $doctor1->polyclinic_id,
            'doctor_id' => $doctor1->id,
            'appointment_date' => $dayReject,
            'appointment_time' => '11:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);
        array_push($this->createdAppointmentIds, $appApprove->id, $appResched->id, $appBusySlot->id, $appReject->id);

        // Doctor creates 3 requests
        $this->app['auth']->forgetGuards();
        $reqApproveId = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$appApprove->id}/pengajuan-pembatalan", [
                'reason_category' => 'sakit',
                'reason' => 'Demam tinggi perlu istirahat.',
            ])->assertStatus(201)->json('data.id');

        $this->app['auth']->forgetGuards();
        $reqReschedId = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$appResched->id}/pengajuan-pembatalan", [
                'reason_category' => 'bentrok_jadwal',
                'reason' => 'Bentrok dengan jadwal operasi darurat.',
            ])->assertStatus(201)->json('data.id');

        $this->app['auth']->forgetGuards();
        $reqRejectId = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$appReject->id}/pengajuan-pembatalan", [
                'reason_category' => 'lainnya',
                'reason' => 'Memohon pergeseran bila memungkinkan.',
            ])->assertStatus(201)->json('data.id');

        array_push($this->createdRequestIds, $reqApproveId, $reqReschedId, $reqRejectId);

        // Criterion 8: Admin approves -> appointment dibatalkan, request disetujui, 2 logs, WA patient + doctor
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/pengajuan-pembatalan/{$reqApproveId}/setujui", [
                'admin_note' => 'Disetujui, pasien sudah diinformasikan.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'disetujui')
            ->assertJsonPath('whatsapp.sent', true);

        $this->assertEquals('dibatalkan', $appApprove->fresh()->status);

        // Criterion 11: Concurrency / double action on decided request -> 409, and doctor cannot withdraw -> 409
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/pengajuan-pembatalan/{$reqApproveId}/tolak", [
                'admin_note' => 'Admin kedua mencoba menolak.',
                'substitute_doctor_id' => $repDoctor->id,
            ])
            ->assertStatus(409);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/pengajuan-pembatalan/{$reqApproveId}/tarik")
            ->assertStatus(409);

        // Criterion 9: Reschedule to occupied slot -> 422; then to free slot with replacement doctor -> 200 + log changes
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/pengajuan-pembatalan/{$reqReschedId}/jadwalkan-ulang", [
                'appointment_date' => $dayResched,
                'appointment_time' => '14:00',
                'doctor_id' => $repDoctor->id,
                'admin_note' => 'Coba slot yang sudah terisi',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['appointment_time']);

        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/pengajuan-pembatalan/{$reqReschedId}/jadwalkan-ulang", [
                'appointment_date' => $dayResched,
                'appointment_time' => '15:00',
                'doctor_id' => $repDoctor->id,
                'admin_note' => 'Dialihkan ke dr. Pengganti Poli Umum.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'dijadwalkan_ulang');

        $appResched->refresh();
        $this->assertEquals('terjadwal', $appResched->status);
        $this->assertEquals('15:00', $appResched->appointment_time);
        $this->assertEquals($repDoctor->id, $appResched->doctor_id);

        // Verify replacement doctor also received WA notification
        Http::assertSent(fn ($req) => str_contains((string) $req['target'], '6281277778888')
            && str_contains((string) $req['message'], 'dokter pengganti'));

        // Criterion 10: Reject without note or substitute_doctor_id -> 422; with valid note & substitute_doctor_id -> 200, appointment reassigned & patient + substitute doctor notified
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/pengajuan-pembatalan/{$reqRejectId}/tolak", [
                'admin_note' => 'Pengajuan ditolak tanpa memilih dokter pengganti.',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['substitute_doctor_id']);

        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/pengajuan-pembatalan/{$reqRejectId}/tolak", [
                'admin_note' => 'No',
                'substitute_doctor_id' => $repDoctor->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['admin_note']);

        $sentCountBeforeReject = Http::recorded()->count();
        $rejectRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/pengajuan-pembatalan/{$reqRejectId}/tolak", [
                'admin_note' => 'Pengajuan ditolak dan jadwal dialihkan ke dokter pengganti.',
                'substitute_doctor_id' => $repDoctor->id,
            ]);

        $rejectRes->assertStatus(200)
            ->assertJsonPath('data.status', 'ditolak')
            ->assertJsonPath('data.appointment.doctor_id', $repDoctor->id);

        $rejectUserPayload = $rejectRes->json('data.appointment.user');
        $this->assertIsArray($rejectUserPayload);
        $this->assertArrayHasKey('medical_record_id', $rejectUserPayload);
        $this->assertArrayHasKey('initial_name', $rejectUserPayload);
        $this->assertArrayNotHasKey('phone_number', $rejectUserPayload);
        $this->assertArrayNotHasKey('email', $rejectUserPayload);

        $appReject->refresh();
        $this->assertEquals('terjadwal', $appReject->status);
        $this->assertEquals($repDoctor->id, $appReject->doctor_id);

        $recordedAfterReject = Http::recorded()->slice($sentCountBeforeReject);
        $targetsAfterReject = $recordedAfterReject->map(fn ($pair) => (string) ($pair[0]['target'] ?? ''))->all();
        $this->assertContains('6281277778888', $targetsAfterReject);
        if (! empty($patient1->phone_number)) {
            $normalizedPatientPhone = str_starts_with($patient1->phone_number, '0')
                ? '62'.substr($patient1->phone_number, 1)
                : $patient1->phone_number;
            $this->assertContains($normalizedPatientPhone, $targetsAfterReject);
        }

        // Audit logs endpoint returns complete timeline for admin, and hard delete method is not allowed (405)
        $logRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson("/api/admin/janji-temu/{$appResched->id}/log");
        $logRes->assertStatus(200);
        $this->assertGreaterThanOrEqual(3, count($logRes->json('data')));

        // No hard-delete routes exist on cancellation requests (404) or appointments (405)
        $this->deleteJson("/api/admin/pengajuan-pembatalan/{$reqRejectId}", [], [
            'Authorization' => 'Bearer '.$adminToken,
        ])->assertStatus(404);

        $this->deleteJson("/api/admin/janji-temu/{$appResched->id}", [], [
            'Authorization' => 'Bearer '.$adminToken,
        ])->assertStatus(405);
    }

    public function test_legacy_admin_update_logs_status_and_voids_open_request_when_cancelled(): void
    {
        Http::fake([
            'https://api.wa-gateway.test/*' => Http::response(['status' => true], 200),
        ]);
        config([
            'services.whatsapp.url' => 'https://api.wa-gateway.test/send',
            'services.whatsapp.token' => 'test-token',
        ]);

        $dokterUser = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $doctor = $dokterUser->doctor()->firstOrFail();
        $admin = User::where('role', 'admin')->firstOrFail();
        $patient = User::where('role', 'pasien')->firstOrFail();

        $targetDate = now()->addDays(28)->format('Y-m-d');
        $this->cleanupAppointmentsForDoctorsDates([$doctor->id], [$targetDate]);

        $app = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '09:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);
        $this->createdAppointmentIds[] = $app->id;

        $dokterToken = $dokterUser->createToken('dokter-token', ['surface:staf'])->plainTextToken;
        $adminToken = $admin->createToken('admin-token', ['surface:staf'])->plainTextToken;

        $this->app['auth']->forgetGuards();
        $reqId = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$app->id}/pengajuan-pembatalan", [
                'reason_category' => 'cuti_mendadak',
                'reason' => 'Dokter mengajukan cuti, namun pasien menghubungi admin langsung.',
            ])->assertStatus(201)->json('data.id');
        $this->createdRequestIds[] = $reqId;

        // Criterion 12: Legacy PATCH /api/admin/janji-temu/{id} preserves response & voids open request (gugur)
        $this->app['auth']->forgetGuards();
        $patchRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/janji-temu/{$app->id}", [
                'status' => 'dibatalkan',
                'doctor_notes' => 'Pasien meminta pembatalan via telepon.',
            ]);

        $patchRes->assertStatus(200)
            ->assertJsonPath('data.status', 'dibatalkan')
            ->assertJsonPath('whatsapp.sent', true);

        $this->assertEquals(CancellationRequest::STATUS_VOIDED, CancellationRequest::find($reqId)?->status);
        $this->assertDatabaseHas('klinik.status_change_logs', [
            'subject_type' => StatusChangeLog::SUBJECT_APPOINTMENT,
            'subject_id' => $app->id,
            'from_status' => 'terjadwal',
            'to_status' => 'dibatalkan',
        ]);
        $this->assertDatabaseHas('klinik.status_change_logs', [
            'subject_type' => StatusChangeLog::SUBJECT_CANCELLATION_REQUEST,
            'subject_id' => $reqId,
            'to_status' => CancellationRequest::STATUS_VOIDED,
        ]);
    }

    public function test_batch_leave_and_artisan_expiry_command(): void
    {
        Http::fake([
            'https://api.wa-gateway.test/*' => Http::response(['status' => true], 200),
        ]);
        config([
            'services.whatsapp.url' => 'https://api.wa-gateway.test/send',
            'services.whatsapp.token' => 'test-token',
        ]);

        Carbon::setTestNow(Carbon::create(2030, 6, 1, 7, 0, 0, 'Asia/Jakarta'));

        $dokterUser = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $doctor = $dokterUser->doctor()->firstOrFail();
        $patient = User::where('role', 'pasien')->firstOrFail();
        $dokterToken = $dokterUser->createToken('dokter-token', ['surface:staf'])->plainTextToken;

        $d1 = '2030-06-03';
        $d2 = '2030-06-05';
        $rangeIds = Appointment::where('doctor_id', $doctor->id)
            ->whereBetween('appointment_date', [$d1, $d2])
            ->pluck('id')
            ->all();
        $this->deleteAppointmentsSafely($rangeIds);

        $elig1 = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $d1,
            'appointment_time' => '10:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);
        $elig2 = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $d2,
            'appointment_time' => '13:00',
            'type' => 'kontrol_rutin',
            'status' => 'terjadwal',
        ]);
        $inelig = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $d1,
            'appointment_time' => '11:00',
            'type' => 'janji_baru',
            'status' => 'dibatalkan',
        ]);
        array_push($this->createdAppointmentIds, $elig1->id, $elig2->id, $inelig->id);

        // Range > 14 days rejected with 422
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson('/api/dokter/pengajuan-pembatalan/massal', [
                'date_from' => $d1,
                'date_to' => '2030-06-25',
                'reason_category' => 'cuti_mendadak',
                'reason' => 'Cuti terlalu panjang melebihi 14 hari.',
            ])
            ->assertStatus(422);

        // Criterion 13: Valid batch range reports created + skipped matching total appointments in range
        $batchRes = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson('/api/dokter/pengajuan-pembatalan/massal', [
                'date_from' => $d1,
                'date_to' => $d2,
                'reason_category' => 'cuti_mendadak',
                'reason' => 'Menghadiri seminar medis tahunan luar kota.',
            ]);

        $batchRes->assertStatus(201);
        $created = $batchRes->json('data.created');
        $skipped = $batchRes->json('data.skipped');
        $this->assertCount(2, $created);
        $this->assertCount(1, $skipped);

        foreach ($created as $item) {
            $this->createdRequestIds[] = $item['id'];
        }

        // Advance clock past $elig1 (2030-06-03 10:15) and run artisan pengajuan:kedaluwarsa
        Carbon::setTestNow(Carbon::create(2030, 6, 3, 10, 15, 0, 'Asia/Jakarta'));

        $this->artisan('pengajuan:kedaluwarsa')->assertExitCode(0);

        $firstReq = CancellationRequest::where('appointment_id', $elig1->id)->firstOrFail();
        $secondReq = CancellationRequest::where('appointment_id', $elig2->id)->firstOrFail();

        $this->assertEquals(CancellationRequest::STATUS_EXPIRED, $firstReq->status);
        $this->assertEquals(CancellationRequest::STATUS_PENDING, $secondReq->status);
        // BR7: appointment remains terjadwal after expiry
        $this->assertEquals('terjadwal', $elig1->fresh()->status);
    }
}
