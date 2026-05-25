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
          <h1 className="text-3xl font-black tracking-tight text-foreground">Manajemen Kontrak</h1>
          <p className="text-muted-foreground font-medium">Tinjau dan tanda tangani MoU kerjasama Anda dengan Mitra.</p>
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
            <Card key={contract.id} className="border-border/60 shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden group hover:border-primary/30 transition-all bg-card">
              <CardContent className="p-0 flex flex-col md:flex-row items-stretch">
                {/* Status Indicator Sidebar */}
                <div className={`w-full h-2 md:w-2 md:h-auto shrink-0 ${
                  contract.contractStatus === 'active' ? 'bg-blue-500' : 'bg-amber-500'
                }`} />
                
                <div className="p-5 sm:p-8 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Building2Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div className="flex-1 space-y-2 sm:space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-black text-foreground">{contract.mitraName}</h3>
                        <Badge variant="outline" className="text-[10px] uppercase font-black px-2 py-0.5 rounded-lg border-border text-muted-foreground">
                          {contract.type === 'mitra' ? 'Mitra Tetap' : 'Event Only'}
                        </Badge>
                        {contract.contractStatus === 'active' ? (
                          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 font-black text-[10px] uppercase h-5 gap-1 border border-blue-500/20">
                            <ShieldCheckIcon className="w-3 h-3" /> Active
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 font-black text-[10px] uppercase h-5 gap-1 border border-amber-500/20">
                            <ClockIcon className="w-3 h-3" /> Waiting
                          </Badge>
                        )}
                      </div>
                      {contract.eventName && (
                        <p className="text-sm font-bold text-primary flex items-center gap-1">
                          Event: {contract.eventName}
                        </p>
                      )}
                      <p className="text-xs font-bold text-muted-foreground">
                        Diterima pada {contract.createdAt ? format(new Date(contract.createdAt), "d MMMM yyyy", { locale: localeId }) : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 md:mt-0">
                    <Link href={`/dashboard/contracts/${contract.id}?type=${contract.type}`} className="w-full md:w-auto">
                      <Button variant={contract.contractStatus === 'active' ? "outline" : "default"} className="w-full md:w-auto rounded-xl font-black px-6 gap-2 cursor-pointer">
                        {contract.contractStatus === 'active' ? 'Lihat MoU' : 'Tanda Tangani'}
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
        <div className="bg-muted/40 border-2 border-dashed border-border rounded-[2rem] p-16 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <FileTextIcon className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-black text-foreground mb-2 tracking-tight">Belum Ada Kontrak</h3>
          <p className="text-muted-foreground max-w-sm mx-auto font-medium">Terima undangan dari Mitra terlebih dahulu untuk memulai kerjasama resmi.</p>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-12 p-8 rounded-[2rem] bg-primary/5 border border-primary/15 flex items-start gap-4">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shrink-0 shadow-lg shadow-primary/20">
          <ShieldCheckIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-black text-foreground mb-1 tracking-tight">Proteksi Kontrak Framic</h4>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed">
            Semua kerjasama yang aktif di platform ini dilindungi oleh MoU otomatis yang menjamin hak pembayaran minimum fee, 
            asuransi alat, dan perlindungan dari pembatalan sepihak tanpa kompensasi.
          </p>
        </div>
      </div>
    </div>
  )
}
