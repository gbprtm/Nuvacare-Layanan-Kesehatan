<?php

namespace App\Services\Profile;

use App\Models\PatientProfile;
use App\Models\PatientReportedMedication;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProfileService
{
    /**
     * Dapatkan data profil dan daftar capture obat milik pasien.
     */
    public function getProfileData(User $user): array
    {
        $profile = PatientProfile::where('user_id', $user->id)->first();

        // Daftar capture obat (bersifat read-only / snapshot historis bagi pasien)
        $capturedMedications = PatientReportedMedication::where('pasien_id', $user->id)
            ->with('fornasCatalog')
            ->orderBy('created_at', 'desc')
            ->get();

        return [
            'profile' => $profile,
            'capturedMedications' => $capturedMedications,
            'isComplete' => $profile !== null && ! empty($profile->tanggal_lahir) && ! empty($profile->nomor_telepon),
        ];
    }

    /**
     * Perbarui data profil kesehatan mandiri pasien secara atomik.
     */
    public function updateProfile(User $user, array $validatedData): PatientProfile
    {
        return DB::transaction(function () use ($user, $validatedData) {
            $profile = PatientProfile::firstOrNew(['user_id' => $user->id]);

            if (! $profile->exists) {
                $profile->id = (string) Str::uuid();
            }

            $profile->nomor_telepon = $validatedData['phone_number'] ?? $profile->nomor_telepon;
            $profile->tanggal_lahir = $validatedData['birth_date'] ?? $profile->tanggal_lahir;
            if (isset($validatedData['gender'])) {
                $profile->jenis_kelamin = str_replace('-', '_', strtolower($validatedData['gender']));
            }
            $profile->golongan_darah = $validatedData['blood_group'] ?? $profile->golongan_darah;
            $profile->tinggi_badan = $validatedData['height_cm'] ?? $profile->tinggi_badan;
            $profile->berat_badan = $validatedData['weight_kg'] ?? $profile->berat_badan;
            $profile->kondisi_kesehatan = $validatedData['health_conditions'] ?? $profile->kondisi_kesehatan;
            $profile->riwayat_alergi = $validatedData['allergies'] ?? $profile->riwayat_alergi;
            $profile->kontak_darurat_nama = $validatedData['emergency_contact_name'] ?? $profile->kontak_darurat_nama;
            $profile->kontak_darurat_telepon = $validatedData['emergency_contact_phone'] ?? $profile->kontak_darurat_telepon;

            $profile->save();

            return $profile;
        });
    }

    /**
     * Hapus profil kesehatan mandiri pasien (tanpa menghapus akun pengguna atau data klinis).
     */
    public function destroyProfile(User $user): bool
    {
        return DB::transaction(function () use ($user) {
            $profile = PatientProfile::where('user_id', $user->id)->first();

            if ($profile) {
                $profile->delete();
            }

            return true;
        });
    }
}
