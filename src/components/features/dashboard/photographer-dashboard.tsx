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
        <Card className="mb-8 border-destructive/20 bg-card shadow-sm rounded-[24px] overflow-hidden animate-in zoom-in duration-500">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-14 h-14 bg-destructive/5 rounded-full flex items-center justify-center text-destructive border border-destructive/10 shrink-0">
              <AlertCircleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-base font-bold text-foreground mb-1">Lengkapi Profil Anda</h3>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Pastikan Anda sudah melengkapi username, minimal mempunyai 1 paket, dan upload portofolio. Akun fotografer yang belum lengkap tidak akan tampil di pencarian kustomer dan tidak bisa menerima order.
              </p>
            </div>
            <Link href="/dashboard/profile" className="shrink-0 w-full md:w-auto cursor-pointer">
              <Button className="w-full bg-[#CF4500] hover:bg-[#CF4500]/90 text-white font-bold rounded-full px-8 text-xs h-10 cursor-pointer">
                Lengkapi Sekarang
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground mb-2">Fotografer Dashboard</h1>
          <p className="text-sm text-muted-foreground">Kelola jadwal pemotretan dan konfirmasi order baru Anda di sini.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isProfileIncomplete && (
            <Link href="/dashboard/profile" className="cursor-pointer">
              <Button className="px-8 rounded-full font-bold shadow-sm h-11 bg-primary hover:bg-primary/95 text-primary-foreground text-xs cursor-pointer">
                Edit Profil
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
        <Card className="border-muted bg-card shadow-sm rounded-[24px]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted text-[#CF4500] rounded-full border border-muted/50">
                <BellIcon className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Order Baru</CardTitle>
                <div className="text-3xl font-medium text-foreground tracking-[-0.02em]">{pendingOrders.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted bg-card shadow-sm rounded-[24px]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted text-foreground rounded-full border border-muted/50">
                <ClockIcon className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Order Aktif</CardTitle>
                <div className="text-3xl font-medium text-foreground tracking-[-0.02em]">{activeJobs.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted bg-card shadow-sm rounded-[24px]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted text-foreground rounded-full border border-muted/50">
                <CheckCircle2Icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Order Selesai</CardTitle>
                <div className="text-3xl font-medium text-foreground tracking-[-0.02em]">
                  {ordersList.filter(o => o.status === "completed").length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted bg-card shadow-sm rounded-[24px] hover:border-primary/25 transition-all cursor-pointer">
          <Link href="/dashboard/contracts" className="block">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted text-foreground rounded-full border border-muted/50">
                  <FilePenIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Kontrak Saya</CardTitle>
                  <div className="flex items-center gap-1">
                    <div className="text-xs underline text-primary font-bold">Lihat MoU</div>
                    <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-muted bg-card shadow-sm rounded-[24px]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted text-foreground rounded-full border border-muted/50">
                <BanknoteIcon className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Pendapatan</CardTitle>
                <div className="text-xs font-bold text-foreground mt-1">Dalam Proses</div>
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
              <h2 className="text-xl font-medium tracking-tight text-foreground">Menunggu Konfirmasi</h2>
              {pendingOrders.length > 0 && (
                <Badge className="bg-accent text-white rounded-full font-bold px-2.5 py-0.5 text-[10px]">{pendingOrders.length}</Badge>
              )}
            </div>

            {pendingOrders.length > 0 ? (
              <div className="grid gap-4">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className="border-muted bg-card shadow-sm rounded-[24px] overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="border-accent/20 text-accent bg-accent/5 font-bold text-[9px] uppercase tracking-wider">Order Masuk</Badge>
                            <span className="font-bold text-foreground text-sm uppercase tracking-tight ml-2">#{order.id.slice(0, 8)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {format(new Date(order.tanggalPotret), "eeee, d MMMM yyyy", { locale: localeId })}
                          </div>
                        </div>
                        <Link href={`/orders/${order.id}`} className="cursor-pointer">
                          <Button size="sm" variant="outline" className="rounded-full font-bold px-5 text-xs h-9 hover:bg-muted/40 cursor-pointer">Detail Order</Button>
                        </Link>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                        <Button
                          variant="outline"
                          className="w-full sm:flex-1 rounded-full border-muted text-destructive hover:bg-destructive/5 hover:border-destructive/10 text-xs font-bold h-10"
                          onClick={() => actionMutation.mutate({
                            path: `orders/${order.id}/reject`,
                            invalidateKeys: ["photographer-orders"]
                          })}
                          disabled={actionMutation.isPending}
                        >
                          Tolak Order
                        </Button>
                        <Button
                          className="w-full sm:flex-1 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold h-10 shadow-sm"
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
              <div className="bg-card border border-muted rounded-[24px] p-8 text-center text-muted-foreground font-medium text-xs">
                Tidak ada order yang butuh konfirmasi segera.
              </div>
            )}
          </section>

          {/* Active Jobs */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-medium tracking-tight text-foreground">Jadwal Pengerjaan Aktif</h2>
              {activeJobs.length > 0 && (
                <Badge className="bg-primary text-primary-foreground rounded-full font-bold px-2.5 py-0.5 text-[10px]">{activeJobs.length}</Badge>
              )}
            </div>

            {activeJobs.length > 0 ? (
              <div className="grid gap-3">
                {activeJobs.slice(0, 5).map((order) => (
                  <Card key={order.id} className="border-muted bg-card shadow-sm hover:border-primary/20 transition-all rounded-[24px] overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-muted text-foreground rounded-full border border-muted/50 flex items-center justify-center shrink-0">
                          <CameraIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-xs uppercase tracking-tighter">Order #{order.id.slice(0, 8)}</div>
                          <div className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {format(new Date(order.tanggalPotret), "p • d MMM", { locale: localeId })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 border text-[9px] font-bold tracking-wider hidden sm:flex ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                        <Link href={`/orders/${order.id}`} className="cursor-pointer">
                          <Button size="icon" variant="ghost" className="rounded-full hover:bg-muted/50 text-foreground w-8 h-8 cursor-pointer">
                            <ChevronRightIcon className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {activeJobs.length > 5 && (
                  <Link href="/orders" className="text-center cursor-pointer">
                    <Button variant="ghost" className="text-xs font-bold text-primary hover:bg-muted/40 w-full mt-2 rounded-full h-10 cursor-pointer">Lihat Semua Order Aktif</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-card border border-muted rounded-[24px] p-8 text-center text-muted-foreground font-medium text-xs">
                Belum ada jadwal pemotretan aktif.
              </div>
            )}
          </section>

          {/* New Events from My Mitra */}
          <MitraEventsSection clerkId={clerkId} />
        </div>

        {/* Kolom Kanan: Tips */}
        <div className="space-y-6">
          <Card className="border-muted bg-[#141413] text-[#FCFBFA] overflow-hidden relative group rounded-[24px] p-2">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
              <CameraIcon size={80} />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-accent uppercase tracking-widest">Tips Framic</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#D1CDC7] text-xs leading-relaxed font-medium">
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
    case "ongoing": return "text-blue-600 border-blue-200 bg-blue-50"
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
          <h2 className="text-xl font-medium tracking-tight text-foreground">Undangan Kerjasama</h2>
        </div>
        <div className="bg-card border border-muted rounded-[24px] p-8 text-center text-muted-foreground font-medium text-xs">
          Belum ada undangan kerjasama baru saat ini.
        </div>
      </section>
    )
  }

  return (
    <section className="mb-10 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Undangan Kerjasama</h2>
        <Badge className="bg-accent text-white rounded-full font-bold px-2.5 py-0.5 text-[10px]">
          {mitraInvitations.length + eventInvitations.length}
        </Badge>
      </div>

      <div className="grid gap-4">
        {/* 1. Mitra Invitations (Anggota Tetap) */}
        {mitraInvitations.map((inv) => (
          <Card key={inv.contractId} className="border-muted bg-card rounded-[24px] overflow-hidden shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted text-foreground border border-muted/50 rounded-full flex items-center justify-center font-bold text-base uppercase">
                      {inv.namaMitra.charAt(0)}
                    </div>
                    <div>
                      <Badge variant="outline" className="border-accent/20 text-accent bg-accent/5 font-bold text-[9px] uppercase tracking-wider mb-1">Undangan Anggota Tetap</Badge>
                      <h3 className="font-medium text-foreground text-base leading-tight uppercase tracking-tight">{inv.namaMitra}</h3>
                    </div>
                  </div>

                  {inv.invitationMessage && (
                    <div className="bg-background p-4 rounded-[16px] border border-muted italic text-xs text-muted-foreground leading-relaxed">
                      "{inv.invitationMessage}"
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-background rounded-[16px] border border-muted">
                      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Bagi Hasil</div>
                      <div className="font-bold text-foreground text-xs">{inv.photographerPercent}% PG</div>
                    </div>
                    <div className="p-3 bg-background rounded-[16px] border border-muted">
                      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Min. Fee</div>
                      <div className="font-bold text-foreground text-xs">Rp {inv.minimumFeePerEvent.toLocaleString('id-ID')}</div>
                    </div>
                    <div className="p-3 bg-background rounded-[16px] border border-muted hidden sm:block">
                      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Durasi</div>
                      <div className="font-bold text-foreground text-xs">
                        {format(new Date(inv.tanggalMulai), "MMM yy")} - {format(new Date(inv.tanggalSelesai), "MMM yy")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end items-center md:items-stretch min-w-[160px]">
                  <Button
                    className="flex-1 bg-[#141413] hover:bg-[#141413]/90 text-white font-bold rounded-full text-xs shadow-sm h-10"
                    onClick={() => respondMitra.mutate({ contractId: inv.contractId, status: "accepted" })}
                    disabled={respondMitra.isPending}
                  >
                    {respondMitra.isPending ? "..." : "Terima"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full border-muted text-muted-foreground font-bold hover:bg-destructive/5 hover:text-destructive hover:border-destructive/10 text-xs h-10"
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
          <Card key={inv.entryId} className="border-muted bg-card rounded-[24px] overflow-hidden shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted text-[#CF4500] border border-muted/50 rounded-full flex items-center justify-center shrink-0">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <Badge variant="outline" className="border-accent/20 text-accent bg-accent/5 font-bold text-[9px] uppercase tracking-wider mb-1">Undangan Event</Badge>
                      <h3 className="font-medium text-foreground text-base leading-tight uppercase tracking-tight">{inv.namaEvent}</h3>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Oleh {inv.namaMitra}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-muted text-[#CF4500] border border-muted/50 rounded-full">
                        <BanknoteIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Fee Tawaran</div>
                        <div className="font-bold text-foreground text-xs">Rp {inv.feeAmount.toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-muted text-[#CF4500] border border-muted/50 rounded-full">
                        <ClockIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Tanggal</div>
                        <div className="font-bold text-foreground text-xs">{format(new Date(inv.tanggalMulai), "d MMM yyyy")}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-3 justify-end items-center md:items-stretch min-w-[160px]">
                  <Button
                    className="flex-1 bg-[#141413] hover:bg-[#141413]/90 text-white font-bold rounded-full text-xs shadow-sm h-10"
                    onClick={() => respondEvent.mutate({ eventId: inv.eventId, entryId: inv.entryId, status: "accepted" })}
                    disabled={respondEvent.isPending}
                  >
                    {respondEvent.isPending ? "..." : "Terima"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full border-muted text-muted-foreground font-bold hover:bg-destructive/5 hover:text-destructive hover:border-destructive/10 text-xs h-10"
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

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-40 rounded-[24px]" /></div>

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Event Baru dari Mitra</h2>
        {events.length > 0 && (
          <Badge className="bg-primary text-primary-foreground rounded-full font-bold px-2.5 py-0.5 text-[10px]">{events.length}</Badge>
        )}
      </div>

      {events.length > 0 ? (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id} className="border-muted bg-card rounded-[24px] overflow-hidden shadow-sm hover:border-primary/20 transition-all">
              <CardContent className="p-0 flex flex-col sm:flex-row items-stretch">
                <div className="sm:w-40 h-32 bg-muted relative shrink-0 overflow-hidden rounded-[16px] m-4">
                  {event.coverImageUrl ? (
                    <Image src={event.coverImageUrl} alt={event.namaEvent} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/35 border border-muted/50 rounded-[16px]">
                      <TentIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-6 pl-2 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-foreground text-sm uppercase tracking-tight">{event.namaEvent}</h3>
                    <div className="flex items-center gap-1 text-[#CF4500] font-bold">
                      <BanknoteIcon className="w-3.5 h-3.5" />
                      <span className="text-xs">Rp {(event.feePgPerEvent || 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> {format(new Date(event.tanggalMulai), "dd MMM yyyy", { locale: localeId })}</span>
                    {event.isOpenRecruitment && (
                      <Badge variant="outline" className="border-accent/20 text-accent bg-accent/5 font-bold text-[9px] tracking-wide h-5">Open Recruitment</Badge>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link href={`/events/${event.id}`} className="cursor-pointer">
                      <Button size="sm" className="bg-[#141413] hover:bg-[#141413]/90 text-white font-bold rounded-full px-6 gap-2 text-xs h-9 cursor-pointer">
                        Lihat Detail <ChevronRightIcon className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-muted rounded-[24px] p-8 text-center text-muted-foreground font-medium text-xs">
          Belum ada event baru dari Mitra.
        </div>
      )}
    </section>
  )
}
