# Framic — API Design Document

> **Version:** 2.0  
> **Last Updated:** March 2026  
> **Status:** Active  
> Base URL: `/api`  
> All endpoints use JSON. Protected endpoints require Clerk session token.

---

## 1. Conventions

### 1.1 Response Format

```typescript
// Success
{ success: true, data: T }

// Success + pagination
{ success: true, data: T[], meta: { total: number, page: number, limit: number, totalPages: number } }

// Error
{ success: false, error: string }
```

### 1.2 HTTP Status Codes

| Code  | Kondisi                            |
| ----- | ---------------------------------- |
| `200` | OK                                 |
| `201` | Created                            |
| `400` | Bad Request — validasi gagal       |
| `401` | Unauthorized                       |
| `403` | Forbidden — tidak punya permission |
| `404` | Not Found                          |
| `409` | Conflict — state conflict          |
| `500` | Internal Server Error              |

### 1.3 Role Guard

```
[PUBLIC]       — tanpa login
[AUTH]         — harus login (semua role)
[CUSTOMER]     — harus punya role customer
[PHOTOGRAPHER] — harus punya role photographer & verified
[MITRA]        — harus punya role mitra & verified
[ADMIN]        — harus punya role admin
```

---

## 2. Users

### GET /api/users/me

**Auth:** `[AUTH]`

Data user aktif beserta semua profile yang dimiliki.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "clerkId": "user_abc123",
    "roles": ["customer", "photographer"],
    "customerProfile": { "id": "uuid", "alamat": "Bandung" },
    "photographerProfile": {
      "id": "uuid",
      "bio": "...",
      "kotaDomisili": "Bandung",
      "kategori": ["wedding", "portrait"],
      "ratingAverage": 4.8,
      "ratingCount": 42,
      "verificationStatus": "verified",
      "isAvailable": true
    }
  }
}
```

---

### PATCH /api/users/me/customer-profile

**Auth:** `[CUSTOMER]`

```json
{ "alamat": "Jl. Setiabudi No. 10, Bandung" }
```

---

### POST /api/users/apply/photographer

**Auth:** `[AUTH]`

```json
{
  "bio": "Fotografer dengan fokus wedding dan portrait",
  "kotaDomisili": "Bandung",
  "kategori": ["wedding", "portrait"],
  "nomorTelepon": "08123456789"
}
```

---

### POST /api/users/apply/mitra

**Auth:** `[AUTH]`  
**Content-Type:** `multipart/form-data`

```
namaOrganisasi: string
tipeMitra: "wedding_organizer" | "kampus" | "event_organizer" | "komunitas" | "perusahaan" | "lainnya"
alamat: string
nomorTelepon: string
websiteUrl?: string
dokumenLegalitas: File
```

---

## 3. Photographers

### GET /api/photographers

**Auth:** `[PUBLIC]`

**Query Params:**

```
page?, limit?, kota?, kategori?, minRating?, available?, sortBy?
```

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nama": "Budi Santoso",
      "avatarUrl": "https://...",
      "bio": "...",
      "kotaDomisili": "Bandung",
      "kategori": ["wedding"],
      "ratingAverage": 4.8,
      "ratingCount": 42,
      "isAvailable": true,
      "packageStartingFrom": 500000,
      "portfolioUrls": ["https://..."]
    }
  ],
  "meta": { "total": 48, "page": 1, "limit": 12, "totalPages": 4 }
}
```

---

### GET /api/photographers/:id

**Auth:** `[PUBLIC]`

Detail lengkap beserta paket dan ulasan terbaru.

---

### GET /api/photographers/:id/calendar

**Auth:** `[PUBLIC]`

Kalender ketersediaan PG (Photografer) — di-derive dari event assignments dan order aktif.

**Query Params:**

```
month: string  (format: "2026-05")
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "month": "2026-05",
    "blockedDates": [
      {
        "date": "2026-05-10",
        "reason": "event",
        "eventName": "Wisuda UPI Oktober"
      },
      {
        "date": "2026-05-15",
        "reason": "order"
      }
    ],
    "availableDates": ["2026-05-01", "2026-05-02", "..."]
  }
}
```

---

### PATCH /api/photographers/me

**Auth:** `[PHOTOGRAPHER]`

Update profil, bio, kategori, ketersediaan.

---

