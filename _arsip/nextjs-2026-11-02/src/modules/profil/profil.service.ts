import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { ValidationError } from "@/lib/errors";
import { nowWib } from "@/lib/waktu-wib";
import { obatPasien, profil } from "@/db/schema/pasien";
import { users } from "@/db/schema/auth";

const nullableString = z.string().trim().max(255).nullable().optional();

export const updateProfilSchema = z
  .object({
    nomorTelepon: z.string().trim().max(20).nullable().optional(),
    tanggalLahir: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus berformat YYYY-MM-DD.")
      .nullable()
      .optional(),
    jenisKelamin: z.enum(["laki_laki", "perempuan"]).nullable().optional(),
    golonganDarah: z.string().trim().max(5).nullable().optional(),
    tinggiBadan: z.number().int().min(1).max(300).nullable().optional(),
    beratBadan: z.number().int().min(1).max(500).nullable().optional(),
    kondisiKesehatan: nullableString,
    riwayatAlergi: nullableString,
    kontakDaruratNama: nullableString,
    kontakDaruratTelepon: z.string().trim().max(20).nullable().optional(),
  })
  .strict();

export const deleteProfilSchema = z
  .object({ konfirmasi: z.literal(true) })
  .strict();

export type UpdateProfilInput = z.infer<typeof updateProfilSchema>;

export type ProfilResponse = {
  id: string;
  nama: string;
  nomorTelepon: string | null;
  tanggalLahir: string | null;
  jenisKelamin: "laki_laki" | "perempuan" | null;
  golonganDarah: string | null;
  tinggiBadan: number | null;
  beratBadan: number | null;
  kondisiKesehatan: string | null;
  riwayatAlergi: string | null;
  kontakDaruratNama: string | null;
  kontakDaruratTelepon: string | null;
  updatedAt: string;
  obat: Array<{
    id: string;
    katalogObatFornasId: string | null;
    namaObat: string;
    namaInternasional: string | null;
    dosisCatatan: string | null;
    frekuensiCatatan: string | null;
    mulaiPada: string | null;
    selesaiPada: string | null;
    catatan: string | null;
    sumber: string;
  }>;
};

async function getObatPasien(userId: string): Promise<ProfilResponse["obat"]> {
  const rows = await db
    .select()
    .from(obatPasien)
    .where(eq(obatPasien.pasienId, userId));

  return rows.map((row) => ({
    id: row.id,
    katalogObatFornasId: row.katalogObatFornasId,
    namaObat: row.namaObat,
    namaInternasional: row.namaInternasional,
    dosisCatatan: row.dosisCatatan,
    frekuensiCatatan: row.frekuensiCatatan,
    mulaiPada: row.mulaiPada,
    selesaiPada: row.selesaiPada,
    catatan: row.catatan,
    sumber: row.sumber,
  }));
}

function toResponse(
  row: typeof profil.$inferSelect,
  nama: string,
  obat: ProfilResponse["obat"]
): ProfilResponse {
  return {
    id: row.id,
    nama,
    nomorTelepon: row.nomorTelepon,
    tanggalLahir: row.tanggalLahir,
    jenisKelamin: row.jenisKelamin,
    golonganDarah: row.golonganDarah,
    tinggiBadan: row.tinggiBadan,
    beratBadan: row.beratBadan,
    kondisiKesehatan: row.kondisiKesehatan,
    riwayatAlergi: row.riwayatAlergi,
    kontakDaruratNama: row.kontakDaruratNama,
    kontakDaruratTelepon: row.kontakDaruratTelepon,
    updatedAt: row.updatedAt.toISOString(),
    obat,
  };
}

export async function getProfil(userId: string): Promise<ProfilResponse | null> {
  const [row] = await db
    .select({ profile: profil, nama: users.name })
    .from(profil)
    .innerJoin(users, eq(profil.userId, users.id))
    .where(eq(profil.userId, userId))
    .limit(1);

  return row ? toResponse(row.profile, row.nama, await getObatPasien(userId)) : null;
}

export async function saveProfil(userId: string, input: UpdateProfilInput): Promise<ProfilResponse> {
  const [existing] = await db.select().from(profil).where(eq(profil.userId, userId)).limit(1);
  const now = nowWib();
  const values = {
    userId,
    nomorTelepon: input.nomorTelepon,
    tanggalLahir: input.tanggalLahir,
    jenisKelamin: input.jenisKelamin,
    golonganDarah: input.golonganDarah,
    tinggiBadan: input.tinggiBadan,
    beratBadan: input.beratBadan,
    kondisiKesehatan: input.kondisiKesehatan,
    riwayatAlergi: input.riwayatAlergi,
    kontakDaruratNama: input.kontakDaruratNama,
    kontakDaruratTelepon: input.kontakDaruratTelepon,
    updatedAt: now,
  };

  if (existing) {
    const [updated] = await db.update(profil).set(values).where(eq(profil.userId, userId)).returning();
    if (!updated) throw new ValidationError("Profil tidak dapat diperbarui.");
    const current = await getProfil(userId);
    if (!current) throw new ValidationError("Profil tidak dapat dibaca kembali.");
    return current;
  }

  const [created] = await db.insert(profil).values(values).returning();
  if (!created) throw new ValidationError("Profil tidak dapat dibuat.");
  const current = await getProfil(userId);
  if (!current) throw new ValidationError("Profil tidak dapat dibaca kembali.");
  return current;
}

export async function deleteProfil(userId: string): Promise<void> {
  await db.delete(profil).where(eq(profil.userId, userId));
}
