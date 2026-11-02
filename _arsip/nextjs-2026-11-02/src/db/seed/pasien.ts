import { db } from "@/lib/db";
import { users } from "@/db/schema/auth";
import { profil, catatanKebiasaan } from "@/db/schema/pasien";
import { hashPassword } from "@/modules/auth/password";
import { eq, and } from "drizzle-orm";

export interface SeedPasienResult {
  pasienIds: string[];
}

export async function seedPasien(): Promise<SeedPasienResult> {
  const passwordHash = await hashPassword("PasienKlinik2026!");

  const contohPasien = [
    {
      user: {
        name: "Budi Santoso (Fiktif)",
        email: "pasien.budi@contoh-fiktif.local",
        passwordHash,
        role: "pasien" as const,
      },
      profil: {
        nik: "3171000000000001",
        nomorTelepon: "081200000001",
        tanggalLahir: "1975-05-12",
        jenisKelamin: "laki_laki" as const,
        golonganDarah: "O",
        tinggiBadan: 168,
        beratBadan: 70,
        kondisiKesehatan: "Hipertensi Derajat 1",
        riwayatAlergi: "Tidak ada",
        kontakDaruratNama: "Keluarga Budi (Fiktif)",
        kontakDaruratTelepon: "081200000002",
      },
      kebiasaan: {
        tanggal: "2026-10-28",
        hidrasiMl: 2200,
        jamTidur: 7,
        aktivitasMenit: 30,
        catatan: "Jalan santai pagi hari (Data Fiktif)",
      },
    },
    {
      user: {
        name: "Siti Rahayu (Fiktif)",
        email: "pasien.siti@contoh-fiktif.local",
        passwordHash,
        role: "pasien" as const,
      },
      profil: {
        nik: "3171000000000002",
        nomorTelepon: "081200000003",
        tanggalLahir: "1968-11-20",
        jenisKelamin: "perempuan" as const,
        golonganDarah: "A",
        tinggiBadan: 155,
        beratBadan: 62,
        kondisiKesehatan: "Hipertensi Terkontrol",
        riwayatAlergi: "Alergi debu ringan",
        kontakDaruratNama: "Keluarga Siti (Fiktif)",
        kontakDaruratTelepon: "081200000004",
      },
      kebiasaan: {
        tanggal: "2026-10-28",
        hidrasiMl: 1900,
        jamTidur: 6,
        aktivitasMenit: 20,
        catatan: "Senam lansia (Data Fiktif)",
      },
    },
  ];

  const pasienIds: string[] = [];

  for (const item of contohPasien) {
    let userId: string;

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, item.user.email))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0]) {
      userId = existingUser[0].id;
    } else {
      const [inserted] = await db
        .insert(users)
        .values(item.user)
        .returning({ id: users.id });
      if (!inserted) continue;
      userId = inserted.id;
    }

    pasienIds.push(userId);

    // Seed profil (idempoten)
    const existingProfil = await db
      .select({ id: profil.id })
      .from(profil)
      .where(eq(profil.userId, userId))
      .limit(1);

    if (existingProfil.length === 0) {
      await db.insert(profil).values({
        userId,
        ...item.profil,
      });
    }

    // Seed kebiasaan hari sebelumnya (idempoten)
    const existingKebiasaan = await db
      .select({ id: catatanKebiasaan.id })
      .from(catatanKebiasaan)
      .where(
        and(
          eq(catatanKebiasaan.pasienId, userId),
          eq(catatanKebiasaan.tanggal, item.kebiasaan.tanggal)
        )
      )
      .limit(1);

    if (existingKebiasaan.length === 0) {
      await db.insert(catatanKebiasaan).values({
        pasienId: userId,
        ...item.kebiasaan,
      });
    }
  }

  return { pasienIds };
}

