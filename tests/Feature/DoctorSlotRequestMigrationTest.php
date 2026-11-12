<?php

namespace Tests\Feature;

use App\Models\Doctor;
use App\Models\DoctorSlotRequest;
use App\Models\Polyclinic;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DoctorSlotRequestMigrationTest extends TestCase
{
    private array $createdSlotRequestIds = [];

    private array $createdDoctorIds = [];

    protected function tearDown(): void
    {
        if (! empty($this->createdSlotRequestIds)) {
            DoctorSlotRequest::whereIn('id', $this->createdSlotRequestIds)->delete();
        }

        if (! empty($this->createdDoctorIds)) {
            Doctor::whereIn('id', $this->createdDoctorIds)->delete();
        }

        parent::tearDown();
    }

    public function test_doctor_slot_requests_table_has_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('doctor_slot_requests'));
        $this->assertTrue(Schema::hasColumns('doctor_slot_requests', [
            'id',
            'doctor_id',
            'schedule_date',
            'start_time',
            'end_time',
            'quota',
            'reason',
            'status',
            'admin_note',
            'created_at',
            'updated_at',
        ]));
    }

    public function test_doctor_slot_request_model_defaults_and_relationships(): void
    {
        $polyclinic = Polyclinic::firstOrFail();

        $doctor = Doctor::create([
            'polyclinic_id' => $polyclinic->id,
            'name' => 'dr. Slot Test '.uniqid(),
            'is_active' => true,
        ]);
        $this->createdDoctorIds[] = $doctor->id;

        $slotRequest = DoctorSlotRequest::create([
            'doctor_id' => $doctor->id,
            'schedule_date' => now()->addDays(2)->format('Y-m-d'),
            'start_time' => '17:00',
            'end_time' => '19:00',
            'quota' => 5,
            'reason' => 'Tambahan jam praktik untuk pasien kontrol.',
        ]);
        $this->createdSlotRequestIds[] = $slotRequest->id;

        $freshRequest = $slotRequest->fresh();
        $this->assertNotNull($freshRequest);
        $this->assertSame(DoctorSlotRequest::STATUS_PENDING, $freshRequest->status);
        $this->assertSame(5, $freshRequest->quota);
        $this->assertNull($freshRequest->admin_note);

        $this->assertSame($doctor->id, $freshRequest->doctor->id);
        $this->assertTrue($doctor->slotRequests()->whereKey($freshRequest->id)->exists());
    }

    public function test_doctor_slot_request_rejects_invalid_status_on_pgsql(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Constraint CHECK status hanya berlaku pada driver pgsql.');
        }

        $polyclinic = Polyclinic::firstOrFail();

        $doctor = Doctor::create([
            'polyclinic_id' => $polyclinic->id,
            'name' => 'dr. Constraint Test '.uniqid(),
            'is_active' => true,
        ]);
        $this->createdDoctorIds[] = $doctor->id;

        $this->expectException(QueryException::class);

        DoctorSlotRequest::create([
            'doctor_id' => $doctor->id,
            'schedule_date' => now()->addDays(3)->format('Y-m-d'),
            'start_time' => '17:00',
            'end_time' => '18:00',
            'quota' => 3,
            'reason' => 'Uji constraint status tidak valid.',
            'status' => 'tidak_valid',
        ]);
    }

    public function test_doctor_slot_request_cascades_on_doctor_delete(): void
    {
        $polyclinic = Polyclinic::firstOrFail();

        $doctor = Doctor::create([
            'polyclinic_id' => $polyclinic->id,
            'name' => 'dr. Cascade Test '.uniqid(),
            'is_active' => true,
        ]);
        $this->createdDoctorIds[] = $doctor->id;

        $slotRequest = DoctorSlotRequest::create([
            'doctor_id' => $doctor->id,
            'schedule_date' => now()->addDays(3)->format('Y-m-d'),
            'start_time' => '17:00',
            'end_time' => '18:00',
            'quota' => 3,
            'reason' => 'Uji cascade delete saat dokter dihapus.',
            'status' => DoctorSlotRequest::STATUS_APPROVED,
        ]);

        $doctor->delete();

        $this->assertNull(DoctorSlotRequest::find($slotRequest->id));
    }
}
