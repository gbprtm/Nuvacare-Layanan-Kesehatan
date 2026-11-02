<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Foundation\Http\FormRequest;

class StoreDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'nama' => ['required_without:name', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'spesialisasi' => ['required_without:specialty', 'string', 'max:255'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'nomor_izin' => ['nullable', 'string', 'max:100'],
            'license_number' => ['nullable', 'string', 'max:100'],
            'aktif' => ['nullable', 'boolean'],
            'active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required_without' => 'Nama dokter wajib diisi.',
            'spesialisasi.required_without' => 'Spesialisasi dokter wajib diisi.',
        ];
    }
}
