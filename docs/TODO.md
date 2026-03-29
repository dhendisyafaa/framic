# Framic — Implementation Todo List

> Berdasarkan: `docs/PRD.md`, `docs/TECHNICAL.md`, `docs/DATABASE.md`, `docs/API.md`  
> Urutan dari fondasi → fitur lengkap. Item bertanda 🔒 adalah **blocker** untuk fase berikutnya.

---

## Fase 0 — Project Setup & Infrastruktur

> Wajib selesai sebelum semua fase lain bisa dimulai.

- [x] 🔒 Inisialisasi Next.js 16 + TypeScript strict (`tsconfig.json` dengan `strict: true`, no `any`)
- [x] 🔒 Setup Hono.js — entry point `src/app/api/[[...route]]/route.ts`
- [x] 🔒 Setup Docker Compose untuk PostgreSQL 15 lokal (`docker-compose.yml`)
- [x] 🔒 Setup Drizzle ORM — `src/db/index.ts` + `drizzle.config.ts`
- [x] Setup `.env.local` dan `.env.example` (semua variabel dari TECHNICAL.md §4)
- [x] Setup ESLint + Prettier
- [x] Setup Clerk — `src/lib/clerk.ts` + konfigurasi env
- [x] Setup shadcn/ui — `npx shadcn@latest init`
- [x] Setup Scalar API docs
- [x] Setup Supabase client — `src/lib/supabase.ts` (hanya untuk Realtime)
- [x] Setup Cloudinary — `src/lib/cloudinary.ts`
- [x] Setup Xendit — `src/lib/xendit.ts`
- [x] Setup Resend — `src/lib/resend.ts`
- [x] Setup Sentry — `src/lib/sentry.ts`
- [x] Setup PostHog — konfigurasi di `src/config/`
- [x] `src/config/constants.ts` — `DP_PERCENTAGE`, `MAX_UPLOAD_SIZE`, dll.
- [x] `src/config/site.ts` — metadata site
- [x] `src/lib/utils.ts` — `cn()`, `formatRupiah()`, dll.
- [x] Setup Vitest + Playwright (testing infrastructure)
- [x] Middleware Clerk — `src/middleware.ts` (public vs protected routes)

---

## Fase 1 — Database Schema & Migration

> 🔒 Blocker untuk semua fase berikutnya. Harus selesai sebelum ada endpoint apapun.

### Enums (harus pertama)
- [x] 🔒 `src/db/schema/enums.ts` — semua enum PostgreSQL:
  - `verification_status`, `contract_status`, `invitation_status`
  - `initiated_by`, `order_status`, `order_type`
  - `dp_status`, `settlement_status`, `dispute_status`
  - `dispute_raised_by`, `mitra_type`, `pg_type`

### Schema per entitas (urut sesuai dependency)
- [x] 🔒 `src/db/schema/user.ts` — tabel `users` (bridge Clerk ↔ DB)
- [x] 🔒 `src/db/schema/photographer.ts` — tabel `photographer_profiles`
- [x] 🔒 `src/db/schema/mitra.ts` — tabel `mitra_profiles`
- [x] `src/db/schema/customer.ts` — tabel `customer_profiles`
- [x] `src/db/schema/package.ts` — tabel `packages` (FK → photographer_profiles)
- [x] `src/db/schema/mitra-photographer.ts` — tabel `mitra_photographers` (FK → mitra + photographer)
- [x] `src/db/schema/event.ts` — tabel `events` (FK → mitra_profiles)
- [x] `src/db/schema/event-photographer.ts` — tabel `event_photographers` (FK → events + photographer)
- [x] `src/db/schema/order.ts` — tabel `orders` (FK → photographer + package + event)
- [x] `src/db/schema/payment.ts` — tabel `payments` (FK → orders)
- [x] `src/db/schema/photo.ts` — tabel `photos` (FK → orders)
- [x] `src/db/schema/review.ts` — tabel `reviews` (FK → orders + photographer)
- [x] `src/db/schema/dispute.ts` — tabel `disputes` (FK → orders)
- [x] `src/db/schema/message.ts` — tabel `messages` (FK → orders)
- [x] `src/db/schema/index.ts` — re-export semua schema

