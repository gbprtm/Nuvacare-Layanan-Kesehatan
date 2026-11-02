/**
 * src/lib/waktu-wib.ts
 * Standarisasi penanganan zona waktu Asia/Jakarta (WIB = UTC+7).
 * Aturan keras no. 7: Seluruh perhitungan tanggal lewat modul ini.
 */

export const TIMEZONE_WIB = "Asia/Jakarta";
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

type WibParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

function getWibParts(date: Date): WibParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const values = new Map(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: values.get("year") ?? 0,
    month: values.get("month") ?? 0,
    day: values.get("day") ?? 0,
    hour: values.get("hour") ?? 0,
    minute: values.get("minute") ?? 0,
    second: values.get("second") ?? 0,
    millisecond: date.getTime() % 1000,
  };
}

function fromWibParts(parts: WibParts): Date {
  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      parts.millisecond
    ) - WIB_OFFSET_MS
  );
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Mengembalikan objek Date saat ini dalam representasi WIB.
 */
export function nowWib(): Date {
  return new Date();
}

/**
 * Mengembalikan awal hari kalender berdasarkan WIB.
 */
export function startOfDayWib(date: Date = new Date()): Date {
  const parts = getWibParts(date);
  return fromWibParts({ ...parts, hour: 0, minute: 0, second: 0, millisecond: 0 });
}

/**
 * Mengembalikan akhir hari kalender berdasarkan WIB.
 */
export function endOfDayWib(date: Date = new Date()): Date {
  const parts = getWibParts(date);
  return fromWibParts({ ...parts, hour: 23, minute: 59, second: 59, millisecond: 999 });
}

/**
 * Menambah atau mengurangi hari kalender sambil mempertahankan jam WIB.
 */
export function addDaysWib(date: Date, days: number): Date {
  const parts = getWibParts(date);
  const shifted = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day + days,
      parts.hour,
      parts.minute,
      parts.second,
      parts.millisecond
    )
  );

  return fromWibParts({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
    millisecond: shifted.getUTCMilliseconds(),
  });
}

/**
 * Menambah interval kontrol 7, 14, atau 30 hari sesuai aturan anchor tanggal.
 * Interval 30 hari diperlakukan sebagai bulan berikutnya dan di-clamp ke hari terakhir bulan.
 */
export function addControlIntervalWib(date: Date, intervalDays: 7 | 14 | 30): Date {
  if (intervalDays !== 30) {
    return addDaysWib(date, intervalDays);
  }

  const parts = getWibParts(date);
  const targetMonth = parts.month === 12 ? 1 : parts.month + 1;
  const targetYear = parts.month === 12 ? parts.year + 1 : parts.year;
  const targetDay = Math.min(parts.day, daysInMonth(targetYear, targetMonth));

  return fromWibParts({
    ...parts,
    year: targetYear,
    month: targetMonth,
    day: targetDay,
  });
}

/**
 * Memformat tanggal lengkap dalam bahasa Indonesia berdasarkan WIB.
 */
export function formatWibId(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE_WIB,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Mengonversi tanggal ke format string ISO tanggal (YYYY-MM-DD) berdasarkan zona waktu WIB.
 */
export function toWibDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Mengonversi tanggal ke representasi string waktu (HH:mm) dalam zona WIB.
 */
export function toWibTimeString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE_WIB,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(date);
}

/**
 * Format tanggal lengkap untuk tampilan pengguna dalam bahasa Indonesia (WIB).
 * Contoh: "29 Oktober 2026, 14:30 WIB"
 */
export function formatWibLengkap(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE_WIB,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${formatter.format(date)} WIB`;
}

/**
 * Memeriksa apakah dua tanggal jatuh pada hari yang sama di zona waktu WIB.
 */
export function isSameDayWib(date1: Date, date2: Date): boolean {
  return toWibDateString(date1) === toWibDateString(date2);
}

