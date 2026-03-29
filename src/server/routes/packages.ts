import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { db } from "@/db"
import { packages, photographerProfiles, orders } from "@/db/schema"
import { and, eq, notInArray } from "drizzle-orm"
import { requireRole } from "@/lib/clerk"

export const packagesRouter = new Hono()

// Helper mengonversi clerkId (current user) menjadi PG id internal (UUID)
async function getPhotographerId(clerkId: string) {
  const [profile] = await db
    .select({ id: photographerProfiles.id })
    .from(photographerProfiles)
    .where(eq(photographerProfiles.clerkId, clerkId))
  return profile?.id
}

// ---------------------------------------------------------------------------
// Schema Validasi Payload POST package
// ---------------------------------------------------------------------------
const packageSchema = z.object({
  namaPaket: z.string().min(3, "Nama paket minimal 3 karakter"),
  deskripsi: z.string().min(10, "Deskripsi minimal 10 karakter"),
  harga: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  durasiJam: z.coerce.number().min(1, "Durasi minimal 1 jam"),
  jumlahFotoMin: z.coerce.number().min(1, "Jumlah foto minimal 1"),
  includesEditing: z.boolean().optional().default(false),
  kategori: z.string().optional(),
})

// ---------------------------------------------------------------------------
// POST /api/packages
// Membuat paket layanan baru (Hanya Photographer)
// ---------------------------------------------------------------------------
packagesRouter.post("/", zValidator("json", packageSchema), async (c) => {
  const { clerkId } = await requireRole("photographer")
  const data = c.req.valid("json")

  const pgId = await getPhotographerId(clerkId)
  if (!pgId) return c.json({ success: false, error: "Profil PG tidak ditemukan" }, 404)

  const [newPackage] = await db
    .insert(packages)
    .values({
      photographerId: pgId,
      ...data,
    })
    .returning()

  return c.json({ success: true, data: newPackage }, 201)
})

// ---------------------------------------------------------------------------
// PATCH /api/packages/:id
// Update detail paket. Hanya bisa jika TIDAK ADA order aktif
// ---------------------------------------------------------------------------
const updatePackageSchema = packageSchema.partial()

packagesRouter.patch("/:id", zValidator("json", updatePackageSchema), async (c) => {
  const { clerkId } = await requireRole("photographer")
  const pkgId = c.req.param("id")
  const data = c.req.valid("json")

  const pgId = await getPhotographerId(clerkId)
  if (!pgId) return c.json({ success: false, error: "Profil PG tidak ditemukan" }, 404)

  // 1. Validasi keberadaan & hak milik paket
  const [pkg] = await db.select().from(packages).where(eq(packages.id, pkgId))
  if (!pkg) return c.json({ success: false, error: "Paket tidak ditemukan" }, 404)
  if (pkg.photographerId !== pgId) {
    return c.json({ success: false, error: "Forbidden: Anda bukan pemilik paket ini" }, 403)
  }

  // 2. Cek Order Aktif yang sedang menggunakan paket ini
  const activeOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.paketId, pkgId),
        notInArray(orders.status, ["completed", "cancelled"])
      )
    )

  if (activeOrders.length > 0) {
    return c.json({
      success: false,
      error: "Paket dilarang untuk diperbarui karena sedang melekat pada order/kontrak pelanggan aktif"
    }, 400)
  }

  // 3. Update Paket
  const [updatedPackage] = await db
    .update(packages)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(packages.id, pkgId))
    .returning()

  return c.json({ success: true, data: updatedPackage })
})

// ---------------------------------------------------------------------------
// DELETE /api/packages/:id
// Soft delete paket (isActive = false). Validasi hak milik.
// ---------------------------------------------------------------------------
packagesRouter.delete("/:id", async (c) => {
  const { clerkId } = await requireRole("photographer")
  const pkgId = c.req.param("id")

  const pgId = await getPhotographerId(clerkId)
  if (!pgId) return c.json({ success: false, error: "Profil photographer tidak ditemukan" }, 404)

  // 1. Validasi keberadaan & hak milik
  const [pkg] = await db.select().from(packages).where(eq(packages.id, pkgId))
  if (!pkg) return c.json({ success: false, error: "Paket tidak ditemukan" }, 404)
  if (pkg.photographerId !== pgId) {
    return c.json({ success: false, error: "Forbidden: Anda bukan pemilik paket ini" }, 403)
  }

  // 2. Soft Delete
  const [deletedPackage] = await db
    .update(packages)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(packages.id, pkgId))
    .returning()

  return c.json({ success: true, data: deletedPackage })
})
