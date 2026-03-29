# Framic — Technical Design Document

> **Version:** 2.0  
> **Last Updated:** March 2026  
> **Status:** Active  
> This document defines the technical architecture, stack, folder structure, and coding conventions for Framic. All AI assistants and developers must follow this document strictly.

---

## 1. Tech Stack

| Layer                | Technology                                | Version | Purpose                                    |
| -------------------- | ----------------------------------------- | ------- | ------------------------------------------ |
| **Framework**        | Next.js                                   | 16.x    | Frontend + API (App Router)                |
| **API Layer**        | Hono.js                                   | 4.x     | Centralized API routes inside Next.js      |
| **Language**         | TypeScript                                | 5.x     | Strict mode, no `any` allowed              |
| **Auth**             | Clerk                                     | 7.x     | Authentication, multi-role, custom UI      |
| **Database**         | PostgreSQL (Docker local / Supabase prod) | 15.x    | Relational database                        |
| **ORM**              | Drizzle ORM                               | latest  | Type-safe schema + migrations              |
| **Realtime**         | Supabase Realtime                         | latest  | Chat realtime (subscribe ke INSERT events) |
| **Storage**          | Cloudinary                                | latest  | Foto hasil order, portofolio, MoU PDF      |
| **Payment**          | Xendit (xenPlatform)                      | latest  | DP, pelunasan, split payment otomatis      |
| **Email**            | Resend + React Email                      | latest  | Notifikasi transaksional                   |
| **Error Monitoring** | Sentry                                    | latest  | Real-time error tracking                   |
| **Analytics**        | PostHog                                   | latest  | User behavior, funnel, session recording   |
| **API Docs**         | Scalar                                    | latest  | Auto-generated docs dari Hono              |
| **Data Fetching**    | TanStack Query (React Query)              | 5.x     | Client-side caching, mutations, dashboard  |
| **UI Components**    | shadcn/ui + React Bits                    | latest  | Komponen fungsional + animasi              |
| **Testing**          | Vitest + Playwright                       | latest  | Unit test + E2E test                       |
| **Deploy**           | Vercel                                    | -       | Serverless deployment                      |
| **Dev Database**     | Docker + PostgreSQL 15                    | -       | Local development only                     |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                    │
│              Next.js App Router (React)              │
│         Supabase Realtime (chat subscription)        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────┐
│              Next.js API Routes                      │
│         /src/app/api/[[...route]]/route.ts           │
│                  (Hono.js)                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Auth (Clerk)│  │ Drizzle ORM  │  │  Cloudinary│  │
│  └─────────────┘  └──────┬───────┘  └────────────┘  │
│                          │                           │
└──────────────────────────┼──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│              PostgreSQL Database                     │
│     (Docker local / Supabase staging+prod)           │
│         Supabase Realtime listens here               │
└─────────────────────────────────────────────────────┘
```

### Prinsip Arsitektur

- **Monorepo** — frontend dan backend dalam satu project Next.js
- **API terpusat** — semua endpoint Hono ada di satu entry point
- **Type-safe end-to-end** — schema Drizzle → TypeScript types → API → UI
- **Serverless-first** — tidak ada server stateful, semua via Vercel Functions
- **Realtime via Supabase** — bukan Socket.io, kompatibel dengan Vercel serverless
- **Data Fetching Pattern** — Server Components untuk SEO/halaman publik, TanStack Query untuk dashboard/interaktivitas

### Data Fetching Pattern

Untuk performa dan UX yang optimal, Framic menggunakan dua pola:

1.  **Server Components (Server-side)**:
    -   Digunakan untuk: Landing page, list fotografer publik, detail profil fotografer, list event.
    -   Alasan: SEO, initial load cepat, data jarang berubah secara instan.
2.  **TanStack Query (Client-side)**:
    -   Digunakan untuk: Dashboard kustomer/PG/mitra, status order realtime, proses booking (mutations), form submission.
    -   Alasan: Caching, loading state UI yang halus, optimistic updates, sinkronisasi data antar tab.

---

## 3. Folder Structure

```
framic/
├── docs/                          # Dokumentasi project
│   ├── PRD.md
│   ├── TECHNICAL.md
│   ├── DATABASE.md
│   └── API.md
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Route group: halaman auth (Clerk)
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (dashboard)/           # Route group: halaman setelah login
│   │   │   ├── dashboard/
│   │   │   ├── orders/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── (marketing)/           # Route group: halaman publik
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── photographers/
│   │   │   └── events/
│   │   ├── api/
│   │   │   └── [[...route]]/
│   │   │       └── route.ts       # Entry point semua Hono routes
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/                # Shared UI components
│   │   ├── ui/                    # shadcn/ui components (auto-generated)
│   │   ├── common/                # Reusable components buatan sendiri
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── ...
│   │   └── features/              # Feature-specific components
│   │       ├── photographer/
│   │       ├── order/
│   │       ├── payment/
│   │       ├── chat/
│   │       ├── calendar/          # Kalender ketersediaan PG (Photografer)
│   │       ├── mitra/
│   │       ├── event/
│   │       └── ...
│   │
│   ├── db/                        # Database layer
│   │   ├── index.ts               # Drizzle client
│   │   ├── schema/                # Schema per entitas
│   │   │   ├── enums.ts
│   │   │   ├── user.ts
│   │   │   ├── photographer.ts
│   │   │   ├── mitra.ts
│   │   │   ├── package.ts
│   │   │   ├── mitra-photographer.ts
│   │   │   ├── event.ts
│   │   │   ├── event-photographer.ts
│   │   │   ├── order.ts
│   │   │   ├── payment.ts
│   │   │   ├── photo.ts
│   │   │   ├── review.ts
│   │   │   ├── dispute.ts
│   │   │   ├── message.ts
│   │   │   └── index.ts           # Re-export semua schema
│   │   └── migrations/            # Auto-generated oleh Drizzle Kit
│   │
│   ├── server/                    # Server-side logic (Hono)
│   │   ├── index.ts               # Hono app instance
│   │   ├── middleware/
│   │   │   ├── auth.ts            # Clerk auth middleware
│   │   │   ├── error-handler.ts
│   │   │   └── logger.ts
│   │   └── routes/
│   │       ├── users.ts
│   │       ├── photographers.ts
│   │       ├── packages.ts
│   │       ├── mitra.ts
│   │       ├── events.ts
│   │       ├── orders.ts
│   │       ├── payments.ts
│   │       ├── photos.ts
│   │       ├── reviews.ts
│   │       ├── chat.ts
│   │       └── disputes.ts
│   │
│   ├── lib/                       # Utility libraries & integrations
│   │   ├── clerk.ts               # Clerk client config
│   │   ├── cloudinary.ts          # Cloudinary config + upload helpers
│   │   ├── xendit.ts              # Xendit client + payment helpers
│   │   ├── resend.ts              # Resend email client
│   │   ├── supabase.ts            # Supabase client (untuk Realtime)
│   │   ├── sentry.ts              # Sentry config
│   │   ├── chat-filter.ts         # Filter nomor telepon + email di chat
│   │   ├── calendar.ts            # Helper derive kalender ketersediaan PG
│   │   ├── mou-generator.ts       # Generate PDF MoU dari template
│   │   └── utils.ts               # General utilities (cn, formatRupiah, dll.)
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-user.ts
│   │   ├── use-order.ts
│   │   ├── use-chat.ts            # Hook untuk Supabase Realtime chat
│   │   ├── use-calendar.ts        # Hook untuk kalender ketersediaan PG
│   │   └── ...
│   │
│   ├── types/                     # Global TypeScript types
│   │   ├── index.ts
│   │   └── api.ts
│   │
│   └── config/                    # App-wide configuration
│       ├── constants.ts           # Magic numbers, enum values
│       └── site.ts                # Site metadata
│
├── public/                        # Static assets
├── tests/
│   ├── unit/                      # Vitest unit tests
│   └── e2e/                       # Playwright E2E tests
│
├── .env.local                     # Local dev environment variables
├── .env.example                   # Template env vars (commit ini)
├── docker-compose.yml             # PostgreSQL local dev
├── drizzle.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Environment Variables

