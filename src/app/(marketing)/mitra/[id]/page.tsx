export const dynamic = "force-dynamic"

import { db } from "@/db"
import { mitraProfiles, events, eventPhotographers, mitraPhotographers, photographerProfiles } from "@/db/schema"
import { eq, and, desc, inArray, sql } from "drizzle-orm"
import { clerkClient } from "@clerk/nextjs/server"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CalendarIcon,
  MapPinIcon,
  GlobeIcon,
  ArrowLeftIcon,
  TentIcon,
  UsersIcon,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { EventCard } from "@/components/features/event/event-card"

async function getMitraDetail(id: string) {
  const [mitra] = await db
    .select()
    .from(mitraProfiles)
    .where(and(eq(mitraProfiles.id, id), eq(mitraProfiles.verificationStatus, "verified")))
    .limit(1)

  if (!mitra) return null

  const mitraEvents = await db
    .select()
    .from(events)
    .where(eq(events.mitraId, id))
    .orderBy(desc(events.tanggalMulai))

  // Slot terisi
  const eventIds = mitraEvents.map((e) => e.id)
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

  // Get active photographers team
  const photographersTeam = await db
    .select({
      id: photographerProfiles.id,
      clerkId: photographerProfiles.clerkId,
      username: photographerProfiles.username,
    })
    .from(mitraPhotographers)
    .innerJoin(
      photographerProfiles,
      eq(mitraPhotographers.photographerId, photographerProfiles.id)
    )
    .where(
      and(
        eq(mitraPhotographers.mitraId, id),
        eq(mitraPhotographers.invitationStatus, "accepted"),
        inArray(mitraPhotographers.contractStatus, ["active", "pending_expiry"])
      )
    )

  let activePhotographers: { id: string; name: string; avatarUrl: string; initials: string }[] = []
  try {
    const clerk = await clerkClient()
    activePhotographers = await Promise.all(
      photographersTeam.map(async (p) => {
        let name = "Fotografer"
        let avatarUrl = ""
        try {
          const u = await clerk.users.getUser(p.clerkId)
          name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Fotografer"
          avatarUrl = u.imageUrl
        } catch (err) {
          console.error("Failed to fetch team member clerk info:", err)
        }

        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "PG"

        return {
          id: p.id,
          name,
          avatarUrl,
          initials,
        }
      })
    )
  } catch (err) {
    console.error("Failed to fetch clerk info for photographers:", err)
  }

  return {
    mitra,
    events: mitraEvents.map((e) => ({
      ...e,
      slotTerisi: pgCounts[e.id] || 0,
    })),
    photographers: activePhotographers,
  }
}

export default async function MitraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getMitraDetail(id)

  if (!data) notFound()

  const { mitra, events: mitraEvents, photographers } = data

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 md:py-16 animate-in fade-in duration-700">
      <Link
        href="/mitra"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent font-bold text-sm mb-10 group"
      >
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Daftar Mitra
      </Link>

      {/* Profil Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <Badge className="bg-accent/10 text-accent border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm">
              {mitra.tipeMitra?.replace("_", " ")}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
              {mitra.namaOrganisasi}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-bold text-sm">
              <span className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-accent" /> {mitra.alamat || "Lokasi tidak disebutkan"}
              </span>
              {mitra.websiteUrl && (
                <a
                  href={mitra.websiteUrl}
                  target="_blank"
                  className="flex items-center gap-2 hover:text-accent transition-colors underline decoration-2 underline-offset-4"
                >
                  <GlobeIcon className="w-4 h-4 text-accent" /> Kunjungi Website
                </a>
              )}
            </div>
          </div>

          <div className="bg-card p-8 rounded-[2.5rem] border border-muted shadow-sm">
            <h2 className="text-xl font-black text-foreground mb-4">Tentang Mitra</h2>
            <p className="text-muted-foreground font-medium leading-relaxed whitespace-pre-wrap">
              {"Belum ada informasi tambahan mengenai mitra ini."}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-accent text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TentIcon size={120} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-2">Statistik Platform</p>
              <div className="text-5xl font-black tracking-tighter mb-2">{mitraEvents.length}</div>
              <p className="text-sm font-bold text-white/95 opacity-90">Kolaborasi Event Berjalan</p>
              <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
                {photographers && photographers.length > 0 ? (
                  <>
                    <div className="flex -space-x-3">
                      {photographers.slice(0, 4).map((p) =>
                        p.avatarUrl ? (
                          <img
                            key={p.id}
                            src={p.avatarUrl}
                            alt={p.name}
                            className="w-8 h-8 rounded-full border-2 border-accent object-cover bg-white/20"
                          />
                        ) : (
                          <div
                            key={p.id}
                            className="w-8 h-8 rounded-full border-2 border-accent bg-accent-foreground/15 flex items-center justify-center text-[10px] font-black text-white"
                          >
                            {p.initials}
                          </div>
                        )
                      )}
                      {photographers.length > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-accent bg-accent-foreground/30 flex items-center justify-center text-[10px] font-black text-white">
                          +{photographers.length - 4}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-black uppercase text-white/70">
                      {photographers.length} Tim Fotografer Aktif
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full border-2 border-accent/40 bg-white/5 flex items-center justify-center text-[10px] font-black text-white/50">
                      0
                    </div>
                    <p className="text-[10px] font-black uppercase text-white/70">Belum Ada Fotografer</p>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Daftar Event Mitra */}
      <section className="space-y-10">
        <div className="flex items-center justify-between border-b-4 border-muted pb-6">
          <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <TentIcon className="w-8 h-8 text-accent" />
            Agenda Event Mitra
          </h2>
          <Badge className="bg-muted text-muted-foreground border-none font-bold uppercase tracking-wider h-8">
            Total {mitraEvents.length}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {mitraEvents.length > 0 ? (
            mitraEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))
          ) : (
            <div className="col-span-full py-24 text-center bg-muted/10 border-2 border-dashed border-muted rounded-[3rem]">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Mitra belum mempublikasikan agenda event.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
