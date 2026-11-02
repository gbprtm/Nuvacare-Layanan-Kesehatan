import { existsSync } from "node:fs";

// Uji database butuh kredensial asli. Muat .env bila variabel belum ada,
// lalu gagal cepat bila yang tersedia hanya URL mock dari vitest.config.ts.
if (!process.env.DATABASE_URL && existsSync(".env")) {
  process.loadEnvFile(".env");
}

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("postgres://mock")) {
  throw new Error(
    "Uji database butuh DATABASE_URL asli. Isi .env atau jalankan dengan --env-file."
  );
}
