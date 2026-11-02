import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";

declare global {
  var __db_client: postgres.Sql | undefined;
}

// Singleton connection client untuk serverless environment & hot reload
const client =
  globalThis.__db_client ||
  postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: "require",
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__db_client = client;
}

export const db = drizzle(client);
export { client };

