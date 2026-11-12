<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\Doctor\DoctorAppointmentController;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\StatusChangeLog;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class DoctorExclusiveCompleteTest extends TestCase
{
    private array $createdAppointmentIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (Route::getRoutes()->getByAction(DoctorAppointmentController::class.'@complete') === null) {
            Route::prefix('api/dokter')
                ->middleware(['api', 'surface.route:staf', 'staff.ip', 'feature:doctor_portal', 'auth:sanctum', 'surface.token', 'role:dokter', 'doctor.account'])
                ->group(function (): void {
                    Route::post('/janji-temu/{id}/selesai', [DoctorAppointmentController::class, 'complete'])->whereNumber('id');
                });
        }

        Route::getRoutes()->refreshActionLookups();
        Route::getRoutes()->refreshNameLookups();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        if (! empty($this->createdAppointmentIds)) {
            StatusChangeLog::where('subject_type', StatusChangeLog::SUBJECT_APPOINTMENT)
                ->whereIn('subject_id', $this->createdAppointmentIds)
                ->delete();

            Appointment::whereIn('id', $this->createdAppointmentIds)->delete();
        }

        parent::tearDown();
    }

    public function test_doctor_can_complete_appointment_without_follow_up(): void
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
        $patient = User::where('email', 'pasien1@klinik.local')->firstOrFail();
        $dokterToken = $dokterUser->createToken('dokter-token', ['surface:staf'])->plainTextToken;

        $targetDate = now()->addDays(20)->format('Y-m-d');
        Appointment::where('doctor_id', $doctor->id)->whereDate('appointment_date', $targetDate)->delete();

        $appointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '09:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);
        $this->createdAppointmentIds[] = $appointment->id;

        $beforeCount = Appointment::where('user_id', $patient->id)->count();

        $this->app['auth']->forgetGuards();
        $response = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$appointment->id}/selesai", [
                'doctor_notes' => 'Pasien membaik, lanjutkan terapi oral selama 5 hari.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $appointment->id)
            ->assertJsonPath('data.status', 'selesai')
            ->assertJsonPath('data.doctor_notes', 'Pasien membaik, lanjutkan terapi oral selama 5 hari.')
            ->assertJsonPath('data.follow_up_appointment', null);

        $this->assertEquals($beforeCount, Appointment::where('user_id', $patient->id)->count());

        $this->assertDatabaseHas('klinik.appointments', [
            'id' => $appointment->id,
            'status' => 'selesai',
            'doctor_notes' => 'Pasien membaik, lanjutkan terapi oral selama 5 hari.',
        ]);

        $this->assertDatabaseHas('klinik.status_change_logs', [
            'subject_type' => StatusChangeLog::SUBJECT_APPOINTMENT,
            'subject_id' => $appointment->id,
            'actor_user_id' => $dokterUser->id,
            'from_status' => 'terjadwal',
            'to_status' => 'selesai',
        ]);

        Http::assertSent(fn ($req) => $req->url() === 'https://api.wa-gateway.test/send'
            && str_contains((string) $req['message'], 'selesai'));
    }

    public function test_doctor_can_complete_appointment_with_optional_follow_up_schedule(): void
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
        $otherDoctor = Doctor::where('id', '!=', $doctor1->id)->where('is_active', true)->firstOrFail();
        $patient = User::where('email', 'pasien1@klinik.local')->firstOrFail();
        $dokterToken = $dokterUser->createToken('dokter-token', ['surface:staf'])->plainTextToken;

        $targetDate = now()->addDays(21)->format('Y-m-d');
        $followUpDate1 = now()->addDays(28)->format('Y-m-d');
        $followUpDate2 = now()->addDays(29)->format('Y-m-d');

        Appointment::where('doctor_id', $doctor1->id)
            ->whereIn('appointment_date', [$targetDate, $followUpDate1])
            ->delete();
        Appointment::where('doctor_id', $otherDoctor->id)
            ->whereDate('appointment_date', $followUpDate2)
            ->delete();

        $appDefaultFollowUp = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor1->polyclinic_id,
            'doctor_id' => $doctor1->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '10:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);

        $appCustomDoctorFollowUp = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor1->polyclinic_id,
            'doctor_id' => $doctor1->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '11:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);

        array_push($this->createdAppointmentIds, $appDefaultFollowUp->id, $appCustomDoctorFollowUp->id);

        // Case 1: follow_up_date provided without follow_up_doctor_id -> uses current doctor
        $this->app['auth']->forgetGuards();
        $res1 = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$appDefaultFollowUp->id}/selesai", [
                'doctor_notes' => 'Perlu evaluasi tekanan darah minggu depan.',
                'follow_up_date' => $followUpDate1,
            ]);

        $res1->assertStatus(200)
            ->assertJsonPath('data.status', 'selesai')
            ->assertJsonPath('data.follow_up_appointment.type', 'kontrol_rutin')
            ->assertJsonPath('data.follow_up_appointment.status', 'terjadwal')
            ->assertJsonPath('data.follow_up_appointment.user_id', $patient->id)
            ->assertJsonPath('data.follow_up_appointment.doctor_id', $doctor1->id)
            ->assertJsonPath('data.follow_up_appointment.polyclinic_id', $doctor1->polyclinic_id)
            ->assertJsonPath('data.follow_up_appointment.appointment_date', $followUpDate1);

        $followUpId1 = $res1->json('data.follow_up_appointment.id');
        $this->createdAppointmentIds[] = $followUpId1;

        $this->assertDatabaseHas('klinik.status_change_logs', [
            'subject_type' => StatusChangeLog::SUBJECT_APPOINTMENT,
            'subject_id' => $followUpId1,
            'actor_user_id' => $dokterUser->id,
            'to_status' => 'terjadwal',
        ]);

        // Case 2: follow_up_date + explicit follow_up_doctor_id -> uses specified doctor and their polyclinic
        $this->app['auth']->forgetGuards();
        $res2 = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$appCustomDoctorFollowUp->id}/selesai", [
                'doctor_notes' => 'Rujuk kontrol lanjutan ke dokter spesialis terkait.',
                'follow_up_date' => $followUpDate2,
                'follow_up_doctor_id' => $otherDoctor->id,
            ]);

        $res2->assertStatus(200)
            ->assertJsonPath('data.follow_up_appointment.type', 'kontrol_rutin')
            ->assertJsonPath('data.follow_up_appointment.doctor_id', $otherDoctor->id)
            ->assertJsonPath('data.follow_up_appointment.polyclinic_id', $otherDoctor->polyclinic_id)
            ->assertJsonPath('data.follow_up_appointment.appointment_date', $followUpDate2);

        $this->createdAppointmentIds[] = $res2->json('data.follow_up_appointment.id');
    }

    public function test_doctor_complete_validates_notes_ownership_and_scheduled_status(): void
    {
        $dokterUser = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $doctor1 = $dokterUser->doctor()->firstOrFail();
        $otherDoctor = Doctor::where('id', '!=', $doctor1->id)->where('is_active', true)->firstOrFail();
        $patient = User::where('email', 'pasien1@klinik.local')->firstOrFail();
        $dokterToken = $dokterUser->createToken('dokter-token', ['surface:staf'])->plainTextToken;

        $targetDate = now()->addDays(22)->format('Y-m-d');
        Appointment::whereIn('doctor_id', [$doctor1->id, $otherDoctor->id])->whereDate('appointment_date', $targetDate)->delete();

        $ownAppointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor1->polyclinic_id,
            'doctor_id' => $doctor1->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '09:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);

        $otherAppointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $otherDoctor->polyclinic_id,
            'doctor_id' => $otherDoctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '10:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);

        $cancelledAppointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor1->polyclinic_id,
            'doctor_id' => $doctor1->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '11:00',
            'type' => 'janji_baru',
            'status' => 'dibatalkan',
        ]);

        array_push($this->createdAppointmentIds, $ownAppointment->id, $otherAppointment->id, $cancelledAppointment->id);

        // Validation: doctor_notes required & min:5
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$ownAppointment->id}/selesai", [
                'doctor_notes' => 'Ok',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['doctor_notes']);

        // Ownership: other doctor's appointment -> 404
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$otherAppointment->id}/selesai", [
                'doctor_notes' => 'Catatan pemeriksaan dokter lain.',
            ])
            ->assertStatus(404);

        // Status: non-scheduled appointment -> 409
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson("/api/dokter/janji-temu/{$cancelledAppointment->id}/selesai", [
                'doctor_notes' => 'Tidak boleh menyelesaikan janji dibatalkan.',
            ])
            ->assertStatus(409);
    }

    public function test_admin_cannot_mark_appointment_as_selesai(): void
    {
        $admin = User::where('role', 'admin')->firstOrFail();
        $adminToken = $admin->createToken('admin-token', ['surface:staf'])->plainTextToken;
        $doctor = Doctor::where('is_active', true)->firstOrFail();
        $patient = User::where('email', 'pasien1@klinik.local')->firstOrFail();

        $targetDate = now()->addDays(23)->format('Y-m-d');
        Appointment::where('doctor_id', $doctor->id)->whereDate('appointment_date', $targetDate)->delete();

        $appointment = Appointment::create([
            'user_id' => $patient->id,
            'polyclinic_id' => $doctor->polyclinic_id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $targetDate,
            'appointment_time' => '13:00',
            'type' => 'janji_baru',
            'status' => 'terjadwal',
        ]);
        $this->createdAppointmentIds[] = $appointment->id;

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/admin/janji-temu/{$appointment->id}", [
                'status' => 'selesai',
                'doctor_notes' => 'Admin mencoba menyelesaikan pemeriksaan.',
            ])
            ->assertStatus(403);

        $this->assertDatabaseHas('klinik.appointments', [
            'id' => $appointment->id,
            'status' => 'terjadwal',
        ]);
    }
}
