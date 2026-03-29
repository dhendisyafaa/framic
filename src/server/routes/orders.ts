import { Hono } from "hono"
import { z } from "zod"
import { zValidator } from "@hono/zod-validator"
import { and, eq, desc, or } from "drizzle-orm"
import { db } from "@/db"
import {
  orders,
  payments,
  photographerProfiles,
  packages,
  events,
  eventPhotographers,
  mitraPhotographers,
  users
} from "@/db/schema"
import { getPhotographerBlockedDates } from "@/lib/calendar"
import { format, startOfDay, endOfDay } from "date-fns"

import { requireAuth } from "@/server/middleware/auth"
import { clerkClient } from "@clerk/nextjs/server"
import { photos, reviews } from "@/db/schema"

const ordersRouter = new Hono<{ Variables: { clerkId: string } }>()

// Proteksi semua rute orders dengan autentikasi
ordersRouter.use("*", requireAuth)

// --- SCHEMAS ---

const createOrderSchema = z.object({
  photographerId: z.string().uuid(),
  paketId: z.string().uuid().nullable(),
  orderType: z.enum(["direct", "event"]),
  eventId: z.string().uuid().nullable(),
  lokasi: z.string().min(3),
  tanggalPotret: z.string().datetime(), // ISO string
  catatan: z.string().optional(),
})

// --- ROUTES ---

/**
 * POST /api/orders
 * Buat order baru (Status: pending)
 * Wajib melakukan kalkulasi fee & snapshot di dalam transaksi.
 */
ordersRouter.post("/", zValidator("json", createOrderSchema), async (c) => {
  const clerkId = c.get("clerkId")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  const body = c.req.valid("json")
  const tanggalPotretDate = new Date(body.tanggalPotret)
  const tanggalStr = format(tanggalPotretDate, "yyyy-MM-dd")

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Validasi ketersediaan fotografer (Race Condition Prevention)
      // Kita panggil lib calendar tapi pastikan logic-nya konsisten dengan filter status order
      const blockedDates = await getPhotographerBlockedDates(
        body.photographerId,
        startOfDay(tanggalPotretDate),
        endOfDay(tanggalPotretDate),
        tx
      )

      if (blockedDates.includes(tanggalStr)) {
        throw new Error("Fotografer sudah memiliki agenda di tanggal tersebut")
      }

      // 2. Fetch data fotografer (Pastikan verified)
      const [pg] = await tx
        .select()
        .from(photographerProfiles)
        .where(eq(photographerProfiles.id, body.photographerId))
        .limit(1)

      if (!pg || pg.verificationStatus !== "verified") {
        throw new Error("Fotografer tidak ditemukan atau belum terverifikasi")
      }

      let totalHarga = 0
      let platformFeePercent = 10 // Default platform fee
      let mitraPercent: number | null = null
      let photographerPercent = 90

      // 3. Kalkulasi harga & persentase berdasarkan tipe order
      if (body.orderType === "direct") {
        if (!body.paketId) throw new Error("Paket ID wajib diisi untuk order direct")

        const [paket] = await tx
          .select()
          .from(packages)
          .where(and(eq(packages.id, body.paketId), eq(packages.photographerId, pg.id)))
          .limit(1)

        if (!paket || !paket.isActive) throw new Error("Paket tidak ditemukan atau tidak aktif")

        totalHarga = paket.harga
        // Direct order: mitraPercent = null, platformFeePercent = 10, pg = 90
      } else {
        // Order via Event
        if (!body.eventId) throw new Error("Event ID wajib diisi untuk order event")

        const [event] = await tx
          .select()
          .from(events)
          .where(eq(events.id, body.eventId))
          .limit(1)

        if (!event) throw new Error("Event tidak ditemukan")

        const [ep] = await tx
          .select()
          .from(eventPhotographers)
          .where(and(
            eq(eventPhotographers.eventId, event.id),
            eq(eventPhotographers.photographerId, pg.id)
          ))
          .limit(1)

        if (!ep) throw new Error("Fotografer tidak terdaftar di event ini")

        // Tentukan harga berdasarkan tipe penugasan PG di event
        if (ep.photographerType === "mitra_permanent") {
          totalHarga = event.feePgTetap ?? 0

          // Ambil persentase dari kontrak aktif mitra
          const [contract] = await tx
            .select()
            .from(mitraPhotographers)
            .where(and(
              eq(mitraPhotographers.mitraId, event.mitraId),
              eq(mitraPhotographers.photographerId, pg.id),
              eq(mitraPhotographers.contractStatus, "active")
            ))
            .limit(1)

          if (!contract) throw new Error("Kontrak mitra tidak aktif")
          mitraPercent = contract.mitraPercent
          photographerPercent = contract.photographerPercent
        } else {
          // event_only
          totalHarga = event.feePgPerEvent ?? 0
          if (ep.invitationStatus !== "accepted") throw new Error("Undangan event belum disetujui")

          if (!ep.mitraPercent || !ep.photographerPercent) {
            throw new Error("Persentase kontrak event belum disepakati")
          }

          mitraPercent = ep.mitraPercent
          photographerPercent = ep.photographerPercent
        }
      }

      if (totalHarga <= 0) throw new Error("Terjadi kesalahan dalam penentuan harga order")

      // 4. Insert Order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          customerClerkId: clerkId,
          photographerId: pg.id,
          paketId: body.paketId,
          orderType: body.orderType,
          eventId: body.eventId,
          lokasi: body.lokasi,
          tanggalPotret: tanggalPotretDate,
          catatan: body.catatan,
          totalHarga: totalHarga,
          status: "pending",
        })
        .returning()

      // 5. Insert Payment (Snapshot Fees)
      const jumlahDp = Math.floor(totalHarga * 0.5)
      const jumlahPelunasan = totalHarga - jumlahDp

      await tx.insert(payments).values({
        orderId: newOrder.id,
        jumlahDp,
        jumlahPelunasan,
        platformFeePercent,
        mitraPercent,
        photographerPercent,
        statusDp: "unpaid",
        statusPelunasan: "unpaid",
      })

      return newOrder
    })

    return c.json({ success: true, data: result }, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return c.json({ success: false, error: message }, 400)
  }
})

