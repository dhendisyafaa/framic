// src/server/routes/users.ts
// Router untuk manajemen user, profil, dan onboarding

import { zValidator } from "@hono/zod-validator"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"
import { db } from "@/db"
import {
  customerProfiles,
  mitraProfiles,
  photographerProfiles,
  users,
} from "@/db/schema"
import { getCurrentUser, requireRole } from "@/lib/clerk"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { AuthError } from "@/lib/clerk"

export const usersRouter = new Hono()

// ---------------------------------------------------------------------------
// Helper: Memastikan record user & customer profile di DB eksis
// MVP: Menggantikan fungsi webhook Clerk
// ---------------------------------------------------------------------------
async function ensureUserExists(clerkId: string) {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))

  if (!existingUser) {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        clerkId,
        roles: ["customer"],
        isActive: true,
      })
      await tx.insert(customerProfiles).values({ clerkId })
    })
  }
}

// ---------------------------------------------------------------------------
// GET /api/users/me
// Ambil data user aktif, otomatis upsert (create jika belum ada)
// ---------------------------------------------------------------------------
usersRouter.get("/me", async (c) => {
  const clerkUser = await getCurrentUser()
  if (!clerkUser) {
    throw new AuthError(401, "Harus login terlebih dahulu")
  }

  await ensureUserExists(clerkUser.clerkId)

  // Ambil profil lengkap setelah dipastikan user ada
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.clerkId))

  const [customer] = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.clerkId, clerkUser.clerkId))

  const [photographer] = await db
    .select()
    .from(photographerProfiles)
    .where(eq(photographerProfiles.clerkId, clerkUser.clerkId))

  const [mitra] = await db
    .select()
    .from(mitraProfiles)
    .where(eq(mitraProfiles.clerkId, clerkUser.clerkId))

  return c.json({
    success: true,
    data: {
      clerkId: clerkUser.clerkId,
      email: clerkUser.email,
      name: clerkUser.name,
      avatarUrl: clerkUser.avatarUrl,
      // Roles yang tercatat di database kita
      roles: dbUser.roles,
      customerProfile: customer || null,
      photographerProfile: photographer || null,
      mitraProfile: mitra || null,
    },
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/users/me/customer-profile
// Update data profil customer
// ---------------------------------------------------------------------------
const updateCustomerSchema = z.object({
  alamat: z.string().optional(),
  nomorTelepon: z.string().optional(),
})

usersRouter.patch(
  "/me/customer-profile",
  zValidator("json", updateCustomerSchema),
  async (c) => {
    // Proteksi role
    const { clerkId } = await requireRole("customer")
    const { alamat, nomorTelepon } = c.req.valid("json")

    const [updated] = await db
      .update(customerProfiles)
      .set({
        alamat,
        nomorTelepon, // Disimpan terenkripsi atau plaintext sesuai flow MVP
        updatedAt: new Date(),
      })
      .where(eq(customerProfiles.clerkId, clerkId))
      .returning()

    if (!updated) {
      return c.json({ success: false, error: "Profil customer tidak ditemukan" }, 404)
    }

    return c.json({ success: true, data: updated })
  },
)

// ---------------------------------------------------------------------------
// POST /api/users/apply/photographer
// Apply menjadi fotografer (status: pending)
// ---------------------------------------------------------------------------
const applyPhotographerSchema = z.object({
  bio: z.string().min(10, "Bio minimal 10 karakter"),
  kotaDomisili: z.string().min(3, "Kota domisili wajib diisi"),
  kategori: z.array(z.string()).min(1, "Minimal pilih 1 kategori"),
  portfolioUrls: z.array(z.string().url()).optional(),
})

usersRouter.post(
  "/apply/photographer",
  zValidator("json", applyPhotographerSchema),
  async (c) => {
    // Semua yang login [AUTH] boleh apply
    const clerkUser = await getCurrentUser()
    if (!clerkUser) {
      throw new AuthError(401, "Harus login")
    }
    const clerkId = clerkUser.clerkId

    const data = c.req.valid("json")
    
    // Memastikan user sudah tercatat di datastore utama kita
    await ensureUserExists(clerkId)

    // Cek apakah sudah punya profil mitra (hanya 1 role tambahan yang diizinkan sesuai instruksi user)
    const [existingMitra] = await db
      .select()
      .from(mitraProfiles)
      .where(eq(mitraProfiles.clerkId, clerkId))

    if (existingMitra) {
      return c.json({ success: false, error: "Tidak dapat apply sebagai fotografer karena Anda sedang mengajukan/aktif sebagai mitra" }, 400)
    }

    // Hindari duplikasi apply (kecuali jika sebelumnya di-reject)
    const [existingPg] = await db
      .select()
      .from(photographerProfiles)
      .where(eq(photographerProfiles.clerkId, clerkId))

    if (existingPg) {
      if (existingPg.verificationStatus !== "rejected") {
        return c.json({ success: false, error: "Anda sudah melakukan pengajuan fotografer" }, 400)
      }
      
      // Jika rejected, update record lama
      const [updatedProfile] = await db
        .update(photographerProfiles)
        .set({
          bio: data.bio,
          kotaDomisili: data.kotaDomisili,
          kategori: data.kategori,
          portfolioUrls: data.portfolioUrls || [],
          verificationStatus: "pending", // Reset ke pending
          updatedAt: new Date(),
        })
        .where(eq(photographerProfiles.clerkId, clerkId))
        .returning()

      return c.json({ success: true, data: updatedProfile })
    }

    const [newProfile] = await db
      .insert(photographerProfiles)
      .values({
        clerkId,
        bio: data.bio,
        kotaDomisili: data.kotaDomisili,
        kategori: data.kategori,
        portfolioUrls: data.portfolioUrls || [],
        verificationStatus: "pending",
        isAvailable: true,
      })
      .returning()

    return c.json({ success: true, data: newProfile }, 201)
  },
)

// ---------------------------------------------------------------------------
// POST /api/users/apply/mitra
// Apply menjadi mitra (status: pending)
// Menerima FormData karena ada upload file (dokumenLegalitas)
// ---------------------------------------------------------------------------
const applyMitraSchema = z.object({
  namaOrganisasi: z.string().min(1, "Nama organisasi wajib diisi"),
  tipeMitra: z.enum([
    "wedding_organizer",
    "kampus",
    "event_organizer",
    "komunitas",
    "perusahaan",
    "lainnya",
  ]),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  nomorTelepon: z.string().min(1, "Nomor telepon wajib diisi"),
  websiteUrl: z.string().url("Format URL tidak valid").optional().or(z.literal("")),
  dokumenLegalitas: z.custom<File>((val) => val instanceof File, "Dokumen legalitas wajib diupload berupa file"),
})

usersRouter.post(
  "/apply/mitra",
  zValidator("form", applyMitraSchema),
  async (c) => {
    const clerkUser = await getCurrentUser()
    if (!clerkUser) {
      throw new AuthError(401, "Harus login")
    }
    const clerkId = clerkUser.clerkId

    const data = c.req.valid("form")

    // Memastikan user sudah tercatat di datastore utama kita
    await ensureUserExists(clerkId)

    // Cek apakah sudah apply/aktif fotografer (Hanya 1 role tambahan yang diizinkan)
    const [existingPg] = await db
      .select()
      .from(photographerProfiles)
      .where(eq(photographerProfiles.clerkId, clerkId))

    if (existingPg) {
      return c.json({ success: false, error: "Tidak dapat apply sebagai mitra karena Anda sedang mengajukan/aktif sebagai fotografer" }, 400)
    }

    // Cek jika sudah apply mitra
    const [existingMitra] = await db
      .select()
      .from(mitraProfiles)
      .where(eq(mitraProfiles.clerkId, clerkId))

    if (existingMitra) {
      if (existingMitra.verificationStatus !== "rejected") {
        return c.json({ success: false, error: "Anda sudah melakukan pengajuan mitra" }, 400)
      }
      
      // Handle upload dokumen baru jika ada
      let dokumenLegalitasUrl = existingMitra.dokumenLegalitasUrl
      if (data.dokumenLegalitas && data.dokumenLegalitas.size > 0) {
        const file = data.dokumenLegalitas
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const result = await uploadToCloudinary(buffer, "framic/mitra-documents", { resourceType: "auto" })
        dokumenLegalitasUrl = result.secureUrl
      }

      const [updatedProfile] = await db
        .update(mitraProfiles)
        .set({
          namaOrganisasi: data.namaOrganisasi,
          tipeMitra: data.tipeMitra,
          alamat: data.alamat,
          nomorTelepon: data.nomorTelepon,
          websiteUrl: data.websiteUrl || null,
          dokumenLegalitasUrl,
          verificationStatus: "pending", // Reset ke pending
          updatedAt: new Date(),
        })
        .where(eq(mitraProfiles.clerkId, clerkId))
        .returning()

      return c.json({ success: true, data: updatedProfile })
    }

    let dokumenLegalitasUrl = null

    if (data.dokumenLegalitas && data.dokumenLegalitas.size > 0) {
      const file = data.dokumenLegalitas
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      // Upload ke Cloudinary menggunakan helper
      const result = await uploadToCloudinary(buffer, "framic/mitra-documents", { resourceType: "auto" })
      dokumenLegalitasUrl = result.secureUrl
    }

    const [newProfile] = await db
      .insert(mitraProfiles)
      .values({
        clerkId,
        namaOrganisasi: data.namaOrganisasi,
        tipeMitra: data.tipeMitra,
        alamat: data.alamat,
        nomorTelepon: data.nomorTelepon,
        websiteUrl: data.websiteUrl || null,
        dokumenLegalitasUrl,
        verificationStatus: "pending",
        platformFeePercent: 10,
      })
      .returning()

    return c.json({ success: true, data: newProfile }, 201)
  }
)
