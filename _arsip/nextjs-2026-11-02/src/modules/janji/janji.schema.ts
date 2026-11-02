import { z } from "zod";

export const buatJanjiSchema = z
  .object({
    slotId: z.string().uuid("ID slot harus berformat UUID yang valid"),
    keluhan: z.string().trim().max(1000, "Keluhan maksimal 1000 karakter").optional(),
  })
  .strict();

export const batalkanJanjiSchema = z
  .object({
    alasan: z.string().trim().min(5, "Alasan pembatalan minimal 5 karakter").max(1000),
  })
  .strict();

export const slotQuerySchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus berformat YYYY-MM-DD."),
  dokterId: z.string().uuid().optional(),
  spesialisasi: z.string().trim().max(255).optional(),
  tersedia: z.enum(["true", "false"]).optional(),
});

export const janjiQuerySchema = z.object({
  status: z.enum(["aktif", "perubahan_diusulkan", "dibatalkan", "selesai", "tidak_hadir"]).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type BuatJanjiInput = z.infer<typeof buatJanjiSchema>;
export type BatalkanJanjiInput = z.infer<typeof batalkanJanjiSchema>;
export type SlotQuery = z.infer<typeof slotQuerySchema>;
export type JanjiQuery = z.infer<typeof janjiQuerySchema>;
