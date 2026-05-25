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
      <div className="relative w-full max-w-xl">
        <Card className="border-muted bg-card shadow-sm rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-destructive/5 text-destructive rounded-full flex items-center justify-center border border-destructive/10">
              <ShieldAlert size={32} />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-medium tracking-[-0.02em] text-foreground">Akun Anda Ditangguhkan</CardTitle>
              <CardDescription className="text-muted-foreground text-sm font-medium">Status: <span className="text-destructive font-bold uppercase tracking-wider">Suspended</span></CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-6">
            <div className="bg-background border border-muted rounded-[24px] p-6 space-y-4">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                <AlertTriangle className="text-accent w-4 h-4" /> Informasi Penting:
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Sistem kami mendeteksi adanya aktivitas yang melanggar Syarat & Ketentuan Framic. Selama masa penangguhan (suspend):
              </p>
              <ul className="grid gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <li className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full" /> Profil Anda tidak akan muncul di publik
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full" /> Anda tidak dapat menerima order baru
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full" /> Pembayaran yang tertunda akan ditahan sementara
                </li>
              </ul>
            </div>

            <div className="flex flex-col items-center gap-1.5 text-center py-2">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Butuh bantuan atau ingin mengajukan banding?</p>
              <p className="text-foreground font-bold text-base">support@framic.id</p>
            </div>
          </CardContent>

          <CardFooter className="px-8 pb-8 pt-0 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="flex-1 h-11 rounded-full font-bold border-muted gap-2 text-xs hover:bg-muted/40"
            >
              <Home size={16} /> Beranda
            </Button>
            <Button
              className="flex-1 h-11 rounded-full font-bold bg-[#141413] hover:bg-[#141413]/90 text-white gap-2 shadow-sm text-xs"
              onClick={() => window.location.href = "mailto:support@framic.id"}
            >
              <Mail size={16} /> Hubungi Admin
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
