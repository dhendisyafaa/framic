// src/server/routes/contracts.ts
// Router untuk domain Kontrak Digital (MoU) — Fase 7 MVP
// Mendukung dua jenis kontrak via query param ?type=mitra|event
//
// Batasan MVP Fase 7:
// - Tidak ada PDF generation (TODO post-MVP)
// - Tidak ada counter-offer — terms sudah final dari Fase 6
// - Hanya simpan signed_at timestamp + IP address

import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import {
  mitraPhotographers,
  mitraProfiles,
  photographerProfiles,
  eventPhotographers,
  events,
} from "@/db/schema"
import { auth, currentUser } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { AuthError } from "@/lib/clerk"

export const contractsRouter = new Hono()

// ---------------------------------------------------------------------------
// Schema validasi query param type yang digunakan di kedua endpoint
// ---------------------------------------------------------------------------
const contractTypeSchema = z.object({
  type: z.enum(["mitra", "event"], {
    errorMap: () => ({ message: "Query param 'type' harus 'mitra' atau 'event'" }),
  }),
})

// ---------------------------------------------------------------------------
// Helper: ambil IP address dari request headers
// ---------------------------------------------------------------------------
function getClientIp(c: Parameters<Parameters<typeof contractsRouter.get>[1]>[0]): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  )
}

