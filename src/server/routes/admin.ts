import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { photographerProfiles, mitraProfiles, users } from "@/db/schema"
import { createClerkClient } from "@clerk/nextjs/server"
import { requireAuth } from "@/server/middleware/auth"
import { getRolesFromMetadata, isAdmin } from "@/lib/clerk"
import { captureError } from "@/lib/sentry"

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

function mapClerkUsers(clerkUsers) {
  const map = new Map()

  for (const user of clerkUsers.data) {
    const email = user.emailAddresses?.[0]?.emailAddress || null

    map.set(user.id, {
      name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email
    })
  }

  return map
}

function mergePhotographers(dbPhotographers, clerkMap) {
  return dbPhotographers.map(p => {
    const clerkData = clerkMap.get(p.clerkId)

    return {
      ...p,
      name: clerkData?.name || null,
      email: clerkData?.email || null
    }
  })
}

function mergeMitra(dbMitra, clerkMap) {
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

    let clerkUsers = { data: [], totalCount: 0 }

    if (allClerkIds.length > 0) {
      clerkUsers = await clerk.users.getUserList({
        userId: allClerkIds,
        limit: allClerkIds.length
      })
    }

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
    await db.transaction(async (tx) => {
      // Update DB Profile
      await tx
        .update(photographerProfiles)
        .set({ verificationStatus: "verified", updatedAt: new Date() })
        .where(eq(photographerProfiles.clerkId, targetClerkId))

      // Update DB User Roles
      const [dbUser] = await tx.select().from(users).where(eq(users.clerkId, targetClerkId)).limit(1)
      const dbRoles = Array.from(new Set([...(dbUser?.roles || []), "photographer" as const]))
      await tx.update(users).set({ roles: dbRoles }).where(eq(users.clerkId, targetClerkId))

      // Update Clerk Metadata
      const user = await clerk.users.getUser(targetClerkId)
      const currentRoles = getRolesFromMetadata(user.publicMetadata)
      const newRoles = Array.from(new Set([...currentRoles, "photographer"]))
      await clerk.users.updateUserMetadata(targetClerkId, { publicMetadata: { roles: newRoles } })
    })

    return c.json({ success: true, message: "Photographer approved" })
  } catch (err) {
    captureError(err, { context: "admin-approve-pg", targetClerkId })
    return c.json({ success: false, error: "Failed to approve" }, 500)
  }
})

/**
 * POST /api/admin/verifications/:targetClerkId/approve-mitra
 */
adminRouter.post("/verifications/:targetClerkId/approve-mitra", async (c) => {
  const targetClerkId = c.req.param("targetClerkId")
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

  try {
    await db.transaction(async (tx) => {
      // Update DB Profile
      await tx
        .update(mitraProfiles)
        .set({ verificationStatus: "verified", updatedAt: new Date() })
        .where(eq(mitraProfiles.clerkId, targetClerkId))

      // Update DB User Roles
      const [dbUser] = await tx.select().from(users).where(eq(users.clerkId, targetClerkId)).limit(1)
      const dbRoles = Array.from(new Set([...(dbUser?.roles || []), "mitra" as const]))
      await tx.update(users).set({ roles: dbRoles }).where(eq(users.clerkId, targetClerkId))

      // Update Clerk Metadata
      const user = await clerk.users.getUser(targetClerkId)
      const currentRoles = getRolesFromMetadata(user.publicMetadata)
      const newRoles = Array.from(new Set([...currentRoles, "mitra"]))
      await clerk.users.updateUserMetadata(targetClerkId, { publicMetadata: { roles: newRoles } })
    })

    return c.json({ success: true, message: "Mitra approved" })
  } catch (err) {
    captureError(err, { context: "admin-approve-mitra", targetClerkId })
    return c.json({ success: false, error: "Failed to approve" }, 500)
  }
})

export { adminRouter }
