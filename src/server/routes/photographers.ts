import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { db } from "@/db"
import { photographerProfiles, packages, reviews, orders } from "@/db/schema"
import { and, eq, ilike, sql, inArray, isNotNull, exists, ne, or } from "drizzle-orm"
import { clerkClient } from "@clerk/nextjs/server"
import { requireRole, AuthError } from "@/lib/clerk"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { captureError } from "@/lib/sentry"
import { getPhotographerBlockedDates } from "@/lib/calendar"
import { parse, endOfMonth } from "date-fns"
import { mitraPhotographers, mitraProfiles, events, eventPhotographers } from "@/db/schema"

export const photographersRouter = new Hono()

// ---------------------------------------------------------------------------
// GET /api/photographers/me/contracts
// ---------------------------------------------------------------------------
photographersRouter.get("/me/contracts", async (c) => {
  try {
    const { clerkId } = await requireRole("photographer")

    // 1. Get PG Profile
    const [pg] = await db
      .select({ id: photographerProfiles.id })
      .from(photographerProfiles)
      .where(eq(photographerProfiles.clerkId, clerkId))
      .limit(1)

    if (!pg) {
      return c.json({ success: false, error: "Profil tidak ditemukan" }, 404)
    }

    // 2. Get Mitra Contracts (Tanpa Join)
    const rawMitraPhotographers = await db
      .select()
      .from(mitraPhotographers)
      .where(
        and(
          eq(mitraPhotographers.photographerId, pg.id),
          or(
            sql`${mitraPhotographers.invitationStatus}::text = 'accepted'`,
            sql`${mitraPhotographers.contractStatus}::text = 'active'`
          )
        )
      )
      .execute()

    const mitraContracts = await Promise.all(
      rawMitraPhotographers.map(async (mp) => {
        const [mitra] = await db
          .select({ namaOrganisasi: mitraProfiles.namaOrganisasi })
          .from(mitraProfiles)
          .where(eq(mitraProfiles.id, mp.mitraId))
          .limit(1)
        
        return {
          id: mp.id,
          mitraId: mp.mitraId,
          mitraName: mitra?.namaOrganisasi || "Mitra",
          invitationStatus: mp.invitationStatus,
          contractStatus: mp.contractStatus,
          photographerSignedAt: mp.photographerSignedAt,
          mitraSignedAt: mp.mitraSignedAt,
          createdAt: mp.createdAt,
          type: "mitra" as const,
          eventName: null
        }
      })
    )

    // 3. Get Event Contracts (Tanpa Join)
    const rawEventPhotographers = await db
      .select()
      .from(eventPhotographers)
      .where(
        and(
          eq(eventPhotographers.photographerId, pg.id),
          sql`${eventPhotographers.invitationStatus}::text = 'accepted'`
        )
      )
      .execute()

    const eventContracts = await Promise.all(
      rawEventPhotographers.map(async (ep) => {
        const [event] = await db
          .select({ namaEvent: events.namaEvent, mitraId: events.mitraId })
          .from(events)
          .where(eq(events.id, ep.eventId))
          .limit(1)
        
        let mitraName = "Mitra"
        if (event) {
          const [mitra] = await db
            .select({ namaOrganisasi: mitraProfiles.namaOrganisasi })
            .from(mitraProfiles)
            .where(eq(mitraProfiles.id, event.mitraId))
            .limit(1)
          if (mitra) mitraName = mitra.namaOrganisasi
        }

        return {
          id: ep.id,
          mitraId: event?.mitraId || "",
          mitraName,
          invitationStatus: ep.invitationStatus,
          contractStatus: null,
          photographerSignedAt: ep.photographerSignedAt,
          mitraSignedAt: ep.mitraSignedAt,
          createdAt: ep.updatedAt,
          type: "event" as const,
          eventName: event?.namaEvent || "Event"
        }
      })
    )

    // 4. Merge and sort
    const allContracts = [...mitraContracts, ...eventContracts].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })

    return c.json({ success: true, data: allContracts })
  } catch (err) {
    console.error("Error in getMeContracts:", err)
    return c.json({ success: false, error: "Internal Server Error" }, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /api/photographers/me/contracts/:contractId/sign
// Menandatangani MoU kerjasama secara digital
// ---------------------------------------------------------------------------
photographersRouter.post("/me/contracts/:contractId/sign", async (c) => {
  try {
    const { clerkId } = await requireRole("photographer")
    const contractId = c.req.param("contractId")

    // 1. Get PG Profile
    const [pg] = await db
      .select({ id: photographerProfiles.id })
      .from(photographerProfiles)
      .where(eq(photographerProfiles.clerkId, clerkId))
      .limit(1)

    if (!pg) return c.json({ success: false, error: "Profil tidak ditemukan" }, 404)

    // 2. Verify Contract existence and ownership
    const [contract] = await db
      .select()
      .from(mitraPhotographers)
      .where(
        and(
          eq(mitraPhotographers.id, contractId),
          eq(mitraPhotographers.photographerId, pg.id)
        )
      )
      .limit(1)

    if (!contract) return c.json({ success: false, error: "Kontrak tidak ditemukan" }, 404)
    if (contract.invitationStatus !== "accepted") {
      return c.json({ success: false, error: "Undangan harus diterima terlebih dahulu sebelum menandatangani MoU" }, 400)
    }

    // 3. Update status to ACTIVE
    await db.update(mitraPhotographers)
      .set({
        contractStatus: "active",
        updatedAt: new Date()
      })
      .where(eq(mitraPhotographers.id, contractId))

    return c.json({
      success: true,
      message: "MoU berhasil ditandatangani. Kerjasama Anda kini aktif!"
    })
  } catch (err) {
    console.error("Error signing contract:", err)
    return c.json({ success: false, error: "Internal Server Error" }, 500)
  }
})

// ---------------------------------------------------------------------------
// GET /api/photographers
// Listing semua photographer dengan kombinasi pencarian & sort
// ---------------------------------------------------------------------------
const getPhotographersQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(12),
  kota: z.string().optional(),
  kategori: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  available: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["rating", "price_asc", "price_desc", "newest"]).optional().default("rating"),
})

