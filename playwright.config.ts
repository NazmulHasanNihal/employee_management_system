import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e config (P11).
 * Runs against a running app (default http://localhost:3000). For CI, start the
 * app + DB first, or rely on `webServer` to boot `pnpm start` automatically.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Automatically boot the production server if BASE_URL isn't externally managed.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'pnpm start',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
