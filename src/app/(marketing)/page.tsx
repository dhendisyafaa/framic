export const dynamic = "force-dynamic"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Camera, CheckCircle, ShieldCheck, Instagram, ArrowRight } from "lucide-react"
import { PhotographerCard } from "@/components/features/photographer/photographer-card"
import { db } from "@/db"
import { photographerProfiles, packages } from "@/db/schema"
import { and, eq, sql, isNotNull, exists, ne, desc } from "drizzle-orm"
import { clerkClient } from "@clerk/nextjs/server"

async function getTopPhotographers() {
  try {
    const conditions = [
      eq(photographerProfiles.verificationStatus, "verified"),
      isNotNull(photographerProfiles.username),
      ne(photographerProfiles.username, ""),
      isNotNull(photographerProfiles.bio),
      ne(photographerProfiles.bio, ""),
      sql`cardinality(${photographerProfiles.portfolioUrls}) >= 1`,
      exists(
        db.select()
          .from(packages)
          .where(
            and(
              eq(packages.photographerId, photographerProfiles.id),
              eq(packages.isActive, true)
            )
          )
      )
    ]

    const rows = await db
      .select({
        id: photographerProfiles.id,
        username: photographerProfiles.username,
        clerkId: photographerProfiles.clerkId,
        bio: photographerProfiles.bio,
        kotaDomisili: photographerProfiles.kotaDomisili,
        kategori: photographerProfiles.kategori,
        ratingAverage: photographerProfiles.ratingAverage,
        ratingCount: photographerProfiles.ratingCount,
        isAcceptingOrders: photographerProfiles.isAcceptingOrders,
        portfolioUrls: photographerProfiles.portfolioUrls,
        packageStartingFrom: sql<number | null>`MIN(${packages.harga})`,
      })
      .from(photographerProfiles)
      .innerJoin(packages, eq(packages.photographerId, photographerProfiles.id))
      .where(and(...conditions))
      .groupBy(photographerProfiles.id)
      .orderBy(desc(photographerProfiles.ratingAverage))
      .limit(4)

    const clerkIds = rows.map((r) => r.clerkId)
    let clerkUsersMap: Record<string, { nama: string; avatarUrl: string }> = {}

    if (clerkIds.length > 0) {
      try {
        const clerk = await clerkClient()
        const userList = await clerk.users.getUserList({ userId: clerkIds })
        userList.data.forEach((u) => {
          clerkUsersMap[u.id] = {
            nama: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Fotografer",
            avatarUrl: u.imageUrl,
          }
        })
      } catch (clerkErr) {
        console.error("Failed to fetch landing page photographers Clerk info:", clerkErr)
      }
    }

    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      bio: r.bio,
      kotaDomisili: r.kotaDomisili,
      kategori: r.kategori,
      ratingAverage: r.ratingAverage,
      ratingCount: r.ratingCount,
      isAcceptingOrders: r.isAcceptingOrders,
      portfolioUrls: r.portfolioUrls,
      packageStartingFrom: r.packageStartingFrom,
      nama: clerkUsersMap[r.clerkId]?.nama || "User",
      avatarUrl: clerkUsersMap[r.clerkId]?.avatarUrl || "",
    }))
  } catch (err) {
    console.error("Failed to query top photographers:", err)
    return []
  }
}

