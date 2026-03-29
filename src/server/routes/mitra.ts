// src/server/routes/mitra.ts
// Router untuk domain Mitra — anggota tetap, kontrak, dan detail mitra
// Sesuai API.md §5
//
// ROUTE ORDER (penting untuk Hono):
// GET /me/photographers harus di atas GET /:id agar tidak di-capture sebagai param

import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { and, eq, inArray, or, sql, isNull } from "drizzle-orm"
import { db } from "@/db"
import {
  mitraProfiles,
  photographerProfiles,
  mitraPhotographers,
  events,
  orders,
  eventPhotographers,
} from "@/db/schema"
import { requireRole, AuthError } from "@/lib/clerk"
import { clerkClient } from "@clerk/nextjs/server"

export const mitraRouter = new Hono()

// ---------------------------------------------------------------------------
// GET /api/mitra
// List semua mitra yang sudah verified (Public)
// ---------------------------------------------------------------------------
mitraRouter.get("/", async (c) => {
  try {
    const verifiedMitra = await db
      .select({
        id: mitraProfiles.id,
        namaOrganisasi: mitraProfiles.namaOrganisasi,
        tipeMitra: mitraProfiles.tipeMitra,
        coverImageUrl: mitraProfiles.coverImageUrl,
        websiteUrl: mitraProfiles.websiteUrl,
        clerkId: mitraProfiles.clerkId,
      })
      .from(mitraProfiles)
      .where(eq(mitraProfiles.verificationStatus, "verified"))

    // Get event count for each mitra
    const mitraIds = verifiedMitra.map((m) => m.id)
    let eventCounts: Record<string, number> = {}

    if (mitraIds.length > 0) {
      const counts = await db
        .select({
          mitraId: events.mitraId,
          count: sql<number>`cast(count(${events.id}) as int)`,
        })
        .from(events)
        .where(inArray(events.mitraId, mitraIds))
        .groupBy(events.mitraId)

      counts.forEach((row) => {
        eventCounts[row.mitraId] = row.count
      })
    }

    const data = verifiedMitra.map((m) => ({
      ...m,
      totalEvent: eventCounts[m.id] || 0,
    }))

    return c.json({ success: true, data })
  } catch (err) {
    return c.json({ success: false, error: "Gagal mengambil daftar mitra" }, 500)
  }
})

// ---------------------------------------------------------------------------
// GET /api/mitra/:id/public
// Detail publik mitra + daftar event (Public)
// ---------------------------------------------------------------------------
mitraRouter.get("/:id/public", async (c) => {
  try {
    const mitraId = c.req.param("id")

    const [mitra] = await db
      .select()
      .from(mitraProfiles)
      .where(and(eq(mitraProfiles.id, mitraId), eq(mitraProfiles.verificationStatus, "verified")))
      .limit(1)

    if (!mitra) {
      return c.json({ success: false, error: "Mitra tidak ditemukan atau belum diverifikasi" }, 404)
    }

    // Ambil semua event mitra ini
    const mitraEvents = await db
      .select()
      .from(events)
      .where(eq(events.mitraId, mitraId))
      .orderBy(desc(events.tanggalMulai))

    // Ambil slotTerisi (pgConfirmed) untuk tiap event
    const eventIds = mitraEvents.map((e) => e.id)
    let pgCounts: Record<string, number> = {}

    if (eventIds.length > 0) {
      const counts = await db
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

      counts.forEach((row) => {
        pgCounts[row.eventId] = row.count
      })
    }

    const data = {
      mitra: {
        id: mitra.id,
        namaOrganisasi: mitraProfiles.namaOrganisasi,
        bio: mitraProfiles.bio,
        tipeMitra: mitra.tipeMitra,
        coverImageUrl: mitra.coverImageUrl,
        websiteUrl: mitra.websiteUrl,
        lokasi: mitra.lokasi,
      },
      events: mitraEvents.map((e) => ({
        ...e,
        slotTerisi: pgCounts[e.id] || 0,
      })),
    }

    return c.json({ success: true, data })
  } catch (err) {
    return c.json({ success: false, error: "Gagal mengambil profil mitra" }, 500)
  }
})

