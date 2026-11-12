<?php

namespace Tests\Feature;

use App\Models\DoctorSlotRequest;
use App\Models\StatusChangeLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DoctorSlotRequestWorkflowTest extends TestCase
{
    private array $createdSlotRequestIds = [];

    protected function tearDown(): void
    {
        if (! empty($this->createdSlotRequestIds)) {
            DB::transaction(function (): void {
                if (DB::getDriverName() === 'pgsql') {
                    DB::statement('SET LOCAL search_path TO klinik, public');
                }

                StatusChangeLog::where('subject_type', 'doctor_slot_request')
                    ->whereIn('subject_id', $this->createdSlotRequestIds)
                    ->delete();

                DoctorSlotRequest::whereIn('id', $this->createdSlotRequestIds)->delete();
            });
        }

        parent::tearDown();
    }

    public function test_doctor_can_submit_slot_request_and_admin_can_approve_or_reject(): void
    {
        $admin = User::where('role', 'admin')->firstOrFail();
        $adminToken = $admin->createToken('admin-slot-test', ['surface:staf'])->plainTextToken;

        $dokterUser = User::where('email', 'dokter1@klinik.local')->firstOrFail();
        $doctor = $dokterUser->doctor()->firstOrFail();
        $dokterToken = $dokterUser->createToken('dokter-slot-test', ['surface:staf'])->plainTextToken;

        $patient = User::where('role', 'pasien')->firstOrFail();
        $patientToken = $patient->createToken('pasien-slot-test', ['surface:pasien'])->plainTextToken;

        $scheduleDate = now()->addDays(18)->format('Y-m-d');

        // Patient cannot access doctor or admin slot endpoints
        $this->withHeader('Authorization', 'Bearer '.$patientToken)
            ->getJson('/api/admin/slot-tambahan')
            ->assertStatus(403);

        $this->app['auth']->forgetGuards();

        // Doctor creates 2 slot requests
        $createApprove = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson('/api/dokter/slot-tambahan', [
                'schedule_date' => $scheduleDate,
                'start_time' => '17:00',
                'end_time' => '18:00',
                'quota' => 4,
                'reason' => 'Menambah jam praktik sore untuk pasien kontrol.',
            ]);

        $createApprove->assertStatus(201)
            ->assertJsonPath('data.status', 'diajukan');

        $approveId = $createApprove->json('data.id');
        $this->createdSlotRequestIds[] = $approveId;

        $createReject = $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->postJson('/api/dokter/slot-tambahan', [
                'schedule_date' => $scheduleDate,
                'start_time' => '19:00',
                'end_time' => '20:00',
                'quota' => 2,
                'reason' => 'Membuka sesi tambahan malam hari.',
            ]);

        $createReject->assertStatus(201)
            ->assertJsonPath('data.status', 'diajukan');

        $rejectId = $createReject->json('data.id');
        $this->createdSlotRequestIds[] = $rejectId;

        // Doctor sees own requests
        $this->withHeader('Authorization', 'Bearer '.$dokterToken)
            ->getJson('/api/dokter/slot-tambahan')
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $approveId])
            ->assertJsonFragment(['id' => $rejectId]);

        $this->app['auth']->forgetGuards();

        // Admin lists slot requests
        $adminList = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/admin/slot-tambahan');

        $adminList->assertStatus(200)
            ->assertJsonFragment(['id' => $approveId])
            ->assertJsonFragment(['id' => $rejectId]);

        // Admin cannot reject without valid admin_note (min 5 chars)
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/slot-tambahan/{$rejectId}/tolak", [
                'admin_note' => 'No',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['admin_note']);

        // Admin rejects second request
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/slot-tambahan/{$rejectId}/tolak", [
                'admin_note' => 'Ruangan poliklinik tidak tersedia pada malam hari.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'ditolak');

        // Re-approving rejected request -> 409
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/slot-tambahan/{$rejectId}/setujui")
            ->assertStatus(409);

        // Admin approves first request
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/slot-tambahan/{$approveId}/setujui", [
                'admin_note' => 'Disetujui untuk jam praktik sore tambahan.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'disetujui');

        // Re-rejecting approved request -> 409
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->postJson("/api/admin/slot-tambahan/{$approveId}/tolak", [
                'admin_note' => 'Mencoba menolak yang sudah disetujui.',
            ])
            ->assertStatus(409);

        $this->assertDatabaseHas('klinik.status_change_logs', [
            'subject_type' => 'doctor_slot_request',
            'subject_id' => $approveId,
            'from_status' => 'diajukan',
            'to_status' => 'disetujui',
        ]);

        $this->assertDatabaseHas('klinik.status_change_logs', [
            'subject_type' => 'doctor_slot_request',
            'subject_id' => $rejectId,
            'from_status' => 'diajukan',
            'to_status' => 'ditolak',
        ]);

        // Approved slot appears in public/patient available slots endpoint
        $this->app['auth']->forgetGuards();
        $slotsRes = $this->withHeader('Authorization', 'Bearer '.$patientToken)
            ->getJson("/api/slot-tersedia?doctor_id={$doctor->id}&date={$scheduleDate}");

        $slotsRes->assertStatus(200);
        $slots = collect($slotsRes->json('data'));
        $extraSlot = $slots->firstWhere('time', '17:00');
        $this->assertNotNull($extraSlot);
        $this->assertTrue((bool) $extraSlot['available']);
    }
}
