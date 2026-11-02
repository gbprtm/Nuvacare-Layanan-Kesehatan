import { db } from "@/lib/db";
import { notifikasi } from "@/db/schema/klinik";
import { eq } from "drizzle-orm";

export async function findNotificationsByUserId(userId: string) {
  return await db
    .select()
    .from(notifikasi)
    .where(eq(notifikasi.userId, userId))
    .orderBy(notifikasi.createdAt);
}

