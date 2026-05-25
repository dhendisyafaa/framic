import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Users, Building, ShieldCheck, Clock } from "lucide-react"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RequestEventButton } from "@/components/features/event/request-event-button"
import { currentUser } from "@clerk/nextjs/server"

import { db } from "@/db"
import { photographerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getBaseUrl } from "@/lib/api-url"

async function getEventDetail(id: string) {
  const res = await fetch(`${getBaseUrl()}/api/events/${id}`, {
    cache: 'no-store'
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.success ? json.data : null
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: eventId } = await params
  const event = await getEventDetail(eventId)
  const user = await currentUser()

  // Periksa role dari Clerk
  let isPhotographer = user?.publicMetadata?.role === "photographer"

  // Fallback: Periksa ke DB jika Clerk metadata belum terpasang
  if (!isPhotographer && user?.id) {
    const [pgProfile] = await db
      .select({ id: photographerProfiles.id })
      .from(photographerProfiles)
      .where(eq(photographerProfiles.clerkId, user.id))
      .limit(1)

    if (pgProfile) {
      isPhotographer = true
    }
  }

  if (!event) {
    notFound()
  }

  const startDate = new Date(event.tanggalMulai)
  const isExpired = event.deadlineRequest ? new Date(event.deadlineRequest) < new Date() : false
  const slotsLeft = (event.kuotaPgPerEvent || 0) - (event.slotTerisi || 0)

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 md:py-16 flex flex-col gap-12 text-foreground">
      {/* Top Event Header */}
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <Card className="overflow-hidden border-muted bg-card text-foreground shadow-sm rounded-[2rem]">
            <div className="aspect-[4/3] relative bg-muted">
              {event.coverImageUrl ? (
                <img src={event.coverImageUrl} alt={event.namaEvent} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <Calendar className="w-20 h-20" />
                </div>
              )}
              {event.isOpenRecruitment && (
                <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                  Open Recruitment
                </div>
              )}
            </div>

            <CardContent className="p-8 flex flex-col gap-6">
              {event.isOpenRecruitment && (
                <div className="flex flex-col gap-4 border-b border-muted pb-6">
                  <h3 className="font-bold text-foreground border-l-4 border-primary pl-3">Info Lowongan</h3>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-muted-foreground">Sisa Slot Posisi</span>
                      <span className="font-bold text-foreground">{slotsLeft} Posisi</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-muted-foreground">Batas Pendaftaran</span>
                      <span className={`font-bold ${isExpired ? 'text-rose-500' : 'text-foreground'}`}>
                        {event.deadlineRequest ? format(new Date(event.deadlineRequest), "d MMMM yyyy", { locale: idLocale }) : "-"}
                      </span>
                    </div>
                  </div>

                  {isPhotographer ? (
                    (() => {
                      // Cek apakah fotografer ini sudah ada di daftar pengisi acara (termasuk yang sudah accepted/mitra tetap)
                      const isAlreadyAssigned = event.photographers?.some(
                        (p: any) => p.clerkId === user?.id
                      );

                      if (isAlreadyAssigned) {
                        return (
                          <div className="bg-blue-500/10 text-blue-500 p-4 rounded-xl text-sm border border-blue-500/20 mt-2 font-bold flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                            Anda sudah terdaftar di event ini.
                          </div>
                        );
                      }

                      return <div className="w-full mt-2"><RequestEventButton eventId={event.id} isPhotographer={isPhotographer} /></div>;
                    })()
                  ) : (
                    <div className="bg-amber-500/10 text-amber-500 p-4 rounded-xl text-sm border border-amber-500/20 mt-2 font-medium">
                      Anda harus login sebagai Fotografer untuk melamar event ini.
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-foreground border-l-4 border-primary pl-3">Profil Mitra</h3>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-black">
                    {event.mitra?.namaOrganisasi?.charAt(0) || "M"}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{event.mitra?.namaOrganisasi || "Mitra Anonim"}</span>
                    <span className="text-xs text-muted-foreground bg-muted w-fit px-2 py-0.5 rounded-full mt-1">
                      {event.mitra?.tipeMitra || "Mitra"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Event Content */}
        <div className="flex-1 flex flex-col gap-8 w-full mt-2">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">{event.namaEvent}</h1>

            <div className="flex flex-wrap gap-4 text-sm font-medium mt-2">
              <div className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-full">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {format(startDate, "d MMMM yyyy", { locale: idLocale })}
                {event.tanggalSelesai && ` - ${format(new Date(event.tanggalSelesai), "d MMMM yyyy", { locale: idLocale })}`}
              </div>
              <div className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-full">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {event.lokasi || "Lokasi menyusul"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-4">Deskripsi Event</h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg bg-muted/10 p-6 rounded-3xl border border-muted">
              {event.deskripsi || "Belum ada deskripsi untuk event ini."}
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-6">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Tim Fotografer Bertugas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.photographers && event.photographers.length > 0 ? (
                event.photographers.map((pg: any) => (
                  <Link href={`/photographers/${pg.username || pg.photographerId}`} key={pg.id}>
                    <div className="flex items-center gap-4 bg-card border border-muted hover:border-accent transition-colors p-4 rounded-2xl shadow-sm group">
                      <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground group-hover:text-accent transition-colors">{pg.nama}</span>
                        <span className="text-xs text-muted-foreground font-medium tracking-wide">
                          {pg.photographerType === "mitra_permanent" ? "PG Tetap (Mitra)" : "PG Per-Event"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-muted">
                  Belum ada fotografer yang ditugaskan untuk event ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