// ---------------------------------------------------------------------------
// GET /api/contracts/:contractId — [AUTH]
// Detail kontrak untuk review sebelum sign.
// Query param type: 'mitra' | 'event'
// ---------------------------------------------------------------------------
contractsRouter.get(
  "/:contractId",
  zValidator("query", contractTypeSchema),
  async (c) => {
    const { userId } = await auth()
    if (!userId) {
      return c.json({ success: false, error: "Unauthorized: harus login" }, 401)
    }

    const contractId = c.req.param("contractId")
    const { type } = c.req.valid("query")

    if (type === "mitra") {
      // Query ke tabel mitra_photographers
      const [contract] = await db
        .select()
        .from(mitraPhotographers)
        .where(eq(mitraPhotographers.id, contractId))
        .limit(1)

      if (!contract) {
        return c.json({ success: false, error: "Kontrak tidak ditemukan" }, 404)
      }

      // Fetch mitra dan photographer untuk validasi akses
      const [mitra] = await db
        .select({ id: mitraProfiles.id, clerkId: mitraProfiles.clerkId, namaOrganisasi: mitraProfiles.namaOrganisasi })
        .from(mitraProfiles)
        .where(eq(mitraProfiles.id, contract.mitraId))
        .limit(1)

      const [pg] = await db
        .select({ id: photographerProfiles.id, clerkId: photographerProfiles.clerkId })
        .from(photographerProfiles)
        .where(eq(photographerProfiles.id, contract.photographerId))
        .limit(1)

      if (!mitra || !pg) {
        return c.json({ success: false, error: "Data kontrak tidak lengkap" }, 500)
      }

      // Validasi akses: harus salah satu pihak dalam kontrak
      if (userId !== mitra.clerkId && userId !== pg.clerkId) {
        return c.json({ success: false, error: "Forbidden: Anda bukan pihak dalam kontrak ini" }, 403)
      }

      // Ambil nama PG dari Clerk
      const clerk = await clerkClient()
      let pgNama = "Fotografer"
      try {
        const pgUser = await clerk.users.getUser(pg.clerkId)
        pgNama = `${pgUser.firstName ?? ""} ${pgUser.lastName ?? ""}`.trim() || "Fotografer"
      } catch {
        // silent fail
      }

      const bothSigned = !!contract.photographerSignedAt && !!contract.mitraSignedAt

      return c.json({
        success: true,
        data: {
          contractId: contract.id,
          type: "mitra" as const,
          invitationStatus: contract.invitationStatus,
          contractStatus: contract.contractStatus,
          initiatedBy: contract.initiatedBy,
          mitra: { id: mitra.id, namaOrganisasi: mitra.namaOrganisasi },
          photographer: { id: pg.id, nama: pgNama },
          mitraPercent: contract.mitraPercent,
          photographerPercent: contract.photographerPercent,
          minimumFeePerEvent: contract.minimumFeePerEvent,
          tanggalMulai: contract.tanggalMulai,
          tanggalSelesai: contract.tanggalSelesai,
          photographerSignedAt: contract.photographerSignedAt,
          mitraSignedAt: contract.mitraSignedAt,
          bothSigned,
          // Read-only: mitraClerkId dan pgClerkId untuk client-side role check
          mitraClerkId: mitra.clerkId,
          photographerClerkId: pg.clerkId,
        },
      })
    } else {
      // type === 'event'
      // Query ke tabel event_photographers JOIN events
      const [ep] = await db
        .select({
          id: eventPhotographers.id,
          eventId: eventPhotographers.eventId,
          photographerId: eventPhotographers.photographerId,
          photographerType: eventPhotographers.photographerType,
          initiatedBy: eventPhotographers.initiatedBy,
          invitationStatus: eventPhotographers.invitationStatus,
          mitraPercent: eventPhotographers.mitraPercent,
          photographerPercent: eventPhotographers.photographerPercent,
          photographerSignedAt: eventPhotographers.photographerSignedAt,
          mitraSignedAt: eventPhotographers.mitraSignedAt,
        })
        .from(eventPhotographers)
        .where(eq(eventPhotographers.id, contractId))
        .limit(1)

      if (!ep) {
        return c.json({ success: false, error: "Kontrak event tidak ditemukan" }, 404)
      }

      // Fetch event + mitra
      const [event] = await db
        .select({
          id: events.id,
          namaEvent: events.namaEvent,
          tanggalMulai: events.tanggalMulai,
          tanggalSelesai: events.tanggalSelesai,
          lokasi: events.lokasi,
          feePgPerEvent: events.feePgPerEvent,
          mitraId: events.mitraId,
        })
        .from(events)
        .where(eq(events.id, ep.eventId))
        .limit(1)

      if (!event) {
        return c.json({ success: false, error: "Event terkait tidak ditemukan" }, 404)
      }

      const [mitra] = await db
        .select({ id: mitraProfiles.id, clerkId: mitraProfiles.clerkId, namaOrganisasi: mitraProfiles.namaOrganisasi })
        .from(mitraProfiles)
        .where(eq(mitraProfiles.id, event.mitraId))
        .limit(1)

      const [pg] = await db
        .select({ id: photographerProfiles.id, clerkId: photographerProfiles.clerkId })
        .from(photographerProfiles)
        .where(eq(photographerProfiles.id, ep.photographerId))
        .limit(1)

      if (!mitra || !pg) {
        return c.json({ success: false, error: "Data kontrak tidak lengkap" }, 500)
      }

      // Validasi akses: harus salah satu pihak dalam kontrak
      if (userId !== mitra.clerkId && userId !== pg.clerkId) {
        return c.json({ success: false, error: "Forbidden: Anda bukan pihak dalam kontrak ini" }, 403)
      }

      // Ambil nama PG dari Clerk
      const clerk = await clerkClient()
      let pgNama = "Fotografer"
      try {
        const pgUser = await clerk.users.getUser(pg.clerkId)
        pgNama = `${pgUser.firstName ?? ""} ${pgUser.lastName ?? ""}`.trim() || "Fotografer"
      } catch {
        // silent fail
      }

      const bothSigned = !!ep.photographerSignedAt && !!ep.mitraSignedAt

      return c.json({
        success: true,
        data: {
          contractId: ep.id,
          type: "event" as const,
          invitationStatus: ep.invitationStatus,
          initiatedBy: ep.initiatedBy,
          event: {
            id: event.id,
            namaEvent: event.namaEvent,
            tanggalMulai: event.tanggalMulai,
            tanggalSelesai: event.tanggalSelesai,
            lokasi: event.lokasi,
          },
          mitra: { id: mitra.id, namaOrganisasi: mitra.namaOrganisasi },
          photographer: { id: pg.id, nama: pgNama },
          mitraPercent: ep.mitraPercent,
          photographerPercent: ep.photographerPercent,
          feeAmount: event.feePgPerEvent,
          photographerSignedAt: ep.photographerSignedAt,
          mitraSignedAt: ep.mitraSignedAt,
          bothSigned,
          // Read-only: untuk client-side role check
          mitraClerkId: mitra.clerkId,
          photographerClerkId: pg.clerkId,
        },
      })
    }
  }
)

