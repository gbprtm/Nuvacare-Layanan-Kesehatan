import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { client, db } from "@/lib/db";
import { dokter, janji, slot } from "@/db/schema/klinik";
import { users } from "@/db/schema/auth";

const tanda = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

let dokterId: string | undefined;
let slotId: string | undefined;
let pasienId: string | undefined;

function bacaGalat(error: unknown): { kode?: string; constraint?: string } {
  let sekarang: unknown = error;
  for (let i = 0; i < 5 && sekarang; i += 1) {
    if (typeof sekarang === "object" && sekarang !== null) {
      const isi = sekarang as { code?: string; constraint_name?: string; cause?: unknown };
      if (isi.code) return { kode: isi.code, constraint: isi.constraint_name };
      sekarang = isi.cause;
    } else {
      break;
    }
  }
  return {};
}

beforeAll(async () => {
  const [dokterBaru] = await db
    .insert(dokter)
    .values({
      nama: `dr. Uji Constraint ${tanda}`,
      spesialisasi: "Uji",
      nomorIzin: `SIP-UJI-${tanda}`,
      aktif: true,
    })
    .returning({ id: dokter.id });
  if (!dokterBaru) throw new Error("Gagal membuat dokter uji");
  dokterId = dokterBaru.id;

  const [slotBaru] = await db
    .insert(slot)
    .values({
      dokterId,
      tanggal: "2099-12-31",
      jamMulai: "08:00",
      jamSelesai: "09:00",
      kuota: 5,
      tersedia: true,
    })
    .returning({ id: slot.id });
  if (!slotBaru) throw new Error("Gagal membuat slot uji");
  slotId = slotBaru.id;

  const [pasienBaru] = await db
    .insert(users)
    .values({
      name: `Pasien Uji ${tanda}`,
      email: `uji.constraint.${tanda}@contoh-fiktif.local`,
      passwordHash: "bukan-hash-untuk-uji",
      role: "pasien",
    })
    .returning({ id: users.id });
  if (!pasienBaru) throw new Error("Gagal membuat pasien uji");
  pasienId = pasienBaru.id;
});

afterAll(async () => {
  if (slotId) await db.delete(janji).where(eq(janji.slotId, slotId));
  if (slotId) await db.delete(slot).where(eq(slot.id, slotId));
  if (dokterId) await db.delete(dokter).where(eq(dokter.id, dokterId));
  if (pasienId) await db.delete(users).where(eq(users.id, pasienId));
  await client.end({ timeout: 5 });
});

describe("Tugas A12: constraint database sungguhan", () => {
  it("menolak janji aktif kedua pada slot yang sama (unique parsial)", async () => {
    if (!pasienId || !dokterId || !slotId) throw new Error("Data uji belum siap");

    await db.insert(janji).values({
      pasienId,
      dokterId,
      slotId,
      status: "aktif",
    });

    let galat: { kode?: string; constraint?: string } = {};
    try {
      await db.insert(janji).values({
        pasienId,
        dokterId,
        slotId,
        status: "aktif",
      });
    } catch (error) {
      galat = bacaGalat(error);
    }

    expect(galat.kode).toBe("23505");
    expect(galat.constraint).toBe("janji_slot_aktif_unique_idx");
  });

  it("mengizinkan banyak janji batal pada slot yang sama (predikat WHERE status = 'aktif')", async () => {
    if (!pasienId || !dokterId || !slotId) throw new Error("Data uji belum siap");

    await db.insert(janji).values({
      pasienId,
      dokterId,
      slotId,
      status: "dibatalkan",
    });
    await db.insert(janji).values({
      pasienId,
      dokterId,
      slotId,
      status: "dibatalkan",
    });

    const baris = await db
      .select({ id: janji.id })
      .from(janji)
      .where(eq(janji.slotId, slotId));

    // satu janji aktif dari uji pertama + dua janji batal
    expect(baris).toHaveLength(3);
  });
});
