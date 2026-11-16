<?php

namespace Tests\Unit;

use App\Models\Appointment;
use App\Services\CancellationRequestService;
use App\Services\StatusChangeLogger;
use App\Services\WhatsAppNotificationService;
use Carbon\Carbon;
use Tests\TestCase;

class CancellationRequestServiceUnitTest extends TestCase
{
    private function makeService(): CancellationRequestService
    {
        return new CancellationRequestService(
            new StatusChangeLogger,
            new WhatsAppNotificationService,
        );
    }

    public function test_mask_phone_hides_middle_digits_for_doctor_privacy(): void
    {
        $service = $this->makeService();

        $this->assertSame('', $service->maskPhone(null));
        $this->assertSame('', $service->maskPhone(''));
        $this->assertSame('****', $service->maskPhone('1234'));
        $this->assertSame('08***78', $service->maskPhone('0812378'));
        $this->assertSame('+62 812-****-7890', $service->maskPhone('6281234567890'));
        $this->assertSame('0812****7890', $service->maskPhone('081234567890'));
    }

    public function test_compute_due_at_uses_earliest_of_24h_sla_or_1h_before_appointment(): void
    {
        $service = $this->makeService();
        $requestedAt = Carbon::parse('2026-11-20 08:00:00', 'Asia/Jakarta');

        $farAppointment = new Appointment([
            'appointment_date' => '2026-11-23',
            'appointment_time' => '10:00',
        ]);
        $this->assertSame(
            '2026-11-21 08:00:00',
            $service->computeDueAt($farAppointment, $requestedAt)->format('Y-m-d H:i:s'),
        );

        $nearAppointment = new Appointment([
            'appointment_date' => '2026-11-20',
            'appointment_time' => '13:00',
        ]);
        $this->assertSame(
            '2026-11-20 12:00:00',
            $service->computeDueAt($nearAppointment, $requestedAt)->format('Y-m-d H:i:s'),
        );
    }
}
