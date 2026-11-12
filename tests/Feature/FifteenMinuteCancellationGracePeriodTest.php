<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\Doctor\CancellationRequestController as DoctorCancellationRequestController;
use App\Http\Controllers\Api\Patient\AppointmentController as PatientAppointmentController;
use App\Models\Appointment;
use App\Models\CancellationRequest;
use App\Models\Doctor;
use App\Models\StatusChangeLog;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class FifteenMinuteCancellationGracePeriodTest extends TestCase
{
    private array $createdAppointmentIds = [];

    private array $createdRequestIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (Route::getRoutes()->getByAction(DoctorCancellationRequestController::class.'@quickCancel') === null) {
            Route::prefix('api/dokter')
                ->middleware(['api', 'surface.route:staf', 'staff.ip', 'feature:doctor_portal', 'auth:sanctum', 'surface.token', 'role:dokter', 'doctor.account'])
                ->group(function (): void {
                    Route::post('/janji-temu/{id}/batal-cepat', [DoctorCancellationRequestController::class, 'quickCancel'])->whereNumber('id');
                });
        }

        if (Route::getRoutes()->getByAction(PatientAppointmentController::class.'@cancel') === null) {
            Route::prefix('api')
                ->middleware(['api', 'surface.route:pasien', 'auth:sanctum', 'surface.token', 'role:pasien'])
                ->group(function (): void {
                    Route::post('/janji-temu/{id}/batal', [PatientAppointmentController::class, 'cancel'])->whereNumber('id');
                });
        }

        Route::getRoutes()->refreshActionLookups();
        Route::getRoutes()->refreshNameLookups();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

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

        parent::tearDown();
    }

    public function test_doctor_can_quick_cancel_within_15_minutes_grace_period(): void
    {
        Http::fake([
            'https://api.wa-gateway.test/*' => Http::response(['status' => true], 200),
        ]);
        config([
            'services.whatsapp.url' => 'https://api.wa-gateway.test/send',
            'services.whatsapp.token' => 'test-token',
        ]);

        $createdAt = Carbon::create(2030, 6, 10, 9, 0, 0, 'Asia/Jakarta');
        Carbon::setTestNow($createdAt);

        $dokterUser = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $doctor = $dokterUser->doctor()->firstOrFail();
        $patient = User::where('email', 'pasien1@klinik.local')->firstOrFail();
        $admin = User::where('role', 'admin')->whereNull('disabled_at')->whereNotNull('phone_number')->first();
        $dokterToken = $dokterUser->createToken('dokter-token', ['surface:staf'])->plainTextToken;

        $targetDate = '2030-06-15';
        Appointment::where('doctor_id', $doctor->id)->whereDate('appointment_date', $targetDate)->delete();

        $appointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '10:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);
        $this->createdAppointmentIds[] = $appointment->id;

        // Advance to minute 10 (inside 15-minute grace period)
        Carbon::setTestNow($createdAt->copy()->addMinutes(10));

        $this->app['auth']->forgetGuards();
        $showRes = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->getJson("/api/dokter/janji-temu/{$appointment->id}");

        $showRes->assertStatus(200)
            ->assertJsonPath('data.can_quick_cancel', true);

        $this->app['auth']->forgetGuards();
        $cancelRes = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$appointment->id}/batal-cepat", [
                'reason' => 'Jadwal baru bentrok dengan tindakan mendesak.',
            ]);

        $cancelRes->assertStatus(200)
            ->assertJsonPath('data.status', 'dibatalkan');

        $this->assertDatabaseHas('klinik.appointments', [
            'id' => $appointment->id,
            'status' => 'dibatalkan',
        ]);

        $this->assertDatabaseHas('klinik.status_change_logs', [
            'subject_type' => StatusChangeLog::SUBJECT_APPOINTMENT,
            'subject_id' => $appointment->id,
            'actor_user_id' => $dokterUser->id,
            'from_status' => 'terjadwal',
            'to_status' => 'dibatalkan',
        ]);

        // Patient WA notified
        Http::assertSent(fn ($req) => $req->url() === 'https://api.wa-gateway.test/send'
            && str_contains((string) $req['message'], 'dibatalkan'));

        // Active admin WA notified if phone_number is configured
        if ($admin && ! empty($admin->phone_number)) {
            Http::assertSent(fn ($req) => $req->url() === 'https://api.wa-gateway.test/send'
                && str_contains((string) $req['message'], $doctor->name));
        }
    }

    public function test_doctor_cannot_quick_cancel_after_15_minutes_grace_period(): void
    {
        $createdAt = Carbon::create(2030, 6, 11, 9, 0, 0, 'Asia/Jakarta');
        Carbon::setTestNow($createdAt);

        $dokterUser = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $doctor = $dokterUser->doctor()->firstOrFail();
        $patient = User::where('email', 'pasien1@klinik.local')->firstOrFail();
        $dokterToken = $dokterUser->createToken('dokter-token', ['surface:staf'])->plainTextToken;

        $targetDate = '2030-06-16';
        Appointment::where('doctor_id', $doctor->id)->whereDate('appointment_date', $targetDate)->delete();

        $appointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '11:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);
        $this->createdAppointmentIds[] = $appointment->id;

        // Advance to minute 16 (past 15-minute grace period)
        Carbon::setTestNow($createdAt->copy()->addMinutes(16));

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->getJson("/api/dokter/janji-temu/{$appointment->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.can_quick_cancel', false);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$appointment->id}/batal-cepat")
            ->assertStatus(422);

        $this->assertDatabaseHas('klinik.appointments', [
            'id' => $appointment->id,
            'status' => 'terjadwal',
        ]);
    }

    public function test_doctor_quick_cancel_enforces_ownership_and_scheduled_status(): void
    {
        Carbon::setTestNow(Carbon::create(2030, 6, 12, 9, 0, 0, 'Asia/Jakarta'));

        $dokterUser = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $doctor1 = $dokterUser->doctor()->firstOrFail();
        $otherDoctor = Doctor::where('id', '!=', $doctor1->id)->where('is_active', true)->firstOrFail();
        $patient = User::where('email', 'pasien1@klinik.local')->firstOrFail();
        $dokterToken = $dokterUser->createToken('dokter-token', ['surface:staf'])->plainTextToken;

        $targetDate = '2030-06-17';
        Appointment::whereIn('doctor_id', [$doctor1->id, $otherDoctor->id])->whereDate('appointment_date', $targetDate)->delete();

        $otherAppointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $otherDoctor->polyclinic_id,
            'doctor_id' => $otherDoctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '09:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);

        $completedAppointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor1->polyclinic_id,
            'doctor_id' => $doctor1->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '13:00',
            'type' => 'janji_baru',
            'status' => 'selesai',
        ]);
        array_push($this->createdAppointmentIds, $otherAppointment->id, $completedAppointment->id);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$otherAppointment->id}/batal-cepat")
            ->assertStatus(404);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$completedAppointment->id}/batal-cepat")
            ->assertStatus(409);
    }

    public function test_patient_self_cancel_voids_open_cancellation_request_and_notifies_doctor_directly(): void
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
        $patient1 = User::where('email', 'pasien1@klinik.local')->firstOrFail();
        $patient2 = User::where('email', 'pasien2@klinik.local')->firstOrFail();

        $dokterToken = $dokterUser->createToken('dokter-token', ['surface:staf'])->plainTextToken;
        $patient1Token = $patient1->createToken('pasien1-token', ['surface:pasien'])->plainTextToken;
        $patient2Token = $patient2->createToken('pasien2-token', ['surface:pasien'])->plainTextToken;

        $targetDate = now()->addDays(18)->format('Y-m-d');
        Appointment::where('doctor_id', $doctor->id)->whereDate('appointment_date', $targetDate)->delete();

        $appointment = Appointment::create([
            'user_id' => $patient1->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '14:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);
        $this->createdAppointmentIds[] = $appointment->id;

        // Doctor creates an open cancellation request
        $this->app['auth']->forgetGuards();
        $requestRes = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$appointment->id}/pengajuan-pembatalan", [
                'reason_category' => 'bentrok_jadwal',
                'reason' => 'Ada agenda rapat medis mendadak di klinik.',
            ]);

        $requestRes->assertStatus(201);
        $cancellationRequestId = $requestRes->json('data.id');
        $this->createdRequestIds[] = $cancellationRequestId;

        // Another patient cannot cancel patient1's appointment
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$patient2Token)
            ->postJson("/api/janji-temu/{$appointment->id}/batal")
            ->assertStatus(404);

        // Patient1 self-cancels appointment -> request immediately becomes 'gugur' & doctor notified directly
        $this->app['auth']->forgetGuards();
        $cancelRes = $this->withHeader('Authorization', 'Bearer '.$patient1Token)
            ->postJson("/api/janji-temu/{$appointment->id}/batal", [
                'reason' => 'Berhalangan hadir pada tanggal tersebut.',
            ]);

        $cancelRes->assertStatus(200)
            ->assertJsonPath('data.status', 'dibatalkan')
            ->assertJsonPath('voided_requests_count', 1);

        $this->assertDatabaseHas('klinik.appointments', [
            'id' => $appointment->id,
            'status' => 'dibatalkan',
        ]);

        $this->assertDatabaseHas('klinik.cancellation_requests', [
            'id' => $cancellationRequestId,
            'status' => CancellationRequest::STATUS_VOIDED,
        ]);

        $this->assertDatabaseHas('klinik.status_change_logs', [
            'subject_type' => StatusChangeLog::SUBJECT_APPOINTMENT,
            'subject_id' => $appointment->id,
            'actor_user_id' => $patient1->id,
            'from_status' => 'terjadwal',
            'to_status' => 'dibatalkan',
        ]);

        $this->assertDatabaseHas('klinik.status_change_logs', [
            'subject_type' => StatusChangeLog::SUBJECT_CANCELLATION_REQUEST,
            'subject_id' => $cancellationRequestId,
            'actor_user_id' => $patient1->id,
            'from_status' => CancellationRequest::STATUS_PENDING,
            'to_status' => CancellationRequest::STATUS_VOIDED,
        ]);

        if (! empty($dokterUser->phone_number)) {
            Http::assertSent(fn ($req) => $req->url() === 'https://api.wa-gateway.test/send'
                && str_contains((string) $req['message'], 'berstatus gugur'));
        }

        // Re-cancelling returns 409
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$patient1Token)
            ->postJson("/api/janji-temu/{$appointment->id}/batal")
            ->assertStatus(409);
    }
}
