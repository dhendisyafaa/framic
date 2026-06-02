"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2Icon, ChevronRightIcon } from "lucide-react"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import { Skeleton } from "@/components/ui/skeleton"

interface Mitra {
  id: string
  namaOrganisasi: string
  tipeMitra: string
  websiteUrl: string | null
  clerkId: string
  totalEvent: number
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface MitraListProps {
  initialMitra: Mitra[]
  initialMeta: Meta
}

interface ApiResponse {
  success: boolean
  data: Mitra[]
  meta: Meta
}

export function MitraList({ initialMitra, initialMeta }: MitraListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<ApiResponse>({
    queryKey: ["mitra-list"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/mitra?page=${pageParam}&limit=12`)
      if (!res.ok) {
        throw new Error("Gagal mengambil data mitra")
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
          data: initialMitra,
          meta: initialMeta,
        },
      ],
      pageParams: [1],
    },
  })

  const mitraList = data?.pages.flatMap((page) => page.data) || []

  const loadMoreRef = useIntersectionObserver({
    callback: fetchNextPage,
    enabled: !!hasNextPage && !isFetchingNextPage,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-muted rounded-[2.5rem] p-8 space-y-6 bg-card">
            <div className="flex items-center justify-between">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4 rounded-xl" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
            </div>
            <div className="pt-6 border-t border-muted flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-20 bg-rose-500/10 rounded-3xl border border-rose-500/20 font-bold text-rose-500">
        Gagal memuat data mitra. Silakan coba lagi.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {mitraList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mitraList.map((mitra) => (
            <Link key={mitra.id} href={`/mitra/${mitra.id}`}>
              <Card className="group border-muted bg-card text-foreground rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-muted/80 hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-8 flex flex-col justify-between h-full">
                  <div>
                    {/* Top Row: Icon + Type Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                        <Building2Icon className="w-7 h-7" />
                      </div>
                      <Badge className="bg-muted/60 text-muted-foreground border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-none">
                        {mitra.tipeMitra?.replace("_", " ")}
                      </Badge>
                    </div>

                    {/* Mitra Info */}
                    <h3 className="text-2xl font-black text-foreground group-hover:text-accent transition-colors mb-2 truncate">
                      {mitra.namaOrganisasi}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      {mitra.websiteUrl ? (
                        <span className="truncate max-w-[200px]">{mitra.websiteUrl}</span>
                      ) : (
                        <span>Verified Mitra Partner</span>
                      )}
                    </p>
                  </div>

                  {/* Bottom Bordered Footer */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-muted">
                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm">
                      <span className="text-accent font-black">{mitra.totalEvent}</span> Event Aktif
                    </div>
                    <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-300">
                      <ChevronRightIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-muted/5 rounded-[3rem] border-2 border-dashed border-muted">
          <Building2Icon className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Belum ada mitra terverifikasi yang ditampilkan.</p>
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

      {!hasNextPage && mitraList.length > 0 && (
        <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
          Semua mitra telah ditampilkan.
        </div>
      )}
    </div>
  )
}
