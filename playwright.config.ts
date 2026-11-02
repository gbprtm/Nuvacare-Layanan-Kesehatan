import { defineConfig, devices } from '@playwright/test';

/**
 * Konfigurasi Playwright untuk pengujian browser Laravel.
 * Sesuai ADR 0001: Menggunakan Google Chrome bawaan sistem (channel: 'chrome').
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.APP_URL || 'http://127.0.0.1:8000',
    channel: 'chrome',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: 'php artisan serve --port=8000',
    url: 'http://127.0.0.1:8000/up',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },
});

