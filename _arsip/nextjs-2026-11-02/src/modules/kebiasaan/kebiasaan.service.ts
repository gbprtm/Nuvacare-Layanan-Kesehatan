import { CatatKebiasaanInput } from "./kebiasaan.schema";
import { UserSessionPayload, canRecordHabits } from "./kebiasaan.policy";
import { db } from "@/lib/db";
import { catatanKebiasaan } from "@/db/schema/pasien";

export async function recordHabitService(
  user: UserSessionPayload,
  data: CatatKebiasaanInput
) {
  if (!canRecordHabits(user)) {
    throw new Error("Hanya pasien yang dapat mencatat kebiasaan harian");
  }

  const [saved] = await db
    .insert(catatanKebiasaan)
    .values({
      pasienId: user.userId,
      tanggal: data.tanggal,
      hidrasiMl: data.hidrasiMl,
      jamTidur: data.jamTidur,
      aktivitasMenit: data.aktivitasMenit,
      catatan: data.catatan,
    })
    .returning();

  return saved;
}

