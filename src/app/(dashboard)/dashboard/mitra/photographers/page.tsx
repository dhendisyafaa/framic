"use client"

// 1. React / Next.js
import { useState, useEffect } from "react"
import Link from "next/link"

// 2. Third-party libraries
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { toast } from "sonner"

// 3. Internal — db / lib
import { cn } from "@/lib/utils"

// 4. Internal — components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/ui/back-button"
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
  minimumFeePerEvent: number | null
}

export default function MitraPhotographersPage() {
  const [activeTab, setActiveTab] = useState<"anggota" | "undang">("anggota")

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl animate-in fade-in duration-700">
      <BackButton href="/dashboard" label="Kembali ke Dashboard" />

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
          <UsersIcon className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Anggota Fotografer</h1>
          <p className="text-muted-foreground font-medium">Kelola kontrak fotografer tetap dan undang rekan baru.</p>
        </div>
      </div>

      <div className="flex bg-muted p-1.5 rounded-2xl w-fit mb-8 border border-border/60">
        <button
          onClick={() => setActiveTab("anggota")}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === "anggota"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Daftar Anggota Tetap
        </button>
        <button
          onClick={() => setActiveTab("undang")}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "undang"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
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
      <div className="bg-muted/30 border-2 border-dashed border-border/60 rounded-3xl p-16 text-center">
        <UsersIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">Belum Ada Anggota</h3>
        <p className="text-muted-foreground font-medium max-w-md mx-auto">
          Anda belum memiliki fotografer dengan status keanggotaan tetap.
          Gunakan tab "Undang Fotografer" untuk mulai merekrut.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {list.map((pg) => (
        <Card key={pg.contractId} className="border-border/60 bg-card shadow-sm rounded-[2rem] overflow-hidden hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl uppercase shrink-0">
                  {pg.nama.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg tracking-tight mb-1 leading-none">{pg.nama}</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={cn("text-[10px] font-bold border px-2 py-0.5 rounded-full", getContractStatusColor(pg.contractStatus || pg.invitationStatus))}>
                      {pg.contractStatus ? `KONTRAK: ${pg.contractStatus.toUpperCase()}` : `INVITE: ${pg.invitationStatus.toUpperCase()}`}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="my-6 p-4 bg-muted/50 rounded-2xl border border-border/40">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Min. Fee (Take Home Pay PG)</div>
              <div className="font-bold text-foreground text-sm">
                Rp {(pg.minimumFeePerEvent ?? 0).toLocaleString("id-ID")}
              </div>
            </div>

            {pg.tanggalMulai && pg.tanggalSelesai && (
              <div className="flex items-center gap-2 mb-6 text-xs font-bold text-muted-foreground bg-muted/20 border border-border/40 p-3 rounded-xl">
                <ClockIcon className="w-4 h-4 text-muted-foreground/60" />
                <span>
                  {format(new Date(pg.tanggalMulai), "MMM yyyy")} – {format(new Date(pg.tanggalSelesai), "MMM yyyy")}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Link href={`/dashboard/contracts/${pg.contractId}?type=mitra`} className="flex-1">
                <Button className="w-full rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold shadow-none cursor-pointer">
                  <FileTextIcon className="w-4 h-4 mr-2" /> Lihat Kontrak
                </Button>
              </Link>
              {pg.contractStatus === "active" || pg.contractStatus === "pending_expiry" ? (
                <Button
                  variant="outline"
                  className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 cursor-pointer"
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
        <DialogContent className="rounded-[2rem] sm:max-w-md bg-card border border-border/60 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive">Akhiri Kontrak Mitra</DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Fotografer tidak akan bisa lagi menerima order dari event Anda.
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="font-bold text-foreground">Alasan Pemutusan Kontrak <span className="text-destructive">*</span></Label>
            <Textarea
              id="reason"
              placeholder="Jelaskan alasan pengakhiran kontrak..."
              className="mt-2 rounded-xl border-border/60 bg-background text-foreground"
              rows={4}
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTerminateContractId(null)} className="rounded-xl font-bold cursor-pointer hover:bg-muted">Batal</Button>
            <Button
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
    username: "",
    minimumFeePerEvent: 500000,
    tanggalMulai: "",
    tanggalSelesai: "",
    invitationMessage: "",
  })

  const [isSearching, setIsSearching] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  const [foundPg, setFoundPg] = useState<{ id: string; nama: string; avatarUrl: string; baseMinimumFee: number } | null>(null)



  const inviteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/mitra/me/photographers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          minimumFeePerEvent: data.minimumFeePerEvent,
          tanggalMulai: new Date(data.tanggalMulai).toISOString(),
          tanggalSelesai: new Date(data.tanggalSelesai).toISOString(),
          invitationMessage: data.invitationMessage,
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
        username: "",
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

  // Debounced search logic with 1500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchUsername(formData.username)
    }, 1500)

    return () => clearTimeout(timer)
  }, [formData.username])

  useEffect(() => {
    const fetchPg = async () => {
      if (searchUsername.length < 3) {
        setFoundPg(null)
        return
      }

      setIsSearching(true)
      try {
        const res = await fetch(`/api/photographers/search?username=${searchUsername}`)
        const json = await res.json()
        if (json.success) {
          setFoundPg(json.data)
          // Set default minimum fee from photographer's preference
          if (json.data.baseMinimumFee) {
            setFormData(s => ({ ...s, minimumFeePerEvent: json.data.baseMinimumFee }))
          }
        } else {
          setFoundPg(null)
        }
      } catch (err) {
        setFoundPg(null)
      } finally {
        setIsSearching(false)
      }
    }

    fetchPg()
  }, [searchUsername])

  const handleSearchPg = (username: string) => {
    setFormData(s => ({ ...s, username }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!foundPg) {
      toast.error("Silakan cari dan pilih fotografer yang valid terlebih dahulu")
      return
    }
    inviteMutation.mutate(formData)
  }

  return (
    <Card className="border-border/60 bg-card shadow-sm rounded-[2.5rem] overflow-hidden max-w-2xl">
      <CardHeader className="p-8 bg-muted/20 border-b border-border/45">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">Kirim Kontrak Baru</CardTitle>
        <CardDescription className="font-medium text-muted-foreground">
          Undang fotografer idaman Anda melalui username unik mereka untuk menjadi anggota tetap.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="username" className="font-bold text-foreground">Username Fotografer</Label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">@</div>
              <Input
                id="username"
                required
                placeholder="username_fotografer"
                className="pl-10 rounded-2xl h-14 font-bold text-primary border-border/60 bg-background text-foreground focus-visible:ring-primary/10 transition-all"
                value={formData.username}
                onChange={(e) => handleSearchPg(e.target.value)}
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {foundPg ? (
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl animate-in zoom-in duration-300">
                <img src={foundPg.avatarUrl} alt={foundPg.nama} className="w-12 h-12 rounded-full object-cover border-2 border-background shadow-sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{foundPg.nama}</div>
                  <div className="text-[10px] font-bold text-primary">Min Fee: Rp{foundPg.baseMinimumFee?.toLocaleString('id-ID')}</div>
                </div>
                <CheckCircle2Icon className="w-5 h-5 text-primary shrink-0" />
              </div>
            ) : formData.username.length >= 3 && !isSearching ? (
              <div className="flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-destructive animate-in fade-in duration-300">
                <XCircleIcon className="w-5 h-5 shrink-0" />
                <span className="text-xs font-bold">Fotografer tidak ditemukan</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-medium px-1">
                Masukkan username yang tertera di profil publik fotografer (tanpa @).
              </p>
            )}
          </div>



          <div className="space-y-2">
            <Label htmlFor="minFee" className="font-bold text-foreground">Minimum Fee per Event (Rp)</Label>
            <Input
              id="minFee"
              type="number"
              min={0}
              required
              className="rounded-xl border-border/60 bg-background text-foreground"
              value={formData.minimumFeePerEvent}
              onChange={(e) => setFormData(s => ({ ...s, minimumFeePerEvent: Number(e.target.value) }))}
            />
            <p className="text-xs text-muted-foreground font-medium tracking-tight">
              Biaya minimum yang dijamin untuk fotografer di setiap event Anda (proteksi MoU).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-foreground">Tanggal Mulai Kontrak</Label>
              <Input
                type="date"
                required
                className="rounded-xl border-border/60 bg-background text-foreground"
                value={formData.tanggalMulai}
                onChange={(e) => setFormData(s => ({ ...s, tanggalMulai: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-foreground">Tanggal Selesai</Label>
              <Input
                type="date"
                required
                className="rounded-xl border-border/60 bg-background text-foreground"
                min={formData.tanggalMulai}
                value={formData.tanggalSelesai}
                onChange={(e) => setFormData(s => ({ ...s, tanggalSelesai: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="font-bold text-foreground">Pesan Undangan (Opsional)</Label>
            <Textarea
              id="message"
              placeholder="Sampaikan pesan ramah kepada fotografer..."
              className="rounded-xl border-border/60 bg-background text-foreground"
              rows={3}
              value={formData.invitationMessage}
              onChange={(e) => setFormData(s => ({ ...s, invitationMessage: e.target.value }))}
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            disabled={inviteMutation.isPending}
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
    case "active":
      return "text-primary border-primary/20 bg-primary/5"
    case "pending_expiry":
      return "text-accent border-accent/20 bg-accent/5"
    case "terminated":
      return "text-destructive border-destructive/20 bg-destructive/5"
    case "expired":
      return "text-muted-foreground border-border bg-muted/20"
    default:
      return "text-accent border-accent/20 bg-accent/5" // for pending invitation
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
