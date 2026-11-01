import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Konfigurasi terpisah untuk uji yang menembak PostgreSQL sungguhan.
// Berbeda dari vitest.config.ts, berkas ini TIDAK mengisi DATABASE_URL palsu,
// sehingga uji hanya berjalan bila .env berisi kredensial Neon yang sah.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    include: [
      "src/**/*.db.test.ts",
      "tests/integration/auth/**/*.db.test.ts",
    ],
    setupFiles: ["./tests/setup-db.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
