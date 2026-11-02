import { z } from "zod";

export const checkInAntrianSchema = z.object({
  janjiId: z.string().uuid("ID janji harus berformat UUID"),
});

export const updateStatusAntrianSchema = z.object({
  tiketId: z.string().uuid("ID tiket harus berformat UUID"),
  status: z.enum([
    "belum_check_in",
    "menunggu",
    "diperiksa",
    "selesai",
    "tidak_hadir",
  ]),
  alasanKoreksi: z.string().optional(),
});

export type CheckInAntrianInput = z.infer<typeof checkInAntrianSchema>;
export type UpdateStatusAntrianInput = z.infer<typeof updateStatusAntrianSchema>;

