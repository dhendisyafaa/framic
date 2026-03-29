"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { OrderWithPackage } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CalendarIcon,
  CameraIcon,
  ChevronRightIcon,
  FilterIcon,
  SearchIcon,
  ShoppingBagIcon
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * Halaman List order
 * Menampilkan semua histori dan booking aktif user.
 */
export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<string>("all")

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["orders-list", activeTab],
    queryFn: async () => {
      const url = activeTab === "all" ? "/api/orders" : `/api/orders?status=${activeTab}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Gagal mengambil data order")
      return res.json() as Promise<{ success: boolean; data: OrderWithPackage[] }>
    },
  })

  const orders = response?.data || []

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-1 italic">Semua Order</h1>
          <p className="text-slate-500 font-medium">Lacak status sesi foto dan histori pemesanan Anda.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent h-9">
              <TabsTrigger value="all" className="rounded-xl px-4 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Semua</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-xl px-4 font-bold">Pending</TabsTrigger>
              <TabsTrigger value="confirmed" className="rounded-xl px-4 font-bold">Aktif</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl px-4 font-bold text-emerald-600">Selesai</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* List Container */}
      <div className="grid gap-4">
        {isLoading ? (
          <OrdersSkeleton />
        ) : error ? (
          <div className="text-center py-20 bg-rose-50 rounded-3xl border border-rose-100 italic font-bold text-rose-500">
            Terjadi kesalahan: {(error as Error).message}
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="border-slate-100 shadow-none hover:shadow-xl hover:border-slate-200 hover:-translate-y-1 transition-all group overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-6">
                    {/* Info Utama */}
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <CameraIcon className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-slate-900 leading-none">
                            {order.orderType === "event" ? "Sesi Event" : "Sesi Privat"}
                          </h3>
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-1.5 border-slate-200">
                            #{order.id.slice(0, 8)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {format(new Date(order.tanggalPotret), "d MMM yyyy", { locale: localeId })}
                          </span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="font-bold text-indigo-600">Rp {order.totalHarga.toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-4 md:pt-0">
                      <div className="text-left md:text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1 md:justify-end">
                          Status
                        </div>
                        <Badge variant="outline" className={`rounded-full px-5 border-2 font-black tracking-tighter shadow-sm ${getStatusStyles(order.status)}`}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <ChevronRightIcon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <ShoppingBagIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-black text-slate-900 text-lg">Belum Ada Order</h3>
            <p className="text-slate-500 mb-8 font-medium italic">Sepertinya Anda belum melakukan booking apa pun.</p>
            <Link href="/photographers">
              <Button className="rounded-full px-8 shadow-lg shadow-primary/20">Cari Fotografer</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="border-slate-100 shadow-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function getStatusStyles(status: string) {
  switch (status) {
    case "pending": return "text-slate-500 border-slate-200 bg-slate-50"
    case "confirmed": return "text-blue-600 border-blue-200 bg-blue-50"
    case "dp_paid": return "text-indigo-600 border-indigo-200 bg-indigo-50"
    case "ongoing": return "text-amber-600 border-amber-200 bg-amber-50"
    case "delivered": return "text-purple-600 border-purple-200 bg-purple-50"
    case "completed": return "text-emerald-600 border-emerald-200 bg-emerald-50"
    case "cancelled": return "text-rose-600 border-rose-200 bg-rose-50"
    case "disputed": return "text-orange-600 border-orange-200 bg-orange-50"
    default: return "text-slate-400 border-slate-100"
  }
}