### Migration & Index
- [x] 🔒 Jalankan `npm run db:push` (dev) atau `db:generate` + `db:migrate`
- [x] Tambahkan index rekomendasi dari DATABASE.md §6 (manual SQL atau via Drizzle)

---

## Fase 2 — Auth & Onboarding

> Bergantung pada: Fase 0 (Clerk) + Fase 1 (tabel `users`)

### Server (Hono routes)
- [x] 🔒 `src/server/middleware/auth.ts` — Clerk auth middleware untuk Hono
- [x] `src/server/middleware/error-handler.ts`
- [x] `src/server/middleware/logger.ts`
- [x] `src/server/index.ts` — Hono app setup + register semua router
- [x] 🔒 `src/server/routes/users.ts`:
  - `GET /api/users/me`
  - `PATCH /api/users/me/customer-profile`
  - `POST /api/users/apply/photographer` (buat `photographer_profiles`, status `pending`)
  - `POST /api/users/apply/mitra` (upload dok legalitas ke Cloudinary, status `pending`)

### UI (Next.js pages)
- [x] Halaman sign-in — `src/app/(auth)/sign-in/`
- [x] Halaman sign-up — `src/app/(auth)/sign-up/`
- [x] Halaman onboarding — redirect setelah sign-up, pilih role tambahan
- [x] Form apply photographer (bio, kota, kategori)
- [x] Form apply mitra (org info + upload dokumen)
- [x] Halaman "Menunggu Verifikasi"

---

## Fase 3 — Discovery & Profil Publik

> Bergantung pada: Fase 1 (schema photographer, package, event)

### Library
- [x] `src/lib/calendar.ts` — `getPhotographerBlockedDates()` (derive dari event_photographers + orders)
- [x] `src/types/index.ts` + `src/types/api.ts` — semua TypeScript types / interfaces

### Server
- [x] `src/server/routes/photographers.ts`:
  - `GET /api/photographers` (dengan filter: kota, kategori, minRating, available, sortBy)
  - `GET /api/photographers/:id` (detail + paket + ulasan terbaru)
  - `GET /api/photographers/:id/calendar` (query param: `month`)
  - `PATCH /api/photographers/me`
  - `POST /api/photographers/me/portfolio` (upload ke Cloudinary)
- [x] `src/server/routes/packages.ts`:
  - `GET /api/photographers/:photographerId/packages`
  - `POST /api/packages`
  - `PATCH /api/packages/:id`
  - `DELETE /api/packages/:id` (soft delete)
- [x] `src/server/routes/events.ts` (READ only dulu):
  - `GET /api/events`
  - `GET /api/events/open`
  - `GET /api/events/:id`
- [x] `src/server/routes/reviews.ts` (READ only):
  - `GET /api/reviews/photographer/:photographerId`

### UI
- [x] Landing page — `src/app/(marketing)/page.tsx`
- [x] Halaman list fotografer — `src/app/(marketing)/photographers/page.tsx`
- [x] Komponen filter fotografer — `src/components/features/photographer/photographer-filter.tsx`
- [x] Komponen card fotografer — `src/components/features/photographer/photographer-card.tsx`
- [x] Halaman detail fotografer — `src/app/(marketing)/photographers/[id]/page.tsx`
- [x] Komponen kalender ketersediaan — `src/components/features/calendar/`
- [x] `src/hooks/use-calendar.ts`
- [x] Halaman list event — `src/app/(marketing)/events/page.tsx`
- [x] Halaman open recruitment — `src/app/(marketing)/events/open/page.tsx`
- [x] Navbar + Footer — `src/components/common/`

---

## Fase 4 — Core Order & Payment Flow

> 🔒 Ini adalah core value Framic. Bergantung pada: Fase 2 (auth) + Fase 3 (photographer)

### Server
- [x] `src/server/routes/orders.ts`:
  - [x] `POST /api/orders` — validasi kalender, buat order + payment record
  - [x] `GET /api/orders` — list by role
  - [x] `GET /api/orders/:id`
  - [x] `PATCH /api/orders/:id/confirm` — PG konfirmasi → status `confirmed`
  - [x] `PATCH /api/orders/:id/reject`
  - [x] `PATCH /api/orders/:id/cancel`
  - [x] `PATCH /api/orders/:id/ongoing`
  - [x] `PATCH /api/orders/:id/deliver` — PG mark delivered
  - [x] `PATCH /api/orders/:id/complete` — customer konfirmasi → `completed`
