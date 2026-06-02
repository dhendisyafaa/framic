import { redirect } from "next/navigation"
import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { and, eq, inArray, or, sql, desc } from "drizzle-orm"

import { db } from "@/db"
import {
  photographerProfiles,
  mitraProfiles,
  users,
  mitraPhotographers,
  eventPhotographers,
  events,
  payments,
  orders,
} from "@/db/schema"
import { getRolesFromMetadata, isPhotographer, isMitra, isAdmin } from "@/lib/clerk"

import { CustomerDashboard } from "@/components/features/dashboard/customer-dashboard"
import { PhotographerDashboard } from "@/components/features/dashboard/photographer-dashboard"
import { MitraDashboard } from "@/components/features/dashboard/mitra-dashboard"
import { SuspendedDashboard } from "@/components/features/dashboard/suspended-dashboard"
import { AdminDashboard } from "@/components/features/dashboard/admin-dashboard"

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

  // 1. Admin Dashboard (Highest Priority)
  if (isAdmin(roles)) {
    const [pgCountRes, mitraCountRes, revenueRes] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(photographerProfiles)
        .where(eq(photographerProfiles.verificationStatus, "verified"))
        .then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(mitraProfiles)
        .where(eq(mitraProfiles.verificationStatus, "verified"))
        .then(r => r[0]?.count || 0),
      db.select({ sum: sql<number>`cast(sum(${orders.totalHarga}) as int)` })
        .from(orders)
        .where(inArray(orders.status, ["completed", "delivered", "confirmed"]))
        .then(r => r[0]?.sum || 0)
    ])

    return (
      <AdminDashboard
        stats={{
          totalPhotographers: pgCountRes,
          totalMitras: mitraCountRes,
          totalRevenue: revenueRes,
        }}
      />
    )
  }

  // 2. Mitra (Hanya jika tidak disuspend)
  if (isMitra(roles) && !isMitraSuspended && mitra) {
    // Fetch stats secara paralel di server untuk meminimalkan load client-side
    const [fixedCountResult, perEventCountResult, earningsResult, topPerformersData] = await Promise.all([
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(mitraPhotographers)
        .where(
          and(
            eq(mitraPhotographers.mitraId, mitra.id),
            inArray(mitraPhotographers.contractStatus, ["active", "pending_expiry"])
          )
        )
        .then(r => r[0]?.count || 0),
      db
        .select({ count: sql<number>`cast(count(distinct ${eventPhotographers.photographerId}) as int)` })
        .from(eventPhotographers)
        .innerJoin(events, eq(eventPhotographers.eventId, events.id))
        .where(
          and(
            eq(events.mitraId, mitra.id),
            eq(eventPhotographers.photographerType, "event_only"),
            eq(eventPhotographers.invitationStatus, "accepted")
          )
        )
        .then(r => r[0]?.count || 0),
      db
        .select({ sum: sql<number>`cast(sum(${orders.totalHarga}) as int)` })
        .from(orders)
        .innerJoin(events, eq(orders.eventId, events.id))
        .where(
          and(
            eq(events.mitraId, mitra.id),
            or(
              eq(orders.status, "completed"),
              eq(orders.status, "ongoing"),
              eq(orders.status, "delivered"),
              eq(orders.status, "confirmed")
            )
          )
        )
        .then(r => r[0]?.sum || 0),
      db
        .select({
          id: photographerProfiles.id,
          clerkId: photographerProfiles.clerkId,
          ratingAverage: photographerProfiles.ratingAverage,
        })
        .from(photographerProfiles)
        .innerJoin(
          mitraPhotographers,
          and(
            eq(mitraPhotographers.photographerId, photographerProfiles.id),
            eq(mitraPhotographers.mitraId, mitra.id),
            inArray(mitraPhotographers.contractStatus, ["active", "pending_expiry"])
          )
        )
        .orderBy(desc(photographerProfiles.ratingAverage))
        .limit(3)
    ])

    // Fetch detail dari Clerk untuk top performers
    const performerClerkIds = topPerformersData.map(p => p.clerkId)
    let clerkUserMap: Record<string, { nama: string; avatarUrl: string }> = {}

    try {
      const clerk = await clerkClient()
      const clerkUsers = performerClerkIds.length > 0
        ? await clerk.users.getUserList({ userId: performerClerkIds })
        : { data: [] }

      clerkUserMap = Object.fromEntries(
        clerkUsers.data.map(u => [
          u.id,
          {
            nama: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Fotografer",
            avatarUrl: u.imageUrl,
          }
        ])
      )
    } catch (err) {
      console.error("Failed to fetch top performers info from Clerk:", err)
    }

    const topPerformers = topPerformersData.map(p => ({
      id: p.id,
      nama: clerkUserMap[p.clerkId]?.nama || "Fotografer",
      ratingAverage: p.ratingAverage,
      avatarUrl: clerkUserMap[p.clerkId]?.avatarUrl,
    }))

    const initialStats = {
      fixedMembersCount: fixedCountResult,
      perEventProCount: perEventCountResult,
      totalExpenditure: earningsResult,
      topPerformers,
    }

    return (
      <MitraDashboard
        clerkId={clerkUser.id}
        mitraId={mitra.id}
        initialStats={initialStats}
      />
    )
  }

  // 2. Photographer (Hanya jika tidak disuspend)
  if (isPhotographer(roles) && !isPgSuspended) {
    return <PhotographerDashboard clerkId={clerkUser.id} />
  }

  // 3. Fallback: Customer Dashboard
  return (
    <CustomerDashboard
      clerkId={clerkUser.id}
      isPhotographerSuspended={isPgSuspended}
      isMitraSuspended={isMitraSuspended}
    />
  )
}
