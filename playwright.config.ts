// playwright.config.ts
import { defineConfig, devices } from "@playwright/test"

/**
 * E2E tests untuk Framic.
 * Jalankan: npm run test:e2e
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // Timeout per test
  timeout: 30_000,
  // Expect timeout
  expect: { timeout: 5_000 },
  // Jalankan test secara paralel
  fullyParallel: true,
  // Fail build di CI jika ada test.only yang tertinggal
  forbidOnly: !!process.env.CI,
  // Retry gagal di CI
  retries: process.env.CI ? 2 : 0,
  // Worker paralel di CI
  workers: process.env.CI ? 1 : undefined,
  // Reporter
  reporter: process.env.CI ? "github" : "html",

  use: {
    // Base URL — dev server harus jalan sebelum test
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    // Capture screenshot saat test gagal
    screenshot: "only-on-failure",
    // Capture trace saat retry pertama
    trace: "on-first-retry",
    // Locale Indonesia
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  },

  projects: [
    // Desktop browsers
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    // Mobile
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  // Jalankan dev server otomatis sebelum E2E test (local only)
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