```bash
# .env.local — JANGAN di-commit ke Git

# Database
DATABASE_URL=postgresql://dhendi:postgres@localhost:5432/framic_dev

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase (untuk Realtime chat)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Xendit
XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=

# Resend
RESEND_API_KEY=

# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 5. API Structure (Hono)

```typescript
// src/app/api/[[...route]]/route.ts
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { usersRouter } from "@/server/routes/users";
import { photographersRouter } from "@/server/routes/photographers";
// ... semua router

const app = new Hono().basePath("/api");

app.route("/users", usersRouter);
app.route("/photographers", photographersRouter);
// ... register semua router

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
```

### URL Pattern

```
GET    /api/photographers              → list fotografer
GET    /api/photographers/:id          → detail fotografer
GET    /api/photographers/:id/calendar → kalender ketersediaan (derived)
POST   /api/photographers              → create profil
PATCH  /api/photographers/me           → update profil

GET    /api/events                     → list event published
GET    /api/events/open                → list event open recruitment
GET    /api/events/:id                 → detail event
POST   /api/events                     → mitra buat event

GET    /api/orders                     → list order (by role)
POST   /api/orders                     → buat order
PATCH  /api/orders/:id/confirm         → PG konfirmasi
PATCH  /api/orders/:id/deliver         → PG mark delivered
PATCH  /api/orders/:id/complete        → customer konfirmasi