- [x] `src/server/routes/payments.ts`:
  - [x] `POST /api/payments/:orderId/dp` — buat Xendit invoice (50%)
  - [x] `POST /api/payments/:orderId/settle` — buat Xendit invoice pelunasan (50%)
  - [x] `POST /api/webhooks/xendit` — validasi token, update status, trigger split payment
- [x] `src/server/routes/photos.ts`:
  - [x] `POST /api/photos/:orderId` — upload ke Cloudinary (max 100 foto)
  - [x] `GET /api/photos/:orderId`
  - [x] `DELETE /api/photos/:photoId`
- [x] `src/server/routes/reviews.ts` (WRITE):
  - [x] `POST /api/reviews` — validasi order completed, update rating aggregate

### UI (Dashboard)
- [x] Dashboard utama — `src/app/(dashboard)/dashboard/page.tsx` (beda per role)
- [x] Halaman list order — `src/app/(dashboard)/orders/page.tsx`
- [x] Halaman detail order — `src/app/(dashboard)/orders/[id]/page.tsx`
- [x] Komponen order card — `src/components/features/order/order-card.tsx` (In-page implementation)
- [x] Komponen order status timeline — `src/components/features/order/order-status.tsx` (In-page implementation)
- [x] Form buat order (dari halaman detail PG) -> **Refactored: React Hook Form + Zod**
- [x] Halaman pembayaran DP — redirect setelah buat order
- [x] Halaman upload foto (PG) — `src/components/features/order/photo-upload.tsx` (In-page implementation)
- [x] Halaman preview + download foto (customer)
- [x] Form ulasan — `src/components/features/order/review-form.tsx` -> **Refactored: React Hook Form + Zod**
- [x] `src/hooks/use-order.ts` (Handled via useQuery & useMutation hooks directly)

---

### ✅ Fase 4.5 — Completed Polish & Refactoring (Recent Updates)
- [x] **Form Validation**: Transformasi form Booking dan Ulasan menggunakan `react-hook-form` + `zod` untuk validasi yang ketat dan UX lebih baik.
- [x] **Premium UI Redesign**: Redesain *Package Card* pada profil publik fotografer (tampilan mewah, indikator "Best Seller", & agregasi jumlah booking transparan).
- [x] **UX Safety**: Implementasi *Exit Confirmation Dialog* pada modal Booking untuk mencegah hilangnya progres pemilihan paket secara tidak sengaja.
- [x] **Terminologi Konsisten**: Standarisasi penggunaan istilah "Pesanan" menjadi "Order" di seluruh antarmuka dashboard.
- [x] **Dashboard Efficiency**: Penambahan aksi cepat (Konfirmasi/Tolak Order) langsung di landing page *Photographer Dashboard*.
- [x] **Mobile Responsiveness**: Perbaikan layout *TabsList* (horizontal scroll) pada halaman kelola profil fotografer.
- [x] **Review Data Optimization**: Perbaikan render ulasan di halaman detail fotografer (menghapus fetch redundan, optimasi load menggunakan data `recentReviews`, dan perbaikan mapping field `komentar`).
- [x] **Calendar API Reliability**: Perbaikan error 500 pada API kalender melalui standarisasi format ISO untuk parameter tanggal dan penanganan *name collision* tipe enum `pg_type` menggunakan explicit cast `::text`.
- [x] **Calendar Hook Correction**: Sinkronisasi data mapping pada `use-calendar` hook dengan respons API dan penggunaan format lokal `yyyy-MM` untuk akurasi navigasi bulan pada UI.
- [x] **Admin Dashboard Implementation**: Implementasi sistem verifikasi admin end-to-end untuk fotografer dan mitra, mencakup logika backend (enrichment data Clerk) dan UI manajemen yang responsif.
- [x] **API Data Enrichment**: Refactor route admin untuk menarik data profil dari DB dan detail user (nama, email) dari Clerk API secara batch untuk performa dan isolasi data yang lebih baik.
- [x] **Booking UI Redesign**: Redesain dialog `BookingButton` dengan estetika premium, indikator progress dinamis, card bergaya glassmorphism, dan tema warna yang sinkron dengan brand primary.
- [x] **UX & Filter Fixes**: Perbaikan bug *infinite loop* pada filter katalog fotografer dan alur "Auto-Next" pada dialog booking.
- [x] **Dev Tooling**: Pembuatan koleksi Postman lengkap untuk testing API di semua role (Admin, PG, Customer, Mitra).
- [x] **Order Detail Actions**: Implementasi halaman detail order (`/orders/[id]`) dengan tombol aksi dinamis sesuai status dan role.

