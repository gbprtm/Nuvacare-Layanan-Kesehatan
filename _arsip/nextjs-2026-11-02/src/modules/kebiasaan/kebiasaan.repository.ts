import { db } from "@/lib/db";
import { catatanKebiasaan } from "@/db/schema/pasien";
import { eq, and } from "drizzle-orm";

export async function findHabitByDate(pasienId: string, tanggal: string) {
  const result = await db
    .select()
    .from(catatanKebiasaan)
    .where(
      and(
        eq(catatanKebiasaan.pasienId, pasienId),
        eq(catatanKebiasaan.tanggal, tanggal)
      )
    )
    .limit(1);

  return result[0] || null;
}

