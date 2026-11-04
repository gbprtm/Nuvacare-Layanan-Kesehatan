<?php

namespace App\Services;

use App\Models\Appointment;
use Illuminate\Support\Facades\Http;
use Throwable;

class WhatsAppNotificationService
{
    public function notifyScheduleUpdate(Appointment $appointment, string $reasonType = 'update'): array
    {
        $appointment->loadMissing(['user', 'polyclinic', 'doctor']);

        $rawPhone = (string) ($appointment->user?->phone_number ?? '');
        $normalizedPhone = $this->normalizePhone($rawPhone);
        $message = $this->buildMessage($appointment, $reasonType);

        $whatsappUrl = $normalizedPhone !== ''
            ? 'https://wa.me/'.$normalizedPhone.'?text='.rawurlencode($message)
            : null;

        $sentViaGateway = $this->dispatchGateway($normalizedPhone, $message);

        return [
            'phone' => $normalizedPhone ?: null,
            'message' => $message,
            'sent' => $sentViaGateway,
            'whatsapp_url' => $whatsappUrl,
        ];
    }

    public function sendOtp(string $phone, string $otpCode, string $purpose = 'register'): array
    {
        $normalizedPhone = $this->normalizePhone($phone);
        $contextLabel = $purpose === 'verify_phone'
            ? 'verifikasi nomor WhatsApp akun Klinik Sehat'
            : 'pendaftaran akun pasien Klinik Sehat';

        $message = "Kode OTP {$contextLabel} Anda adalah: *{$otpCode}*. Kode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapa pun.";

        $whatsappUrl = $normalizedPhone !== ''
            ? 'https://wa.me/'.$normalizedPhone.'?text='.rawurlencode($message)
            : null;

        $sentViaGateway = $this->dispatchGateway($normalizedPhone, $message);

        return [
            'phone' => $normalizedPhone ?: null,
            'message' => $message,
            'sent' => $sentViaGateway,
            'whatsapp_url' => $whatsappUrl,
        ];
    }

    private function dispatchGateway(string $normalizedPhone, string $message): bool
    {
        $gatewayUrl = config('services.whatsapp.url');
        $gatewayToken = config('services.whatsapp.token');

        if ($normalizedPhone === '' || empty($gatewayUrl) || empty($gatewayToken)) {
            return false;
        }

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'Authorization' => $gatewayToken,
                ])
                ->post($gatewayUrl, [
                    'target' => $normalizedPhone,
                    'phone' => $normalizedPhone,
                    'message' => $message,
                ]);

            return $response->successful();
        } catch (Throwable) {
            return false;
        }
    }

    public function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if ($digits === '') {
            return '';
        }

        if (str_starts_with($digits, '0')) {
            return '62'.substr($digits, 1);
        }

        if (str_starts_with($digits, '8')) {
            return '62'.$digits;
        }

        return $digits;
    }

    private function buildMessage(Appointment $appointment, string $reasonType): string
    {
        $patientName = $appointment->user?->name ?? 'Pasien';
        $poliName = $appointment->polyclinic?->name ?? 'Poliklinik';
        $doctorName = $appointment->doctor?->name ?? 'Dokter';
        $dateFormatted = $appointment->appointment_date?->format('Y-m-d') ?? '-';
        $timeFormatted = $appointment->appointment_time ?? '09:00';
        $notes = trim((string) ($appointment->doctor_notes ?? ''));

        if ($appointment->status === 'dibatalkan' || $reasonType === 'cancelled') {
            $text = "Halo {$patientName}, informasi dari Klinik Sehat: Janji temu Anda di {$poliName} bersama {$doctorName} pada tanggal {$dateFormatted} pukul {$timeFormatted} WIB terpaksa dibatalkan karena kendala jadwal rumah sakit.";
            if ($notes !== '') {
                $text .= " Catatan klinik: {$notes}";
            }
            $text .= ' Silakan memilih jadwal atau dokter pengganti melalui website Klinik Sehat.';

            return $text;
        }

        if ($reasonType === 'rescheduled') {
            $text = "Halo {$patientName}, informasi perubahan jadwal dari Klinik Sehat: Janji temu Anda di {$poliName} telah diperbarui menjadi tanggal {$dateFormatted} pukul {$timeFormatted} WIB bersama {$doctorName}.";
            if ($notes !== '') {
                $text .= " Catatan klinik: {$notes}";
            }

            return $text;
        }

        $text = "Halo {$patientName}, informasi janji temu Anda di Klinik Sehat ({$poliName} - {$doctorName}) pada {$dateFormatted} pukul {$timeFormatted} WIB berstatus: {$appointment->status}.";
        if ($notes !== '') {
            $text .= " Catatan: {$notes}";
        }

        return $text;
    }
}
