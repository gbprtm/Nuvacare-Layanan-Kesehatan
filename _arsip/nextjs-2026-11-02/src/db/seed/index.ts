/**
 * src/db/seed/index.ts
 * Skrip orkestrasi seed database fiktif (Tugas A13).
 * Memasukkan akun admin individual, dokter & slot contoh, serta pasien fiktif secara idempoten.
 */

import { seedAdmin } from "./admin";
import { seedKlinik } from "./klinik";
import { seedPasien } from "./pasien";
import { client } from "@/lib/db";

export async function runSeed() {
  console.log("🌱 Memulai seeding database...");

  const adminResult = await seedAdmin();
  console.log(`✅ Admin ter-seed: admin1 (${adminResult.admin1Id}), admin2 (${adminResult.admin2Id})`);

  const klinikResult = await seedKlinik();
  console.log(`✅ Klinik ter-seed: ${klinikResult.dokterIds.length} dokter, ${klinikResult.slotIds.length} slot`);

  const pasienResult = await seedPasien();
  console.log(`✅ Pasien ter-seed: ${pasienResult.pasienIds.length} pasien fiktif`);

  console.log("✨ Seeding database selesai secara idempoten!");
  return { success: true };
}

// Jalankan otomatis jika dipanggil langsung lewat CLI
if (require.main === module || process.argv[1]?.includes("seed")) {
  runSeed()
    .then(async () => {
      await client.end({ timeout: 5 });
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Gagal menjalankan seed:", err);
      await client.end({ timeout: 5 });
      process.exit(1);
    });
}
