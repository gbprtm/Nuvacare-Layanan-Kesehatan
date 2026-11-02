import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { client, db } from "@/lib/db";
import { katalogObatFornas } from "@/db/schema/pasien";

const nama = `abakavir-${randomUUID()}`;
const tanggalSnapshot = "2026-11-01";
let katalogId: string | undefined;

beforeAll(async () => {
  const [row] = await db
    .insert(katalogObatFornas)
    .values({
      namaIndonesia: nama,
      namaInternasional: "abacavir",
      sumberUrl: "https://e-fornas.kemkes.go.id/guest/daftar-obat",
      tanggalSnapshot,
      cakupanSnapshot: "A",
    })
    .returning({ id: katalogObatFornas.id });

  if (!row) throw new Error("Fixture katalog Fornas gagal dibuat.");
  katalogId = row.id;
});

afterAll(async () => {
  if (katalogId) await db.delete(katalogObatFornas).where(eq(katalogObatFornas.id, katalogId));
  await client.end({ timeout: 5 });
});

describe("katalog obat Fornas", () => {
  it("menyimpan metadata snapshot dan mencegah nama ganda dalam snapshot", async () => {
    const [row] = await db
      .select()
      .from(katalogObatFornas)
      .where(eq(katalogObatFornas.id, katalogId as string))
      .limit(1);

    expect(row?.sumber).toBe("fornas");
    expect(row?.cakupanSnapshot).toBe("A");
    expect(row?.sumberUrl).toBe("https://e-fornas.kemkes.go.id/guest/daftar-obat");

    let errorCode: string | undefined;
    let currentError: unknown;
    try {
      await db.insert(katalogObatFornas).values({
        namaIndonesia: nama,
        namaInternasional: "abacavir",
        sumberUrl: "https://e-fornas.kemkes.go.id/guest/daftar-obat",
        tanggalSnapshot,
        cakupanSnapshot: "A",
      });
    } catch (error) {
      currentError = error;
      for (let attempt = 0; attempt < 5 && currentError; attempt += 1) {
        if (typeof currentError === "object" && currentError !== null) {
          const candidate = currentError as { code?: string; cause?: unknown };
          if (candidate.code) {
            errorCode = candidate.code;
            break;
          }
          currentError = candidate.cause;
        } else {
          break;
        }
      }
    }

    expect(errorCode).toBe("23505");
  });
});
