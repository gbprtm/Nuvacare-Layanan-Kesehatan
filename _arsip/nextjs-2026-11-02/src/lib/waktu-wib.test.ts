import { describe, expect, it } from "vitest";

import {
  addControlIntervalWib,
  addDaysWib,
  endOfDayWib,
  formatWibId,
  startOfDayWib,
  toWibDateString,
  toWibTimeString,
} from "./waktu-wib";

describe("waktu WIB", () => {
  it("memisahkan 23:59 dan 00:01 WIB pada hari kalender yang berbeda", () => {
    const sebelumTengahMalam = new Date("2026-01-01T16:59:00.000Z");
    const sesudahTengahMalam = new Date("2026-01-01T17:01:00.000Z");

    expect(toWibDateString(sebelumTengahMalam)).toBe("2026-01-01");
    expect(toWibDateString(sesudahTengahMalam)).toBe("2026-01-02");
    expect(toWibTimeString(sebelumTengahMalam)).toBe("23:59");
    expect(toWibTimeString(sesudahTengahMalam)).toBe("00:01");
  });

  it("menghasilkan batas awal dan akhir hari dalam WIB", () => {
    const input = new Date("2026-01-01T17:30:15.123Z");

    expect(startOfDayWib(input).toISOString()).toBe("2026-01-01T17:00:00.000Z");
    expect(endOfDayWib(input).toISOString()).toBe("2026-01-02T16:59:59.999Z");
  });

  it("menambah hari kalender tanpa mengubah jam WIB", () => {
    const input = new Date("2026-01-31T02:45:10.000Z");
    const result = addDaysWib(input, 1);

    expect(toWibDateString(result)).toBe("2026-02-01");
    expect(toWibTimeString(result)).toBe("09:45");
  });

  it.each([
    [2026, "2026-02-28"],
    [2028, "2028-02-29"],
  ])("meng-clamp interval kontrol 30 hari dari 31 Januari pada tahun %i", (year, expectedDate) => {
    const input = new Date(`${year}-01-30T17:00:00.000Z`);
    const result = addControlIntervalWib(input, 30);

    expect(toWibDateString(result)).toBe(expectedDate);
  });

  it("memformat tanggal dalam bahasa Indonesia", () => {
    const input = new Date("2026-10-31T02:30:00.000Z");

    expect(formatWibId(input)).toBe("Sabtu, 31 Oktober 2026");
  });
});
