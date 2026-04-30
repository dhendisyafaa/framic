"use client"

import { useQuery } from "@tanstack/react-query"
import { useUser } from "@clerk/nextjs"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { 
  FileTextIcon, 
  ClockIcon, 
  ChevronRightIcon,
  ShieldCheckIcon,
  Building2Icon
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function ContractsListPage() {
  const { user } = useUser()

  const { data: response, isLoading } = useQuery({
    queryKey: ["pg-contracts", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/photographers/me/contracts")
      if (!res.ok) throw new Error("Gagal mengambil daftar kontrak")
      return res.json() as Promise<{ success: boolean; data: any[] }>
    },
    enabled: !!user?.id,
  })

  const contracts = response?.data || []

  return (
    <div className="container mx-auto p-8 max-w-5xl space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Manajemen Kontrak</h1>
          <p className="text-slate-500 font-medium">Tinjau dan tanda tangani MoU kerjasama Anda dengan Mitra.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : contracts.length > 0 ? (
        <div className="grid gap-6">
          {contracts.map((contract) => (
            <Card key={contract.id} className="border-slate-200/60 shadow-xl shadow-slate-200/10 rounded-[2rem] overflow-hidden group hover:border-primary/30 transition-all">
              <CardContent className="p-0 flex flex-col md:flex-row items-stretch">
                {/* Status Indicator Sidebar */}
                <div className={`w-2 shrink-0 ${
                  contract.contractStatus === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                
                <div className="p-8 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Building2Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-900">{contract.mitraName}</h3>
                        <Badge variant="outline" className="text-[10px] uppercase font-black px-2 py-0.5 rounded-lg border-slate-200 text-slate-500">
                          {contract.type === 'mitra' ? 'Mitra Tetap' : 'Event Only'}
                        </Badge>
                        {contract.contractStatus === 'active' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-black text-[10px] uppercase h-5 gap-1">
                            <ShieldCheckIcon className="w-3 h-3" /> Active
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-black text-[10px] uppercase h-5 gap-1">
                            <ClockIcon className="w-3 h-3" /> Waiting Signature
                          </Badge>
                        )}
                      </div>
                      {contract.eventName && (
                        <p className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                          Event: {contract.eventName}
                        </p>
                      )}
                      <p className="text-xs font-bold text-slate-400">
                        Diterima pada {contract.createdAt ? format(new Date(contract.createdAt), "d MMMM yyyy", { locale: localeId }) : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link href={`/dashboard/contracts/${contract.id}?type=${contract.type}`}>
                      <Button variant={contract.contractStatus === 'active' ? "outline" : "default"} className="rounded-xl font-black px-6 gap-2">
                        {contract.contractStatus === 'active' ? 'Lihat MoU' : 'Tanda Tangani MoU'}
                        <ChevronRightIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileTextIcon className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Belum Ada Kontrak</h3>
          <p className="text-slate-500 max-w-sm mx-auto font-medium">Terima undangan dari Mitra terlebih dahulu untuk memulai kerjasama resmi.</p>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-12 p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-start gap-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
          <ShieldCheckIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-black text-indigo-900 mb-1 tracking-tight">Proteksi Kontrak Framic</h4>
          <p className="text-indigo-700/70 text-sm font-medium leading-relaxed">
            Semua kerjasama yang aktif di platform ini dilindungi oleh MoU otomatis yang menjamin hak pembayaran minimum fee, 
            asuransi alat, dan perlindungan dari pembatalan sepihak tanpa kompensasi.
          </p>
        </div>
      </div>
    </div>
  )
}
