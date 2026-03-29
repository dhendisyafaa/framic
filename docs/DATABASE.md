# Framic — Database Design Document

> **Version:** 2.0  
> **Last Updated:** March 2026  
> **Status:** Active  
> Database: PostgreSQL 15 (local Docker) / Supabase (staging + production)  
> ORM: Drizzle ORM (TypeScript)

---

## 1. Overview

### 1.1 Daftar Entitas

| No  | Entitas              | Tabel                   | Keterangan                          |
| --- | -------------------- | ----------------------- | ----------------------------------- |
| 1   | User                 | `users`                 | Bridge Clerk ↔ database internal    |
| 2   | Customer Profile     | `customer_profiles`     | Data spesifik role customer         |
| 3   | Photographer Profile | `photographer_profiles` | Data spesifik role PG (Photografer) |
| 4   | Mitra Profile        | `mitra_profiles`        | Data spesifik role mitra            |
| 5   | Paket                | `packages`              | Paket harga PG independen           |
| 6   | Kontrak Mitra-PG     | `mitra_photographers`   | Kontrak anggota tetap PG ↔ mitra    |
| 7   | Event                | `events`                | Event yang dibuat mitra             |
| 8   | Event-PG             | `event_photographers`   | Assignment + kontrak per-event      |
| 9   | Order                | `orders`                | Transaksi pemesanan                 |
| 10  | Pembayaran           | `payments`              | Pembayaran DP + pelunasan           |
| 11  | Foto                 | `photos`                | Hasil foto per order                |
| 12  | Ulasan               | `reviews`               | Review customer setelah completed   |
| 13  | Dispute              | `disputes`              | Dokumentasi dispute per order       |
| 14  | Pesan                | `messages`              | Pesan chat per order                |

### 1.2 Konvensi Penamaan

- Nama tabel: `snake_case`, plural
- Nama kolom: `snake_case`
- Primary key: selalu `id` bertipe `uuid`
- Foreign key: `{nama_tabel_singular}_id`
- Timestamps: setiap tabel wajib `created_at` dan `updated_at`
- Enum: PostgreSQL native enum

### 1.3 Catatan Auth

- Data autentikasi (email, nama, avatar) dikelola Clerk
- Tabel `users` hanya menyimpan `clerk_id` sebagai bridge
- Referensi ke user menggunakan `clerk_id` (tipe `text`)

---

## 2. Enum Definitions

```typescript
// src/db/schema/enums.ts

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending", // menunggu review admin
  "verified", // sudah diverifikasi
  "rejected", // ditolak admin
  "suspended", // disuspend admin
]);

export const contractStatusEnum = pgEnum("contract_status", [
  "active", // kontrak aktif
  "pending_expiry", // tanggal habis tapi masih ada order aktif
  "expired", // kontrak habis dan semua order selesai
  "terminated", // diputus manual sebelum waktunya
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending", // menunggu response
  "accepted", // diterima
  "rejected", // ditolak
]);

export const initiatedByEnum = pgEnum("initiated_by", [
  "photographer", // PG yang request duluan
  "mitra", // mitra yang invite duluan
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending", // order dibuat, menunggu konfirmasi PG
  "confirmed", // PG setuju, menunggu DP
  "dp_paid", // DP 50% sudah dibayar, sesi terjadwal
  "ongoing", // sesi foto sedang berlangsung
  "delivered", // PG sudah upload semua file
  "completed", // customer konfirmasi terima file, pelunasan lunas
  "cancelled", // dibatalkan salah satu pihak
  "disputed", // ada masalah, uang ditahan platform
]);

export const orderTypeEnum = pgEnum("order_type", [
  "direct", // langsung ke PG independen
  "event", // melalui event mitra
]);

export const dpStatusEnum = pgEnum("dp_status", [
  "unpaid",
  "pending", // invoice dibuat, menunggu bayar
  "paid",
  "refunded",
]);

export const settlementStatusEnum = pgEnum("settlement_status", [
  "unpaid",
  "pending", // menunggu konfirmasi customer
  "paid",
  "refunded",
]);

export const disputeStatusEnum = pgEnum("dispute_status", [
  "open",
  "waiting_response",
  "under_review",
  "resolved_customer",
  "resolved_photographer",
  "escalated",
]);

export const disputeRaisedByEnum = pgEnum("dispute_raised_by", [
  "customer",
  "photographer",
]);

export const mitraTypeEnum = pgEnum("mitra_type", [
  "wedding_organizer",
  "kampus",
  "event_organizer",
  "komunitas",
  "perusahaan",
  "lainnya",
]);

export const pgTypeEnum = pgEnum("pg_type", [
  "independent", // PG independen
  "mitra_permanent", // PG anggota tetap mitra (ada di mitra_photographers aktif)
  "event_only", // PG kontrak per-event saja
]);
```

