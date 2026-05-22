"use client"

import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { OrderWithPackage, PhotographerProfile } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BellIcon,
  CalendarIcon,
  CameraIcon,
  ClockIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  FilePenIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  TentIcon,
  User,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import Image from "next/image"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

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

  // 3. Fetch list paket untuk mengecek kelengkapan profil
  const pgProfile = profileRes?.data
  const { data: packagesRes, isLoading: packagesLoading } = useQuery({
    queryKey: ["photographer-packages", pgProfile?.id],
    enabled: !!pgProfile?.id,
    queryFn: async () => {
      const res = await fetch(`/api/photographers/${pgProfile?.id}/packages`)
      if (!res.ok) throw new Error("Gagal mengambil data paket")
      return res.json() as Promise<{ success: boolean; data: any[] }>
    },
  })

  const queryClient = useQueryClient()
  const actionMutation = useMutation({
    mutationFn: async ({ path, method = "PATCH", body, invalidateKeys }: { path: string, method?: string, body?: any, invalidateKeys?: string[] }) => {
      const res = await fetch(`/api/${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal memproses permintaan")
      }
      return { data: await res.json(), invalidateKeys }
    },
    onSuccess: (res) => {
      const keys = res.invalidateKeys || ["photographer-orders"]
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key, clerkId] })
      })
      toast.success("Berhasil memperbarui data")
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const ordersList = response?.data || []
  const pendingOrders = ordersList.filter(o => o.status === "pending")
  const activeJobs = ordersList.filter(o => ["confirmed", "dp_paid", "ongoing", "delivered"].includes(o.status))

  if (ordersLoading || profileLoading) return <DashboardSkeleton />

  const isUsernameMissing = !pgProfile?.username && !user?.username
  const isPortfolioMissing = !pgProfile?.portfolioUrls || pgProfile.portfolioUrls.length === 0
  const isPackagesMissing = !packagesLoading && (!packagesRes?.data || packagesRes.data.length === 0)
  const isProfileIncomplete = pgProfile && (isUsernameMissing || isPortfolioMissing || isPackagesMissing)

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Completeness Banner */}
      {isProfileIncomplete && (
        <Card className="mb-8 border-rose-200 bg-rose-50 shadow-sm rounded-3xl overflow-hidden animate-in zoom-in duration-500">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircleIcon className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-black text-rose-900 mb-1">Peringatan: Lengkapi Profil Anda</h3>
              <p className="text-sm text-rose-700 font-medium max-w-2xl">
                Pastikan Anda sudah melengkapi username, minimal mempunyai 1 paket, dan upload portofolio. Akun fotografer yang belum lengkap tidak akan tampil di pencarian kustomer dan tidak bisa menerima order.
              </p>
            </div>
            <Link href="/dashboard/profile" className="shrink-0 w-full md:w-auto">
              <Button className="w-full bg-rose-600 cursor-pointer hover:bg-rose-700 font-black rounded-2xl px-8 shadow-lg shadow-rose-200">
                Lengkapi Sekarang
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Fotografer Dashboard</h1>
          <p className="text-slate-500 font-medium tracking-tight">Kelola jadwal pemotretan dan konfirmasi order baru Anda di sini.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isProfileIncomplete && (
            <Link href="/dashboard/profile">
              <Button className="px-8 rounded-full font-bold shadow-xl shadow-primary/25 h-12 bg-primary hover:bg-primary/90 transition-all">
                Edit Profil
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-rose-50/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100/80 rounded-2xl text-rose-600 animate-pulse">
                <BellIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Order Baru</CardTitle>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{pendingOrders.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-blue-50/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100/80 rounded-2xl text-blue-600">
                <ClockIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Order Aktif</CardTitle>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{activeJobs.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-purple-50/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100/80 rounded-2xl text-purple-600">
                <CheckCircle2Icon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Order Selesai</CardTitle>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">
                  {ordersList.filter(o => o.status === "completed").length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-indigo-50/20 group hover:border-indigo-400 transition-all cursor-pointer overflow-hidden relative">
          <Link href="/dashboard/contracts" className="absolute inset-0 z-10" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100/80 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                <FilePenIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Kontrak Saya</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="text-base underline text-primary font-black">Lihat MoU Kerjasama</div>
                  <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-emerald-50/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100/80 rounded-2xl text-emerald-600">
                <BanknoteIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pendapatan Masuk</CardTitle>
                <div className="text-xl font-black text-slate-900 tracking-tighter">Dalam Proses</div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Pending & Ongoing Jobs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Approval */}
          <PendingInvitations clerkId={clerkId} />

          {/* Menunggu Konfirmasi */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Menunggu Konfirmasi</h2>
              {pendingOrders.length > 0 && (
                <Badge className="bg-rose-500 rounded-full font-black px-3">{pendingOrders.length}</Badge>
              )}
            </div>

            {pendingOrders.length > 0 ? (
              <div className="grid gap-4">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className="border-rose-100 shadow-md bg-rose-50/30 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 font-black text-[10px] uppercase">Order Masuk</Badge>
                            <span className="font-bold text-slate-900 text-lg uppercase tracking-tight ml-2">#{order.id.slice(0, 8)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <CalendarIcon className="w-4 h-4" />
                            {format(new Date(order.tanggalPotret), "eeee, d MMMM yyyy", { locale: localeId })}
                          </div>
                        </div>
                        <Link href={`/orders/${order.id}`}>
                          <Button size="sm" variant="outline" className="rounded-full font-bold px-6 cursor-pointer">Detail Order</Button>
                        </Link>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                        <Button
                          variant="outline"
                          className="w-full sm:flex-1 rounded-xl border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-100 cursor-pointer"
                          onClick={() => actionMutation.mutate({
                            path: `orders/${order.id}/reject`,
                            invalidateKeys: ["photographer-orders"]
                          })}
                          disabled={actionMutation.isPending}
                        >
                          Tolak Order
                        </Button>
                        <Button
                          className="w-full sm:flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200 cursor-pointer"
                          onClick={() => actionMutation.mutate({
                            path: `orders/${order.id}/confirm`,
                            invalidateKeys: ["photographer-orders"]
                          })}
                          disabled={actionMutation.isPending}
                        >
                          {actionMutation.isPending ? "Memproses..." : "Konfirmasi Order"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-500 font-medium text-sm">
                Tidak ada order yang butuh konfirmasi segera.
              </div>
            )}
          </section>

          {/* Active Jobs */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Jadwal Pengerjaan Aktif</h2>
              {activeJobs.length > 0 && (
                <Badge className="bg-blue-500 rounded-full font-black px-3">{activeJobs.length}</Badge>
              )}
            </div>

            {activeJobs.length > 0 ? (
              <div className="grid gap-3">
                {activeJobs.slice(0, 5).map((order) => (
                  <Card key={order.id} className="border-blue-100 shadow-sm bg-blue-50/20 hover:bg-white transition-colors group">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                          <CameraIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 mb-0.5 uppercase tracking-tighter">Order #{order.id.slice(0, 8)}</div>
                          <div className="text-xs text-slate-500 font-bold lowercase flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {format(new Date(order.tanggalPotret), "p • d MMM", { locale: localeId })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`rounded-full border-2 font-black hidden sm:flex ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </Badge>
                        <Link href={`/orders/${order.id}`}>
                          <Button size="icon" variant="ghost" className="rounded-full hover:bg-blue-100 text-blue-600 transition-colors">
                            <ChevronRightIcon className="w-5 h-5" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {activeJobs.length > 5 && (
                  <Link href="/orders" className="text-center">
                    <Button variant="ghost" className="text-sm font-bold text-primary hover:bg-slate-50 w-full mt-2 rounded-xl">Lihat Semua Order Aktif</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-500 font-medium text-sm">
                Belum ada jadwal pemotretan aktif.
              </div>
            )}
          </section>

          {/* New Events from My Mitra */}
          <MitraEventsSection clerkId={clerkId} />
        </div>

        {/* Kolom Kanan: Tips */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-emerald-900 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <CameraIcon size={80} />
            </div>
            <CardHeader>
              <CardTitle className="text-lg font-black">Tips Framic</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-100 text-sm leading-relaxed font-medium">
                Respon cepat di bawah 1 jam meningkatkan peluang order Anda diterima kustomer hingga 80%. Jangan lupa upload minimal 5 foto h+1 pemotretan ya!
              </p>
            </CardContent>
          </Card>
        </div>
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

function PendingInvitations({ clerkId }: { clerkId: string }) {
  const queryClient = useQueryClient()
  const { data: response, isLoading } = useQuery({
    queryKey: ["pg-invitations", clerkId],
    queryFn: async () => {
      const res = await fetch("/api/photographers/me/invitations")
      return res.json() as Promise<{
        success: boolean;
        data: {
          mitraInvitations: any[];
          eventInvitations: any[]
        }
      }>
    },
  })

  const respondMitra = useMutation({
    mutationFn: async ({ contractId, status }: { contractId: string, status: string }) => {
      const res = await fetch(`/api/photographers/me/contracts/${contractId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error("Gagal merespons")
    },
    onSuccess: () => {
      toast.success("Respons berhasil dikirim")
      // Invalidate both invitations and orders to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ["pg-invitations"] })
      queryClient.invalidateQueries({ queryKey: ["photographer-orders"] })
    },
    onError: (e: any) => toast.error(e.message)
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
    onError: (e: any) => toast.error(e.message)
  })

  if (isLoading || !response?.success) return null
  const { mitraInvitations, eventInvitations } = response.data

  if (mitraInvitations.length === 0 && eventInvitations.length === 0) {
    return (
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Undangan Kerjasama</h2>
        </div>
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-500 font-medium text-sm">
          Belum ada undangan kerjasama baru saat ini.
        </div>
      </section>
    )
  }

  return (
    <section className="mb-10 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Undangan Kerjasama</h2>
        <Badge className="bg-indigo-600 rounded-full font-black px-3">
          {mitraInvitations.length + eventInvitations.length}
        </Badge>
      </div>

      <div className="grid gap-4">
        {/* 1. Mitra Invitations (Anggota Tetap) */}
        {mitraInvitations.map((inv) => (
          <Card key={inv.contractId} className="border-indigo-100 shadow-xl shadow-indigo-500/5 bg-white rounded-[2.5rem] overflow-hidden border-2 border-indigo-50/50">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl uppercase">
                      {inv.namaMitra.charAt(0)}
                    </div>
                    <div>
                      <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 font-black text-[10px] uppercase mb-1 tracking-widest">Undangan Anggota Tetap</Badge>
                      <h3 className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tight">{inv.namaMitra}</h3>
                    </div>
                  </div>

                  {inv.invitationMessage && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-sm text-slate-600 font-medium">
                      "{inv.invitationMessage}"
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Bagi Hasil</div>
                      <div className="font-black text-indigo-900 text-sm">{inv.photographerPercent}% PG</div>
                    </div>
                    <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                      <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Min. Fee</div>
                      <div className="font-black text-emerald-900 text-sm">Rp {inv.minimumFeePerEvent.toLocaleString('id-ID')}</div>
                    </div>
                    <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50 hidden sm:block">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Durasi</div>
                      <div className="font-black text-slate-900 text-sm">
                        {format(new Date(inv.tanggalMulai), "MMM yy")} - {format(new Date(inv.tanggalSelesai), "MMM yy")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end items-center md:items-stretch min-w-[160px]">
                  <Button
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-black rounded-xl shadow-lg shadow-indigo-200"
                    onClick={() => respondMitra.mutate({ contractId: inv.contractId, status: "accepted" })}
                    disabled={respondMitra.isPending}
                  >
                    {respondMitra.isPending ? "..." : "Terima"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100"
                    onClick={() => respondMitra.mutate({ contractId: inv.contractId, status: "rejected" })}
                    disabled={respondMitra.isPending}
                  >
                    Tolak
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* 2. Event Invitations (Per-Event) */}
        {eventInvitations.map((inv) => (
          <Card key={inv.entryId} className="border-amber-100 shadow-xl shadow-amber-500/5 bg-white rounded-[2.5rem] overflow-hidden border-2 border-amber-50/50">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-black text-[10px] uppercase mb-1 tracking-widest">Undangan Event</Badge>
                      <h3 className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tight">{inv.namaEvent}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Oleh {inv.namaMitra}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                        <BanknoteIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fee Tawaran</div>
                        <div className="font-black text-slate-900">Rp {inv.feeAmount.toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                        <ClockIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tanggal</div>
                        <div className="font-black text-slate-900">{format(new Date(inv.tanggalMulai), "d MMM yyyy")}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-3 justify-end items-center md:items-stretch min-w-[160px]">
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600 font-black rounded-xl shadow-lg shadow-amber-200"
                    onClick={() => respondEvent.mutate({ eventId: inv.eventId, entryId: inv.entryId, status: "accepted" })}
                    disabled={respondEvent.isPending}
                  >
                    {respondEvent.isPending ? "..." : "Terima"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100"
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
    </section>
  )
}

function MitraEventsSection({ clerkId }: { clerkId: string }) {
  const { data: response, isLoading } = useQuery({
    queryKey: ["photographer-mitra-events", clerkId, "my-mitra-only"],
    queryFn: async () => {
      const res = await fetch("/api/events?limit=5&myMitraOnly=true")
      if (!res.ok) throw new Error("Gagal mengambil data event")
      return res.json() as Promise<{ success: boolean; data: any[] }>
    },
  })

  const events = response?.data || []

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-40 rounded-3xl" /></div>

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Event Baru dari Mitra</h2>
        {events.length > 0 && (
          <Badge className="bg-indigo-500 rounded-full font-black px-3">{events.length}</Badge>
        )}
      </div>

      {events.length > 0 ? (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id} className="border-indigo-100 shadow-md bg-indigo-50/30 overflow-hidden group hover:border-indigo-400 transition-all">
              <CardContent className="p-0 flex flex-col sm:flex-row items-stretch">
                <div className="sm:w-40 h-32 bg-slate-100 relative shrink-0 overflow-hidden">
                  {event.coverImageUrl ? (
                    <Image src={event.coverImageUrl} alt={event.namaEvent} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <TentIcon className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{event.namaEvent}</h3>
                    <div className="flex items-center gap-1 text-emerald-600 font-black">
                      <BanknoteIcon className="w-4 h-4" />
                      <span className="text-sm">Rp {(event.feePgPerEvent || 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> {format(new Date(event.tanggalMulai), "dd MMM yyyy", { locale: localeId })}</span>
                    {event.isOpenRecruitment && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-black text-[10px] h-5">Open Recruitment</Badge>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Link href={`/events/${event.id}`}>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 font-black rounded-xl px-6 gap-2">
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
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-500 font-medium text-sm">
          Belum ada event baru dari Mitra.
        </div>
      )}
    </section>
  )
}
