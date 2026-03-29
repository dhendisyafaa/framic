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
            <div className="bg-rose-50 border-2 border-rose-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-rose-100/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                  <CameraIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-tight">Akun Fotografer Ditangguhkan</h4>
                  <p className="text-sm text-slate-500 font-medium">Profil Anda tidak akan muncul di publik untuk sementara waktu. Hubungi admin untuk detail.</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-full border-rose-200 text-rose-600 font-bold hover:bg-rose-100">Cek Status</Button>
            </div>
          )}
          {isMitraSuspended && (
            <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-100/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                  <PackageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-tight">Akun Mitra Ditangguhkan</h4>
                  <p className="text-sm text-slate-500 font-medium">Akses operasional Mitra Anda telah dibekukan sementara.</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-full border-amber-200 text-amber-600 font-bold hover:bg-amber-100">Hubungi Admin</Button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Halo, Kustomer 👋</h1>
          <p className="text-slate-500 font-medium">Selamat datang di dashboard Anda. Cek status sesi foto Anda di sini.</p>
        </div>
        <Link href="/photographers">
          <Button className="rounded-full px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform bg-indigo-600 hover:bg-indigo-700 font-bold">
            Cari Fotografer
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-slate-200/60 shadow-sm bg-indigo-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100/80 rounded-2xl text-indigo-600">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Order Aktif</CardTitle>
                <div className="text-3xl font-black text-slate-900 leading-tight">{activeOrders.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm bg-emerald-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100/80 rounded-2xl text-emerald-600">
                <CameraIcon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Selesai</CardTitle>
                <div className="text-3xl font-black text-slate-900 leading-tight">
                  {ordersList.filter(o => o.status === "completed").length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm bg-amber-50/30 underline decoration-amber-200 decoration-4 underline-offset-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100/80 rounded-2xl text-amber-600">
                <PackageIcon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Booking</CardTitle>
                <div className="text-3xl font-black text-slate-900 leading-tight">{ordersList.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Booking Terbaru</h2>
          <Link href="/orders" className="text-sm font-bold text-primary flex items-center gap-2 hover:gap-3 transition-all">
            Lihat Semua <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {activeOrders.length > 0 ? (
          <div className="grid gap-4">
            {activeOrders.map((order) => (
              <Card key={order.id} className="border-slate-100 shadow-none hover:border-slate-200 hover:shadow-md transition-all group overflow-hidden">
                <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <CameraIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                        Sesi {order.orderType === "event" ? "Event" : "Privat"}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium lowercase italic">
                        <CalendarIcon className="w-4 h-4" />
                        {format(new Date(order.tanggalPotret), "eeee, d MMMM yyyy", { locale: localeId })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="hidden md:block text-right mr-4">
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
                      <Badge variant="outline" className={`rounded-full px-4 border-2 font-black ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 border border-slate-100">
                        <ArrowRightIcon className="w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 py-16 text-center">
            <CardContent className="flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
                <CameraIcon className="w-10 h-10" />
              </div>
              <CardTitle className="text-xl font-black text-slate-900 mb-2">Belum Ada Order Aktif</CardTitle>
              <CardDescription className="text-slate-500 max-w-sm mb-8 font-medium">
                Mulai booking fotografer profesional sekarang dan abadikan momen spesial Anda.
              </CardDescription>
              <Link href="/photographers">
                <Button className="rounded-full px-8">Lihat Katalog</Button>
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
    case "pending": return "text-amber-600 border-amber-200 bg-amber-50"
    case "confirmed": return "text-blue-600 border-blue-200 bg-blue-50"
    case "dp_paid": return "text-indigo-600 border-indigo-200 bg-indigo-50"
    case "ongoing": return "text-emerald-600 border-emerald-200 bg-emerald-50"
    case "delivered": return "text-purple-600 border-purple-200 bg-purple-50"
    case "completed": return "text-slate-600 border-slate-200 bg-slate-100"
    case "cancelled": return "text-rose-600 border-rose-200 bg-rose-50"
    default: return "text-slate-600 border-slate-200"
  }
}
