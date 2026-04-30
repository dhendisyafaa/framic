// sentry.server.config.ts
// Konfigurasi Sentry untuk server-side (Next.js API routes, Server Components)
// File ini di-import otomatis oleh Next.js instrumentasi
// Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Sampling rate untuk transaksi server
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Hanya aktif di production
  enabled: process.env.NODE_ENV === "production",
})
