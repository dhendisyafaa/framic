import { db } from "@/db"
import { mitraProfiles, events, eventPhotographers } from "@/db/schema"
import { eq, and, desc, inArray, sql } from "drizzle-orm"
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
  BuildingIcon,
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

  return {
    mitra,
    events: mitraEvents.map((e) => ({
      ...e,
      slotTerisi: pgCounts[e.id] || 0,
    })),
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

  const { mitra, events: mitraEvents } = data

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 md:py-16 animate-in fade-in duration-700">
      <Link
        href="/mitra"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm mb-10 group"
      >
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Daftar Mitra
      </Link>

      {/* Profil Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-100 rounded-[2.5rem] overflow-hidden shrink-0 border-4 border-white shadow-xl">
              {mitra.coverImageUrl ? (
                <Image
                  src={mitra.coverImageUrl}
                  alt={mitra.namaOrganisasi}
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <BuildingIcon size={60} />
                </div>
              )}
            </div>
            <div className="space-y-4 pt-4">
              <Badge className="bg-indigo-50/80 text-indigo-700 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm">
                {mitra.tipeMitra?.replace("_", " ")}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight italic">
                {mitra.namaOrganisasi}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-slate-500 font-bold text-sm">
                <span className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-rose-500" /> {mitra.lokasi || "Lokasi tidak disebutkan"}
                </span>
                {mitra.websiteUrl && (
                  <a
                    href={mitra.websiteUrl}
                    target="_blank"
                    className="flex items-center gap-2 hover:text-indigo-600 transition-colors underline decoration-2 underline-offset-4"
                  >
                    <GlobeIcon className="w-4 h-4 text-indigo-500" /> Kunjungi Website
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50">
            <h2 className="text-xl font-black text-slate-900 mb-4 italic">Tentang Mitra</h2>
            <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
              {mitra.bio || "Belum ada informasi tambahan mengenai mitra ini."}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-indigo-100/50 rounded-[2.5rem] bg-indigo-900 text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BuildingIcon size={120} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Statistik Platform</p>
              <div className="text-5xl font-black tracking-tighter mb-2 italic">{mitraEvents.length}</div>
              <p className="text-sm font-bold text-indigo-100 opacity-80">Kolaborasi Event Berjalan</p>
              <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-900 bg-indigo-700 flex items-center justify-center text-[10px] font-black">
                      PG
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-black uppercase text-indigo-200">Tim Fotografer Aktif</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Daftar Event Mitra */}
      <section className="space-y-10">
        <div className="flex items-center justify-between border-b-4 border-slate-100 pb-6">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic flex items-center gap-3">
            <TentIcon className="w-8 h-8 text-indigo-600" />
            Agenda Event Mitra
          </h2>
          <Badge className="bg-slate-100 text-slate-600 border-none font-bold uppercase tracking-wider h-8">
            Total {mitraEvents.length}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {mitraEvents.length > 0 ? (
            mitraEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))
          ) : (
            <div className="col-span-full py-24 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
              <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium italic">Mitra belum mempublikasikan agenda event.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
