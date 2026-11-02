<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Foundation\Http\FormRequest;

class StoreSlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'dokter_id' => ['required_without:doctor_id', 'string', 'uuid', 'exists:dokter,id'],
            'doctor_id' => ['nullable', 'string', 'uuid', 'exists:dokter,id'],
            'tanggal' => ['required_without:date', 'date'],
            'date' => ['nullable', 'date'],
            'jam_mulai' => ['required_without:starts_at', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]$/'],
            'starts_at' => ['nullable', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]$/'],
            'jam_selesai' => ['required_without:ends_at', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]$/'],
            'ends_at' => ['nullable', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]$/'],
            'tersedia' => ['nullable', 'boolean'],
            'available' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'dokter_id.required_without' => 'Pilih dokter untuk jadwal slot praktik.',
            'dokter_id.exists' => 'Dokter yang dipilih tidak ditemukan.',
            'tanggal.required_without' => 'Tanggal praktik wajib diisi.',
            'jam_mulai.required_without' => 'Jam mulai praktik wajib diisi (format JJ:MM).',
            'jam_mulai.regex' => 'Format jam mulai tidak valid (contoh: 08:00).',
            'jam_selesai.required_without' => 'Jam selesai praktik wajib diisi (format JJ:MM).',
            'jam_selesai.regex' => 'Format jam selesai tidak valid (contoh: 08:30).',
        ];
    }
}
