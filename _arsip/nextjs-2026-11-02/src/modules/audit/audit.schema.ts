import { z } from "zod";

export const catatAuditSchema = z.object({
  userId: z.string().uuid("ID pengguna harus berformat UUID").optional(),
  aksi: z.string().min(1, "Aksi audit tidak boleh kosong"),
  objek: z.string().min(1, "Objek audit tidak boleh kosong"),
  objekId: z.string().min(1, "ID objek audit tidak boleh kosong"),
  nilaiSebelum: z.record(z.string(), z.unknown()).optional(),
  nilaiSesudah: z.record(z.string(), z.unknown()).optional(),
  alasan: z.string().optional(),
  ipAddress: z.string().optional(),
});

export type CatatAuditInput = z.infer<typeof catatAuditSchema>;

