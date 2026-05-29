"use client"

// 1. React / Next.js
import { useState } from "react"

// 2. Third-party libraries
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import {
  BanknoteIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  InfoIcon,
  Loader2Icon,
} from "lucide-react"

// 3. Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Withdrawal {
  id: string
  jumlah: number
  bankName: string
  rekeningNumber: string
  rekeningName: string
  status: "pending" | "success" | "rejected"
  rejectedReason: string | null
  createdAt: string | Date
}

interface BalanceData {
  totalRevenue: number
  totalWithdrawn: number
  pendingPayouts: number
  availableBalance: number
}

interface WithdrawalDialogProps {
  availableBalance: number
  balanceData?: BalanceData
  withdrawals: Withdrawal[]
  clerkId: string
}

export function WithdrawalDialog({
  availableBalance,
  balanceData,
  withdrawals,
  clerkId,
}: WithdrawalDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("request")

  // Form states
  const [jumlah, setJumlah] = useState<string>("")
  const [bankName, setBankName] = useState<string>("")
  const [rekeningNumber, setRekeningNumber] = useState<string>("")
  const [rekeningName, setRekeningName] = useState<string>("")

  const queryClient = useQueryClient()

  const withdrawalMutation = useMutation({
    mutationFn: async (body: {
      jumlah: number
      bankName: string
      rekeningNumber: string
      rekeningName: string
    }) => {
      const res = await fetch("/api/photographers/me/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error || "Gagal memproses pengajuan")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Pengajuan penarikan dana berhasil dikirim")
      setJumlah("")
      setBankName("")
      setRekeningNumber("")
      setRekeningName("")
      queryClient.invalidateQueries({ queryKey: ["photographer-balance", clerkId] })
      queryClient.invalidateQueries({ queryKey: ["photographer-withdrawals", clerkId] })
      setActiveTab("history")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const cleanJumlah = parseInt(jumlah, 10)
    if (isNaN(cleanJumlah) || cleanJumlah <= 0) {
      toast.error("Jumlah penarikan harus bernilai positif")
      return
    }

    if (cleanJumlah > availableBalance) {
      toast.error("Saldo tersedia tidak mencukupi")
      return
    }

    if (!bankName.trim()) {
      toast.error("Nama bank harus diisi")
      return
    }

    if (!rekeningNumber.trim()) {
      toast.error("Nomor rekening harus diisi")
      return
    }

    if (!rekeningName.trim()) {
      toast.error("Nama pemilik rekening harus diisi")
      return
    }

    withdrawalMutation.mutate({
      jumlah: cleanJumlah,
      bankName,
      rekeningNumber,
      rekeningName,
    })
  }

  const getStatusBadge = (status: "pending" | "success" | "rejected", reason: string | null) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <ClockIcon className="w-3.5 h-3.5" />
            Pending
          </span>
        )
      case "success":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2Icon className="w-3.5 h-3.5" />
            Sukses
          </span>
        )
      case "rejected":
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-destructive/10 text-destructive dark:bg-destructive/20">
              <XCircleIcon className="w-3.5 h-3.5" />
              Ditolak
            </span>
            {reason && (
              <span className="text-[10px] text-destructive max-w-[150px] leading-tight">
                Alasan: {reason}
              </span>
            )}
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-all font-bold px-4"
        >
          Kelola Saldo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border border-border p-6 rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BanknoteIcon className="w-6 h-6 text-accent" />
            Kelola Saldo & Penarikan Dana
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Ajukan penarikan dana ke rekening Anda dan pantau status transaksi.
          </DialogDescription>
        </DialogHeader>

        {balanceData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-[16px] border border-border/50 text-xs">
            <div>
              <p className="text-muted-foreground font-medium mb-1">Total Pendapatan</p>
              <p className="font-bold text-foreground">
                Rp {balanceData.totalRevenue.toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-1">Total Ditarik</p>
              <p className="font-bold text-foreground">
                Rp {balanceData.totalWithdrawn.toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-1">Sedang Diproses</p>
              <p className="font-bold text-amber-600 dark:text-amber-400">
                Rp {balanceData.pendingPayouts.toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-1">Saldo Tersedia</p>
              <p className="font-extrabold text-emerald-600 dark:text-emerald-400">
                Rp {balanceData.availableBalance.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid grid-cols-2 rounded-full p-1 bg-muted">
            <TabsTrigger value="request" className="rounded-full font-bold">
              Ajukan Penarikan
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-full font-bold">
              Riwayat Transaksi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jumlah" className="font-semibold text-foreground">
                  Jumlah Penarikan (Rp)
                </Label>
                <Input
                  id="jumlah"
                  type="number"
                  placeholder="Contoh: 500000"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  className="rounded-[12px]"
                  max={availableBalance}
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Batas penarikan maksimal: Rp {availableBalance.toLocaleString("id-ID")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName" className="font-semibold text-foreground">
                    Bank Tujuan
                  </Label>
                  <Input
                    id="bankName"
                    placeholder="Contoh: BCA, Mandiri, BNI"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="rounded-[12px]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rekeningNumber" className="font-semibold text-foreground">
                    Nomor Rekening
                  </Label>
                  <Input
                    id="rekeningNumber"
                    placeholder="Masukkan nomor rekening"
                    value={rekeningNumber}
                    onChange={(e) => setRekeningNumber(e.target.value)}
                    className="rounded-[12px]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rekeningName" className="font-semibold text-foreground">
                  Nama Pemilik Rekening
                </Label>
                <Input
                  id="rekeningName"
                  placeholder="Nama lengkap sesuai buku tabungan"
                  value={rekeningName}
                  onChange={(e) => setRekeningName(e.target.value)}
                  className="rounded-[12px]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-[12px] border border-border/40 text-[11px] text-muted-foreground mt-4">
                <InfoIcon className="w-4 h-4 shrink-0 text-accent" />
                <span>
                  Permintaan penarikan akan diproses secara manual oleh admin dalam 1-3 hari kerja.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="rounded-full"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={
                    withdrawalMutation.isPending ||
                    availableBalance <= 0 ||
                    !jumlah ||
                    parseInt(jumlah, 10) > availableBalance
                  }
                  className="rounded-full bg-primary hover:bg-accent text-primary-foreground hover:text-accent-foreground font-bold px-6"
                >
                  {withdrawalMutation.isPending ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Kirim Pengajuan"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  Belum ada riwayat penarikan dana.
                </div>
              ) : (
                withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 bg-muted/20 border border-border/50 rounded-[16px] flex justify-between items-center text-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">
                        Rp {w.jumlah.toLocaleString("id-ID")}
                      </p>
                      <p className="text-muted-foreground text-[10px]">
                        {w.bankName} - {w.rekeningNumber} a.n. {w.rekeningName}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80">
                        {format(new Date(w.createdAt), "dd MMM yyyy, HH:mm", {
                          locale: localeId,
                        })}
                      </p>
                    </div>
                    <div>{getStatusBadge(w.status, w.rejectedReason)}</div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
