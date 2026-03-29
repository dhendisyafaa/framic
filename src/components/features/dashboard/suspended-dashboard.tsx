"use client"

import { AlertTriangle, Home, Mail, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface SuspendedDashboardProps {
  reason?: string
  clerkId: string
}

export function SuspendedDashboard({ reason, clerkId }: SuspendedDashboardProps) {
  const router = useRouter()

  return (
    <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[70vh]">
      <div className="relative w-full max-w-2xl">
        {/* Background Decorative */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-rose-500/5 blur-[120px] rounded-full -z-10" />

        <Card className="border-rose-200 shadow-2xl shadow-rose-100 overflow-hidden rounded-[3rem] border-2">
          <CardHeader className="bg-rose-50/50 p-10 text-center flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-rose-200">
              <ShieldAlert size={48} strokeWidth={2.5} />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black tracking-tight text-slate-900">Akun Anda Dibekukan</CardTitle>
              <CardDescription className="text-slate-500 font-medium text-lg">Status: <span className="text-rose-600 font-black italic uppercase tracking-widest">Suspended</span></CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-10 space-y-8">
            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 space-y-4">
              <h4 className="font-black text-slate-900 flex items-center gap-2 italic">
                <AlertTriangle className="text-amber-500 w-5 h-5" /> Informasi Penting:
              </h4>
              <p className="text-slate-600 leading-relaxed font-medium">
                Sistem kami mendeteksi adanya aktivitas yang melanggar Syarat & Ketentuan Framic. Selama masa penangguhan (suspend):
              </p>
              <ul className="grid gap-3 text-sm font-bold text-slate-500 uppercase tracking-tight italic">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Profil Anda tidak akan muncul di publik
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Anda tidak dapat menerima order baru
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Pembayaran yang tertunda akan ditahan sementara
                </li>
              </ul>
            </div>

            <div className="flex flex-col items-center gap-2 text-center py-4">
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Butuh bantuan atau ingin mengajukan banding?</p>
               <p className="text-slate-900 font-black text-lg">support@framic.id</p>
            </div>
          </CardContent>

          <CardFooter className="p-10 pt-0 flex flex-col md:flex-row gap-4">
            <Button 
              onClick={() => router.push("/")} 
              variant="outline"
              className="flex-1 h-14 rounded-2xl font-black border-slate-200 gap-2"
            >
              <Home size={18} /> Beranda
            </Button>
            <Button 
              className="flex-1 h-14 rounded-2xl font-black bg-slate-900 hover:bg-slate-800 gap-2 shadow-xl shadow-slate-200"
              onClick={() => window.location.href = "mailto:support@framic.id"}
            >
              <Mail size={18} /> Hubungi Admin
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
