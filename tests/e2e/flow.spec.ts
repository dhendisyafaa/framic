// tests/e2e/flow.spec.ts
// E2E test suite menggunakan Playwright untuk skenario utama platform Framic.
// Jalankan dengan command: npm run test:e2e

import { test, expect } from "@playwright/test"

test.describe("Framic Public Flow Tests", () => {
  
  test("1. Landing Page - Title, brand logo, dan navigasi ter-render", async ({ page }) => {
    // Kunjungi beranda
    await page.goto("/")

    // Verifikasi Title mengandung Framic
    await expect(page).toHaveTitle(/Framic/)

    // Verifikasi keberadaan logo brand
    const brandLogo = page.locator("text=framic")
    await expect(brandLogo).toBeVisible()

    // Verifikasi menu navigasi utama ada (misal tautan cari fotografer)
    const explorerLink = page.locator("a[href='/photographers']")
    await expect(explorerLink).toBeVisible()
  })

  test("2. Katalog Fotografer - Filter dan daftar fotografer ter-render", async ({ page }) => {
    // Kunjungi halaman katalog fotografer
    await page.goto("/photographers")

    // Pastikan URL tujuan benar
    await expect(page).toHaveURL(/\/photographers/)

    // Verifikasi kolom pencarian/filter di katalog
    const searchInput = page.locator("input[placeholder*='Cari']")
    await expect(searchInput).toBeVisible()
  })

  test("3. Katalog Event/Mitra - Halaman event ter-render dengan baik", async ({ page }) => {
    // Kunjungi halaman event
    await page.goto("/events")

    // Pastikan URL tujuan benar
    await expect(page).toHaveURL(/\/events/)

    // Pastikan ada judul utama halaman event
    const heading = page.locator("h1")
    await expect(heading).toBeVisible()
  })

  test("4. Penanganan 404 / Halaman Tidak Ditemukan", async ({ page }) => {
    // Kunjungi rute acak yang tidak terdaftar
    await page.goto("/rute-acak-yang-pasti-tidak-ada")

    // Pastikan halaman menampilkan teks not found
    const notFoundText = page.locator("text=404")
    // Note: Jika menggunakan custom page atau default Next.js, pastikan ada indikator error/not found
    await expect(page.locator("body")).toContainText(/(tidak ditemukan|404)/i)
  })

})
