import { db } from "@/lib/db";
import { auditLog } from "@/db/schema/klinik";
import { desc } from "drizzle-orm";

export async function findRecentAuditLogs(limitCount = 50) {
  return await db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limitCount);
}

