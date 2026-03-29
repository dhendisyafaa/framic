// tests/e2e/example.spec.ts
// Placeholder E2E test — hapus saat sudah ada test nyata
// Jalankan: npm run test:e2e

import { test, expect } from "@playwright/test"

test("halaman utama dapat diakses", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/Framic/)
})
