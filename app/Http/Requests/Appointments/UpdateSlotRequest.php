<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'jam_mulai' => ['nullable', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]$/'],
            'starts_at' => ['nullable', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]$/'],
            'jam_selesai' => ['nullable', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]$/'],
            'ends_at' => ['nullable', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]$/'],
            'tersedia' => ['nullable', 'boolean'],
            'available' => ['nullable', 'boolean'],
            'alasan' => ['required_without:reason', 'string', 'min:3', 'max:500'],
            'reason' => ['nullable', 'string', 'min:3', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'alasan.required_without' => 'Alasan perubahan slot wajib diisi untuk catatan audit.',
            'alasan.min' => 'Alasan perubahan minimal 3 karakter.',
            'reason.min' => 'Alasan perubahan minimal 3 karakter.',
            'jam_mulai.regex' => 'Format jam mulai tidak valid (contoh: 08:00).',
            'jam_selesai.regex' => 'Format jam selesai tidak valid (contoh: 08:30).',
        ];
    }
}
