"use client"

// 1. React / Next.js
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

// 2. Third-party libraries
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format, startOfMonth, getDaysInMonth } from "date-fns"
import { id as localeId } from "date-fns/locale"
import {
  CalendarIcon,
  CameraIcon,
  ClockIcon,
  BanknoteIcon,
  FilePenIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  TentIcon,
  Star,
  Sparkles,
  ArrowUpRight,
  User,
} from "lucide-react"

// 3. Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardSkeleton } from "./dashboard-skeleton"

// 4. Types
import { OrderWithPackage, PhotographerProfile, Review } from "@/types"

interface MitraInvitation {
  contractId: string
  namaMitra: string
  invitationMessage: string | null
  photographerPercent: number
  minimumFeePerEvent: number
  tanggalMulai: string
  tanggalSelesai: string
}

interface EventInvitation {
  entryId: string
  eventId: string
  namaEvent: string
  namaMitra: string
  coverImageUrl: string | null
  feeAmount: number
  tanggalMulai: string
}

interface MitraEvent {
  id: string
  namaEvent: string
  coverImageUrl: string | null
  feePgPerEvent: number
  tanggalMulai: string
  isOpenRecruitment: boolean
}

/**
 * Dashboard untuk role Fotografer.
 * Fokus: Order masuk yang butuh konfirmasi dan progress kerja.
 */
