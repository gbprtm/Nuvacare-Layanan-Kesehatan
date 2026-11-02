import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
      "./src/db/schema/auth.ts",
      "./src/db/schema/klinik.ts",
      "./src/db/schema/pasien.ts",
    ],
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
});
