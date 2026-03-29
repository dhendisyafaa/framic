# Framic — AI Assistant Context

> **Baca file ini sebelum mengerjakan apapun di project Framic.**
> File ini adalah entry point untuk semua AI assistant yang bekerja di project ini.

---

## 1. Apa itu Framic?

Framic adalah platform web booking jasa fotografer yang menghubungkan:
- **Customer** — yang butuh fotografer
- **Photographer (PG)** — penyedia jasa foto
- **Mitra** — organisasi yang menaungi PG dan membuat event (WO, kampus, EO, dll.)

Dibangun oleh **Dhendi Syafa Athallah Putra** sebagai project serius yang bertujuan menghasilkan revenue nyata — bukan sekadar tugas kuliah.

---

## 2. Dokumen yang Harus Dibaca

| Dokumen | Kapan Dibaca |
|---------|-------------|
| `docs/PRD.md` | Sebelum mengerjakan fitur baru |
| `docs/TECHNICAL.md` | Selalu — arsitektur, stack, conventions |
| `docs/DATABASE.md` | Sebelum menyentuh database atau schema |
| `docs/API.md` | Sebelum membuat atau mengubah endpoint |

**Jangan pernah improvisasi di luar yang sudah terdokumentasi.**

---

## 3. Tech Stack Ringkas

```
Framework  : Next.js 16 + Hono.js
Language   : TypeScript strict — NO any, EVER
Auth       : Clerk (multi-role)
Database   : PostgreSQL 15 + Drizzle ORM
             Docker lokal (dev) / Supabase (staging+prod)
Realtime   : Supabase Realtime (chat — BUKAN Socket.io)
Storage    : Cloudinary
Payment    : Xendit xenPlatform
Email      : Resend + React Email
Monitoring : Sentry + PostHog
UI         : shadcn/ui + React Bits
Fetching   : TanStack Query (React Query)
Deploy     : Vercel
```

---

## 4. Tiga Tipe PG

```
PG Independen
→ Set harga sendiri via paket
→ Bebas terima order dari siapapun
→ Bisa request masuk event via open recruitment

PG Anggota Tetap Mitra
→ Kontrak MoU dengan 1 mitra
→ EKSKLUSIF untuk mitranya — tidak bisa ikut event mitra lain
→ Fee flat per event, ditentukan mitra saat buat event
→ Ada minimum fee di MoU sebagai proteksi PG
→ Bisa terima order independen saat jadwal kosong
→ Perlu di-assign eksplisit ke setiap event

PG Kontrak Per-Event
→ Terikat hanya untuk 1 event spesifik
→ Fee dinegosiasikan per-event via MoU
→ Bebas lagi setelah event selesai
```

---

## 5. Model Mitra

```
Semua mitra SETARA — tidak ada tipe permanen atau adhoc

Fitur 1 — Rekrut Anggota Tetap
→ MoU berisi: durasi, persentase split, minimum fee per event

Fitur 2 — Buat Event
→ Invite langsung ATAU open recruitment
→ Fee berbeda untuk PG tetap vs PG per-event
```

---

## 6. Keputusan yang Tidak Boleh Diubah

- Kalender ketersediaan PG **TIDAK punya tabel sendiri** — derived dari `event_photographers` + `orders`
- Chat **TIDAK pakai Socket.io** — pakai Supabase Realtime
- Chat **tidak ada perbedaan pre/post order** — satu chat per order
- Filter kontak di chat: nomor telepon (08xx, +62xx) + email → `[informasi kontak disembunyikan]`
- DP selalu **50%**, pelunasan selalu **50%**
- Komisi platform **dikunci** — tidak bisa diubah user
- MoU **di-generate platform** — tidak ada upload manual
- Role disimpan di Clerk `publicMetadata`
- **TanStack Query** untuk client-side data management di dashboard dan mutations
- **Flow MoU (Fase 6 vs Fase 7):**  
  Flow MoU untuk PG per-event dan anggota tetap **berhenti di `invitation_status = 'accepted'`** di Fase 6 — generate PDF dan e-sign MoU dikerjakan di Fase 7.  
  Di kode, tandai dengan komentar: `// Pre-MoU: 'accepted' berarti terms disetujui, MoU sign di Fase 7`

---


## 7. Coding Conventions Wajib

```typescript
// ❌ DILARANG
const data: any = response

// ✅ WAJIB
const data: OrderResponse = response
```

```
Naming:
Variables/functions : camelCase
Components          : PascalCase
Files               : kebab-case
DB tables/columns   : snake_case
Constants           : SCREAMING_SNAKE
```

```typescript
// API Response — selalu format ini
{ success: true, data: T }
{ success: true, data: T[], meta: { total, page, limit, totalPages } }
{ success: false, error: string }
```

```typescript
// Selalu transaction untuk multi-table updates
await db.transaction(async (tx) => {
  await tx.update(orders).set(...)
  await tx.update(payments).set(...)
})
```

---

## 8. Status Order

```
pending → confirmed → dp_paid → ongoing → delivered → completed
                                                    ↘ cancelled
                                                    ↘ disputed
```

---

## 9. DO & DON'T untuk AI

### DO ✅
- Baca docs relevan sebelum mulai
- Ikuti conventions yang ditetapkan
- Tanya developer jika ada ambiguitas
- Gunakan TypeScript types yang proper

### DON'T ❌
- Improvisasi arsitektur di luar docs
- Gunakan `any` di TypeScript
- Install library baru tanpa diskusi
- Ubah schema tanpa update DATABASE.md
- Tambah endpoint tanpa update API.md
- Pakai Socket.io
- Buat tabel kalender terpisah

---

## 10. Cara Pakai File Ini

**Di Antigravity/Cursor — tambahkan di Rules/Instructions:**
```
Always read docs/AI_CONTEXT.md before starting any task in this project.
```

**Di Claude.ai — lampirkan file ini di awal percakapan baru.**

**Untuk task spesifik — selalu referensikan dokumen:**
```
"Implementasikan schema Drizzle untuk tabel orders
 sesuai DATABASE.md section 3.9"

"Buat POST /api/orders sesuai API.md section 8
 dan business rules PRD.md section 12"
```

---

*Update file ini setiap kali ada keputusan baru yang mempengaruhi cara AI bekerja di project ini.*
