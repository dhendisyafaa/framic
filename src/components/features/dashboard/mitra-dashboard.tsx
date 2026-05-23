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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground mb-2">Mitra Dashboard</h1>
          <p className="text-sm text-muted-foreground">Pantau performa event dan kelola tim fotografer Anda secara terpusat.</p>
        </div>
        <Link href="/mitra/events">
          <Button className="rounded-full px-8 shadow-sm bg-primary hover:bg-primary/95 gap-2 font-bold h-11 text-xs">
            <PlusCircleIcon className="w-4 h-4" />
            Kelola Event
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Card className="border-muted bg-card shadow-sm rounded-[24px]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted text-foreground rounded-full border border-muted/50">
                <UsersIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">PG Aktif</CardTitle>
                <div className="text-3xl font-medium text-foreground tracking-[-0.02em]">{pgAktif}</div>
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
              <div>
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Pending Expiry</CardTitle>
                <div className="text-3xl font-medium text-foreground tracking-[-0.02em]">{pgPendingExpiry}</div>
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
              <div>
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Event Published</CardTitle>
                <div className="text-3xl font-medium text-foreground tracking-[-0.02em]">{eventPublished}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted bg-card shadow-sm rounded-[24px]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted text-foreground rounded-full border border-muted/50">
                <FileTextIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Event Draft</CardTitle>
                <div className="text-3xl font-medium text-foreground tracking-[-0.02em]">{eventDraft}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Widget 1 — Ringkasan Anggota Tetap */}
        <Card className="border-muted bg-card shadow-sm rounded-[32px] overflow-hidden">
          <CardHeader className="p-6 bg-[#141413] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-accent" />
                <CardTitle className="text-base font-medium">Anggota Tetap</CardTitle>
              </div>
              <Link href="/mitra/photographers">
                <Button size="sm" variant="ghost" className="text-muted hover:text-white hover:bg-white/10 rounded-full gap-1 text-[10px] font-bold">
                  Kelola <ChevronRightIcon className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {photographers.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-xs font-medium">Belum ada fotografer tetap.</p>
                <Link href="/mitra/photographers">
                  <Button variant="outline" size="sm" className="mt-4 rounded-full font-bold border-muted hover:bg-muted/40 text-xs">
                    + Undang Fotografer
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {photographers.slice(0, 4).map(pg => (
                  <div key={pg.contractId} className="flex items-center justify-between p-3 rounded-[16px] bg-background border border-muted">
                    <div>
                      <div className="font-bold text-foreground text-xs">{pg.nama}</div>
                      {pg.tanggalSelesai && (
                        <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                          s.d. {format(new Date(pg.tanggalSelesai), "d MMM yyyy", { locale: localeId })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`rounded-full text-[9px] font-bold tracking-wider px-2.5 py-0.5 border ${pg.contractStatus === "active"
                          ? "text-accent border-accent/20 bg-accent/5"
                          : pg.contractStatus === "pending_expiry"
                            ? "text-accent border-accent/20 bg-accent/5 font-bold"
                            : "text-muted-foreground border-muted bg-[#F3F0EE]"
                          }`}
                      >
                        {pg.contractStatus ?? "ACCEPTED"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {photographers.length > 4 && (
                  <Link href="/mitra/photographers" className="block text-center text-[10px] text-primary font-bold hover:underline pt-1">
                    +{photographers.length - 4} lainnya
                  </Link>
                )}
                <Link href="/mitra/photographers">
                  <Button variant="outline" className="w-full mt-2 rounded-full border-muted font-bold text-xs h-10 hover:bg-muted/40">
                    Kelola Fotografer
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 2 — Ringkasan Event */}
        <Card className="border-muted bg-card shadow-sm rounded-[32px] overflow-hidden">
          <CardHeader className="p-6 bg-[#141413] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TentIcon className="w-5 h-5 text-accent" />
                <CardTitle className="text-base font-medium">Event</CardTitle>
              </div>
              <Link href="/mitra/events">
                <Button size="sm" variant="ghost" className="text-muted hover:text-white hover:bg-white/10 rounded-full gap-1 text-[10px] font-bold">
                  Kelola <ChevronRightIcon className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {allEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-xs font-medium">Belum ada event yang dibuat.</p>
                <Link href="/mitra/events">
                  <Button variant="outline" size="sm" className="mt-4 rounded-full font-bold border-muted hover:bg-muted/40 text-xs">
                    + Buat Event
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-[16px] bg-background border border-muted">
                    <div>
                      <div className="font-bold text-foreground text-xs truncate max-w-[180px]">{event.namaEvent}</div>
                      <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        {format(new Date(event.tanggalMulai), "d MMM yyyy", { locale: localeId })}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`rounded-full text-[9px] font-bold tracking-wider px-2.5 py-0.5 border shrink-0 ${event.isPublished
                        ? "text-accent border-accent/20 bg-accent/5"
                        : "text-muted-foreground border-muted bg-[#F3F0EE]"
                        }`}
                    >
                      {event.isPublished ? "PUBLISHED" : "DRAFT"}
                    </Badge>
                  </div>
                ))}
                {allEvents.length > 3 && (
                  <Link href="/mitra/events" className="block text-center text-[10px] text-primary font-bold hover:underline pt-1">
                    +{allEvents.length - 3} event lainnya
                  </Link>
                )}
                <Link href="/mitra/events">
                  <Button variant="outline" className="w-full mt-2 rounded-full border-muted font-bold text-xs h-10 hover:bg-muted/40">
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

