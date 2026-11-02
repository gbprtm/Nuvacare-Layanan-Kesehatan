import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "node:test": "vitest",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/**/*.spec.ts", "**/*.db.test.ts", "node_modules/**", ".next/**"],
    env: {
      DATABASE_URL: "postgres://mock:mock@localhost:5432/mock",
      DATABASE_URL_UNPOOLED: "postgres://mock:mock@localhost:5432/mock",
      SESSION_SECRET: "test-secret-at-least-32-characters-long-key-mock",
      APP_URL: "http://localhost:3000",
      NODE_ENV: "test",
    },
  },
});
