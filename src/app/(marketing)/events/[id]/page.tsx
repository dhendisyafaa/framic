import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Users, Building, ShieldCheck, Clock } from "lucide-react"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RequestEventButton } from "@/components/features/event/request-event-button"
import { currentUser } from "@clerk/nextjs/server"

async function getEventDetail(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/events/${id}`, {
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
  const isPhotographer = user?.publicMetadata?.role === "photographer"

  if (!event) {
    notFound()
  }

  const startDate = new Date(event.tanggalMulai)
  const isExpired = event.deadlineRequest ? new Date(event.deadlineRequest) < new Date() : false
  const slotsLeft = (event.kuotaPgPerEvent || 0) - (event.slotTerisi || 0)

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 md:py-16 flex flex-col gap-12">
      {/* Top Event Header */}
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <Card className="overflow-hidden border-border/50 shadow-xl rounded-[2rem]">
            <div className="aspect-[4/3] relative bg-slate-100">
              {event.coverImageUrl ? (
                <img src={event.coverImageUrl} alt={event.namaEvent} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
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
                <div className="flex flex-col gap-4 border-b border-border/50 pb-6">
                  <h3 className="font-bold text-slate-900 border-l-4 border-primary pl-3">Info Lowongan</h3>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400">Sisa Slot Posisi</span>
                      <span className="font-bold text-slate-900">{slotsLeft} Posisi</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400">Batas Pendaftaran</span>
                      <span className={`font-bold ${isExpired ? 'text-rose-500' : 'text-slate-900'}`}>
                        {event.deadlineRequest ? format(new Date(event.deadlineRequest), "d MMMM yyyy", { locale: idLocale }) : "-"}
                      </span>
                    </div>
                  </div>
                  
                  {isPhotographer ? (
                    <RequestEventButton eventId={event.id} isPhotographer={isPhotographer} className="w-full mt-2" />
                  ) : (
                    <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm border border-amber-200 mt-2 font-medium">
                      Anda harus login sebagai Fotografer untuk melamar event ini.
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-slate-900 border-l-4 border-primary pl-3">Profil Mitra</h3>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black">
                    {event.mitra?.namaOrganisasi?.charAt(0) || "M"}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{event.mitra?.namaOrganisasi || "Mitra Anonim"}</span>
                    <span className="text-xs text-slate-500 bg-slate-100 w-fit px-2 py-0.5 rounded-full mt-1">
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
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">{event.namaEvent}</h1>
            
            <div className="flex flex-wrap gap-4 text-sm font-medium mt-2">
              <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full">
                <Calendar className="w-4 h-4 text-slate-500" />
                {format(startDate, "d MMMM yyyy", { locale: idLocale })}
                {event.tanggalSelesai && ` - ${format(new Date(event.tanggalSelesai), "d MMMM yyyy", { locale: idLocale })}`}
              </div>
              <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full">
                <MapPin className="w-4 h-4 text-slate-500" />
                {event.lokasi || "Lokasi menyusul"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-4">Deskripsi Event</h2>
            <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg bg-slate-50 p-6 rounded-3xl border border-slate-100">
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
                  <Link href={`/photographers/${pg.photographerId}`} key={pg.id}>
                    <div className="flex items-center gap-4 bg-white border hover:border-primary/50 transition-colors p-4 rounded-2xl shadow-sm group">
                      <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{pg.nama}</span>
                        <span className="text-xs text-slate-500 font-medium tracking-wide">
                          {pg.photographerType === "mitra_permanent" ? "PG Tetap (Mitra)" : "PG Per-Event"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed">
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
