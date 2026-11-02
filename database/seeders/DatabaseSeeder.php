<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\Slot;
use App\Models\User;
use App\Support\WibClock;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Jalankan database seeder dengan data fiktif yang aman.
     */
    public function run(): void
    {
        // 1. Akun Admin Klinik Individual
        $adminPassword = config('app.admin_initial_password') ?: 'AdminKlinik2026!';
        User::firstOrCreate(
            ['email' => 'admin@klinik.local'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Staf Administrasi Klinik',
                'password_hash' => Hash::make($adminPassword),
                'role' => 'admin',
            ]
        );

        // 2. Akun Pasien Demo Fiktif
        $pasien = User::firstOrCreate(
            ['email' => 'pasien@klinik.local'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Budi Santoso (Demo Pasien)',
                'password_hash' => Hash::make('Pasien123!'),
                'role' => 'pasien',
            ]
        );

        // 3. Profil Pasien Fiktif (Tanpa NIK/KK nyata)
        $pasien->profile()->firstOrCreate(
            ['user_id' => $pasien->id],
            [
                'id' => (string) Str::uuid(),
                'nik' => null, // Tidak menggunakan NIK nyata
                'nomor_telepon' => '081200000001',
                'tanggal_lahir' => '1990-05-15',
                'jenis_kelamin' => 'laki_laki',
                'golongan_darah' => 'O',
                'tinggi_badan' => 170,
                'berat_badan' => 65,
                'kondisi_kesehatan' => 'Riwayat hipertensi ringan terkontrol',
                'riwayat_alergi' => 'Alergi penisilin',
                'kontak_darurat_nama' => 'Siti (Keluarga)',
                'kontak_darurat_telepon' => '081200000002',
            ]
        );

        // 4. Dokter Klinik Fiktif (Tanpa akun login)
        $dokter1 = Doctor::firstOrCreate(
            ['nomor_izin' => 'SIP.001/DU/2026'],
            [
                'id' => (string) Str::uuid(),
                'nama' => 'dr. Andika Pratama',
                'spesialisasi' => 'Dokter Umum',
                'aktif' => true,
            ]
        );

        $dokter2 = Doctor::firstOrCreate(
            ['nomor_izin' => 'SIP.002/SP/2026'],
            [
                'id' => (string) Str::uuid(),
                'nama' => 'dr. Citra Lestari, Sp.PD',
                'spesialisasi' => 'Spesialis Penyakit Dalam',
                'aktif' => true,
            ]
        );

        // 5. Slot Waktu Fiktif
        $today = WibClock::todayString();
        $tomorrow = WibClock::today()->addDay()->format('Y-m-d');

        $slots = [
            ['dokter' => $dokter1, 'tanggal' => $today, 'mulai' => '08:00', 'selesai' => '08:30'],
            ['dokter' => $dokter1, 'tanggal' => $today, 'mulai' => '08:30', 'selesai' => '09:00'],
            ['dokter' => $dokter1, 'tanggal' => $tomorrow, 'mulai' => '09:00', 'selesai' => '09:30'],
            ['dokter' => $dokter2, 'tanggal' => $today, 'mulai' => '10:00', 'selesai' => '10:30'],
            ['dokter' => $dokter2, 'tanggal' => $tomorrow, 'mulai' => '10:00', 'selesai' => '10:30'],
        ];

        foreach ($slots as $slotData) {
            Slot::firstOrCreate(
                [
                    'dokter_id' => $slotData['dokter']->id,
                    'tanggal' => $slotData['tanggal'],
                    'jam_mulai' => $slotData['mulai'],
                ],
                [
                    'id' => (string) Str::uuid(),
                    'jam_selesai' => $slotData['selesai'],
                    'kuota' => 1,
                    'tersedia' => true,
                ]
            );
        }
    }
}
