---
name: api-contracts
description: Loads Framic API endpoint contracts, request/response formats, auth requirements, and validation rules. Use when creating, modifying, or debugging API endpoints.
---

# Framic API Contracts

Baca `docs/API.md` untuk contracts lengkap (55 endpoints). Ringkasan di bawah untuk orientasi cepat.

## Base URL & Format
- Base URL: `/api`
- Semua endpoint JSON
- Auth: Clerk session (otomatis via middleware)

## Role Guard
```
[PUBLIC]       — tanpa login
[AUTH]         — semua role
[CUSTOMER]     — role customer
[PHOTOGRAPHER] — role photographer + verified
[MITRA]        — role mitra + verified
[ADMIN]        — role admin
```

## Response Format — Wajib Selalu Ini
```typescript
{ success: true, data: T }                                        // success
{ success: true, data: T[], meta: { total, page, limit, totalPages } } // paginated
{ success: false, error: string }                                 // error
```

## Domain & File Route Handler
```
users        → src/server/routes/users.ts
photographers → src/server/routes/photographers.ts
packages     → src/server/routes/packages.ts
mitra        → src/server/routes/mitra.ts
events       → src/server/routes/events.ts
contracts    → src/server/routes/contracts.ts
orders       → src/server/routes/orders.ts
payments     → src/server/routes/payments.ts
photos       → src/server/routes/photos.ts
reviews      → src/server/routes/reviews.ts
chat         → src/server/routes/chat.ts
disputes     → src/server/routes/disputes.ts
admin        → src/server/routes/admin.ts
```

## Endpoint Paling Kritis
```
GET  /api/photographers/:id/calendar → kalender derived, bukan dari tabel
POST /api/orders                     → cek kalender sebelum create
POST /api/webhooks/xendit            → validasi x-callback-token
POST /api/chat/:orderId/messages     → filter kontak sebelum INSERT
POST /api/contracts/:contractId/sign → generate MoU PDF jika kedua pihak sign
```

## Chat — Tidak Ada Pre/Post Order Distinction
Satu chat per order. Filter kontak wajib di server sebelum INSERT:
```typescript
import { filterContactInfo } from '@/lib/chat-filter'
const filtered = filterContactInfo(body.pesan)
```

## Untuk Detail Lengkap
Baca `docs/API.md` — cari section yang relevan dengan domain yang sedang dikerjakan.
