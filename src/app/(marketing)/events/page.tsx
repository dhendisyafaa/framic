import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users } from "lucide-react"
import Link from "next/link"
import { db } from "@/db"
import { events, eventPhotographers } from "@/db/schema"
import { and, eq, sql, gte, desc, inArray } from "drizzle-orm"
import { EventList } from "@/components/features/event/event-list"

async function getEvents(openOnly: boolean) {
  const now = new Date()

  const conditions = [
    eq(events.isPublished, true),
    gte(events.tanggalSelesai, now)
  ]

  if (openOnly) {
    conditions.push(eq(events.isOpenRecruitment, true))
    conditions.push(gte(events.deadlineRequest, now))
  }

  // Count total items
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(${events.id}) as int)` })
    .from(events)
    .where(and(...conditions))

  const query = db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(desc(events.tanggalMulai))
    .limit(12)

  const eventList = await query

  // Slot terisi (untuk info recruitment jika ada)
  const eventIds = eventList.map((e) => e.id)
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

  return {
    data: eventList.map(e => ({
      ...e,
      slotTerisi: pgCounts[e.id] || 0
    })),
    meta: {
      total: count,
      page: 1,
      limit: 12,
      totalPages: Math.ceil(count / 12) || 1,
    }
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ openOnly?: string }>
}) {
  const { openOnly } = await searchParams
  const isOpenOnly = openOnly === "true"
  const { data: eventsData, meta } = await getEvents(isOpenOnly)

  return (
    <div className="container mx-auto px-4 md:px-8 py-12 md:py-20 flex flex-col gap-12">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-muted pb-12">
        <div className="space-y-4 max-w-2xl">
          <Badge className="bg-accent/10 text-accent border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest mb-2 shadow-sm">
            Event Explorer
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
            Galeri Kolaborasi <span className="text-primary">&</span> Agenda Event
          </h1>
          <p className="text-lg text-muted-foreground font-medium leading-relaxed">
            Temukan berbagai event menarik dari mitra kami. Anda juga bisa mencari lowongan photographer untuk bergabung dalam tim event.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href={isOpenOnly ? "/events" : "/events?openOnly=true"}>
            <Button
              variant={isOpenOnly ? "default" : "outline"}
              size="lg"
              className={`rounded-2xl font-black gap-2 h-14 px-8 border-2 ${isOpenOnly ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary' : 'border-muted text-foreground hover:bg-muted/50 hover:border-muted'}`}
            >
              <Users className="w-5 h-5" />
              {isOpenOnly ? "Menampilkan Open Recruitment" : "Cari Lowongan Fotografer"}
            </Button>
          </Link>
          <Link href="/mitra">
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl font-black gap-2 h-14 px-8 border-2 border-muted text-foreground hover:bg-muted/50 hover:border-muted/80"
            >
              Daftar Mitra
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid Events */}
      <EventList initialEvents={eventsData} initialMeta={meta} />
    </div>
  )
}