---

## 3. Schema Detail

### 3.1 users

```typescript
export const users = pgTable("users", {
  clerkId: text("clerk_id").primaryKey(),
  roles: text("roles").array().notNull().default(["customer"]),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

### 3.2 customer_profiles

```typescript
export const customerProfiles = pgTable("customer_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id")
    .notNull()
    .unique()
    .references(() => users.clerkId, { onDelete: "cascade" }),
  alamat: text("alamat"),
  nomorTelepon: text("nomor_telepon"), // disimpan encrypted, tidak pernah tampil di chat
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

### 3.3 photographer_profiles

```typescript
export const photographerProfiles = pgTable("photographer_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id")
    .notNull()
    .unique()
    .references(() => users.clerkId, { onDelete: "cascade" }),
  bio: text("bio"),
  kotaDomisili: text("kota_domisili").notNull(),
  kategori: text("kategori").array().notNull().default([]),
  // ['wedding', 'wisuda', 'portrait', 'event', 'product']
  portfolioUrls: text("portfolio_urls").array().notNull().default([]),
  ratingAverage: real("rating_average").default(0).notNull(),
  ratingCount: integer("rating_count").default(0).notNull(),
  verificationStatus: verificationStatusEnum("verification_status")
    .default("pending")
    .notNull(),
  verifiedAt: timestamp("verified_at"),
  isAvailable: boolean("is_available").default(true).notNull(),
  // Catatan: tidak ada kolom active_mitra_id
  // Status PG tetap mitra di-derive dari mitra_photographers WHERE status = 'active'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

### 3.4 mitra_profiles

```typescript
export const mitraProfiles = pgTable("mitra_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id")
    .notNull()
    .unique()
    .references(() => users.clerkId, { onDelete: "cascade" }),
  namaOrganisasi: text("nama_organisasi").notNull(),
  tipeMitra: mitraTypeEnum("tipe_mitra").notNull(),
  alamat: text("alamat").notNull(),
  nomorTelepon: text("nomor_telepon").notNull(),
  websiteUrl: text("website_url"),
  dokumenLegalitasUrl: text("dokumen_legalitas_url"),
  verificationStatus: verificationStatusEnum("verification_status")
    .default("pending")
    .notNull(),
  verifiedAt: timestamp("verified_at"),
  platformFeePercent: real("platform_fee_percent").default(10).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

### 3.5 packages

Hanya untuk PG independen. PG tetap mitra menggunakan fee yang ditentukan di event.

