// src/middleware.ts
// Clerk auth middleware — proteksi semua route kecuali public routes
// Docs: https://clerk.com/docs/references/nextjs/clerk-middleware

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// ---------------------------------------------------------------------------
// Public routes — tidak perlu login
// ---------------------------------------------------------------------------
const isPublicRoute = createRouteMatcher([
  // Marketing pages
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Discovery — bisa dilihat tanpa login
  "/photographers(.*)",
  "/events(.*)",
  "/about",
  // API publik — list PG, detail, kalender, events, open recruitment
  "/api/photographers(.*)",
  "/api/events(.*)",
  // Xendit webhook — divalidasi via x-callback-token, bukan Clerk
  "/api/webhooks(.*)",
  // Health check
  "/api/health",
  // Scalar API docs (hanya tampil di dev)
  "/api/docs(.*)",
  "/api/openapi.json",
])

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export default clerkMiddleware(async (auth, req) => {
  // Semua route yang tidak cocok dengan isPublicRoute → wajib login
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  // matcher: [
  //   // Jalankan di semua route kecuali file statis dan _next internals
  //   "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  // ],
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
