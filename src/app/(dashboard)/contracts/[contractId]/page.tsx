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

  const rawType = searchParams.get("type")

  // Redirect ke not-found jika type tidak valid
  if (!rawType || (rawType !== "mitra" && rawType !== "event")) {
    notFound()
  }

  const type = rawType as ContractType

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["contract-detail", contractId, type],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${contractId}?type=${type}`)
      if (res.status === 403) throw new Error("Anda tidak memiliki akses ke kontrak ini")
      if (res.status === 404) throw new Error("Kontrak tidak ditemukan")
      if (!res.ok) throw new Error("Gagal memuat data kontrak")
      return res.json() as Promise<ApiResponse>
    },
  })

  if (isLoading) return <ContractPageSkeleton />

  if (error || !response?.success) {
    return (
      <div className="container mx-auto p-10 text-center">
        <div className="text-rose-500 font-black text-xl mb-2">Terjadi Kesalahan</div>
        <div className="text-slate-500 font-medium">
          {(error as Error)?.message || "Data tidak ditemukan"}
        </div>
      </div>
    )
  }

  const contract = response.data
  const currentUserId = user?.id ?? ""

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl animate-in fade-in duration-700">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-sm mb-6 group"
      >
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Dashboard
      </Link>

      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
          <FileTextIcon className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {type === "mitra" ? "Kontrak Anggota Tetap" : "Kontrak Per-Event"}
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            ID: {contractId.slice(0, 8)}...{contractId.slice(-8)}
          </p>
        </div>
      </div>

      {/* 2-column layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