/**
 * GET /api/orders
 * List order milik user (sebagai customer atau photographer)
 */
ordersRouter.get("/", async (c) => {
  const clerkId = c.get("clerkId")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  const page = Number(c.req.query("page")) || 1
  const limit = Number(c.req.query("limit")) || 10
  const offset = (page - 1) * limit
  const statusFilter = c.req.query("status")

  // Fetch photographer profile dulu dalam query terpisah
  const [pgProfile] = await db
    .select({ id: photographerProfiles.id })
    .from(photographerProfiles)
    .where(eq(photographerProfiles.clerkId, clerkId))
    .limit(1)

  // Logic filter berdasarkan role user (Kustomer atau Fotografer)
  const orParts = [eq(orders.customerClerkId, clerkId)]
  if (pgProfile) {
    orParts.push(eq(orders.photographerId, pgProfile.id))
  }

  const conditions = [or(...orParts)]

  if (statusFilter) {
    conditions.push(
      eq(orders.status, statusFilter as typeof orders.status._.data)
    )
  }

  const userOrders = await db
    .select({
      order: orders,
      package: packages,
      photographer: photographerProfiles,
    })
    .from(orders)
    .leftJoin(packages, eq(orders.paketId, packages.id))
    .leftJoin(photographerProfiles, eq(orders.photographerId, photographerProfiles.id))
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(orders.createdAt))

  // Map to structured data
  const result = userOrders.map(row => ({
    ...row.order,
    package: row.package,
    photographer: row.photographer
  }))

  return c.json({ success: true, data: result })
})

/**
 * GET /api/orders/:id
 * Detail order lengkap dengan info pembayaran
 */
