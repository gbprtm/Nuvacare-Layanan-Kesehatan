<?php

namespace App\Http\Requests\Profile;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Tentukan apakah pengguna diotorisasi untuk membuat permintaan ini.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === 'pasien';
    }

    /**
     * Dapatkan aturan validasi yang berlaku untuk permintaan ini.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'phone_number' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date', 'before_or_equal:today'],
            'gender' => ['nullable', 'in:laki-laki,perempuan,laki_laki'],
            'blood_group' => ['nullable', 'in:A,B,AB,O'],
            'height_cm' => ['nullable', 'integer', 'min:30', 'max:250'],
            'weight_kg' => ['nullable', 'integer', 'min:2', 'max:300'],
            'health_conditions' => ['nullable', 'string', 'max:1000'],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            // Penegakan keamanan: field NIK/KK dan role ditiadakan by design
            'nik' => ['prohibited'],
            'kk' => ['prohibited'],
            'role' => ['prohibited'],
        ];
    }

    /**
     * Pesan kustom untuk validasi bahasa Indonesia.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'birth_date.before_or_equal' => 'Tanggal lahir tidak boleh melebihi hari ini.',
            'gender.in' => 'Pilihan jenis kelamin harus laki-laki atau perempuan.',
            'blood_group.in' => 'Golongan darah harus salah satu dari: A, B, AB, atau O.',
            'height_cm.integer' => 'Tinggi badan harus berupa angka dalam centimeter (cm).',
            'height_cm.min' => 'Tinggi badan minimal adalah 30 cm.',
            'height_cm.max' => 'Tinggi badan maksimal adalah 250 cm.',
            'weight_kg.integer' => 'Berat badan harus berupa angka dalam kilogram (kg).',
            'weight_kg.min' => 'Berat badan minimal adalah 2 kg.',
            'weight_kg.max' => 'Berat badan maksimal adalah 300 kg.',
            'nik.prohibited' => 'Sistem tidak mengelola NIK.',
            'kk.prohibited' => 'Sistem tidak mengelola KK.',
            'role.prohibited' => 'Peran akun tidak dapat diubah.',
        ];
    }
}
