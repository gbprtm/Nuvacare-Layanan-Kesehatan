<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CancellationRequest;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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
        $contextLabel = match ($purpose) {
            'verify_phone' => 'verifikasi nomor WhatsApp akun Nuvacare',
            'reset_password' => 'pemulihan kata sandi akun Nuvacare',
            default => 'pendaftaran akun pasien Nuvacare',
        };

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

    public function notifyAdminsNewRequest(Doctor $doctor, iterable $requests, ?string $batchId = null): void
    {
        $items = collect($requests)->values();
        if ($items->isEmpty()) {
            return;
        }

        try {
            $doctor->loadMissing('polyclinic');
            $doctorName = $doctor->name ?? 'Dokter';
            $poliName = $doctor->polyclinic?->name ?? 'Poliklinik';
            $count = $items->count();
            $first = $items->first();

            if ($first instanceof CancellationRequest) {
                $first->loadMissing('appointment');
                $reasonLabel = $this->formatReasonCategory($first->reason_category);
                $reasonDetail = trim((string) ($first->reason ?? ''));
                $reasonSuffix = $reasonDetail !== '' ? " ({$reasonDetail})" : '';

                if ($count === 1) {
                    $dateFormatted = $first->appointment?->appointment_date?->format('Y-m-d') ?? '-';
                    $timeFormatted = $first->appointment?->appointment_time ?? '-';
                    $dueFormatted = $first->due_at?->format('Y-m-d H:i') ?? '-';
                    $message = "Notifikasi Nuvacare: {$doctorName} ({$poliName}) mengajukan pembatalan janji temu tanggal {$dateFormatted} pukul {$timeFormatted} WIB. Alasan: {$reasonLabel}{$reasonSuffix}. Batas SLA keputusan: {$dueFormatted} WIB.";
                } else {
                    $earliestDue = $items->pluck('due_at')->filter()->sort()->first();
                    $dueFormatted = $earliestDue?->format('Y-m-d H:i') ?? '-';
                    $batchText = $batchId !== null && $batchId !== '' ? " (Batch: {$batchId})" : '';
                    $message = "Notifikasi Nuvacare: {$doctorName} ({$poliName}) mengajukan pembatalan untuk {$count} janji temu{$batchText}. Alasan: {$reasonLabel}{$reasonSuffix}. Batas SLA keputusan terdekat: {$dueFormatted} WIB.";
                }
            } else {
                $batchText = $batchId !== null && $batchId !== '' ? " (Batch: {$batchId})" : '';
                $message = "Notifikasi Nuvacare: {$doctorName} ({$poliName}) mengajukan pembatalan untuk {$count} janji temu{$batchText}. Silakan tinjau pada portal staf.";
            }

            $this->sendToActiveAdmins($message);
        } catch (Throwable $e) {
            Log::warning('Failed to build/send new cancellation request notification to admins', [
                'doctor_id' => $doctor->id ?? null,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function notifyAdminsSlaOverdue(CancellationRequest $requestRecord): void
    {
        try {
            $requestRecord->loadMissing(['doctor', 'appointment.user']);

            $doctorName = $requestRecord->doctor?->name ?? 'Dokter';
            $patientName = $requestRecord->appointment?->user?->name ?? 'Pasien';
            $dateFormatted = $requestRecord->appointment?->appointment_date?->format('Y-m-d') ?? '-';
            $timeFormatted = $requestRecord->appointment?->appointment_time ?? '-';
            $dueFormatted = $requestRecord->due_at?->format('Y-m-d H:i') ?? '-';

            $message = "Pengingat SLA Nuvacare: Pengajuan pembatalan #{$requestRecord->id} dari {$doctorName} untuk janji temu {$patientName} ({$dateFormatted} pukul {$timeFormatted} WIB) telah melewati batas SLA ({$dueFormatted} WIB). Mohon segera ditindaklanjuti oleh admin.";

            $this->sendToActiveAdmins($message);
        } catch (Throwable $e) {
            Log::warning('Failed to send SLA overdue notification to admins', [
                'cancellation_request_id' => $requestRecord->id ?? null,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function notifyDoctorDecision(CancellationRequest $requestRecord, string $decision, ?Doctor $newDoctor = null): void
    {
        try {
            $requestRecord->loadMissing(['doctor.user', 'appointment.user', 'appointment.polyclinic', 'appointment.doctor']);

            $appointment = $requestRecord->appointment;
            $doctor = $requestRecord->doctor;
            $doctorName = $doctor?->name ?? 'Dokter';
            $patientName = $appointment?->user?->name ?? 'Pasien';
            $dateFormatted = $appointment?->appointment_date?->format('Y-m-d') ?? '-';
            $timeFormatted = $appointment?->appointment_time ?? '-';
            $adminNotes = trim((string) ($requestRecord->admin_note ?? ''));

            $doctorMessage = match ($decision) {
                CancellationRequest::STATUS_APPROVED => "Informasi Nuvacare: Halo {$doctorName}, pengajuan pembatalan #{$requestRecord->id} untuk janji temu {$patientName} ({$dateFormatted} pukul {$timeFormatted} WIB) telah disetujui admin.",
                CancellationRequest::STATUS_RESCHEDULED => sprintf(
                    'Informasi Nuvacare: Halo %s, pengajuan pembatalan #%s untuk janji temu %s telah ditindaklanjuti admin dengan penjadwalan ulang menjadi %s pukul %s WIB bersama %s.',
                    $doctorName,
                    (string) $requestRecord->id,
                    $patientName,
                    $dateFormatted,
                    $timeFormatted,
                    $newDoctor?->name ?? $appointment?->doctor?->name ?? $doctorName,
                ),
                CancellationRequest::STATUS_REJECTED => "Informasi Nuvacare: Halo {$doctorName}, pengajuan pembatalan #{$requestRecord->id} untuk janji temu {$patientName} ({$dateFormatted} pukul {$timeFormatted} WIB) ditolak admin dan janji temu tetap terjadwal.",
                default => "Informasi Nuvacare: Halo {$doctorName}, status pengajuan pembatalan #{$requestRecord->id} untuk janji temu {$patientName} ({$dateFormatted} pukul {$timeFormatted} WIB) diperbarui menjadi {$decision}.",
            };

            if ($adminNotes !== '') {
                $doctorMessage .= " Catatan admin: {$adminNotes}";
            }

            $this->sendToPhone($doctor?->user?->phone_number, $doctorMessage);

            if ($newDoctor !== null && (int) $newDoctor->id !== (int) $requestRecord->doctor_id) {
                $newDoctor->loadMissing('user');
                $poliName = $appointment?->polyclinic?->name ?? 'Poliklinik';
                $replacementMessage = "Informasi Nuvacare: Halo {$newDoctor->name}, janji temu pasien {$patientName} di {$poliName} pada tanggal {$dateFormatted} pukul {$timeFormatted} WIB telah dijadwalkan ulang kepada Anda sebagai dokter pengganti.";

                $this->sendToPhone($newDoctor->user?->phone_number, $replacementMessage);
            }
        } catch (Throwable $e) {
            Log::warning('Failed to send doctor decision notification', [
                'cancellation_request_id' => $requestRecord->id ?? null,
                'decision' => $decision,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function notifyRequestVoided(CancellationRequest $requestRecord, Appointment $appointment): void
    {
        try {
            $requestRecord->loadMissing('doctor.user');
            $appointment->loadMissing('user');

            $doctorName = $requestRecord->doctor?->name ?? 'Dokter';
            $patientName = $appointment->user?->name ?? 'Pasien';
            $dateFormatted = $appointment->appointment_date?->format('Y-m-d') ?? '-';
            $timeFormatted = $appointment->appointment_time ?? '-';

            $message = "Informasi Nuvacare: Halo {$doctorName}, pengajuan pembatalan #{$requestRecord->id} untuk janji temu {$patientName} ({$dateFormatted} pukul {$timeFormatted} WIB) berstatus gugur karena janji temu telah diperbarui (status: {$appointment->status}).";

            $this->sendToPhone($requestRecord->doctor?->user?->phone_number, $message);
        } catch (Throwable $e) {
            Log::warning('Failed to send request voided notification', [
                'cancellation_request_id' => $requestRecord->id ?? null,
                'appointment_id' => $appointment->id ?? null,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function notifyRequestExpired(CancellationRequest $requestRecord): void
    {
        try {
            $requestRecord->loadMissing(['doctor.user', 'appointment.user']);

            $doctorName = $requestRecord->doctor?->name ?? 'Dokter';
            $patientName = $requestRecord->appointment?->user?->name ?? 'Pasien';
            $dateFormatted = $requestRecord->appointment?->appointment_date?->format('Y-m-d') ?? '-';
            $timeFormatted = $requestRecord->appointment?->appointment_time ?? '-';

            $doctorMessage = "Informasi Nuvacare: Halo {$doctorName}, pengajuan pembatalan #{$requestRecord->id} untuk janji temu {$patientName} ({$dateFormatted} pukul {$timeFormatted} WIB) berstatus kedaluwarsa karena waktu janji temu telah terlewati.";
            $this->sendToPhone($requestRecord->doctor?->user?->phone_number, $doctorMessage);

            $adminMessage = "Informasi Nuvacare: Pengajuan pembatalan #{$requestRecord->id} dari {$doctorName} untuk janji temu {$patientName} ({$dateFormatted} pukul {$timeFormatted} WIB) otomatis berstatus kedaluwarsa karena waktu janji temu telah terlewati.";
            $this->sendToActiveAdmins($adminMessage);
        } catch (Throwable $e) {
            Log::warning('Failed to send request expired notification', [
                'cancellation_request_id' => $requestRecord->id ?? null,
                'message' => $e->getMessage(),
            ]);
        }
    }

    private function sendToPhone(?string $rawPhone, string $message): bool
    {
        $normalizedPhone = $this->normalizePhone((string) ($rawPhone ?? ''));
        if ($normalizedPhone === '') {
            return false;
        }

        return $this->dispatchGateway($normalizedPhone, $message);
    }

    private function sendToActiveAdmins(string $message): void
    {
        try {
            $admins = User::query()
                ->where('role', 'admin')
                ->whereNull('disabled_at')
                ->whereNotNull('phone_number')
                ->where('phone_number', '!=', '')
                ->get(['id', 'phone_number']);

            foreach ($admins as $admin) {
                $this->sendToPhone($admin->phone_number, $message);
            }
        } catch (Throwable $e) {
            Log::warning('Failed to dispatch WhatsApp notification to active admins', [
                'message' => $e->getMessage(),
            ]);
        }
    }

    private function formatReasonCategory(?string $category): string
    {
        return match ($category) {
            'cuti_mendadak' => 'Cuti mendadak',
            'sakit' => 'Sakit',
            'tugas_darurat' => 'Tugas darurat',
            'bentrok_jadwal' => 'Bentrok jadwal',
            'lainnya' => 'Lainnya',
            default => $category ?: '-',
        };
    }

    private function dispatchGateway(string $normalizedPhone, string $message): bool
    {
        $gatewayUrl = config('services.whatsapp.url');
        $gatewayToken = config('services.whatsapp.token');

        if ($normalizedPhone === '' || empty($gatewayUrl) || empty($gatewayToken)) {
            return false;
        }

        try {
            $response = Http::asForm()
                ->timeout(15)
                ->withHeaders([
                    'Authorization' => $gatewayToken,
                ])
                ->post($gatewayUrl, [
                    'target' => $normalizedPhone,
                    'message' => $message,
                    'countryCode' => '0',
                ]);

            if (! $response->successful()) {
                Log::warning('WhatsApp Gateway HTTP failure', [
                    'status' => $response->status(),
                    'phone' => $normalizedPhone,
                ]);

                return false;
            }

            $data = $response->json();
            if (is_array($data) && array_key_exists('status', $data) && $data['status'] === false) {
                Log::warning('WhatsApp Gateway rejected message', [
                    'phone' => $normalizedPhone,
                    'reason' => $data['reason'] ?? $data['detail'] ?? 'unknown',
                ]);

                return false;
            }

            Log::info('WhatsApp Gateway sent successfully', [
                'phone' => $normalizedPhone,
                'detail' => is_array($data) ? ($data['detail'] ?? 'ok') : 'ok',
            ]);

            return true;
        } catch (Throwable $e) {
            Log::error('WhatsApp Gateway exception', [
                'phone' => $normalizedPhone,
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if ($digits === '') {
            return '';
        }

        while (str_starts_with($digits, '0062')) {
            $digits = substr($digits, 2);
        }

        while (str_starts_with($digits, '6262')) {
            $digits = substr($digits, 2);
        }

        if (str_starts_with($digits, '620')) {
            $digits = '62'.ltrim(substr($digits, 2), '0');
        } elseif (str_starts_with($digits, '0')) {
            $digits = '62'.ltrim($digits, '0');
        } elseif (str_starts_with($digits, '8')) {
            $digits = '62'.$digits;
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
            $text = "Halo {$patientName}, informasi dari Nuvacare: Janji temu Anda di {$poliName} bersama {$doctorName} pada tanggal {$dateFormatted} pukul {$timeFormatted} WIB terpaksa dibatalkan karena kendala jadwal rumah sakit.";
            if ($notes !== '') {
                $text .= " Catatan klinik: {$notes}";
            }
            $text .= ' Silakan memilih jadwal atau dokter pengganti melalui website Nuvacare.';

            return $text;
        }

        if ($reasonType === 'rescheduled') {
            $text = "Halo {$patientName}, informasi perubahan jadwal dari Nuvacare: Janji temu Anda di {$poliName} telah diperbarui menjadi tanggal {$dateFormatted} pukul {$timeFormatted} WIB bersama {$doctorName}.";
            if ($notes !== '') {
                $text .= " Catatan klinik: {$notes}";
            }

            return $text;
        }

        $text = "Halo {$patientName}, informasi janji temu Anda di Nuvacare ({$poliName} - {$doctorName}) pada {$dateFormatted} pukul {$timeFormatted} WIB berstatus: {$appointment->status}.";
        if ($notes !== '') {
            $text .= " Catatan: {$notes}";
        }

        return $text;
    }
}
