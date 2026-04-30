/**
 * Mendapatkan base URL untuk fetch di server-side (Server Components).
 * Otomatis mendeteksi environment Vercel atau Local.
 */
export function getBaseUrl() {
  if (typeof window !== "undefined") return "" // browser can use relative urls
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT || 3000}`
}
