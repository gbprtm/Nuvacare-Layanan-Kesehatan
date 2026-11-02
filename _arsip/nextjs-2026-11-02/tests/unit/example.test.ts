import { describe, it, expect } from "vitest";

describe("Unit Test Contoh Runner Vitest", () => {
  it("harus menjalankan pengujian dasar dengan benar", () => {
    expect(1 + 1).toBe(2);
  });

  it("lingkungan pengujian jsdom harus tersedia", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
  });
});
