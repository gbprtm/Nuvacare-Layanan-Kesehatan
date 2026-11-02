import { KirimNotifikasiInput } from "./notifikasi.schema";
import { db } from "@/lib/db";
import { notifikasi } from "@/db/schema/klinik";

export async function sendNotificationService(data: KirimNotifikasiInput) {
  const [created] = await db
    .insert(notifikasi)
    .values({
      userId: data.userId,
      judul: data.judul,
      pesan: data.pesan,
      tipe: data.tipe,
    })
    .returning();

  return created;
}

