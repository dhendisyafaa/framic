"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { PhotographerCard } from "@/components/features/photographer/photographer-card"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import { Camera } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Photographer {
  id: string
  username: string | null
  bio: string | null
  kotaDomisili: string | null
  kategori: string[] | null
  ratingAverage: number | null
  ratingCount: number | null
  isAcceptingOrders: boolean | null
  portfolioUrls: string[] | null
  packageStartingFrom: number | null
  nama: string
  avatarUrl: string
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface PhotographerListProps {
  initialPhotographers: Photographer[]
  initialMeta: Meta
}

interface ApiResponse {
  success: boolean
  data: Photographer[]
  meta: Meta
}

export function PhotographerList({ initialPhotographers, initialMeta }: PhotographerListProps) {
  const searchParams = useSearchParams()

  const kota = searchParams.get("kota") || "all"
  const kategori = searchParams.get("kategori") || "all"
  const minRating = searchParams.get("minRating") || "0"
  const sortBy = searchParams.get("sortBy") || "rating"

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<ApiResponse>({
    queryKey: ["photographers", kota, kategori, minRating, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams()
      params.set("page", String(pageParam))
      params.set("limit", "12")
      if (kota !== "all") params.set("kota", kota)
      if (kategori !== "all") params.set("kategori", kategori)
      if (minRating !== "0") params.set("minRating", minRating)
      if (sortBy !== "rating") params.set("sortBy", sortBy)

      const res = await fetch(`/api/photographers?${params.toString()}`)
      if (!res.ok) {
        throw new Error("Gagal mengambil data fotografer")
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
          data: initialPhotographers,
          meta: initialMeta,
        },
      ],
      pageParams: [1],
    },
  })

  const photographers = data?.pages.flatMap((page) => page.data) || []
  const totalCount = data?.pages[0]?.meta.total ?? 0

  const loadMoreRef = useIntersectionObserver({
    callback: fetchNextPage,
    enabled: !!hasNextPage && !isFetchingNextPage,
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-muted/50 rounded-[32px] p-6 space-y-4">
              <Skeleton className="w-40 h-40 rounded-full mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-6 w-32 mx-auto" />
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 text-center py-20 bg-rose-500/10 rounded-3xl border border-rose-500/20 font-bold text-rose-500">
        Gagal memuat data fotografer. Silakan coba lagi.
      </div>
    )
  }

  return (
    <main className="flex-1 flex flex-col gap-8">
      <div className="flex items-center justify-between bg-card border border-muted p-4 rounded-[20px] shadow-sm">
        <span className="text-sm font-medium text-foreground">
          Menampilkan <span className="font-bold">{photographers.length}</span> dari {totalCount} fotografer
        </span>
        <div className="hidden sm:block h-px flex-1 mx-4 bg-muted" />
      </div>

      {photographers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {photographers.map((pg) => (
            <PhotographerCard key={pg.id} pg={pg} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-card border border-dashed border-muted rounded-[24px]">
          <div className="w-16 h-16 bg-card rounded-full border border-muted shadow-sm flex items-center justify-center">
            <Camera className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1 max-w-xs">
            <h3 className="font-medium text-lg">Tidak ada hasil</h3>
            <p className="text-sm text-muted-foreground">
              Maaf, tidak ada fotografer yang sesuai dengan kriteria filter Anda saat ini. Coba ubah filter atau reset.
            </p>
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

      {!hasNextPage && photographers.length > 0 && (
        <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
          Semua fotografer telah ditampilkan.
        </div>
      )}
    </main>
  )
}
