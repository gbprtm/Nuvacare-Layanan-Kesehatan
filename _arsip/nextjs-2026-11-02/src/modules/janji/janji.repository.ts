import { and, eq, gte, lte, notExists } from "drizzle-orm";
import { db } from "@/lib/db";
import { dokter, janji, slot } from "@/db/schema/klinik";
import type { JanjiQuery, SlotQuery } from "./janji.schema";

export async function findSlotById(slotId: string) {
  const [result] = await db.select().from(slot).where(eq(slot.id, slotId)).limit(1);
  return result ?? null;
}

export async function listAvailableSlots(query: SlotQuery) {
  const conditions = [
    eq(slot.tanggal, query.tanggal),
    eq(dokter.aktif, true),
    notExists(
      db
        .select({ id: janji.id })
        .from(janji)
        .where(and(eq(janji.slotId, slot.id), eq(janji.status, "aktif")))
    ),
  ];

  if (query.dokterId) conditions.push(eq(slot.dokterId, query.dokterId));
  if (query.spesialisasi) conditions.push(eq(dokter.spesialisasi, query.spesialisasi));
  if (query.tersedia === "true") conditions.push(eq(slot.tersedia, true));
  if (query.tersedia === "false") conditions.push(eq(slot.tersedia, false));

  return db
    .select({ slot, dokter })
    .from(slot)
    .innerJoin(dokter, eq(slot.dokterId, dokter.id))
    .where(and(...conditions));
}

export async function findJanjiById(janjiId: string) {
  const [result] = await db
    .select({ janji, slot, dokter })
    .from(janji)
    .innerJoin(slot, eq(janji.slotId, slot.id))
    .innerJoin(dokter, eq(janji.dokterId, dokter.id))
    .where(eq(janji.id, janjiId))
    .limit(1);
  return result ?? null;
}

export async function listJanji(query: JanjiQuery, userId: string, isAdmin: boolean) {
  const conditions = [];
  if (!isAdmin) conditions.push(eq(janji.pasienId, userId));
  if (query.status) conditions.push(eq(janji.status, query.status));
  if (query.from) conditions.push(gte(slot.tanggal, query.from));
  if (query.to) conditions.push(lte(slot.tanggal, query.to));

  return db
    .select({ janji, slot, dokter })
    .from(janji)
    .innerJoin(slot, eq(janji.slotId, slot.id))
    .innerJoin(dokter, eq(janji.dokterId, dokter.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);
}
