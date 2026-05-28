export const dynamic = "force-dynamic"

import { CalendarView } from "@/components/features/calendar/calendar-view"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MapPin, Camera, CheckCircle, ShieldCheck, Instagram, Globe, Clock, Users } from "lucide-react"
import { PortfolioGallery } from "@/components/features/portfolio/portfolio-gallery"
import { BookingButton } from "@/components/features/booking/booking-button"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"
import { db } from "@/db"
import { photographerProfiles, packages, reviews, orders } from "@/db/schema"
import { and, eq, sql } from "drizzle-orm"
import { clerkClient } from "@clerk/nextjs/server"

async function getPhotographerDetail(username: string) {
  try {
    const [profile] = await db
      .select()
      .from(photographerProfiles)
      .where(
        and(
          eq(photographerProfiles.username, username),
          eq(photographerProfiles.verificationStatus, "verified")
        )
      )
      .limit(1)

    if (!profile) return null

    const pgId = profile.id

    // Fetch user info from Clerk
    let nama = "Fotografer"
    let avatarUrl = ""
    try {
      const clerk = await clerkClient()
      const u = await clerk.users.getUser(profile.clerkId)
      nama = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Fotografer"
      avatarUrl = u.imageUrl
    } catch (err) {
      console.error("Failed to fetch photographer clerk info:", err)
    }

    // Fetch packages
    const pgPackages = await db
      .select({
        id: packages.id,
        namaPaket: packages.namaPaket,
        deskripsi: packages.deskripsi,
        harga: packages.harga,
        durasiJam: packages.durasiJam,
        jumlahFotoMin: packages.jumlahFotoMin,
        includesEditing: packages.includesEditing,
        kategori: packages.kategori,
        isActive: packages.isActive,
        bookingCount: sql<number>`cast(count(${orders.id}) as int)`
      })
      .from(packages)
      .leftJoin(orders, eq(orders.paketId, packages.id))
      .where(
        and(
          eq(packages.photographerId, pgId),
          eq(packages.isActive, true)
        )
      )
      .groupBy(packages.id)
      .orderBy(packages.harga)

    // Fetch reviews
    const pgReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.photographerId, pgId))
      .orderBy(sql`${reviews.createdAt} DESC`)
      .limit(5)

    // Enrich review customer names/avatars
    const enrichedReviews = await Promise.all(
      pgReviews.map(async (rev) => {
        let customerName = "Customer"
        let customerAvatarUrl = ""
        try {
          const clerk = await clerkClient()
          const u = await clerk.users.getUser(rev.customerClerkId)
          customerName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Customer"
          customerAvatarUrl = u.imageUrl
        } catch (err) {
          console.warn(`Failed to fetch review customer name for ${rev.customerClerkId}:`, err)
        }
        return {
          ...rev,
          customerName,
          customerAvatarUrl,
        }
      })
    )

    // Enforce public requirements (bio, username, package, and portfolio must exist)
    if (
      !profile.bio ||
      !profile.username ||
      !profile.portfolioUrls ||
      profile.portfolioUrls.length === 0 ||
      pgPackages.length === 0
    ) {
      return null
    }

    return {
      ...profile,
      nama,
      avatarUrl,
      packages: pgPackages,
      recentReviews: enrichedReviews,
    }
  } catch (err) {
    console.error("Failed to query photographer detail:", err)
    return null
  }
}

