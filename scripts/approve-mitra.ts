import { db } from "@/db"
import { mitraProfiles, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { clerkClient } from "@clerk/nextjs/server"

/**
 * Script untuk menyetujui (approve) pendaftaran mitra secara manual.
 * Penggunaan: npm run approve:mitra -- [clerk_id]
 */
async function approveMitra() {
  const clerkId = process.argv[2]
  if (!clerkId) {
    console.error("Kesalahan: Harap sertakan clerk_id sebagai argumen.")
    process.exit(1)
  }

  console.log(`⏳ Memproses approve mitra untuk: ${clerkId}...`)

  try {
    // 1. Update status di database (mitra_profiles)
    const [mitra] = await db
      .update(mitraProfiles)
      .set({
        verificationStatus: "verified",
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mitraProfiles.clerkId, clerkId))
      .returning()

    if (!mitra) {
      console.error("❌ Eror: Profil mitra tidak ditemukan di database.")
      process.exit(1)
    }

    // 2. Update role di database (users)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1)

    if (user) {
      const currentRoles = user.roles || []
      if (!currentRoles.includes("mitra")) {
        await db
          .update(users)
          .set({
            roles: [...currentRoles, "mitra"],
            updatedAt: new Date()
          })
          .where(eq(users.clerkId, clerkId))
      }
    }

    // 3. Update Metadata di Clerk
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(clerkId)
    const currentMetadata = clerkUser.publicMetadata || {}
    const currentRolesMetadata = (currentMetadata.roles as string[]) || ["customer"]
    
    if (!currentRolesMetadata.includes("mitra")) {
      await clerk.users.updateUser(clerkId, {
        publicMetadata: {
          ...currentMetadata,
          roles: [...currentRolesMetadata, "mitra"]
        }
      })
    }

    console.log("✅ BERHASIL! User sekarang resmi menjadi mitra (Verified).")
    process.exit(0)
  } catch (error) {
    console.error("❌ Terjadi kesalahan fatal:", error)
    process.exit(1)
  }
}

approveMitra()