### POST /api/photographers/me/portfolio

**Auth:** `[PHOTOGRAPHER]`  
**Content-Type:** `multipart/form-data`

Upload foto portofolio baru ke Cloudinary.

---

## 4. Packages

### GET /api/photographers/:photographerId/packages

**Auth:** `[PUBLIC]`

---

### POST /api/packages

**Auth:** `[PHOTOGRAPHER]`

```json
{
  "namaPaket": "Paket Gold",
  "deskripsi": "Full day wedding coverage",
  "harga": 2500000,
  "durasiJam": 8,
  "jumlahFotoMin": 100,
  "includesEditing": true,
  "kategori": "wedding"
}
```

**Catatan:** Hanya untuk PG independen. PG yang sedang aktif sebagai anggota tetap mitra tetap bisa punya paket, tapi tidak bisa di-booking di tanggal yang ter-block event mitra.

---

### PATCH /api/packages/:id

**Auth:** `[PHOTOGRAPHER]`

Hanya bisa jika tidak ada order aktif yang menggunakan paket ini.

---

### DELETE /api/packages/:id

**Auth:** `[PHOTOGRAPHER]`

Soft delete — set `isActive = false`.

---

## 5. Mitra

### GET /api/mitra/:id

**Auth:** `[PUBLIC]`

Detail mitra beserta event aktif yang published.

---

### GET /api/mitra/me/photographers

**Auth:** `[MITRA]`