export default async function LandingPage() {
  const photographers = await getTopPhotographers()

  return (
    <div className="flex flex-col gap-24 pb-28">
      <section className="relative w-full pt-12 md:pt-4 pb-6 md:pb-14 overflow-hidden bg-background">
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center">

            {/* Sisi Kiri: Editorial Text & CTAs */}
            <div className="flex flex-col items-start gap-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  #1 PLATFORM FOTOGRAFI INDONESIA
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.02em] text-foreground leading-[1.05]">
                  Abadikan Momen <br />
                  Terbaik Bersama <br />
                  <span className="relative">
                    Framic.
                  </span>
                </h1>
                <p className="text-base text-muted-foreground max-w-lg leading-relaxed mt-2 font-medium">
                  Temukan fotografer profesional dalam hitungan menit. Dari pernikahan, wisuda, hingga event bisnis, kami siap memotret kebahagiaan Anda.
                </p>
              </div>

              <Link href="/photographers" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 rounded-full font-bold shadow-md bg-primary hover:bg-primary/95 text-primary-foreground">
                  Cari Fotografer
                </Button>
              </Link>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-10 mt-6 pt-10 border-t border-muted/50 w-full">
                <div className="flex flex-col">
                  <span className="text-3xl font-medium text-foreground tracking-[-0.02em]">100+</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Fotografer Aktif</span>
                </div>
                <div className="h-8 w-px bg-muted" />
                <div className="flex flex-col">
                  <span className="text-3xl font-medium text-foreground tracking-[-0.02em]">10K+</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Momen Terabadikan</span>
                </div>
                <div className="h-8 w-px bg-muted" />
                <div className="flex flex-col">
                  <span className="text-3xl font-medium text-foreground tracking-[-0.02em] flex items-center gap-1">
                    4.9 <Star className="w-5 h-5 fill-accent text-accent" />
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">User Rating</span>
                </div>
              </div>
            </div>

            {/* Sisi Kanan: Stadium Media Frame */}
            <div className="relative animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              <div className="relative aspect-[4/3] w-full bg-[#141413] rounded-[40px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.08)] group">
                <img
                  src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000"
                  alt="Photography camera"
                  className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent flex flex-col justify-end p-8 md:p-10">
                  <p className="text-white text-2xl font-medium tracking-tight mb-4 max-w-md">
                    Merekam kenangan yang tidak akan pernah pudar.
                  </p>
                  <Link href="/onboarding" className="inline-flex items-center gap-2 text-white font-bold text-xs hover:underline mt-2">
                    Gabung sebagai fotografer atau mitra <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Featured Photographers Section (Circular portraits, satellite CTAs) */}
      <section className="container mx-auto px-6 md:px-12 flex flex-col gap-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-muted/50 pb-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">REKOMENDASI</span>
            </div>
            <h2 className="text-3xl font-medium tracking-[-0.02em] text-foreground">Fotografer Unggulan</h2>
            <p className="text-sm text-muted-foreground">Eksplorasi fotografer dengan penilaian terbaik di platform.</p>
          </div>
          <Link href="/photographers" className="cursor-pointer">
            <Button variant="outline" className="rounded-full px-6 text-xs font-bold hover:bg-muted/50 cursor-pointer">
              Lihat Semua &rarr;
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {photographers.length > 0 ? (
            photographers.map((pg: any) => (
              <PhotographerCard key={pg.id} pg={pg} />
            ))
          ) : (
            <div className="col-span-full py-16 text-center flex flex-col items-center gap-4 border border-dashed rounded-[32px] bg-card">
              <Camera className="w-10 h-10 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm font-medium">Belum ada fotografer unggulan yang tersedia.</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Onboarding Banner CTA Section (Lifted Cream, stadium corners) */}
      <section className="container mx-auto px-6 md:px-12">
        <div className="bg-card border border-muted rounded-[40px] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative shadow-[0_24px_48px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-4 relative z-10 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 justify-center md:justify-start">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">KEMITRAAN</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground leading-tight">
              Miliki Bakat Fotografi atau Organisasi?
            </h2>
            <p className="text-muted-foreground text-base">
              Bergabunglah sebagai Fotografer atau Mitra kami dan kembangkan potensi bisnis Anda bersama Framic.
            </p>
            <div className="flex flex-wrap gap-4 mt-2 justify-center md:justify-start">
              <Link href="/onboarding">
                <Button size="lg" className="rounded-full px-8 h-11 font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md">
                  Daftar Sekarang
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative z-10 hidden lg:block opacity-10">
            <Camera className="w-56 h-56 -rotate-12 text-foreground" />
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px]" />
        </div>
      </section>
    </div>
  )
}

