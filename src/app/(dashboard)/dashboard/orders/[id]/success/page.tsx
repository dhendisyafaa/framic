"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { CheckCircle2, ArrowRight, Home, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentSuccessPage() {
  const params = useParams()
  const id = params?.id as string

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-700">
        <div className="bg-card rounded-[3rem] shadow-2xl shadow-accent/5 p-10 text-center space-y-8 border border-border/60">
          {/* Animated Success Icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-accent/10 rounded-3xl rotate-12 animate-pulse" />
            <div className="absolute inset-0 bg-accent rounded-3xl flex items-center justify-center shadow-xl shadow-accent/20">
              <CheckCircle2 className="w-12 h-12 text-white animate-in zoom-in spin-in-12 duration-1000" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-foreground tracking-tighter">Pembayaran Berhasil!</h1>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Terima kasih! Pembayaran Anda telah kami terima dan status order Anda akan segera diperbarui secara otomatis.
            </p>
          </div>

          <div className="grid gap-3 pt-4">
            {id && (
              <Link href={`/dashboard/orders/${id}`}>
                <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-2 group transition-all cursor-pointer">
                  Tinjau & Beri Review Order
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}

            <Link href="/dashboard/orders">
              <Button variant="outline" className="w-full h-14 rounded-2xl border-border/60 hover:bg-muted/40 font-bold gap-2 cursor-pointer">
                Cek Daftar Order
              </Button>
            </Link>
            
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-border/60 hover:bg-muted/40 font-bold gap-2 cursor-pointer">
                  <Home className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/photographers">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-border/60 hover:bg-muted/40 font-bold gap-2 cursor-pointer">
                  <Calendar className="w-4 h-4" />
                  Cari Lagi
                </Button>
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-border/40">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
              Sistem Pembayaran Aman oleh Xendit
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
