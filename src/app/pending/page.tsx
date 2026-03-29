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
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 1. Check status regularly
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["current-user-status"],
    queryFn: async () => {
      const res = await fetch("/api/users/me")
      if (!res.ok) throw new Error("Gagal mengambil data status")
      return res.json()
    },
    refetchInterval: 10000, // Poll every 10 seconds while on this page
  })

  const userData = response?.data
  const pgStatus = userData?.photographerProfile?.verificationStatus
  const mitraStatus = userData?.mitraProfile?.verificationStatus
  const isActive = userData?.isActive !== false // Default true

  // 2. Automatic redirect if verified or suspended
  useEffect(() => {
    // Jika verified atau suspended, lempar ke dashboard
    // Dashboard akan menghandle tampilan suspended secara mendalam
    if (pgStatus === "verified" || mitraStatus === "verified" || pgStatus === "suspended" || mitraStatus === "suspended" || !isActive) {
      if (pgStatus === "verified" || mitraStatus === "verified") {
        toast.success("Selamat! Akun Anda telah diverifikasi.")
      }
      router.push("/dashboard")
    }
  }, [pgStatus, mitraStatus, isActive, router])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
    toast.info("Status diperbarui")
  }

  // --- RENDERING STATES ---

  // REJECTED STATE
  if (pgStatus === "rejected" || mitraStatus === "rejected") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 animate-in fade-in duration-500">
        <Card className="w-full max-w-md text-center shadow-2xl border-rose-100 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-col items-center bg-rose-50/50 pb-8 pt-10">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-100 text-rose-600 shadow-lg shadow-rose-200/50">
              <XCircle size={40} />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Pengajuan Ditolak</CardTitle>
            <CardDescription className="pt-2 text-slate-500 font-medium">
              Mohon maaf, pengajuan verifikasi Anda belum dapat kami setujui saat ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-4 px-8">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left mb-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <AlertCircle size={14} /> Alasan Penolakan:
              </h4>
              <p className="text-sm text-slate-600 font-medium italic">
                Data dokumen tidak terbaca atau portfolio belum memenuhi standar kualitas platform kami.
              </p>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Anda dapat mencoba mengajukan kembali dengan memperbaiki data atau portfolio Anda melalui halaman onboarding.
            </p>
          </CardContent>
          <CardFooter className="p-8 pt-4 flex flex-col gap-3">
             <Button onClick={() => router.push("/onboarding")} className="w-full h-14 rounded-2xl font-black text-lg bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-200">
                Ajukan Ulang <ArrowRight className="ml-2 h-5 h-5" />
             </Button>
             <Button variant="ghost" onClick={() => router.push("/")} className="w-full text-slate-400 font-bold">
                Kembali ke Beranda
             </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // PENDING STATE (DEFAULT)
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <Card className="w-full max-w-lg text-center shadow-2xl border-white/40 bg-white/80 backdrop-blur-xl rounded-[3rem] overflow-hidden animate-in zoom-in duration-700">
        <CardHeader className="flex flex-col items-center pb-2 pt-12">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-[2rem] bg-amber-500 text-white shadow-xl shadow-amber-200">
              <Clock size={48} className="animate-[spin_4s_linear_infinite]" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Sedang Ditinjau...</CardTitle>
          <CardDescription className="pt-3 text-lg text-slate-500 font-medium max-w-sm px-4">
            Aplikasi Anda sebagai <span className="text-primary font-bold italic">{pgStatus ? 'Fotografer' : 'Mitra'}</span> sedang dalam antrean verifikasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-10 px-10">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 text-left">
               <StatusStep label="Penerimaan Data" completed={true} />
               <StatusStep label="Review Dokumen & Portfolio" completed={false} active={true} />
               <StatusStep label="Persetujuan Akun" completed={false} />
            </div>

            <p className="text-sm text-slate-400 leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
              "Kami berkomitmen menjaga kualitas talent di Framic. Proses ini biasanya memakan waktu 1-2 hari kerja."
            </p>
          </div>
        </CardContent>
        <CardFooter className="p-10 pt-0 flex flex-col gap-3">
          <Button 
            onClick={handleManualRefresh} 
            disabled={isRefreshing || isLoading}
            className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
          >
            {isRefreshing ? <Loader2Icon className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 w-5 h-5" />}
            Cek Status Sekarang
          </Button>
          <Button variant="ghost" onClick={() => router.push("/")} className="w-full text-slate-400 font-bold h-12">
            Kembali ke Beranda
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function StatusStep({ label, completed, active }: { label: string, completed: boolean, active?: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${active ? 'bg-primary/5 border border-primary/10 scale-105' : ''}`}>
       <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
         completed ? 'bg-emerald-500 text-white' : active ? 'bg-primary text-white animate-pulse' : 'bg-slate-100 text-slate-300'
       }`}>
          {completed ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current" />}
       </div>
       <span className={`text-sm font-black tracking-tight ${completed ? 'text-slate-900' : active ? 'text-primary' : 'text-slate-400'}`}>
          {label}
       </span>
    </div>
  )
}

function Loader2Icon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  )
}
