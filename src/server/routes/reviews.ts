import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { db } from "@/db"
import { reviews } from "@/db/schema"
import { desc, eq, sql } from "drizzle-orm"

import { requireAuth } from "@/server/middleware/auth"

export const reviewsRouter = new Hono<{ Variables: { clerkId: string } }>()

const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
})

// GET /api/reviews/photographer/:photographerId
// List rating/ulasan untuk seorang fotografer
// ---------------------------------------------------------------------------
reviewsRouter.get(
  "/photographer/:photographerId",
  zValidator("query", paginationSchema),
  async (c) => {
    const pgId = c.req.param("photographerId")
    const { page, limit } = c.req.valid("query")
    const offset = (page - 1) * limit

    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(${reviews.id}) as int)` })
      .from(reviews)
      .where(eq(reviews.photographerId, pgId))

    const rows = await db
      .select()
      .from(reviews)
      .where(eq(reviews.photographerId, pgId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset)

    console.log("rows", rows)

    return c.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit) || 1,
      },
    })
  }
)

// Proteksi rute ulasan (terutama untuk POST pembuatan review)
reviewsRouter.use("*", requireAuth)

/**
 * POST /api/reviews
 * Customer membuat ulasan untuk order yang sudah selesai.
 */
const createReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().min(1).max(5).int(),
  komentar: z.string().optional(),
})

import { orders, photographerProfiles } from "@/db/schema"

reviewsRouter.post("/", zValidator("json", createReviewSchema), async (c) => {
  const clerkId = c.get("clerkId")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  const { orderId, rating, komentar } = c.req.valid("json")

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Validasi Order
      const [orderData] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1)

      if (!orderData) throw new Error("Order tidak ditemukan")
      if (orderData.customerClerkId !== clerkId) throw new Error("Forbidden: Anda bukan pemilik order ini")
      if (orderData.status !== "completed") throw new Error("Ulasan hanya bisa diberikan setelah order 'completed'")

      // 2. Cek apakah sudah pernah review (1 order = 1 review)
      const [existing] = await tx
        .select()
        .from(reviews)
        .where(eq(reviews.orderId, orderId))
        .limit(1)

      if (existing) throw new Error("Anda sudah memberikan ulasan untuk order ini")

      // 3. Simpan Review
      const [newReview] = await tx
        .insert(reviews)
        .values({
          orderId,
          photographerId: orderData.photographerId,
          customerClerkId: clerkId,
          rating,
          komentar,
        })
        .returning()

      // 4. Update Agregat Rating di Photographer Profile secara Atomik
      const [pgProfile] = await tx
        .select({
          ratingAverage: photographerProfiles.ratingAverage,
          ratingCount: photographerProfiles.ratingCount
        })
        .from(photographerProfiles)
        .where(eq(photographerProfiles.id, orderData.photographerId))
        .limit(1)

      if (pgProfile) {
        const oldCount = pgProfile.ratingCount
        const oldAvg = pgProfile.ratingAverage

        const newCount = oldCount + 1
        // (oldAvg * oldCount + newRating) / newCount
        const newAvg = (oldAvg * oldCount + rating) / newCount

        await tx
          .update(photographerProfiles)
          .set({
            ratingAverage: newAvg,
            ratingCount: newCount,
            updatedAt: new Date(),
          })
          .where(eq(photographerProfiles.id, orderData.photographerId))
      }

      return newReview
    })

    return c.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membuat ulasan"
    return c.json({ success: false, error: message }, 400)
  }
})