ordersRouter.get("/:id", async (c) => {
  const clerkId = c.get("clerkId")
  const orderId = c.req.param("id")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  const [orderWithDetails] = await db
    .select({
      order: orders,
      package: packages,
      payment: payments,
      photographer: photographerProfiles,
    })
    .from(orders)
    .leftJoin(packages, eq(orders.paketId, packages.id))
    .leftJoin(payments, eq(orders.id, payments.orderId))
    .leftJoin(photographerProfiles, eq(orders.photographerId, photographerProfiles.id))
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!orderWithDetails) return c.json({ success: false, error: "Order tidak ditemukan" }, 404)

  // Auth check
  const isCustomer = orderWithDetails.order.customerClerkId === clerkId
  const isPhotographer = orderWithDetails.photographer?.clerkId === clerkId

  if (!isCustomer && !isPhotographer) {
    return c.json({ success: false, error: "Forbidden" }, 403)
  }

  // Fetch extra data in parallel
  const [photosData, reviewData] = await Promise.all([
    db.select().from(photos).where(eq(photos.orderId, orderId)),
    db.select().from(reviews).where(eq(reviews.orderId, orderId)).limit(1)
  ])

  // Resolve Names from Clerk
  const clerk = await clerkClient()
  let photographerName = "Fotografer"
  let customerName = "Kustomer"

  try {
    const [pgUser, custUser] = await Promise.all([
      orderWithDetails.photographer ? clerk.users.getUser(orderWithDetails.photographer.clerkId) : null,
      clerk.users.getUser(orderWithDetails.order.customerClerkId)
    ])
    if (pgUser) photographerName = `${pgUser.firstName || ""} ${pgUser.lastName || ""}`.trim()
    if (custUser) customerName = `${custUser.firstName || ""} ${custUser.lastName || ""}`.trim()
  } catch (err) {
    // Silent fail if clerk error
  }

  // Combine results
  const result = {
    ...orderWithDetails.order,
    package: orderWithDetails.package,
    payment: orderWithDetails.payment,
    photographer: {
      ...orderWithDetails.photographer,
      nama: photographerName
    },
    customerName,
    photos: photosData || [],
    review: reviewData[0] || null
  }

  return c.json({ success: true, data: result })
})

// --- STATUS TRANSITIONS ---

/**
 * PATCH /api/orders/:id/confirm
 * PG menyetujui Order
 */
ordersRouter.patch("/:id/confirm", async (c) => {
  const clerkId = c.get("clerkId")
  const orderId = c.req.param("id")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  try {
    const order = await db.transaction(async (tx) => {
      // 1. Cek ownership PG
      const [pg] = await tx
        .select()
        .from(photographerProfiles)
        .where(and(eq(photographerProfiles.clerkId, clerkId)))
        .limit(1)

      const [existingOrder] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.photographerId, pg?.id || "")))
        .limit(1)

      if (!existingOrder) throw new Error("Order tidak ditemukan atau Anda tidak berwenang")
      if (existingOrder.status !== "pending") throw new Error("Hanya order berstatus 'pending' yang bisa dikonfirmasi")

      // 2. Update Status
      const [updated] = await tx
        .update(orders)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning()

      return updated
    })

    return c.json({ success: true, data: order })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return c.json({ success: false, error: message }, 400)
  }
})

/**
 * PATCH /api/orders/:id/reject
 * PG menolak Order
 */
ordersRouter.patch("/:id/reject", async (c) => {
  const clerkId = c.get("clerkId")
  const orderId = c.req.param("id")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  try {
    const order = await db.transaction(async (tx) => {
      const [pg] = await tx.select().from(photographerProfiles).where(eq(photographerProfiles.clerkId, clerkId)).limit(1)
      const [existing] = await tx.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.photographerId, pg?.id || ""))).limit(1)

      if (!existing) throw new Error("Order tidak ditemukan")
      if (existing.status !== "pending") throw new Error("Tidak bisa menolak order yang sudah diproses")

      const [updated] = await tx
        .update(orders)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledBy: clerkId,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning()

      return updated
    })

    return c.json({ success: true, data: order })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return c.json({ success: false, error: message }, 400)
  }
})