---

## Fase 5 — Chat Realtime (Supabase)

> Bergantung pada: Fase 4 (order harus ada). Supabase Realtime—bukan Socket.io.

### Library & Hook
- [ ] `src/lib/chat-filter.ts` — `filterContactInfo()` (filter 08xx/+62xx/email → `[informasi kontak disembunyikan]`)
- [ ] `src/hooks/use-chat.ts` — subscribe ke Supabase Realtime `postgres_changes` pada `messages`

### Server
- [ ] `src/server/routes/chat.ts`:
  - `GET /api/chat/:orderId` — history pesan
  - `POST /api/chat/:orderId/messages` — filter kontak → INSERT (Realtime push otomatis)
  - `PATCH /api/chat/:orderId/read` — mark pesan dibaca

### UI
- [ ] Komponen chat window — `src/components/features/chat/chat-window.tsx`
- [ ] Komponen chat bubble — `src/components/features/chat/chat-bubble.tsx`
- [ ] Input chat dengan filter hint

---

## Fase 6 — Mitra & Event System

> Bergantung pada: Fase 2 (auth mitra) + Fase 4 (order flow sudah ada)

### Server
- [x] `src/server/routes/mitra.ts`:
  - `GET /api/mitra/:id`
  - `GET /api/mitra/me/photographers`
  - `POST /api/mitra/me/photographers/invite` — validasi PG belum punya kontrak aktif
  - `POST /api/mitra/me/join-request/:pgId/respond` — acc/deny request PG
  - `PATCH /api/mitra/photographers/:contractId/terminate` — validasi tidak ada order aktif
- [x] Tambah ke `src/server/routes/events.ts` (WRITE):
  - `POST /api/events` — buat event + upload cover image
  - `POST /api/events/:id/assign-photographer` — assign PG tetap (validasi minimum fee)
  - `POST /api/events/:id/invite-photographer` — invite PG per-event
  - `POST /api/events/:id/request` — PG request ke open recruitment
  - `PATCH /api/events/:eventId/photographers/:entryId/respond` — acc/deny
  - `PATCH /api/events/:id/publish`
- [x] Tambah ke `src/server/routes/photographers.ts`:
  - `POST /api/photographers/me/mitra-request` — PG request ke mitra
  - `PATCH /api/photographers/me/contracts/:contractId/respond` — acc/deny invite mitra

### UI (Dashboard Mitra)
- [x] Dashboard mitra — manajemen PG tetap + list event
- [x] Form buat event
- [x] Halaman manajemen PG di event — assign, invite, open recruitment
- [x] Halaman open recruitment (publik) — `src/app/(marketing)/events/open/`
- [x] Section pending invites di dashboard PG

---

## Fase 7 — MoU & Kontrak Digital (MVP)

> Bergantung pada: Fase 6 (flow invite/request sudah ada)

### Server
- [x] `src/server/routes/contracts.ts`:
  - [x] `GET /api/contracts/:contractId` — detail terms kontrak dari database
  - [x] `POST /api/contracts/:contractId/sign` — e-sign: simpan `signed_at` timestamp + IP address
    - [x] Jika kedua pihak sudah sign → update status kontrak
    - [x] Kontrak mitra: update `contract_status = 'active'`
    - [x] Kontrak per-event: update `invitation_status = 'accepted'`

### UI
- [x] Halaman review & negosiasi terms MoU (tampilkan data dari DB)
- [x] Halaman e-sign — checkbox konfirmasi + tampilkan ringkasan terms
- [x] Konfirmasi sign berhasil (kedua pihak)

