"use client"

import { useEffect, useState } from "react"
import { Clock, ArrowRight, XCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

export default function PendingVerificationPage() {
  const router = useRouter()

  // 1. Check status
  const { data: response, isLoading } = useQuery({
    queryKey: ["current-user-status"],
    queryFn: async () => {
      const res = await fetch("/api/users/me")
      if (!res.ok) throw new Error("Gagal mengambil data status")
      return res.json()
    },
  })

  const userData = response?.data
  const pgStatus = userData?.photographerProfile?.verificationStatus
  const mitraStatus = userData?.mitraProfile?.verificationStatus
  const isActive = userData?.isActive !== false // Default true

  // 2. Automatic redirect if verified or suspended
  useEffect(() => {
    // Jika verified atau suspended, lempar ke dashboard
    if (pgStatus === "verified" || mitraStatus === "verified" || pgStatus === "suspended" || mitraStatus === "suspended" || !isActive) {
      if (pgStatus === "verified" || mitraStatus === "verified") {
        toast.success("Selamat! Akun Anda telah diverifikasi.")
      }
      router.push("/dashboard")
    }
  }, [pgStatus, mitraStatus, isActive, router])

  // --- RENDERING STATES ---

  // REJECTED STATE
  if (pgStatus === "rejected" || mitraStatus === "rejected") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 animate-in fade-in duration-500">
        <Card className="w-full max-w-md text-center shadow-lg border-muted rounded-[32px] overflow-hidden bg-card">
          <CardHeader className="flex flex-col items-center bg-muted/20 pb-8 pt-10">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/5 text-destructive border border-destructive/20 shadow-sm">
              <XCircle size={30} />
            </div>
            <CardTitle className="text-2xl font-medium tracking-tight text-foreground">Pengajuan Ditolak</CardTitle>
            <CardDescription className="pt-2 text-muted-foreground font-medium text-xs">
              Mohon maaf, pengajuan verifikasi Anda belum dapat kami setujui saat ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-4 px-8">
            <div className="bg-background rounded-[20px] p-4 border border-muted text-left mb-6">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <AlertCircle size={14} className="text-accent" /> Alasan Penolakan:
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Data dokumen tidak terbaca atau portfolio belum memenuhi standar kualitas platform kami.
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
              Anda dapat mencoba mengajukan kembali dengan memperbaiki data atau portfolio Anda melalui halaman onboarding.
            </p>
          </CardContent>
          <CardFooter className="p-8 pt-4 flex flex-col gap-3">
            <Button onClick={() => router.push("/onboarding")} className="w-full h-12 rounded-full font-bold text-sm bg-primary hover:bg-primary/95 text-primary-foreground shadow-md">
              Ajukan Ulang <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => router.push("/")} className="w-full text-muted-foreground font-bold text-xs hover:bg-muted/40 rounded-full h-11">
              Kembali ke Beranda
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // PENDING STATE (DEFAULT)
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
 
      <Card className="w-full max-w-lg text-center shadow-lg border-muted bg-card rounded-[32px] overflow-hidden animate-in zoom-in duration-700">
        <CardHeader className="flex flex-col items-center pb-2 pt-12">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl animate-pulse" />
            <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#141413] text-white shadow-md border border-muted">
              <Clock size={36} className="animate-[spin_6s_linear_infinite]" />
            </div>
          </div>
          <CardTitle className="text-3xl font-medium tracking-tight text-foreground leading-tight">Sedang Ditinjau...</CardTitle>
          <CardDescription className="pt-3 text-sm text-muted-foreground max-w-sm px-4">
            Pengajuan Anda sebagai <span className="text-primary font-bold">{pgStatus ? 'Fotografer' : 'Mitra'}</span> sedang dalam antrean verifikasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 px-10">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 text-left">
              <StatusStep label="Penerimaan Data" completed={true} />
              <StatusStep label="Review Dokumen & Portfolio" completed={false} active={true} />
              <StatusStep label="Persetujuan Akun" completed={false} />
            </div>
            <Button variant="ghost" onClick={() => router.push("/")} className="w-full text-muted-foreground font-bold h-11 text-xs hover:bg-muted/40 rounded-full">
              Kembali ke Beranda
            </Button>
          </div>
        </CardContent>
        <CardFooter className="p-5 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground leading-relaxed italic max-w-xs mx-auto">
            "Kami berkomitmen menjaga kualitas talent di Framic. Proses ini biasanya memakan waktu 1-2 hari kerja."
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

function StatusStep({ label, completed, active }: { label: string, completed: boolean, active?: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-[16px] transition-all border ${active ? 'bg-primary/5 border-muted/80 scale-102' : 'border-transparent'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${completed ? 'bg-accent text-white' : active ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-muted text-muted-foreground'
        }`}>
        {completed ? <CheckCircle2 size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
      </div>
      <span className={`text-xs font-bold tracking-tight ${completed ? 'text-foreground' : active ? 'text-primary' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  )
}


