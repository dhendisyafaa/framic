// src/config/posthog.ts
// PostHog analytics config — user behavior, funnel, session recording
// Docs: https://posthog.com/docs/libraries/next-js

import posthog from "posthog-js"

// ---------------------------------------------------------------------------
// Client-side init — panggil sekali di layout atau provider
// ---------------------------------------------------------------------------

/**
 * Inisialisasi PostHog di client-side.
 * Panggil di root layout atau client provider.
 * Hanya jalan di browser (bukan SSR).
 */
export function initPostHog(): void {
  if (typeof window === "undefined") return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com"

  if (!key) {
    console.warn("[PostHog] NEXT_PUBLIC_POSTHOG_KEY belum diset — analytics nonaktif")
    return
  }

  posthog.init(key, {
    api_host: host,
    // Capture page views otomatis
    capture_pageview: true,
    // Disable di development agar event tidak masuk ke production
    loaded: (ph) => {
      if (process.env.NODE_ENV !== "production") {
        ph.opt_out_capturing()
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Server-side — PostHog Node client (untuk event dari API routes)
// ---------------------------------------------------------------------------

import { PostHog } from "posthog-node"

let _serverPostHog: PostHog | null = null

/**
 * Dapatkan PostHog Node client untuk server-side event tracking.
 * Lazy-initialized — hanya dibuat saat pertama kali dipanggil.
 */
export function getServerPostHog(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com"

  if (!key) return null

  if (!_serverPostHog) {
    _serverPostHog = new PostHog(key, { host })
  }

  return _serverPostHog
}

// ---------------------------------------------------------------------------
// Event names — konstanta untuk konsistensi nama event
// ---------------------------------------------------------------------------
export const POSTHOG_EVENTS = {
  ORDER_CREATED: "order_created",
  ORDER_CONFIRMED: "order_confirmed",
  DP_PAID: "dp_paid",
  SETTLEMENT_PAID: "settlement_paid",
  ORDER_COMPLETED: "order_completed",
  ORDER_CANCELLED: "order_cancelled",
  DISPUTE_RAISED: "dispute_raised",
  PHOTOGRAPHER_APPLIED: "photographer_applied",
  MITRA_APPLIED: "mitra_applied",
} as const

export { posthog }