```typescript
export const packages = pgTable("packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  photographerId: uuid("photographer_id")
    .notNull()
    .references(() => photographerProfiles.id, { onDelete: "cascade" }),
  namaPaket: text("nama_paket").notNull(),
  deskripsi: text("deskripsi").notNull(),
  harga: integer("harga").notNull(), // dalam Rupiah
  durasiJam: integer("durasi_jam").notNull(),
  jumlahFotoMin: integer("jumlah_foto_min").notNull(),
  includesEditing: boolean("includes_editing").default(false).notNull(),
  kategori: text("kategori"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Catatan:** PG yang sedang jadi anggota tetap mitra tetap bisa punya paket independen. Paket ini tetap aktif tapi tidak bisa di-booking di tanggal yang ter-block oleh event mitra (di-enforce via kalender, bukan di tabel ini).

---

### 3.6 mitra_photographers

Kontrak anggota tetap antara PG dan mitra.

```typescript
export const mitraPhotographers = pgTable("mitra_photographers", {
  id: uuid("id").defaultRandom().primaryKey(),
  mitraId: uuid("mitra_id")
    .notNull()
    .references(() => mitraProfiles.id),
  photographerId: uuid("photographer_id")
    .notNull()
    .references(() => photographerProfiles.id),

  // Siapa yang memulai
  initiatedBy: initiatedByEnum("initiated_by").notNull(),
  invitationStatus: invitationStatusEnum("invitation_status")
    .default("pending")
    .notNull(),
  invitationMessage: text("invitation_message"),
  // invitationStatus = 'accepted' → contract_status baru dibuat jadi 'active'

  // Terms kontrak (diisi setelah invitation accepted, sebelum e-sign)
  mitraPercent: real("mitra_percent"), // nullable sampai invitation accepted
  photographerPercent: real("photographer_percent"), // mitraPercent + photographerPercent = 100
  minimumFeePerEvent: integer("minimum_fee_per_event"), // proteksi PG, dalam Rupiah
  tanggalMulai: timestamp("tanggal_mulai"),
  tanggalSelesai: timestamp("tanggal_selesai"),

  // MoU
  mouGeneratedUrl: text("mou_generated_url"), // PDF yang di-generate platform
  photographerSignedAt: timestamp("photographer_signed_at"),
  mitraSignedAt: timestamp("mitra_signed_at"),
  photographerIp: text("photographer_ip"),
  mitraIp: text("mitra_ip"),

  // Status kontrak (aktif setelah kedua pihak e-sign)
  contractStatus: contractStatusEnum("contract_status"),
  terminatedAt: timestamp("terminated_at"),
  terminationReason: text("termination_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Business Rules:**

- PG hanya boleh punya 1 kontrak dengan `contract_status = 'active'` atau `'pending_expiry'`
- `mitra_percent + photographer_percent` harus = 100
- Kontrak tidak bisa expired jika PG masih punya order aktif

**Sign Flow (Fase 7 MVP):**

- `photographer_signed_at` dan `mitra_signed_at` diisi via `POST /api/contracts/:id/sign?type=mitra`
- Jika keduanya terisi → `contract_status` di-set `'active'` dalam `db.transaction()`
- PDF MoU: `// TODO post-MVP: generate PDF via mou-generator.ts + upload Cloudinary + update mou_generated_url`

---

### 3.7 events

```typescript
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  mitraId: uuid("mitra_id")
    .notNull()
    .references(() => mitraProfiles.id),
  namaEvent: text("nama_event").notNull(),
  deskripsi: text("deskripsi"),
  tanggalMulai: timestamp("tanggal_mulai").notNull(),
  tanggalSelesai: timestamp("tanggal_selesai").notNull(),
  lokasi: text("lokasi").notNull(),
  coverImageUrl: text("cover_image_url"),

  // Fee per kategori PG — sama rata dalam kategorinya
  feePgTetap: integer("fee_pg_tetap"), // untuk PG anggota tetap yang di-assign
  feePgPerEvent: integer("fee_pg_per_event"), // untuk PG kontrak per-event
  // fee_pg_tetap tidak boleh < minimum_fee_per_event di MoU mitra masing-masing PG

  // Kuota
  kuotaPgTetap: integer("kuota_pg_tetap").default(0).notNull(),
  kuotaPgPerEvent: integer("kuota_pg_per_event").default(0).notNull(),

  // Open recruitment
  isOpenRecruitment: boolean("is_open_recruitment").default(false).notNull(),
  deadlineRequest: timestamp("deadline_request"), // batas waktu PG bisa kirim request

  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

### 3.8 event_photographers

Menggabungkan dua fungsi: assignment PG tetap ke event DAN kontrak per-event.

```typescript
export const eventPhotographers = pgTable("event_photographers", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  photographerId: uuid("photographer_id")
    .notNull()
    .references(() => photographerProfiles.id),

  // Tipe PG di event ini
  pgType: pgTypeEnum("pg_type").notNull(),
  // 'mitra_permanent' → PG tetap yang di-assign mitra
  // 'event_only'      → PG yang kontrak per-event (via invite atau open recruitment)

  // Untuk PG per-event: proses invite/request
  initiatedBy: initiatedByEnum("initiated_by"), // nullable untuk PG tetap
  invitationStatus: invitationStatusEnum("invitation_status"), // nullable untuk PG tetap
  invitationMessage: text("invitation_message"),

  // Terms per-event (hanya untuk PG per-event)
  mitraPercent: real("mitra_percent"),
  photographerPercent: real("photographer_percent"),

  // MoU per-event (hanya untuk PG per-event)
  mouGeneratedUrl: text("mou_generated_url"),
  photographerSignedAt: timestamp("photographer_signed_at"),
  mitraSignedAt: timestamp("mitra_signed_at"),
  photographerIp: text("photographer_ip"),
  mitraIp: text("mitra_ip"),

  // Ketersediaan di event ini
  isAvailable: boolean("is_available").default(true).notNull(),
  // false jika PG sudah fully booked di event ini

  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});
```

**Business Rules:**

- PG tetap (`pg_type = 'mitra_permanent'`): tidak perlu invitation flow, langsung di-assign mitra
- PG per-event (`pg_type = 'event_only'`): harus melalui invitation/request flow + MoU
- Hanya PG independen atau PG expired contract yang bisa masuk via open recruitment

**Sign Flow (Fase 7 MVP):**

- `photographer_signed_at` dan `mitra_signed_at` diisi via `POST /api/contracts/:id/sign?type=event`
- `invitation_status` tetap `'accepted'` setelah kedua pihak sign (tidak ada perubahan status tambahan)
- PDF MoU: `// TODO post-MVP: generate PDF via mou-generator.ts + upload Cloudinary + update mou_generated_url`

---

### 3.9 orders

```typescript
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerClerkId: text("customer_clerk_id").notNull(),
  photographerId: uuid("photographer_id")
    .notNull()
    .references(() => photographerProfiles.id),
  paketId: uuid("paket_id").references(() => packages.id), // nullable jika order via event
  orderType: orderTypeEnum("order_type").notNull(),
  eventId: uuid("event_id").references(() => events.id), // nullable jika direct
  lokasi: text("lokasi").notNull(),
  tanggalPotret: timestamp("tanggal_potret").notNull(),
  catatan: text("catatan"),
  totalHarga: integer("total_harga").notNull(),
  // Untuk order direct: dari packages.harga
  // Untuk order via event: dari events.fee_pg_tetap atau fee_pg_per_event
  status: orderStatusEnum("status").default("pending").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  dpPaidAt: timestamp("dp_paid_at"),
  deliveredAt: timestamp("delivered_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: text("cancelled_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

### 3.10 payments

```typescript
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id),
  jumlahDp: integer("jumlah_dp").notNull(), // 50% dari total_harga
  statusDp: dpStatusEnum("status_dp").default("unpaid").notNull(),
  xenditInvoiceIdDp: text("xendit_invoice_id_dp"),
  tanggalDp: timestamp("tanggal_dp"),
  jumlahPelunasan: integer("jumlah_pelunasan").notNull(), // 50% dari total_harga
  statusPelunasan: settlementStatusEnum("status_pelunasan")
    .default("unpaid")
    .notNull(),
  xenditInvoiceIdSettle: text("xendit_invoice_id_settle"),
  tanggalPelunasan: timestamp("tanggal_pelunasan"),
  // Breakdown komisi (snapshot saat transaksi)
  jumlahPlatform: integer("jumlah_platform"),
  jumlahMitra: integer("jumlah_mitra"), // nullable jika PG independen
  jumlahFotografer: integer("jumlah_fotografer"),
  platformFeePercent: real("platform_fee_percent").notNull(),
  mitraPercent: real("mitra_percent"), // nullable jika PG independen
  photographerPercent: real("photographer_percent").notNull(),
  metodePembayaran: text("metode_pembayaran"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

### 3.11 photos

```typescript
export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fotoUrl: text("foto_url").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  ukuranBytes: integer("ukuran_bytes").notNull(),
  resolusiWidth: integer("resolusi_width"),
  resolusiHeight: integer("resolusi_height"),
  format: text("format"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});
```

---

### 3.12 reviews

```typescript
export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id),
  photographerId: uuid("photographer_id")
    .notNull()
    .references(() => photographerProfiles.id),
  customerClerkId: text("customer_clerk_id").notNull(),
  rating: integer("rating").notNull(), // 1 - 5
  komentar: text("komentar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

### 3.13 disputes

```typescript
export const disputes = pgTable("disputes", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  raisedBy: disputeRaisedByEnum("raised_by").notNull(),
  raisedByClerkId: text("raised_by_clerk_id").notNull(),
  alasan: text("alasan").notNull(),
  buktiUrls: text("bukti_urls").array().notNull().default([]),
  status: disputeStatusEnum("status").default("open").notNull(),
  responseText: text("response_text"),
  responseAt: timestamp("response_at"),
  responseBuktiUrls: text("response_bukti_urls").array().notNull().default([]),
  resolvedByClerkId: text("resolved_by_clerk_id"),
  catatanResolusi: text("catatan_resolusi"),
  resolvedAt: timestamp("resolved_at"),
  autoResolveAt: timestamp("auto_resolve_at").notNull(), // created_at + 3 hari
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

### 3.14 messages

```typescript
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  senderClerkId: text("sender_clerk_id").notNull(),
  pesan: text("pesan").notNull(),
  // Nomor telepon sudah difilter sebelum disimpan
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Catatan implementasi:**

- Realtime via Supabase Realtime — subscribe ke INSERT event pada tabel ini
- Filter nomor telepon dilakukan di server sebelum INSERT
- Pre-order chat: hanya bisa INSERT jika order status `pending`/`confirmed` DAN dalam 24 jam sejak chat pertama
- Post-order chat: bisa INSERT jika order status `dp_paid`/`ongoing`/`delivered`

---

## 4. Kalender Ketersediaan (Derived, Tanpa Tabel Baru)

Kalender PG di-derive secara realtime dari dua query:

```typescript
// Query 1: Tanggal ter-block karena event mitra
const blockedByEvents = await db
  .select({
    tanggalMulai: events.tanggalMulai,
    tanggalSelesai: events.tanggalSelesai,
  })
  .from(eventPhotographers)
  .innerJoin(events, eq(eventPhotographers.eventId, events.id))
  .where(eq(eventPhotographers.photographerId, photographerId));

// Query 2: Tanggal ter-block karena order aktif
const blockedByOrders = await db
  .select({ tanggalPotret: orders.tanggalPotret })
  .from(orders)
  .where(
    and(
      eq(orders.photographerId, photographerId),
      inArray(orders.status, ["confirmed", "dp_paid", "ongoing"]),
    ),
  );
```

---

## 5. Relasi Antar Tabel

```
users (clerk_id)
├── customer_profiles (1:1)
├── photographer_profiles (1:1)
│   ├── packages (1:N) — hanya untuk PG independen
│   ├── mitra_photographers (1:N) — kontrak anggota tetap
│   ├── event_photographers (1:N) — assignment + kontrak per-event
│   └── reviews (1:N)
└── mitra_profiles (1:1)
    ├── mitra_photographers (1:N)
    └── events (1:N)
        └── event_photographers (1:N)

orders
├── customer (N:1 → users)
├── photographer (N:1 → photographer_profiles)
├── package (N:1 → packages, nullable)
├── event (N:1 → events, nullable)
├── payments (1:1)
├── photos (1:N)
├── reviews (1:1)
├── disputes (1:1, nullable)
└── messages (1:N)
```

---

## 6. Index Recommendations

```sql
CREATE INDEX idx_photographer_kota ON photographer_profiles(kota_domisili);
CREATE INDEX idx_photographer_rating ON photographer_profiles(rating_average DESC);
CREATE INDEX idx_order_customer ON orders(customer_clerk_id);
CREATE INDEX idx_order_photographer ON orders(photographer_id);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_order_tanggal ON orders(tanggal_potret);
CREATE INDEX idx_event_mitra ON events(mitra_id);
CREATE INDEX idx_event_open ON events(is_open_recruitment, is_published) WHERE is_open_recruitment = true;
CREATE INDEX idx_dispute_auto_resolve ON disputes(auto_resolve_at) WHERE status = 'open';
CREATE INDEX idx_contract_active ON mitra_photographers(photographer_id)
  WHERE contract_status IN ('active', 'pending_expiry');
CREATE INDEX idx_messages_order ON messages(order_id, created_at);
CREATE INDEX idx_event_pg_photographer ON event_photographers(photographer_id);
```

---

## 7. Migration Commands

```bash
npm run db:generate   # Generate migration dari schema changes
npm run db:migrate    # Jalankan migration ke database
npm run db:push       # Dev only — push langsung tanpa migration file
npm run db:studio     # Buka Drizzle Studio
```

---

_Setiap perubahan schema HARUS didokumentasikan di sini sebelum diimplementasikan._