/**
 * PATCH /api/orders/:id/ongoing
 * PG mulai sesi foto
 */
ordersRouter.patch("/:id/ongoing", async (c) => {
  const clerkId = c.get("clerkId")
  const orderId = c.req.param("id")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  try {
    const [pg] = await db.select().from(photographerProfiles).where(eq(photographerProfiles.clerkId, clerkId)).limit(1)
    const [existing] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.photographerId, pg?.id || ""))).limit(1)

    if (!existing) return c.json({ success: false, error: "Order tidak ditemukan" }, 404)
    if (existing.status !== "dp_paid") return c.json({ success: false, error: "Hanya order yang sudah bayar DP yang bisa dimulai" }, 400)

    const [updated] = await db
      .update(orders)
      .set({ status: "ongoing", updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning()

    return c.json({ success: true, data: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return c.json({ success: false, error: message }, 400)
  }
})

/**
 * PATCH /api/orders/:id/deliver
 * PG selesai mengupload foto
 */
ordersRouter.patch("/:id/deliver", async (c) => {
  const clerkId = c.get("clerkId")
  const orderId = c.req.param("id")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  try {
    const [pg] = await db.select().from(photographerProfiles).where(eq(photographerProfiles.clerkId, clerkId)).limit(1)
    const [existing] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.photographerId, pg?.id || ""))).limit(1)

    if (!existing) return c.json({ success: false, error: "Order tidak ditemukan" }, 404)
    if (existing.status !== "ongoing") return c.json({ success: false, error: "Hanya order ongoing yang bisa di-deliver" }, 400)

    const [updated] = await db
      .update(orders)
      .set({
        status: "delivered",
        deliveredAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning()

    return c.json({ success: true, data: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return c.json({ success: false, error: message }, 400)
  }
})

/**
 * PATCH /api/orders/:id/complete
 * Customer konfirmasi selesai (setelah pelunasan - diatur di webhook payment nanti)
 */
ordersRouter.patch("/:id/complete", async (c) => {
  const clerkId = c.get("clerkId")
  const orderId = c.req.param("id")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  try {
    const [existing] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.customerClerkId, clerkId))).limit(1)

    if (!existing) return c.json({ success: false, error: "Order tidak ditemukan" }, 404)
    if (existing.status !== "delivered") return c.json({ success: false, error: "Hanya order tersampaikan yang bisa diselesaikan" }, 400)

    const [updated] = await db
      .update(orders)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning()

    return c.json({ success: true, data: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return c.json({ success: false, error: message }, 400)
  }
})

/**
 * PATCH /api/orders/:id/cancel
 * Pembatalan sebelum DP dibayar
 */
ordersRouter.patch("/:id/cancel", async (c) => {
  const clerkId = c.get("clerkId")
  const orderId = c.req.param("id")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  try {
    const [existing] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    if (!existing) return c.json({ success: false, error: "Order tidak ditemukan" }, 404)

    // Auth Check
    const [pg] = await db.select().from(photographerProfiles).where(eq(photographerProfiles.clerkId, clerkId)).limit(1)
    const isAuthorized = existing.customerClerkId === clerkId || existing.photographerId === pg?.id

    if (!isAuthorized) return c.json({ success: false, error: "Forbidden" }, 403)

    // Syarat pembatalan: sebelum DP paid
    if (["dp_paid", "ongoing", "delivered", "completed"].includes(existing.status)) {
      return c.json({ success: false, error: "Order sudah diproses pembayaran, tidak bisa dibatalkan sembarangan." }, 400)
    }

    const [updated] = await db
      .update(orders)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: clerkId,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning()

    return c.json({ success: true, data: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return c.json({ success: false, error: message }, 400)
  }
})

export { ordersRouter }
