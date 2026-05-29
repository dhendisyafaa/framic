import { EventCard } from "@/components/features/event/event-card"
import { Button } from "@/components/ui/button"
import { Calendar, Search, SlidersHorizontal, Users } from "lucide-react"
import Link from "next/link"
import { db } from "@/db"
import { events, eventPhotographers } from "@/db/schema"
import { and, eq, sql, gte, desc } from "drizzle-orm"

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

  const query = db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(desc(events.tanggalMulai))
    .limit(20)

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

  return eventList.map(e => ({
    ...e,
    slotTerisi: pgCounts[e.id] || 0
  }))
}

import { inArray } from "drizzle-orm"

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ openOnly?: string }>
}) {
  const { openOnly } = await searchParams
  const isOpenOnly = openOnly === "true"
  const eventsData = await getEvents(isOpenOnly)

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {eventsData.length > 0 ? (
          eventsData.map((ev: any) => (
            <EventCard
              key={ev.id}
              event={ev}
              showRecruitmentInfo={ev.isOpenRecruitment}
            />
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center gap-6 bg-muted/10 border-2 border-dashed border-muted rounded-[3rem]">
            <div className="w-20 h-20 bg-card rounded-3xl flex items-center justify-center shadow-sm">
              <Calendar className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-black text-xl mb-1">Event Tidak Ditemukan</p>
              <p className="text-muted-foreground font-medium">Coba ganti filter atau jelajahi mitra kami.</p>
            </div>
            {isOpenOnly && (
              <Link href="/events">
                <Button variant="link" className="text-accent hover:text-accent/90 font-black">
                  Lihat Semua Event
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import { Badge } from "@/components/ui/badge"
