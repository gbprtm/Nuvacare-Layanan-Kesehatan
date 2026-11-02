<?php

namespace Tests\Feature;

use App\Exceptions\SlotUnavailableException;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Doctor;
use App\Models\Slot;
use App\Models\User;
use App\Services\Appointments\AppointmentBookingService;
use App\Support\WibClock;
use Illuminate\Support\Str;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    protected User $patient;

    protected User $otherPatient;

    protected User $admin;

    protected Doctor $doctor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->patient = User::factory()->create([
            'role' => 'pasien',
            'name' => 'Pasien Tes L08',
            'email' => 'pasien.l08.'.Str::random(6).'@example.com',
        ]);

        $this->otherPatient = User::factory()->create([
            'role' => 'pasien',
            'name' => 'Pasien B L08',
            'email' => 'pasien.b.'.Str::random(6).'@example.com',
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'name' => 'Admin Tes L08',
            'email' => 'admin.l08.'.Str::random(6).'@example.com',
        ]);

        $this->doctor = Doctor::create([
            'id' => (string) Str::uuid(),
            'nama' => 'dr. Haryanto, Sp.PD',
            'spesialisasi' => 'Penyakit Dalam',
            'nomor_izin' => 'SIP-L08-'.Str::random(4),
            'aktif' => true,
        ]);
    }

    protected function tearDown(): void
    {
        // Bersihkan data tes untuk menjaga isolasi
        if (isset($this->doctor)) {
            Appointment::where('dokter_id', $this->doctor->id)->delete();
            Slot::where('dokter_id', $this->doctor->id)->delete();
            $this->doctor->delete();
        }

        if (isset($this->patient)) {
            $this->patient->delete();
        }
        if (isset($this->otherPatient)) {
            $this->otherPatient->delete();
        }
        if (isset($this->admin)) {
            $this->admin->delete();
        }

        parent::tearDown();
    }

    public function test_patient_can_view_active_doctors_and_specialties(): void
    {
        $inactiveDoctor = Doctor::create([
            'id' => (string) Str::uuid(),
            'nama' => 'dr. Nonaktif, Sp.A',
            'spesialisasi' => 'Anak',
            'nomor_izin' => 'SIP-NONAKTIF',
            'aktif' => false,
        ]);

        $response = $this->actingAs($this->patient)->get('/dokter');

        $response->assertStatus(200);
        $response->assertSee('dr. Haryanto, Sp.PD');
        $response->assertSee('Penyakit Dalam');
        $response->assertDontSee('dr. Nonaktif, Sp.A');

        $inactiveDoctor->delete();
    }

    public function test_patient_can_view_available_slots(): void
    {
        $slot = Slot::create([
            'id' => (string) Str::uuid(),
            'dokter_id' => $this->doctor->id,
            'tanggal' => WibClock::today(),
            'jam_mulai' => '09:00',
            'jam_selesai' => '09:30',
            'kuota' => 1,
            'tersedia' => true,
        ]);

        $response = $this->actingAs($this->patient)->get('/slot?dokter_id='.$this->doctor->id);

        $response->assertStatus(200);
        $response->assertSee('09:00 - 09:30 WIB');
        $response->assertSee($this->doctor->nama);
        $response->assertSee('Tersedia');
    }

    public function test_patient_can_navigate_booking_flow_steps(): void
    {
        $slot = Slot::create([
            'id' => (string) Str::uuid(),
            'dokter_id' => $this->doctor->id,
            'tanggal' => WibClock::today(),
            'jam_mulai' => '10:00',
            'jam_selesai' => '10:30',
            'kuota' => 1,
            'tersedia' => true,
        ]);

        // Step 1 (P6): Pilih Spesialisasi
        $p6 = $this->actingAs($this->patient)->get('/janji/buat');
        $p6->assertStatus(200);
        $p6->assertSee('Penyakit Dalam');
        $p6->assertSee('slot tersedia');

        // Step 2 (P7): Pilih Waktu Praktik
        $p7 = $this->actingAs($this->patient)->get('/janji/buat?spesialisasi=Penyakit%20Dalam');
        $p7->assertStatus(200);
        $p7->assertSee('10:00 - 10:30 WIB');
        $p7->assertSee('Pilih Jam Ini');

        // Step 3 (P8): Konfirmasi Janji Temu
        $p8 = $this->actingAs($this->patient)->get('/janji/buat?spesialisasi=Penyakit%20Dalam&slot_id='.$slot->id);
        $p8->assertStatus(200);
        $p8->assertSee('Konfirmasi Janji Temu');
        $p8->assertSee('Nomor estimasi yang diterbitkan adalah perkiraan kedatangan, bukan nomor urutan panggilan antrean klinik');
        $p8->assertSee('Buat Janji Temu');
    }

    public function test_patient_can_book_available_slot_and_receive_estimated_number(): void
    {
        $slot = Slot::create([
            'id' => (string) Str::uuid(),
            'dokter_id' => $this->doctor->id,
            'tanggal' => WibClock::today(),
            'jam_mulai' => '11:00',
            'jam_selesai' => '11:30',
            'kuota' => 1,
            'tersedia' => true,
        ]);

        $response = $this->actingAs($this->patient)->post('/janji', [
            'slot_id' => $slot->id,
            'keluhan' => 'Demam dan flu sejak kemarin',
        ]);

        $appointment = Appointment::where('slot_id', $slot->id)->first();
        $this->assertNotNull($appointment);
        $this->assertEquals($this->patient->id, $appointment->pasien_id);
        $this->assertEquals('aktif', $appointment->status);
        $this->assertEquals('Demam dan flu sejak kemarin', $appointment->keluhan);
        $this->assertEquals(1, $appointment->nomor_estimasi);

        // Slot harus berubah menjadi tidak tersedia
        $slot->refresh();
        $this->assertFalse($slot->tersedia);

        // Harus dialihkan ke detail janji
        $response->assertRedirect(route('appointments.show', $appointment->id));

        // Halaman detail harus menampilkan nomor estimasi dan label perkiraan
        $detail = $this->actingAs($this->patient)->get(route('appointments.show', $appointment->id));
        $detail->assertStatus(200);
        $detail->assertSee('#1');
        $detail->assertSee('Nomor Estimasi Kedatangan');
        $detail->assertSee('perkiraan');
    }

    public function test_concurrency_anti_race_two_concurrent_bookings_on_same_slot_only_one_succeeds(): void
    {
        $slot = Slot::create([
            'id' => (string) Str::uuid(),
            'dokter_id' => $this->doctor->id,
            'tanggal' => WibClock::today(),
            'jam_mulai' => '13:00',
            'jam_selesai' => '13:30',
            'kuota' => 1,
            'tersedia' => true,
        ]);

        /** @var AppointmentBookingService $service */
        $service = app(AppointmentBookingService::class);

        // Pemesan pertama berhasil
        $apt1 = $service->bookAppointment($this->patient, $slot->id, 'Pasien 1');
        $this->assertNotNull($apt1);
        $this->assertEquals('aktif', $apt1->status);

        // Pemesan kedua pada slot yang sama ditolak secara aman via transaksi
        $this->expectException(SlotUnavailableException::class);
        $service->bookAppointment($this->otherPatient, $slot->id, 'Pasien 2');
    }

    public function test_patient_cannot_submit_prohibited_nik_or_kk(): void
    {
        $slot = Slot::create([
            'id' => (string) Str::uuid(),
            'dokter_id' => $this->doctor->id,
            'tanggal' => WibClock::today(),
            'jam_mulai' => '14:00',
            'jam_selesai' => '14:30',
            'kuota' => 1,
            'tersedia' => true,
        ]);

        $response = $this->actingAs($this->patient)->post('/janji', [
            'slot_id' => $slot->id,
            'nik' => '3201234567890001',
        ]);

        $response->assertSessionHasErrors(['nik']);
        $this->assertDatabaseMissing('janji', ['slot_id' => $slot->id]);
    }

    public function test_patient_can_cancel_own_appointment_and_slot_becomes_available_again(): void
    {
        $slot = Slot::create([
            'id' => (string) Str::uuid(),
            'dokter_id' => $this->doctor->id,
            'tanggal' => WibClock::today(),
            'jam_mulai' => '15:00',
            'jam_selesai' => '15:30',
            'kuota' => 1,
            'tersedia' => false,
        ]);

        $appointment = Appointment::create([
            'id' => (string) Str::uuid(),
            'pasien_id' => $this->patient->id,
            'dokter_id' => $this->doctor->id,
            'slot_id' => $slot->id,
            'status' => 'aktif',
        ]);

        $response = $this->actingAs($this->patient)->post("/janji/{$appointment->id}/batal", [
            'alasan' => 'Ada keperluan keluarga mendesak',
        ]);

        $response->assertRedirect(route('appointments.show', $appointment->id));

        $appointment->refresh();
        $this->assertEquals('dibatalkan', $appointment->status);
        $this->assertEquals('Ada keperluan keluarga mendesak', $appointment->alasan_batal);
        $this->assertEquals($this->patient->id, $appointment->dibatalkan_oleh);

        $slot->refresh();
        $this->assertTrue($slot->tersedia);
    }

    public function test_idor_protection_patient_cannot_view_or_cancel_other_patients_appointment(): void
    {
        $slot = Slot::create([
            'id' => (string) Str::uuid(),
            'dokter_id' => $this->doctor->id,
            'tanggal' => WibClock::today(),
            'jam_mulai' => '16:00',
            'jam_selesai' => '16:30',
            'kuota' => 1,
            'tersedia' => false,
        ]);

        $appointmentOther = Appointment::create([
            'id' => (string) Str::uuid(),
            'pasien_id' => $this->otherPatient->id,
            'dokter_id' => $this->doctor->id,
            'slot_id' => $slot->id,
            'status' => 'aktif',
        ]);

        // Pasien A melihat janji Pasien B -> 403 Forbidden
        $responseView = $this->actingAs($this->patient)->get("/janji/{$appointmentOther->id}");
        $responseView->assertStatus(403);

        // Pasien A membatalkan janji Pasien B -> 403 Forbidden
        $responseCancel = $this->actingAs($this->patient)->post("/janji/{$appointmentOther->id}/batal", [
            'alasan' => 'Mencoba membatalkan milik orang lain',
        ]);
        $responseCancel->assertStatus(403);
    }

    public function test_admin_can_view_operational_appointments_without_exposing_full_health_profile(): void
    {
        $slot = Slot::create([
            'id' => (string) Str::uuid(),
            'dokter_id' => $this->doctor->id,
            'tanggal' => WibClock::today(),
            'jam_mulai' => '16:30',
            'jam_selesai' => '17:00',
            'kuota' => 1,
            'tersedia' => false,
        ]);

        $appointment = Appointment::create([
            'id' => (string) Str::uuid(),
            'pasien_id' => $this->patient->id,
            'dokter_id' => $this->doctor->id,
            'slot_id' => $slot->id,
            'status' => 'aktif',
            'keluhan' => 'Keluhan operasional loket',
        ]);

        $responseIndex = $this->actingAs($this->admin)->get('/admin/janji');
        $responseIndex->assertStatus(200);
        $responseIndex->assertSee($this->patient->name);
        $responseIndex->assertSee($this->doctor->nama);

        $responseShow = $this->actingAs($this->admin)->get("/admin/janji/{$appointment->id}");
        $responseShow->assertStatus(200);
        $responseShow->assertSee('Detail Janji Temu Operasional Loket');
        $responseShow->assertSee('Keluhan operasional loket');
        // Pastikan tidak ada data sensitif rekam medis profil lengkap
        $responseShow->assertDontSee('Kondisi Kesehatan Lengkap');
    }

    public function test_admin_creates_doctor_records_atomic_audit_log(): void
    {
        $initialAuditCount = AuditLog::count();

        $response = $this->actingAs($this->admin)->post('/admin/dokter', [
            'nama' => 'dr. Amanda Wijaya, Sp.A',
            'spesialisasi' => 'Anak',
            'nomor_izin' => 'SIP-L08-AMANDA',
        ]);

        $response->assertRedirect(route('admin.doctors.index'));

        $doctorCreated = Doctor::where('nomor_izin', 'SIP-L08-AMANDA')->first();
        $this->assertNotNull($doctorCreated);

        // Periksa tepat satu entri audit log terbit
        $this->assertEquals($initialAuditCount + 1, AuditLog::count());

        $latestAudit = AuditLog::latest('created_at')->first();
        $this->assertEquals('TAMBAH_DOKTER', $latestAudit->aksi);
        $this->assertEquals('dokter', $latestAudit->objek);
        $this->assertEquals($doctorCreated->id, $latestAudit->objek_id);
        $this->assertEquals($this->admin->id, $latestAudit->user_id);

        $doctorCreated->delete();
    }

    public function test_admin_updates_doctor_requires_reason_and_records_audit(): void
    {
        // Validasi alasan wajib
        $responseNoReason = $this->actingAs($this->admin)->patch("/admin/dokter/{$this->doctor->id}", [
            'spesialisasi' => 'Penyakit Dalam Sub-Kardiologi',
        ]);
        $responseNoReason->assertSessionHasErrors(['alasan']);

        // Sukses bila ada alasan
        $response = $this->actingAs($this->admin)->patch("/admin/dokter/{$this->doctor->id}", [
            'spesialisasi' => 'Penyakit Dalam Sub-Kardiologi',
            'alasan' => 'Penambahan gelar subspesialis dokter',
        ]);

        $response->assertRedirect(route('admin.doctors.index'));

        $this->doctor->refresh();
        $this->assertEquals('Penyakit Dalam Sub-Kardiologi', $this->doctor->spesialisasi);

        $latestAudit = AuditLog::latest('created_at')->first();
        $this->assertEquals('UBAH_DOKTER', $latestAudit->aksi);
        $this->assertEquals('Penambahan gelar subspesialis dokter', $latestAudit->alasan);
    }

    public function test_admin_creates_slot_with_audit_and_rejects_overlap(): void
    {
        // 1. Buat slot pertama berhasil
        $response = $this->actingAs($this->admin)->post('/admin/slot', [
            'dokter_id' => $this->doctor->id,
            'tanggal' => WibClock::today(),
            'jam_mulai' => '17:00',
            'jam_selesai' => '17:30',
        ]);

        $response->assertRedirect(route('admin.slots.index'));

        $slot = Slot::where('dokter_id', $this->doctor->id)
            ->where('jam_mulai', '17:00')
            ->first();
        $this->assertNotNull($slot);

        // 2. Buat slot bertabrakan (overlap) ditolak
        $responseOverlap = $this->actingAs($this->admin)->post('/admin/slot', [
            'dokter_id' => $this->doctor->id,
            'tanggal' => WibClock::today(),
            'jam_mulai' => '17:15',
            'jam_selesai' => '17:45',
        ]);

        $responseOverlap->assertSessionHasErrors(['jam_mulai']);
        $this->assertDatabaseMissing('slot', [
            'dokter_id' => $this->doctor->id,
            'jam_mulai' => '17:15',
        ]);
    }
}
