import { afterAll, describe, expect, it } from "vitest";
import { count, eq } from "drizzle-orm";
import { client, db } from "@/lib/db";
import { users } from "@/db/schema/auth";
import { dokter, slot } from "@/db/schema/klinik";
import { seedAdmin } from "@/db/seed/admin";
import { seedKlinik } from "@/db/seed/klinik";
import { seedPasien } from "@/db/seed/pasien";
import { verifyPassword } from "@/modules/auth/password";

async function hitungBaris() {
  const [u] = await db.select({ n: count() }).from(users);
  const [d] = await db.select({ n: count() }).from(dokter);
  const [s] = await db.select({ n: count() }).from(slot);
  return { users: u?.n ?? -1, dokter: d?.n ?? -1, slot: s?.n ?? -1 };
}

async function jalankanSeed() {
  await seedAdmin();
  await seedKlinik();
  await seedPasien();
}

afterAll(async () => {
  await client.end({ timeout: 5 });
});

describe("Tugas A13: seed idempoten dan login admin", () => {
  it("menjalankan seed dua kali tidak menambah baris", async () => {
    await jalankanSeed();
    const setelahPertama = await hitungBaris();

    await jalankanSeed();
    const setelahKedua = await hitungBaris();

    expect(setelahKedua).toEqual(setelahPertama);
    expect(setelahPertama.users).toBeGreaterThanOrEqual(4);
    expect(setelahPertama.dokter).toBeGreaterThanOrEqual(2);
    expect(setelahPertama.slot).toBeGreaterThanOrEqual(3);
  });

  it("menyimpan dua admin terpisah yang kata sandinya cocok untuk login", async () => {
    const akun = await db
      .select({ email: users.email, role: users.role, hash: users.passwordHash })
      .from(users)
      .where(eq(users.role, "admin"));

    expect(akun.length).toBeGreaterThanOrEqual(2);
    for (const email of ["admin1@klinik-sehat.local", "admin2@klinik-sehat.local"]) {
      const baris = akun.find((a) => a.email === email);
      expect(baris).toBeDefined();
      expect(await verifyPassword("AdminKlinik2026!", baris?.hash ?? "")).toBe(true);
    }
  });
});