List PG anggota tetap beserta status kontrak.

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "contractId": "uuid",
      "photographerId": "uuid",
      "nama": "Budi Santoso",
      "contractStatus": "active",
      "tanggalMulai": "2026-01-01T00:00:00Z",
      "tanggalSelesai": "2026-12-31T00:00:00Z",
      "photographerPercent": 80,
      "mitraPercent": 20,
      "minimumFeePerEvent": 500000
    }
  ]
}
```

---

### POST /api/mitra/me/photographers/invite

**Auth:** `[MITRA]`

Mitra invite PG untuk jadi anggota tetap.

```json
{
  "photographerId": "uuid",
  "mitraPercent": 20,
  "photographerPercent": 80,
  "minimumFeePerEvent": 500000,
  "tanggalMulai": "2026-04-01T00:00:00Z",
  "tanggalSelesai": "2026-12-31T00:00:00Z",
  "invitationMessage": "Kami mengundang Anda bergabung sebagai fotografer tetap kami"
}
```

**Validasi:**

- `mitraPercent + photographerPercent` harus = 100
- PG tidak boleh sudah punya kontrak aktif

---

### POST /api/mitra/me/join-request/:photographerId/respond

**Auth:** `[MITRA]`

Mitra acc/deny request dari PG yang ingin jadi anggota tetap.

```json
{
  "status": "accepted",
  "mitraPercent": 20,
  "photographerPercent": 80,
  "minimumFeePerEvent": 500000,
  "tanggalMulai": "2026-04-01T00:00:00Z",
  "tanggalSelesai": "2026-12-31T00:00:00Z"
}
```

---

### PATCH /api/mitra/photographers/:contractId/terminate

**Auth:** `[MITRA]`

```json
{ "terminationReason": "Kontrak diakhiri atas kesepakatan bersama" }
```

**Validasi:** Tidak bisa terminate jika PG masih punya order aktif.

---

## 6. Contracts (MoU) — Fase 7 MVP

Semua endpoint ini menerima query param `?type=mitra|event` — **wajib, return 400 jika tidak ada atau nilai tidak valid.**

`type=mitra` → query ke tabel `mitra_photographers`  
`type=event` → query ke tabel `event_photographers` JOIN `events`

---

### GET /api/contracts/:contractId

**Auth:** `[AUTH]`  
**Query Param:** `type: 'mitra' | 'event'` (wajib)

Detail kontrak untuk review terms sebelum e-sign.  
Return `403` jika user bukan pihak dalam kontrak tersebut.

**Response 200 (type=mitra):**

```json
{
  "success": true,
  "data": {
    "contractId": "uuid",
    "type": "mitra",
    "invitationStatus": "accepted",
    "contractStatus": null,
    "initiatedBy": "mitra",
    "mitra": { "id": "uuid", "namaOrganisasi": "UPI Official" },
    "photographer": { "id": "uuid", "nama": "Budi Santoso" },
    "mitraPercent": 20,
    "photographerPercent": 80,
    "minimumFeePerEvent": 500000,
    "tanggalMulai": "2026-04-01T00:00:00Z",
    "tanggalSelesai": "2026-12-31T00:00:00Z",
    "photographerSignedAt": null,
    "mitraSignedAt": null,
    "bothSigned": false,
    "mitraClerkId": "user_abc",
    "photographerClerkId": "user_xyz"
  }
}
```

**Response 200 (type=event):**

```json
{
  "success": true,
  "data": {
    "contractId": "uuid",
    "type": "event",
    "invitationStatus": "accepted",
    "initiatedBy": "mitra",
    "event": {
      "id": "uuid",
      "namaEvent": "Wisuda UPI Oktober 2026",
      "tanggalMulai": "2026-10-15T07:00:00Z",
      "tanggalSelesai": "2026-10-15T17:00:00Z",
      "lokasi": "Gedung Gymnasium UPI"
    },
    "mitra": { "id": "uuid", "namaOrganisasi": "UPI Official" },
    "photographer": { "id": "uuid", "nama": "Budi Santoso" },
    "mitraPercent": null,
    "photographerPercent": null,
    "feeAmount": 1500000,
    "photographerSignedAt": null,
    "mitraSignedAt": null,
    "bothSigned": false,
    "mitraClerkId": "user_abc",
    "photographerClerkId": "user_xyz"
  }
}
```

---

### POST /api/contracts/:contractId/sign

**Auth:** `[AUTH]`  
**Query Param:** `type: 'mitra' | 'event'` (wajib)

E-sign kontrak. Menyimpan `signed_at` timestamp + IP address dari header request.

**Validasi sebelum sign:**
- `invitation_status` harus `'accepted'`
- User harus salah satu pihak dalam kontrak
- User belum sign sebelumnya

**IP Capture:** Header `x-forwarded-for` (Vercel) → fallback `x-real-ip` → fallback `'unknown'`

**Side Effects:**
- `type=mitra`: Jika kedua pihak sudah sign → `contract_status = 'active'`
- `type=event`: Tidak ada perubahan status tambahan (`invitation_status` tetap `'accepted'`)
- `// TODO post-MVP: generate PDF MoU via mou-generator.ts + upload Cloudinary + update mouGeneratedUrl`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "signedAt": "2026-04-01T10:30:00Z",
    "bothSigned": false,
    "contractStatus": null,
    "message": "Tanda tangan berhasil disimpan. Menunggu pihak lain untuk menandatangani."
  }
}
```

---

### GET /api/photographers/me/invitations

**Auth:** `[PHOTOGRAPHER]`

Mengambil daftar invitation untuk PG ini. Return object dengan `mitraInvitations` dan `eventInvitations`.

```json
{
  "success": true,
  "data": {
    "mitraInvitations": [...],
    "eventInvitations": [...]
  }
}
```

---

### POST /api/photographers/me/mitra-request

**Auth:** `[PHOTOGRAPHER]`

PG request bergabung sebagai anggota tetap ke mitra.

```json
{
  "mitraId": "uuid",
  "invitationMessage": "Saya tertarik bergabung sebagai fotografer tetap"
}
```

**Validasi:** PG tidak boleh sudah punya kontrak aktif.

---

### PATCH /api/photographers/me/contracts/:contractId/respond

**Auth:** `[PHOTOGRAPHER]`

PG acc/deny invite dari mitra.

```json
{ "status": "accepted" }
```

---

## 7. Events

### PATCH /api/events/:id

**Auth:** `[MITRA]`

Update pengaturan open recruitment event (hanya field ini yang dapat diubah). Event harus milik mitra.

**Request:**

```json
{
  "isOpenRecruitment": true,
  "deadlineRequest": "2026-09-01T00:00:00Z" // Wajib jika true
}
```

**Side Effects:**
- Jika `isOpenRecruitment: false`, `deadlineRequest` otomatis diset null.

---

### GET /api/events

**Auth:** `[PUBLIC]`

List event published.

**Query Params:**

```
page?, limit?, mitraId?, upcoming?, includeDrafts?
```

*Note: `includeDrafts=true` hanya mengembalikan draft jika user adalah mitra pemilik.*

---

### GET /api/events/open

**Auth:** `[PUBLIC]`

List event yang open recruitment — untuk PG yang mau request masuk.

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "namaEvent": "Wisuda UPI Oktober 2026",
      "mitra": { "id": "uuid", "namaOrganisasi": "UPI Official" },
      "tanggalMulai": "2026-10-15T07:00:00Z",
      "tanggalSelesai": "2026-10-15T17:00:00Z",
      "lokasi": "Gymnasium UPI, Bandung",
      "feePgPerEvent": 1200000,
      "kuotaPgPerEvent": 3,
      "slotTersisa": 2,
      "deadlineRequest": "2026-10-01T00:00:00Z"
    }
  ]
}
```

