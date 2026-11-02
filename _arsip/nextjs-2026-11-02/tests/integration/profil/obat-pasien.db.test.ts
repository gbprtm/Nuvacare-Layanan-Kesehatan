import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { client, db } from "@/lib/db";
import { users } from "@/db/schema/auth";
import { katalogObatFornas, obatPasien } from "@/db/schema/pasien";

const suffix = randomUUID();
let pasienId: string | undefined;
let katalogId: string | undefined;
let obatPasienId: string | undefined;

beforeAll(async () => {
  const [pasien] = await db
    .insert(users)
    .values({
      name: "Pasien Obat B02",
      email: `b02.obat.${suffix}@example.test`,
      passwordHash: "bukan-hash-untuk-uji",
      role: "pasien",
    })
    .returning({ id: users.id });
  if (!pasien) throw new Error("Fixture pasien obat gagal dibuat.");
  pasienId = pasien.id;

  const [katalog] = await db
    .insert(katalogObatFornas)
    .values({
      namaIndonesia: `abakavir-${suffix}`,
      namaInternasional: "abacavir",
      sumberUrl: "https://e-fornas.kemkes.go.id/guest/daftar-obat",
      tanggalSnapshot: "2026-11-01",
      cakupanSnapshot: "A",
    })
    .returning({ id: katalogObatFornas.id });
  if (!katalog) throw new Error("Fixture katalog obat gagal dibuat.");
  katalogId = katalog.id;
});

afterAll(async () => {
  if (obatPasienId) await db.delete(obatPasien).where(eq(obatPasien.id, obatPasienId));
  if (katalogId) await db.delete(katalogObatFornas).where(eq(katalogObatFornas.id, katalogId));
  if (pasienId) await db.delete(users).where(eq(users.id, pasienId));
  await client.end({ timeout: 5 });
});

describe("obat yang dilaporkan pasien", () => {
  it("menyimpan catatan pasien dan mempertahankan riwayat saat katalog dihapus", async () => {
    if (!pasienId || !katalogId) throw new Error("Fixture obat belum siap.");

    const [created] = await db
      .insert(obatPasien)
      .values({
        pasienId,
        katalogObatFornasId: katalogId,
        namaObat: "abakavir",
        namaInternasional: "abacavir",
        dosisCatatan: "Sesuai resep dokter",
        frekuensiCatatan: "1 kali sehari",
        mulaiPada: "2026-11-01",
        catatan: "Catatan pasien, bukan rekomendasi sistem.",
      })
      .returning({ id: obatPasien.id, sumber: obatPasien.sumber });

    if (!created) throw new Error("Catatan obat pasien gagal dibuat.");
    obatPasienId = created.id;
    expect(created.sumber).toBe("dilaporkan_pasien");

    await db.delete(katalogObatFornas).where(eq(katalogObatFornas.id, katalogId));
    const [retained] = await db
      .select({ katalogId: obatPasien.katalogObatFornasId, nama: obatPasien.namaObat })
      .from(obatPasien)
      .where(eq(obatPasien.id, obatPasienId));

    expect(retained?.nama).toBe("abakavir");
    expect(retained?.katalogId).toBeNull();
    katalogId = undefined;
  });
});
