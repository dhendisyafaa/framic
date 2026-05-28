"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

// 2. Third-party libraries
import { useQuery } from "@tanstack/react-query"
import { useUser } from "@clerk/nextjs"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

// 3. Components
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardSkeleton } from "./dashboard-skeleton"

// 4. Icons
import {
  CalendarIcon,
  CameraIcon,
  PackageIcon,
  ArrowRight,
  MessageSquare,
  User,
  ClockIcon,
  Coins,
} from "lucide-react"

// 5. Types
import { OrderDetail } from "@/types"

// Helper utilities
import { cn } from "@/lib/utils"

/**
 * Dashboard untuk role Customer.
 * Fokus: Monitoring booking aktif, kemudahan mencari fotografer,
 * bento-grid premium layout, and dynamic integrations.
 */
export function CustomerDashboard({
  clerkId,
  isPhotographerSuspended,
  isMitraSuspended
}: {
  clerkId: string
  isPhotographerSuspended?: boolean
  isMitraSuspended?: boolean
}) {
  const { user } = useUser()

  // Fetch active & past orders (including photographer profiles linked to the orders)
  const { data: response, isLoading: ordersLoading } = useQuery({
    queryKey: ["customer-active-orders", clerkId],
    queryFn: async () => {
      const res = await fetch("/api/orders?limit=20")
      if (!res.ok) throw new Error("Gagal mengambil data order")
      return res.json() as Promise<{ success: boolean; data: OrderDetail[] }>
    },
  })

  if (ordersLoading) return <DashboardSkeleton />

  const ordersList = response?.data || []

  // Determine closest upcoming shoot
  const upcomingOrders = [...ordersList]
    .filter(o => ["confirmed", "dp_paid", "ongoing", "delivered"].includes(o.status))
    .sort((a, b) => new Date(a.tanggalPotret).getTime() - new Date(b.tanggalPotret).getTime())

  const nextShoot = upcomingOrders[0]

  const now = Date.now()
  const pendingPayments = ordersList.filter(o => {
    if (o.status === "confirmed") {
      // Hanya tampilkan tagihan DP jika belum kedaluwarsa (< 24 jam sejak confirmed)
      if (!o.confirmedAt) return false
      const expiryTime = new Date(o.confirmedAt).getTime() + 24 * 60 * 60 * 1000
      return expiryTime > now
    }
    return o.status === "delivered" && o.payment?.statusPelunasan !== "paid"
  })

  const getGreeting = () => {
    const hours = new Date().getHours()
    if (hours < 11) return "Selamat pagi"
    if (hours < 15) return "Selamat siang"
    if (hours < 18) return "Selamat sore"
    return "Selamat malam"
  }

  const getDisplayTime = (order: OrderDetail) => {
    try {
      const startDate = new Date(order.tanggalPotret)
      const timeString = format(startDate, "HH:mm")
      const duration = order.package?.durasiJam || 2
      const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000)
      const endTimeString = format(endDate, "HH:mm")
      return `${timeString} - ${endTimeString}`
    } catch {
      return "10:00 - 12:00"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Decorative background grid and circles matching mockup */}
      <div className="absolute -top-20 -left-20 w-[600px] h-[600px] border border-accent/5 rounded-full pointer-events-none opacity-20 dark:opacity-5" />
      <div className="absolute top-[40%] -right-40 w-[800px] h-[800px] border border-accent/5 rounded-full pointer-events-none opacity-10 dark:opacity-5" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-muted-foreground/5 whitespace-nowrap opacity-10 dark:opacity-5 pointer-events-none select-none text-9xl font-bold tracking-tighter uppercase">
        MOMENTS CAPTURED
      </div>

      {/* Role Suspension Warning Banners */}
      {(isPhotographerSuspended || isMitraSuspended) && (
        <div className="mb-8 space-y-4 relative z-10">
          {isPhotographerSuspended && (
            <div className="bg-card border border-destructive/20 p-6 rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-destructive/5 text-destructive rounded-full flex items-center justify-center shrink-0 border border-destructive/10">
                  <CameraIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Akun Fotografer Ditangguhkan</h4>
                  <p className="text-xs text-muted-foreground">Profil Anda tidak akan muncul di publik untuk sementara waktu. Hubungi admin untuk detail.</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-full border-destructive/20 text-destructive font-bold hover:bg-destructive/5 text-xs h-9">Cek Status</Button>
            </div>
          )}
          {isMitraSuspended && (
            <div className="bg-card border border-accent/20 p-6 rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/5 text-accent rounded-full flex items-center justify-center shrink-0 border border-accent/10">
                  <PackageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Akun Mitra Ditangguhkan</h4>
                  <p className="text-xs text-muted-foreground">Akses operasional Mitra Anda telah dibekukan sementara.</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-full border-accent/20 text-accent font-bold hover:bg-accent/5 text-xs h-9">Hubungi Admin</Button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <header className="mb-12 relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Customer Dashboard</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {getGreeting()}, {user?.firstName || "Pelanggan"}.
        </h1>
      </header>

      {/* Pending Payments Alert Section */}
      {pendingPayments.length > 0 && (
        <div className="mb-12 flex flex-col gap-4 relative z-10">
          {pendingPayments.map(order => {
            const isDp = order.status === "confirmed"
            const amount = isDp ? order.payment?.jumlahDp : order.payment?.jumlahPelunasan
            const title = isDp ? "Pembayaran Uang Muka" : "Pelunasan Sesi Foto"

            return (
              <div key={order.id} className="bg-accent/10 border border-accent/30 p-6 rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/20 text-accent rounded-full flex items-center justify-center shrink-0 border border-accent/10">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground text-sm">Menunggu {title}</h4>
                      {isDp && order.confirmedAt && (
                        <PaymentCountdown confirmedAt={order.confirmedAt} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tagihan order bersama <span className="font-semibold text-foreground">@{order.photographer?.username || "Fotografer"}</span> sebesar <strong className="text-accent font-black text-sm">Rp {amount?.toLocaleString("id-ID")}</strong>.
                    </p>
                  </div>
                </div>
                <Link href={`/dashboard/orders/${order.id}`}>
                  <Button className="rounded-full bg-accent hover:bg-accent/90 text-white font-bold h-10 px-6 w-full md:w-auto shadow-md shadow-accent/20 cursor-pointer">
                    Bayar Sekarang
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">

        {/* Left Side: Profile & Quick Actions */}
        <div className="lg:col-span-4 flex flex-col gap-8">

          {/* Profile Card */}
          <div className="bg-card text-foreground rounded-[48px] p-8 border border-border/60 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-6 border-4 border-background shadow-sm bg-muted flex items-center justify-center relative group">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={user?.fullName || "Avatar"} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">{user?.fullName || "Pelanggan"}</h2>
              <p className="text-xs text-muted-foreground mb-6">
                Member sejak {user?.createdAt ? new Date(user.createdAt).getFullYear() : 2026}
              </p>
              <div className="w-full h-[1px] bg-border/40 mb-6" />
              <div className="flex gap-4 w-full">
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold text-foreground">{ordersList.length}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Booking</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {ordersList.filter(o => ["pending", "confirmed", "dp_paid", "ongoing"].includes(o.status)).length}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Menunggu</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-primary text-primary-foreground rounded-[48px] p-8 shadow-md">
            <h3 className="text-lg font-bold mb-6">Tindakan Cepat</h3>
            <div className="flex flex-col gap-4">
              <Link href="/photographers" className="w-full">
                <Button className="w-full py-6 bg-secondary hover:bg-accent text-secondary-foreground hover:text-white rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer border-none">
                  Pesan Sesi Baru
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/dashboard/orders" className="w-full">
                <Button variant="outline" className="w-full py-6 border-2 border-primary-foreground/20 hover:border-primary-foreground text-primary-foreground bg-transparent hover:bg-transparent rounded-full font-bold transition-all duration-300 cursor-pointer">
                  Lihat Semua Order
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Upcoming Shoot & Booking History */}
        <div className="lg:col-span-8 flex flex-col gap-12">

          {/* Upcoming Shoot */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-bold text-foreground">Sesi Foto Mendatang</h3>
            </div>

            {nextShoot ? (
              <div className="bg-card rounded-[40px] md:rounded-[56px] overflow-hidden border border-border/60 shadow-sm flex flex-col md:flex-row min-h-[300px]">
                <div className="md:w-1/2 relative h-64 md:h-auto bg-muted">
                  {nextShoot.photographer?.avatarUrl ? (
                    <img
                      src={nextShoot.photographer.avatarUrl}
                      alt={nextShoot.photographer?.nama || "Fotografer"}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                      <CameraIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-8 left-8">
                    <Badge variant="outline" className={cn("rounded-full px-4 py-1 border-none font-bold text-[10px] tracking-wider", getStatusStyles(nextShoot.status))}>
                      {getStatusLabel(nextShoot.status)}
                    </Badge>
                  </div>
                </div>
                <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between">
                  <div>
                    <h4 className="text-2xl font-bold text-foreground mb-2">
                      {nextShoot.package?.namaPaket || (nextShoot.orderType === "event" ? "Event Sesi" : "Sesi Foto")}
                    </h4>
                    <div className="flex items-center gap-2.5 text-muted-foreground mb-6">
                      <User className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">
                        Sesi dengan {nextShoot.photographer?.username ? `@${nextShoot.photographer.username}` : "Fotografer"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-background border border-border/40 flex items-center justify-center">
                          <CalendarIcon className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Tanggal</p>
                          <p className="text-sm font-bold text-foreground">
                            {format(new Date(nextShoot.tanggalPotret), "d MMMM yyyy", { locale: localeId })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-background border border-border/40 flex items-center justify-center">
                          <ClockIcon className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Waktu</p>
                          <p className="text-sm font-bold text-foreground">{getDisplayTime(nextShoot)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link href={`/dashboard/orders/${nextShoot.id}`} className="mt-8">
                    <Button className="bg-primary hover:bg-accent text-primary-foreground hover:text-white px-8 py-4 rounded-full font-bold transition-all duration-300 w-full md:w-auto cursor-pointer">
                      Detail Sesi
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-[40px] p-10 border border-border/60 border-dashed text-center flex flex-col items-center justify-center min-h-[250px] shadow-sm">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-foreground mb-1">Belum ada sesi mendatang</h4>
                <p className="text-xs text-muted-foreground max-w-sm mb-6">
                  Ayo rencanakan sesi foto Anda berikutnya dan abadikan momen terbaik bersama fotografer profesional kami.
                </p>
                <Link href="/photographers">
                  <Button className="rounded-full px-6 bg-primary hover:bg-accent text-primary-foreground hover:text-white font-bold h-10 text-xs cursor-pointer">
                    Cari Fotografer
                  </Button>
                </Link>
              </div>
            )}
          </section>

          {/* Booking History */}
          <section>
            <h3 className="text-xl font-bold text-foreground mb-6">Riwayat Booking</h3>

            <div className="bg-card rounded-[32px] md:rounded-[40px] border border-border/60 overflow-hidden shadow-sm">
              {ordersList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20">
                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tipe Sesi</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tanggal</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-foreground">
                      {ordersList.map((order) => {
                        const pgName = order.photographer?.username ? `@${order.photographer.username}` : "Fotografer"
                        return (
                          <tr key={order.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                                  <CameraIcon className="w-4 h-4" />
                                </div>
                                <div className="font-medium">
                                  {order.package?.namaPaket || (order.orderType === "event" ? "Event Sesi" : "Sesi Foto")}
                                  <span className="block text-[10px] text-muted-foreground font-normal">
                                    dengan {pgName}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                              {format(new Date(order.tanggalPotret), "d MMM yyyy", { locale: localeId })}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={cn("rounded-full px-3 py-0.5 border text-[9px] font-bold tracking-wider", getStatusStyles(order.status))}>
                                {getStatusLabel(order.status)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link href={`/dashboard/orders/${order.id}`}>
                                <Button
                                  size="sm"
                                  className={cn(
                                    "rounded-full px-4 text-xs font-bold h-8 cursor-pointer border border-border/50",
                                    order.status === "delivered" && order.payment?.statusPelunasan !== "paid"
                                      ? "bg-accent hover:bg-accent/90 text-white border-none"
                                      : order.status === "completed" && !order.review
                                        ? "bg-primary hover:bg-accent text-primary-foreground hover:text-white"
                                        : "bg-secondary hover:bg-muted text-foreground"
                                  )}
                                >
                                  {order.status === "delivered" && order.payment?.statusPelunasan !== "paid"
                                    ? "Pelunasan"
                                    : order.status === "completed" && !order.review
                                      ? "Ulas Sesi"
                                      : "Detail"}
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <CameraIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-xs text-muted-foreground font-medium">Belum ada riwayat booking.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending": return "Menunggu"
    case "confirmed": return "Dikonfirmasi"
    case "dp_paid": return "DP Dibayar"
    case "ongoing": return "Berlangsung"
    case "delivered": return "Hasil Dikirim"
    case "completed": return "Selesai"
    case "cancelled": return "Dibatalkan"
    case "disputed": return "Dispute"
    default: return status
  }
}

function getStatusStyles(status: string) {
  switch (status) {
    case "pending": return "bg-accent/10 text-accent border border-accent/20"
    case "confirmed": return "bg-blue-500/10 text-blue-500 border border-blue-500/20"
    case "dp_paid": return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
    case "ongoing": return "bg-amber-500/10 text-amber-500 border border-amber-500/20"
    case "delivered": return "bg-purple-500/10 text-purple-500 border border-purple-500/20"
    case "completed": return "bg-slate-500/10 text-slate-500 border border-slate-500/20"
    case "cancelled": return "bg-destructive/10 text-destructive border border-destructive/20 shadow-sm"
    case "disputed": return "bg-accent/15 text-accent border border-accent/25 shadow-sm"
    default: return "bg-muted text-muted-foreground border-muted"
  }
}

function PaymentCountdown({ confirmedAt }: { confirmedAt: Date | string }) {
  const [timeLeft, setTimeLeft] = useState<string>("")

  useEffect(() => {
    if (!confirmedAt) return

    const expiryTime = new Date(confirmedAt).getTime() + 24 * 60 * 60 * 1000

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const distance = expiryTime - now

      if (distance < 0) {
        return "Kedaluwarsa"
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      if (remaining === "Kedaluwarsa") {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [confirmedAt])

  if (!timeLeft) return null

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
      timeLeft === "Kedaluwarsa"
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-orange-500/10 text-orange-500 border-orange-500/20"
    )}>
      <ClockIcon className="w-3 h-3" />
      {timeLeft === "Kedaluwarsa" ? "Kedaluwarsa" : `Sisa Waktu: ${timeLeft}`}
    </div>
  )
}