// ---------------------------------------------------------------------------
// GET /api/mitra/me/photographers — [MITRA]
// List PG anggota tetap dengan contract_status IN ('active', 'pending_expiry')
// HARUS di atas GET /:id agar tidak ditangkap sebagai dynamic param
// ---------------------------------------------------------------------------
mitraRouter.get("/me/photographers", async (c) => {
  try {
    const { clerkId } = await requireRole("mitra")

    const [mitra] = await db
      .select({ id: mitraProfiles.id })
      .from(mitraProfiles)
      .where(eq(mitraProfiles.clerkId, clerkId))
      .limit(1)

    if (!mitra) {
      return c.json({ success: false, error: "Profil mitra tidak ditemukan" }, 404)
    }

    const contracts = await db
      .select({
        contractId: mitraPhotographers.id,
        photographerId: mitraPhotographers.photographerId,
        photographerClerkId: photographerProfiles.clerkId,
        contractStatus: mitraPhotographers.contractStatus,
        invitationStatus: mitraPhotographers.invitationStatus,
        initiatedBy: mitraPhotographers.initiatedBy,
        mitraPercent: mitraPhotographers.mitraPercent,
        photographerPercent: mitraPhotographers.photographerPercent,
        minimumFeePerEvent: mitraPhotographers.minimumFeePerEvent,
        tanggalMulai: mitraPhotographers.tanggalMulai,
        tanggalSelesai: mitraPhotographers.tanggalSelesai,
        ratingAverage: photographerProfiles.ratingAverage,
        pgBaseMinFee: photographerProfiles.baseMinimumFee,
      })
      .from(mitraPhotographers)
      .innerJoin(
        photographerProfiles,
        eq(photographerProfiles.id, mitraPhotographers.photographerId)
      )
      .where(
        and(
          eq(mitraPhotographers.mitraId, mitra.id),
          or(
            sql`${mitraPhotographers.contractStatus}::text IN ('active', 'pending_expiry')`,
            and(
              isNull(mitraPhotographers.contractStatus),
              sql`${mitraPhotographers.invitationStatus}::text IN ('pending', 'accepted')`
            )
          )
        )
      )

    // Enrich nama dari Clerk secara batch (bukan per-PG)
    const clerkIds = contracts.map((c) => c.photographerClerkId)
    let clerkNamaMap: Record<string, string> = {}

    if (clerkIds.length > 0) {
      const clerk = await clerkClient()
      const userList = await clerk.users.getUserList({ userId: clerkIds })
      userList.data.forEach((u) => {
        clerkNamaMap[u.id] =
          `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Fotografer"
      })
    }

    const data = contracts.map((row) => ({
      contractId: row.contractId,
      photographerId: row.photographerId,
      nama: clerkNamaMap[row.photographerClerkId] ?? "Fotografer",
      contractStatus: row.contractStatus,
      invitationStatus: row.invitationStatus,
      initiatedBy: row.initiatedBy,
      mitraPercent: row.mitraPercent,
      photographerPercent: row.photographerPercent,
      minimumFeePerEvent: row.minimumFeePerEvent || row.pgBaseMinFee || 0,
      tanggalMulai: row.tanggalMulai,
      tanggalSelesai: row.tanggalSelesai,
      ratingAverage: row.ratingAverage,
    }))

    return c.json({ success: true, data })
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ success: false, error: err.message }, err.statusCode)
    }
    throw err
  }
})

// ---------------------------------------------------------------------------
// POST /api/mitra/me/photographers/invite — [MITRA]
// Mitra invite PG untuk jadi anggota tetap
// ---------------------------------------------------------------------------
const invitePhotographerSchema = z.object({
  photographerId: z.string().uuid(),
  mitraPercent: z.number().min(0).max(100),
  photographerPercent: z.number().min(0).max(100),
  minimumFeePerEvent: z.number().int().min(0).optional(),
  tanggalMulai: z.string().datetime(),
  tanggalSelesai: z.string().datetime(),
  invitationMessage: z.string().optional(),
})

mitraRouter.post(
  "/me/photographers/invite",
  zValidator("json", invitePhotographerSchema),
  async (c) => {
    try {
      const { clerkId } = await requireRole("mitra")
      const body = c.req.valid("json")

      // Validasi: mitraPercent + photographerPercent harus = 100
      if (Math.round(body.mitraPercent + body.photographerPercent) !== 100) {
        return c.json(
          { success: false, error: "mitraPercent + photographerPercent harus = 100" },
          400
        )
      }

      const [mitra] = await db
        .select({ id: mitraProfiles.id })
        .from(mitraProfiles)
        .where(eq(mitraProfiles.clerkId, clerkId))
        .limit(1)

      if (!mitra) {
        return c.json({ success: false, error: "Profil mitra tidak ditemukan" }, 404)
      }

      // Validasi: PG harus ada dan verification_status = 'verified'
      const [pg] = await db
        .select({ 
          id: photographerProfiles.id, 
          verificationStatus: photographerProfiles.verificationStatus,
          baseMinimumFee: photographerProfiles.baseMinimumFee 
        })
        .from(photographerProfiles)
        .where(eq(photographerProfiles.id, body.photographerId))
        .limit(1)

      if (!pg) {
        return c.json({ success: false, error: "Fotografer tidak ditemukan" }, 404)
      }
      if (pg.verificationStatus !== "verified") {
        return c.json(
          { success: false, error: "Fotografer belum terverifikasi" },
          400
        )
      }

      // Validasi: PG tidak boleh sudah punya kontrak active/pending_expiry
      const [existingContract] = await db
        .select({ id: mitraPhotographers.id })
        .from(mitraPhotographers)
        .where(
          and(
            eq(mitraPhotographers.photographerId, body.photographerId),
            inArray(mitraPhotographers.contractStatus, ["active", "pending_expiry"])
          )
        )
        .limit(1)

      if (existingContract) {
        return c.json(
          {
            success: false,
            error:
              "Fotografer sudah memiliki kontrak aktif dengan mitra lain",
          },
          409
        )
      }

      const [inserted] = await db
        .insert(mitraPhotographers)
        .values({
          mitraId: mitra.id,
          photographerId: body.photographerId,
          initiatedBy: "mitra",
          invitationStatus: "pending",
          invitationMessage: body.invitationMessage,
          mitraPercent: body.mitraPercent,
          photographerPercent: body.photographerPercent,
          minimumFeePerEvent: body.minimumFeePerEvent ?? pg.baseMinimumFee,
          tanggalMulai: new Date(body.tanggalMulai),
          tanggalSelesai: new Date(body.tanggalSelesai),
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
// POST /api/mitra/me/join-request/:photographerId/respond — [MITRA]
// Mitra acc atau deny request dari PG yang initiated_by = 'photographer'
// ---------------------------------------------------------------------------
const respondJoinRequestSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
  // Wajib saat accepted
  mitraPercent: z.number().min(0).max(100).optional(),
  photographerPercent: z.number().min(0).max(100).optional(),
  minimumFeePerEvent: z.number().int().min(0).optional(),
  tanggalMulai: z.string().datetime().optional(),
  tanggalSelesai: z.string().datetime().optional(),
})

mitraRouter.post(
  "/me/join-request/:photographerId/respond",
  zValidator("json", respondJoinRequestSchema),
  async (c) => {
    try {
      const { clerkId } = await requireRole("mitra")
      const photographerId = c.req.param("photographerId")
      const body = c.req.valid("json")

      const [mitra] = await db
        .select({ id: mitraProfiles.id })
        .from(mitraProfiles)
        .where(eq(mitraProfiles.clerkId, clerkId))
        .limit(1)

      if (!mitra) {
        return c.json({ success: false, error: "Profil mitra tidak ditemukan" }, 404)
      }

      // Cari kontrak pending dari PG ini ke mitra ini
      const [contract] = await db
        .select()
        .from(mitraPhotographers)
        .where(
          and(
            eq(mitraPhotographers.mitraId, mitra.id),
            eq(mitraPhotographers.photographerId, photographerId),
            eq(mitraPhotographers.initiatedBy, "photographer"),
            eq(mitraPhotographers.invitationStatus, "pending")
          )
        )
        .limit(1)

      if (!contract) {
        return c.json(
          {
            success: false,
            error:
              "Tidak ada request bergabung dari fotografer ini yang menunggu respons",
          },
          404
        )
      }

      if (body.status === "accepted") {
        // Validasi field wajib saat accepted
        if (
          body.mitraPercent === undefined ||
          body.photographerPercent === undefined ||
          body.minimumFeePerEvent === undefined ||
          !body.tanggalMulai ||
          !body.tanggalSelesai
        ) {
          return c.json(
            {
              success: false,
              error:
                "mitraPercent, photographerPercent, minimumFeePerEvent, tanggalMulai, tanggalSelesai wajib diisi saat menerima request",
            },
            400
          )
        }

        if (Math.round(body.mitraPercent + body.photographerPercent) !== 100) {
          return c.json(
            { success: false, error: "mitraPercent + photographerPercent harus = 100" },
            400
          )
        }

        const [updated] = await db.transaction(async (tx) => {
          return tx
            .update(mitraPhotographers)
            .set({
              invitationStatus: "accepted",
              mitraPercent: body.mitraPercent,
              photographerPercent: body.photographerPercent,
              minimumFeePerEvent: body.minimumFeePerEvent,
              tanggalMulai: new Date(body.tanggalMulai!),
              tanggalSelesai: new Date(body.tanggalSelesai!),
              updatedAt: new Date(),
              // contract_status tetap NULL — aktif setelah e-sign MoU di Fase 7
            })
            .where(eq(mitraPhotographers.id, contract.id))
            .returning()
        })

        return c.json({ success: true, data: updated })
      } else {
        // rejected
        const [updated] = await db.transaction(async (tx) => {
          return tx
            .update(mitraPhotographers)
            .set({
              invitationStatus: "rejected",
              updatedAt: new Date(),
            })
            .where(eq(mitraPhotographers.id, contract.id))
            .returning()
        })

        return c.json({ success: true, data: updated })
      }
    } catch (err) {
      if (err instanceof AuthError) {
        return c.json({ success: false, error: err.message }, err.statusCode)
      }
      throw err
    }
  }
)

// ---------------------------------------------------------------------------
// PATCH /api/mitra/me/contracts/:contractId/activate — [MITRA]
// [SIMULASI FASE 7] Mitra secara sepihak mengaktifkan kontrak (anggap ttd MoU)
// ---------------------------------------------------------------------------
mitraRouter.patch("/me/contracts/:contractId/activate", async (c) => {
  try {
    const { clerkId } = await requireRole("mitra")
    const contractId = c.req.param("contractId")

    const [mitra] = await db
      .select({ id: mitraProfiles.id })
      .from(mitraProfiles)
      .where(eq(mitraProfiles.clerkId, clerkId))
      .limit(1)

    if (!mitra) {
      return c.json({ success: false, error: "Profil mitra tidak ditemukan" }, 404)
    }

    // Pastikan kontrak milik mitra ini dan statusnya 'accepted'
    const [contract] = await db
      .select({ id: mitraPhotographers.id })
      .from(mitraPhotographers)
      .where(
        and(
          eq(mitraPhotographers.id, contractId),
          eq(mitraPhotographers.mitraId, mitra.id),
          sql`${mitraPhotographers.invitationStatus}::text = 'accepted'`
        )
      )
      .limit(1)

    if (!contract) {
      return c.json(
        { success: false, error: "Kontrak tidak ditemukan atau belum disetujui oleh fotografer" },
        404
      )
    }

    const [updated] = await db
      .update(mitraPhotographers)
      .set({
        contractStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(mitraPhotographers.id, contract.id))
      .returning()

    return c.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ success: false, error: err.message }, err.statusCode)
    }
    throw err
  }
})


// ---------------------------------------------------------------------------
// PATCH /api/mitra/photographers/:contractId/terminate — [MITRA]
// Terminate kontrak anggota tetap
// ---------------------------------------------------------------------------
const terminateContractSchema = z.object({
  terminationReason: z.string().min(5),
})

mitraRouter.patch(
  "/photographers/:contractId/terminate",
  zValidator("json", terminateContractSchema),
  async (c) => {
    try {
      const { clerkId } = await requireRole("mitra")
      const contractId = c.req.param("contractId")
      const { terminationReason } = c.req.valid("json")

      const [mitra] = await db
        .select({ id: mitraProfiles.id })
        .from(mitraProfiles)
        .where(eq(mitraProfiles.clerkId, clerkId))
        .limit(1)

      if (!mitra) {
        return c.json({ success: false, error: "Profil mitra tidak ditemukan" }, 404)
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

      // Validasi: kontrak harus milik mitra ini
      if (contract.mitraId !== mitra.id) {
        return c.json({ success: false, error: "Forbidden" }, 403)
      }

      // Validasi: contract_status harus 'active' atau 'pending_expiry'
      if (
        contract.contractStatus !== "active" &&
        contract.contractStatus !== "pending_expiry"
      ) {
        return c.json(
          {
            success: false,
            error:
              "Hanya kontrak dengan status 'active' atau 'pending_expiry' yang dapat diterminasi",
          },
          400
        )
      }

      // Validasi: PG tidak boleh punya order aktif yang terkait event mitra ini
      const activeOrderStatuses = ["pending", "confirmed", "dp_paid", "ongoing"] as const

      const activeOrders = await db
        .select({ id: orders.id })
        .from(orders)
        .innerJoin(events, eq(orders.eventId, events.id))
        .where(
          and(
            eq(orders.photographerId, contract.photographerId),
            eq(events.mitraId, mitra.id),
            inArray(orders.status, activeOrderStatuses)
          )
        )
        .limit(1)

      if (activeOrders.length > 0) {
        return c.json(
          {
            success: false,
            error:
              "Fotografer masih memiliki order aktif di event mitra ini. Selesaikan order terlebih dahulu sebelum menterminasi kontrak.",
          },
          409
        )
      }

      const [updated] = await db.transaction(async (tx) => {
        return tx
          .update(mitraPhotographers)
          .set({
            contractStatus: "terminated",
            terminatedAt: new Date(),
            terminationReason,
            updatedAt: new Date(),
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

// ---------------------------------------------------------------------------
// GET /api/mitra/:id — [PUBLIC]
// Detail mitra beserta event aktif (is_published = true)
// Harus di bawah semua route /me/... agar tidak intercept
// ---------------------------------------------------------------------------
mitraRouter.get("/:id", async (c) => {
  const mitraId = c.req.param("id")

  const [mitra] = await db
    .select()
    .from(mitraProfiles)
    .where(eq(mitraProfiles.id, mitraId))
    .limit(1)

  if (!mitra) {
    return c.json({ success: false, error: "Mitra tidak ditemukan" }, 404)
  }

  const activeEvents = await db
    .select({
      id: events.id,
      namaEvent: events.namaEvent,
      tanggalMulai: events.tanggalMulai,
      tanggalSelesai: events.tanggalSelesai,
      lokasi: events.lokasi,
      coverImageUrl: events.coverImageUrl,
      isOpenRecruitment: events.isOpenRecruitment,
      deadlineRequest: events.deadlineRequest,
    })
    .from(events)
    .where(
      and(eq(events.mitraId, mitraId), eq(events.isPublished, true))
    )

  // Sembunyikan data sensitif sebelum return (nomorTelepon tidak dikembalikan)
  return c.json({
    success: true,
    data: {
      id: mitra.id,
      namaOrganisasi: mitra.namaOrganisasi,
      tipeMitra: mitra.tipeMitra,
      alamat: mitra.alamat,
      websiteUrl: mitra.websiteUrl,
      verificationStatus: mitra.verificationStatus,
      createdAt: mitra.createdAt,
      events: activeEvents,
    },
  })
})
