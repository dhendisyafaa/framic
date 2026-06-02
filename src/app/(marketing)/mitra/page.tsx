import { db } from "@/db"
import { mitraProfiles, events } from "@/db/schema"
import { eq, sql, inArray } from "drizzle-orm"
import { MitraList } from "@/components/features/mitra/mitra-list"

async function getVerifiedMitra() {
  try {
    // 1. Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(${mitraProfiles.id}) as int)` })
      .from(mitraProfiles)
      .where(eq(mitraProfiles.verificationStatus, "verified"))

    // 2. Fetch first page of mitra profiles (limit = 12)
    const rawMitra = await db
      .select({
        id: mitraProfiles.id,
        namaOrganisasi: mitraProfiles.namaOrganisasi,
        tipeMitra: mitraProfiles.tipeMitra,
        websiteUrl: mitraProfiles.websiteUrl,
        clerkId: mitraProfiles.clerkId,
      })
      .from(mitraProfiles)
      .where(eq(mitraProfiles.verificationStatus, "verified"))
      .limit(12)

    if (!rawMitra || rawMitra.length === 0) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 12, totalPages: 1 }
      }
    }

    const mitraIds = rawMitra.map((m) => m.id)
    const eventCounts: Record<string, number> = {}

    // 3. Fetch event counts
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

    const data = rawMitra.map((m) => ({
      ...m,
      totalEvent: eventCounts[m.id] || 0,
    }))

    return {
      data,
      meta: {
        total: count,
        page: 1,
        limit: 12,
        totalPages: Math.ceil(count / 12) || 1,
      }
    }
  } catch (err) {
    console.error("Error in getVerifiedMitra manual flow:", err)
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 12, totalPages: 1 }
    }
  }
}

export default async function MitraListPage() {
  const { data: mitraList, meta } = await getVerifiedMitra()

  return (
    <div className="container mx-auto px-4 md:px-8 py-12 md:py-20 text-foreground">
      <div className="max-w-3xl mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Partner Strategis Cerita Anda
        </h1>
        <p className="text-lg text-muted-foreground font-medium">
          Daftar Wedding Organizer, Event Planner, dan Agensi kreatif yang telah terverifikasi dan berkolaborasi resmi dengan Framic.
        </p>
      </div>

      <MitraList initialMitra={mitraList} initialMeta={meta} />
    </div>
  )
}