---

### GET /api/events/:id

**Auth:** `[PUBLIC]` (atau `[MITRA]` jika menggunakan `?dashboard=true`)

Detail event beserta PG yang tersedia.
- **Normal (Public):** Hanya mengembalikan data jika `isPublished = true`.
- **Dashboard (`?dashboard=true`):** Mem-bypass `isPublished` dan mengembalikan seluruh details plus status seluruh list invitas/rekrutmen PG (termasuk yang pending/rejected) khusus untuk mitra pembuat event.

---

### POST /api/events

**Auth:** `[MITRA]`  
**Content-Type:** `multipart/form-data`

```
namaEvent: string
deskripsi?: string
tanggalMulai: string (ISO datetime)
tanggalSelesai: string (ISO datetime)
lokasi: string
feePgTetap?: number
feePgPerEvent?: number
kuotaPgTetap?: number
kuotaPgPerEvent?: number
isOpenRecruitment: boolean
deadlineRequest?: string (ISO datetime)
coverImage?: File
```

---

### POST /api/events/:id/assign-photographer

**Auth:** `[MITRA]`

Assign PG anggota tetap ke event (langsung tanpa MoU baru).

```json
{ "photographerId": "uuid" }
```

**Validasi:**

- PG harus anggota tetap mitra ini (kontrak aktif)
- Fee event tidak boleh < minimum_fee_per_event di MoU PG tersebut

---

### POST /api/events/:id/invite-photographer

**Auth:** `[MITRA]`

Invite PG independen ke event (perlu MoU per-event).

```json
{
  "photographerId": "uuid",
  "invitationMessage": "Kami mengundang Anda untuk event wisuda kami"
}
```

---

### POST /api/events/:id/request

**Auth:** `[PHOTOGRAPHER]`

PG request masuk ke event open recruitment.

```json
{ "message": "Saya tertarik berpartisipasi di event ini" }
```

**Validasi:**

- Event harus `is_open_recruitment = true`
- Belum melewati `deadline_request`
- PG tidak boleh anggota tetap mitra lain (eksklusif)
- PG tidak boleh sudah ada order/event di tanggal bentrok

---

### PATCH /api/events/:eventId/photographers/:entryId/respond

**Auth:** `[MITRA]` atau `[PHOTOGRAPHER]`

Acc/deny invite atau request.

```json
{ "status": "accepted" | "rejected" }
```

**Jika accepted (PG per-event):**

- Lanjut ke proses negosiasi MoU per-event

---

### PATCH /api/events/:id/publish

**Auth:** `[MITRA]`

Publish event agar tampil ke publik.

---

## 8. Orders

### GET /api/orders

**Auth:** `[AUTH]`

List order milik user. Response berbeda per role:

- `customer`: order yang dibuat customer ini
- `photographer`: order yang ditujukan ke PG ini
- `mitra`: order dari event yang dibuat mitra ini

**Query Params:**

```
page?, limit?, status?
```

---

### GET /api/orders/:id

**Auth:** `[AUTH]`

Detail order. Hanya customer, PG, atau mitra yang terlibat.

---

### POST /api/orders

**Auth:** `[CUSTOMER]`

```json
{
  "photographerId": "uuid",
  "paketId": "uuid",
  "orderType": "direct",
  "eventId": null,
  "lokasi": "Taman Sari, Bandung",
  "tanggalPotret": "2026-05-10T09:00:00Z",
  "catatan": "Prefer outdoor, natural light"
}
```

**Validasi:**

