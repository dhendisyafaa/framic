import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { photographerProfiles, mitraProfiles, users } from "@/db/schema"
import { createClerkClient } from "@clerk/nextjs/server"
import { requireAuth } from "@/server/middleware/auth"
import { getRolesFromMetadata, isAdmin } from "@/lib/clerk"
import { captureError } from "@/lib/sentry"
import { sendEmail } from "@/lib/resend"

const adminRouter = new Hono<{ Variables: { clerkId: string } }>()

// Proteksi: Semua rute admin butuh auth + ADMIN role
adminRouter.use("*", requireAuth)
adminRouter.use("*", async (c, next) => {
  const clerkId = c.get("clerkId")
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  const user = await clerk.users.getUser(clerkId)
  const roles = getRolesFromMetadata(user.publicMetadata)

  if (!isAdmin(roles)) {
    return c.json({ success: false, error: "Forbidden: Admin access only" }, 403)
  }
  await next()
})

function mapClerkUsers(clerkUsers: { data: Array<any> }) {
  const map = new Map()

  for (const user of clerkUsers.data) {
    const email = user.emailAddresses?.[0]?.emailAddress || null

    map.set(user.id, {
      name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email,
      username: user.username
    })
  }

  return map
}

function mergePhotographers(dbPhotographers: Array<{ clerkId: string; username?: string | null;[key: string]: unknown }>, clerkMap: Map<string, { name: string; email: string | null; username?: string | null }>) {
  return dbPhotographers.map(p => {
    const clerkData = clerkMap.get(p.clerkId)

    return {
      ...p,
      name: clerkData?.name || null,
      email: clerkData?.email || null,
      username: clerkData?.username || p.username || null
    }
  })
}

function mergeMitra(dbMitra: Array<{ clerkId: string;[key: string]: unknown }>, clerkMap: Map<string, { name: string; email: string | null }>) {
  return dbMitra.map(m => {
    const clerkData = clerkMap.get(m.clerkId)

    return {
      ...m,
      name: clerkData?.name || null,
      email: clerkData?.email || null
    }
  })
}

/**
 * GET /api/admin/verifications
 * Menampilkan semua pengajuan PG & Mitra yang masih 'pending'
 */
adminRouter.get("/verifications", async (c) => {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

  try {
    // 1. Ambil data mentah dari DB (tabel users tidak menyimpan nama/email)
    const dbPhotographers = await db
      .select({
        id: photographerProfiles.id,
        clerkId: photographerProfiles.clerkId,
        bio: photographerProfiles.bio,
        kota: photographerProfiles.kotaDomisili,
        username: photographerProfiles.username,
        kategori: photographerProfiles.kategori,
        portfolioUrls: photographerProfiles.portfolioUrls,
        status: photographerProfiles.verificationStatus,
        createdAt: photographerProfiles.createdAt,
      })
      .from(photographerProfiles)
      .where(eq(photographerProfiles.verificationStatus, "pending"))

    const dbMitra = await db
      .select({
        id: mitraProfiles.id,
        clerkId: mitraProfiles.clerkId,
        namaOrg: mitraProfiles.namaOrganisasi,
        tipeMitra: mitraProfiles.tipeMitra,
        alamat: mitraProfiles.alamat,
        nomorTelepon: mitraProfiles.nomorTelepon,
        websiteUrl: mitraProfiles.websiteUrl,
        dokumenLegalitasUrl: mitraProfiles.dokumenLegalitasUrl,
        status: mitraProfiles.verificationStatus,
        createdAt: mitraProfiles.createdAt,
      })
      .from(mitraProfiles)
      .where(eq(mitraProfiles.verificationStatus, "pending"))


    // 2. Ambil detail user dari Clerk
    const allClerkIds = Array.from(new Set([
      ...dbPhotographers.map(p => p.clerkId),
      ...dbMitra.map(m => m.clerkId)
    ]))

    const clerkUsersResult = allClerkIds.length > 0
      ? await clerk.users.getUserList({ userId: allClerkIds, limit: allClerkIds.length })
      : null

    const clerkUsers = clerkUsersResult ?? { data: [] }

    //3. Gabungkan data
    const clerkMap = mapClerkUsers(clerkUsers)

    const photographers = mergePhotographers(dbPhotographers, clerkMap)
    const mitra = mergeMitra(dbMitra, clerkMap)


    return c.json({
      success: true,
      data: {
        photographers,
        mitra
      }
    })
  } catch (err) {
    captureError(err, { context: "admin-verifications-list" })
    return c.json({ success: false, error: "Failed to fetch verifications" }, 500)
  }
})

