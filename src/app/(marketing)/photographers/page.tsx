export const dynamic = "force-dynamic"

import { PhotographerCard } from "@/components/features/photographer/photographer-card"
import { PhotographerFilter } from "@/components/features/photographer/photographer-filter"
import { Camera } from "lucide-react"
import { db } from "@/db"
import { photographerProfiles, packages } from "@/db/schema"
import { and, eq, ilike, sql, isNotNull, exists, ne } from "drizzle-orm"
import { clerkClient } from "@clerk/nextjs/server"

async function getPhotographers(searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    const page = Number(searchParams.page) || 1
    const limit = Number(searchParams.limit) || 12
    const offset = (page - 1) * limit
    const kota = searchParams.kota as string | undefined
    const kategori = searchParams.kategori as string | undefined
    const minRating = searchParams.minRating ? Number(searchParams.minRating) : undefined
    const sortBy = (searchParams.sortBy as string) || "rating"

    const conditions = [
      eq(photographerProfiles.verificationStatus, "verified"),
      isNotNull(photographerProfiles.username),
      ne(photographerProfiles.username, ""),
      isNotNull(photographerProfiles.bio),
      ne(photographerProfiles.bio, ""),
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

    if (kota && kota !== "all") {
      conditions.push(ilike(photographerProfiles.kotaDomisili, `%${kota}%`))
    }
    if (kategori && kategori !== "all") {
      conditions.push(sql`${kategori} = ANY(${photographerProfiles.kategori})`)
    }
    if (minRating) {
      conditions.push(sql`${photographerProfiles.ratingAverage} >= ${minRating}`)
    }

    // Count total items
    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(${photographerProfiles.id}) as int)` })
      .from(photographerProfiles)
      .where(and(...conditions))

    // Determine sorting
    let orderBySql: ReturnType<typeof sql>
    switch (sortBy) {
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

    // Get data
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
      .limit(limit)
      .offset(offset)

    const clerkIds = rows.map((r) => r.clerkId)
    let clerkUsersMap: Record<string, { nama: string; avatarUrl: string }> = {}

    if (clerkIds.length > 0) {
      try {
        const clerk = await clerkClient()
        const userList = await clerk.users.getUserList({ userId: clerkIds })
        userList.data.forEach((u) => {
          clerkUsersMap[u.id] = {
            nama: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Fotografer",
            avatarUrl: u.imageUrl,
          }
        })
      } catch (clerkErr) {
        console.error("Failed to fetch photographer user list from Clerk:", clerkErr)
      }
    }

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

    return {
      data,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit) || 1,
      }
    }
  } catch (err) {
    console.error("Failed to query photographers list:", err)
    return { data: [], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } }
  }
}

export default async function PhotographersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const { data: photographers, meta } = await getPhotographers(resolvedParams)

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Katalog Fotografer</h1>
          <p className="text-muted-foreground max-w-2xl">
            Temukan dan pesan fotografer profesional sesuai dengan kebutuhan acara dan budget Anda.
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-10">
          {/* Sidebar Filter */}
          <aside className="w-full">
            <PhotographerFilter />
          </aside>

          {/* Grid Catalogue */}
          <main className="flex-1 flex flex-col gap-8">
            <div className="flex items-center justify-between bg-card border border-muted p-4 rounded-[20px] shadow-sm">
              <span className="text-sm font-medium text-foreground">
                Menampilkan <span className="font-bold">{photographers.length}</span> dari {meta.total} fotografer
              </span>
              <div className="hidden sm:block h-px flex-1 mx-4 bg-muted" />
            </div>

            {photographers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {photographers.map((pg: any) => (
                  <PhotographerCard key={pg.id} pg={pg} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-card border border-dashed border-muted rounded-[24px]">
                <div className="w-16 h-16 bg-card rounded-full border border-muted shadow-sm flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-1 max-w-xs">
                  <h3 className="font-medium text-lg">Tidak ada hasil</h3>
                  <p className="text-sm text-muted-foreground">
                    Maaf, tidak ada fotografer yang sesuai dengan kriteria filter Anda saat ini. Coba ubah filter atau reset.
                  </p>
                </div>
              </div>
            )}

            {/* Pagination Placeholder (Simple) */}
            {meta.totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <p className="text-xs text-muted-foreground">Fitur paginasi lengkap segera hadir di development berikutnya.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
