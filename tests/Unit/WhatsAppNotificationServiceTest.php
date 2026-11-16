<?php

namespace Tests\Unit;

use App\Services\WhatsAppNotificationService;
use PHPUnit\Framework\TestCase;

class WhatsAppNotificationServiceTest extends TestCase
{
    public function test_normalize_phone_converts_local_and_prefixed_formats_to_62(): void
    {
        $service = new WhatsAppNotificationService;

        $this->assertSame('6281234567890', $service->normalizePhone('0812-3456-7890'));
        $this->assertSame('6281234567890', $service->normalizePhone('+62 812 3456 7890'));
        $this->assertSame('6281234567890', $service->normalizePhone('006281234567890'));
        $this->assertSame('6281234567890', $service->normalizePhone('62081234567890'));
        $this->assertSame('6281234567890', $service->normalizePhone('626281234567890'));
        $this->assertSame('6281234567890', $service->normalizePhone('81234567890'));
        $this->assertSame('', $service->normalizePhone(''));
        $this->assertSame('', $service->normalizePhone('---'));
    }
}
