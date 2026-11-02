import { CatatAuditInput } from "./audit.schema";
import { db } from "@/lib/db";
import { auditLog } from "@/db/schema/klinik";

export async function logAuditEventService(data: CatatAuditInput) {
  const [created] = await db
    .insert(auditLog)
    .values({
      userId: data.userId,
      aksi: data.aksi,
      objek: data.objek,
      objekId: data.objekId,
      nilaiSebelum: data.nilaiSebelum,
      nilaiSesudah: data.nilaiSesudah,
      alasan: data.alasan,
      ipAddress: data.ipAddress,
    })
    .returning();

  return created;
}

