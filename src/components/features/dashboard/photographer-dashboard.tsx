"use client"

import Link from "next/link"
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
  ArrowRightIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  XCircleIcon,
  FilePenIcon,
  TentIcon,
  InfoIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
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

  const queryClient = useQueryClient()
  const actionMutation = useMutation({
    mutationFn: async ({ path, method = "PATCH" }: { path: string, method?: string }) => {
      const res = await fetch(`/api/${path}`, { method })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal memproses order")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photographer-orders", clerkId] })
      toast.success("Berhasil memperbarui order")
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const ordersList = response?.data || []
  const pgProfile = profileRes?.data
  const pendingOrders = ordersList.filter(o => o.status === "pending")
  const activeJobs = ordersList.filter(o => ["confirmed", "dp_paid", "ongoing", "delivered"].includes(o.status))

  if (ordersLoading || profileLoading) return <DashboardSkeleton />

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Completeness Banner */}
      {pgProfile && (pgProfile.verificationStatus !== 'verified' || !pgProfile.username) && (
        <Card className="mb-8 border-amber-200 bg-amber-50 shadow-sm rounded-3xl overflow-hidden animate-in zoom-in duration-500">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangleIcon className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-black text-amber-900 mb-1">Peringatan: Lengkapi Profil Anda ⚠️</h3>
              <p className="text-sm text-amber-700 font-medium max-w-2xl">
                Pastikan Anda sudah melengkapi Username, Minimal 1 Paket, dan Portfolio. Akun yang belum lengkap tidak akan tampil di pencarian publik dan tidak bisa menerima order baru.
              </p>
            </div>
            <Link href="/dashboard/profile" className="shrink-0 w-full md:w-auto">
              <Button className="w-full bg-amber-600 hover:bg-amber-700 font-black rounded-2xl px-8 shadow-lg shadow-amber-200">
                Lengkapi Sekarang
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">Pro Photographer Dashboard 📸</h1>
          <p className="text-slate-500 font-medium tracking-tight">Kelola jadwal pemotretan dan konfirmasi order baru Anda di sini.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/profile">
            <Button className="rounded-full px-8 shadow-lg shadow-primary/20 bg-indigo-600 hover:bg-indigo-700 font-bold gap-2">
              <CameraIcon className="w-4 h-4" /> Lengkapi Profil & Paket
            </Button>
          </Link>
          {pgProfile && (
            <Link href={`/photographers/${pgProfile.id}`}>
              <Button variant="outline" className="rounded-full px-6 border-slate-200 font-bold">
                Lihat Profil Publik
              </Button>
            </Link>
          )}
          <Button variant="ghost" className="rounded-full px-6 font-bold text-slate-500 hover:text-indigo-600">
            Set Jadwal Off
          </Button>
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
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">New Order</CardTitle>
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
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Active Jobs</CardTitle>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{activeJobs.length}</div>
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
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Incoming Revenue</CardTitle>
                <div className="text-xl font-black text-slate-900 tracking-tighter">Dalam Proses</div>
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
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Completed</CardTitle>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">
                  {ordersList.filter(o => o.status === "completed").length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Pending & Ongoing Jobs */}
        <div className="lg:col-span-2 space-y-8">
          <PendingInvitations clerkId={clerkId} />

          {/* Pending Approval */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight underline decoration-rose-200 decoration-4 underline-offset-8">Menunggu Konfirmasi</h2>
              {pendingOrders.length > 0 && (
                <Badge className="bg-rose-500 rounded-full font-black px-3">{pendingOrders.length}</Badge>
              )}
            </div>

            {pendingOrders.length > 0 ? (
              <div className="grid gap-4">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className="border-slate-200 shadow-md shadow-rose-100/50 hover:shadow-lg transition-all border-l-4 border-l-rose-500 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <h3 className="font-bold text-slate-900 text-lg uppercase tracking-tight">Order #{order.id.slice(0, 8)}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                              <CalendarIcon className="w-4 h-4" />
                              {format(new Date(order.tanggalPotret), "eeee, d MMMM yyyy", { locale: localeId })}
                            </div>
                          </div>
                          <Link href={`/orders/${order.id}`}>
                            <Button size="sm" variant="outline" className="rounded-full font-bold">Detail</Button>
                          </Link>
                        </div>
                        <div className="flex items-center gap-3 mt-6">
                          <Button
                            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200"
                            onClick={() => actionMutation.mutate({ path: `orders/${order.id}/confirm` })}
                            disabled={actionMutation.isPending}
                          >
                            {actionMutation.isPending ? "Processing..." : "Konfirmasi Order"}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 rounded-xl border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-100"
                            onClick={() => actionMutation.mutate({ path: `orders/${order.id}/reject` })}
                            disabled={actionMutation.isPending}
                          >
                            Tolak Order
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm italic">Tidak ada order yang butuh konfirmasi segera</p>
              </div>
            )}
          </section>

          {/* Active Jobs */}
          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6 flex items-center gap-3">
              Jadwal Pengerjaan Aktif
              <Link href="/orders" className="text-sm font-bold text-primary hover:underline ml-auto">Lihat Semua</Link>
            </h2>

            <div className="space-y-4">
              {activeJobs.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <CameraIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 mb-0.5 uppercase tracking-tighter">Order #{order.id.slice(0, 8)}</div>
                      <div className="text-xs text-slate-500 font-medium italic lowercase flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {format(new Date(order.tanggalPotret), "p • d MMM", { locale: localeId })}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`rounded-full border-2 font-black ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
              {activeJobs.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-400 font-medium">Belum ada jadwal pemotretan aktif.</p>
                </div>
              )}
            </div>
          </section>

          {/* New Events from My Mitra */}
          <MitraEventsSection clerkId={clerkId} />
        </div>

        {/* Kolom Kanan: Stats & Tips */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-indigo-900 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <CameraIcon size={80} />
            </div>
            <CardHeader>
              <CardTitle className="text-lg font-black italic">Tips Pro Framic 💡</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-indigo-100 text-sm leading-relaxed font-medium">
                Respon cepat di bawah 1 jam meningkatkan peluang order Anda diterima kustomer hingga 80%. Jangan lupa upload minimal 5 foto h+1 pemotretan ya!
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Status Ketersediaan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-emerald-700 font-bold text-sm">Online & Tersedia</span>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
              <p className="text-xs text-slate-500 mt-3 font-medium leading-relaxed">
                Kustomer bisa melihat tombol booking di profil Anda. Anda bisa mematikan ini sementara jika sedang cuti.
              </p>
              <Button variant="outline" className="w-full mt-4 rounded-xl font-bold border-slate-200">Ubah Status</Button>
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
      toast.success("Respons dikirim")
      queryClient.invalidateQueries({ queryKey: ["pg-invitations"] })
      // also invalidate orders or dashboard if needed
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
      toast.success("Respons dikirim")
      queryClient.invalidateQueries({ queryKey: ["pg-invitations"] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  if (isLoading || !response?.success) return null
  const { mitraInvitations, eventInvitations } = response.data

  if (mitraInvitations.length === 0 && eventInvitations.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-black text-slate-900 tracking-tight underline decoration-indigo-200 decoration-4 underline-offset-8 mb-6">Undangan Mitra & Event</h2>
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-500 font-medium text-sm">
          Belum ada undangan masuk.
        </div>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight underline decoration-indigo-200 decoration-4 underline-offset-8">Undangan Mitra & Event</h2>
        <Badge className="bg-indigo-500 rounded-full font-black px-3">{mitraInvitations.length + eventInvitations.length}</Badge>
      </div>

      <div className="grid gap-4">
        {mitraInvitations.map(inv => (
          <Card key={inv.contractId} className="border-indigo-100 shadow-md bg-indigo-50/30">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 mb-2 font-black text-[10px] uppercase">
                    Anggota Tetap
                  </Badge>
                  <h3 className="font-bold text-slate-900 text-lg">Mitra: {inv.namaMitra}</h3>
                  <p className="text-sm text-slate-500 font-medium">Bagi hasil: {inv.photographerPercent}% (min. Rp {(inv.minimumFeePerEvent ?? 0).toLocaleString("id-ID")})</p>
                </div>
              </div>
              {inv.invitationMessage && (
                <div className="text-sm italic text-slate-600 bg-white p-3 rounded-xl border border-slate-100 mb-4">
                  "{inv.invitationMessage}"
                </div>
              )}
              {inv.invitationStatus === "accepted" ? (
                <div className="bg-indigo-100/50 border border-indigo-200 rounded-xl p-4 text-center">
                  <p className="text-indigo-700 font-bold text-sm mb-1">✅ Undangan Disetujui</p>
                  <p className="text-indigo-600/80 text-xs mb-4">Menunggu penandatanganan MoU untuk mengaktifkan kontrak.</p>
                  <Link href={`/contracts/${inv.contractId}?type=mitra`}>
                    <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold gap-2">
                      <FilePenIcon size={14} />
                      Tanda Tangani MoU
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => respondMitra.mutate({ contractId: inv.contractId, status: "accepted" })} disabled={respondMitra.isPending}>Terima</Button>
                  <Button size="sm" variant="outline" className="flex-1 text-rose-600" onClick={() => respondMitra.mutate({ contractId: inv.contractId, status: "rejected" })} disabled={respondMitra.isPending}>Tolak</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {eventInvitations.map(inv => (
          <Card key={inv.entryId} className="border-emerald-100 shadow-md bg-emerald-50/30">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 mb-2 font-black text-[10px] uppercase">
                    Per-Event
                  </Badge>
                  <h3 className="font-bold text-slate-900 text-lg">Event: {inv.namaEvent}</h3>
                  <p className="text-sm text-slate-500 font-medium">Mitra: {inv.namaMitra} | Fee: Rp {(inv.feeAmount ?? 0).toLocaleString("id-ID")}</p>
                </div>
              </div>
              {inv.invitationMessage && (
                <div className="text-sm italic text-slate-600 bg-white p-3 rounded-xl border border-slate-100 mb-4">
                  "{inv.invitationMessage}"
                </div>
              )}
              {inv.invitationStatus === "accepted" ? (
                <div className="bg-emerald-100/50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-emerald-700 font-bold text-sm mb-1">✅ Undangan Disetujui</p>
                  <p className="text-emerald-600/80 text-xs mb-4">Menunggu finalisasi MoU event.</p>
                  <Link href={`/contracts/${inv.eventInvitationId || inv.entryId}?type=event`}>
                    <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold gap-2">
                      <FilePenIcon size={14} />
                      Tanda Tangani MoU
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => respondEvent.mutate({ eventId: inv.eventId, entryId: inv.entryId, status: "accepted" })} disabled={respondEvent.isPending}>Terima</Button>
                  <Button size="sm" variant="outline" className="flex-1 text-rose-600" onClick={() => respondEvent.mutate({ eventId: inv.eventId, entryId: inv.entryId, status: "rejected" })} disabled={respondEvent.isPending}>Tolak</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function MitraEventsSection({ clerkId }: { clerkId: string }) {
  const { data: response, isLoading } = useQuery({
    queryKey: ["photographer-mitra-events", clerkId],
    queryFn: async () => {
      const res = await fetch("/api/events?limit=5&includeDrafts=false")
      if (!res.ok) throw new Error("Gagal mengambil data event")
      return res.json() as Promise<{ success: boolean; data: any[] }>
    },
  })

  // In real case, we would filter event that come from mitra where this PG is a member.
  // For now we show latest public events as "New Opportunities"
  const events = response?.data || []

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-40 rounded-3xl" /></div>

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight underline decoration-indigo-200 decoration-4 underline-offset-8">Event Baru dari Mitra Saya</h2>
      </div>

      {events.length > 0 ? (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id} className="border-slate-200 shadow-sm rounded-3xl overflow-hidden group hover:border-indigo-200 transition-colors">
              <CardContent className="p-0 flex items-stretch">
                <div className="w-32 bg-slate-100 relative shrink-0">
                  {event.coverImageUrl ? (
                    <Image src={event.coverImageUrl} alt={event.namaEvent} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <TentIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm mb-2 group-hover:text-indigo-600 transition-colors">{event.namaEvent}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {format(new Date(event.tanggalMulai), "dd MMM yyyy", { locale: localeId })}</span>
                    <span className="flex items-center gap-1 text-indigo-600"><BanknoteIcon className="w-3 h-3" /> Rp {(event.feePgTetap || 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Link href={`/events/${event.id}`}>
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black uppercase tracking-widest gap-1 hover:bg-slate-100 rounded-lg">
                        Lihat <ChevronRightIcon className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
          <p className="text-slate-400 font-bold text-sm italic">Belum ada event baru dari Mitra Anda.</p>
        </div>
      )}
    </section>
  )
}
