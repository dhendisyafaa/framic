"use client"

// 1. React / Next.js
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// 2. Third-party libraries
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

// 3. Internal — db / lib
import { cn } from "@/lib/utils"

// 4. Internal — components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  UsersIcon,
  CalendarIcon,
  ChevronRightIcon,
  TentIcon,
  ClockIcon,
  PlusCircleIcon,
  LayoutDashboardIcon,
  TrendingUpIcon,
  AwardIcon,
  StarIcon,
  MapPinIcon,
  LogOutIcon,
  DollarSignIcon,
  UserPlusIcon,
  BriefcaseIcon,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types — strict, no any
// ---------------------------------------------------------------------------
interface MitraPhotographerEntry {
  contractId: string
  photographerId: string
  nama: string
  contractStatus: string | null
  invitationStatus: string
  tanggalMulai: string | null
  tanggalSelesai: string | null
  mitraPercent: number | null
  photographerPercent: number | null
  minimumFeePerEvent: number | null
}

interface MitraEventEntry {
  id: string
  namaEvent: string
  tanggalMulai: string
  tanggalSelesai: string
  lokasi: string
  isPublished: boolean
  coverImageUrl: string | null
}

interface MitraDashboardProps {
  clerkId: string
  mitraId: string
  initialStats: {
    fixedMembersCount: number
    perEventProCount: number
    totalEarnings: number
    topPerformers: Array<{
      id: string
      nama: string
      ratingAverage: number
      avatarUrl?: string
    }>
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MitraDashboard({ clerkId, mitraId, initialStats }: MitraDashboardProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Query 1 — Profil Mitra untuk mendapatkan nama organisasi
  const { data: mitraInfoResp } = useQuery({
    queryKey: ["mitra-profile", mitraId],
    queryFn: async () => {
      const res = await fetch(`/api/mitra/${mitraId}`)
      if (!res.ok) throw new Error("Gagal memuat profil mitra")
      return res.json() as Promise<{ success: boolean; data: { namaOrganisasi: string; tipeMitra: string; alamat: string } }>
    },
  })

  // Query 2 — Anggota tetap (untuk ringkasan list)
  const { data: photographersResp, isLoading: isLoadingPg } = useQuery({
    queryKey: ["mitra-photographers", mitraId],
    queryFn: async () => {
      const res = await fetch("/api/mitra/me/photographers")
      if (!res.ok) throw new Error("Gagal memuat data fotografer")
      return res.json() as Promise<{ success: boolean; data: MitraPhotographerEntry[] }>
    },
  })

  // Query 3 — List semua event milik mitra (termasuk draft)
  const { data: eventsResp, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["mitra-events", mitraId],
    queryFn: async () => {
      const res = await fetch(`/api/events?mitraId=${mitraId}&includeDrafts=true&limit=50`)
      if (!res.ok) throw new Error("Gagal memuat data event")
      return res.json() as Promise<{ success: boolean; data: MitraEventEntry[] }>
    },
  })

  const isLoading = isLoadingPg || isLoadingEvents

  if (isLoading) return <MitraDashboardSkeleton />

  const photographers = photographersResp?.data ?? []
  const allEvents = eventsResp?.data ?? []
  const studioName = mitraInfoResp?.data?.namaOrganisasi || "Partner Studio"

  // Derive status counts
  const eventPublished = allEvents.filter(e => e.isPublished).length
  const eventDraft = allEvents.filter(e => !e.isPublished).length
  const recentEvents = allEvents.slice(0, 3)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getDisplayDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d MMM yyyy", { locale: localeId })
    } catch {
      return "-"
    }
  }

  const navItems = [
    { label: "Ringkasan", icon: LayoutDashboardIcon, href: "/dashboard" },
    { label: "Kelola Event", icon: CalendarIcon, href: "/dashboard/mitra/events" },
    { label: "Kelola Fotografer", icon: UsersIcon, href: "/dashboard/mitra/photographers" },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Decorative background grid and circles matching mockup */}
      <div className="absolute -top-20 -left-20 w-[600px] h-[600px] border border-accent/5 rounded-full pointer-events-none opacity-20 dark:opacity-5 animate-pulse duration-[10s]" />
      <div className="absolute top-[40%] -right-40 w-[800px] h-[800px] border border-accent/5 rounded-full pointer-events-none opacity-10 dark:opacity-5" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-muted-foreground/5 whitespace-nowrap opacity-10 dark:opacity-5 pointer-events-none select-none text-9xl font-bold tracking-tighter uppercase">
        MOMENTS CAPTURED
      </div>

      <div className="flex flex-col md:flex-row gap-8 relative z-10">
        {/* Mobile Workspace Menu (Collapsible Accordion style) */}
        <div className="md:hidden w-full bg-card border border-border/60 rounded-[24px] p-4 shadow-sm relative z-20">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <LayoutDashboardIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-accent uppercase tracking-widest">Workspace Portal</p>
                <h4 className="text-sm font-bold text-foreground truncate max-w-[200px]">{studioName}</h4>
              </div>
            </div>
            <div className="p-1.5 hover:bg-muted rounded-full transition-colors duration-200">
              <ChevronRightIcon
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-300",
                  isMobileMenuOpen ? "rotate-90" : ""
                )}
              />
            </div>
          </button>

          {isMobileMenuOpen && (
            <div className="mt-4 pt-4 border-t border-border/40 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard")
                  return (
                    <Link href={item.href} key={item.label} className="w-full">
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 h-10",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </Button>
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Desktop Sidebar Panel */}
        <aside className="hidden md:flex w-64 shrink-0 bg-card border border-border/60 rounded-[32px] p-6 flex-col justify-between min-h-[480px] shadow-sm">
          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Workspace Portal</p>
              <h2 className="text-lg font-bold text-foreground truncate">{studioName}</h2>
            </div>

            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard")
                return (
                  <Link href={item.href} key={item.label} className="w-full">
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 h-11",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Dashboard Canvas */}
        <div className="flex-1 space-y-8">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Overview</p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Mitra Dashboard</h1>
            </div>
            <Link href="/dashboard/mitra/events">
              <Button className="rounded-full px-6 shadow-sm bg-primary hover:bg-accent text-primary-foreground hover:text-white gap-2 font-bold h-10 text-xs">
                <PlusCircleIcon className="w-4 h-4" />
                Kelola Event
              </Button>
            </Link>
          </div>

          {/* Bento Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Photographers Card */}
            <Card className="border-border/60 bg-card shadow-sm rounded-[32px] overflow-hidden group hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Fotografer</span>
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <UsersIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-bold text-foreground tracking-tight">
                    {initialStats.fixedMembersCount + initialStats.perEventProCount}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="rounded-full px-2 py-0 h-4 text-[9px] bg-primary/5 text-primary border-primary/20">
                        {initialStats.fixedMembersCount}
                      </Badge>{" "}
                      Tetap
                    </span>
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="rounded-full px-2 py-0 h-4 text-[9px] bg-accent/5 text-accent border-accent/20">
                        {initialStats.perEventProCount}
                      </Badge>{" "}
                      Event
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Earnings Card */}
            <Card className="border-border/60 bg-card shadow-sm rounded-[32px] overflow-hidden group hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Proyeksi Pendapatan</span>
                  <div className="p-2 bg-accent/10 text-accent rounded-xl">
                    <TrendingUpIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-bold text-foreground tracking-tight truncate">
                    {formatCurrency(initialStats.totalEarnings)}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium mt-2">
                    Total bagi hasil komisi mitra terkonfirmasi
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Event Overview Card */}
            <Card className="border-border/60 bg-card shadow-sm rounded-[32px] overflow-hidden group hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Status Event</span>
                  <div className="p-2 bg-secondary text-secondary-foreground rounded-xl border border-border">
                    <TentIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-bold text-foreground tracking-tight">
                    {allEvents.length}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="rounded-full px-2 py-0 h-4 text-[9px] bg-primary/5 text-primary border-primary/20">
                        {eventPublished}
                      </Badge>{" "}
                      Published
                    </span>
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="rounded-full px-2 py-0 h-4 text-[9px] bg-muted text-muted-foreground border-border">
                        {eventDraft}
                      </Badge>{" "}
                      Draft
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Two-Column Bento Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Active Events & Recruitment */}
            <div className="lg:col-span-7 space-y-8">
              {/* Active Events Widget */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-foreground">Daftar Event Terkini</h3>
                  <Link href="/dashboard/mitra/events" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                    Lihat Semua <ChevronRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-4">
                  {allEvents.length === 0 ? (
                    <div className="bg-card rounded-[32px] p-8 border border-border/60 border-dashed text-center flex flex-col items-center justify-center min-h-[200px]">
                      <CalendarIcon className="w-8 h-8 text-muted-foreground/30 mb-3" />
                      <p className="text-xs text-muted-foreground font-medium">Belum ada event yang terdaftar.</p>
                      <Link href="/dashboard/mitra/events?create=true" className="mt-4">
                        <Button variant="outline" size="sm" className="rounded-full font-bold text-xs h-9 border-border/60 hover:bg-muted/40">
                          Buat Event Pertama
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 rounded-[24px] bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-[16px] bg-muted overflow-hidden flex items-center justify-center shrink-0 border border-border/40 relative">
                            {event.coverImageUrl ? (
                              <img src={event.coverImageUrl} alt={event.namaEvent} className="w-full h-full object-cover" />
                            ) : (
                              <TentIcon className="w-5 h-5 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-foreground text-xs truncate max-w-[200px] sm:max-w-[280px]">
                              {event.namaEvent}
                            </h4>
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3 text-accent shrink-0" />
                              <span className="truncate">{event.lokasi}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-bold text-foreground">{getDisplayDate(event.tanggalMulai)}</p>
                            <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Mulai Event</p>
                          </div>
                          <Link href={`/dashboard/mitra/events/${event.id}`}>
                            <Button className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer text-xs h-8 px-3.5">
                              Kelola <ChevronRightIcon className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Open Recruitment Action Card */}
              <Card className="border-border/60 bg-primary text-primary-foreground shadow-md rounded-[32px] overflow-hidden p-6 relative">
                {/* Visual decorative circles inside the recruitment card */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 border border-primary-foreground/10 rounded-full pointer-events-none" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-5 h-5 text-accent" />
                    <h3 className="text-base font-bold">Rekrutmen Terbuka</h3>
                  </div>
                  <p className="text-xs text-primary-foreground/80 leading-relaxed max-w-md">
                    Butuh lebih banyak fotografer untuk menyukseskan event Anda berikutnya? Publikasikan lowongan ke jaringan profesional terverifikasi kami sekarang.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link href="/dashboard/mitra/photographers" className="shrink-0">
                      <Button className="w-full sm:w-auto rounded-full bg-secondary hover:bg-accent text-secondary-foreground hover:text-white font-bold text-xs h-10 px-6 border-none">
                        Undang Fotografer
                      </Button>
                    </Link>
                    <Link href="/dashboard/mitra/events?create=true" className="shrink-0">
                      <Button variant="outline" className="w-full sm:w-auto rounded-full border-2 border-primary-foreground/20 hover:border-primary-foreground text-primary-foreground bg-transparent hover:bg-transparent font-bold text-xs h-10 px-6">
                        Buat Event Baru
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Top Performers & Fixed Members Summary */}
            <div className="lg:col-span-5 space-y-8">
              {/* Top Performers Widget */}
              <section>
                <h3 className="text-lg font-bold text-foreground mb-4">Fotografer Terpopuler</h3>
                <div className="bg-card rounded-[32px] border border-border/60 p-6 shadow-sm space-y-4">
                  {initialStats.topPerformers.length === 0 ? (
                    <div className="text-center py-8">
                      <AwardIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground font-medium">Belum ada fotografer terpopuler.</p>
                    </div>
                  ) : (
                    initialStats.topPerformers.map((perf, index) => (
                      <div key={perf.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 last:pb-0 first:pt-0">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                            {index + 1}
                          </div>
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-border/40 shrink-0 bg-muted flex items-center justify-center">
                            {perf.avatarUrl ? (
                              <img src={perf.avatarUrl} alt={perf.nama} className="w-full h-full object-cover" />
                            ) : (
                              <UsersIcon className="w-4 h-4 text-muted-foreground/40" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-xs">{perf.nama}</p>
                            <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Anggota Tetap</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                          <StarIcon className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{perf.ratingAverage.toFixed(1)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Fixed Members Mini-List */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-foreground">Anggota Tetap</h3>
                  <Link href="/dashboard/mitra/photographers" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                    Kelola <ChevronRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="bg-card rounded-[32px] border border-border/60 p-6 shadow-sm space-y-3">
                  {photographers.length === 0 ? (
                    <div className="text-center py-6">
                      <UsersIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground font-medium">Belum ada anggota tetap.</p>
                    </div>
                  ) : (
                    <>
                      {photographers.slice(0, 3).map((pg) => (
                        <div key={pg.contractId} className="flex items-center justify-between p-3 rounded-[16px] bg-background border border-border/40">
                          <div>
                            <div className="font-bold text-foreground text-xs">{pg.nama}</div>
                            {pg.tanggalSelesai && (
                              <div className="text-[9px] text-muted-foreground font-medium mt-0.5">
                                s.d. {getDisplayDate(pg.tanggalSelesai)}
                              </div>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full text-[9px] font-bold tracking-wider px-2 py-0.5 border shrink-0",
                              pg.contractStatus === "active"
                                ? "text-primary border-primary/20 bg-primary/5"
                                : pg.contractStatus === "pending_expiry"
                                  ? "text-accent border-accent/20 bg-accent/5"
                                  : "text-muted-foreground border-border bg-muted/50"
                            )}
                          >
                            {(pg.contractStatus || pg.invitationStatus).toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                      {photographers.length > 3 && (
                        <Link href="/dashboard/mitra/photographers" className="block text-center text-[10px] text-primary font-bold hover:underline pt-1">
                          +{photographers.length - 3} lainnya
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function MitraDashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-pulse">
      <div className="flex flex-col md:flex-row gap-8">
        <Skeleton className="w-full md:w-64 h-[480px] rounded-[32px] shrink-0" />
        <div className="flex-1 space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-[32px]" />
            <Skeleton className="h-32 rounded-[32px]" />
            <Skeleton className="h-32 rounded-[32px]" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              <Skeleton className="h-48 rounded-[32px]" />
              <Skeleton className="h-40 rounded-[32px]" />
            </div>
            <div className="lg:col-span-5 space-y-8">
              <Skeleton className="h-48 rounded-[32px]" />
              <Skeleton className="h-48 rounded-[32px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
