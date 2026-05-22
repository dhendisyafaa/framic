"use client"

import posthog from "posthog-js"
import { PostHogProvider as Provider } from "posthog-js/react"

if (typeof window !== "undefined") {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com"

  if (key) {
    posthog.init(key, {
      api_host: host,
      capture_pageview: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV !== "production") {
          ph.opt_out_capturing()
        }
      },
    })
  } else {
    console.warn("[PostHog] NEXT_PUBLIC_POSTHOG_KEY belum diset — analytics nonaktif")
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <Provider client={posthog}>{children}</Provider>
}