// ---------------------------------------------------------------------------
// POST /api/contracts/:contractId/sign — [AUTH]
// E-sign kontrak. Simpan signed_at + IP address.
// Side effect type='mitra': jika kedua pihak sign → contract_status = 'active'
// Side effect type='event': tidak ada perubahan tambahan (invitation_status tetap)
// TODO post-MVP: generate PDF MoU via mou-generator.ts + upload Cloudinary
// ---------------------------------------------------------------------------
contractsRouter.post(
  "/:contractId/sign",
  zValidator("query", contractTypeSchema),
  async (c) => {
    const { userId } = await auth()
    if (!userId) {
      return c.json({ success: false, error: "Unauthorized: harus login" }, 401)
    }

    const contractId = c.req.param("contractId")
    const { type } = c.req.valid("query")
    const ip = getClientIp(c)

    try {
      if (type === "mitra") {
        // Fetch kontrak
        const [contract] = await db
          .select()
          .from(mitraPhotographers)
          .where(eq(mitraPhotographers.id, contractId))
          .limit(1)

        if (!contract) {
          return c.json({ success: false, error: "Kontrak tidak ditemukan" }, 404)
        }

        // Validasi: invitation_status harus 'accepted'
        if (contract.invitationStatus !== "accepted") {
          return c.json(
            {
              success: false,
              error: "Kontrak harus dalam status 'accepted' sebelum dapat ditandatangani",
            },
            400
          )
        }

        // Fetch mitra + pg untuk validasi akses
        const [mitra] = await db
          .select({ clerkId: mitraProfiles.clerkId })
          .from(mitraProfiles)
          .where(eq(mitraProfiles.id, contract.mitraId))
          .limit(1)

        const [pg] = await db
          .select({ clerkId: photographerProfiles.clerkId })
          .from(photographerProfiles)
          .where(eq(photographerProfiles.id, contract.photographerId))
          .limit(1)

        if (!mitra || !pg) {
          return c.json({ success: false, error: "Data kontrak tidak lengkap" }, 500)
        }

        const isPhotographer = userId === pg.clerkId
        const isMitra = userId === mitra.clerkId

        if (!isPhotographer && !isMitra) {
          return c.json({ success: false, error: "Forbidden: Anda bukan pihak dalam kontrak ini" }, 403)
        }

        // Validasi: user belum sign sebelumnya
        if (isPhotographer && contract.photographerSignedAt) {
          return c.json(
            { success: false, error: "Anda sudah menandatangani kontrak ini sebelumnya" },
            409
          )
        }
        if (isMitra && contract.mitraSignedAt) {
          return c.json(
            { success: false, error: "Anda sudah menandatangani kontrak ini sebelumnya" },
            409
          )
        }

        const signedAt = new Date()
        const updateData = isPhotographer
          ? { photographerSignedAt: signedAt, photographerIp: ip, updatedAt: new Date() }
          : { mitraSignedAt: signedAt, mitraIp: ip, updatedAt: new Date() }

        const result = await db.transaction(async (tx) => {
          // Update sign pihak yang bersangkutan
          await tx
            .update(mitraPhotographers)
            .set(updateData)
            .where(eq(mitraPhotographers.id, contractId))

          // Cek apakah kedua pihak sudah sign setelah update ini
          const [updated] = await tx
            .select({
              photographerSignedAt: mitraPhotographers.photographerSignedAt,
              mitraSignedAt: mitraPhotographers.mitraSignedAt,
            })
            .from(mitraPhotographers)
            .where(eq(mitraPhotographers.id, contractId))
            .limit(1)

          let contractStatus: string | null = null

          if (updated?.photographerSignedAt && updated?.mitraSignedAt) {
            await tx
              .update(mitraPhotographers)
              .set({ contractStatus: "active", updatedAt: new Date() })
              .where(eq(mitraPhotographers.id, contractId))
            contractStatus = "active"
            // TODO post-MVP: generate PDF MoU via mou-generator.ts + upload Cloudinary + update mouGeneratedUrl
          }

          const bothSigned = !!updated?.photographerSignedAt && !!updated?.mitraSignedAt

          return {
            signedAt,
            bothSigned,
            contractStatus,
            message: bothSigned
              ? "Kontrak telah ditandatangani oleh kedua pihak."
              : "Tanda tangan berhasil disimpan. Menunggu pihak lain untuk menandatangani.",
          }
        })

        return c.json({ success: true, data: result })
      } else {
        // type === 'event'
        const [ep] = await db
          .select({
            id: eventPhotographers.id,
            eventId: eventPhotographers.eventId,
            photographerId: eventPhotographers.photographerId,
            invitationStatus: eventPhotographers.invitationStatus,
            photographerSignedAt: eventPhotographers.photographerSignedAt,
            mitraSignedAt: eventPhotographers.mitraSignedAt,
          })
          .from(eventPhotographers)
          .where(eq(eventPhotographers.id, contractId))
          .limit(1)

        if (!ep) {
          return c.json({ success: false, error: "Kontrak event tidak ditemukan" }, 404)
        }

        // Validasi: invitation_status harus 'accepted'
        if (ep.invitationStatus !== "accepted") {
          return c.json(
            {
              success: false,
              error: "Kontrak harus dalam status 'accepted' sebelum dapat ditandatangani",
            },
            400
          )
        }

        // Fetch event → mitra
        const [event] = await db
          .select({ mitraId: events.mitraId })
          .from(events)
          .where(eq(events.id, ep.eventId))
          .limit(1)

        if (!event) {
          return c.json({ success: false, error: "Event terkait tidak ditemukan" }, 404)
        }

        const [mitra] = await db
          .select({ clerkId: mitraProfiles.clerkId })
          .from(mitraProfiles)
          .where(eq(mitraProfiles.id, event.mitraId))
          .limit(1)

        const [pg] = await db
          .select({ clerkId: photographerProfiles.clerkId })
          .from(photographerProfiles)
          .where(eq(photographerProfiles.id, ep.photographerId))
          .limit(1)

        if (!mitra || !pg) {
          return c.json({ success: false, error: "Data kontrak tidak lengkap" }, 500)
        }

        const isPhotographer = userId === pg.clerkId
        const isMitra = userId === mitra.clerkId

        if (!isPhotographer && !isMitra) {
          return c.json({ success: false, error: "Forbidden: Anda bukan pihak dalam kontrak ini" }, 403)
        }

        // Validasi: user belum sign sebelumnya
        if (isPhotographer && ep.photographerSignedAt) {
          return c.json(
            { success: false, error: "Anda sudah menandatangani kontrak ini sebelumnya" },
            409
          )
        }
        if (isMitra && ep.mitraSignedAt) {
          return c.json(
            { success: false, error: "Anda sudah menandatangani kontrak ini sebelumnya" },
            409
          )
        }

        const signedAt = new Date()
        const updateData = isPhotographer
          ? { photographerSignedAt: signedAt, photographerIp: ip, updatedAt: new Date() }
          : { mitraSignedAt: signedAt, mitraIp: ip, updatedAt: new Date() }

        const result = await db.transaction(async (tx) => {
          await tx
            .update(eventPhotographers)
            .set(updateData)
            .where(eq(eventPhotographers.id, contractId))

          const [updated] = await tx
            .select({
              photographerSignedAt: eventPhotographers.photographerSignedAt,
              mitraSignedAt: eventPhotographers.mitraSignedAt,
            })
            .from(eventPhotographers)
            .where(eq(eventPhotographers.id, contractId))
            .limit(1)

          // invitation_status tetap 'accepted' — tidak ada perubahan status tambahan
          // TODO post-MVP: generate PDF MoU via mou-generator.ts + upload Cloudinary + update mouGeneratedUrl

          const bothSigned = !!updated?.photographerSignedAt && !!updated?.mitraSignedAt

          return {
            signedAt,
            bothSigned,
            contractStatus: null,
            message: bothSigned
              ? "Kontrak telah ditandatangani oleh kedua pihak."
              : "Tanda tangan berhasil disimpan. Menunggu pihak lain untuk menandatangani.",
          }
        })

        return c.json({ success: true, data: result })
      }
    } catch (err) {
      if (err instanceof AuthError) {
        return c.json({ success: false, error: err.message }, err.statusCode)
      }
      throw err
    }
  }
)