photographersRouter.get("/", zValidator("query", getPhotographersQuerySchema), async (c) => {
  const query = c.req.valid("query")
  const offset = (query.page - 1) * query.limit

  // Build conditions: HARUS verified & profile lengkap
  const conditions = [
    eq(photographerProfiles.verificationStatus, "verified"),
    isNotNull(photographerProfiles.username),
    ne(photographerProfiles.username, ""),
    sql`cardinality(${photographerProfiles.portfolioUrls}) >= 1`,
    exists(
      db.select()
        .from(packages)
        .where(
          and(
            eq(packages.photographerId, photographerProfiles.id),
            eq(packages.isActive, true)
          )
        )
    )
  ]

  if (query.kota) {
    conditions.push(ilike(photographerProfiles.kotaDomisili, `%${query.kota}%`))
  }
  if (query.kategori) {
    conditions.push(sql`${query.kategori} = ANY(${photographerProfiles.kategori})`)
  }
  if (query.minRating) {
    conditions.push(sql`${photographerProfiles.ratingAverage} >= ${query.minRating}`)
  }
  // Remove strict availability filter so 'Offline' PGs still show up in list (Transparency/Close Order model)
  // if (query.available === "true") {
  //   conditions.push(eq(photographerProfiles.isAcceptingOrders, true))
  // }

  // Count total items
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(${photographerProfiles.id}) as int)` })
    .from(photographerProfiles)
    .where(and(...conditions))

  // Determine sorting
  let orderBySql: ReturnType<typeof sql>
  switch (query.sortBy) {
    case "price_asc":
      orderBySql = sql`MIN(${packages.harga}) ASC NULLS LAST`
      break
    case "price_desc":
      orderBySql = sql`MIN(${packages.harga}) DESC NULLS LAST`
      break
    case "newest":
      orderBySql = sql`${photographerProfiles.verifiedAt} DESC NULLS LAST`
      break
    default: // rating
      orderBySql = sql`${photographerProfiles.ratingAverage} DESC NULLS LAST`
  }

  // Get data (JOIN with packages for packageStartingFrom)
  const rows = await db
    .select({
      id: photographerProfiles.id,
      username: photographerProfiles.username,
      clerkId: photographerProfiles.clerkId,
      bio: photographerProfiles.bio,
      kotaDomisili: photographerProfiles.kotaDomisili,
      kategori: photographerProfiles.kategori,
      ratingAverage: photographerProfiles.ratingAverage,
      ratingCount: photographerProfiles.ratingCount,
      isAcceptingOrders: photographerProfiles.isAcceptingOrders,
      portfolioUrls: photographerProfiles.portfolioUrls,
      packageStartingFrom: sql<number | null>`MIN(${packages.harga})`,
    })
    .from(photographerProfiles)
    .innerJoin(packages, eq(packages.photographerId, photographerProfiles.id))
    .where(and(...conditions))
    .groupBy(photographerProfiles.id)
    .orderBy(orderBySql)
    .limit(query.limit)
    .offset(offset)

  // Fetch missing user detail (Nama / Avatar) from Clerk
  const clerkIds = rows.map((r) => r.clerkId)
  let clerkUsersMap: Record<string, { nama: string; avatarUrl: string }> = {}

  if (clerkIds.length > 0) {
    const clerk = await clerkClient()
    const userList = await clerk.users.getUserList({ userId: clerkIds })

    userList.data.forEach((u) => {
      clerkUsersMap[u.id] = {
        nama: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown User",
        avatarUrl: u.imageUrl,
      }
    })
  }

  // Compose responses
  const data = rows.map((r) => ({
    id: r.id,
    username: r.username,
    bio: r.bio,
    kotaDomisili: r.kotaDomisili,
    kategori: r.kategori,
    ratingAverage: r.ratingAverage,
    ratingCount: r.ratingCount,
    isAcceptingOrders: r.isAcceptingOrders,
    portfolioUrls: r.portfolioUrls,
    packageStartingFrom: r.packageStartingFrom,
    nama: clerkUsersMap[r.clerkId]?.nama || "User",
    avatarUrl: clerkUsersMap[r.clerkId]?.avatarUrl || "",
  }))

  return c.json({
    success: true,
    data,
    meta: {
      total: count,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(count / query.limit) || 1,
    },
  })
})

// ---------------------------------------------------------------------------
// GET /api/photographers/me
// Get current photographer profile
// ---------------------------------------------------------------------------
photographersRouter.get("/me", async (c) => {
  try {
    const { clerkId } = await requireRole("photographer")
    const [profile] = await db
      .select()
      .from(photographerProfiles)
      .where(eq(photographerProfiles.clerkId, clerkId))
      .limit(1)

    if (!profile) {
      return c.json({ success: false, error: "Profil tidak ditemukan" }, 404)
    }

    const clerk = await clerkClient()
    const user = await clerk.users.getUser(clerkId)

    return c.json({
      success: true,
      data: {
        ...profile,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
        imageUrl: user.imageUrl,
      }
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ success: false, error: err.message }, err.statusCode)
    }
    throw err
  }
})

// ---------------------------------------------------------------------------
// GET /api/photographers/search?username=xxx
// Cari PG berdasarkan username (untuk fitur invite mitra)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GET /api/photographers/search?username=xxx
// Cari PG berdasarkan username (untuk fitur invite mitra)
// ---------------------------------------------------------------------------
photographersRouter.get("/search", async (c) => {
  try {
    const username = c.req.query("username")?.toLowerCase()
    if (!username) {
      return c.json({ success: false, error: "Parameter username diperlukan" }, 400)
    }

    const [pg] = await db
      .select({
        id: photographerProfiles.id,
        username: photographerProfiles.username,
        clerkId: photographerProfiles.clerkId,
        bio: photographerProfiles.bio,
        kotaDomisili: photographerProfiles.kotaDomisili,
        ratingAverage: photographerProfiles.ratingAverage,
        baseMinimumFee: photographerProfiles.baseMinimumFee,
      })
      .from(photographerProfiles)
      .where(eq(photographerProfiles.username, username))
      .limit(1)

    if (!pg) {
      return c.json({ success: false, error: "Fotografer tidak ditemukan" }, 404)
    }

    const clerk = await clerkClient()
    const user = await clerk.users.getUser(pg.clerkId)

    return c.json({
      success: true,
      data: {
        ...pg,
        nama: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Fotografer",
        avatarUrl: user.imageUrl,
      },
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ success: false, error: err.message }, err.statusCode)
    }
    throw err
  }
})

// ---------------------------------------------------------------------------
// GET /api/photographers/:username
// Detail Photografer lengkap dengan paket & ulasan
// ---------------------------------------------------------------------------
photographersRouter.get("/:username", async (c) => {
  const username = c.req.param("username")

  // Jika username adalah 'me', rute di atas harusnya sudah menangkapnya. 
  if (username === "me") return c.notFound()

  const [profile] = await db
    .select()
    .from(photographerProfiles)
    .where(
      and(
        eq(photographerProfiles.username, username),
        sql`${photographerProfiles.verificationStatus}::text = 'verified'`
      )
    )

  if (!profile) {
    return c.json({ success: false, error: "Fotografer tidak ditemukan" }, 404)
  }

  const pgId = profile.id

  // Mengambil user info
  const clerk = await clerkClient()
  let nama = "Fotografer"
  let avatarUrl = ""
  try {
    const u = await clerk.users.getUser(profile.clerkId)
    nama = `${u.firstName || ""} ${u.lastName || ""}`.trim()
    avatarUrl = u.imageUrl
  } catch (err) {
    captureError(err, { context: "Fetch clerk user at GET /photographers/:id", clerkId: profile.clerkId })
  }

  // Fetch Packages with Booking Count
  const pgPackages = await db
    .select({
      id: packages.id,
      namaPaket: packages.namaPaket,
      deskripsi: packages.deskripsi,
      harga: packages.harga,
      durasiJam: packages.durasiJam,
      jumlahFotoMin: packages.jumlahFotoMin,
      includesEditing: packages.includesEditing,
      kategori: packages.kategori,
      isActive: packages.isActive,
      bookingCount: sql<number>`cast(count(${orders.id}) as int)`
    })
    .from(packages)
    .leftJoin(orders, eq(orders.paketId, packages.id))
    .where(
      and(
        eq(packages.photographerId, pgId),
        eq(packages.isActive, true)
      )
    )
    .groupBy(packages.id)
    .orderBy(packages.harga) // termurah di atas

  // Fetch recent Reviews (max 5)
  const pgReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.photographerId, pgId))
    .orderBy(sql`${reviews.createdAt} DESC`)
    .limit(5)

  // Resolve customer names & avatars for reviews via Clerk
  const enrichedReviews = await Promise.all(pgReviews.map(async (rev) => {
    let customerName = "Customer"
    let customerAvatarUrl = ""
    try {
      const u = await clerk.users.getUser(rev.customerClerkId)
      customerName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Customer"
      customerAvatarUrl = u.imageUrl
    } catch (err) {
      console.warn(`[Review] Gagal mengambil data customer ${rev.customerClerkId} dari Clerk:`, err)
    }
    return { ...rev, customerName, customerAvatarUrl }
  }))

  return c.json({
    success: true,
    data: {
      ...profile,
      nama,
      avatarUrl,
      packages: pgPackages,
      recentReviews: enrichedReviews,
    },
  })
})

// ---------------------------------------------------------------------------
// GET /api/photographers/:id/packages
// Get packages by photographer (PUBLIC)
// ---------------------------------------------------------------------------
photographersRouter.get("/:id/packages", async (c) => {
  const pgId = c.req.param("id")

  const pgPackages = await db
    .select()
    .from(packages)
    .where(
      and(
        eq(packages.photographerId, pgId),
        eq(packages.isActive, true)
      )
    )
    .orderBy(packages.harga) // termurah di atas

  return c.json({ success: true, data: pgPackages })
})

// ---------------------------------------------------------------------------
// GET /api/photographers/:id/calendar
// Ketersediaan Tanggal PG
// ---------------------------------------------------------------------------
const calendarQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format month harus YYYY-MM"),
})

photographersRouter.get(
  "/:id/calendar",
  zValidator("query", calendarQuerySchema),
  async (c) => {
    const pgId = c.req.param("id")
    const { month } = c.req.valid("query")

    // Parsing bulan. "2026-05" -> tanggal 1 Mei 2026
    const startDate = parse(`${month}-01`, "yyyy-MM-dd", new Date())
    const endDate = endOfMonth(startDate)

    const blockedDates = await getPhotographerBlockedDates(pgId, startDate, endDate)

    return c.json({
      success: true,
      data: {
        photographerId: pgId,
        month,
        blockedDates,
      },
    })
  }
)

// ---------------------------------------------------------------------------
// PATCH /api/photographers/me
// Update setting profil personal PG (isAvailable, dsb)
// ---------------------------------------------------------------------------
const updatePgSchema = z.object({
  bio: z.string().optional(),
  kotaDomisili: z.string().optional(),
  kategori: z.array(z.string()).optional(),
  isAcceptingOrders: z.boolean().optional(),
  baseMinimumFee: z.number().int().min(0).optional(),
})

photographersRouter.patch(
  "/me",
  zValidator("json", updatePgSchema),
  async (c) => {
    const userRoleInfo = await requireRole("photographer")
    const data = c.req.valid("json")

    // Simpan data ke Postgres Lokal
    const [updated] = await db
      .update(photographerProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(photographerProfiles.clerkId, userRoleInfo.clerkId))
      .returning()

    if (!updated) {
      return c.json({ success: false, error: "Profil tidak ditemukan" }, 404)
    }

    return c.json({ success: true, data: updated })
  }
)

// ---------------------------------------------------------------------------
// POST /api/photographers/me/portfolio
// Tambah Array Img url ke profil PG
// ---------------------------------------------------------------------------
const uploadPortfolioSchema = z.object({
  file: z.custom<File>((val) => val instanceof File, "File gambar wajib diunggah"),
})

photographersRouter.post(
  "/me/portfolio",
  zValidator("form", uploadPortfolioSchema),
  async (c) => {
    const { clerkId } = await requireRole("photographer")
    const { file } = c.req.valid("form")

    // 1. Ambil data profil PG untuk cek limit
    const [pg] = await db
      .select({ portfolioUrls: photographerProfiles.portfolioUrls })
      .from(photographerProfiles)
      .where(eq(photographerProfiles.clerkId, clerkId))

    if (!pg) return c.json({ success: false, error: "PG Profil tidak ada" }, 404)

    // 2. SERVER SIDE CHECK: Limit 5 Foto
    if ((pg.portfolioUrls || []).length >= 5) {
      return c.json({ success: false, error: "Batas maksimal 5 foto tercapai. Hapus foto lama untuk menambah baru." }, 400)
    }

    // 3. Upload ke Cloudinary
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await uploadToCloudinary(buffer, "framic/portfolio", { resourceType: "image" })

    const newPortofolio = [...(pg.portfolioUrls || []), result.secureUrl]

    const [updated] = await db
      .update(photographerProfiles)
      .set({ portfolioUrls: newPortofolio })
      .where(eq(photographerProfiles.clerkId, clerkId))
      .returning()

    return c.json({ success: true, data: updated })
  }
)

// =============================================================================
// ENDPOINTS MITRA — Fase 6A
// Tambahan di bawah, tidak mengubah route yang sudah ada
// =============================================================================

// ---------------------------------------------------------------------------
// GET /api/photographers/me/invitations — [PHOTOGRAPHER]
// Ambil daftar undangan dari mitra (keanggotaan tetap & per-event)
// ---------------------------------------------------------------------------
photographersRouter.get("/me/invitations", async (c) => {
  try {
    const { clerkId } = await requireRole("photographer")

    const [pg] = await db
      .select({ id: photographerProfiles.id })
      .from(photographerProfiles)
      .where(eq(photographerProfiles.clerkId, clerkId))
      .limit(1)

    if (!pg) {
      return c.json({ success: false, error: "Profil fotografer tidak ditemukan" }, 404)
    }

    // 1. Mitra Invitations (Anggota Tetap)
    const mitraInvitations = await db
      .select({
        contractId: mitraPhotographers.id,
        mitraId: mitraProfiles.id,
        namaMitra: mitraProfiles.namaOrganisasi,
        invitationMessage: mitraPhotographers.invitationMessage,
        minimumFeePerEvent: mitraPhotographers.minimumFeePerEvent,
        tanggalMulai: mitraPhotographers.tanggalMulai,
        tanggalSelesai: mitraPhotographers.tanggalSelesai,
        invitationStatus: mitraPhotographers.invitationStatus,
        createdAt: mitraPhotographers.createdAt,
      })
      .from(mitraPhotographers)
      .innerJoin(mitraProfiles, eq(mitraProfiles.id, mitraPhotographers.mitraId))
      .where(
        and(
          eq(mitraPhotographers.photographerId, pg.id),
          sql`${mitraPhotographers.initiatedBy}::text = 'mitra'`,
          sql`${mitraPhotographers.invitationStatus}::text = 'pending'`
        )
      )

    // 2. Event Invitations (Per-Event)
    const eventInvitations = await db
      .select({
        entryId: eventPhotographers.id,
        eventId: events.id,
        namaEvent: events.namaEvent,
        tanggalMulai: events.tanggalMulai,
        tanggalSelesai: events.tanggalSelesai,
        lokasi: events.lokasi,
        feeAmount: events.feePgPerEvent,
        mitraId: mitraProfiles.id,
        namaMitra: mitraProfiles.namaOrganisasi,
        invitationMessage: eventPhotographers.invitationMessage,
        invitationStatus: eventPhotographers.invitationStatus,
        createdAt: eventPhotographers.assignedAt,
      })
      .from(eventPhotographers)
      .innerJoin(events, eq(events.id, eventPhotographers.eventId))
      .innerJoin(mitraProfiles, eq(mitraProfiles.id, events.mitraId))
      .where(
        and(
          eq(eventPhotographers.photographerId, pg.id),
          sql`${eventPhotographers.initiatedBy}::text = 'mitra'`,
          sql`${eventPhotographers.invitationStatus}::text = 'pending'`,
          sql`${eventPhotographers.photographerType}::text = 'event_only'`
        )
      )

    return c.json({
      success: true,
      data: {
        mitraInvitations,
        eventInvitations,
      }
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ success: false, error: err.message }, err.statusCode)
    }
    throw err
  }
})

// ---------------------------------------------------------------------------
// POST /api/photographers/me/mitra-request — [PHOTOGRAPHER]
// PG request bergabung sebagai anggota tetap ke mitra
// ---------------------------------------------------------------------------
const mitraRequestSchema = z.object({
  mitraId: z.string().uuid(),
  invitationMessage: z.string().optional(),
})

photographersRouter.post(
  "/me/mitra-request",
  zValidator("json", mitraRequestSchema),
  async (c) => {
    try {
      const { clerkId } = await requireRole("photographer")
      const body = c.req.valid("json")

      // Fetch PG profile
      const [pg] = await db
        .select({ id: photographerProfiles.id, verificationStatus: photographerProfiles.verificationStatus })
        .from(photographerProfiles)
        .where(eq(photographerProfiles.clerkId, clerkId))
        .limit(1)

      if (!pg) {
        return c.json({ success: false, error: "Profil fotografer tidak ditemukan" }, 404)
      }

      // Validasi: mitra harus ada dan verification_status = 'verified'
      const [mitra] = await db
        .select({ id: mitraProfiles.id, verificationStatus: mitraProfiles.verificationStatus })
        .from(mitraProfiles)
        .where(eq(mitraProfiles.id, body.mitraId))
        .limit(1)

      if (!mitra) {
        return c.json({ success: false, error: "Mitra tidak ditemukan" }, 404)
      }
      if (mitra.verificationStatus !== "verified") {
        return c.json(
          { success: false, error: "Mitra belum terverifikasi" },
          400
        )
      }

      // Validasi: PG tidak boleh sudah punya kontrak contract_status IN ('active', 'pending_expiry')
      const [existingContract] = await db
        .select({ id: mitraPhotographers.id })
        .from(mitraPhotographers)
        .where(
          and(
            eq(mitraPhotographers.photographerId, pg.id),
            inArray(mitraPhotographers.contractStatus, ["active", "pending_expiry"])
          )
        )
        .limit(1)

      if (existingContract) {
        return c.json(
          {
            success: false,
            error: "Anda sudah memiliki kontrak aktif dengan mitra lain",
          },
          409
        )
      }

      const [inserted] = await db
        .insert(mitraPhotographers)
        .values({
          mitraId: body.mitraId,
          photographerId: pg.id,
          initiatedBy: "photographer",
          invitationStatus: "pending",
          invitationMessage: body.invitationMessage,
          // contract_status = NULL — belum aktif sampai kedua pihak sign MoU di Fase 7
        })
        .returning()

      return c.json({ success: true, data: inserted }, 201)
    } catch (err) {
      if (err instanceof AuthError) {
        return c.json({ success: false, error: err.message }, err.statusCode)
      }
      throw err
    }
  }
)

// ---------------------------------------------------------------------------
// PATCH /api/photographers/me/contracts/:contractId/respond — [PHOTOGRAPHER]
// PG acc atau deny invite dari mitra (initiated_by = 'mitra')
// ---------------------------------------------------------------------------
const respondContractSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
})

photographersRouter.patch(
  "/me/contracts/:contractId/respond",
  zValidator("json", respondContractSchema),
  async (c) => {
    try {
      const { clerkId } = await requireRole("photographer")
      const contractId = c.req.param("contractId")
      const { status } = c.req.valid("json")

      // Fetch PG profile
      const [pg] = await db
        .select({ id: photographerProfiles.id })
        .from(photographerProfiles)
        .where(eq(photographerProfiles.clerkId, clerkId))
        .limit(1)

      if (!pg) {
        return c.json({ success: false, error: "Profil fotografer tidak ditemukan" }, 404)
      }

      // Fetch kontrak
      const [contract] = await db
        .select()
        .from(mitraPhotographers)
        .where(eq(mitraPhotographers.id, contractId))
        .limit(1)

      if (!contract) {
        return c.json({ success: false, error: "Kontrak tidak ditemukan" }, 404)
      }

      // Validasi: kontrak harus initiated_by = 'mitra' dan invitation_status = 'pending'
      if (contract.initiatedBy !== "mitra") {
        return c.json(
          {
            success: false,
            error:
              "Endpoint ini hanya untuk merespons undangan dari mitra",
          },
          400
        )
      }
      if (contract.invitationStatus !== "pending") {
        return c.json(
          { success: false, error: "Undangan sudah direspons sebelumnya" },
          409
        )
      }

      // Validasi: kontrak harus ditujukan ke PG ini
      if (contract.photographerId !== pg.id) {
        return c.json({ success: false, error: "Forbidden" }, 403)
      }

      // Pre-MoU: invitation_status = 'accepted' berarti terms disetujui, MoU sign di Fase 7
      const [updated] = await db.transaction(async (tx) => {
        return tx
          .update(mitraPhotographers)
          .set({
            invitationStatus: status,
            updatedAt: new Date(),
            // contract_status tetap NULL — aktif setelah e-sign MoU di Fase 7
          })
          .where(eq(mitraPhotographers.id, contractId))
          .returning()
      })

      return c.json({ success: true, data: updated })
    } catch (err) {
      if (err instanceof AuthError) {
        return c.json({ success: false, error: err.message }, err.statusCode)
      }
      throw err
    }
  }
)

