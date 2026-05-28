// src/server/routes/chat.ts
// Chat API — history pesan, kirim pesan, dan mark-as-read
// Supabase Realtime secara otomatis melakukan push INSERT ke semua subscriber

import { Hono } from "hono"
import { z } from "zod"
import { zValidator } from "@hono/zod-validator"
import { and, asc, eq, ne } from "drizzle-orm"
import { clerkClient } from "@clerk/nextjs/server"

import { db } from "@/db"
import { messages, orders, photographerProfiles } from "@/db/schema"
import { requireAuth } from "@/server/middleware/auth"
import { filterContactInfo } from "@/lib/chat-filter"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnrichedMessage {
  id: string
  orderId: string
  senderClerkId: string
  senderNama: string
  senderAvatarUrl: string
  pesan: string
  isRead: boolean
  createdAt: Date
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const chatRouter = new Hono<{ Variables: { clerkId: string } }>()

chatRouter.use("*", requireAuth)

// ---------------------------------------------------------------------------
// Helper: Verifikasi apakah user terlibat dalam order (customer atau PG)
// Returns null jika tidak berwenang, atau objek order jika diizinkan.
// ---------------------------------------------------------------------------

async function getAuthorizedOrder(orderId: string, clerkId: string) {
  const [order] = await db
    .select({
      id: orders.id,
      status: orders.status,
      customerClerkId: orders.customerClerkId,
      photographerClerkId: photographerProfiles.clerkId,
    })
    .from(orders)
    .leftJoin(photographerProfiles, eq(orders.photographerId, photographerProfiles.id))
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order) return null

  const isCustomer = order.customerClerkId === clerkId
  const isPG = order.photographerClerkId === clerkId
  if (!isCustomer && !isPG) return null

  return order
}

// ---------------------------------------------------------------------------
// GET /api/chat/:orderId
// History pesan untuk order ini [AUTH]
// ---------------------------------------------------------------------------

chatRouter.get("/:orderId", async (c) => {
  const clerkId = c.get("clerkId")
  const orderId = c.req.param("orderId")

  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  const order = await getAuthorizedOrder(orderId, clerkId)
  if (!order) return c.json({ success: false, error: "Order tidak ditemukan atau Anda tidak berwenang" }, 403)

  try {
    const rawMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.orderId, orderId))
      .orderBy(asc(messages.createdAt))

    if (rawMessages.length === 0) {
      return c.json({ success: true, data: [] })
    }

    // Kumpulkan unique senderClerkId untuk fetch nama dari Clerk secara paralel
    const uniqueSenderIds = [...new Set(rawMessages.map((m) => m.senderClerkId))]
    const clerk = await clerkClient()

    const senderMap = new Map<string, { nama: string; avatarUrl: string }>()

    await Promise.all(
      uniqueSenderIds.map(async (senderId) => {
        try {
          const u = await clerk.users.getUser(senderId)
          senderMap.set(senderId, {
            nama: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Pengguna",
            avatarUrl: u.imageUrl ?? "",
          })
        } catch {
          senderMap.set(senderId, { nama: "Pengguna", avatarUrl: "" })
        }
      }),
    )

    const enriched: EnrichedMessage[] = rawMessages.map((m) => ({
      id: m.id,
      orderId: m.orderId,
      senderClerkId: m.senderClerkId,
      senderNama: senderMap.get(m.senderClerkId)?.nama ?? "Pengguna",
      senderAvatarUrl: senderMap.get(m.senderClerkId)?.avatarUrl ?? "",
      pesan: m.pesan,
      isRead: m.isRead,
      createdAt: m.createdAt,
    }))

    return c.json({ success: true, data: enriched })
  } catch (err) {
    console.error("[Chat GET] Error:", err)
    return c.json({ success: false, error: "Gagal mengambil riwayat pesan" }, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /api/chat/:orderId/messages
// Kirim pesan baru — filter kontak sebelum INSERT [AUTH]
// ---------------------------------------------------------------------------

const sendMessageSchema = z.object({
  pesan: z.string().min(1, "Pesan tidak boleh kosong").max(2000, "Pesan terlalu panjang (maks. 2000 karakter)"),
})

chatRouter.post("/:orderId/messages", zValidator("json", sendMessageSchema), async (c) => {
  const clerkId = c.get("clerkId")
  const orderId = c.req.param("orderId")

  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  const order = await getAuthorizedOrder(orderId, clerkId)
  if (!order) return c.json({ success: false, error: "Order tidak ditemukan atau Anda tidak berwenang" }, 403)

  // Chat diblokir jika order sudah selesai atau dibatalkan
  if (order.status === "completed" || order.status === "cancelled") {
    return c.json({ success: false, error: "Chat tidak tersedia untuk order yang sudah selesai atau dibatalkan" }, 400)
  }

  const body = c.req.valid("json")

  // Filter kontak sebelum INSERT — sesuai aturan proyek
  const filteredPesan = filterContactInfo(body.pesan)

  try {
    const [newMessage] = await db
      .insert(messages)
      .values({
        orderId,
        senderClerkId: clerkId,
        pesan: filteredPesan,
        isRead: false,
      })
      .returning()

    return c.json({ success: true, data: newMessage }, 201)
  } catch (err) {
    console.error("[Chat POST] Error:", err)
    return c.json({ success: false, error: "Gagal mengirim pesan" }, 500)
  }
})

// ---------------------------------------------------------------------------
// PATCH /api/chat/:orderId/read
// Mark pesan dari pihak lain sebagai sudah dibaca [AUTH]
// ---------------------------------------------------------------------------

chatRouter.patch("/:orderId/read", async (c) => {
  const clerkId = c.get("clerkId")
  const orderId = c.req.param("orderId")

  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  const order = await getAuthorizedOrder(orderId, clerkId)
  if (!order) return c.json({ success: false, error: "Order tidak ditemukan atau Anda tidak berwenang" }, 403)

  try {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.orderId, orderId), ne(messages.senderClerkId, clerkId)))

    return c.json({ success: true, data: { message: "Semua pesan ditandai sebagai dibaca" } })
  } catch (err) {
    console.error("[Chat PATCH read] Error:", err)
    return c.json({ success: false, error: "Gagal memperbarui status pesan" }, 500)
  }
})

export { chatRouter }
