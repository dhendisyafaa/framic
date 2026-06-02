"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { EventCard } from "@/components/features/event/event-card"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import { Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface EventData {
  id: string
  namaEvent: string
  tanggalMulai: string | Date
  tanggalSelesai?: string | Date | null
  lokasi?: string | null
  coverImageUrl?: string | null
  isOpenRecruitment?: boolean
  feePgPerEvent?: number | null
  kuotaPgPerEvent?: number | null
  slotTerisi?: number | null
  deadlineRequest?: string | Date | null
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface EventListProps {
  initialEvents: EventData[]
  initialMeta: Meta
}

interface ApiResponse {
  success: boolean
  data: EventData[]
  meta: Meta
}

export function EventList({ initialEvents, initialMeta }: EventListProps) {
  const searchParams = useSearchParams()
  const openOnly = searchParams.get("openOnly") === "true"

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<ApiResponse>({
    queryKey: ["events", openOnly],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/events?page=${pageParam}&limit=12&openOnly=${openOnly}`
      )
      if (!res.ok) {
        throw new Error("Gagal mengambil data event")
      }
      return res.json() as Promise<ApiResponse>
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta
      return page < totalPages ? page + 1 : undefined
    },
    initialData: {
      pages: [
        {
          success: true,
          data: initialEvents,
          meta: initialMeta,
        },
      ],
      pageParams: [1],
    },
  })

  const events = data?.pages.flatMap((page) => page.data) || []

  const loadMoreRef = useIntersectionObserver({
    callback: fetchNextPage,
    enabled: !!hasNextPage && !isFetchingNextPage,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border border-muted rounded-2xl p-4 space-y-4 bg-card">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-20 bg-rose-500/10 rounded-3xl border border-rose-500/20 font-bold text-rose-500">
        Gagal memuat data event. Silakan coba lagi.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              showRecruitmentInfo={ev.isOpenRecruitment}
            />
          ))}
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center gap-6 bg-muted/10 border-2 border-dashed border-muted rounded-[3rem]">
          <div className="w-20 h-20 bg-card rounded-3xl flex items-center justify-center shadow-sm">
            <Calendar className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-black text-xl mb-1">Event Tidak Ditemukan</p>
            <p className="text-muted-foreground font-medium">Coba ganti filter atau jelajahi mitra kami.</p>
          </div>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          ) : (
            <p className="text-xs text-muted-foreground font-medium">Scroll ke bawah untuk memuat lebih banyak</p>
          )}
        </div>
      )}

      {!hasNextPage && events.length > 0 && (
        <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
          Semua event telah ditampilkan.
        </div>
      )}
    </div>
  )
}
