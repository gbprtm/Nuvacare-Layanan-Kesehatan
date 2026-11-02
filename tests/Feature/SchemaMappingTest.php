<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\HabitLog;
use App\Models\Medication;
use App\Models\Notification;
use App\Models\PatientProfile;
use App\Models\PatientReportedMedication;
use App\Models\Prescription;
use App\Models\QueueTicket;
use App\Models\RescheduleProposal;
use App\Models\Slot;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class SchemaMappingTest extends TestCase
{
    /**
     * Uji pemetaan nama tabel Eloquent ke skema PostgreSQL.
     */
    public function test_pemetaan_nama_tabel_eloquent(): void
    {
        $this->assertSame('users', (new User)->getTable());
        $this->assertSame('dokter', (new Doctor)->getTable());
        $this->assertSame('slot', (new Slot)->getTable());
        $this->assertSame('janji', (new Appointment)->getTable());
        $this->assertSame('usulan_perubahan', (new RescheduleProposal)->getTable());
        $this->assertSame('notifikasi', (new Notification)->getTable());
        $this->assertSame('tiket_antrian', (new QueueTicket)->getTable());
        $this->assertSame('profil', (new PatientProfile)->getTable());
        $this->assertSame('catatan_kebiasaan', (new HabitLog)->getTable());
        $this->assertSame('resep', (new Prescription)->getTable());
        $this->assertSame('obat', (new Medication)->getTable());
        $this->assertSame('obat_pasien', (new PatientReportedMedication)->getTable());
    }

    /**
     * Uji bahwa seluruh model menggunakan primary key tipe string/UUID non-incrementing.
     */
    public function test_seluruh_model_menggunakan_uuid_non_incrementing(): void
    {
        $models = [
            new User,
            new Doctor,
            new Slot,
            new Appointment,
            new RescheduleProposal,
            new Notification,
            new QueueTicket,
            new PatientProfile,
            new HabitLog,
            new Prescription,
            new Medication,
            new PatientReportedMedication,
        ];

        foreach ($models as $model) {
            $this->assertFalse(
                $model->getIncrementing(),
                get_class($model).' harus non-incrementing (UUID).'
            );
            $this->assertSame(
                'string',
                $model->getKeyType(),
                get_class($model).' keyType harus string.'
            );
        }
    }

    /**
     * Uji autentikasi User memetakan kata sandi ke kolom password_hash.
     */
    public function test_user_memetakan_password_ke_kolom_password_hash(): void
    {
        $user = new User([
            'id' => (string) Str::uuid(),
            'name' => 'Pasien Uji',
            'email' => 'pasien.uji@example.com',
            'password_hash' => Hash::make('Rahasia123!'),
            'role' => 'pasien',
        ]);

        $this->assertSame($user->password_hash, $user->getAuthPassword());
        $this->assertTrue(Hash::check('Rahasia123!', $user->getAuthPassword()));
        $this->assertTrue($user->isPasien());
        $this->assertFalse($user->isAdmin());

        // Verifikasi password_hash disembunyikan saat diserialkan ke array/JSON
        $serialized = $user->toArray();
        $this->assertArrayNotHasKey('password_hash', $serialized);
        $this->assertArrayNotHasKey('password', $serialized);
    }

    /**
     * Uji konfigurasi nama tabel sesi Laravel terpisah dari sesi legacy Next.js.
     */
    public function test_tabel_sesi_laravel_terpisah(): void
    {
        $this->assertSame('laravel_sessions', config('session.table'));
    }

    /**
     * Uji eksekusi seeder menghasilkan data fiktif terstruktur tanpa NIK/KK.
     */
    public function test_seeder_membuat_admin_dan_data_fiktif(): void
    {
        // Jalankan seeder
        $this->seed(DatabaseSeeder::class);

        // Verifikasi admin dibuat
        $admin = User::where('email', 'admin@klinik.local')->first();
        $this->assertNotNull($admin);
        $this->assertTrue($admin->isAdmin());

        // Verifikasi pasien demo dibuat
        $pasien = User::where('email', 'pasien@klinik.local')->first();
        $this->assertNotNull($pasien);
        $this->assertTrue($pasien->isPasien());

        // Verifikasi profil pasien tidak memiliki NIK nyata
        $profil = $pasien->profile;
        $this->assertNotNull($profil);
        $this->assertNull($profil->nik, 'NIK demo pasien harus null/fiktif.');

        // Verifikasi dokter fiktif dibuat
        $this->assertGreaterThanOrEqual(2, Doctor::count());

        // Verifikasi slot fiktif dibuat
        $this->assertGreaterThanOrEqual(4, Slot::count());
    }
}
