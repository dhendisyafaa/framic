"use client"

import { use } from "react"
import { useSearchParams, notFound } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "@clerk/nextjs"
import { ContractReviewCard, type ContractData } from "@/components/features/mitra/contract-review-card"
import { SignPanel } from "@/components/features/mitra/sign-panel"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeftIcon, FileTextIcon } from "lucide-react"
import Link from "next/link"

// ---------------------------------------------------------------------------
// Halaman Detail Kontrak — Fase 7 MVP
// - Read-only review of contract terms
// - E-sign panel dengan checkbox konfirmasi
// ---------------------------------------------------------------------------

type ContractType = "mitra" | "event"

interface ApiResponse {
  success: boolean
  data: ContractData
  error?: string
}

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>
}) {
  const { contractId } = use(params)
  const searchParams = useSearchParams()
  const { user } = useUser()
  const type = (searchParams.get("type") as ContractType) || "mitra"

  const { data: response, isLoading } = useQuery({
    queryKey: ["contract-detail", contractId, type],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${contractId}?type=${type}`)
      if (!res.ok) throw new Error("Gagal mengambil detail kontrak")
      return res.json() as Promise<ApiResponse>
    },
  })

  if (isLoading) return <ContractPageSkeleton />
  if (!response?.success || !response.data) return notFound()

  const contract = response.data
  const currentUserId = user?.id || ""

  return (
    <div className="container mx-auto p-8 max-w-5xl space-y-8 pb-20">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard/contracts" className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeftIcon className="w-6 h-6 text-muted-foreground" />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileTextIcon className="w-5 h-5 text-primary" />
            <span className="text-xs font-black text-primary uppercase tracking-widest">
              MoU Digital Kerjasama {type === "mitra" ? "Tetap" : "Event"}
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Tinjau Ketentuan Kerjasama
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Kolom kiri: Review Terms */}
        <div className="lg:col-span-2">
          <ContractReviewCard type={type} data={contract} />
        </div>

        {/* Kolom kanan: E-Sign Panel (sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <SignPanel
              contractId={contractId}
              type={type}
              currentUserId={currentUserId}
              mitraClerkId={contract.mitraClerkId}
              photographerClerkId={contract.photographerClerkId}
              photographerSignedAt={contract.photographerSignedAt}
              mitraSignedAt={contract.mitraSignedAt}
              bothSigned={contract.bothSigned}
              invitationStatus={contract.invitationStatus}
              photographerNama={contract.photographer.nama}
              mitraName={contract.mitra.namaOrganisasi}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ContractPageSkeleton() {
  return (
    <div className="container mx-auto p-8 max-w-5xl animate-pulse">
      <Skeleton className="h-5 w-36 mb-6" />
      <Skeleton className="h-12 w-80 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
        <div>
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  )
}
