---
name: tech-conventions
description: Loads Framic technical architecture, folder structure, coding patterns, and integration guides. Use when setting up new files, configuring integrations, or unsure about architectural decisions.
---

# Framic Technical Conventions

Baca `docs/TECHNICAL.md` untuk detail lengkap. Ringkasan di bawah untuk orientasi cepat.

## Stack Ringkas
```
Next.js 16 + Hono.js    → Framework + API
TypeScript strict        → NO any, EVER
Clerk                    → Auth + multi-role
PostgreSQL + Drizzle     → Database + ORM
Supabase Realtime        → Chat realtime (BUKAN Socket.io)
Cloudinary               → Storage foto + MoU PDF
Xendit xenPlatform       → Payment + split
Resend + React Email     → Email
Vercel                   → Deploy (serverless)
```

## Folder Structure Penting
```
src/app/api/[[...route]]/route.ts  → Entry point SEMUA Hono routes
src/db/schema/                      → 14 file schema (satu per entitas)
src/server/routes/                  → Satu file per domain API
src/lib/chat-filter.ts              → Filter nomor telepon + email
src/lib/calendar.ts                 → Derive kalender ketersediaan PG
src/lib/mou-generator.ts            → Generate PDF MoU
src/lib/supabase.ts                 → Supabase client untuk Realtime
src/hooks/use-chat.ts               → Hook Supabase Realtime
```

## Hono Entry Point Pattern
```typescript
// src/app/api/[[...route]]/route.ts
const app = new Hono().basePath('/api')
app.route('/users', usersRouter)
app.route('/photographers', photographersRouter)
// ...
export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
```

## Supabase Realtime (Chat)
```typescript
// Client subscribe — tidak perlu emit dari server
const channel = supabase
  .channel(`order-${orderId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `order_id=eq.${orderId}`
  }, (payload) => setMessages(prev => [...prev, payload.new]))
  .subscribe()
```

## Clerk Auth Pattern
```typescript
// Middleware: src/middleware.ts
export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect()
})

// Di route handler
const { userId } = auth()
const user = await currentUser()
const roles = user?.publicMetadata?.roles as string[] ?? ['customer']
```

## Environment Variables Wajib Ada
```
DATABASE_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, XENDIT_SECRET_KEY,
XENDIT_WEBHOOK_TOKEN, RESEND_API_KEY, SENTRY_DSN
```

## Untuk Detail Lengkap
Baca `docs/TECHNICAL.md` — terutama Section 6 (Chat), Section 7 (Kalender), Section 8 (Auth), Section 9 (Database).
