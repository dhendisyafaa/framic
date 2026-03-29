"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  UsersIcon,
  ArrowLeftIcon,
  UserPlusIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  CameraIcon,
  FileTextIcon,
  ShieldBanIcon,
} from "lucide-react"

// Types
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

export default function MitraPhotographersPage() {
  const [activeTab, setActiveTab] = useState<"anggota" | "undang">("anggota")

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl animate-in fade-in duration-700">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-sm mb-6 group">
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Dashboard
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
          <UsersIcon className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic">Anggota Fotografer</h1>
          <p className="text-slate-500 font-medium">Kelola kontrak fotografer tetap dan undang rekan baru.</p>
        </div>
      </div>

      <div className="flex bg-slate-100/50 p-1.5 rounded-2xl w-fit mb-8 border border-slate-200/50">
        <button
          onClick={() => setActiveTab("anggota")}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "anggota" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Daftar Anggota Tetap
        </button>
        <button
          onClick={() => setActiveTab("undang")}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === "undang" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <UserPlusIcon className="w-4 h-4" /> Undang Fotografer
        </button>
      </div>

      {activeTab === "anggota" ? <AnggotaTetapTab /> : <UndangFotograferTab />}
    </div>
  )
}

function AnggotaTetapTab() {
  const queryClient = useQueryClient()
  const { data: response, isLoading } = useQuery({
    queryKey: ["mitra-photographers-list"],
    queryFn: async () => {
      const res = await fetch("/api/mitra/me/photographers")
      if (!res.ok) throw new Error("Gagal memuat data anggota tetap")
      return res.json() as Promise<{ success: boolean; data: MitraPhotographerEntry[] }>
    },
  })

  const [terminateContractId, setTerminateContractId] = useState<string | null>(null)
  const [terminationReason, setTerminationReason] = useState("")

  const terminateMutation = useMutation({
    mutationFn: async ({ contractId, reason }: { contractId: string; reason: string }) => {
      const res = await fetch(`/api/mitra/photographers/${contractId}/terminate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terminationReason: reason }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json
    },
    onSuccess: () => {
      toast.success("Kontrak berhasil diakhiri")
      queryClient.invalidateQueries({ queryKey: ["mitra-photographers-list"] })
      setTerminateContractId(null)
      setTerminationReason("")
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal mengakhiri kontrak")
    },
  })

  if (isLoading) return <ListSkeleton />

  const list = response?.data || []

  if (list.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
        <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-black text-slate-900 mb-2">Belum Ada Anggota</h3>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          Anda belum memiliki fotografer dengan status keanggotaan tetap. 
          Gunakan tab "Undang Fotografer" untuk mulai merekrut.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {list.map((pg) => (
        <Card key={pg.contractId} className="border-slate-200/60 shadow-md shadow-slate-200/20 rounded-[2rem] overflow-hidden hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-xl italic uppercase shrink-0">
                  {pg.nama.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg tracking-tight mb-1 leading-none">{pg.nama}</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={`text-[10px] font-black border-2 px-2 py-0 ${getContractStatusColor(pg.contractStatus)}`}>
                      {pg.contractStatus ? `KONTRAK: ${pg.contractStatus.toUpperCase()}` : `INVITE: ${pg.invitationStatus.toUpperCase()}`}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bagi Hasil</div>
                <div className="font-black text-slate-900 text-sm">
                  {pg.photographerPercent ?? 0}% PG / {pg.mitraPercent ?? 0}% Mitra
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Min. Fee</div>
                <div className="font-black text-slate-900 text-sm">
                  Rp {(pg.minimumFeePerEvent ?? 0).toLocaleString("id-ID")}
                </div>
              </div>
            </div>

            {pg.tanggalMulai && pg.tanggalSelesai && (
              <div className="flex items-center gap-2 mb-6 text-xs font-bold text-slate-500 bg-white border border-slate-200 p-3 rounded-xl">
                <ClockIcon className="w-4 h-4 text-slate-400" />
                <span>
                  {format(new Date(pg.tanggalMulai), "MMM yyyy")} – {format(new Date(pg.tanggalSelesai), "MMM yyyy")}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Link href={`/contracts/${pg.contractId}?type=mitra`} className="flex-1">
                <Button className="w-full rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold shadow-none">
                  <FileTextIcon className="w-4 h-4 mr-2" /> Lihat Kontrak
                </Button>
              </Link>
              {pg.contractStatus === "active" || pg.contractStatus === "pending_expiry" ? (
                <Button 
                  variant="outline"
                  className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                  onClick={() => setTerminateContractId(pg.contractId)}
                >
                  <ShieldBanIcon className="w-4 h-4" />
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Dialog Konfirmasi Terminate */}
      <Dialog open={!!terminateContractId} onOpenChange={(open) => !open && setTerminateContractId(null)}>
        <DialogContent className="rounded-[2rem] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic text-rose-600">Akhiri Kontrak Mitra</DialogTitle>
            <DialogDescription className="font-medium">
              Fotografer tidak akan bisa lagi menerima order dari event Anda. 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="font-bold text-slate-700">Alasan Pemutusan Kontrak <span className="text-rose-500">*</span></Label>
            <Textarea 
              id="reason"
              placeholder="Jelaskan alasan pengakhiran kontrak..." 
              className="mt-2 rounded-xl border-slate-200"
              rows={4}
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTerminateContractId(null)} className="rounded-xl font-bold">Batal</Button>
            <Button 
              className="bg-rose-600 hover:bg-rose-700 rounded-xl font-bold" 
              disabled={!terminationReason.trim() || terminateMutation.isPending}
              onClick={() => {
                if (terminateContractId && terminationReason.trim()) {
                  terminateMutation.mutate({ contractId: terminateContractId, reason: terminationReason })
                }
              }}
            >
              {terminateMutation.isPending ? "Memproses..." : "Ya, Akhiri Kontrak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UndangFotograferTab() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    photographerId: "",
    mitraPercent: 20,
    photographerPercent: 80,
    minimumFeePerEvent: 500000,
    tanggalMulai: "",
    tanggalSelesai: "",
    invitationMessage: "",
  })

  // Validasi % 
  const isPercentError = (formData.mitraPercent + formData.photographerPercent) !== 100

  const inviteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/mitra/me/photographers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Transform the date strings to ISO for the API
        body: JSON.stringify({
          ...data,
          tanggalMulai: new Date(data.tanggalMulai).toISOString(),
          tanggalSelesai: new Date(data.tanggalSelesai).toISOString(),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal mengundang fotografer")
      return json
    },
    onSuccess: () => {
      toast.success("Undangan berhasil dikirim!")
      queryClient.invalidateQueries({ queryKey: ["mitra-photographers-list"] })
      setFormData({
        photographerId: "",
        mitraPercent: 20,
        photographerPercent: 80,
        minimumFeePerEvent: 500000,
        tanggalMulai: "",
        tanggalSelesai: "",
        invitationMessage: "",
      })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isPercentError) return
    inviteMutation.mutate(formData)
  }

  return (
    <Card className="border-slate-200/60 shadow-xl shadow-slate-200/20 rounded-[2.5rem] overflow-hidden max-w-2xl">
      <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
        <CardTitle className="text-xl font-black italic tracking-tight">Kirim Kontrak Baru ✍️</CardTitle>
        <CardDescription className="font-medium">
          Undang fotografer idaman Anda untuk menjadi anggota tetap. Masukkan ID dan tentukan terms MoU.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pgId" className="font-bold">Fotografer ID</Label>
            <Input 
              id="pgId" 
              required 
              placeholder="Contoh: uuid-fotografer-tersebut..." 
              className="rounded-xl"
              value={formData.photographerId}
              onChange={(e) => setFormData(s => ({ ...s, photographerId: e.target.value }))}
            />
            <p className="text-xs text-slate-500 font-medium">Bisa didapatkan dari profil publik fotografer.</p>
          </div>

          <div className="grid grid-cols-2 gap-6 p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
            <div className="space-y-2">
              <Label className="font-bold text-indigo-900">Komisi Mitra (%)</Label>
              <Input 
                type="number" 
                min={0} max={100} 
                required 
                className="rounded-xl border-indigo-200 bg-white"
                value={formData.mitraPercent}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setFormData(s => ({ ...s, mitraPercent: val, photographerPercent: 100 - val }))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-indigo-900">Komisi Fotografer (%)</Label>
              <Input 
                type="number" 
                min={0} max={100} 
                required 
                className="rounded-xl border-indigo-200 bg-white"
                value={formData.photographerPercent}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setFormData(s => ({ ...s, photographerPercent: val, mitraPercent: 100 - val }))
                }}
              />
            </div>
            {isPercentError && <p className="col-span-2 text-xs font-bold text-rose-500 text-center">Total persentase harus 100%.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="minFee" className="font-bold">Minimum Fee per Event (Rp)</Label>
            <Input 
              id="minFee" 
              type="number" 
              min={0}
              required 
              className="rounded-xl"
              value={formData.minimumFeePerEvent}
              onChange={(e) => setFormData(s => ({ ...s, minimumFeePerEvent: Number(e.target.value) }))}
            />
            <p className="text-xs text-slate-500 font-medium tracking-tight">
              Biaya minimum yang dijamin untuk fotografer di setiap event Anda (proteksi MoU).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold">Tanggal Mulai Kontrak</Label>
              <Input 
                type="date" 
                required 
                className="rounded-xl"
                value={formData.tanggalMulai}
                onChange={(e) => setFormData(s => ({ ...s, tanggalMulai: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Tanggal Selesai</Label>
              <Input 
                type="date" 
                required 
                className="rounded-xl"
                min={formData.tanggalMulai}
                value={formData.tanggalSelesai}
                onChange={(e) => setFormData(s => ({ ...s, tanggalSelesai: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="font-bold">Pesan Undangan (Opsional)</Label>
            <Textarea 
              id="message" 
              placeholder="Sampaikan pesan ramah kepada fotografer..." 
              className="rounded-xl border-slate-200"
              rows={3}
              value={formData.invitationMessage}
              onChange={(e) => setFormData(s => ({ ...s, invitationMessage: e.target.value }))}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold py-6 text-base"
            disabled={isPercentError || inviteMutation.isPending}
          >
            {inviteMutation.isPending ? "Mengirim Undangan..." : "Kirim Undangan MoU"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function getContractStatusColor(status: string | null) {
  switch (status) {
    case "active": return "text-emerald-600 border-emerald-200 bg-emerald-50"
    case "pending_expiry": return "text-amber-600 border-amber-200 bg-amber-50"
    case "terminated": return "text-rose-600 border-rose-200 bg-rose-50"
    case "expired": return "text-slate-500 border-slate-200 bg-slate-50"
    default: return "text-indigo-600 border-indigo-200 bg-indigo-50" // for pending invitation
  }
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-64 rounded-[2rem]" />
      ))}
    </div>
  )
}