export default async function PhotographerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: pgId } = await params
  const pg = await getPhotographerDetail(pgId)

  if (!pg) {
    notFound()
  }

  const isProfileComplete = 
    pg.bio && 
    pg.username && 
    pg.packages && pg.packages.length > 0 && 
    pg.portfolioUrls && pg.portfolioUrls.length > 0

  if (!isProfileComplete) {
    notFound()
  }

  const reviews = pg.recentReviews || []

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 md:py-16 flex flex-col gap-12">
      {/* Top Profile Header */}
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="w-full lg:w-[360px] flex-shrink-0">
          <Card className="overflow-hidden border-border/50 shadow-xl rounded-[2rem] bg-card text-foreground">
            <div className="aspect-[3/4] relative bg-muted/30">
              {pg.avatarUrl ? (
                <img src={pg.avatarUrl} alt={pg.nama} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <Camera className="w-20 h-20" />
                </div>
              )}
              {pg.verificationStatus === 'verified' && (
                <div className="absolute top-4 right-4 bg-accent text-white p-2 rounded-full shadow-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              )}
            </div>
            <CardContent className="p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{pg.nama}</h1>
                <div className="flex items-center gap-2 text-accent">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="font-bold text-lg text-foreground">{pg.ratingAverage || '0.0'}</span>
                  <span className="text-muted-foreground text-sm font-normal">({pg.ratingCount} Ulasan)</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-muted-foreground/60" />
                  <span>{pg.kotaDomisili}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pg.kategori?.map((cat: string) => (
                    <span key={cat} className="px-3 py-1 rounded-full bg-muted text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <BookingButton photographer={pg} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Tentang Fotografer</h2>
            <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
              {pg.bio || "Fotografer ini belum menuliskan bio mereka."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-8 mt-4 items-start">
            {/* Packages Section */}
            <div className="flex flex-col gap-6 h-full">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Paket Layanan</h2>
              <div className="relative">
                <div className="flex flex-col gap-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar pb-6">
                  {pg.packages?.length > 0 ? (
                    pg.packages.map((pkg: any) => (
                      <Card key={pkg.id} className="border-border/60 hover:border-accent/50 transition-colors bg-card flex-shrink-0">
                        <CardContent className="py-3 px-6 flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <h3 className="font-bold text-lg leading-tight text-foreground">{pkg.namaPaket}</h3>
                            <div className="text-accent font-black text-xl tracking-tight whitespace-nowrap bg-accent/5 px-3 py-1 rounded-lg border border-accent/10">
                              Rp {pkg.harga.toLocaleString('id-ID')}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 pr-4">{pkg.deskripsi}</p>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {
                              pkg.includesEditing && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-3.5 h-3.5 text-accent" />
                                  <span className="text-muted-foreground">Termasuk Foto Edit</span>
                                </div>
                              )
                            }
                            <div className="flex items-center gap-2">
                              <Users size={12} className="text-accent" />
                              <span className="text-muted-foreground">{pkg.bookingCount || 0} Terjual</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm border-2 border-dashed rounded-2xl bg-muted/10 border-muted">
                      Belum ada paket layanan yang didaftarkan fotografer.
                    </div>
                  )}
                </div>
                {/* Fade effect at bottom if scrollable */}
                {pg.packages?.length > 2 && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                )}
              </div>
            </div>

            {/* Calendar Section */}
            <div className="flex flex-col gap-6 h-full">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Cek Jadwal</h2>
              <div className="bg-card rounded-[2rem] border border-border/50 shadow-sm p-2">
                <CalendarView photographerId={pg.id} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Portfolio</h2>
            <PortfolioGallery urls={pg.portfolioUrls || []} />
          </div>

          {/* Reviews Section */}
          <div className="flex flex-col gap-6 mt-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Apa Kata Kustomer ({pg.ratingCount})</h2>
            <div className="flex flex-col gap-6">
              {reviews.length > 0 ? (
                reviews.map((rev: any, i: number) => (
                  <div key={i} className="flex flex-col gap-3 pb-6 border-b border-muted last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black text-sm uppercase tracking-widest overflow-hidden">
                          {rev.customerAvatarUrl ? (
                            <img src={rev.customerAvatarUrl} alt={rev.customerName} className="w-full h-full object-cover" />
                          ) : (
                            (rev.customerName || "C").slice(0, 1)
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">
                            {(() => {
                              const name = rev.customerName || "Customer"
                              if (name.length <= 2) return name + "*"
                              return name.slice(0, 2) + "****" + name.slice(-1)
                            })()}
                          </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className={cn("w-3 h-3", j < rev.rating ? "fill-accent text-accent" : "text-muted")} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">"{rev.komentar || "Tidak ada komentar."}"</p>
                  </div>
                ))
              ) : (
                <div className="py-12 bg-muted/10 rounded-2xl border border-muted flex items-center justify-center text-muted-foreground text-sm text-center">
                  Belum ada ulasan untuk fotografer ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

