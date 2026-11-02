import { db } from "@/lib/db";
import { tiketAntrian } from "@/db/schema/pasien";
import { eq } from "drizzle-orm";

export async function findTicketById(ticketId: string) {
  const result = await db
    .select()
    .from(tiketAntrian)
    .where(eq(tiketAntrian.id, ticketId))
    .limit(1);
  return result[0] || null;
}