> **Post-MVP:** Generate PDF MoU dari template + upload ke Cloudinary + integrasi Privy e-sign legal.

---

## Fase 8 — Dispute & Admin

> Bergantung pada: Fase 4 (order + payment sudah ada)

### Server
- [ ] `src/server/routes/disputes.ts`:
  - `POST /api/disputes` — raise dispute, set `auto_resolve_at = now() + 3 days`
  - `POST /api/disputes/:id/respond` — upload bukti respons
  - `GET /api/disputes/:id`
- [x] `src/server/routes/admin.ts`:
  - [x] `GET /api/admin/verifications` — list pengajuan PG + mitra pending (Clerk enriched)
  - [x] `POST /api/admin/verifications/:targetClerkId/approve-photographer` — update DB + Clerk publicMetadata
  - [x] `POST /api/admin/verifications/:targetClerkId/approve-mitra` — update DB + Clerk publicMetadata
  - [ ] `PATCH /api/admin/verifications/:id/reject`
  - [ ] `GET /api/admin/disputes` — list dispute aktif
  - [ ] `PATCH /api/admin/disputes/:id/resolve` — resolve dispute (refund atau cairkan)
  - [ ] `GET /api/admin/stats`
- [ ] Cron job / background task — auto-resolve dispute setelah 3x24 jam

### UI
- [ ] Dashboard admin — verifikasi PG + mitra (UI + API enrichment)
- [ ] Dashboard admin — manajemen dispute

---

## Fase 9 — Email Notifikasi

> Bergantung pada: Fase 4 (order/payment), bisa dikerjakan paralel dengan Fase 5–8

- [ ] Template email order baru (customer + PG)
- [ ] Template email DP berhasil
- [ ] Template email pelunasan berhasil
- [ ] Template email order completed
- [ ] Template email verifikasi approved/rejected (admin → PG/mitra)
- [ ] Template email dispute raised
- [ ] Integrasikan email trigger di webhook Xendit + admin routes

---

## Fase 10 — Polish & Go Live

- [ ] Error boundaries di semua halaman utama
- [x] Loading states + skeleton UI *(Diimplementasikan bertahap sejak Fase 3 & 4; ex: DashboardSkeleton, OrderDetailsSkeleton)*
- [x] Responsive design (mobile-friendly) *(Dikerjakan paralel; ex: layout container, horizontal scroll menu mobile)*
- [ ] SEO — meta tags, OG tags di halaman publik
- [ ] Sentry error monitoring aktif di production *(Setup codebase selesai di Fase 0, tinggal aktivasi production)*
- [ ] PostHog analytics aktif *(Setup codebase selesai di Fase 0, tinggal aktivasi production)*
- [ ] Setup Supabase staging + Supabase production (bukan Docker)
- [ ] Deploy ke Vercel
- [ ] E2E test (Playwright) untuk happy path: register → booking → bayar DP → upload foto → selesai
- [ ] Setup RLS (Row Level Security) di Supabase untuk tabel `messages`

---

## Ringkasan Dependensi Antar Fase

```
Fase 0 (Setup)
    └── Fase 1 (Database Schema)  🔒
            ├── Fase 2 (Auth)  🔒
            │       ├── Fase 3 (Discovery)
            │       │       └── Fase 4 (Order & Payment)  🔒 CORE
            │       │               ├── Fase 5 (Chat)
            │       │               ├── Fase 6 (Mitra & Event)
            │       │               │       └── Fase 7 (MoU)
            │       │               └── Fase 8 (Dispute & Admin)
            │       └── (paralel) Fase 9 (Email)
            └── (paralel) Fase 10 (Polish)
```

---

> **Aturan wajib selama implementasi:**
> - Update `docs/DATABASE.md` SEBELUM mengubah schema
> - Update `docs/API.md` SEBELUM menambah endpoint baru
> - NO `any` di TypeScript — selalu gunakan proper types
> - Semua multi-table update wajib pakai `db.transaction()`
> - DP selalu 50%, pelunasan selalu 50%
> - Kalender = derived query, tidak ada tabel terpisah
> - Chat = Supabase Realtime, bukan Socket.io
