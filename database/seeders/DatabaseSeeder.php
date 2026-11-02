<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Polyclinic;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@klinik.local'],
            [
                'name' => 'Admin Klinik',
                'password' => Hash::make('AdminKlinik2026!'),
                'role' => 'admin',
                'phone_number' => '081122334455',
                'birth_date' => '1985-01-01',
                'address' => 'Klinik Sehat',
            ]
        );

        $pasien1 = User::firstOrCreate(
            ['email' => 'pasien1@klinik.local'],
            [
                'name' => 'Budi Santoso',
                'password' => Hash::make('PasienKlinik2026!'),
                'role' => 'pasien',
                'phone_number' => '081234567890',
                'birth_date' => '1985-05-15',
                'address' => 'Jl. Mawar No. 12, Jakarta',
            ]
        );

        User::firstOrCreate(
            ['email' => 'pasien2@klinik.local'],
            [
                'name' => 'Siti Rahma',
                'password' => Hash::make('PasienKlinik2026!'),
                'role' => 'pasien',
                'phone_number' => '081398765432',
                'birth_date' => '1990-11-20',
                'address' => 'Jl. Melati No. 45, Jakarta',
            ]
        );

        $poliUmum = Polyclinic::firstOrCreate(
            ['name' => 'Poli Umum'],
            ['description' => 'Layanan pemeriksaan kesehatan umum dan keluhan harian.']
        );

        $poliGigi = Polyclinic::firstOrCreate(
            ['name' => 'Poli Gigi'],
            ['description' => 'Layanan perawatan kesehatan gigi dan mulut profesional.']
        );

        $poliPenyakitDalam = Polyclinic::firstOrCreate(
            ['name' => 'Poli Penyakit Dalam'],
            ['description' => 'Layanan konsultasi spesialis dan pengobatan organ dalam.']
        );

        $dokter1 = Doctor::firstOrCreate(
            ['name' => 'dr. Andi Pratama', 'polyclinic_id' => $poliUmum->id],
            ['is_active' => true]
        );

        Doctor::firstOrCreate(
            ['name' => 'dr. Maya Indah', 'polyclinic_id' => $poliUmum->id],
            ['is_active' => true]
        );

        Doctor::firstOrCreate(
            ['name' => 'drg. Ahmad Fauzi', 'polyclinic_id' => $poliGigi->id],
            ['is_active' => true]
        );

        $dokter4 = Doctor::firstOrCreate(
            ['name' => 'dr. Hendra Wijaya, Sp.PD', 'polyclinic_id' => $poliPenyakitDalam->id],
            ['is_active' => true]
        );

        Doctor::firstOrCreate(
            ['name' => 'dr. Ratna Dewi, Sp.PD', 'polyclinic_id' => $poliPenyakitDalam->id],
            ['is_active' => true]
        );

        Appointment::firstOrCreate(
            [
                'user_id' => $pasien1->id,
                'polyclinic_id' => $poliUmum->id,
                'doctor_id' => $dokter1->id,
                'appointment_date' => now()->addDays(2)->format('Y-m-d'),
                'type' => 'janji_baru',
            ],
            [
                'status' => 'terjadwal',
                'complaint' => 'Pusing dan demam sejak kemarin malam.',
            ]
        );

        Appointment::firstOrCreate(
            [
                'user_id' => $pasien1->id,
                'polyclinic_id' => $poliPenyakitDalam->id,
                'doctor_id' => $dokter4->id,
                'appointment_date' => now()->subDays(7)->format('Y-m-d'),
                'type' => 'janji_baru',
            ],
            [
                'status' => 'selesai',
                'complaint' => 'Nyeri lambung berkepanjangan.',
                'doctor_notes' => 'Pasien didiagnosis dispepsia fungsional. Disarankan menjaga pola makan teratur dan menghindari makanan pedas/asam.',
            ]
        );

        Appointment::firstOrCreate(
            [
                'user_id' => $pasien1->id,
                'polyclinic_id' => $poliPenyakitDalam->id,
                'doctor_id' => $dokter4->id,
                'appointment_date' => now()->addDays(14)->format('Y-m-d'),
                'type' => 'kontrol_rutin',
            ],
            [
                'status' => 'terjadwal',
                'complaint' => 'Kontrol evaluasi pengobatan lambung.',
            ]
        );
    }
}
