<?php

namespace Tests\Unit;

use App\Support\WibClock;
use PHPUnit\Framework\TestCase;

class WibClockTest extends TestCase
{
    protected function tearDown(): void
    {
        // Pastikan clock direset setelah setiap tes
        WibClock::setTestNow(null);
        parent::tearDown();
    }

    /**
     * Uji zona waktu default adalah Asia/Jakarta (WIB).
     */
    public function test_zona_waktu_default_adalah_asia_jakarta(): void
    {
        $now = WibClock::now();
        $this->assertSame('Asia/Jakarta', $now->getTimezone()->getName());
    }

    /**
     * Uji waktu tiruan (mock) dapat disetel dan dikontrol dalam pengujian.
     */
    public function test_set_test_now_mengontrol_waktu(): void
    {
        WibClock::setTestNow('2026-11-02 08:30:00');

        $this->assertSame('2026-11-02 08:30:00', WibClock::now()->format('Y-m-d H:i:s'));
        $this->assertSame('2026-11-02', WibClock::todayString());

        // Reset waktu
        WibClock::setTestNow(null);
        $this->assertNotSame('2026-11-02 08:30:00', WibClock::now()->format('Y-m-d H:i:s'));
    }

    /**
     * Uji pergantian hari saat melewati batas tengah malam (23:59:59 ke 00:00:00).
     */
    public function test_transisi_batas_tengah_malam(): void
    {
        WibClock::setTestNow('2026-11-02 23:59:59');
        $this->assertSame('2026-11-02', WibClock::todayString());

        $startOfDay = WibClock::startOfDay();
        $endOfDay = WibClock::endOfDay();

        $this->assertSame('2026-11-02 00:00:00', $startOfDay->format('Y-m-d H:i:s'));
        $this->assertSame('2026-11-02 23:59:59', $endOfDay->format('Y-m-d H:i:s'));

        // 1 detik kemudian, tanggal bertambah
        $nextSecond = WibClock::now()->addSecond();
        $this->assertSame('2026-11-03 00:00:00', $nextSecond->format('Y-m-d H:i:s'));
    }

    /**
     * Uji kalkulasi tahun kabisat (29 Februari).
     */
    public function test_kalkulasi_tahun_kabisat(): void
    {
        $this->assertTrue(WibClock::isLeapYear(2024), '2024 adalah tahun kabisat');
        $this->assertFalse(WibClock::isLeapYear(2026), '2026 bukan tahun kabisat');
        $this->assertTrue(WibClock::isLeapYear(2000), '2000 adalah tahun kabisat');
        $this->assertFalse(WibClock::isLeapYear(1900), '1900 bukan tahun kabisat');

        // Uji tanggal 29 Februari pada tahun kabisat
        $leapDay = WibClock::parse('2024-02-29 12:00:00');
        $this->assertSame('2024-02-29', $leapDay->format('Y-m-d'));
        $this->assertSame('2024-03-01', $leapDay->addDay()->format('Y-m-d'));
    }

    /**
     * Uji perhitungan selisih hari antar tanggal.
     */
    public function test_perhitungan_selisih_hari(): void
    {
        $from = '2026-11-02';
        $to = '2026-11-09';

        $this->assertSame(7, WibClock::diffInDays($from, $to));
        $this->assertSame(-7, WibClock::diffInDays($to, $from));
        $this->assertSame(0, WibClock::diffInDays($from, $from));
    }

    /**
     * Uji format tanggal bahasa Indonesia.
     */
    public function test_format_tanggal_bahasa_indonesia(): void
    {
        $formatted = WibClock::formatIndonesian('2026-11-02 10:00:00', true);
        $this->assertSame('Senin, 2 November 2026', $formatted);

        $withoutDay = WibClock::formatIndonesian('2026-11-02 10:00:00', false);
        $this->assertSame('2 November 2026', $withoutDay);

        $time = WibClock::formatTime('2026-11-02 14:30:00');
        $this->assertSame('14:30 WIB', $time);
    }
}
