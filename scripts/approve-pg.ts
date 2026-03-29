import { db } from "@/db"
import { photographerProfiles, users } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { clerkClient } from "@clerk/nextjs/server"

/**
 * Script untuk menyetujui (approve) pendaftaran fotografer secara manual.
 * Penggunaan: npx tsx scripts/approve-pg.ts [clerk_id]
 */
async function approvePhotographer() {
  const clerkId = process.argv[2]
  if (!clerkId) {
    console.error("Kesalahan: Harap sertakan clerk_id sebagai argumen.")
    console.log("Contoh: npx tsx scripts/approve-pg.ts user_2tH...")
    process.exit(1)
  }

  console.log(`⏳ Memproses approve fotografer untuk: ${clerkId}...`)

  try {
    // 1. Update status di database (photographer_profiles)
    const [pg] = await db
      .update(photographerProfiles)
      .set({
        verificationStatus: "verified",
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(photographerProfiles.clerkId, clerkId))
      .returning()

    if (!pg) {
      console.error("❌ Eror: Profil fotografer tidak ditemukan di database.")
      process.exit(1)
    }

    // 2. Update role di database (users)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))

    if (user) {
      const currentRoles = user.roles || []
      if (!currentRoles.includes("photographer")) {
        await db
          .update(users)
          .set({
            roles: [...currentRoles, "photographer"],
            updatedAt: new Date()
          })
          .where(eq(users.clerkId, clerkId))
      }
    }

    // 3. Update Metadata di Clerk (PENTING untuk sinkronisasi role di UI)
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(clerkId)
    const currentMetadata = clerkUser.publicMetadata || {}
    const currentRolesMetadata = (currentMetadata.roles as string[]) || ["customer"]
    
    if (!currentRolesMetadata.includes("photographer")) {
      await clerk.users.updateUser(clerkId, {
        publicMetadata: {
          ...currentMetadata,
          roles: [...currentRolesMetadata, "photographer"]
        }
      })
    }

    console.log("✅ BERHASIL! User sekarang resmi menjadi fotografer (Verified).")
    console.log("Silakan logout dan login kembali di browser untuk merasakan perubahannya.")
    process.exit(0)
  } catch (error) {
    console.error("❌ Terjadi kesalahan fatal:", error)
    process.exit(1)
  }
}

approvePhotographer()
