import { readFile } from "node:fs/promises";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, client } from "@/lib/db";
import { katalogObatFornas } from "@/db/schema/pasien";

const snapshotSchema = z.array(z.tuple([z.string().trim().min(1), z.string().trim().min(1)])).min(1);
const source = "fornas";
const sourceUrl = "https://e-fornas.kemkes.go.id/guest/daftar-obat";
const snapshotVersion = "2026-11-01-A";
const snapshotDate = "2026-11-01";
const coverage = "A";

async function main(): Promise<void> {
  const raw = await readFile("data/fornas/2026-11-01-A.json", "utf8");
  const entries = snapshotSchema.parse(JSON.parse(raw));
  const rows = entries.map(([namaIndonesia, namaInternasional]) => ({
    namaIndonesia,
    namaInternasional,
    sumber: source,
    sumberUrl: sourceUrl,
    versiSnapshot: snapshotVersion,
    tanggalSnapshot: snapshotDate,
    cakupanSnapshot: coverage,
  }));

  await db.transaction(async (transaction) => {
    await transaction
      .delete(katalogObatFornas)
      .where(eq(katalogObatFornas.versiSnapshot, snapshotVersion));
    await transaction.insert(katalogObatFornas).values(rows);
  });

  console.log(`Imported ${rows.length} Fornas snapshot records (${coverage}).`);
}

void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.end({ timeout: 5 }));
