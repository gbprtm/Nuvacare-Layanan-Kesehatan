import { db } from "@/lib/db";
import { dokter, slot } from "@/db/schema/klinik";
import { eq, and } from "drizzle-orm";

export interface SeedKlinikResult {
  dokterIds: string[];
  slotIds: string[];
}

export async function seedKlinik(): Promise<SeedKlinikResult> {
  const contohDokter = [
    {
      nama: "dr. Bambang Irawan, Sp.PD (Fiktif)",
      spesialisasi: "Spesialis Penyakit Dalam",
      nomorIzin: "SIP-FIKTIF-001/2026",
      aktif: true,
    },
    {
      nama: "dr. Ratna Kartika, Sp.JP (Fiktif)",
      spesialisasi: "Spesialis Jantung & Pembuluh Darah",
      nomorIzin: "SIP-FIKTIF-002/2026",
      aktif: true,
    },
  ];

  const dokterIds: string[] = [];

  for (const d of contohDokter) {
    const existing = await db
      .select({ id: dokter.id })
      .from(dokter)
      .where(eq(dokter.nomorIzin, d.nomorIzin))
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      dokterIds.push(existing[0].id);
    } else {
      const [inserted] = await db
        .insert(dokter)
        .values(d)
        .returning({ id: dokter.id });
      if (inserted) {
        dokterIds.push(inserted.id);
      }
    }
  }

  const slotIds: string[] = [];
  const primaryDokterId = dokterIds[0];

  if (primaryDokterId) {
    const contohSlots = [
      {
        dokterId: primaryDokterId,
        tanggal: "2026-11-02",
        jamMulai: "08:00",
        jamSelesai: "10:00",
        kuota: 5,
        tersedia: true,
      },
      {
        dokterId: primaryDokterId,
        tanggal: "2026-11-02",
        jamMulai: "10:00",
        jamSelesai: "12:00",
        kuota: 5,
        tersedia: true,
      },
      {
        dokterId: primaryDokterId,
        tanggal: "2026-11-03",
        jamMulai: "08:00",
        jamSelesai: "10:00",
        kuota: 5,
        tersedia: true,
      },
    ];

    for (const s of contohSlots) {
      const existing = await db
        .select({ id: slot.id })
        .from(slot)
        .where(
          and(
            eq(slot.dokterId, s.dokterId),
            eq(slot.tanggal, s.tanggal),
            eq(slot.jamMulai, s.jamMulai)
          )
        )
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        slotIds.push(existing[0].id);
      } else {
        const [inserted] = await db
          .insert(slot)
          .values(s)
          .returning({ id: slot.id });
        if (inserted) {
          slotIds.push(inserted.id);
        }
      }
    }
  }

  return { dokterIds, slotIds };
}

