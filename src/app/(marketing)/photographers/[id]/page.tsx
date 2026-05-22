import { CalendarView } from "@/components/features/calendar/calendar-view"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MapPin, Camera, CheckCircle, ShieldCheck, Instagram, Globe, Clock, Users } from "lucide-react"
import { BookingButton } from "@/components/features/booking/booking-button"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"
import { getBaseUrl } from "@/lib/api-url"

import { PortfolioGallery } from "@/components/features/portfolio/portfolio-gallery"

async function getPhotographerDetail(id: string) {
  const res = await fetch(`${getBaseUrl()}/api/photographers/${id}`, {
    cache: 'no-store'
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.success ? json.data : null
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

  const reviews = pg.recentReviews || []

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 md:py-16 flex flex-col gap-12">
      {/* Top Profile Header */}
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="w-full lg:w-[360px] flex-shrink-0">
          <Card className="overflow-hidden border-border/50 shadow-xl rounded-[2rem]">
            <div className="aspect-[3/4] relative bg-slate-100">
              {pg.avatarUrl ? (
                <img src={pg.avatarUrl} alt={pg.nama} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Camera className="w-20 h-20" />
                </div>
              )}
              {pg.verificationStatus === 'verified' && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              )}
            </div>
            <CardContent className="p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{pg.nama}</h1>
                <div className="flex items-center gap-2 text-primary">
                  <Star className="w-4 h-4 fill-primary" />
                  <span className="font-bold text-lg">{pg.ratingAverage || '0.0'}</span>
                  <span className="text-muted-foreground text-sm font-normal">({pg.ratingCount} Ulasan)</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{pg.kotaDomisili}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pg.kategori?.map((cat: string) => (
                    <span key={cat} className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
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
            <h2 className="text-3xl font-bold tracking-tight">Tentang Fotografer</h2>
            <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
              {pg.bio || "Fotografer ini belum menuliskan bio mereka."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-8 mt-4 items-start">
            {/* Packages Section */}
            <div className="flex flex-col gap-6 h-full">
              <h2 className="text-2xl font-bold tracking-tight">Paket Layanan</h2>
              <div className="relative">
                <div className="flex flex-col gap-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar pb-6">
                  {pg.packages?.length > 0 ? (
                    pg.packages.map((pkg: any) => (
                      <Card key={pkg.id} className="border-border/60 hover:border-primary/50 transition-colors bg-slate-50/30 flex-shrink-0">
                        <CardContent className="py-3 px-6 flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <h3 className="font-bold text-lg leading-tight text-slate-900">{pkg.namaPaket}</h3>
                            <div className="text-primary font-black text-xl tracking-tight whitespace-nowrap bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
                              Rp {pkg.harga.toLocaleString('id-ID')}
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2 pr-4">{pkg.deskripsi}</p>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {
                              pkg.includesEditing && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                  <span>Termasuk Foto Edit</span>
                                </div>
                              )
                            }
                            <div className="flex items-center gap-2">
                              <Users size={12} className="text-primary" />
                              <span>{pkg.bookingCount || 0} Terjual</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-sm border-2 border-dashed rounded-2xl bg-slate-50/50">
                      Belum ada paket layanan yang didaftarkan fotografer.
                    </div>
                  )}
                </div>
                {/* Fade effect at bottom if scrollable */}
                {pg.packages?.length > 2 && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
                )}
              </div>
            </div>

            {/* Calendar Section */}
            <div className="flex flex-col gap-6 h-full">
              <h2 className="text-2xl font-bold tracking-tight">Cek Jadwal</h2>
              <div className="bg-white rounded-[2rem] border border-border/50 shadow-sm p-2">
                <CalendarView photographerId={pgId} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold tracking-tight">Portfolio</h2>
            <PortfolioGallery urls={pg.portfolioUrls || []} />
          </div>

          {/* Reviews Section */}
          <div className="flex flex-col gap-6 mt-6">
            <h2 className="text-2xl font-bold tracking-tight">Apa Kata Kustomer ({pg.ratingCount})</h2>
            <div className="flex flex-col gap-6">
              {reviews.length > 0 ? (
                reviews.map((rev: any, i: number) => (
                  <div key={i} className="flex flex-col gap-3 pb-6 border-b border-slate-100 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black text-sm uppercase tracking-widest overflow-hidden">
                          {rev.customerAvatarUrl ? (
                            <img src={rev.customerAvatarUrl} alt={rev.customerName} className="w-full h-full object-cover" />
                          ) : (
                            (rev.customerName || "C").slice(0, 1)
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">
                            {(() => {
                              const name = rev.customerName || "Customer"
                              if (name.length <= 2) return name + "*"
                              return name.slice(0, 2) + "****" + name.slice(-1)
                            })()}
                          </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className={cn("w-3 h-3", j < rev.rating ? "fill-primary text-primary" : "text-slate-200")} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm">"{rev.komentar || "Tidak ada komentar."}"</p>
                  </div>
                ))
              ) : (
                <div className="py-12 bg-slate-50/50 rounded-2xl border flex items-center justify-center text-muted-foreground text-sm text-center">
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

