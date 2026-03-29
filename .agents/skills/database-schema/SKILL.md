---
name: database-schema
description: Loads Framic database schema, entity relationships, enum definitions, and Drizzle ORM patterns. Use when creating or modifying database schema, writing queries, or working with migrations.
---

# Framic Database Schema

Baca `docs/DATABASE.md` untuk schema lengkap. Ringkasan di bawah untuk orientasi cepat.

## 14 Entitas

| Tabel | Keterangan |
|-------|-----------|
| `users` | Bridge Clerk ↔ DB. Hanya simpan `clerk_id` |
| `customer_profiles` | Data spesifik customer |
| `photographer_profiles` | Data PG — tidak ada `active_mitra_id` |
| `mitra_profiles` | Data mitra |
| `packages` | Paket harga PG independen |
| `mitra_photographers` | Kontrak anggota tetap PG ↔ mitra |
| `events` | Event yang dibuat mitra |
| `event_photographers` | Assignment PG tetap + kontrak PG per-event |
| `orders` | Transaksi pemesanan |
| `payments` | DP + pelunasan per order |
| `photos` | Hasil foto per order |
| `reviews` | Ulasan customer |
| `disputes` | Dokumentasi dispute |
| `messages` | Pesan chat per order |

## Konvensi Wajib
- Primary key: selalu `uuid`
- Setiap tabel wajib `created_at` dan `updated_at`
- FK ke user: gunakan `clerk_id` (text), bukan uuid
- Enum: gunakan PostgreSQL native enum

## Kalender Ketersediaan — Tidak Ada Tabel Terpisah!
Di-derive dari dua query:
```typescript
// 1. Block dari event mitra
event_photographers JOIN events → tanggal_mulai, tanggal_selesai

// 2. Block dari order aktif
orders WHERE status IN ['confirmed', 'dp_paid', 'ongoing']
```

## Pattern Drizzle
```typescript
// Koneksi
import { drizzle } from 'drizzle-orm/postgres-js'
const db = drizzle(client, { schema })

// Transaction (wajib untuk multi-table)
await db.transaction(async (tx) => { ... })

// Query
await db.select().from(table).where(eq(table.id, id))
```

## Untuk Detail Lengkap
Baca `docs/DATABASE.md` — terutama Section 3 (Schema Detail) dan Section 2 (Enum Definitions).