- `orderType = 'event'` wajib sertakan `eventId`
- PG harus `verified` dan `isAvailable`
- Tanggal tidak boleh ter-block di kalender PG

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending",
    "totalHarga": 1000000,
    "jumlahDp": 500000
  }
}
```

---

### PATCH /api/orders/:id/confirm

**Auth:** `[PHOTOGRAPHER]`

PG konfirmasi order → status `confirmed`.

---

### PATCH /api/orders/:id/reject

**Auth:** `[PHOTOGRAPHER]`

```json
{ "alasan": "Jadwal sudah penuh" }
```

---

### PATCH /api/orders/:id/cancel

**Auth:** `[AUTH]`

```json
{ "alasan": "Ada keperluan mendadak" }
```

---

### PATCH /api/orders/:id/ongoing

**Auth:** `[PHOTOGRAPHER]`

Mark sesi foto sedang berlangsung → status `ongoing`.

---

### PATCH /api/orders/:id/deliver

**Auth:** `[PHOTOGRAPHER]`

Mark semua foto sudah diupload → status `delivered`.

---

### PATCH /api/orders/:id/complete

**Auth:** `[CUSTOMER]`

Customer konfirmasi terima hasil foto → status `completed`.

---

## 9. Payments

### POST /api/payments/:orderId/dp

**Auth:** `[CUSTOMER]`

```json
{ "metodePembayaran": "bca_va" }
```

**Response 201:**

```json
{
  "success": true,
  "data": {
    "invoiceId": "inv_xendit_xxx",
    "invoiceUrl": "https://checkout.xendit.co/...",
    "jumlahDp": 500000,
    "expiresAt": "2026-03-16T10:00:00Z"
  }
}
```

---

### POST /api/payments/:orderId/settle

**Auth:** `[CUSTOMER]`

**Validasi:** Order harus `delivered`.

---

### POST /api/webhooks/xendit

**Auth:** `[PUBLIC]` — divalidasi via `x-callback-token` header

**Logic:**

1. Validasi `x-callback-token`
2. Parse `external_id`: `"framic_order_{orderId}_{dp|settle}"`
3. Update payment status
4. Update order status
5. Trigger notifikasi email
6. Jika pelunasan: trigger split payment via xenPlatform

---

## 10. Photos

### POST /api/photos/:orderId

**Auth:** `[PHOTOGRAPHER]`  
**Content-Type:** `multipart/form-data`

```
foto: File[]  // max 10MB per file, max 100 foto per order
```

**Validasi:** Order harus `ongoing` atau `delivered`.

---

### GET /api/photos/:orderId

**Auth:** `[AUTH]`

Hanya customer atau PG yang terlibat.

---

### DELETE /api/photos/:photoId

**Auth:** `[PHOTOGRAPHER]`

**Validasi:** Order harus `ongoing` atau `delivered` (belum completed).

---

## 11. Reviews

### POST /api/reviews

**Auth:** `[CUSTOMER]`

```json
{
  "orderId": "uuid",
  "rating": 5,
  "komentar": "Fotografernya profesional!"
}
```

**Validasi:** Order harus `completed`. Satu order satu ulasan.

**Side Effects:** Update `photographer_profiles.rating_average` dan `rating_count`.

---

### GET /api/reviews/photographer/:photographerId

**Auth:** `[PUBLIC]`

---

## 12. Chat

### GET /api/chat/:orderId

**Auth:** `[AUTH]`

History semua pesan dalam order. Hanya customer atau PG yang terlibat.

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "senderClerkId": "user_abc",
      "senderNama": "Budi Santoso",
      "pesan": "Halo, konfirmasi lokasi untuk besok",
      "isRead": true,
      "createdAt": "2026-03-15T10:00:00Z"
    }
  ]
}
```

---

### POST /api/chat/:orderId/messages

**Auth:** `[AUTH]`

```json
{ "pesan": "Halo, saya ingin konfirmasi lokasi" }
```

**Server-side processing sebelum INSERT:**

1. Filter nomor telepon (0xx, +62xx, 62xx) → `[informasi kontak disembunyikan]`
2. Filter email → `[informasi kontak disembunyikan]`
3. INSERT ke tabel `messages`
4. Supabase Realtime otomatis push ke subscriber

**Tidak ada perbedaan pre-order vs post-order** — chat bebas selama order belum `completed` atau `cancelled`.

---

### PATCH /api/chat/:orderId/read

**Auth:** `[AUTH]`

