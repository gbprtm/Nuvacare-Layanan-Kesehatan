import { z } from "zod";

export const catatKebiasaanSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  hidrasiMl: z.number().int().min(0).max(10000, "Jumlah air maksimal 10.000 ml"),
  jamTidur: z.number().int().min(1).max(23, "Durasi tidur harus berada di rentang 1-23 jam"),
  aktivitasMenit: z.number().int().min(0).max(1440).optional(),
  catatan: z.string().max(500).optional(),
});

export type CatatKebiasaanInput = z.infer<typeof catatKebiasaanSchema>;