POST   /api/payments/:orderId/dp       → bayar DP
POST   /api/payments/:orderId/settle   → bayar pelunasan
POST   /api/webhooks/xendit            → webhook Xendit

GET    /api/chat/:orderId              → history pesan
POST   /api/chat/:orderId/messages     → kirim pesan (dengan filter kontak)
```

---

## 6. Chat Implementation (Supabase Realtime)

### Mengapa Supabase Realtime, bukan Socket.io

Vercel adalah platform serverless — koneksi WebSocket persistent tidak kompatibel. Supabase Realtime menggunakan PostgreSQL LISTEN/NOTIFY yang dikelola Supabase, bukan oleh server kita.

### Server Side (Hono) — Simpel

```typescript
// POST /api/chat/:orderId/messages
// Server hanya INSERT ke database, Supabase yang handle push ke client

import { filterContactInfo } from "@/lib/chat-filter";

const filteredPesan = filterContactInfo(body.pesan);
await db.insert(messages).values({
  orderId,
  senderClerkId: userId,
  pesan: filteredPesan, // sudah difilter sebelum disimpan
  isRead: false,
});
// Tidak perlu emit apapun — Supabase Realtime handle push otomatis
```

### Client Side (React Hook)

```typescript
// src/hooks/use-chat.ts
import { createClient } from '@supabase/supabase-js'

export function useChat(orderId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient(...)

  useEffect(() => {
    // Load existing messages
    fetchMessages(orderId).then(setMessages)

    // Subscribe ke pesan baru
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `order_id=eq.${orderId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [orderId])

  return { messages }
}
```

### Filter Kontak

```typescript
// src/lib/chat-filter.ts

const CONTACT_PATTERNS = [
  // Nomor telepon Indonesia — minimal 10 digit setelah prefix
  /((\+62|62)[0-9]{9,12}|0[0-9]{9,11})/g,
  // Email
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
];

const REPLACEMENT = "[informasi kontak disembunyikan]";

export function filterContactInfo(pesan: string): string {
  let filtered = pesan;
  for (const pattern of CONTACT_PATTERNS) {
    filtered = filtered.replace(pattern, REPLACEMENT);
  }
  return filtered;
}
```

---

## 7. Kalender Ketersediaan PG (Derived)

Tidak ada tabel terpisah. Di-derive dari dua sumber:

```typescript
// src/lib/calendar.ts

export async function getPhotographerBlockedDates(photographerId: string) {
  // Sumber 1: ter-block karena event mitra
  const blockedByEvents = await db
    .select({
      tanggalMulai: events.tanggalMulai,
      tanggalSelesai: events.tanggalSelesai,
    })
    .from(eventPhotographers)
    .innerJoin(events, eq(eventPhotographers.eventId, events.id))
    .where(eq(eventPhotographers.photographerId, photographerId));

  // Sumber 2: ter-block karena order aktif
  const blockedByOrders = await db
    .select({ tanggalPotret: orders.tanggalPotret })
    .from(orders)
    .where(
      and(
        eq(orders.photographerId, photographerId),
        inArray(orders.status, ["confirmed", "dp_paid", "ongoing"]),
      ),
    );

  return { blockedByEvents, blockedByOrders };
}
```

---

## 8. Auth Pattern (Clerk)

### Middleware

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/photographers(.*)",
  "/events(.*)",
  "/api/photographers(.*)",
  "/api/events(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect();
});
```

### Role Check

```typescript
// Role disimpan di Clerk publicMetadata: { roles: ['customer', 'photographer'] }
const user = await currentUser();
const roles = (user?.publicMetadata?.roles as string[]) ?? ["customer"];
const isPhotographer = roles.includes("photographer");
const isMitra = roles.includes("mitra");
```

---

## 9. Database Pattern (Drizzle)

### Koneksi

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

### Transaction Pattern

```typescript
// Gunakan transaction untuk operasi yang mengubah lebih dari satu tabel
await db.transaction(async (tx) => {
  await tx
    .update(orders)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(orders.id, orderId));
  await tx
    .update(payments)
    .set({ statusPelunasan: "paid", tanggalPelunasan: new Date() })
    .where(eq(payments.orderId, orderId));
});
```

---

## 10. Payment Flow (Xendit)

### DP Flow

```
1. Customer klik "Bayar DP"
2. POST /api/payments/:orderId/dp
3. Server buat Xendit invoice — jumlah 50% dari total_harga
4. Return invoice URL ke client
5. Customer redirect ke Xendit payment page
6. Xendit kirim webhook → POST /api/webhooks/xendit
7. Server update payment.statusDp = 'paid'
8. Server update order.status = 'dp_paid'
9. Trigger notifikasi email ke customer dan PG
```

### Split Payment (xenPlatform)

```
Order via PG Independen:
total_harga
├── Platform (10%): masuk ke akun Framic
└── PG (90%): masuk ke akun PG

