"use client"

import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  UsersIcon,
  CalendarIcon,
  ChevronRightIcon,
  TentIcon,
  FileTextIcon,
  CheckCircle2Icon,
  ClockIcon,
  PlusCircleIcon,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MitraDashboard({ clerkId, mitraId }: MitraDashboardProps) {
  // Query 1 — Anggota tetap
  const { data: photographersResp, isLoading: isLoadingPg } = useQuery({
    queryKey: ["mitra-photographers", mitraId],
    queryFn: async () => {
      const res = await fetch("/api/mitra/me/photographers")
      if (!res.ok) throw new Error("Gagal memuat data fotografer")
      return res.json() as Promise<{ success: boolean; data: MitraPhotographerEntry[] }>
    },
  })

  // Query 2 — List semua event milik mitra ini (termasuk draft)
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

  // Derive stats
  const pgAktif = photographers.filter(p => p.contractStatus === "active").length
  const pgPendingExpiry = photographers.filter(p => p.contractStatus === "pending_expiry").length
  const eventPublished = allEvents.filter(e => e.isPublished).length
  const eventDraft = allEvents.filter(e => !e.isPublished).length

  // Recent events (latest 3)
  const recentEvents = allEvents.slice(0, 3)

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">Mitra Hub 🏛️</h1>
          <p className="text-slate-500 font-medium">Pantau event dan kelola fotografer Anda.</p>
        </div>
        <Link href="/mitra/events">
          <Button className="rounded-full px-8 shadow-lg shadow-primary/20 bg-indigo-900 hover:bg-slate-900 gap-2">
            <PlusCircleIcon className="w-4 h-4" />
            Kelola Event
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Card className="border-slate-200 shadow-sm bg-indigo-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                <UsersIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">PG Aktif</CardTitle>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{pgAktif}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-amber-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                <ClockIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pending Expiry</CardTitle>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{pgPendingExpiry}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-emerald-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                <CheckCircle2Icon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Event Published</CardTitle>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{eventPublished}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-slate-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 rounded-2xl text-slate-500">
                <FileTextIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Event Draft</CardTitle>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{eventDraft}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Widget 1 — Ringkasan Anggota Tetap */}
        <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-6 bg-indigo-900 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-indigo-300" />
                <CardTitle className="text-base font-black">Anggota Tetap</CardTitle>
              </div>
              <Link href="/mitra/photographers">
                <Button size="sm" variant="ghost" className="text-indigo-200 hover:text-white hover:bg-white/10 rounded-full gap-1 text-xs font-bold">
                  Kelola <ChevronRightIcon className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {photographers.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">Belum ada fotografer tetap.</p>
                <Link href="/mitra/photographers">
                  <Button variant="outline" size="sm" className="mt-4 rounded-full font-bold border-slate-200">
                    + Undang Fotografer
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {photographers.slice(0, 4).map(pg => (
                  <div key={pg.contractId} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{pg.nama}</div>
                      {pg.tanggalSelesai && (
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          s.d. {format(new Date(pg.tanggalSelesai), "d MMM yyyy", { locale: localeId })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`rounded-full text-[10px] font-black border-2 ${pg.contractStatus === "active"
                          ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                          : pg.contractStatus === "pending_expiry"
                            ? "text-amber-600 border-amber-200 bg-amber-50"
                            : "text-slate-400 border-slate-200 font-bold"
                          }`}
                      >
                        {pg.contractStatus?.toUpperCase() ?? "ACCEPTED"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {photographers.length > 4 && (
                  <Link href="/mitra/photographers" className="block text-center text-xs text-indigo-600 font-bold hover:underline pt-1">
                    +{photographers.length - 4} lainnya
                  </Link>
                )}
                <Link href="/mitra/photographers">
                  <Button variant="outline" className="w-full mt-2 rounded-2xl border-slate-200 font-bold text-sm">
                    Kelola Fotografer
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 2 — Ringkasan Event */}
        <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-6 bg-slate-900 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TentIcon className="w-5 h-5 text-slate-300" />
                <CardTitle className="text-base font-black">Event</CardTitle>
              </div>
              <Link href="/mitra/events">
                <Button size="sm" variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/10 rounded-full gap-1 text-xs font-bold">
                  Kelola <ChevronRightIcon className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {allEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">Belum ada event yang dibuat.</p>
                <Link href="/mitra/events">
                  <Button variant="outline" size="sm" className="mt-4 rounded-full font-bold border-slate-200">
                    + Buat Event
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-900 text-sm truncate max-w-[180px]">{event.namaEvent}</div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        {format(new Date(event.tanggalMulai), "d MMM yyyy", { locale: localeId })}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`rounded-full text-[10px] font-black border-2 shrink-0 ${event.isPublished
                        ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                        : "text-slate-500 border-slate-200 bg-slate-50"
                        }`}
                    >
                      {event.isPublished ? "PUBLISHED" : "DRAFT"}
                    </Badge>
                  </div>
                ))}
                {allEvents.length > 3 && (
                  <Link href="/mitra/events" className="block text-center text-xs text-indigo-600 font-bold hover:underline pt-1">
                    +{allEvents.length - 3} event lainnya
                  </Link>
                )}
                <Link href="/mitra/events">
                  <Button variant="outline" className="w-full mt-2 rounded-2xl border-slate-200 font-bold text-sm">
                    Kelola Event
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton — konsisten dengan DashboardSkeleton
// ---------------------------------------------------------------------------
function MitraDashboardSkeleton() {
  return (
    <div className="container mx-auto p-8 animate-pulse">
      <Skeleton className="h-8 w-64 mb-3" />
      <Skeleton className="h-4 w-48 mb-10" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </div>
  )
}
