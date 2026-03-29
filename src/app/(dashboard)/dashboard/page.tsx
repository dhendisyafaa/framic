import { currentUser } from "@clerk/nextjs/server"
import { getRolesFromMetadata } from "@/lib/clerk"
import { CustomerDashboard } from "@/components/features/dashboard/customer-dashboard"
import { PhotographerDashboard } from "@/components/features/dashboard/photographer-dashboard"
import { MitraDashboard } from "@/components/features/dashboard/mitra-dashboard"
import { SuspendedDashboard } from "@/components/features/dashboard/suspended-dashboard"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { photographerProfiles, mitraProfiles, users } from "@/db/schema"
import { eq } from "drizzle-orm"

/**
 * Halaman Dashboard Utama.
 * Menentukan role user dan merender komponen yang sesuai.
 * Prioritas (Highest Role): Mitra > Photographer > Customer.
 */
export default async function DashboardPage() {
  const clerkUser = await currentUser()
  if (!clerkUser) redirect("/")

  // 1. Fetch data profil secara paralel untuk determinasi status
  const [dbUser, pg, mitra] = await Promise.all([
    db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1).then(r => r[0]),
    db.select().from(photographerProfiles).where(eq(photographerProfiles.clerkId, clerkUser.id)).limit(1).then(r => r[0]),
    db.select().from(mitraProfiles).where(eq(mitraProfiles.clerkId, clerkUser.id)).limit(1).then(r => r[0])
  ])

  // --- LOGIKA PEMBLOKIRAN ---

  // A. Jika akun dinonaktifkan secara global (Ban)
  if (dbUser && !dbUser.isActive) {
    return <SuspendedDashboard clerkId={clerkUser.id} />
  }

  const roles = getRolesFromMetadata(clerkUser.publicMetadata)
  const isPgSuspended = pg?.verificationStatus === "suspended"
  const isMitraSuspended = mitra?.verificationStatus === "suspended"

  // B. Tentukan Dashboard yang ditampilkan berdasarkan prioritas & status suspensi
  
  // 1. Mitra (Hanya jika tidak disuspend)
  if (roles.includes("mitra") && !isMitraSuspended && mitra) {
    return <MitraDashboard clerkId={clerkUser.id} mitraId={mitra.id} />
  }

  // 2. Photographer (Hanya jika tidak disuspend)
  if (roles.includes("photographer") && !isPgSuspended) {
    return <PhotographerDashboard clerkId={clerkUser.id} />
  }

  // 3. Fallback: Customer Dashboard
  // Kirim prop suspensi agar Customer Dashboard bisa menampilkan Banner Peringatan
  return (
    <CustomerDashboard 
      clerkId={clerkUser.id} 
      isPhotographerSuspended={isPgSuspended}
      isMitraSuspended={isMitraSuspended}
    />
  )
}