Order via Event Mitra:
total_harga
├── Platform (10%): masuk ke akun Framic
├── Mitra (X%): masuk ke akun Mitra
└── PG (Y%): masuk ke akun PG
(X% + Y% = 90%, ditentukan saat MoU)
```

### Webhook Handler

```typescript
// POST /api/webhooks/xendit
// Validasi x-callback-token dari Xendit
// Parse external_id: "framic_order_{orderId}_{dp|settle}"
// Update payment + order status
// Trigger split payment jika pelunasan
```

---

## 11. MoU Generation

```typescript
// src/lib/mou-generator.ts
// Generate PDF MoU dari template, upload ke Cloudinary
// Return URL PDF yang tersimpan

export async function generateMouMitra(
  contractData: MouMitraData,
): Promise<string>;
export async function generateMouPerEvent(
  contractData: MouEventData,
): Promise<string>;
```

E-sign disimpan sebagai metadata:

```typescript
{
  mouGeneratedUrl: string,        // URL PDF di Cloudinary
  photographerSignedAt: Date,     // timestamp e-sign
  mitraSignedAt: Date,
  photographerIp: string,         // IP address saat tanda tangan
  mitraIp: string,
}
```

---

## 12. Coding Conventions

### TypeScript — Strict, No Any

```typescript
// ❌ DILARANG
const data: any = response;
function process(param: any) {}

// ✅ WAJIB
const data: OrderResponse = response;
function process(param: CreateOrderInput) {}
```

### Zod untuk Validasi Input

```typescript
import { z } from "zod";
const CreateOrderSchema = z.object({
  photographerId: z.string().uuid(),
  tanggalPotret: z.string().datetime(),
  lokasi: z.string().min(10),
});
```

### Naming Convention

```
Variables & functions : camelCase       → userId, createOrder()
Components            : PascalCase      → OrderCard, PhotographerProfile
Files (components)    : kebab-case      → order-card.tsx
Files (utils/hooks)   : kebab-case      → use-order.ts, chat-filter.ts
Database tables       : snake_case      → photographer_profiles
Database columns      : snake_case      → created_at, photographer_id
Constants             : SCREAMING_SNAKE → DP_PERCENTAGE, MAX_UPLOAD_SIZE
```

### API Response Format

```typescript
// Success
{ success: true, data: T }

// Success + pagination
{ success: true, data: T[], meta: { total, page, limit, totalPages } }

// Error
{ success: false, error: string }
```

### Error Handling

```typescript
try {
  const data = await db.query.orders.findMany();
  return c.json({ success: true, data });
} catch (error) {
  return c.json({ success: false, error: "Failed to fetch orders" }, 500);
}
```

---

## 13. Scripts

```bash
npm run dev           # Next.js dev server dengan Turbopack
npm run build         # Production build
npm run start         # Jalankan production build
npm run lint          # ESLint check
npm run db:generate   # Generate migration dari schema changes
npm run db:migrate    # Jalankan migration
npm run db:push       # Dev only — push langsung tanpa migration file
npm run db:studio     # Drizzle Studio (GUI database)
npm run test          # Vitest unit tests
npm run test:e2e      # Playwright E2E tests
```

---

## 14. Development Workflow

### Sebelum Mulai Coding

1. Baca `PRD.md` untuk requirement fitur
2. Baca `DATABASE.md` untuk schema yang terlibat
3. Baca `API.md` untuk endpoint yang dibutuhkan
4. Baru mulai coding

### Git Convention

```
feat:     menambahkan fitur baru
fix:      memperbaiki bug
chore:    update dependency, config
docs:     update dokumentasi
refactor: refactor tanpa ubah behavior
test:     menambahkan test
```

### Ketika Ada Keputusan Baru

1. Update dokumen yang relevan DULU
2. Baru implementasi di kode
3. Jangan coding hal yang belum terdokumentasi

---

_Dokumen ini adalah kontrak teknis antara developer dan AI assistant. Semua keputusan di luar dokumen ini harus didiskusikan dan didokumentasikan terlebih dahulu._
