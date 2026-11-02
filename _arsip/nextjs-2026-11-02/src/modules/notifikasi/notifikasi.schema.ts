import { z } from "zod";

export const kirimNotifikasiSchema = z.object({
  userId: z.string().uuid("ID pengguna harus berformat UUID"),
  judul: z.string().min(1, "Judul notifikasi tidak boleh kosong"),
  pesan: z.string().min(1, "Pesan notifikasi tidak boleh kosong"),
  tipe: z.enum([
    "pengingat_janji",
    "usulan_perubahan",
    "pengingat_obat",
    "antrian",
    "sistem",
  ]),
});

export const tandaiDibacaSchema = z.object({
  notifikasiId: z.string().uuid("ID notifikasi harus berformat UUID"),
});

export type KirimNotifikasiInput = z.infer<typeof kirimNotifikasiSchema>;
export type TandaiDibacaInput = z.infer<typeof tandaiDibacaSchema>;

