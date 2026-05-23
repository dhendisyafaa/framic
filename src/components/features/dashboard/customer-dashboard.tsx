"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { OrderWithPackage } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, CameraIcon, PackageIcon, ArrowRightIcon } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { DashboardSkeleton } from "./dashboard-skeleton"

/**
 * Dashboard untuk role Customer.
 * Fokus: Monitoring booking aktif dan kemudahan mencari fotografer.
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
  // Fetch active orders (yang belum completed/cancelled)
  const { data: response, isLoading } = useQuery({
    queryKey: ["customer-active-orders", clerkId],
    queryFn: async () => {
      const res = await fetch("/api/orders?limit=5")
      if (!res.ok) throw new Error("Gagal mengambil data order")
      return res.json() as Promise<{ success: boolean; data: OrderWithPackage[] }>
    },
  })

  const ordersList = response?.data || []
  const activeOrders = ordersList.filter(o => !["completed", "cancelled"].includes(o.status))

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Role Suspension Warning Banners */}
      {(isPhotographerSuspended || isMitraSuspended) && (
        <div className="mb-8 space-y-4">
          {isPhotographerSuspended && (
            <div className="bg-card border border-destructive/20 p-6 rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-destructive/5 text-destructive rounded-full flex items-center justify-center shrink-0 border border-destructive/10">
                  <CameraIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground uppercase tracking-tight text-sm">Akun Fotografer Ditangguhkan</h4>
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
                  <h4 className="font-bold text-foreground uppercase tracking-tight text-sm">Akun Mitra Ditangguhkan</h4>
                  <p className="text-xs text-muted-foreground">Akses operasional Mitra Anda telah dibekukan sementara.</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-full border-accent/20 text-accent font-bold hover:bg-accent/5 text-xs h-9">Hubungi Admin</Button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground mb-2">Customer Dashboard</h1>
          <p className="text-sm text-muted-foreground max-w-xl">Selamat datang kembali! Mari temukan fotografer terbaik untuk momen spesial Anda.</p>
        </div>
        <Link href="/photographers">
          <Button className="rounded-full px-8 shadow-md bg-primary hover:bg-primary/95 font-bold h-11 text-xs">
            Cari Fotografer
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-muted bg-card shadow-sm rounded-[24px]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#141413]/5 text-[#141413] rounded-full border border-muted">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Order Aktif</CardTitle>
                <div className="text-3xl font-medium text-foreground tracking-[-0.02em] mt-1">{activeOrders.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted bg-card shadow-sm rounded-[24px]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#141413]/5 text-[#141413] rounded-full border border-muted">
                <CameraIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Selesai</CardTitle>
                <div className="text-3xl font-medium text-foreground tracking-[-0.02em] mt-1">
                  {ordersList.filter(o => o.status === "completed").length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted bg-card shadow-sm rounded-[24px]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#141413]/5 text-[#141413] rounded-full border border-muted">
                <PackageIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Booking</CardTitle>
                <div className="text-3xl font-medium text-foreground tracking-[-0.02em] mt-1">{ordersList.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium tracking-tight text-foreground">Booking Terbaru</h2>
          <Link href="/orders" className="text-xs font-bold text-primary flex items-center gap-2 hover:gap-3 transition-all">
            Lihat Semua <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeOrders.length > 0 ? (
          <div className="grid gap-4">
            {activeOrders.map((order) => (
              <Card key={order.id} className="border-muted shadow-sm hover:shadow-md bg-card transition-all group overflow-hidden rounded-[24px]">
                <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors border border-muted/55">
                      <CameraIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground text-lg leading-tight mb-1">
                        Sesi {order.orderType === "event" ? "Event" : "Privat"}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {format(new Date(order.tanggalPotret), "eeee, d MMMM yyyy", { locale: localeId })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="hidden md:block text-right mr-4">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</div>
                      <Badge variant="outline" className={`rounded-full px-3 py-0.5 border text-[9px] font-bold tracking-wider ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                    </div>
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50 border border-muted w-10 h-10">
                        <ArrowRightIcon className="w-4 h-4 text-foreground" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border border-muted bg-card py-16 text-center rounded-[32px]">
            <CardContent className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#141413]/5 text-muted-foreground border border-muted rounded-full flex items-center justify-center mb-6">
                <CameraIcon className="w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-medium text-foreground mb-2">Belum Ada Order Aktif</CardTitle>
              <CardDescription className="text-muted-foreground max-w-sm mb-8 text-xs leading-relaxed">
                Mulai booking fotografer profesional sekarang dan abadikan momen spesial Anda.
              </CardDescription>
              <Link href="/photographers">
                <Button className="rounded-full px-8 bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-11 text-xs">Lihat Katalog</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending": return "text-accent border-accent/25 bg-accent/5"
    case "confirmed": return "text-foreground border-muted bg-[#F3F0EE]"
    case "dp_paid": return "text-foreground border-muted bg-white"
    case "ongoing": return "text-accent border-accent/20 bg-accent/5 font-bold"
    case "delivered": return "text-foreground border-muted bg-[#FCFBFA]"
    case "completed": return "text-muted-foreground border-muted bg-[#F3F0EE]"
    case "cancelled": return "text-destructive border-destructive/20 bg-destructive/5"
    default: return "text-muted-foreground border-muted"
  }
}
