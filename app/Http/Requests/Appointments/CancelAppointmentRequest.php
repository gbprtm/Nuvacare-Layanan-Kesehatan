<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Foundation\Http\FormRequest;

class CancelAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'alasan' => ['required_without:reason', 'string', 'min:3', 'max:500'],
            'reason' => ['nullable', 'string', 'min:3', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'alasan.required_without' => 'Alasan pembatalan janji temu wajib diisi.',
            'alasan.min' => 'Alasan pembatalan minimal 3 karakter.',
            'reason.min' => 'Alasan pembatalan minimal 3 karakter.',
        ];
    }
}
