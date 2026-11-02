<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'nama' => ['nullable', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'spesialisasi' => ['nullable', 'string', 'max:255'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'nomor_izin' => ['nullable', 'string', 'max:100'],
            'license_number' => ['nullable', 'string', 'max:100'],
            'aktif' => ['nullable', 'boolean'],
            'active' => ['nullable', 'boolean'],
            'alasan' => ['required_without:reason', 'string', 'min:3', 'max:500'],
            'reason' => ['nullable', 'string', 'min:3', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'alasan.required_without' => 'Alasan perubahan data dokter wajib diisi untuk catatan audit.',
            'alasan.min' => 'Alasan perubahan minimal 3 karakter.',
            'reason.min' => 'Alasan perubahan minimal 3 karakter.',
        ];
    }
}
