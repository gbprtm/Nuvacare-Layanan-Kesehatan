import { defineConfig, devices } from "@playwright/test";

/**
 * Konfigurasi Playwright untuk pengujian end-to-end (E2E), sistem, dan keamanan.
 * Dikonfigurasi menggunakan browser Chrome bawaan sistem (channel: 'chrome')
 * sehingga tidak memerlukan unduhan biner Chromium tambahan.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.APP_URL || "http://localhost:3000",
    channel: "chrome",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
