<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Doctor;
use App\Models\Slot;
use App\Models\User;
use App\Policies\AuditLogPolicy;
use App\Services\Audit\AuditService;
use Exception;
use Illuminate\Support\Str;
use LogicException;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    protected AuditService $auditService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->auditService = app(AuditService::class);
    }

    public function test_audit_service_mencatat_mutasi_dan_log_secara_atomik_dalam_satu_transaksi(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin_audit_test@klinik.local'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Admin Penguji Audit',
                'role' => 'admin',
                'password_hash' => bcrypt('AdminRahasia123!'),
            ]
        );

        $this->actingAs($admin);

        $nomorIzin = 'STR-TEST-'.Str::random(6);
        $dokterBaru = $this->auditService->executeMutation(
            mutation: function () use ($nomorIzin) {
                return Doctor::create([
                    'id' => (string) Str::uuid(),
                    'nama' => 'dr. Budi Santoso, Sp.PD',
                    'spesialisasi' => 'Penyakit Dalam',
                    'nomor_izin' => $nomorIzin,
                    'aktif' => true,
                ]);
            },
            aksi: 'DOKTER_TAMBAH',
            objek: 'dokter',
            objekId: fn (Doctor $doc) => $doc->id,
            nilaiSebelum: null,
            nilaiSesudah: fn (Doctor $doc) => $doc->toArray(),
            alasan: 'Penambahan dokter spesialis baru untuk jadwal poli penyakit dalam',
            actor: $admin,
            ipAddress: '127.0.0.1'
        );

        $this->assertNotNull($dokterBaru);
        $this->assertDatabaseHas('dokter', [
            'id' => $dokterBaru->id,
            'nama' => 'dr. Budi Santoso, Sp.PD',
            'nomor_izin' => $nomorIzin,
        ]);

        $this->assertDatabaseHas('audit_log', [
            'user_id' => $admin->id,
            'aksi' => 'DOKTER_TAMBAH',
            'objek' => 'dokter',
            'objek_id' => $dokterBaru->id,
            'alasan' => 'Penambahan dokter spesialis baru untuk jadwal poli penyakit dalam',
            'ip_address' => '127.0.0.1',
        ]);
    }

    public function test_kegagalan_mutasi_membatalkan_seluruh_transaksi_rollback(): void
    {
        $admin = User::where('role', 'admin')->first();
        $nomorIzinTest = 'STR-GAGAL-'.Str::random(6);

        try {
            $this->auditService->executeMutation(
                mutation: function () use ($nomorIzinTest) {
                    Doctor::create([
                        'id' => (string) Str::uuid(),
                        'nama' => 'dr. Mutasi Batal',
                        'spesialisasi' => 'Umum',
                        'nomor_izin' => $nomorIzinTest,
                        'aktif' => true,
                    ]);

                    // Sengaja memicu kegagalan di dalam transaksi
                    throw new Exception('Simulasi kegagalan bisnis di tengah mutasi');
                },
                aksi: 'DOKTER_TAMBAH',
                objek: 'dokter',
                objekId: 'temp-id',
                actor: $admin
            );
        } catch (Exception $e) {
            $this->assertSame('Simulasi kegagalan bisnis di tengah mutasi', $e->getMessage());
        }

        // Pastikan dokter TIDAK tersimpan (rollback berhasil)
        $this->assertDatabaseMissing('dokter', [
            'nomor_izin' => $nomorIzinTest,
        ]);

        // Pastikan tidak ada audit log yang tersimpan saat rollback
        $this->assertDatabaseMissing('audit_log', [
            'aksi' => 'DOKTER_TAMBAH',
            'objek_id' => 'temp-id',
        ]);
    }

    public function test_kunci_rahasia_dan_sensitif_disensor_dari_payload_audit(): void
    {
        $payloadRaw = [
            'nama' => 'Pasien Rahasia',
            'password' => 'secret123',
            'password_hash' => '$2y$10$abcdefghijklmn',
            'token' => 'bearer-12345',
            'remember_token' => 'rem-999',
            'kebiasaan' => ['merokok' => false],
            'detail' => [
                'alamat' => 'Jl. Merdeka',
                'secret' => 'kunci-rahasia-terselubung',
            ],
        ];

        $cleanPayload = $this->auditService->sanitizePayload($payloadRaw);

        $this->assertSame('[REDACTED]', $cleanPayload['password']);
        $this->assertSame('[REDACTED]', $cleanPayload['password_hash']);
        $this->assertSame('[REDACTED]', $cleanPayload['token']);
        $this->assertSame('[REDACTED]', $cleanPayload['remember_token']);
        $this->assertSame('[REDACTED]', $cleanPayload['kebiasaan']);
        $this->assertSame('[REDACTED]', $cleanPayload['detail']['secret']);
        $this->assertSame('Pasien Rahasia', $cleanPayload['nama']);
        $this->assertSame('Jl. Merdeka', $cleanPayload['detail']['alamat']);
    }

    public function test_model_audit_log_menolak_update_dan_delete_karena_append_only(): void
    {
        $log = AuditLog::create([
            'aksi' => 'UJI_APPEND_ONLY',
            'objek' => 'uji',
            'objek_id' => (string) Str::uuid(),
            'alasan' => 'Catatan awal',
        ]);

        // Coba perbarui via instance model
        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('AuditLog bersifat append-only dan tidak dapat diubah.');
        $log->update(['alasan' => 'Mencoba mengubah isi catatan audit']);
    }

    public function test_model_audit_log_menolak_delete(): void
    {
        $log = AuditLog::create([
            'aksi' => 'UJI_HAPUS',
            'objek' => 'uji',
            'objek_id' => (string) Str::uuid(),
        ]);

        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('AuditLog bersifat append-only dan tidak dapat dihapus.');
        $log->delete();
    }

    public function test_admin_dapat_mengakses_daftar_audit_log(): void
    {
        $admin = User::where('role', 'admin')->first();

        // Siapkan setidaknya satu entri log
        AuditLog::create([
            'user_id' => $admin->id,
            'aksi' => 'UJI_AKSES_ADMIN',
            'objek' => 'sistem',
            'objek_id' => 'SYS-01',
            'alasan' => 'Verifikasi hak akses admin pada log audit',
        ]);

        $response = $this->actingAs($admin)->get('/admin/audit-log');

        $response->assertStatus(200);
        $response->assertSee('Audit Log Operasional');
        $response->assertSee('UJI_AKSES_ADMIN');
        $response->assertSee('SYS-01');
    }

    public function test_admin_dapat_menyaring_audit_log_berdasarkan_aksi(): void
    {
        $admin = User::where('role', 'admin')->first();
        $uniqueActionA = 'AKSI_A_'.Str::random(4);
        $uniqueActionB = 'AKSI_B_'.Str::random(4);

        AuditLog::create([
            'user_id' => $admin->id,
            'aksi' => $uniqueActionA,
            'objek' => 'tes_a',
            'objek_id' => 'ID-A-'.Str::random(4),
        ]);

        AuditLog::create([
            'user_id' => $admin->id,
            'aksi' => $uniqueActionB,
            'objek' => 'tes_b',
            'objek_id' => 'ID-B-UNIQUE',
        ]);

        $response = $this->actingAs($admin)->get('/admin/audit-log?action='.$uniqueActionA);

        $response->assertStatus(200);
        $response->assertSee($uniqueActionA);
        // Baris data dengan ID-B-UNIQUE tidak boleh ada di tabel saringan
        $response->assertDontSee('ID-B-UNIQUE');
    }

    public function test_pasien_ditolak_mengakses_audit_log_admin(): void
    {
        $pasien = User::where('role', 'pasien')->first();

        $response = $this->actingAs($pasien)->get('/admin/audit-log');

        $response->assertStatus(403);
    }

    public function test_tamu_dialihkan_ke_halaman_masuk(): void
    {
        $response = $this->get('/admin/audit-log');

        $response->assertRedirect('/masuk');
    }

    public function test_tidak_ada_rute_mutasi_post_put_delete_pada_audit_log(): void
    {
        $admin = User::where('role', 'admin')->first();

        $postResponse = $this->actingAs($admin)->post('/admin/audit-log', ['aksi' => 'ILEGAL']);
        $this->assertContains($postResponse->status(), [404, 405]);

        $deleteResponse = $this->actingAs($admin)->delete('/admin/audit-log/some-uuid');
        $this->assertContains($deleteResponse->status(), [404, 405]);
    }

    public function test_policy_mengizinkan_pasien_hanya_melihat_log_janjinya_sendiri(): void
    {
        $policy = new AuditLogPolicy;
        $pasienA = User::where('role', 'pasien')->first();
        $pasienB = User::firstOrCreate(
            ['email' => 'pasien_b_test@klinik.local'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Pasien B',
                'role' => 'pasien',
                'password_hash' => bcrypt('PasienB123!'),
            ]
        );

        $dokter = Doctor::first() ?? Doctor::create([
            'id' => (string) Str::uuid(),
            'nama' => 'dr. Dokter Umum',
            'spesialisasi' => 'Umum',
            'nomor_izin' => 'STR-POL-'.Str::random(5),
            'aktif' => true,
        ]);

        $slot = Slot::create([
            'id' => (string) Str::uuid(),
            'dokter_id' => $dokter->id,
            'tanggal' => now()->addDays(rand(10, 50))->toDateString(),
            'jam_mulai' => '08:00',
            'jam_selesai' => '12:00',
            'kuota' => 10,
            'tersedia' => true,
        ]);

        $janjiPasienA = Appointment::create([
            'id' => (string) Str::uuid(),
            'pasien_id' => $pasienA->id,
            'dokter_id' => $dokter->id,
            'slot_id' => $slot->id,
            'status' => 'aktif',
            'keluhan' => 'Pemeriksaan tensi',
        ]);

        $logJanjiA = AuditLog::create([
            'aksi' => 'JANJI_DIJADWALKAN',
            'objek' => 'janji',
            'objek_id' => $janjiPasienA->id,
        ]);

        // Pasien A boleh melihat log janjinya sendiri
        $this->assertTrue($policy->view($pasienA, $logJanjiA));

        // Pasien B TIDAK boleh melihat log janji milik Pasien A
        $this->assertFalse($policy->view($pasienB, $logJanjiA));

        // Pasien A TIDAK boleh melihat log objek non-janji (misal: dokter)
        $logDokter = AuditLog::create([
            'aksi' => 'DOKTER_UBAH',
            'objek' => 'dokter',
            'objek_id' => $dokter->id,
        ]);
        $this->assertFalse($policy->view($pasienA, $logDokter));
    }
}
