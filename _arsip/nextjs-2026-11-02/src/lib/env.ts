import { z } from "zod";
import { ConfigurationError } from "./errors";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi (URL PostgreSQL Neon dengan pooling)"),
  DATABASE_URL_UNPOOLED: z.string().min(1, "DATABASE_URL_UNPOOLED wajib diisi (URL PostgreSQL Neon direct)"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET wajib diisi minimal 32 karakter untuk keamanan sesi JWT"),
  APP_URL: z.string().url("APP_URL harus berupa URL yang valid (contoh: http://localhost:3000)"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  // Lewati validasi ketat hanya bila secara eksplisit diminta saat build/CI tanpa database
  if (process.env.SKIP_ENV_VALIDATION === "true" || process.env.NEXT_PHASE === "phase-production-build") {
    const raw = {
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://mock:mock@localhost:5432/mock",
      DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED || "postgresql://mock:mock@localhost:5432/mock",
      SESSION_SECRET: process.env.SESSION_SECRET || "default_development_secret_key_at_least_32_chars_long",
      APP_URL: process.env.APP_URL || "http://localhost:3000",
      NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") || "development",
    };
    return raw;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new ConfigurationError(
      `Variabel lingkungan tidak valid atau belum diatur:\n${errorDetails}\n\nSilakan periksa berkas .env Anda atau rujuk ke .env.example.`
    );
  }

  return result.data;
}

export const env = parseEnv();
