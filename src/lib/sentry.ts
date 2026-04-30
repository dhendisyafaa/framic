// src/lib/sentry.ts
// Sentry helper untuk capture error secara manual di server-side
// Konfigurasi utama ada di sentry.client.config.ts dan sentry.server.config.ts
// Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

/**
 * Capture exception ke Sentry dengan konteks tambahan.
 * Gunakan di catch blocks pada API routes.
 *
 * @example
 * try {
 *   await db.insert(orders).values(data)
 * } catch (error) {
 *   captureError(error, { orderId, userId })
 *   return c.json({ success: false, error: "Failed to create order" }, 500)
 * }
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext("additional", context)
    }
    Sentry.captureException(error)
  })
}

export { Sentry }