export function PhotographerDashboard({ clerkId }: { clerkId: string }) {
  const { user } = useUser()

  // 1. Fetch data profil PG sendiri
  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ["photographer-me", clerkId],
    queryFn: async () => {
      const res = await fetch("/api/photographers/me")
      if (!res.ok) throw new Error("Gagal mengambil profil")
      return res.json() as Promise<{ success: boolean; data: PhotographerProfile }>
    },
  })

  // 2. Fetch list order
  const { data: response, isLoading: ordersLoading } = useQuery({
    queryKey: ["photographer-orders", clerkId],
    queryFn: async () => {
      const res = await fetch("/api/orders?limit=10")
      if (!res.ok) throw new Error("Gagal mengambil data order")
      return res.json() as Promise<{ success: boolean; data: OrderWithPackage[] }>
    },
  })

  const pgProfile = profileRes?.data

  // 3. Fetch list paket untuk mengecek kelengkapan profil
  const { data: packagesRes, isLoading: packagesLoading } = useQuery({
    queryKey: ["photographer-packages", pgProfile?.id],
    enabled: !!pgProfile?.id,
    queryFn: async () => {
      const res = await fetch(`/api/photographers/${pgProfile?.id}/packages`)
      if (!res.ok) throw new Error("Gagal mengambil data paket")
      return res.json() as Promise<{ success: boolean; data: unknown[] }>
    },
  })

  // 4. Fetch real reviews
  const { data: reviewsRes, isLoading: reviewsLoading } = useQuery({
    queryKey: ["photographer-reviews", pgProfile?.id],
    enabled: !!pgProfile?.id,
    queryFn: async () => {
      const res = await fetch(`/api/reviews/photographer/${pgProfile?.id}`)
      if (!res.ok) throw new Error("Gagal mengambil ulasan")
      return res.json() as Promise<{
        success: boolean
        data: Review[]
      }>
    },
  })

  // 5. Fetch calendar blocked dates for the current month
  const today = new Date()
  const currentMonthStr = format(today, "yyyy-MM")
  const { data: calendarRes } = useQuery({
    queryKey: ["photographer-calendar", pgProfile?.id, currentMonthStr],
    enabled: !!pgProfile?.id,
    queryFn: async () => {
      const res = await fetch(`/api/photographers/${pgProfile?.id}/calendar?month=${currentMonthStr}`)
      if (!res.ok) throw new Error("Gagal mengambil data kalender")
      return res.json() as Promise<{
        success: boolean
        data: {
          blockedDates: string[]
        }
      }>
    },
  })

  const queryClient = useQueryClient()
  const actionMutation = useMutation({
    mutationFn: async ({ path, method = "PATCH", body, invalidateKeys }: { path: string, method?: string, body?: Record<string, unknown>, invalidateKeys?: string[] }) => {
      const res = await fetch(`/api/${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error || "Gagal memproses permintaan")
      }
      return { data: await res.json() as { success: boolean }, invalidateKeys }
    },
    onSuccess: (res) => {
      const keys = res.invalidateKeys || ["photographer-orders"]
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key, clerkId] })
      })
      toast.success("Berhasil memperbarui data")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  // Early return check (after all hooks are initialized unconditionally)
  if (ordersLoading || profileLoading) return <DashboardSkeleton />

  const ordersList = response?.data || []
  const pendingOrders = ordersList.filter(o => o.status === "pending")
  const activeJobs = ordersList.filter(o => ["confirmed", "dp_paid", "ongoing", "delivered"].includes(o.status))

  const isUsernameMissing = !pgProfile?.username && !user?.username
  const isPortfolioMissing = !pgProfile?.portfolioUrls || pgProfile.portfolioUrls.length === 0
  const isPackagesMissing = !packagesLoading && (!packagesRes?.data || packagesRes.data.length === 0)
  const isProfileIncomplete = pgProfile && (isUsernameMissing || isPortfolioMissing || isPackagesMissing)

  // Calculate real revenue from completed or paid orders
  const realRevenue = ordersList
    .filter(o => ["completed", "dp_paid", "ongoing", "delivered"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.package?.harga || 0), 0)
  const displayRevenue = `Rp ${realRevenue.toLocaleString('id-ID')}`

  const reviewsList = reviewsRes?.data || []
  const totalReviews = pgProfile?.ratingCount ?? reviewsList.length

  const blockedDates = calendarRes?.data?.blockedDates || []

  // Calendar calculations
  const firstOfMonth = startOfMonth(today)
  const daysInMonth = getDaysInMonth(today)
  const startDayOfWeek = (firstOfMonth.getDay() + 6) % 7 // Monday = 0, Tuesday = 1, ..., Sunday = 6

  // Ratings display fallback
  const displayRating = pgProfile?.ratingAverage ? `${Number(pgProfile.ratingAverage).toFixed(1)}` : "0.0"
  const upcomingShoots = activeJobs.length

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300 p-4 md:p-8 overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute -top-10 -right-20 pointer-events-none select-none text-[150px] md:text-[200px] font-black opacity-[0.03] dark:opacity-[0.05] tracking-tight uppercase rotate-[-5deg] text-foreground">
        {pgProfile?.username || user?.username || "ARIS"}
      </div>

      <div className="max-w-[1280px] mx-auto space-y-8 relative z-10">
        {/* Profile Completeness Banner */}
        {isProfileIncomplete && (
          <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10 shadow-sm rounded-[32px] overflow-hidden animate-in zoom-in duration-500">
            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive shrink-0">
                <AlertCircleIcon className="w-8 h-8" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-destructive mb-1">Peringatan: Lengkapi Profil Anda</h3>
                <p className="text-sm text-muted-foreground font-medium max-w-2xl">
                  Pastikan Anda sudah melengkapi username, minimal mempunyai 1 paket, dan upload portofolio. Akun fotografer yang belum lengkap tidak akan tampil di pencarian pelanggan dan tidak bisa menerima order.
                </p>
              </div>
              <Link href="/dashboard/profile" className="shrink-0 w-full md:w-auto">
                <Button className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer font-bold rounded-full px-8 shadow-lg shadow-destructive/20 transition-transform hover:scale-[1.02]">
                  Lengkapi Sekarang
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <header className="flex justify-between items-end">
          <div>
            <p className="text-xs font-bold text-accent mb-2">Selamat datang kembali</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              {user?.fullName || pgProfile?.username || "Julian Aris"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {!isProfileIncomplete && (
              <Link href="/dashboard/profile">
                <Button className="px-8 rounded-full font-bold shadow-xl shadow-primary/10 h-12 bg-primary hover:bg-accent text-primary-foreground hover:text-accent-foreground transition-all">
                  Edit Profil
                </Button>
              </Link>
            )}
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-background dark:border-border shadow-md relative">
              <Image
                alt={user?.fullName || "Foto Profil"}
                src={user?.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </header>

        {/* Main Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (col-span 8) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-card p-8 rounded-[32px] md:rounded-[40px] border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-[180px] group">
                <BanknoteIcon className="text-accent w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">Total Pendapatan</p>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight">{displayRevenue}</h3>
                </div>
              </div>
              <div className="bg-card p-8 rounded-[32px] md:rounded-[40px] border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-[180px] group">
                <CameraIcon className="text-accent w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">Pemotretan Mendatang</p>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight">{upcomingShoots}</h3>
                </div>
              </div>
              <div className="bg-card p-8 rounded-[32px] md:rounded-[40px] border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-[180px] group">
                <Star className="text-accent w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">Rating / Ulasan</p>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight">{displayRating} <span className="text-xs font-medium text-muted-foreground">({totalReviews} ulasan)</span></h3>
                </div>
              </div>
            </div>

            {/* Pending Invitations Section */}
            <PendingInvitations clerkId={clerkId} />

            {/* Booking Requests (Menunggu Konfirmasi) */}
            <div className="bg-card p-8 md:p-10 rounded-[32px] md:rounded-[40px] border border-border shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Permintaan Booking</h3>
                  {pendingOrders.length > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground rounded-full font-bold px-3 h-5">{pendingOrders.length}</Badge>
                  )}
                </div>
                <Link href="/dashboard/orders" className="text-accent font-bold text-sm hover:underline">
                  Lihat Semua
                </Link>
              </div>

              {pendingOrders.length > 0 ? (
                <div className="space-y-6">
                  {pendingOrders.map((order, idx) => (
                    <div key={order.id}>
                      {idx > 0 && <div className="h-px bg-border my-6" />}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted relative shrink-0 flex items-center justify-center">
                            <div className="w-full h-full flex items-center justify-center bg-secondary text-secondary-foreground font-black text-xl">
                              <User className="w-6 h-6 text-muted-foreground" />
                            </div>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-foreground">
                              Pelanggan #{order.customerClerkId.slice(-6).toUpperCase()}
                            </p>
                            <p className="text-sm font-medium text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                              <span>{order.package?.namaPaket || "Paket Kustom"}</span>
                              <span className="opacity-50">•</span>
                              <span>{format(new Date(order.tanggalPotret), "d MMM yyyy", { locale: localeId })}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 justify-end">
                          <Button
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive font-bold text-sm cursor-pointer"
                            onClick={() => actionMutation.mutate({
                              path: `orders/${order.id}/reject`,
                              invalidateKeys: ["photographer-orders"]
                            })}
                            disabled={actionMutation.isPending}
                          >
                            Tolak
                          </Button>
                          <Button
                            className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground px-6 py-2 h-10 rounded-full font-bold transition-all duration-300 cursor-pointer"
                            onClick={() => actionMutation.mutate({
                              path: `orders/${order.id}/confirm`,
                              invalidateKeys: ["photographer-orders"]
                            })}
                            disabled={actionMutation.isPending}
                          >
                            {actionMutation.isPending ? "Mengonfirmasi..." : "Terima"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center text-muted-foreground font-medium text-sm">
                  Tidak ada order yang butuh konfirmasi segera.
                </div>
              )}
            </div>

            {/* Active Pengerjaan List */}
            <div className="bg-card p-8 md:p-10 rounded-[32px] md:rounded-[40px] border border-border shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Jadwal Pemotretan</h3>
                  {activeJobs.length > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground rounded-full font-bold px-3 h-5">{activeJobs.length}</Badge>
                  )}
                </div>
                <Link href="/dashboard/orders" className="text-accent font-bold text-sm hover:underline">
                  Lihat Semua Order
                </Link>
              </div>

              {activeJobs.length > 0 ? (
                <div className="space-y-4">
                  {activeJobs.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="p-4 bg-background dark:bg-muted/40 hover:bg-muted/80 dark:hover:bg-muted/80 rounded-[24px] border border-border shadow-sm flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center shrink-0">
                          <CameraIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground mb-0.5">Order #{order.id.slice(0, 8)}</div>
                          <div className="text-xs text-muted-foreground font-bold lowercase flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {format(new Date(order.tanggalPotret), "p • d MMM yyyy", { locale: localeId })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 border text-[9px] font-bold hidden sm:flex ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </Badge>
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button size="icon" variant="ghost" className="rounded-full hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors">
                            <ChevronRightIcon className="w-5 h-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center text-muted-foreground font-medium text-sm">
                  Belum ada jadwal pemotretan aktif.
                </div>
              )}
            </div>

            {/* New Events from My Mitra */}
            <MitraEventsSection clerkId={clerkId} />

            {/* Recent Reviews (Stitch bento style) */}
            <div className="bg-card p-8 md:p-10 rounded-[32px] md:rounded-[40px] border border-border shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-foreground">Ulasan Terbaru</h3>
                <div className="flex items-center gap-2">
                  <Star className="text-accent w-4 h-4 fill-current" />
                  <span className="font-bold text-foreground">{displayRating}</span>
                  <span className="text-muted-foreground text-sm">({totalReviews})</span>
                </div>
              </div>
              {reviewsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                  <div className="h-32 bg-muted rounded-[24px]"></div>
                  <div className="h-32 bg-muted rounded-[24px]"></div>
                </div>
              ) : reviewsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviewsList.slice(0, 2).map((rev) => (
                    <div key={rev.id} className="bg-background dark:bg-muted/40 p-6 rounded-[24px] border border-border shadow-sm">
                      <div className="flex items-center gap-0.5 text-accent mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? "text-accent fill-current" : "text-muted-foreground/30"
                              }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm italic text-foreground/90 mb-4 leading-relaxed line-clamp-3">
                        "{rev.komentar || "Tidak ada komentar."}"
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground">
                        — Pelanggan #{rev.customerClerkId.slice(-6).toUpperCase()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center text-muted-foreground font-medium text-sm">
                  Belum ada ulasan dari pelanggan.
                </div>
              )}
            </div>
          </div>

          {/* Right Column (col-span 4) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Schedule calendar widget */}
            <div className="bg-card text-foreground p-8 rounded-[32px] md:rounded-[40px] border border-border relative overflow-hidden flex flex-col justify-between min-h-[380px] shadow-sm">
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold tracking-tight">Jadwal</h3>
                  <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted text-foreground" asChild>
                    <Link href="/dashboard/orders">
                      <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-y-3 text-center text-[10px] font-bold opacity-50">
                  <span>S</span><span>S</span><span>R</span><span>K</span><span>J</span><span>S</span><span>M</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`pad-${i}`} className="aspect-square flex items-center justify-center text-xs text-muted-foreground/20 select-none">
                      &nbsp;
                    </div>
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isBlocked = blockedDates.includes(dateStr);
                    const isToday = day === today.getDate() && today.getMonth() === new Date().getMonth() && today.getFullYear() === new Date().getFullYear();
                    return (
                      <div
                        key={day}
                        className={`aspect-square flex items-center justify-center text-xs rounded-full transition-all ${isBlocked
                          ? "bg-destructive font-bold text-destructive-foreground"
                          : isToday
                            ? "border border-accent font-bold text-accent bg-accent/10"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground"
                          }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-border space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-destructive"></div>
                    <p className="text-xs font-semibold text-muted-foreground">Hari Diblokir / Terisi</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                    <p className="text-xs font-semibold text-muted-foreground">Hari Tersedia</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full border-[1.5px] border-accent/30 opacity-30 pointer-events-none" />
            </div>

            {/* Revenue Chart Card */}
            <div className="bg-card p-8 md:p-10 rounded-[32px] md:rounded-[40px] border border-border shadow-sm flex flex-col justify-between min-h-[300px]">
              <h3 className="text-lg font-bold text-foreground mb-6">Grafik Pendapatan</h3>
              <div className="flex items-end justify-between gap-3 h-32">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-primary/10 rounded-t-full h-[40%] relative" />
                  <span className="text-[10px] font-bold opacity-50">Jun</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-primary/10 rounded-t-full h-[60%]" />
                  <span className="text-[10px] font-bold opacity-50">Jul</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-accent rounded-t-full h-[90%]" />
                  <span className="text-[10px] font-bold opacity-50">Agt</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-primary rounded-t-full h-[75%]" />
                  <span className="text-[10px] font-bold opacity-50">Sep</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-muted-foreground">Rata-rata Bulanan</p>
                  <p className="text-lg font-bold text-foreground">Rp 4.200.000</p>
                </div>
              </div>
            </div>

            {/* Quick Actions & MoU Contract Link */}
            <div className="bg-card p-8 rounded-[32px] md:rounded-[40px] border border-border shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-foreground">Tindakan Cepat</h4>

              <Link href="/dashboard/contracts" className="block group">
                <div className="p-4 bg-background dark:bg-muted/40 hover:bg-accent/5 dark:hover:bg-accent/10 rounded-[20px] border border-border flex items-center justify-between transition-all">
                  <div className="flex items-center gap-3">
                    <FilePenIcon className="w-5 h-5 text-accent" />
                    <span className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">MoU Kerjasama</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            </div>

            {/* Tips Section */}
            <Card className="border-accent/20 shadow-sm bg-accent/5 text-foreground overflow-hidden relative group rounded-[32px] md:rounded-[40px]">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                <CameraIcon size={80} className="text-accent" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Tips Framic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                  Respon cepat di bawah 1 jam meningkatkan peluang order Anda diterima pelanggan hingga 80%. Jangan lupa upload minimal 5 foto h+1 pemotretan ya!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Decorative Orbital Arc */}
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full border border-dashed border-foreground/5 pointer-events-none" />
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending": return "bg-accent/10 text-accent border-accent/20"
    case "confirmed": return "bg-primary/10 text-primary border-primary/20"
    case "dp_paid": return "bg-accent/20 text-accent border-accent/30"
    case "ongoing": return "bg-accent/5 text-accent/80 border-accent/15"
    case "delivered": return "bg-secondary text-secondary-foreground border-border"
    case "completed": return "bg-secondary text-secondary-foreground border-border"
    case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20"
    default: return "bg-muted text-muted-foreground border-border"
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending": return "Menunggu Konfirmasi"
    case "confirmed": return "Dikonfirmasi"
    case "dp_paid": return "DP Dibayar"
    case "ongoing": return "Sesi Berjalan"
    case "delivered": return "Selesai Dipotret"
    case "completed": return "Selesai"
    case "cancelled": return "Dibatalkan"
    default: return status
  }
}

function PendingInvitations({ clerkId }: { clerkId: string }) {
  const queryClient = useQueryClient()
  const { data: response, isLoading } = useQuery({
    queryKey: ["pg-invitations", clerkId],
    queryFn: async () => {
      const res = await fetch("/api/photographers/me/invitations")
      if (!res.ok) throw new Error("Gagal mengambil undangan")
      return res.json() as Promise<{
        success: boolean;
        data: {
          mitraInvitations: MitraInvitation[];
          eventInvitations: EventInvitation[]
        }
      }>
    },
  })

  const router = useRouter()

  const respondMitra = useMutation({
    mutationFn: async ({ contractId, status }: { contractId: string, status: string }) => {
      const res = await fetch(`/api/photographers/me/contracts/${contractId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error("Gagal merespons")
      return { contractId, status }
    },
    onSuccess: (data) => {
      toast.success("Respons berhasil dikirim")
      queryClient.invalidateQueries({ queryKey: ["pg-invitations"] })
      queryClient.invalidateQueries({ queryKey: ["photographer-orders"] })
      if (data.status === "accepted") {
        router.push(`/dashboard/contracts/${data.contractId}?type=mitra`)
      }
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const respondEvent = useMutation({
    mutationFn: async ({ eventId, entryId, status }: { eventId: string, entryId: string, status: string }) => {
      const res = await fetch(`/api/events/${eventId}/photographers/${entryId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error("Gagal merespons")
    },
    onSuccess: () => {
      toast.success("Respons berhasil dikirim")
      queryClient.invalidateQueries({ queryKey: ["pg-invitations"] })
      queryClient.invalidateQueries({ queryKey: ["photographer-orders"] })
    },
    onError: (e: Error) => toast.error(e.message)
  })

  if (isLoading || !response?.success) return null
  const { mitraInvitations, eventInvitations } = response.data

  if (mitraInvitations.length === 0 && eventInvitations.length === 0) {
    return (
      <div className="bg-card p-8 md:p-10 rounded-[32px] md:rounded-[40px] border border-border shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-xl font-black text-foreground tracking-tight">Undangan Kerjasama</h3>
        </div>
        <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center text-muted-foreground font-medium text-sm">
          Belum ada undangan kerjasama baru saat ini.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card p-8 md:p-10 rounded-[32px] md:rounded-[40px] border border-border shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-black text-foreground tracking-tight">Undangan Kerjasama</h3>
        <Badge className="bg-destructive text-destructive-foreground rounded-full font-black px-3 h-5">
          {mitraInvitations.length + eventInvitations.length}
        </Badge>
      </div>

      <div className="grid gap-4">
        {/* 1. Mitra Invitations (Anggota Tetap) */}
        {mitraInvitations.map((inv) => (
          <Card key={inv.contractId} className="border-border shadow-sm bg-background dark:bg-muted/40 rounded-[28px] overflow-hidden border-2">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center font-black text-xl uppercase shrink-0">
                      {inv.namaMitra.charAt(0)}
                    </div>
                    <div>
                      <Badge className="bg-accent/10 text-accent hover:bg-accent/20 font-black text-[10px] uppercase mb-1 tracking-widest">Undangan Anggota Tetap</Badge>
                      <h3 className="font-black text-foreground text-lg leading-tight uppercase tracking-tight">{inv.namaMitra}</h3>
                    </div>
                  </div>

                  {inv.invitationMessage && (
                    <div className="bg-muted p-4 rounded-2xl border border-border/40 italic text-sm text-muted-foreground font-medium">
                      "{inv.invitationMessage}"
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-accent/5 rounded-2xl border border-accent/10">
                      <div className="text-[10px] font-black text-accent/70 uppercase tracking-widest mb-1">Bagi Hasil</div>
                      <div className="font-black text-accent text-sm">{inv.photographerPercent}% PG</div>
                    </div>
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30">
                      <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Min. Fee</div>
                      <div className="font-black text-emerald-700 dark:text-emerald-300 text-sm">Rp {inv.minimumFeePerEvent.toLocaleString('id-ID')}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-2xl border border-border/30 hidden sm:block">
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Durasi</div>
                      <div className="font-black text-foreground text-sm">
                        {format(new Date(inv.tanggalMulai), "MMM yy")} - {format(new Date(inv.tanggalSelesai), "MMM yy")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end items-center md:items-stretch min-w-[160px]">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 text-muted-foreground font-bold cursor-pointer"
                    onClick={() => respondMitra.mutate({ contractId: inv.contractId, status: "rejected" })}
                    disabled={respondMitra.isPending}
                  >
                    Tolak
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-accent text-primary-foreground hover:text-accent-foreground font-black rounded-xl shadow-lg transition-colors cursor-pointer"
                    onClick={() => respondMitra.mutate({ contractId: inv.contractId, status: "accepted" })}
                    disabled={respondMitra.isPending}
                  >
                    {respondMitra.isPending ? "..." : "Terima"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* 2. Event Invitations (Per-Event) */}
        {eventInvitations.map((inv) => (
          <Card key={inv.entryId} className="border-border shadow-sm bg-background dark:bg-muted/40 rounded-[28px] overflow-hidden border-2">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center shrink-0">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <Badge className="bg-accent/10 text-accent hover:bg-accent/20 font-black text-[10px] uppercase mb-1 tracking-widest">Undangan Event</Badge>
                      <h3 className="font-black text-foreground text-lg leading-tight uppercase tracking-tight">{inv.namaEvent}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Oleh {inv.namaMitra}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-accent rounded-xl border border-border/40">
                        <BanknoteIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Fee Tawaran</div>
                        <div className="font-black text-foreground">Rp {inv.feeAmount.toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-muted text-muted-foreground rounded-xl border border-border/40">
                        <ClockIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Tanggal</div>
                        <div className="font-black text-foreground">{format(new Date(inv.tanggalMulai), "d MMM yyyy")}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-3 justify-end items-center md:items-stretch min-w-[160px]">
                  <Button
                    className="flex-1 bg-primary hover:bg-accent text-primary-foreground hover:text-accent-foreground font-black rounded-xl shadow-lg transition-colors cursor-pointer"
                    onClick={() => respondEvent.mutate({ eventId: inv.eventId, entryId: inv.entryId, status: "accepted" })}
                    disabled={respondEvent.isPending}
                  >
                    {respondEvent.isPending ? "..." : "Terima"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 text-muted-foreground font-bold cursor-pointer"
                    onClick={() => respondEvent.mutate({ eventId: inv.eventId, entryId: inv.entryId, status: "rejected" })}
                    disabled={respondEvent.isPending}
                  >
                    Tolak
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function MitraEventsSection({ clerkId }: { clerkId: string }) {
  const { data: response, isLoading } = useQuery({
    queryKey: ["photographer-mitra-events", clerkId, "my-mitra-only"],
    queryFn: async () => {
      const res = await fetch("/api/events?limit=5&myMitraOnly=true")
      if (!res.ok) throw new Error("Gagal mengambil data event")
      return res.json() as Promise<{
        success: boolean;
        data: MitraEvent[]
      }>
    },
  })

  const events = response?.data || []

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-40 rounded-[24px]" /></div>

  return (
    <div className="bg-card p-8 md:p-10 rounded-[32px] md:rounded-[40px] border border-border shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold text-foreground tracking-tight">Event Baru dari Mitra</h3>
        {events.length > 0 && (
          <Badge className="bg-destructive text-destructive-foreground rounded-full font-bold px-3 h-5">{events.length}</Badge>
        )}
      </div>

      {events.length > 0 ? (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id} className="border-border shadow-sm bg-background dark:bg-muted/40 overflow-hidden group hover:border-accent/40 transition-all rounded-[28px]">
              <CardContent className="p-0 flex flex-col sm:flex-row items-stretch">
                <div className="sm:w-40 h-32 bg-muted relative shrink-0 overflow-hidden">
                  {event.coverImageUrl ? (
                    <Image src={event.coverImageUrl} alt={event.namaEvent} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <TentIcon className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-foreground text-base group-hover:text-accent transition-colors">{event.namaEvent}</h3>
                      <div className="flex items-center gap-1 text-accent font-bold shrink-0">
                        <BanknoteIcon className="w-4 h-4" />
                        <span className="text-sm">Rp {(event.feePgPerEvent || 0).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> {format(new Date(event.tanggalMulai), "dd MMM yyyy", { locale: localeId })}</span>
                      {event.isOpenRecruitment && (
                        <Badge className="bg-accent/10 text-accent hover:bg-accent/20 font-bold text-[10px] h-5">Rekrutmen Terbuka</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link href={`/events/${event.id}`}>
                      <Button size="sm" className="bg-primary hover:bg-accent text-primary-foreground hover:text-accent-foreground font-bold rounded-xl px-6 gap-2 h-9 cursor-pointer transition-colors">
                        Lihat Detail <ChevronRightIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center text-muted-foreground font-medium text-sm">
          Belum ada event baru dari Mitra.
        </div>
      )}
    </div>
  )
}
