<?php

namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonImmutable;
use DateTimeInterface;

/**
 * WibClock
 *
 * Layanan waktu terpadu untuk domain bisnis klinik.
 * Seluruh kalkulasi tanggal dan jam menggunakan zona waktu Asia/Jakarta (WIB, UTC+7).
 * Dapat dikontrol penuh dalam pengujian (clock testing).
 */
class WibClock
{
    public const TIMEZONE = 'Asia/Jakarta';

    /**
     * Waktu uji tiruan (mock) bila disetel.
     */
    protected static ?CarbonImmutable $testNow = null;

    /**
     * Nama-nama hari dalam bahasa Indonesia.
     */
    protected const INDONESIAN_DAYS = [
        0 => 'Minggu',
        1 => 'Senin',
        2 => 'Selasa',
        3 => 'Rabu',
        4 => 'Kamis',
        5 => 'Jumat',
        6 => 'Sabtu',
    ];

    /**
     * Nama-nama bulan dalam bahasa Indonesia.
     */
    protected const INDONESIAN_MONTHS = [
        1 => 'Januari',
        2 => 'Februari',
        3 => 'Maret',
        4 => 'April',
        5 => 'Mei',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'Agustus',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember',
    ];

    /**
     * Dapatkan waktu saat ini di zona waktu Asia/Jakarta.
     */
    public static function now(): CarbonImmutable
    {
        if (self::$testNow !== null) {
            return self::$testNow;
        }

        return CarbonImmutable::now(self::TIMEZONE);
    }

    /**
     * Dapatkan tanggal hari ini (00:00:00) di zona waktu Asia/Jakarta.
     */
    public static function today(): CarbonImmutable
    {
        return self::now()->startOfDay();
    }

    /**
     * Dapatkan string tanggal format Y-m-d untuk hari ini di WIB.
     */
    public static function todayString(): string
    {
        return self::today()->format('Y-m-d');
    }

    /**
     * Dapatkan awal hari (00:00:00) WIB untuk waktu yang diberikan atau saat ini.
     */
    public static function startOfDay(DateTimeInterface|string|null $date = null): CarbonImmutable
    {
        $dt = self::parse($date);

        return $dt->startOfDay();
    }

    /**
     * Dapatkan akhir hari (23:59:59) WIB untuk waktu yang diberikan atau saat ini.
     */
    public static function endOfDay(DateTimeInterface|string|null $date = null): CarbonImmutable
    {
        $dt = self::parse($date);

        return $dt->endOfDay();
    }

    /**
     * Parsing tanggal/waktu ke CarbonImmutable dengan zona waktu Asia/Jakarta.
     */
    public static function parse(DateTimeInterface|string|null $date = null): CarbonImmutable
    {
        if ($date === null) {
            return self::now();
        }

        if ($date instanceof CarbonImmutable) {
            return $date->setTimezone(self::TIMEZONE);
        }

        if ($date instanceof DateTimeInterface) {
            return CarbonImmutable::instance($date)->setTimezone(self::TIMEZONE);
        }

        return CarbonImmutable::parse($date, self::TIMEZONE);
    }

    /**
     * Periksa apakah suatu tahun adalah tahun kabisat (leap year).
     */
    public static function isLeapYear(?int $year = null): bool
    {
        $targetYear = $year ?? (int) self::now()->format('Y');

        return ($targetYear % 4 === 0 && $targetYear % 100 !== 0) || ($targetYear % 400 === 0);
    }

    /**
     * Hitung selisih hari antara dua tanggal WIB.
     */
    public static function diffInDays(DateTimeInterface|string $from, DateTimeInterface|string $to): int
    {
        $fromDate = self::parse($from)->startOfDay();
        $toDate = self::parse($to)->startOfDay();

        return (int) $fromDate->diffInDays($toDate, false);
    }

    /**
     * Format tanggal ke dalam representasi bahasa Indonesia baku.
     * Contoh: "Senin, 2 November 2026" atau "2 November 2026".
     */
    public static function formatIndonesian(DateTimeInterface|string $date, bool $withDayName = true): string
    {
        $dt = self::parse($date);
        $dayOfWeek = (int) $dt->format('w');
        $dayOfMonth = (int) $dt->format('j');
        $month = (int) $dt->format('n');
        $year = (int) $dt->format('Y');

        $dayName = self::INDONESIAN_DAYS[$dayOfWeek] ?? '';
        $monthName = self::INDONESIAN_MONTHS[$month] ?? '';

        if ($withDayName) {
            return "{$dayName}, {$dayOfMonth} {$monthName} {$year}";
        }

        return "{$dayOfMonth} {$monthName} {$year}";
    }

    /**
     * Format waktu jam dan menit WIB. Contoh: "08:30 WIB".
     */
    public static function formatTime(DateTimeInterface|string $date): string
    {
        return self::parse($date)->format('H:i').' WIB';
    }

    /**
     * Set waktu tiruan untuk pengujian otomatis.
     */
    public static function setTestNow(DateTimeInterface|string|null $testNow = null): void
    {
        if ($testNow === null) {
            self::$testNow = null;
            Carbon::setTestNow(null);
            CarbonImmutable::setTestNow(null);

            return;
        }

        $immutable = self::parse($testNow);
        self::$testNow = $immutable;
        Carbon::setTestNow($immutable);
        CarbonImmutable::setTestNow($immutable);
    }
}
