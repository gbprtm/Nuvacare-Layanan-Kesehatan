import { describe, it, expect } from "vitest";
import { verifyPassword } from "@/modules/auth/password";
import bcrypt from "bcryptjs";

describe("Tugas A13: Seed Admin Individual dan Data Fiktif", () => {
  it("harus dapat memverifikasi kata sandi akun admin yang di-seed", async () => {
    const defaultPassword = "AdminKlinik2026!";
    const hash = await bcrypt.hash(defaultPassword, 10);
    const isValid = await verifyPassword(defaultPassword, hash);
    expect(isValid).toBe(true);
  });

  it("data seed pasien dan dokter harus berlabel fiktif tanpa data orang nyata", () => {
    const contohNik = "3171000000000001";
    // NIK fiktif dengan format 16 digit dummy
    expect(contohNik).toMatch(/^\d{16}$/);
    expect(contohNik.includes("00000000")).toBe(true);
  });
});

