import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { db } from "@/db"
import {
  events,
  eventPhotographers,
  photographerProfiles,
  mitraProfiles,
  mitraPhotographers,
} from "@/db/schema"
import { and, desc, eq, gte, inArray, isNull, or, sql } from "drizzle-orm"
import { requireRole, AuthError } from "@/lib/clerk"
import { clerkClient } from "@clerk/nextjs/server"
import { uploadToCloudinary, CLOUDINARY_FOLDERS } from "@/lib/cloudinary"
import { getPhotographerBlockedDates } from "@/lib/calendar"
import { format, eachDayOfInterval } from "date-fns"

export const eventsRouter = new Hono()

const listEventsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(12),
  mitraId: z.string().uuid().optional(),
  // openOnly=true → hanya event open recruitment yang deadline-nya belum lewat
  openOnly: z.enum(["true", "false"]).optional().default("false"),
})

// ---------------------------------------------------------------------------
// GET /api/events
// List semua event (auto-published). Filter: mitraId, openOnly
// ---------------------------------------------------------------------------
eventsRouter.get("/", zValidator("query", listEventsSchema), async (c) => {
  const { page, limit, mitraId, openOnly } = c.req.valid("query")
  const offset = (page - 1) * limit

  const conditions: ReturnType<typeof eq>[] = []

  if (mitraId) {
    conditions.push(eq(events.mitraId, mitraId))
  }

  if (openOnly === "true") {
    conditions.push(eq(events.isOpenRecruitment, true))
    conditions.push(
      or(
        isNull(events.deadlineRequest),
        gte(events.deadlineRequest, sql`CURRENT_DATE`)
      )!
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(${events.id}) as int)` })
    .from(events)
    .where(where)

  const baseRows = await db
    .select()
    .from(events)
    .where(where)
    .orderBy(desc(events.createdAt))
    .limit(limit)
    .offset(offset)

  if (baseRows.length === 0) {
    return c.json({
      success: true,
      data: [],
      meta: { total: count, page, limit, totalPages: 1 },
    })
  }

  const eventIds = baseRows.map((r) => r.id)
  const pgCounts = await db
    .select({
      eventId: eventPhotographers.eventId,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(eventPhotographers)
    .where(
      and(
        inArray(eventPhotographers.eventId, eventIds),
        sql`(${eventPhotographers.photographerType}::text = 'mitra_permanent' OR ${eventPhotographers.invitationStatus}::text = 'accepted')`
      )
    )
    .groupBy(eventPhotographers.eventId)

  const countMap = Object.fromEntries(pgCounts.map((c) => [c.eventId, c.count]))

  // Jika openOnly, kita juga perlu filter slot yang masih ada
  let rows = baseRows.map((r) => ({
    ...r,
    pgConfirmed: countMap[r.id] || 0,
    slotTerisi: countMap[r.id] || 0,
  }))

  if (openOnly === "true") {
    rows = rows.filter((r) => r.kuotaPgPerEvent > (countMap[r.id] || 0))
  }

  return c.json({
    success: true,
    data: rows,
    meta: {
      total: openOnly === "true" ? rows.length : count,
      page,
      limit,
      totalPages: Math.ceil((openOnly === "true" ? rows.length : count) / limit) || 1,
    },
  })
})


// ---------------------------------------------------------------------------
// GET /api/events/:id
// Detail event spesifik + ketersediaan slot PG. Jika ?dashboard=true, return all
// ---------------------------------------------------------------------------
eventsRouter.get("/:id", async (c) => {
  const eventId = c.req.param("id")
  const isDashboard = c.req.query("dashboard") === "true"

  let expectedMitraId: string | null = null

  if (isDashboard) {
    // Validasi role mitra jika dipanggil dari dashboard
    try {
      const { clerkId } = await requireRole("mitra")
      const [mitra] = await db
        .select({ id: mitraProfiles.id })
        .from(mitraProfiles)
        .where(eq(mitraProfiles.clerkId, clerkId))
        .limit(1)
      if (mitra) expectedMitraId = mitra.id
    } catch (err) {
      if (err instanceof AuthError) {
        return c.json({ success: false, error: err.message }, err.statusCode)
      }
      throw err
    }
  }

  // Fetch data event
  const [eventData] = await db
    .select()
    .from(events)
    .where(
      isDashboard
        ? and(eq(events.id, eventId), expectedMitraId ? eq(events.mitraId, expectedMitraId) : undefined)
        : and(eq(events.id, eventId), eq(events.isPublished, true))
    )

  if (!eventData) {
    return c.json({ success: false, error: "Event tidak ditemukan atau belum dirilis" }, 404)
  }

  const [mitraData] = await db
    .select({
      id: mitraProfiles.id,
      namaOrganisasi: mitraProfiles.namaOrganisasi,
      tipeMitra: mitraProfiles.tipeMitra,
      websiteUrl: mitraProfiles.websiteUrl,
    })
    .from(mitraProfiles)
    .where(eq(mitraProfiles.id, eventData.mitraId))

  // Fetch list PG
  const pgTersediaRows = await db
    .select({
      id: eventPhotographers.id,
      photographerType: eventPhotographers.photographerType,
      photographerId: photographerProfiles.id,
      clerkId: photographerProfiles.clerkId,
      bio: photographerProfiles.bio,
      ratingAverage: photographerProfiles.ratingAverage,
      invitationStatus: eventPhotographers.invitationStatus,
      initiatedBy: eventPhotographers.initiatedBy,
      isAvailable: eventPhotographers.isAvailable,
    })
    .from(eventPhotographers)
    .innerJoin(photographerProfiles, eq(photographerProfiles.id, eventPhotographers.photographerId))
    .where(
      isDashboard
        ? eq(eventPhotographers.eventId, eventId) // Dashboard: Semua anggota/request (termasuk pending/rejected)
        : and(
            eq(eventPhotographers.eventId, eventId),
            eq(eventPhotographers.isAvailable, true),
            or(
              eq(eventPhotographers.photographerType, "mitra_permanent"),
              and(
                eq(eventPhotographers.photographerType, "event_only"),
                eq(eventPhotographers.invitationStatus, "accepted")
              )
            )
          )
    )

  // Enrich nama dari Clerk
  const pgClerkIds = pgTersediaRows.map((r) => r.clerkId)
  let clerkNamaMap: Record<string, string> = {}

  if (pgClerkIds.length > 0) {
    const clerk = await clerkClient()
    const userList = await clerk.users.getUserList({ userId: pgClerkIds })
    userList.data.forEach((u) => {
      clerkNamaMap[u.id] = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Fotografer"
    })
  }

  const pgTersedia = pgTersediaRows.map(row => ({
    ...row,
    nama: clerkNamaMap[row.clerkId] ?? "Fotografer",
  }))

  return c.json({
    success: true,
    data: {
      ...eventData,
      mitra: mitraData,
      photographers: pgTersedia,
    }
  })
})

// =============================================================================
// WRITE ENDPOINTS — Fase 6A
// Tidak mengubah tiga route di atas — hanya tambahan di bawah
// =============================================================================

// ---------------------------------------------------------------------------
// POST /api/events — [MITRA]
// Buat event baru (is_published default false). Terima multipart/form-data.
// ---------------------------------------------------------------------------
const createEventSchema = z.object({
  namaEvent: z.string().min(3),
  deskripsi: z.string().optional(),
  tanggalMulai: z.string().datetime(),
  tanggalSelesai: z.string().datetime(),
  lokasi: z.string().min(3),
  feePgTetap: z.coerce.number().int().min(0).optional(),
  feePgPerEvent: z.coerce.number().int().min(0).optional(),
  kuotaPgTetap: z.coerce.number().int().min(0).optional().default(0),
  kuotaPgPerEvent: z.coerce.number().int().min(0).optional().default(0),
  isOpenRecruitment: z.enum(["true", "false"]).default("false"),
  deadlineRequest: z.string().datetime().optional(),
})

eventsRouter.post("/", async (c) => {
  try {
    const { clerkId } = await requireRole("mitra")
    
    // Gunakan formData() sekali untuk semua (termasuk file) agar stream tidak terbaca dua kali
    const formData = await c.req.parseBody()
    
    // Validasi manual via Zod terhadap hasil parseBody
    const validation = createEventSchema.safeParse(formData)
    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: `Validasi gagal: ${validation.error.issues.map(i => i.message).join(", ")}` 
      }, 400)
    }
    const body = validation.data

    const [mitra] = await db
      .select({ id: mitraProfiles.id })
      .from(mitraProfiles)
      .where(eq(mitraProfiles.clerkId, clerkId))
      .limit(1)

    if (!mitra) {
      return c.json({ success: false, error: "Profil mitra tidak ditemukan" }, 404)
    }

    const tanggalMulai = new Date(body.tanggalMulai)
    const tanggalSelesai = new Date(body.tanggalSelesai)
    let isOpenRecruitment = body.isOpenRecruitment === "true"

    // Validasi tanggalSelesai harus setelah tanggalMulai
    if (tanggalSelesai <= tanggalMulai) {
      return c.json(
        { success: false, error: "tanggalSelesai harus setelah tanggalMulai" },
        400
      )
    }

    // Validasi deadlineRequest wajib jika isOpenRecruitment = true
    if (isOpenRecruitment) {
      if (!body.deadlineRequest) {
        return c.json(
          {
            success: false,
            error: "deadlineRequest wajib diisi jika isOpenRecruitment = true",
          },
          400
        )
      }
      const deadlineDate = new Date(body.deadlineRequest)
      if (deadlineDate >= tanggalMulai) {
        return c.json(
          {
            success: false,
            error: "deadlineRequest harus sebelum tanggalMulai",
          },
          400
        )
      }
    }

    // Upload cover image ke Cloudinary jika ada (sudah terurai di parseBody)
    let coverImageUrl: string | undefined = undefined
    const coverImageFile = formData["coverImage"]

    if (coverImageFile instanceof File && coverImageFile.size > 0) {
      const arrayBuffer = await coverImageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const result = await uploadToCloudinary(buffer, CLOUDINARY_FOLDERS.EVENT_COVERS, {
        resourceType: "image",
      })
      coverImageUrl = result.secureUrl
    }

    // Auto-Open Recruitment: Determined by kuotaPgPerEvent
    isOpenRecruitment = (body.kuotaPgPerEvent ?? 0) > 0

    const [newEvent] = await db
      .insert(events)
      .values({
        mitraId: mitra.id,
        namaEvent: body.namaEvent,
        deskripsi: body.deskripsi,
        tanggalMulai,
        tanggalSelesai,
        lokasi: body.lokasi,
        feePgTetap: body.feePgTetap,
        feePgPerEvent: body.feePgPerEvent,
        kuotaPgTetap: body.kuotaPgTetap,
        kuotaPgPerEvent: body.kuotaPgPerEvent,
        isOpenRecruitment,
        deadlineRequest: body.deadlineRequest ? new Date(body.deadlineRequest) : undefined,
        coverImageUrl,
        isPublished: true, // auto-publish: event langsung live saat dibuat
      })
      .returning()

    return c.json({ success: true, data: newEvent }, 201)
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ success: false, error: err.message }, err.statusCode)
    }
    throw err
  }
})

// ---------------------------------------------------------------------------
// POST /api/events/:id/assign-photographer — [MITRA]
// Assign PG anggota tetap (mitra_permanent) ke event
// ---------------------------------------------------------------------------
const assignPhotographerSchema = z.object({
  photographerId: z.string().uuid(),
})

eventsRouter.post(
  "/:id/assign-photographer",
  zValidator("json", assignPhotographerSchema),
  async (c) => {
    try {
      const { clerkId } = await requireRole("mitra")
      const eventId = c.req.param("id")
      const { photographerId } = c.req.valid("json")

      const [mitra] = await db
        .select({ id: mitraProfiles.id })
        .from(mitraProfiles)
        .where(eq(mitraProfiles.clerkId, clerkId))
        .limit(1)

      if (!mitra) {
        return c.json({ success: false, error: "Profil mitra tidak ditemukan" }, 404)
      }

      // Validasi: event harus milik mitra ini
      const [event] = await db
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.mitraId, mitra.id)))
        .limit(1)

      if (!event) {
        return c.json(
          { success: false, error: "Event tidak ditemukan atau bukan milik mitra Anda" },
          404
        )
      }

      // Validasi: events.feePgTetap tidak boleh NULL
      if (event.feePgTetap === null || event.feePgTetap === undefined) {
        return c.json(
          {
            success: false,
            error: "Fee PG tetap (feePgTetap) harus diset di event sebelum assign fotografer",
          },
          400
        )
      }

      // Validasi: PG harus punya kontrak contract_status = 'active' dengan mitra ini
      const [activeContract] = await db
        .select({
          id: mitraPhotographers.id,
          minimumFeePerEvent: mitraPhotographers.minimumFeePerEvent,
        })
        .from(mitraPhotographers)
        .where(
          and(
            eq(mitraPhotographers.mitraId, mitra.id),
            eq(mitraPhotographers.photographerId, photographerId),
            eq(mitraPhotographers.contractStatus, "active")
          )
        )
        .limit(1)

      if (!activeContract) {
        return c.json(
          {
            success: false,
            error: "Fotografer tidak punya kontrak aktif dengan mitra Anda",
          },
          400
        )
      }

      // Validasi: events.feePgTetap tidak boleh < minimumFeePerEvent kontrak PG
      if (
        activeContract.minimumFeePerEvent !== null &&
        event.feePgTetap < activeContract.minimumFeePerEvent
      ) {
        return c.json(
          {
            success: false,
            error: `Fee event (${event.feePgTetap}) lebih rendah dari minimum fee kontrak fotografer (${activeContract.minimumFeePerEvent})`,
          },
          400
        )
      }

      // Validasi: PG belum di-assign ke event ini
      const [existingEntry] = await db
        .select({ id: eventPhotographers.id })
        .from(eventPhotographers)
        .where(
          and(
            eq(eventPhotographers.eventId, eventId),
            eq(eventPhotographers.photographerId, photographerId)
          )
        )
        .limit(1)

      if (existingEntry) {
        return c.json(
          { success: false, error: "Fotografer sudah terdaftar di event ini" },
          409
        )
      }

      const [inserted] = await db
        .insert(eventPhotographers)
        .values({
          eventId,
          photographerId,
          photographerType: "mitra_permanent",
          // initiatedBy dan invitationStatus NULL untuk PG tetap
          isAvailable: true,
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
// POST /api/events/:id/invite-photographer — [MITRA]
// Invite PG independen untuk kontrak per-event
// ---------------------------------------------------------------------------
const inviteEventPhotographerSchema = z.object({
  username: z.string().min(1),
  invitationMessage: z.string().optional(),
})

eventsRouter.post(
  "/:id/invite-photographer",
  zValidator("json", inviteEventPhotographerSchema),
  async (c) => {
    try {
      const { clerkId } = await requireRole("mitra")
      const eventId = c.req.param("id")
      const { username, invitationMessage } = c.req.valid("json")
      
      // Clean username (remove @ if present)
      const cleanUsername = username.startsWith("@") ? username.substring(1).toLowerCase() : username.toLowerCase()

      const [mitra] = await db
        .select({ id: mitraProfiles.id })
        .from(mitraProfiles)
        .where(eq(mitraProfiles.clerkId, clerkId))
        .limit(1)

      if (!mitra) {
        return c.json({ success: false, error: "Profil mitra tidak ditemukan" }, 404)
      }

      // Validasi: event harus milik mitra ini
      const [event] = await db
        .select({ id: events.id, mitraId: events.mitraId })
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.mitraId, mitra.id)))
        .limit(1)

      if (!event) {
        return c.json(
          { success: false, error: "Event tidak ditemukan atau bukan milik mitra Anda" },
          404
        )
      }

      // Validasi: Cari PG berdasarkan username
      const [pg] = await db
        .select({ id: photographerProfiles.id, verificationStatus: photographerProfiles.verificationStatus })
        .from(photographerProfiles)
        .where(eq(photographerProfiles.username, cleanUsername))
        .limit(1)

      if (!pg) {
        return c.json({ success: false, error: `Fotografer dengan username @${cleanUsername} tidak ditemukan` }, 404)
      }
      if (pg.verificationStatus !== "verified") {
        return c.json(
          { success: false, error: "Fotografer belum terverifikasi" },
          400
        )
      }

      const photographerId = pg.id

      // Koreksi tambahan: PG tidak boleh sudah jadi anggota tetap mitra INI sendiri
      const [isOwnPermanentMember] = await db
        .select({ id: mitraPhotographers.id })
        .from(mitraPhotographers)
        .where(
          and(
            eq(mitraPhotographers.mitraId, mitra.id),
            eq(mitraPhotographers.photographerId, photographerId),
            inArray(mitraPhotographers.contractStatus, ["active", "pending_expiry"])
          )
        )
        .limit(1)

      if (isOwnPermanentMember) {
        return c.json(
          {
            success: false,
            error:
              "PG ini sudah anggota tetap mitra Anda. Gunakan endpoint assign-photographer.",
          },
          409
        )
      }

      // Validasi: PG tidak boleh anggota tetap mitra LAIN
      const [isOtherMitraMember] = await db
        .select({ id: mitraPhotographers.id })
        .from(mitraPhotographers)
        .where(
          and(
            eq(mitraPhotographers.photographerId, photographerId),
            inArray(mitraPhotographers.contractStatus, ["active", "pending_expiry"])
          )
        )
        .limit(1)

      if (isOtherMitraMember) {
        return c.json(
          {
            success: false,
            error: "Fotografer sudah menjadi anggota tetap mitra lain",
          },
          409
        )
      }

      // Validasi: PG belum diundang ke event ini
      const [existingEntry] = await db
        .select({ id: eventPhotographers.id })
        .from(eventPhotographers)
        .where(
          and(
            eq(eventPhotographers.eventId, eventId),
            eq(eventPhotographers.photographerId, photographerId)
          )
        )
        .limit(1)

      if (existingEntry) {
        return c.json(
          { success: false, error: "Fotografer sudah terdaftar atau diundang di event ini" },
          409
        )
      }

      const [inserted] = await db
        .insert(eventPhotographers)
        .values({
          eventId,
          photographerId: body.photographerId,
          photographerType: "event_only",
          initiatedBy: "mitra",
          invitationStatus: "pending",
          invitationMessage: body.invitationMessage,
          isAvailable: true,
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
// POST /api/events/:id/request — [PHOTOGRAPHER]
// PG request masuk ke event open recruitment
// ---------------------------------------------------------------------------
const requestEventSchema = z.object({
  message: z.string().optional(),
})

eventsRouter.post(
  "/:id/request",
  zValidator("json", requestEventSchema),
  async (c) => {
    try {
      const { clerkId } = await requireRole("photographer")
      const eventId = c.req.param("id")
      const body = c.req.valid("json")

      // Fetch PG profile
      const [pg] = await db
        .select({ id: photographerProfiles.id, verificationStatus: photographerProfiles.verificationStatus })
        .from(photographerProfiles)
        .where(eq(photographerProfiles.clerkId, clerkId))
        .limit(1)

      if (!pg || pg.verificationStatus !== "verified") {
        return c.json(
          { success: false, error: "Profil fotografer tidak ditemukan atau belum terverifikasi" },
          403
        )
      }

      // Validasi: event harus is_open_recruitment = true dan is_published = true
      const [event] = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.id, eventId),
            eq(events.isPublished, true),
            eq(events.isOpenRecruitment, true)
          )
        )
        .limit(1)

      if (!event) {
        return c.json(
          {
            success: false,
            error: "Event tidak ditemukan, belum dipublish, atau tidak membuka rekrutmen",
          },
          404
        )
      }

      // Validasi: belum melewati deadline_request
      if (event.deadlineRequest && new Date() > event.deadlineRequest) {
        return c.json(
          { success: false, error: "Batas waktu pengajuan request telah berakhir" },
          400
        )
      }

      // Validasi: PG tidak boleh anggota tetap mitra manapun (contract_status = 'active')
      const [activeContract] = await db
        .select({ id: mitraPhotographers.id })
        .from(mitraPhotographers)
        .where(
          and(
            eq(mitraPhotographers.photographerId, pg.id),
            eq(mitraPhotographers.contractStatus, "active")
          )
        )
        .limit(1)

      if (activeContract) {
        return c.json(
          {
            success: false,
            error:
              "Fotografer yang sudah menjadi anggota tetap mitra tidak dapat mengajukan request event open recruitment",
          },
          409
        )
      }

      // Validasi: PG tidak boleh sudah punya entry di event ini
      const [existingEntry] = await db
        .select({ id: eventPhotographers.id })
        .from(eventPhotographers)
        .where(
          and(
            eq(eventPhotographers.eventId, eventId),
            eq(eventPhotographers.photographerId, pg.id)
          )
        )
        .limit(1)

      if (existingEntry) {
        return c.json(
          { success: false, error: "Anda sudah terdaftar atau sudah mengajukan request di event ini" },
          409
        )
      }

      // Validasi: tidak ada konflik kalender dengan tanggal event
      const blockedDates = await getPhotographerBlockedDates(
        pg.id,
        event.tanggalMulai,
        event.tanggalSelesai
      )

      if (blockedDates.length > 0) {
        const eventDates = eachDayOfInterval({
          start: event.tanggalMulai,
          end: event.tanggalSelesai,
        }).map((d) => format(d, "yyyy-MM-dd"))

        const hasConflict = eventDates.some((d) => blockedDates.includes(d))
        if (hasConflict) {
          return c.json(
            {
              success: false,
              error:
                "Anda sudah memiliki jadwal lain di tanggal event ini (order aktif atau event lain)",
            },
            409
          )
        }
      }

      const [inserted] = await db
        .insert(eventPhotographers)
        .values({
          eventId,
          photographerId: pg.id,
          photographerType: "event_only",
          initiatedBy: "photographer",
          invitationStatus: "pending",
          invitationMessage: body.message,
          isAvailable: true,
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
// PATCH /api/events/:eventId/photographers/:entryId/respond — [MITRA] atau [PHOTOGRAPHER]
// Acc atau deny invite/request
// Logic berbeda berdasarkan siapa yang respond
// ---------------------------------------------------------------------------
const respondEventPhotographerSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
})

eventsRouter.patch(
  "/:eventId/photographers/:entryId/respond",
  zValidator("json", respondEventPhotographerSchema),
  async (c) => {
    try {
      const eventId = c.req.param("eventId")
      const entryId = c.req.param("entryId")
      const { status } = c.req.valid("json")

      // Coba resolve sebagai mitra dulu, lalu photographer
      let respondingAs: "mitra" | "photographer" = "mitra"
      let mitraId: string | null = null
      let pgId: string | null = null

      try {
        const { clerkId } = await requireRole("mitra")
        const [mitra] = await db
          .select({ id: mitraProfiles.id })
          .from(mitraProfiles)
          .where(eq(mitraProfiles.clerkId, clerkId))
          .limit(1)
        if (mitra) {
          respondingAs = "mitra"
          mitraId = mitra.id
        }
      } catch {
        // Bukan mitra — coba sebagai photographer
        try {
          const { clerkId } = await requireRole("photographer")
          const [pg] = await db
            .select({ id: photographerProfiles.id })
            .from(photographerProfiles)
            .where(eq(photographerProfiles.clerkId, clerkId))
            .limit(1)
          if (pg) {
            respondingAs = "photographer"
            pgId = pg.id
          }
        } catch (innerErr) {
          if (innerErr instanceof AuthError) {
            return c.json({ success: false, error: innerErr.message }, innerErr.statusCode)
          }
          throw innerErr
        }
      }

      // Fetch entry
      const [entry] = await db
        .select()
        .from(eventPhotographers)
        .where(
          and(
            eq(eventPhotographers.id, entryId),
            eq(eventPhotographers.eventId, eventId)
          )
        )
        .limit(1)

      if (!entry) {
        return c.json({ success: false, error: "Entry fotografer di event tidak ditemukan" }, 404)
      }

      if (respondingAs === "mitra") {
        // Mitra merespons request dari PG (initiated_by = 'photographer')
        if (entry.initiatedBy !== "photographer") {
          return c.json(
            {
              success: false,
              error:
                "Endpoint ini untuk merespons request yang datang dari fotografer. Gunakan endpoint yang sesuai.",
            },
            400
          )
        }
        if (entry.invitationStatus !== "pending") {
          return c.json(
            { success: false, error: "Request sudah direspons sebelumnya" },
            409
          )
        }

        // Validasi: entry harus ada di event milik mitra ini
        const [eventCheck] = await db
          .select({ mitraId: events.mitraId })
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1)

        if (!eventCheck || eventCheck.mitraId !== mitraId) {
          return c.json({ success: false, error: "Forbidden" }, 403)
        }
      } else {
        // Photographer merespons invite dari mitra (initiated_by = 'mitra')
        if (entry.initiatedBy !== "mitra") {
          return c.json(
            {
              success: false,
              error:
                "Endpoint ini untuk merespons undangan yang datang dari mitra. Gunakan endpoint yang sesuai.",
            },
            400
          )
        }
        if (entry.invitationStatus !== "pending") {
          return c.json(
            { success: false, error: "Undangan sudah direspons sebelumnya" },
            409
          )
        }
        // Validasi: PG ini adalah pemilik entry tersebut
        if (entry.photographerId !== pgId) {
          return c.json({ success: false, error: "Forbidden" }, 403)
        }
      }

      // Pre-MoU: 'accepted' berarti terms disetujui, MoU sign di Fase 7
      const [updated] = await db
        .update(eventPhotographers)
        .set({
          invitationStatus: status,
          updatedAt: new Date(),
        })
        .where(eq(eventPhotographers.id, entryId))
        .returning()

      return c.json({ success: true, data: updated })
    } catch (err) {
      if (err instanceof AuthError) {
        return c.json({ success: false, error: err.message }, err.statusCode)
      }
      throw err
    }
  }
)

// ---------------------------------------------------------------------------
// PATCH /api/events/:id — [MITRA]
// Update pengaturan open recruitment event
// ---------------------------------------------------------------------------
const updateEventSchema = z.object({
  namaEvent: z.string().optional(),
  deskripsi: z.string().optional(),
  lokasi: z.string().optional(),
  tanggalMulai: z.string().datetime().optional(),
  tanggalSelesai: z.string().datetime().nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
  feePgTetap: z.number().min(0).optional(),
  kuotaPgTetap: z.number().min(0).optional(),
  feePgPerEvent: z.number().min(0).optional(),
  kuotaPgPerEvent: z.number().min(0).optional(),
  isOpenRecruitment: z.boolean().optional(),
  deadlineRequest: z.string().datetime().nullable().optional(),
})

eventsRouter.patch(
  "/:id",
  zValidator("json", updateEventSchema),
  async (c) => {
    try {
      const { clerkId } = await requireRole("mitra")
      const eventId = c.req.param("id")
      const body = c.req.valid("json")

      const [mitra] = await db
        .select({ id: mitraProfiles.id })
        .from(mitraProfiles)
        .where(eq(mitraProfiles.clerkId, clerkId))
        .limit(1)

      if (!mitra) {
        return c.json({ success: false, error: "Profil mitra tidak ditemukan" }, 404)
      }

      // Validasi: event harus milik mitra ini
      const [event] = await db
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.mitraId, mitra.id)))
        .limit(1)

      if (!event) {
        return c.json(
          { success: false, error: "Event tidak ditemukan atau bukan milik mitra Anda" },
          404
        )
      }

      // Build update object only with provided fields
      const updateData: any = {
        updatedAt: new Date(),
      }

      const fields = [
        "namaEvent", "deskripsi", "lokasi", "coverImageUrl",
        "feePgTetap", "kuotaPgTetap", "feePgPerEvent", "kuotaPgPerEvent",
        "isOpenRecruitment"
      ]

      fields.forEach(f => {
        if (body[f as keyof typeof body] !== undefined) {
          updateData[f] = body[f as keyof typeof body]
        }
      })

      // Special handling for dates to ensure proper conversion
      if (body.tanggalMulai) updateData.tanggalMulai = new Date(body.tanggalMulai)
      if (body.tanggalSelesai !== undefined) updateData.tanggalSelesai = body.tanggalSelesai ? new Date(body.tanggalSelesai) : null
      
      // Recruitment settings logic
      if (body.isOpenRecruitment !== undefined) {
        updateData.isOpenRecruitment = body.isOpenRecruitment
        if (body.deadlineRequest !== undefined) {
          updateData.deadlineRequest = (body.isOpenRecruitment && body.deadlineRequest) 
            ? new Date(body.deadlineRequest) 
            : null
        }
      } else if (body.deadlineRequest !== undefined) {
        // If only deadline is sent, we respect current isOpenRecruitment status
        updateData.deadlineRequest = (event.isOpenRecruitment && body.deadlineRequest)
          ? new Date(body.deadlineRequest)
          : null
      }

      const [updated] = await db
        .update(events)
        .set(updateData)
        .where(eq(events.id, eventId))
        .returning()

      return c.json({ success: true, data: updated })
    } catch (err) {
      if (err instanceof AuthError) {
        return c.json({ success: false, error: err.message }, err.statusCode)
      }
      throw err
    }
  }
)

// ---------------------------------------------------------------------------
// GET /api/events/debug/db-diag — [DIAGNOSTIC]
// ---------------------------------------------------------------------------
eventsRouter.get("/debug/db-diag", async (c) => {
  try {
    const enumDetail = await db.execute(sql`
      SELECT n.nspname as schema, t.typname as name, e.enumlabel
      FROM photographer_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'photographer_type' OR t.typname = 'pg_type_enum';
    `)
    const tableInfo = await db.execute(sql`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'event_photographers' AND column_name = 'photographer_type';
    `)
    return c.json({ enumDetail, tableInfo })
  } catch (err: any) {
    return c.json({ error: err.message })
  }
})

