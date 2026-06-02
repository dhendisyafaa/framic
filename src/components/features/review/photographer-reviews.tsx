"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"

interface Review {
  id: string
  orderId: string
  photographerId: string
  customerClerkId: string
  rating: number
  komentar: string | null
  createdAt: string | Date
  customerName: string
  customerAvatarUrl: string
}

interface PhotographerReviewsProps {
  photographerId: string
  initialReviews: Review[]
  initialCount: number
}

interface ApiResponse {
  success: boolean
  data: Review[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function PhotographerReviews({
  photographerId,
  initialReviews,
  initialCount,
}: PhotographerReviewsProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ApiResponse>({
    queryKey: ["photographer-reviews", photographerId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/reviews/photographer/${photographerId}?page=${pageParam}&limit=5`
      )
      if (!res.ok) {
        throw new Error("Gagal mengambil ulasan")
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
          data: initialReviews,
          meta: {
            total: initialCount,
            page: 1,
            limit: 5,
            totalPages: Math.ceil(initialCount / 5) || 1,
          },
        },
      ],
      pageParams: [1],
    },
  })

  const reviews = data?.pages.flatMap((page) => page.data) || []

  const loadMoreRef = useIntersectionObserver({
    callback: fetchNextPage,
    enabled: !!hasNextPage && !isFetchingNextPage,
  })

  return (
    <div className="flex flex-col gap-6 mt-6">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Apa Kata Kustomer ({initialCount})
      </h2>
      <div className="flex flex-col gap-6">
        {reviews.length > 0 ? (
          <>
            {reviews.map((rev, i) => (
              <div key={i} className="flex flex-col gap-3 pb-6 border-b border-muted last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black text-sm uppercase tracking-widest overflow-hidden">
                      {rev.customerAvatarUrl ? (
                        <img
                          src={rev.customerAvatarUrl}
                          alt={rev.customerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (rev.customerName || "C").slice(0, 1)
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground">
                        {(() => {
                          const name = rev.customerName || "Customer"
                          if (name.length <= 2) return name + "*"
                          return name.slice(0, 2) + "****" + name.slice(-1)
                        })()}
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            className={cn(
                              "w-3 h-3",
                              j < rev.rating ? "fill-accent text-accent" : "text-muted"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(rev.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  "{rev.komentar || "Tidak ada komentar."}"
                </p>
              </div>
            ))}

            {/* Infinite Scroll Trigger */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isFetchingNextPage ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
                ) : (
                  <p className="text-xs text-muted-foreground font-medium">
                    Scroll down to load more reviews...
                  </p>
                )}
              </div>
            )}

            {!hasNextPage && reviews.length > 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground font-semibold">
                Semua ulasan telah ditampilkan.
              </div>
            )}
          </>
        ) : (
          <div className="py-12 bg-muted/10 rounded-2xl border border-muted flex items-center justify-center text-muted-foreground text-sm text-center">
            Belum ada ulasan untuk fotografer ini.
          </div>
        )}
      </div>
    </div>
  )
}
