import { db } from "@/lib/db";
import { users } from "@/db/schema/auth";
import { hashPassword } from "@/modules/auth/password";
import { eq } from "drizzle-orm";

export interface SeedAdminResult {
  admin1Id: string;
  admin2Id: string;
}

export async function seedAdmin(): Promise<SeedAdminResult> {
  const defaultPassword = "AdminKlinik2026!";
  const passwordHash = await hashPassword(defaultPassword);

  const adminAccounts = [
    {
      name: "Staf Admin Satu (Fiktif)",
      email: "admin1@klinik-sehat.local",
      passwordHash,
      role: "admin" as const,
    },
    {
      name: "Staf Admin Dua (Fiktif)",
      email: "admin2@klinik-sehat.local",
      passwordHash,
      role: "admin" as const,
    },
  ];

  const ids: string[] = [];

  for (const acc of adminAccounts) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, acc.email))
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      ids.push(existing[0].id);
    } else {
      const [inserted] = await db
        .insert(users)
        .values(acc)
        .returning({ id: users.id });
      if (inserted) {
        ids.push(inserted.id);
      }
    }
  }

  return {
    admin1Id: ids[0] ?? "",
    admin2Id: ids[1] ?? "",
  };
}