/**
 * POST /api/admin/verifications/:targetClerkId/approve-photographer
 */
adminRouter.post("/verifications/:targetClerkId/approve-photographer", async (c) => {
  const targetClerkId = c.req.param("targetClerkId")
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

  try {
    let userEmail: string | undefined
    let userName: string | undefined

    await db.transaction(async (tx) => {
      // 1. Update status di database (photographer_profiles)
      const [pg] = await tx
        .update(photographerProfiles)
        .set({
          verificationStatus: "verified",
          verifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(photographerProfiles.clerkId, targetClerkId))
        .returning()

      if (!pg) throw new Error("Profil fotografer tidak ditemukan")

      // 2. Update role di database (users)
      const [dbUser] = await tx.select().from(users).where(eq(users.clerkId, targetClerkId)).limit(1)
      const currentRoles = dbUser?.roles || []
      const newRoles = Array.from(new Set([...currentRoles, "photographer" as const]))

      await tx.update(users)
        .set({
          roles: newRoles,
          updatedAt: new Date()
        })
        .where(eq(users.clerkId, targetClerkId))

      // 3. Update Metadata di Clerk
      const clerkUser = await clerk.users.getUser(targetClerkId)
      userEmail = clerkUser.emailAddresses?.[0]?.emailAddress
      userName = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()

      const currentMetadata = clerkUser.publicMetadata || {}
      const existingRolesMetadata = getRolesFromMetadata(currentMetadata)
      const finalRolesMetadata = Array.from(new Set([...existingRolesMetadata, "photographer" as const]))

      await clerk.users.updateUserMetadata(targetClerkId, {
        publicMetadata: {
          ...currentMetadata,
          roles: finalRolesMetadata
        }
      })
    })

    // Send email notification outside transaction
    if (userEmail) {
      try {
        await sendEmail({
          to: userEmail,
          subject: "Pengajuan Fotografer Disetujui!",
          html: `
            <div style="font-family: sans-serif; padding: 24px; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
              <h2 style="color: #059669; font-size: 24px; margin-bottom: 16px;">Selamat, ${userName || 'Rekan Framic'}!</h2>
              <p style="font-size: 16px; line-height: 1.6;">Pengajuan Anda sebagai <strong>Fotografer</strong> di Framic telah <strong>Disetujui</strong> oleh tim kami.</p>
              <p style="font-size: 16px; line-height: 1.6;">Sekarang Anda sudah bisa masuk ke dashboard untuk melengkapi profil, mengatur paket layanan, dan mengaktifkan kalender pesanan Anda.</p>
              <div style="margin: 24px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://framic.id'}/dashboard" style="display: inline-block; background-color: #059669; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);">Masuk ke Dashboard</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #64748b; line-height: 1.5;">Email ini dikirimkan secara otomatis oleh sistem Framic. Harap tidak membalas email ini secara langsung.</p>
            </div>
          `
        })
      } catch (emailErr) {
        console.error("Gagal mengirim email verifikasi fotografer:", emailErr)
      }
    }

    return c.json({ success: true, message: "Photographer approved" })
  } catch (err: any) {
    captureError(err, { context: "admin-approve-pg", targetClerkId })
    return c.json({ success: false, error: err.message || "Failed to approve" }, 500)
  }
})

/**
 * POST /api/admin/verifications/:targetClerkId/approve-mitra
 */
adminRouter.post("/verifications/:targetClerkId/approve-mitra", async (c) => {
  const targetClerkId = c.req.param("targetClerkId")
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

  try {
    let userEmail: string | undefined
    let userName: string | undefined

    await db.transaction(async (tx) => {
      // 1. Update status di database (mitra_profiles)
      const [mitra] = await tx
        .update(mitraProfiles)
        .set({
          verificationStatus: "verified",
          verifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(mitraProfiles.clerkId, targetClerkId))
        .returning()

      if (!mitra) throw new Error("Profil mitra tidak ditemukan")

      // 2. Update role di database (users)
      const [dbUser] = await tx.select().from(users).where(eq(users.clerkId, targetClerkId)).limit(1)
      const currentRoles = dbUser?.roles || []
      const newRoles = Array.from(new Set([...currentRoles, "mitra" as const]))

      await tx.update(users)
        .set({
          roles: newRoles,
          updatedAt: new Date()
        })
        .where(eq(users.clerkId, targetClerkId))

      // 3. Update Metadata di Clerk
      const clerkUser = await clerk.users.getUser(targetClerkId)
      userEmail = clerkUser.emailAddresses?.[0]?.emailAddress
      userName = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()

      const currentMetadata = clerkUser.publicMetadata || {}
      const existingRolesMetadata = getRolesFromMetadata(currentMetadata)
      const finalRolesMetadata = Array.from(new Set([...existingRolesMetadata, "mitra" as const]))

      await clerk.users.updateUserMetadata(targetClerkId, {
        publicMetadata: {
          ...currentMetadata,
          roles: finalRolesMetadata
        }
      })
    })

    // Send email notification outside transaction
    if (userEmail) {
      try {
        await sendEmail({
          to: userEmail,
          subject: "Pengajuan Kemitraan Disetujui!",
          html: `
            <div style="font-family: sans-serif; padding: 24px; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
              <h2 style="color: #059669; font-size: 24px; margin-bottom: 16px;">Selamat, ${userName || 'Rekan Mitra'}!</h2>
              <p style="font-size: 16px; line-height: 1.6;">Pengajuan Anda sebagai <strong>Mitra Agensi/Studio</strong> di Framic telah <strong>Disetujui</strong> oleh tim kami.</p>
              <p style="font-size: 16px; line-height: 1.6;">Sekarang agensi Anda sudah bisa login ke dashboard untuk mendaftarkan fotografer di bawah naungan agensi Anda serta mengelola orderan masuk.</p>
              <div style="margin: 24px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background-color: #059669; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);">Masuk ke Dashboard</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #64748b; line-height: 1.5;">Email ini dikirimkan secara otomatis oleh sistem Framic. Harap tidak membalas email ini secara langsung.</p>
            </div>
          `
        })
      } catch (emailErr) {
        console.error("Gagal mengirim email verifikasi mitra:", emailErr)
      }
    }

    return c.json({ success: true, message: "Mitra approved" })
  } catch (err: any) {
    captureError(err, { context: "admin-approve-mitra", targetClerkId })
    return c.json({ success: false, error: err.message || "Failed to approve" }, 500)
  }
})

/**
 * POST /api/admin/verifications/:targetClerkId/reject-photographer
 */
adminRouter.post("/verifications/:targetClerkId/reject-photographer", async (c) => {
  const targetClerkId = c.req.param("targetClerkId")
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

  try {
    const [pg] = await db
      .update(photographerProfiles)
      .set({
        verificationStatus: "rejected",
        updatedAt: new Date()
      })
      .where(eq(photographerProfiles.clerkId, targetClerkId))
      .returning()

    if (!pg) throw new Error("Profil fotografer tidak ditemukan")

    // Fetch user details for notification
    let userEmail: string | undefined
    let userName: string | undefined
    try {
      const clerkUser = await clerk.users.getUser(targetClerkId)
      userEmail = clerkUser.emailAddresses?.[0]?.emailAddress
      userName = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
    } catch (err) {
      console.error("Gagal mengambil data user Clerk untuk notifikasi:", err)
    }

    if (userEmail) {
      try {
        await sendEmail({
          to: userEmail,
          subject: "Update Status Pengajuan Fotografer",
          html: `
            <div style="font-family: sans-serif; padding: 24px; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
              <h2 style="color: #dc2626; font-size: 24px; margin-bottom: 16px;">Halo, ${userName || 'Rekan Framic'}</h2>
              <p style="font-size: 16px; line-height: 1.6;">Terima kasih atas minat Anda untuk bergabung bersama kami.</p>
              <p style="font-size: 16px; line-height: 1.6;">Mohon maaf, saat ini pengajuan verifikasi Anda sebagai <strong>Fotografer</strong> di Framic <strong>belum dapat kami setujui</strong> karena dokumen atau portfolio yang dilampirkan belum memenuhi kriteria standardisasi platform kami.</p>
              <p style="font-size: 16px; line-height: 1.6;">Anda dipersilakan untuk mengajukan ulang dengan memperbarui data atau melampirkan portofolio alternatif di halaman onboarding.</p>
              <div style="margin: 24px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://framic.id'}/onboarding" style="display: inline-block; background-color: #dc2626; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);">Ajukan Ulang Sekarang</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #64748b; line-height: 1.5;">Email ini dikirimkan secara otomatis oleh sistem Framic. Harap tidak membalas email ini secara langsung.</p>
            </div>
          `
        })
      } catch (emailErr) {
        console.error("Gagal mengirim email penolakan fotografer:", emailErr)
      }
    }

    return c.json({ success: true, message: "Photographer rejected" })
  } catch (err: any) {
    captureError(err, { context: "admin-reject-pg", targetClerkId })
    return c.json({ success: false, error: err.message || "Failed to reject" }, 500)
  }
})

/**
 * POST /api/admin/verifications/:targetClerkId/reject-mitra
 */
adminRouter.post("/verifications/:targetClerkId/reject-mitra", async (c) => {
  const targetClerkId = c.req.param("targetClerkId")
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

  try {
    const [mitra] = await db
      .update(mitraProfiles)
      .set({
        verificationStatus: "rejected",
        updatedAt: new Date()
      })
      .where(eq(mitraProfiles.clerkId, targetClerkId))
      .returning()

    if (!mitra) throw new Error("Profil mitra tidak ditemukan")

    // Fetch user details for notification
    let userEmail: string | undefined
    let userName: string | undefined
    try {
      const clerkUser = await clerk.users.getUser(targetClerkId)
      userEmail = clerkUser.emailAddresses?.[0]?.emailAddress
      userName = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
    } catch (err) {
      console.error("Gagal mengambil data user Clerk untuk notifikasi:", err)
    }

    if (userEmail) {
      try {
        await sendEmail({
          to: userEmail,
          subject: "Update Status Pengajuan Kemitraan",
          html: `
            <div style="font-family: sans-serif; padding: 24px; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
              <h2 style="color: #dc2626; font-size: 24px; margin-bottom: 16px;">Halo, ${userName || 'Rekan Mitra'}</h2>
              <p style="font-size: 16px; line-height: 1.6;">Terima kasih atas minat agensi Anda untuk bermitra bersama kami.</p>
              <p style="font-size: 16px; line-height: 1.6;">Mohon maaf, saat ini pengajuan verifikasi kemitraan Anda sebagai <strong>Mitra Agensi/Studio</strong> di Framic <strong>belum dapat kami setujui</strong> karena dokumen atau legalitas yang dilampirkan belum lolos verifikasi internal kami.</p>
              <p style="font-size: 16px; line-height: 1.6;">Anda dipersilakan untuk mengajukan ulang dengan memperbarui data legalitas di halaman onboarding.</p>
              <div style="margin: 24px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://framic.id'}/onboarding" style="display: inline-block; background-color: #dc2626; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);">Ajukan Ulang Sekarang</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #64748b; line-height: 1.5;">Email ini dikirimkan secara otomatis oleh sistem Framic. Harap tidak membalas email ini secara langsung.</p>
            </div>
          `
        })
      } catch (emailErr) {
        console.error("Gagal mengirim email penolakan mitra:", emailErr)
      }
    }

    return c.json({ success: true, message: "Mitra rejected" })
  } catch (err: any) {
    captureError(err, { context: "admin-reject-mitra", targetClerkId })
    return c.json({ success: false, error: err.message || "Failed to reject" }, 500)
  }
})

export { adminRouter }
