export const dynamic = "force-dynamic"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Users, Building, ShieldCheck, Clock, XCircle } from "lucide-react"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RequestEventButton } from "@/components/features/event/request-event-button"
import { currentUser } from "@clerk/nextjs/server"

import { db } from "@/db"
import { photographerProfiles, events, mitraProfiles, eventPhotographers, orders, payments } from "@/db/schema"
import { eq, and, or, sql } from "drizzle-orm"
import { clerkClient } from "@clerk/nextjs/server"

async function getEventDetail(id: string) {
  try {
    const [eventData] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.isPublished, true)))

    if (!eventData) return null

    const [mitraData] = await db
      .select({
        id: mitraProfiles.id,
        namaOrganisasi: mitraProfiles.namaOrganisasi,
        tipeMitra: mitraProfiles.tipeMitra,
        websiteUrl: mitraProfiles.websiteUrl,
      })
      .from(mitraProfiles)
      .where(eq(mitraProfiles.id, eventData.mitraId))

    const pgTersediaRows = await db
      .select({
        id: eventPhotographers.id,
        photographerType: eventPhotographers.photographerType,
        photographerId: photographerProfiles.id,
        clerkId: photographerProfiles.clerkId,
        username: photographerProfiles.username,
        bio: photographerProfiles.bio,
        ratingAverage: photographerProfiles.ratingAverage,
        invitationStatus: eventPhotographers.invitationStatus,
        initiatedBy: eventPhotographers.initiatedBy,
        isAvailable: eventPhotographers.isAvailable,
        orderId: orders.id,
        orderStatus: orders.status,
        paymentStatusDp: payments.statusDp,
        paymentStatusPelunasan: payments.statusPelunasan,
        photographerSignedAt: eventPhotographers.photographerSignedAt,
        mitraSignedAt: eventPhotographers.mitraSignedAt,
      })
      .from(eventPhotographers)
      .innerJoin(photographerProfiles, eq(photographerProfiles.id, eventPhotographers.photographerId))
      .leftJoin(
        orders,
        and(
          eq(orders.eventId, id),
          eq(orders.photographerId, photographerProfiles.id),
          sql`${orders.status} != 'cancelled'`
        )
      )
      .leftJoin(payments, eq(payments.orderId, orders.id))
      .where(
        and(
          eq(eventPhotographers.eventId, id),
          eq(eventPhotographers.isAvailable, true),
          or(
            eq(eventPhotographers.photographerType, "mitra_permanent"),
            and(
              eq(eventPhotographers.photographerType, "event_only"),
              eq(eventPhotographers.invitationStatus, "accepted")
            )
          )
        )
      )

    let clerkNamaMap: Record<string, string> = {}
    const pgClerkIds = pgTersediaRows.map((r) => r.clerkId)

    if (pgClerkIds.length > 0) {
      try {
        const clerk = await clerkClient()
        const userList = await clerk.users.getUserList({ userId: pgClerkIds })
        userList.data.forEach((u) => {
          clerkNamaMap[u.id] = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Fotografer"
        })
      } catch (clerkErr) {
        console.error("Failed to fetch photographer names from Clerk:", clerkErr)
      }
    }

    const pgTersedia = pgTersediaRows.map(row => ({
      ...row,
      nama: clerkNamaMap[row.clerkId] ?? "Fotografer",
    }))

    const slotTerisi = pgTersedia.filter(p => p.photographerType === "event_only" && p.invitationStatus === "accepted").length

    return {
      ...eventData,
      slotTerisi,
      mitra: mitraData,
      photographers: pgTersedia,
    }
  } catch (err) {
    console.error("Failed to query event detail:", err)
    return null
  }
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
  let pgProfileId: string | null = null

  if (user?.id) {
    const [pgProfile] = await db
      .select({ id: photographerProfiles.id })
      .from(photographerProfiles)
      .where(eq(photographerProfiles.clerkId, user.id))
      .limit(1)

    if (pgProfile) {
      isPhotographer = true
      pgProfileId = pgProfile.id
    }
  }

  let userRequestStatus: "pending" | "accepted" | "rejected" | "none" = "none"

  if (pgProfileId && event) {
    const [existingRequest] = await db
      .select({ invitationStatus: eventPhotographers.invitationStatus })
      .from(eventPhotographers)
      .where(
        and(
          eq(eventPhotographers.eventId, event.id),
          eq(eventPhotographers.photographerId, pgProfileId)
        )
      )
      .limit(1)

    if (existingRequest) {
      userRequestStatus = (existingRequest.invitationStatus || "pending") as any
    }
  }

  let isOwnEvent = false
  if (user?.id && event) {
    const [mitraProfile] = await db
      .select({ id: mitraProfiles.id })
      .from(mitraProfiles)
      .where(eq(mitraProfiles.clerkId, user.id))
      .limit(1)

    if (mitraProfile && event.mitraId === mitraProfile.id) {
      isOwnEvent = true
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

                  {isOwnEvent ? (
                    <Link href={`/dashboard/mitra/events/${event.id}`} className="w-full mt-2 block">
                      <Button className="w-full bg-[#CF4500] hover:bg-[#CF4500]/90 text-white font-black rounded-2xl h-12 shadow-md">
                        Kelola Event Ini
                      </Button>
                    </Link>
                  ) : isPhotographer ? (
                    (() => {
                      if (userRequestStatus === "accepted") {
                        return (
                          <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-xl text-sm border border-emerald-500/20 mt-2 font-bold flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Anda sudah terdaftar di event ini.
                          </div>
                        );
                      }

                      if (userRequestStatus === "pending") {
                        return (
                          <div className="bg-amber-500/10 text-amber-600 p-4 rounded-xl text-sm border border-amber-500/20 mt-2 font-bold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                            Pengajuan Anda sedang ditinjau mitra.
                          </div>
                        );
                      }

                      if (userRequestStatus === "rejected") {
                        return (
                          <div className="bg-rose-500/10 text-rose-600 p-4 rounded-xl text-sm border border-rose-500/20 mt-2 font-bold flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            Pengajuan Anda ditolak oleh mitra.
                          </div>
                        );
                      }

                      if (isExpired) {
                        return (
                          <div className="bg-rose-500/10 text-rose-600 p-4 rounded-xl text-sm border border-rose-500/20 mt-2 font-bold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-rose-600" />
                            Pendaftaran event telah ditutup.
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
                          {pg.photographerType === "mitra_permanent" ? "Fotografer Mitra" : "Fotografer Pilihan Mitra"}
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