Mark semua pesan sebagai sudah dibaca.

---

## 13. Disputes

### POST /api/disputes

**Auth:** `[CUSTOMER]` atau `[PHOTOGRAPHER]`  
**Content-Type:** `multipart/form-data`

```
orderId: string
alasan: string
bukti: File[]  // optional, max 5 file
```

**Validasi:** Order harus `dp_paid`, `ongoing`, atau `delivered`.

**Side Effects:**

- Update `orders.status = 'disputed'`
- Set `auto_resolve_at = now() + 3 days`
- Notifikasi email ke pihak lawan

---

### POST /api/disputes/:id/respond

**Auth:** `[AUTH]`  
**Content-Type:** `multipart/form-data`

```
responseText: string
responseBukti: File[]  // optional
```

---

### GET /api/disputes/:id

**Auth:** `[AUTH]`

Hanya pihak yang terlibat atau admin.

---

## 14. Admin

### GET /api/admin/verifications

**Auth:** `[ADMIN]`

List pengajuan verifikasi PG dan mitra yang pending.

---

### PATCH /api/admin/verifications/:id/approve

**Auth:** `[ADMIN]`

**Side Effects:**

- Update `verification_status = 'verified'`
- Update roles di Clerk `publicMetadata`
- Kirim email notifikasi

---

### PATCH /api/admin/verifications/:id/reject

**Auth:** `[ADMIN]`

```json
{ "alasan": "Dokumen tidak lengkap" }
```

---

### GET /api/admin/disputes

**Auth:** `[ADMIN]`

List dispute yang perlu penanganan admin.

---

### PATCH /api/admin/disputes/:id/resolve

**Auth:** `[ADMIN]`

```json
{
  "resolvedFor": "customer" | "photographer",
  "catatanResolusi": "Berdasarkan bukti, refund diberikan ke customer"
}
```

**Side Effects:**

- `customer`: refund DP, order `cancelled`
- `photographer`: cairkan DP ke PG, order `completed`

---

### GET /api/admin/stats

**Auth:** `[ADMIN]`

---

## 15. Endpoint Summary

