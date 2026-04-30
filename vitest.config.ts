// vitest.config.ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    // Simulasi browser DOM — wajib untuk test React components
    environment: "jsdom",
    // Aktifkan globals: describe, it, expect, dll. tanpa import
    globals: true,
    // Setup file yang dijalankan sebelum setiap test suite
    setupFiles: ["./tests/unit/setup.ts"],
    // Exclude E2E tests dari Vitest (dihandle Playwright)
    exclude: ["**/node_modules/**", "**/tests/e2e/**"],
    // Coverage report
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "src/app/api/",
        "*.config.*",
        "src/db/migrations/",
      ],
    },
  },
  resolve: {
    // Harus sama dengan tsconfig paths
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
