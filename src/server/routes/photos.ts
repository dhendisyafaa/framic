import { Hono } from "hono"
import { eq, and, count, inArray } from "drizzle-orm"
import { db } from "@/db"
import { orders, photos, photographerProfiles } from "@/db/schema"
import { uploadToCloudinary, deleteFromCloudinary, CLOUDINARY_FOLDERS } from "@/lib/cloudinary"
import { captureError } from "@/lib/sentry"

import { requireAuth } from "@/server/middleware/auth"

const photosRouter = new Hono<{ Variables: { clerkId: string } }>()

// Proteksi semua rute foto
photosRouter.use("*", requireAuth)

/**
 * POST /api/photos/:orderId
 * PG upload foto hasil pemotretan.
 */
photosRouter.post("/:orderId", async (c) => {
  const clerkId = c.get("clerkId")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  const orderId = c.req.param("orderId")

  try {
    // 1. Validasi fotografer & kepemilikan order
    const [pgProfile] = await db
      .select({ id: photographerProfiles.id })
      .from(photographerProfiles)
      .where(eq(photographerProfiles.clerkId, clerkId))
      .limit(1)

    if (!pgProfile) return c.json({ success: false, error: "Profil fotografer tidak ditemukan" }, 404)

    const [orderData] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.photographerId, pgProfile.id)))
      .limit(1)

    if (!orderData) {
      return c.json({ success: false, error: "Order tidak ditemukan atau Anda bukan fotografernya" }, 404)
    }

    // 2. Validasi status order
    if (!["ongoing", "delivered"].includes(orderData.status)) {
      return c.json({ success: false, error: "Foto hanya bisa di-upload saat status ongoing atau delivered" }, 400)
    }

    // 3. Cek kuota foto (max 100)
    const [{ currentCount }] = await db
      .select({ currentCount: count(photos.id) })
      .from(photos)
      .where(eq(photos.orderId, orderId))

    if (currentCount >= 100) {
      return c.json({ success: false, error: "Maksimum 100 foto per order telah tercapai" }, 400)
    }

    // 4. Proses Multipart Upload
    const body = await c.req.parseBody()
    const files = body["file"]
    const fileArray = Array.isArray(files) ? files : [files]

    if (fileArray.length + currentCount > 100) {
      return c.json({ success: false, error: "Upload akan melebihi batas 100 foto" }, 400)
    }

    const uploadedPhotos = []

    for (const file of fileArray) {
      if (file instanceof File) {
        // Upload ke Cloudinary
        const buffer = Buffer.from(await file.arrayBuffer())
        const result = await uploadToCloudinary(buffer, `${CLOUDINARY_FOLDERS.ORDER_PHOTOS}/${orderId}`)

        // Simpan ke database
        const [saved] = await db
          .insert(photos)
          .values({
            orderId,
            fotoUrl: result.secureUrl,
            cloudinaryPublicId: result.publicId,
            ukuranBytes: result.bytes,
            resolusiWidth: result.width,
            resolusiHeight: result.height,
            format: result.format,
          })
          .returning()

        uploadedPhotos.push(saved)
      }
    }

    return c.json({ success: true, data: uploadedPhotos })
  } catch (err) {
    captureError(err, { context: "upload-photos", orderId })
    const message = err instanceof Error ? err.message : "Gagal mengunggah foto"
    return c.json({ success: false, error: message }, 400)
  }
})

/**
 * GET /api/photos/:orderId
 * Customer atau PG melihat daftar foto order.
 */
photosRouter.get("/:orderId", async (c) => {
  const clerkId = c.get("clerkId")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  const orderId = c.req.param("orderId")

  try {
    // 1. Cek kepemilikan/akses (Customer pemilik atau PG pemilik)
    const [pgProfile] = await db
      .select({ id: photographerProfiles.id })
      .from(photographerProfiles)
      .where(eq(photographerProfiles.clerkId, clerkId))
      .limit(1)

    const [orderData] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!orderData) return c.json({ success: false, error: "Order tidak ditemukan" }, 404)

    const isCustomer = orderData.customerClerkId === clerkId
    const isPG = pgProfile && orderData.photographerId === pgProfile.id

    if (!isCustomer && !isPG) {
      return c.json({ success: false, error: "Forbidden: Anda tidak memiliki akses ke foto ini" }, 403)
    }

    // 2. Fetch foto
    const rows = await db
      .select()
      .from(photos)
      .where(eq(photos.orderId, orderId))
      .orderBy(photos.uploadedAt)

    return c.json({ success: true, data: rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return c.json({ success: false, error: message }, 400)
  }
})

/**
 * DELETE /api/photos/:photoId
 * PG menghapus foto miliknya (hanya saat status ongoing/delivered).
 */
photosRouter.delete("/:photoId", async (c) => {
  const clerkId = c.get("clerkId")
  if (!clerkId) return c.json({ success: false, error: "Unauthorized" }, 401)

  const photoId = c.req.param("photoId")

  try {
    // 1. Cari data foto & order terkait
    const [photoData] = await db
      .select()
      .from(photos)
      .where(eq(photos.id, photoId))
      .limit(1)

    if (!photoData) return c.json({ success: false, error: "Foto tidak ditemukan" }, 404)

    const [orderData] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, photoData.orderId))
      .limit(1)

    if (!orderData) return c.json({ success: false, error: "Order terkait tidak ditemukan" }, 404)

    // 2. Validasi status order
    if (!["ongoing", "delivered"].includes(orderData.status)) {
      return c.json({ success: false, error: "Foto tidak bisa dihapus jika order sudah selesai/batal" }, 400)
    }

    // 3. Validasi kepemilikan PG
    const [pgProfile] = await db
      .select({ id: photographerProfiles.id })
      .from(photographerProfiles)
      .where(eq(photographerProfiles.clerkId, clerkId))
      .limit(1)

    if (!pgProfile || orderData.photographerId !== pgProfile.id) {
      return c.json({ success: false, error: "Forbidden: Anda bukan pemilik foto ini" }, 403)
    }

    // 4. Hapus dari DB dulu
    await db.delete(photos).where(eq(photos.id, photoId))

    // 5. Hapus dari Cloudinary (log error tapi jangan throw jika gagal)
    try {
      await deleteFromCloudinary(photoData.cloudinaryPublicId)
    } catch (cloudinaryErr) {
      captureError(cloudinaryErr, { context: "delete-photo-cloudinary", photoId })
    }

    return c.json({ success: true, message: "Foto berhasil dihapus" })
  } catch (err) {
    captureError(err, { context: "delete-photo", photoId })
    const message = err instanceof Error ? err.message : "Gagal menghapus foto"
    return c.json({ success: false, error: message }, 400)
  }
})

export { photosRouter }
