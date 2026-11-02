<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Foundation\Http\FormRequest;

class BookAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isPatient();
    }

    public function rules(): array
    {
        return [
            'slot_id' => ['required', 'string', 'uuid', 'exists:slot,id'],
            'keluhan' => ['nullable', 'string', 'max:200'],
            'complaint' => ['nullable', 'string', 'max:200'],
            'nik' => ['prohibited'],
            'kk' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'slot_id.required' => 'Pilih slot praktik dokter yang tersedia.',
            'slot_id.exists' => 'Slot praktik yang dipilih tidak ditemukan.',
            'keluhan.max' => 'Keluhan singkat tidak boleh lebih dari 200 karakter.',
            'complaint.max' => 'Keluhan singkat tidak boleh lebih dari 200 karakter.',
            'nik.prohibited' => 'Bidang NIK tidak diperkenankan pada sistem ini.',
            'kk.prohibited' => 'Bidang KK tidak diperkenankan pada sistem ini.',
        ];
    }
}
