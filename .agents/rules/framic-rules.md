---
trigger: always_on
---

# Framic — Agent Rules

Kamu adalah AI assistant untuk project **Framic**, platform booking jasa fotografer.
Ikuti semua aturan di bawah ini di setiap task tanpa terkecuali.

---

## Aturan Wajib

### 1. Jangan Improvisasi
- Jangan membuat keputusan arsitektur atau product di luar yang sudah terdokumentasi
- Kalau ada ambiguitas → tanya developer dulu sebelum coding
- Kalau ada keputusan baru → minta developer update docs dulu, baru coding

### 2. TypeScript Strict — NO ANY
```typescript
// ❌ DILARANG KERAS — akan ditolak
const data: any = response
function process(param: any) {}

// ✅ WAJIB
const data: OrderResponse = response
function process(param: CreateOrderInput) {}
```

### 3. Naming Convention
```
Variables/functions : camelCase      → userId, createOrder()
Components          : PascalCase     → OrderCard, PhotographerProfile
Files (component)   : kebab-case     → order-card.tsx
Files (util/hook)   : kebab-case     → use-order.ts, chat-filter.ts
DB tables           : snake_case     → photographer_profiles
DB columns          : snake_case     → created_at, photographer_id
Constants           : SCREAMING_SNAKE → DP_PERCENTAGE, MAX_UPLOAD_SIZE
```

### 4. API Response Format — Selalu Format Ini
```typescript
{ success: true, data: T }
{ success: true, data: T[], meta: { total, page, limit, totalPages } }
{ success: false, error: string }
```

### 5. Database Transaction
```typescript
// Selalu gunakan transaction untuk multi-table updates
await db.transaction(async (tx) => {
  await tx.update(orders).set({ status: 'completed' }).where(...)
  await tx.update(payments).set({ statusPelunasan: 'paid' }).where(...)
})
```

### 6. Import Order
```typescript
// 1. React / Next.js
// 2. Third-party libraries
// 3. Internal — db / lib
// 4. Internal — components
// 5. Internal — types
// 6. Relative imports
```

---

## Keputusan Teknis yang Tidak Boleh Diubah

| Keputusan | Yang Benar | Yang Salah |
|-----------|-----------|-----------|
| Realtime chat | Supabase Realtime (Vercel serverless tidak support koneksi WebSocket persistent) | Socket.io |
| Kalender ketersediaan PG | Derived dari query | Tabel terpisah |
| Chat mode | Satu mode, tidak dibedakan pre/post order | Dua mode berbeda |
| Filter chat | Nomor telepon + email → `[informasi kontak disembunyikan]` | Tidak difilter |
| DP | Selalu 50% | Angka lain |
| Pelunasan | Selalu 50% | Angka lain |
| MoU | Di-generate platform | Upload manual |
| Role storage | Clerk publicMetadata | DB saja |

---

## DON'T List

- ❌ Gunakan `any` di TypeScript
- ❌ Install library baru tanpa diskusi dengan developer
- ❌ Ubah schema database tanpa update `docs/DATABASE.md` dulu
- ❌ Tambah endpoint tanpa update `docs/API.md` dulu
- ❌ Buat tabel kalender terpisah
- ❌ Gunakan Socket.io
- ❌ Hardcode nilai persentase komisi (ambil dari config/database)
- ❌ Simpan nomor telepon atau email di tabel `messages`