| Method | Endpoint                                         | Auth         | Deskripsi                        |
| ------ | ------------------------------------------------ | ------------ | -------------------------------- |
| GET    | `/api/users/me`                                  | AUTH         | Data user aktif                  |
| PATCH  | `/api/users/me/customer-profile`                 | CUSTOMER     | Update profil customer           |
| POST   | `/api/users/apply/photographer`                  | AUTH         | Apply jadi PG                    |
| POST   | `/api/users/apply/mitra`                         | AUTH         | Apply jadi mitra                 |
| GET    | `/api/photographers`                             | PUBLIC       | List PG                          |
| GET    | `/api/photographers/:id`                         | PUBLIC       | Detail PG                        |
| GET    | `/api/photographers/:id/calendar`                | PUBLIC       | Kalender ketersediaan PG         |
| PATCH  | `/api/photographers/me`                          | PHOTOGRAPHER | Update profil PG                 |
| POST   | `/api/photographers/me/portfolio`                | PHOTOGRAPHER | Upload portofolio                |
| POST   | `/api/photographers/me/mitra-request`            | PHOTOGRAPHER | PG request ke mitra              |
| PATCH  | `/api/photographers/me/contracts/:id/respond`    | PHOTOGRAPHER | PG acc/deny invite mitra         |
| GET    | `/api/photographers/:id/packages`                | PUBLIC       | List paket PG                    |
| GET    | `/api/photographers/me/invitations`              | PHOTOGRAPHER | List undangan masuk ke PG        |
| POST   | `/api/packages`                                  | PHOTOGRAPHER | Buat paket                       |
| PATCH  | `/api/packages/:id`                              | PHOTOGRAPHER | Update paket                     |
| DELETE | `/api/packages/:id`                              | PHOTOGRAPHER | Hapus paket                      |
| GET    | `/api/mitra/:id`                                 | PUBLIC       | Detail mitra                     |
| GET    | `/api/mitra/me/photographers`                    | MITRA        | List PG anggota tetap            |
| POST   | `/api/mitra/me/photographers/invite`             | MITRA        | Invite PG jadi anggota tetap     |
| POST   | `/api/mitra/me/join-request/:pgId/respond`       | MITRA        | Acc/deny request PG              |
| PATCH  | `/api/mitra/photographers/:contractId/terminate` | MITRA        | Akhiri kontrak                   |
| GET    | `/api/contracts/:contractId`                     | AUTH         | Detail kontrak MoU               |
| POST   | `/api/contracts/:contractId/sign`                | AUTH         | E-sign kontrak                   |
| GET    | `/api/events`                                    | PUBLIC       | List event published             |
| GET    | `/api/events/open`                               | PUBLIC       | List event open recruitment      |
| GET    | `/api/events/:id`                                | PUBLIC       | Detail event                     |
| PATCH  | `/api/events/:id`                                | MITRA        | Update open recruitment event    |
| POST   | `/api/events`                                    | MITRA        | Buat event                       |
| POST   | `/api/events/:id/assign-photographer`            | MITRA        | Assign PG tetap ke event         |
| POST   | `/api/events/:id/invite-photographer`            | MITRA        | Invite PG per-event              |
| POST   | `/api/events/:id/request`                        | PHOTOGRAPHER | PG request ke event open         |
| PATCH  | `/api/events/:id/photographers/:entryId/respond` | AUTH         | Acc/deny invite/request event    |
| PATCH  | `/api/events/:id/publish`                        | MITRA        | Publish event                    |
| GET    | `/api/orders`                                    | AUTH         | List order                       |
| GET    | `/api/orders/:id`                                | AUTH         | Detail order                     |
| POST   | `/api/orders`                                    | CUSTOMER     | Buat order                       |
| PATCH  | `/api/orders/:id/confirm`                        | PHOTOGRAPHER | Konfirmasi order                 |
| PATCH  | `/api/orders/:id/reject`                         | PHOTOGRAPHER | Tolak order                      |
| PATCH  | `/api/orders/:id/cancel`                         | AUTH         | Cancel order                     |
| PATCH  | `/api/orders/:id/ongoing`                        | PHOTOGRAPHER | Mark ongoing                     |
| PATCH  | `/api/orders/:id/deliver`                        | PHOTOGRAPHER | Mark delivered                   |
| PATCH  | `/api/orders/:id/complete`                       | CUSTOMER     | Konfirmasi terima foto           |
| POST   | `/api/payments/:orderId/dp`                      | CUSTOMER     | Bayar DP                         |
| POST   | `/api/payments/:orderId/settle`                  | CUSTOMER     | Bayar pelunasan                  |
| POST   | `/api/webhooks/xendit`                           | PUBLIC       | Webhook Xendit                   |
| POST   | `/api/photos/:orderId`                           | PHOTOGRAPHER | Upload foto                      |
| GET    | `/api/photos/:orderId`                           | AUTH         | Lihat foto order                 |
| DELETE | `/api/photos/:photoId`                           | PHOTOGRAPHER | Hapus foto                       |
| POST   | `/api/reviews`                                   | CUSTOMER     | Buat ulasan                      |
| GET    | `/api/reviews/photographer/:id`                  | PUBLIC       | List ulasan PG                   |
| GET    | `/api/chat/:orderId`                             | AUTH         | History chat                     |
| POST   | `/api/chat/:orderId/messages`                    | AUTH         | Kirim pesan (auto-filter kontak) |
| PATCH  | `/api/chat/:orderId/read`                        | AUTH         | Mark pesan dibaca                |
| POST   | `/api/disputes`                                  | AUTH         | Ajukan dispute                   |
| POST   | `/api/disputes/:id/respond`                      | AUTH         | Respond dispute                  |
| GET    | `/api/disputes/:id`                              | AUTH         | Detail dispute                   |
| GET    | `/api/admin/verifications`                       | ADMIN        | List verifikasi pending          |
| PATCH  | `/api/admin/verifications/:id/approve`           | ADMIN        | Approve verifikasi               |
| PATCH  | `/api/admin/verifications/:id/reject`            | ADMIN        | Reject verifikasi                |
| GET    | `/api/admin/disputes`                            | ADMIN        | List dispute                     |
| PATCH  | `/api/admin/disputes/:id/resolve`                | ADMIN        | Resolve dispute                  |
| GET    | `/api/admin/stats`                               | ADMIN        | Statistik platform               |

---

_Setiap perubahan atau penambahan endpoint HARUS didokumentasikan di sini terlebih dahulu._
